"""Pydantic v2 schemas for API I/O."""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator
import re

FieldType = Literal["text", "number", "date", "dropdown", "textarea", "checkbox"]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Reference entities ---
class CompanyOut(ORMModel):
    id: uuid.UUID
    name: str
    code: str


class ProductOut(ORMModel):
    id: uuid.UUID
    name: str
    code: str
    unit: str


class DocumentTypeOut(ORMModel):
    id: uuid.UUID
    name: str
    code: str


# --- Schema / fields ---
class SchemaFieldOut(ORMModel):
    id: uuid.UUID
    key: str
    label: str
    field_type: FieldType
    required: bool
    order: int
    options: list[Any] | None = None
    default_value: str | None = None
    placeholder: str | None = None


class DocumentSchemaOut(ORMModel):
    id: uuid.UUID
    template_id: uuid.UUID
    version: int
    fields: list[SchemaFieldOut]


# --- Generation ---
class GenerateRequest(BaseModel):
    company_id: uuid.UUID
    product_id: uuid.UUID
    document_type_id: uuid.UUID
    buyer_name: str = Field(..., min_length=2)
    company_name: str = Field(..., min_length=2)
    country: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=5)
    email: str | None = None
    form_values: dict[str, Any]
    created_by: str | None = None

    @field_validator('buyer_name', 'company_name', 'country', 'email', 'phone', mode='before')
    @classmethod
    def clean_strings(cls, v: Any) -> Any:
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v

    @field_validator('phone')
    @classmethod
    def clean_phone(cls, v: str) -> str:
        if v:
            v = re.sub(r'[^\d+]', '', v)
        return v


class ReviseRequest(BaseModel):
    document_id: uuid.UUID
    form_values: dict[str, Any]
    created_by: str | None = None


class DocumentVersionOut(ORMModel):
    id: uuid.UUID
    version: int
    created_at: datetime
    created_by: str | None = None
    form_values: dict[str, Any]


class GeneratedDocumentOut(ORMModel):
    id: uuid.UUID
    document_number: str
    buyer_id: int
    company: str
    product: str
    document_type: str
    latest_version: int
    created_at: datetime


class DocumentSearchResult(BaseModel):
    items: list[GeneratedDocumentOut]
    total: int


class BuyerOut(ORMModel):
    id: int
    display_name: str | None
    buyer_name: str | None = None
    company_name: str | None = None
    email: str | None = None
    country: str | None = None
    address: str | None = None


class BuyerListItem(BaseModel):
    id: int
    display_name: str | None
    document_count: int


class BuyerDocumentItem(ORMModel):
    id: uuid.UUID
    document_number: str
    document_type: str
    latest_version: int
    created_at: datetime


class BuyerProductGroup(BaseModel):
    product_name: str
    product_code: str
    documents: list[BuyerDocumentItem]


class BuyerCompanyGroup(BaseModel):
    company_name: str
    company_code: str
    products: list[BuyerProductGroup]


class BuyerProfileStats(BaseModel):
    total_companies: int
    total_products: int
    total_documents: int


class BuyerProfileOut(BaseModel):
    buyer: BuyerOut
    stats: BuyerProfileStats
    companies: list[BuyerCompanyGroup]
