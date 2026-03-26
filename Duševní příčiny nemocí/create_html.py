# -*- coding: utf-8 -*-
"""
Skript pro vytvoření HTML souboru s daty vloženými přímo.
Vytvoří kompletní HTML soubor s inline JavaScript a daty.
"""
import os

def create_html_file():
    # Získat adresář, kde je tento skript
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    data_js_path = os.path.join(script_dir, 'data.js')
    script_js_path = os.path.join(script_dir, 'script.js')
    style_css_path = os.path.join(script_dir, 'style.css')
    output_html_path = os.path.join(script_dir, 'index.html')
    
    print(f"Načítám data.js...")
    with open(data_js_path, 'r', encoding='utf-8') as f:
        data_content = f.read()
    
    print(f"Načítám script.js...")
    with open(script_js_path, 'r', encoding='utf-8') as f:
        script_content = f.read()
    
    print(f"Načítám style.css...")
    with open(style_css_path, 'r', encoding='utf-8') as f:
        css_content = f.read()
    
    # Vytvořit HTML obsah
    html_content = f'''<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Duševní příčiny nemocí - Filtrování</title>
    <style>
{css_content}
    </style>
</head>
<body>
    <div class="container">
        <h1>Duševní příčiny nemocí</h1>
        <p class="subtitle">Vyhledejte problém a zjistěte jeho možnou duševní příčinu</p>

        <div id="search-container">
            <div id="search-wrapper">
                <input type="text" id="search-input" placeholder="🔍 Zadejte název problému nebo nemoci..." autocomplete="off">
            </div>
        </div>

        <div id="problems" class="problems-grid">
            <div class="no-results">Načítám data...</div>
        </div>
    </div>

    <script>
{data_content}
    </script>
    <script>
{script_content}
    </script>
</body>
</html>'''
    
    print(f"Ukládám HTML soubor do {output_html_path}...")
    with open(output_html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f'✓ HTML soubor byl úspěšně vytvořen s daty vloženými přímo!')
    print(f'  Soubor: {output_html_path}')

if __name__ == "__main__":
    create_html_file()
