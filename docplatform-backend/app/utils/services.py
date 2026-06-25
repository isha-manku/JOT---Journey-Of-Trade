"""Shared service helpers for document logic."""
import uuid
import re
from fastapi import HTTPException
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Template, TemplateVersion, DocumentSchema, Buyer, Product,
    GeneratedDocument, GeneratedDocumentVersion, AuditLog,
)
from sqlalchemy.orm.attributes import flag_modified
import json


async def resolve_template(db: AsyncSession, company_id, product_id, document_type_id) -> Template:
    stmt = select(Template).where(
        Template.company_id == company_id,
        Template.product_id == product_id,
        Template.document_type_id == document_type_id,
        Template.is_active.is_(True),
    )
    tpl = await db.scalar(stmt)
    if not tpl:
        raise HTTPException(404, "No template configured for this combination.")
    return tpl


async def active_template_version(db: AsyncSession, template_id) -> TemplateVersion:
    stmt = (
        select(TemplateVersion)
        .where(TemplateVersion.template_id == template_id, TemplateVersion.is_active.is_(True))
        .order_by(TemplateVersion.version.desc())
    )
    tv = await db.scalar(stmt)
    if not tv:
        raise HTTPException(404, "No active template version.")
    return tv


async def active_schema(db: AsyncSession, template_id) -> DocumentSchema:
    stmt = (
        select(DocumentSchema)
        .options(selectinload(DocumentSchema.fields))
        .where(DocumentSchema.template_id == template_id, DocumentSchema.is_active.is_(True))
        .order_by(DocumentSchema.version.desc())
    )
    sc = await db.scalar(stmt)
    if not sc:
        raise HTTPException(404, "No active schema.")
    return sc


async def get_buyer(db: AsyncSession, buyer_id: int) -> Buyer:
    buyer = await db.get(Buyer, buyer_id)
    if not buyer:
        raise HTTPException(404, "Buyer not found in CRM.")
    return buyer


def _extract_first_number(val) -> float:
    if not val:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    matches = re.findall(r'\d+(?:,\d+)*(?:\.\d+)?', str(val))
    if not matches:
        return 0.0
    num_str = matches[0].replace(',', '')
    try:
        return float(num_str)
    except ValueError:
        return 0.0


async def resolve_or_create_buyer(
    db: AsyncSession,
    buyer_name: str,
    company_name: str,
    country: str,
    phone: str,
    email: str | None = None,
    product_id: uuid.UUID | None = None,
    form_values: dict | None = None,
) -> Buyer:
    c_name_lower = company_name.lower() if company_name else ""
    b_name_lower = buyer_name.lower() if buyer_name else ""
    email_lower = email.lower() if email else ""

    buyer = None

    # Priority 1: Company Name + Phone
    if c_name_lower and phone:
        stmt = select(Buyer).where(
            func.lower(Buyer.company_name) == c_name_lower,
            Buyer.phone == phone
        )
        buyer = await db.scalar(stmt)

    # Priority 2: Email
    if not buyer and email_lower:
        stmt = select(Buyer).where(func.lower(Buyer.email) == email_lower)
        buyer = await db.scalar(stmt)

    # Priority 3: Buyer Name + Company Name
    if not buyer and b_name_lower and c_name_lower:
        stmt = select(Buyer).where(
            func.lower(Buyer.buyer_name) == b_name_lower,
            func.lower(Buyer.company_name) == c_name_lower
        )
        buyer = await db.scalar(stmt)

    if buyer:
        # Check if is_deleted = 1
        res = await db.execute(
            text("SELECT is_deleted FROM buyers WHERE id = :id"),
            {"id": buyer.id}
        )
        is_deleted_val = res.scalar()
        if is_deleted_val in (1, True):
            await db.execute(
                text("UPDATE buyers SET is_deleted = 0, deleted_at = NULL WHERE id = :id AND is_deleted = 1"),
                {"id": buyer.id}
            )
            print(f"[Buyer Auto-Restore] Buyer '{buyer.buyer_name}' ({buyer.company_name}) restored. ID: {buyer.id}", flush=True)

        # Safe update: Fill missing values only
        if not buyer.buyer_name and buyer_name: buyer.buyer_name = buyer_name
        if not buyer.company_name and company_name: buyer.company_name = company_name
        if not buyer.country and country: buyer.country = country
        if not buyer.phone and phone: buyer.phone = phone
        if not buyer.email and email: buyer.email = email
    else:
        # Create new
        buyer = Buyer(
            buyer_name=buyer_name,
            company_name=company_name,
            country=country,
            phone=phone,
            email=email
        )
        db.add(buyer)

    # Save associated products trade terms if provided
    if product_id and form_values:
        product_obj = await db.get(Product, product_id)
        if product_obj:
            # Load current products list
            products_list = []
            if buyer.products:
                if isinstance(buyer.products, str):
                    try:
                        products_list = json.loads(buyer.products)
                    except Exception:
                        products_list = []
                elif isinstance(buyer.products, list):
                    products_list = buyer.products
                elif isinstance(buyer.products, dict):
                    products_list = [buyer.products]

            # Extract terms
            price = form_values.get("contract_price") or form_values.get("unit_price") or form_values.get("price") or form_values.get("trial_price") or ""
            trial_qty = form_values.get("trial_quantity_mt") or form_values.get("trial_container") or form_values.get("trial_qty") or ""
            contract_qty = form_values.get("annual_contract_quantity") or form_values.get("contract_quantity") or form_values.get("quantity") or form_values.get("contract_qty") or ""
            destination_port = form_values.get("contract_destination_port") or form_values.get("destination_port") or ""
            total_contract_price = form_values.get("annual_contract_value") or form_values.get("total_contract_price") or ""

            if not total_contract_price and price and contract_qty:
                p_num = _extract_first_number(price)
                q_num = _extract_first_number(contract_qty)
                if p_num and q_num:
                    total_contract_price = f"USD {p_num * q_num:,.2f}"

            # Check if this product is already in the list
            existing_prod = None
            for p_item in products_list:
                if isinstance(p_item, dict) and p_item.get("product", "").lower() == product_obj.name.lower():
                    existing_prod = p_item
                    break

            if existing_prod:
                # Fill missing values only
                if not existing_prod.get("price") and price: existing_prod["price"] = price
                if not existing_prod.get("trial_qty") and trial_qty: existing_prod["trial_qty"] = trial_qty
                if not existing_prod.get("contract_qty") and contract_qty: existing_prod["contract_qty"] = contract_qty
                if not existing_prod.get("total_contract_price") and total_contract_price: existing_prod["total_contract_price"] = total_contract_price
                if not existing_prod.get("destination_port") and destination_port: existing_prod["destination_port"] = destination_port
            else:
                # Add new product dictionary
                products_list.append({
                    "product": product_obj.name,
                    "price": price,
                    "trial_qty": trial_qty,
                    "contract_qty": contract_qty,
                    "total_contract_price": total_contract_price,
                    "destination_port": destination_port
                })

            buyer.products = products_list
            flag_modified(buyer, "products")

    await db.flush()
    return buyer


def validate_form_values(schema: DocumentSchema, values: dict) -> None:
    for field in schema.fields:
        if field.required and not str(values.get(field.key, "")).strip():
            raise HTTPException(422, f"Missing required field: {field.label}")


async def next_document_number(db: AsyncSession, doc_code: str) -> str:
    count = await db.scalar(select(func.count()).select_from(GeneratedDocument))
    return f"{doc_code}-{(count or 0) + 1:06d}"


async def audit(db: AsyncSession, entity_type, entity_id, action, actor=None, detail=None):
    db.add(AuditLog(entity_type=entity_type, entity_id=entity_id,
                    action=action, actor=actor, detail=detail or {}))
