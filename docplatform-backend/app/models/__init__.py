"""
SQLAlchemy async models for the Document Automation Platform.
Fully normalized relational design (PostgreSQL).
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    String, Integer, Boolean, DateTime, ForeignKey, Text, JSON, UniqueConstraint, Index, Uuid,
    TypeDecorator, CHAR
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses CHAR(36) to store UUIDs as strings with dashes.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                try:
                    return str(uuid.UUID(value))
                except ValueError:
                    return str(value)
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value)
            return value


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(GUID(), primary_key=True, default=uuid.uuid4)


# ---------------------------------------------------------------------------
# Configurable reference entities
# ---------------------------------------------------------------------------
class Company(Base):
    __tablename__ = "doc_companies"
    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    # Static branding / seller / banking info reused across templates.
    branding: Mapped[dict] = mapped_column(JSON, default=dict)  # logos, address, bank details
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    templates: Mapped[list["Template"]] = relationship(back_populates="company")


class Product(Base):
    __tablename__ = "doc_products"
    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), default="MT")  # metric tons, kg, bbl...
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    templates: Mapped[list["Template"]] = relationship(back_populates="product")


class DocumentType(Base):
    __tablename__ = "doc_document_types"
    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(100), nullable=False)   # LOI, SCO, ICPO...
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    templates: Mapped[list["Template"]] = relationship(back_populates="document_type")


class Buyer(Base):
    """Mapped directly to CRM buyers table."""
    __tablename__ = "buyers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    buyer_name: Mapped[str | None] = mapped_column(String(255))
    company_name: Mapped[str | None] = mapped_column(String(255))
    country: Mapped[str | None] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50))
    address: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    products: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    @property
    def display_name(self) -> str:
        return self.buyer_name or self.company_name or str(self.id)


# ---------------------------------------------------------------------------
# Template system (versioned)
# ---------------------------------------------------------------------------
class Template(Base):
    """
    A Template binds a (Company, Product, DocumentType) combination.
    Its content/schema are versioned via TemplateVersion and DocumentSchema.
    """
    __tablename__ = "doc_templates"
    __table_args__ = (
        UniqueConstraint("company_id", "product_id", "document_type_id", name="uq_template_combo"),
    )
    id: Mapped[uuid.UUID] = _uuid_pk()
    company_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("doc_companies.id"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("doc_products.id"), nullable=False)
    document_type_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("doc_document_types.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    company: Mapped["Company"] = relationship(back_populates="templates")
    product: Mapped["Product"] = relationship(back_populates="templates")
    document_type: Mapped["DocumentType"] = relationship(back_populates="templates")
    versions: Mapped[list["TemplateVersion"]] = relationship(
        back_populates="template", order_by="TemplateVersion.version"
    )
    schemas: Mapped[list["DocumentSchema"]] = relationship(
        back_populates="template", order_by="DocumentSchema.version"
    )


class TemplateVersion(Base):
    """Stores the actual LaTeX/Jinja2 template string for a given version."""
    __tablename__ = "doc_template_versions"
    __table_args__ = (
        UniqueConstraint("template_id", "version", name="uq_template_version"),
    )
    id: Mapped[uuid.UUID] = _uuid_pk()
    template_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("doc_templates.id"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    latex_source: Mapped[str] = mapped_column(Text, nullable=False)  # Jinja2 + LaTeX
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    template: Mapped["Template"] = relationship(back_populates="versions")


class DocumentSchema(Base):
    """Versioned schema definition describing the variable form fields."""
    __tablename__ = "doc_document_schemas"
    __table_args__ = (
        UniqueConstraint("template_id", "version", name="uq_schema_version"),
    )
    id: Mapped[uuid.UUID] = _uuid_pk()
    template_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("doc_templates.id"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    template: Mapped["Template"] = relationship(back_populates="schemas")
    fields: Mapped[list["SchemaField"]] = relationship(
        back_populates="schema", order_by="SchemaField.order", cascade="all, delete-orphan"
    )


class SchemaField(Base):
    """A single variable field within a DocumentSchema."""
    __tablename__ = "doc_schema_fields"
    id: Mapped[uuid.UUID] = _uuid_pk()
    schema_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("doc_document_schemas.id"), nullable=False)
    key: Mapped[str] = mapped_column(String(100), nullable=False)        # jinja variable name
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    field_type: Mapped[str] = mapped_column(String(50), nullable=False)  # text|number|date|dropdown|textarea|checkbox
    required: Mapped[bool] = mapped_column(Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)
    options: Mapped[list | None] = mapped_column(JSON, default=list)    # for dropdown
    default_value: Mapped[str | None] = mapped_column(Text)
    placeholder: Mapped[str | None] = mapped_column(String(255))

    schema: Mapped["DocumentSchema"] = relationship(back_populates="fields")


# ---------------------------------------------------------------------------
# Generated documents (versioned, never overwritten)
# ---------------------------------------------------------------------------
class GeneratedDocument(Base):
    """Base metadata for a generated document. Versions hold the actual data."""
    __tablename__ = "doc_generated_documents"
    __table_args__ = (
        Index("ix_gendoc_buyer", "buyer_id"),
        Index("ix_gendoc_template", "template_id"),
    )
    id: Mapped[uuid.UUID] = _uuid_pk()
    document_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    template_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("doc_templates.id"), nullable=False)
    buyer_id: Mapped[int] = mapped_column(Integer, ForeignKey("buyers.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    template: Mapped["Template"] = relationship()
    buyer: Mapped["Buyer"] = relationship()
    versions: Mapped[list["GeneratedDocumentVersion"]] = relationship(
        back_populates="document", order_by="GeneratedDocumentVersion.version"
    )


class GeneratedDocumentVersion(Base):
    """Each revision: stores the Form Values JSON and links to a TemplateVersion."""
    __tablename__ = "doc_generated_document_versions"
    __table_args__ = (
        UniqueConstraint("document_id", "version", name="uq_gendoc_version"),
    )
    id: Mapped[uuid.UUID] = _uuid_pk()
    document_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("doc_generated_documents.id"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    template_version_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("doc_template_versions.id"), nullable=False)
    schema_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("doc_document_schemas.id"), nullable=False)
    form_values: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[str | None] = mapped_column(String(100))  # from CRM user context

    document: Mapped["GeneratedDocument"] = relationship(back_populates="versions")
    template_version: Mapped["TemplateVersion"] = relationship()


class AuditLog(Base):
    __tablename__ = "doc_audit_logs"
    id: Mapped[uuid.UUID] = _uuid_pk()
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(GUID(), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # create|revise|view|download
    actor: Mapped[str | None] = mapped_column(String(100))
    detail: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
