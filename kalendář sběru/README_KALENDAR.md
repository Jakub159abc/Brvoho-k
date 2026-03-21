
# Kalendář sběru léčivých rostlin

## Spuštění

**Pokud máte Python nainstalovaný:** Dvakrát klikněte na `run_calendar.bat`. Soubor zkusí spustit Python přes `py`, `python` nebo `python3`.

**Z příkazové řádky:** `py generate_calendar.py` nebo `python generate_calendar.py`

Skript **sám načte** české a latinské názvy ze sloupců **B** a **C** v souboru `Finální.xlsx` a vygeneruje `kalendar_sberu.html`. Žádné doplňování ani nastavování sloupců – stačí mít názvy v B a C (s diakritikou) a spustit generování.

## Struktura dat

V Excel souboru `Finální.xlsx`:
- **Sloupec B** (2. sloupec) = český název rostliny – kalendář ho načte a zobrazí tak, jak je (včetně diakritiky)
- **Sloupec C** (3. sloupec) = latinský název – zobrazí se pod českým názvem
- **Sloupec J** = informace o sběru (části rostliny a měsíce)

Pokud máte názvy s diakritikou v jiných sloupcích (např. D a F), můžete nejdřív spustit `doplnit_nazvy_s_diakritikou.bat`, který je zkopíruje do B a C; pak spusťte `run_calendar.bat`.

## Výstup

Vygenerovaný HTML soubor obsahuje tabulku s:
- Rostlinami v řádcích (český a latinský název)
- Měsíci v sloupcích (Leden až Prosinec)
- Emoji symboly v buňkách pro části rostlin, které se sbírají v daném měsíci
