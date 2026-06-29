import asyncio
import re
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import TemplateVersion

def patch_table(table_str):
    # Skip if it doesn't look like our 2-column key-value tables
    if 'columncolor{lightgray}' not in table_str:
        return table_str
    
    # 1. Replace the table definition header
    # We look for \begin{tabularx}{\textwidth}{...X}
    pattern_header = r'\\begin\{tabularx\}\{\\textwidth\}\{>\{\\columncolor\{lightgray\}\\bfseries\\raggedright\\arraybackslash\}p\{[\d\.]+cm\}\s*>\{\\raggedright\\arraybackslash\}X\}'
    replacement_header = r'\\begin{tabularx}{\\textwidth}{|>{\\bfseries\\raggedright\\arraybackslash}p{5cm}|>{\\raggedright\\arraybackslash}X|}\n\\hline'
    
    table_str = re.sub(pattern_header, replacement_header, table_str)
    
    # 2. Add \hline after every \\
    # First, temporarily replace existing '\\ \hline' to just '\\'
    table_str = table_str.replace('\\\\ \\hline', '\\\\')
    # Now replace all '\\' with '\\ \hline'
    # Wait, some '\\' might have whitespace. Use regex.
    table_str = re.sub(r'\\\\(\s*)', r'\\\\ \\hline\1', table_str)
    
    # 3. Clean up \columncolor inside \multicolumn
    table_str = table_str.replace('\\columncolor{lightgray}', '')
    
    # 4. We don't want \hline right before \end{tabularx} if the last row already has it, 
    # but the regex above already adds \hline after \\ which is correct.
    
    return table_str

async def main():
    async with AsyncSessionLocal() as db:
        tvs = await db.execute(select(TemplateVersion))
        updated_count = 0
        for tv in tvs.scalars():
            original_latex = tv.latex_source
            
            # Find all tabularx blocks and patch them
            new_latex = re.sub(r'\\begin\{tabularx\}.*?\\end\{tabularx\}', 
                               lambda m: patch_table(m.group(0)), 
                               original_latex, 
                               flags=re.DOTALL)
            
            if new_latex != original_latex:
                tv.latex_source = new_latex
                updated_count += 1
                
        if updated_count > 0:
            await db.commit()
            print(f"Updated {updated_count} templates.")
        else:
            print("No templates needed updating.")

if __name__ == "__main__":
    asyncio.run(main())
