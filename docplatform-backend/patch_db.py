import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import TemplateVersion, DocumentType, Template

async def main():
    async with AsyncSessionLocal() as db:
        # Find the SPEC document type
        doctype = (await db.execute(select(DocumentType).where(DocumentType.code == "SPEC"))).scalar_one_or_none()
        if not doctype:
            print("SPEC doctype not found")
            return
            
        # Get all templates for SPEC
        templates = (await db.execute(select(Template).where(Template.document_type_id == doctype.id))).scalars().all()
        
        updated = 0
        for tpl in templates:
            # Get latest version
            versions = (await db.execute(select(TemplateVersion).where(TemplateVersion.template_id == tpl.id))).scalars().all()
            for tv in versions:
                if "\\usepackage{colortbl}" not in tv.latex_source:
                    tv.latex_source = tv.latex_source.replace("\\usepackage{xcolor}", "\\usepackage{xcolor}\n\\usepackage{colortbl}")
                    updated += 1
        
        await db.commit()
        print(f"Updated {updated} template versions with colortbl.")

if __name__ == "__main__":
    asyncio.run(main())
