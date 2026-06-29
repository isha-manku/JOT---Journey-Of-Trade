import asyncio
import re
from sqlalchemy import select, update
from app.database import AsyncSessionLocal
from app.models import GeneratedDocumentVersion, TemplateVersion

async def update_templates():
    async with AsyncSessionLocal() as session:
        # Update template_versions
        result = await session.execute(select(TemplateVersion))
        tvs = result.scalars().all()
        for tv in tvs:
            if r"\usepackage{xeCJK}" not in tv.latex_source:
                # Insert after \documentclass or \usepackage
                # We'll just replace \begin{document} with \usepackage{xeCJK}\n\begin{document}
                new_source = tv.latex_source.replace(r"\begin{document}", "\\usepackage{xeCJK}\n\\begin{document}")
                tv.latex_source = new_source
                
        # Also need to update GeneratedDocumentVersion if they store their own copy of template?
        # Actually GeneratedDocumentVersion has template_version_id, so it references the TemplateVersion.
        # But wait, generated documents don't duplicate the source, they use the related template_version.
        # Wait, the code says dv.template_version.latex_source. So it uses the relation.
        
        await session.commit()
        print(f"Updated {len(tvs)} templates with xeCJK.")

if __name__ == "__main__":
    asyncio.run(update_templates())
