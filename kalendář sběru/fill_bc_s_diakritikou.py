#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Doplní sloupce B a C v Finální.xlsx českými a latinskými názvy S DIAKRITIKOU
zkopírováním hodnot ze zadaných zdrojových sloupců.

Výchozí: český název ze sloupce D (index 3), latinský ze sloupce F (index 5).
Pokud máte jiné sloupce, upravte COL_CZECH_SOURCE a COL_LATIN_SOURCE níže
(používají se indexy 0 = A, 1 = B, 2 = C, 3 = D, 4 = E, 5 = F, 6 = G, ...).

Příkaz: py fill_bc_s_diakritikou.py
Náhled struktury (první řádky): py fill_bc_s_diakritikou.py --preview
"""
import pandas as pd
import os
import sys

# === Zde můžete změnit zdrojové sloupce (0 = A, 1 = B, 2 = C, 3 = D, 4 = E, 5 = F, 6 = G) ===
COL_CZECH_SOURCE = 3   # D – sloupec s českým názvem s diakritikou
COL_LATIN_SOURCE = 5   # F – sloupec s latinským názvem s diakritikou
# === Cíl: B = index 1, C = index 2 (neměňte, kalendář je očekává) ===
COL_B = 1
COL_C = 2


def _cell_to_str(val):
    """Převede buňku na řetězec vhodný pro název. Vrací None pokud neplatný."""
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).strip()
    if not s:
        return None
    # Vypadá to jako URL – nepoužívat jako název
    if s.lower().startswith('http://') or s.lower().startswith('https://'):
        return None
    # Excel datum jako číslo (např. 45292) – nepoužívat
    try:
        n = float(s.replace(',', '.'))
        if n > 10000 and n < 100000:  # typické pro Excel serial date
            return None
    except (ValueError, TypeError):
        pass
    # datetime objekt
    if hasattr(val, 'strftime'):
        return val.strftime('%d.%m.%Y') if pd.notna(val) else None
    return s


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    excel_path = os.path.join(script_dir, 'Finální.xlsx')
    preview = '--preview' in sys.argv

    if not os.path.isfile(excel_path):
        print(f"Soubor nenalezen: {excel_path}")
        return 1

    df = pd.read_excel(excel_path)
    ncols = len(df.columns)
    need = max(COL_CZECH_SOURCE, COL_LATIN_SOURCE) + 1
    if ncols < need:
        print(f"Tabulka má {ncols} sloupců, potřebujeme alespoň {need}. Zkontrolujte COL_CZECH_SOURCE a COL_LATIN_SOURCE.")
        return 1

    if preview:
        print("Struktura souboru (název sloupce = index):")
        for i, name in enumerate(df.columns):
            print(f"  {i} ({chr(65+i) if i < 26 else '?'}): {name}")
        print("\nPrvních 5 řádků – sloupce B, C a zdroje pro český/latinský název:")
        for i in range(min(5, len(df))):
            b = df.iloc[i, COL_B] if COL_B < ncols else ''
            c = df.iloc[i, COL_C] if COL_C < ncols else ''
            src_cz = df.iloc[i, COL_CZECH_SOURCE] if COL_CZECH_SOURCE < ncols else ''
            src_lat = df.iloc[i, COL_LATIN_SOURCE] if COL_LATIN_SOURCE < ncols else ''
            print(f"  Řádek {i}: B={repr(str(b)[:40])}  C={repr(str(c)[:40])}  |  zdroj_cz={repr(str(src_cz)[:40])}  zdroj_lat={repr(str(src_lat)[:40])}")
        print("\nPokud zdroje neodpovídají, upravte v souboru fill_bc_s_diakritikou.py:")
        print(f"  COL_CZECH_SOURCE = {COL_CZECH_SOURCE}   # aktuálně sloupec {chr(65+COL_CZECH_SOURCE)}")
        print(f"  COL_LATIN_SOURCE = {COL_LATIN_SOURCE}   # aktuálně sloupec {chr(65+COL_LATIN_SOURCE)}")
        return 0

    col_b_name = df.columns[COL_B]
    col_c_name = df.columns[COL_C]
    new_b = []
    new_c = []
    updated = 0
    skipped_empty = 0
    skipped_url = 0

    for i in range(len(df)):
        val_cz = df.iloc[i, COL_CZECH_SOURCE]
        val_lat = df.iloc[i, COL_LATIN_SOURCE]
        s_cz = _cell_to_str(val_cz)
        s_lat = _cell_to_str(val_lat)

        if s_cz is None:
            s_cz = ''
            if val_cz is not None and not (isinstance(val_cz, float) and pd.isna(val_cz)):
                if str(val_cz).strip().lower().startswith('http'):
                    skipped_url += 1
            else:
                skipped_empty += 1
        else:
            updated += 1
        if s_lat is None:
            s_lat = ''

        new_b.append(s_cz)
        new_c.append(s_lat)

    df[col_b_name] = new_b
    df[col_c_name] = new_c
    df.to_excel(excel_path, index=False)

    print(f"Hotovo. Uloženo: {excel_path}")
    print(f"  Doplněno/aktualizováno řádků (alespoň český název): {updated}")
    if skipped_empty or skipped_url:
        print(f"  Řádky s prázdným nebo neplatným zdrojem: část přeskočena (zůstalo prázdné)")
    print("Teď spusťte run_calendar.bat pro vygenerování kalendáře.")
    return 0


if __name__ == '__main__':
    sys.exit(main() or 0)
