import re

def patch_table(table_str):
    # If the table is a tabularx with two columns (a p column and an X column, often with columncolor)
    # We want to replace it with: \begin{tabularx}{\textwidth}{|>{\bfseries\raggedright\arraybackslash}p{5cm}|>{\raggedright\arraybackslash}X|}
    
    # Only target tables that actually have \columncolor{lightgray} or are exactly 2 columns wide
    if 'columncolor{lightgray}' in table_str or ('X' in table_str and table_str.count('&') > 0 and '{|p' not in table_str and '{|>' not in table_str):
        # We also want to skip signature blocks or tables that shouldn't have borders, but the user said "Apply to all structured documents"
        # Most specification tables have 'p{' and 'X'
        if 'p{' in table_str.split('\n')[0] and 'X' in table_str.split('\n')[0]:
            # Re-define the tabularx begin
            table_str = re.sub(r'\\begin\{tabularx\}\{\\textwidth\}\{.*?\}', 
                               r'\\begin{tabularx}{\\textwidth}{|>{\\bfseries\\raggedright\\arraybackslash}p{5cm}|>{\\raggedright\\arraybackslash}X|}', 
                               table_str)
            
            # Ensure the first row has an \hline before it
            table_str = re.sub(r'(\\begin\{tabularx\}\{\\textwidth\}\{.*?\})\s*', 
                               r'\1\n\\hline\n', 
                               table_str)
            
            # Ensure every \\ has an \hline after it
            # Remove existing \hline just in case, then re-add
            table_str = table_str.replace('\\\\ \\hline', '\\\\')
            table_str = table_str.replace('\\\\', '\\\\ \\hline\n')
            
    return table_str

content = open('scratch/base_2.tex', encoding='utf-8').read()

def replacer(match):
    return patch_table(match.group(0))

new_content = re.sub(r'\\begin\{tabularx\}.*?\\end\{tabularx\}', replacer, content, flags=re.DOTALL)
open('scratch/test_base_2.tex', 'w', encoding='utf-8').write(new_content)
print("Test completed.")
