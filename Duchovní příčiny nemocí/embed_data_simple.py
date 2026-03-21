# -*- coding: utf-8 -*-
import os

# Získat adresář, kde je tento skript
script_dir = os.path.dirname(os.path.abspath(__file__))

data_js_path = os.path.join(script_dir, 'data.js')
index_html_path = os.path.join(script_dir, 'index.html')

# Načíst data.js
print(f"Načítám {data_js_path}...")
with open(data_js_path, 'r', encoding='utf-8') as f:
    data_content = f.read()

# Načíst index.html
print(f"Načítám {index_html_path}...")
with open(index_html_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Nahradit <script src="data.js"></script> za inline script s daty
old_script_tag = '<script src="data.js"></script>'
new_script_tag = '<script>\n' + data_content + '\n</script>'

if old_script_tag in html_content:
    html_content = html_content.replace(old_script_tag, new_script_tag)
    
    # Uložit upravený HTML
    print(f"Ukládám upravený HTML do {index_html_path}...")
    with open(index_html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print('✓ Data byla úspěšně vložena do HTML souboru')
else:
    print('✗ Nenalezen tag <script src="data.js"></script> v HTML')
