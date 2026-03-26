# -*- coding: utf-8 -*-
"""Vygeneruje mapu slug (z data-url na brvohorik.cz) → název souboru článku v články html/rostliny.

Páruje položky z Filtrování rostlin/output.html (data-url + .cz) se soubory podle
sjednoceného názvu (bez závorky za hlavní název, case-insensitive).
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.parse import unquote

BASE = Path(__file__).resolve().parent
OUTPUT_HTML = BASE / "Filtrování rostlin" / "output.html"
ROSTLINY_DIR = BASE / "články html" / "rostliny"
OUT_JSON = ROSTLINY_DIR / "slug-to-local-file.json"

def parse_slug_cz_pairs(text: str) -> list[tuple[str, str]]:
    """Z každého bloku .bylinka vezme data-url slug a první .cz."""
    blocks = re.split(r'<div class="bylinka\b', text)
    out: list[tuple[str, str]] = []
    for block in blocks[1:]:
        m = re.search(r'data-url="https://www\.brvohorik\.cz/l/([^"]+)/"', block)
        if not m:
            continue
        m2 = re.search(r'<div class="cz">([^<]*)</div>', block)
        if m2:
            out.append((m.group(1), m2.group(1)))
    return out


def norm_name(s: str) -> str:
    """Klíč pro porovnání českého názvu se stem souboru."""
    s = s.strip()
    if "(" in s:
        s = s.split("(", 1)[0].strip()
    s = s.casefold()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    # Sjednoť separátory mezi názvy (v názvech souborů často jsou pomlčky/underscores,
    # zatímco v textu jsou mezery).
    s = re.sub(r"[-_]+", " ", s)
    # Odstraň (nebo nahraď) interpunkci za slova, aby např. "A, B" odpovídalo "A B".
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def slug_key(raw: str) -> str:
    """Klíč pro vyhledávání v mapě z JS (pathname segment z URL)."""
    return unquote(raw.strip().strip("/"))


def main() -> int:
    if not OUTPUT_HTML.is_file():
        print(f"Chyba: {OUTPUT_HTML}", file=sys.stderr)
        return 1
    if not ROSTLINY_DIR.is_dir():
        print(f"Chyba: {ROSTLINY_DIR}", file=sys.stderr)
        return 1

    text = OUTPUT_HTML.read_text(encoding="utf-8", errors="replace")
    pairs = parse_slug_cz_pairs(text)
    if not pairs:
        print("Chyba: v output.html se nenašly páry data-url + .cz", file=sys.stderr)
        return 1

    stems: list[tuple[str, str]] = []
    for p in sorted(ROSTLINY_DIR.glob("*.html"), key=lambda x: x.name.casefold()):
        if p.is_file():
            stems.append((norm_name(p.stem), p.name))

    # norm_name -> první soubor (deterministicky nejnižší casefold název při kolizi)
    by_norm: dict[str, str] = {}
    for n, fname in stems:
        if n not in by_norm:
            by_norm[n] = fname

    slug_to_file: dict[str, str] = {}
    unmatched_slugs: list[str] = []

    for raw_slug, cz in pairs:
        key = slug_key(raw_slug)
        n = norm_name(cz)
        fname = by_norm.get(n)
        if fname:
            slug_to_file[key] = fname
        else:
            unmatched_slugs.append(key)

    OUT_JSON.write_text(
        json.dumps(slug_to_file, ensure_ascii=False, sort_keys=True, indent=0) + "\n",
        encoding="utf-8",
    )

    n_map = len(slug_to_file)
    n_pairs = len(pairs)
    n_files = len(stems)
    print(f"OK: {OUT_JSON.relative_to(BASE)} — mapováno {n_map}/{n_pairs} slugů, souborů HTML: {n_files}")
    if unmatched_slugs:
        print(f"Info: bez lokálního HTML ({len(unmatched_slugs)} slugů), zůstane odkaz na brvohorik.cz")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
