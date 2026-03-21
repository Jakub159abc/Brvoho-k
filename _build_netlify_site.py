# -*- coding: utf-8 -*-
"""Sestaví netlify-site: aplikační shell (site/) + články + kalendář + duševní příčiny."""
import importlib.util
import shutil
import unicodedata
from pathlib import Path

BASE = Path(__file__).resolve().parent
DEST = BASE / "netlify-site"
SITE = BASE / "site"
PUBLIC = BASE / "public"


def _normalize_nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)


def _find_dusevni_priciny_index_html() -> Path | None:
    """Vrátí cestu k plné aplikaci Duševní příčiny (velké HTML s daty).

    Na Windows může název složky v souborovém systému lišit v Unicode normalizaci,
    takže přesná cesta BASE / \"Duševní příčiny nemocí\" někdy neexistuje.
    """
    preferred = [
        BASE / "Duševní příčiny nemocí" / "index.html",
        BASE / "Duchovní příčiny nemocí" / "index.html",
    ]
    for p in preferred:
        if p.is_file():
            return p

    target_names = {_normalize_nfc("Duševní příčiny nemocí"), _normalize_nfc("Duchovní příčiny nemocí")}
    try:
        for child in BASE.iterdir():
            if not child.is_dir():
                continue
            if _normalize_nfc(child.name) not in target_names:
                continue
            cand = child / "index.html"
            if cand.is_file():
                return cand
    except OSError:
        pass

    # Poslední záchrana: složka s index.html, kde je vložený skript s daty (ne rozcestník)
    for child in BASE.iterdir():
        if not child.is_dir():
            continue
        cand = child / "index.html"
        if not cand.is_file():
            continue
        try:
            head = cand.read_text(encoding="utf-8", errors="ignore")[:12000]
        except OSError:
            continue
        if "const allData" in head and "problem-card" in head:
            return cand
    return None


def _find_obsahove_latky_html() -> Path | None:
    """Vrátí cestu k velkému HTML Obsahové látky (složka může mít na Windows jinou normalizaci Unicode)."""
    preferred = [
        BASE / "obsahové látky" / "obsahove-latky.html",
    ]
    for p in preferred:
        if p.is_file():
            return p

    target_dir = _normalize_nfc("obsahové látky")
    try:
        for child in BASE.iterdir():
            if not child.is_dir():
                continue
            if _normalize_nfc(child.name) != target_dir:
                continue
            cand = child / "obsahove-latky.html"
            if cand.is_file():
                return cand
    except OSError:
        pass
    return None


def _generate_clanky_rostliny_index() -> None:
    """Aktualizuje site/clanky-o-rostlinach/index.html ze složky články html/rostliny."""
    path = BASE / "_generate_clanky_rostliny_index.py"
    spec = importlib.util.spec_from_file_location("_gen_clanky_rostliny", path)
    if spec is None or spec.loader is None:
        print(f"Varování: nelze načíst {path}")
        return
    try:
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
    except Exception as e:
        print(f"Varování: přegenerování rozcestníku článků selhalo ({e})")
        return
    if hasattr(mod, "main"):
        rc = mod.main()
        if rc != 0:
            print("Varování: přegenerování rozcestníku článků skončilo chybou.")


def main() -> None:
    # Kalendář: jediný zdroj pravdy = kalendář sběru/kalendar_sberu.html → i do site/ (kvůli gitu a přehledu)
    kal_src = BASE / "kalendář sběru"
    site_kal_index = SITE / "kalendar-sberu" / "index.html"
    shutil.copy2(kal_src / "kalendar_sberu.html", site_kal_index)

    # Články o rostlinách: rozcestník ze seznamu HTML v články html/rostliny
    _generate_clanky_rostliny_index()

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

    # Vyhledávání rostlin – hotový HTML výstup z generátoru (nahradí rozcestník v site/)
    filt_output = BASE / "Filtrování rostlin" / "output.html"
    vyh_index = DEST / "vyhledavani" / "index.html"
    if filt_output.is_file():
        vyh_index.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(filt_output, vyh_index)
    else:
        print(f"Varování: nenalezeno {filt_output}, ponechán rozcestník ze site/")

    # Duševní příčiny nemocí – hotový HTML z projektu (nahradí rozcestník v site/)
    dpn_src = _find_dusevni_priciny_index_html()
    dpn_index = DEST / "dusevni-priciny-nemoci" / "index.html"
    if dpn_src is not None:
        dpn_index.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(dpn_src, dpn_index)
        print(f"OK: duševní příčiny nemocí ← {dpn_src}")
    else:
        print(
            "Varování: nenalezen zdroj duševní příčiny (složka s index.html obsahujícím "
            "const allData). Ponechán rozcestník ze site/."
        )

    # Obsahové látky – velké HTML ze složky obsahové látky/ → iframe na /obsahove-latky/aplikace.html
    ol_src = _find_obsahove_latky_html()
    ol_embed = DEST / "obsahove-latky" / "aplikace.html"
    if ol_src is not None:
        ol_embed.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ol_src, ol_embed)
        print(f"OK: obsahové látky ← {ol_src}")
        pub_ol = PUBLIC / "obsahove-latky" / "aplikace.html"
        pub_ol.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ol_src, pub_ol)
    else:
        print(
            f"Varování: nenalezeno {BASE / 'obsahové látky' / 'obsahove-latky.html'}, "
            "stránka /obsahove-latky/ očekává /obsahove-latky/aplikace.html po přidání zdroje."
        )

    n = sum(1 for _ in DEST.rglob("*") if _.is_file())
    print(f"OK: {n} souborů v {DEST}")


if __name__ == "__main__":
    main()
