import re
import json

tex = open("debug.tex", encoding="utf-8").read()
zh_part = tex.split(r"\BLOCK{ else }")[0]
en_part = tex.split(r"\BLOCK{ else }")[1]

labels = {}

# We know the structure is almost identical. 
# Let's replace \VAR{xxx} with (.*?) in zh_part, and extract the text.
zh_lines = [l.strip() for l in zh_part.split('\n') if r'\VAR{labels.' in l]

for zl in zh_lines:
    # Extract the label key
    match = re.search(r'\\VAR\{labels\.([a-zA-Z0-9_]+)\}', zl)
    if not match: continue
    key = match.group(1)
    
    # Try to find the corresponding line in en_part
    # Let's just create a basic map by replacing the label var with regex
    # Actually, many are inside \textbf{} or tables.
    pass

# Alternatively, I can just provide the labels dict directly in a file by asking an LLM to generate it, 
# but I am the LLM! I can just generate the dictionary right here.
