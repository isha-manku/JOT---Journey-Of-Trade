import asyncio
import uuid
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import DocumentType, Template, DocumentSchema, SchemaField

async def main():
    async with AsyncSessionLocal() as db:
        # Find FCO DocumentType
        doc_type = await db.scalar(select(DocumentType).where(DocumentType.code == "FCO"))
        if not doc_type:
            print("FCO doc type not found")
            return
            
        # Find first template for FCO
        tpl = await db.scalar(select(Template).where(Template.document_type_id == doc_type.id))
        if not tpl:
            print("FCO template not found")
            return
            
        # Find its active schema
        schema = await db.scalar(
            select(DocumentSchema)
            .where(DocumentSchema.template_id == tpl.id)
            .order_by(DocumentSchema.version.desc())
        )
        if not schema:
            print("Schema not found")
            return
            
        # Check if already exists
        exists = await db.scalar(select(SchemaField).where(SchemaField.schema_id == schema.id, SchemaField.key == "temporary_test_field"))
        if exists:
            print("Field already exists")
            return
            
        # Add a new test field
        new_field = SchemaField(
            schema_id=schema.id,
            key="temporary_test_field",
            label="Temporary Test Field (Dynamically Added!)",
            field_type="text",
            required=False,
            order=999,
            placeholder="I was added dynamically!"
        )
        db.add(new_field)
        await db.commit()
        print("Successfully added temporary test field to schema ID:", schema.id)

if __name__ == "__main__":
    asyncio.run(main())
