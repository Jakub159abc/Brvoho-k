# Aktualizace aplikace z Excel souboru

## Popis
Projekt obsahuje dva hlavní skripty pro aktualizaci aplikace z Excel souboru:

1. **`update_html_from_excel.py`** ⭐ **DOPORUČENO** - Vytváří kompletní HTML soubor s daty vloženými přímo
2. **`update_from_excel.py`** - Aktualizuje pouze `data.js` soubor

## Doporučené použití: update_html_from_excel.py

Tento skript je **ideální pro finální HTML soubor**, protože:
- ✅ Vytváří **samostatný HTML soubor** bez externích závislostí
- ✅ Všechna data jsou **vložena přímo do HTML**
- ✅ Můžete soubor sdílet jako jeden soubor (bez `data.js`, `script.js`, `style.css`)
- ✅ Funguje offline bez potřeby externích souborů

### Základní použití
```bash
python update_html_from_excel.py
```

Tím se načte soubor `duchovni-priciny-nemoci.xlsx` a vytvoří/aktualizuje `index.html` s daty vloženými přímo.

### Vlastní soubory
```bash
python update_html_from_excel.py nazev_souboru.xlsx
```

Nebo s vlastním výstupním HTML souborem:
```bash
python update_html_from_excel.py nazev_souboru.xlsx vystupni.html
```

### Co skript dělá
1. Načte Excel soubor (.xlsx)
2. Přečte hlavičky z prvního řádku
3. Načte všechna data z následujících řádků
4. Vloží data přímo do HTML jako JavaScript (`const allData = [...]`)
5. Vloží CSS ze `style.css` do HTML
6. Vloží JavaScript logiku ze `script.js` do HTML
7. Vytvoří/aktualizuje kompletní HTML soubor

### Příklad výstupu
```
============================================================
Aktualizace HTML souboru z Excel tabulky
============================================================

Načítám Excel soubor: C:\...\duchovni-priciny-nemoci.xlsx
Nalezeny sloupce: ['PROBLÉM', 'MOŽNÁ PŘÍČINA', 'NOVÝ MENTÁLNÍ NÁVYK – AFIRMACE']
Načteno 372 záznamů
Načítám CSS soubor: C:\...\style.css
Načítám JavaScript soubor: C:\...\script.js
Ukládám HTML soubor: C:\...\index.html
✓ HTML soubor byl úspěšně vytvořen!
  Soubor: C:\...\index.html
  Celkem záznamů: 372

============================================================
✓ Aktualizace dokončena úspěšně!
============================================================

HTML soubor nyní obsahuje všechna data z Excel tabulky.
Můžete ho otevřít přímo v prohlížeči bez externích souborů.
```

## Alternativní použití: update_from_excel.py

Tento skript aktualizuje pouze `data.js` soubor (použijte, pokud chcete zachovat externí soubory).

### Základní použití
```bash
python update_from_excel.py
```

### Co skript dělá
1. Načte Excel soubor (.xlsx)
2. Přečte hlavičky z prvního řádku
3. Načte všechna data z následujících řádků
4. Převede data do formátu JSON
5. Vytvoří/aktualizuje soubor `data.js` s JavaScript proměnnou `allData`

## Požadavky
- Python 3.x
- openpyxl (nainstalováno pomocí: `pip install openpyxl`)

## Jak používat po úpravě Excel tabulky

1. **Uložte změny v Excel tabulce** (`duchovni-priciny-nemoci.xlsx`)
2. **Spusťte skript**:
   ```bash
   python update_html_from_excel.py
   ```
3. **Otevřete nový HTML soubor** (`index.html`) v prohlížeči

Skript automaticky:
- ✅ Načte aktuální data z Excel
- ✅ Vytvoří nový HTML soubor nebo přepíše existující
- ✅ Všechna data budou dostupná přímo v HTML
