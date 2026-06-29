import asyncio
import re
from sqlalchemy import select, update
from app.database import AsyncSessionLocal
from app.models import TemplateVersion

async def main():
    async with AsyncSessionLocal() as db:
        tvs = await db.execute(select(TemplateVersion))
        updated_count = 0
        for tv in tvs.scalars():
            if 'header_logo' in tv.latex_source:
                # Find the includegraphics command for header_logo.jpg
                # e.g., \includegraphics[width=\textwidth,height=2.5cm,keepaspectratio]{header_logo.jpg}
                # We want to replace the width and height.
                
                # Using regex to replace the options inside the brackets for header_logo.jpg
                pattern = r"\\includegraphics\[(.*?)\]\{header_logo\.jpg\}"
                replacement = r"\\includegraphics[width=19.73cm,height=4.17cm,keepaspectratio]{header_logo.jpg}"
                
                new_latex = re.sub(pattern, replacement, tv.latex_source)
                
                if new_latex != tv.latex_source:
                    tv.latex_source = new_latex
                    updated_count += 1
        
        if updated_count > 0:
            await db.commit()
            print(f"Updated {updated_count} templates.")
        else:
            print("No templates needed updating.")

if __name__ == "__main__":
    asyncio.run(main())
