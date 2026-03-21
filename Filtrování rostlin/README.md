# Excel to HTML Bylinky Generator

Program pro převod Excel souboru s bylinkami na kompletní HTML soubor s filtrováním.

## Požadavky

- Python 3.x
- Knihovna `openpyxl` (program se pokusí nainstalovat automaticky)

## Jak používat

### 1. Příprava souborů

Ujistěte se, že máte v aktuálním adresáři:
- `Finální.xlsx` - Excel soubor s daty o bylinkách
- `Hotovo4.html` - HTML šablona (používá se pro styly a strukturu)

### 2. Spuštění programu

Otevřete terminál/PowerShell v adresáři se soubory a spusťte:

```bash
python generate_html.py
```

### 3. Výstup

Program vytvoří soubor `output.html` s:
- Všemi bylinkami z Excelu
- Zachovanými styly a JavaScriptem z původního HTML
- Funkčním filtrováním

### 4. Otevření výsledku

Otevřete soubor `output.html` v prohlížeči a ověřte, že:
- Všechny bylinky jsou zobrazeny
- Filtry fungují správně
- Odkazy na bylinky vedou na správné URL

## Struktura Excel souboru

Program očekává Excel soubor s následujícími sloupci:

| Sloupec | Název | Popis |
|---------|-------|-------|
| A | id | ID bylinky |
| B | nazev_cz | Český název |
| C | nazev_lat | Latinský název |
| D | url | URL odkaz |
| E | skupina | Skupina (např. "bylina") |
| F | nemoci | Nemoci oddělené " \| " |
| G | tcm_organy | TCM orgány oddělené "\|" |
| H | ucinky | Účinky oddělené "\|" |
| I | Cast-rostliny | Část rostliny |
| J | sber | Sběr (formát: "cast:mesic \| mesic") |
| K | stanoviste | Stanoviště oddělené "\|" |
| L | barva kvetu | Barva květu oddělené "\|" |
| M | Bezpečnost | 1 = Bezpečná, 2 = Opatrně |

## Řešení problémů

### Chyba: "ModuleNotFoundError: No module named 'openpyxl'"

Program se pokusí nainstalovat openpyxl automaticky. Pokud to nefunguje, nainstalujte ručně:

```bash
pip install openpyxl
```

### Chyba: "Soubor Finální.xlsx nebyl nalezen"

Ujistěte se, že:
- Excel soubor je ve stejném adresáři jako `generate_html.py`
- Název souboru je přesně `Finální.xlsx` (včetně diakritiky)

### Chyba: "Soubor Hotovo4.html nebyl nalezen"

Ujistěte se, že:
- HTML šablona je ve stejném adresáři jako `generate_html.py`
- Název souboru je přesně `Hotovo4.html`

### Problémy s kódováním (české znaky)

Program používá UTF-8 kódování. Pokud vidíte zkreslené znaky:
- Ujistěte se, že Excel soubor je uložen s UTF-8 kódováním
- Zkontrolujte, že terminál podporuje UTF-8

## Přizpůsobení

Pokud chcete změnit názvy vstupních/výstupních souborů, upravte na konci souboru `generate_html.py`:

```python
excel_file = "Finální.xlsx"
template_file = "Hotovo4.html"
output_file = "output.html"
```

## Kontakt

V případě problémů zkontrolujte:
1. Že všechny soubory jsou ve správném adresáři
2. Že Python 3.x je nainstalován
3. Že struktura Excel souboru odpovídá očekávanému formátu
