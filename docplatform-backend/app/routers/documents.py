"""Module 1 (Document Generation) + Module 2 (Buyer Documents) endpoints."""
import asyncio
import io
import uuid
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import (
    Template, GeneratedDocument, GeneratedDocumentVersion, DocumentType,
    Company, Product, DocumentSchema, Buyer
)
from app.schemas import (
    DocumentSchemaOut, GenerateRequest, ReviseRequest,
    GeneratedDocumentOut, DocumentSearchResult, DocumentVersionOut,
    BuyerProfileOut, BuyerOut, BuyerProfileStats, BuyerCompanyGroup,
    BuyerProductGroup, BuyerDocumentItem
)
from app.utils import services as svc
from app.utils.pdf import compile_pdf

router = APIRouter(prefix="/documents", tags=["documents"])


# --- Step 2: Schema load ---
@router.get("/schema", response_model=DocumentSchemaOut)
async def get_schema(
    company_id: uuid.UUID = Query(...),
    product_id: uuid.UUID = Query(...),
    document_type_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    tpl = await svc.resolve_template(db, company_id, product_id, document_type_id)
    return await svc.active_schema(db, tpl.id)


# --- Step 4: Generation & storage (Version 1) ---
@router.post("/generate", response_model=GeneratedDocumentOut)
async def generate_document(payload: GenerateRequest, db: AsyncSession = Depends(get_db)):
    tpl = await svc.resolve_template(
        db, payload.company_id, payload.product_id, payload.document_type_id
    )
    tv = await svc.active_template_version(db, tpl.id)
    schema = await svc.active_schema(db, tpl.id)
    svc.validate_form_values(schema, payload.form_values)

    buyer = await svc.resolve_or_create_buyer(
        db,
        buyer_name=payload.buyer_name,
        company_name=payload.company_name,
        country=payload.country,
        phone=payload.phone,
        email=payload.email,
        product_id=payload.product_id,
        form_values=payload.form_values,
    )
    doc_type = await db.get(DocumentType, payload.document_type_id)
    number = await svc.next_document_number(db, doc_type.code)

    doc = GeneratedDocument(
        document_number=number, template_id=tpl.id, buyer_id=buyer.id,
    )
    db.add(doc)
    await db.flush()

    version = GeneratedDocumentVersion(
        document_id=doc.id, version=1, template_version_id=tv.id,
        schema_id=schema.id, form_values=payload.form_values,
        created_by=payload.created_by,
    )
    db.add(version)
    await svc.audit(db, "GeneratedDocument", doc.id, "create", payload.created_by)
    await db.commit()

    return await _document_out(db, doc.id)


# --- Module 2 Step 1-2: Search & grid ---
@router.get("/search", response_model=DocumentSearchResult)
async def search_documents(
    company_id: uuid.UUID | None = Query(None),
    product_id: uuid.UUID | None = Query(None),
    document_type_id: uuid.UUID | None = Query(None),
    buyer_id: int | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(GeneratedDocument)
        .join(Template, Template.id == GeneratedDocument.template_id)
        .options(
            selectinload(GeneratedDocument.template).selectinload(Template.company),
            selectinload(GeneratedDocument.template).selectinload(Template.product),
            selectinload(GeneratedDocument.template).selectinload(Template.document_type),
            selectinload(GeneratedDocument.buyer),
            selectinload(GeneratedDocument.versions),
        )
    )
    if company_id:
        stmt = stmt.where(Template.company_id == company_id)
    if product_id:
        stmt = stmt.where(Template.product_id == product_id)
    if document_type_id:
        stmt = stmt.where(Template.document_type_id == document_type_id)
    if buyer_id:
        stmt = stmt.where(GeneratedDocument.buyer_id == buyer_id)

    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.scalars(stmt.order_by(GeneratedDocument.created_at.desc())
                             .limit(limit).offset(offset))).all()

    items = [
        GeneratedDocumentOut(
            id=d.id, document_number=d.document_number, buyer_id=d.buyer_id,
            company=d.template.company.name, product=d.template.product.name,
            document_type=d.template.document_type.name,
            latest_version=max((v.version for v in d.versions), default=1),
            created_at=d.created_at,
        )
        for d in rows
    ]
    return DocumentSearchResult(items=items, total=total or 0)


# --- Module 2 Step 4: load latest version JSON for editing ---
@router.get("/{document_id}/latest", response_model=DocumentVersionOut)
async def get_latest_version(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await _latest_version(db, document_id)

@router.get("/{document_id}/schema", response_model=DocumentSchemaOut)
async def get_document_schema(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    doc = await db.get(GeneratedDocument, document_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    return await svc.active_schema(db, doc.template_id)

@router.get("/{document_id}", response_model=GeneratedDocumentOut)
async def get_document(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await _document_out(db, document_id)


# --- Module 2 Step 5: Save revision (append, never overwrite) ---
@router.post("/revise", response_model=GeneratedDocumentOut)
async def revise_document(payload: ReviseRequest, db: AsyncSession = Depends(get_db)):
    doc = await db.get(GeneratedDocument, payload.document_id)
    if not doc:
        raise HTTPException(404, "Document not found.")
    tv = await svc.active_template_version(db, doc.template_id)
    schema = await svc.active_schema(db, doc.template_id)
    svc.validate_form_values(schema, payload.form_values)

    latest = await db.scalar(
        select(func.max(GeneratedDocumentVersion.version))
        .where(GeneratedDocumentVersion.document_id == doc.id)
    )
    new_version = GeneratedDocumentVersion(
        document_id=doc.id, version=(latest or 0) + 1, template_version_id=tv.id,
        schema_id=schema.id, form_values=payload.form_values, created_by=payload.created_by,
    )
    db.add(new_version)
    await svc.audit(db, "GeneratedDocument", doc.id, "revise", payload.created_by,
                    {"version": new_version.version})
    await db.commit()
    return await _document_out(db, doc.id)


# --- Module 2 Step 6: Version history ---
@router.get("/{document_id}/versions", response_model=list[DocumentVersionOut])
async def version_history(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    rows = await db.scalars(
        select(GeneratedDocumentVersion)
        .where(GeneratedDocumentVersion.document_id == document_id)
        .order_by(GeneratedDocumentVersion.version.desc())
    )
    return rows.all()


# --- Step 5/6 & Module 2 Step 3: View / Download PDF on-the-fly ---
@router.get("/{document_id}/pdf")
async def stream_pdf(
    document_id: uuid.UUID,
    version: int | None = Query(None, description="Defaults to latest"),
    download: bool = Query(False),
    language: str = Query("en"),
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(GeneratedDocument, document_id)
    if not doc:
        raise HTTPException(404, "Document not found.")

    q = select(GeneratedDocumentVersion).options(
        selectinload(GeneratedDocumentVersion.template_version)
    ).where(GeneratedDocumentVersion.document_id == document_id)
    if version is not None:
        q = q.where(GeneratedDocumentVersion.version == version)
    else:
        q = q.order_by(GeneratedDocumentVersion.version.desc())
    dv = await db.scalar(q)
    if not dv:
        raise HTTPException(404, "Version not found.")

    # Merge static template branding (seller/bank/logos) with per-contract form values.
    tpl = await db.get(Template, doc.template_id)
    company = await db.get(Company, tpl.company_id)
    product = await db.get(Product, tpl.product_id)
    context = {
        **(company.branding or {}),
        "product_name": product.name,
        "unit": product.unit,
        **dv.form_values,  # form values win for any overlapping keys
    }
    
    # Backwards compatibility for legacy templates
    if "seller_bank_name" in context and "seller_bank" not in context:
        context["seller_bank"] = context["seller_bank_name"]
    if "seller_swift" in context and "seller_bank_swift" not in context:
        context["seller_bank_swift"] = context["seller_swift"]
    class SafeDict(dict):
        def __missing__(self, key):
            return '{' + key + '}'

    safe_context = SafeDict(context)

    if language == "zh":
        from app.utils.translator import translate_context
        from app.utils.labels import LABELS_ZH
        context = translate_context(context)
        context["_lang"] = "zh"
        context["labels"] = {k: v.format_map(safe_context) if isinstance(v, str) else v for k, v in LABELS_ZH.items()}
    else:
        from app.utils.labels import LABELS_EN
        context["_lang"] = "en"
        context["labels"] = {k: v.format_map(safe_context) if isinstance(v, str) else v for k, v in LABELS_EN.items()}

    pdf_bytes = await asyncio.to_thread(compile_pdf, dv.template_version.latex_source, context)
    await svc.audit(db, "GeneratedDocument", doc.id, "download" if download else "view")
    await db.commit()

    disposition = "attachment" if download else "inline"
    filename = f"{doc.document_number}_v{dv.version}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes), media_type="application/pdf",
        headers={"Content-Disposition": f'{disposition}; filename="{filename}"'},
    )
# --- Buyer Profile ---
@router.get("/buyer/{buyer_id}/profile", response_model=BuyerProfileOut)
async def get_buyer_profile(buyer_id: int, db: AsyncSession = Depends(get_db)):
    buyer = await db.get(Buyer, buyer_id)
    if not buyer:
        raise HTTPException(404, "Buyer not found.")

    stmt = (
        select(GeneratedDocument)
        .options(
            selectinload(GeneratedDocument.template).selectinload(Template.company),
            selectinload(GeneratedDocument.template).selectinload(Template.product),
            selectinload(GeneratedDocument.template).selectinload(Template.document_type),
            selectinload(GeneratedDocument.versions),
        )
        .where(GeneratedDocument.buyer_id == buyer_id)
    )
    docs = (await db.scalars(stmt)).all()

    company_map = {}
    unique_products = set()

    for doc in docs:
        c = doc.template.company
        p = doc.template.product
        
        if c.id not in company_map:
            company_map[c.id] = {
                "name": c.name,
                "code": c.code,
                "products": {}
            }
        
        if p.id not in company_map[c.id]["products"]:
            company_map[c.id]["products"][p.id] = {
                "name": p.name,
                "code": p.code,
                "documents": []
            }
            unique_products.add(p.id)
            
        company_map[c.id]["products"][p.id]["documents"].append({
            "id": doc.id,
            "document_number": doc.document_number,
            "document_type": doc.template.document_type.name,
            "latest_version": max((v.version for v in doc.versions), default=1),
            "created_at": doc.created_at
        })

    # Build the final structured response with sorting
    companies_out = []
    
    # Sort companies alphabetically by name
    sorted_companies = sorted(company_map.values(), key=lambda x: x["name"])
    
    for c_data in sorted_companies:
        products_out = []
        # Sort products alphabetically by name
        sorted_products = sorted(c_data["products"].values(), key=lambda x: x["name"])
        
        for p_data in sorted_products:
            # Sort documents newest first (descending by created_at)
            sorted_docs = sorted(p_data["documents"], key=lambda x: x["created_at"], reverse=True)
            
            products_out.append(BuyerProductGroup(
                product_name=p_data["name"],
                product_code=p_data["code"],
                documents=[BuyerDocumentItem(**d) for d in sorted_docs]
            ))
            
        companies_out.append(BuyerCompanyGroup(
            company_name=c_data["name"],
            company_code=c_data["code"],
            products=products_out
        ))

    stats = BuyerProfileStats(
        total_companies=len(company_map),
        total_products=len(unique_products),
        total_documents=len(docs)
    )

    return BuyerProfileOut(
        buyer=BuyerOut.model_validate(buyer),
        stats=stats,
        companies=companies_out
    )


# --- helpers ---
async def _document_out(db: AsyncSession, document_id) -> GeneratedDocumentOut:
    d = await db.scalar(
        select(GeneratedDocument).options(
            selectinload(GeneratedDocument.template).selectinload(Template.company),
            selectinload(GeneratedDocument.template).selectinload(Template.product),
            selectinload(GeneratedDocument.template).selectinload(Template.document_type),
            selectinload(GeneratedDocument.versions),
        ).where(GeneratedDocument.id == document_id)
    )
    return GeneratedDocumentOut(
        id=d.id, document_number=d.document_number, buyer_id=d.buyer_id,
        company=d.template.company.name, product=d.template.product.name,
        document_type=d.template.document_type.name,
        latest_version=max((v.version for v in d.versions), default=1),
        created_at=d.created_at,
    )


async def _latest_version(db: AsyncSession, document_id) -> GeneratedDocumentVersion:
    dv = await db.scalar(
        select(GeneratedDocumentVersion)
        .where(GeneratedDocumentVersion.document_id == document_id)
        .order_by(GeneratedDocumentVersion.version.desc())
    )
    if not dv:
        raise HTTPException(404, "No versions found.")
    return dv
