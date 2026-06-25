"""Reference endpoints powering the cascading Company -> Product -> DocType selection."""
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Company, Product, DocumentType, Template, Buyer, GeneratedDocument
from app.schemas import CompanyOut, ProductOut, DocumentTypeOut, BuyerListItem

router = APIRouter(prefix="/reference", tags=["reference"])


@router.get("/buyers", response_model=list[BuyerListItem])
async def list_buyers(
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Buyer, func.count(GeneratedDocument.id).label("document_count"))
        .outerjoin(GeneratedDocument, GeneratedDocument.buyer_id == Buyer.id)
        .group_by(Buyer.id)
        .order_by(Buyer.buyer_name, Buyer.company_name, Buyer.id)
    )
    if search:
        search_term = f"%{search}%"
        stmt = stmt.where(or_(
            Buyer.buyer_name.ilike(search_term),
            Buyer.company_name.ilike(search_term),
            Buyer.email.ilike(search_term)
        ))
    
    rows = await db.execute(stmt)
    results = rows.all()
    
    return [
        BuyerListItem(
            id=r[0].id,
            display_name=r[0].display_name,
            document_count=r[1]
        )
        for r in results
    ]


@router.get("/companies", response_model=list[CompanyOut])
async def list_companies(db: AsyncSession = Depends(get_db)):
    rows = await db.scalars(select(Company).where(Company.is_active.is_(True)).order_by(Company.name))
    return rows.all()


@router.get("/products", response_model=list[ProductOut])
async def list_products(
    company_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Only products that have a template bound to the chosen company."""
    stmt = (
        select(Product).distinct()
        .join(Template, Template.product_id == Product.id)
        .where(Template.company_id == company_id, Template.is_active.is_(True))
        .order_by(Product.name)
    )
    return (await db.scalars(stmt)).all()


@router.get("/document-types", response_model=list[DocumentTypeOut])
async def list_document_types(
    company_id: uuid.UUID = Query(...),
    product_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(DocumentType).distinct()
        .join(Template, Template.document_type_id == DocumentType.id)
        .where(
            Template.company_id == company_id,
            Template.product_id == product_id,
            Template.is_active.is_(True),
        )
        .order_by(DocumentType.name)
    )
    return (await db.scalars(stmt)).all()
