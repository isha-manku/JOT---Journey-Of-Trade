import asyncio
import re
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import TemplateVersion

async def main():
    async with AsyncSessionLocal() as db:
        tvs = await db.execute(select(TemplateVersion))
        updated_count = 0
        for tv in tvs.scalars():
            if 'sidebar.png' in tv.latex_source and 'golden_bar.png' not in tv.latex_source:
                # Find the block for sidebar.png
                pattern = r"(\\AtPageLowerLeft\{%\s*\\includegraphics\[width=1cm,height=\\paperheight\]\{sidebar\.png\}%\s*\})"
                replacement = r"\1\n  \\AtPageLowerLeft{%\n    \\hspace*{1cm}%\n    \\includegraphics[width=0.3cm,height=\\paperheight]{golden_bar.png}%\n  }"
                
                new_latex = re.sub(pattern, replacement, tv.latex_source)
                
                if new_latex != tv.latex_source:
                    tv.latex_source = new_latex
                    updated_count += 1
        
        if updated_count > 0:
            await db.commit()
            print(f"Updated {updated_count} templates to include golden bar.")
        else:
            print("No templates needed updating.")

if __name__ == "__main__":
    asyncio.run(main())
