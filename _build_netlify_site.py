# -*- coding: utf-8 -*-
"""Sestaví netlify-site: aplikační shell (site/) + články + kalendář."""
import shutil
from pathlib import Path

BASE = Path(__file__).resolve().parent
DEST = BASE / "netlify-site"
SITE = BASE / "site"


def main() -> None:
    # Kalendář: jediný zdroj pravdy = kalendář sběru/kalendar_sberu.html → i do site/ (kvůli gitu a přehledu)
    kal_src = BASE / "kalendář sběru"
    site_kal_index = SITE / "kalendar-sberu" / "index.html"
    shutil.copy2(kal_src / "kalendar_sberu.html", site_kal_index)

    if DEST.exists():
        shutil.rmtree(DEST)

    # Aplikace: menu a sekce (čisté URL bez editoru / tabulek)
    shutil.copytree(SITE, DEST)

    # Články o rostlinách
    shutil.copytree(BASE / "články html", DEST / "články html")

    # Kalendář – velké HTML pod kalendar-sberu/ (tabulka jako index + přehled + správa)
    kal_dst = DEST / "kalendar-sberu"
    shutil.copy2(kal_src / "kalendar_sberu.html", kal_dst / "index.html")
    shutil.copy2(kal_src / "kalendar_sberu.html", kal_dst / "prehled.html")
    shutil.copy2(kal_src / "kalendar_sberu_sprava.html", kal_dst / "sprava.html")

    n = sum(1 for _ in DEST.rglob("*") if _.is_file())
    print(f"OK: {n} souborů v {DEST}")


if __name__ == "__main__":
    main()
