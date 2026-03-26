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


def norm_slug_key(raw: str) -> str:
    """Slug z URL (segment /l/...) → stejný tvar jako norm_name pro párování se stemem."""
    s = unquote(raw.strip().strip("/"))
    s = re.sub(r"\([^)]*\)", "", s)
    s = re.sub(r"[-_]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return norm_name(s)


def pick_by_prefix(n_key: str, html_files: list[Path]) -> str | None:
    """Najde soubor, jehož normovaný stem začíná na n_key (např. dlouhý název souboru)."""
    if not n_key:
        return None
    candidates: list[str] = []
    for p in html_files:
        stem_n = norm_name(p.stem)
        if stem_n == n_key or stem_n.startswith(n_key + " "):
            candidates.append(p.name)
    if not candidates:
        return None
    return min(candidates, key=len)


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

    html_files = sorted(
        [p for p in ROSTLINY_DIR.glob("*.html") if p.is_file()],
        key=lambda x: x.name.casefold(),
    )

    for raw_slug, cz in pairs:
        key = slug_key(raw_slug)
        n = norm_name(cz)
        fname = by_norm.get(n)
        if fname:
            slug_to_file[key] = fname
        else:
            unmatched_slugs.append(key)

    # Druhé kolo: stejný český název jako začátek dlouhého stemu souboru (bazalka-…-ocimum-….html).
    for raw_slug, cz in pairs:
        key = slug_key(raw_slug)
        if key in slug_to_file:
            continue
        n_cz = norm_name(cz)
        hit = pick_by_prefix(n_cz, html_files)
        if hit:
            slug_to_file[key] = hit

    # Třetí kolo: párování podle slug (bez shody .cz se stemem).
    for raw_slug, cz in pairs:
        key = slug_key(raw_slug)
        if key in slug_to_file:
            continue
        n_sk = norm_slug_key(raw_slug)
        hit = pick_by_prefix(n_sk, html_files)
        if hit:
            slug_to_file[key] = hit

    unmatched_slugs = sorted({slug_key(rs) for rs, _ in pairs if slug_key(rs) not in slug_to_file})

    OUT_JSON.write_text(
        json.dumps(slug_to_file, ensure_ascii=False, sort_keys=True, indent=0) + "\n",
        encoding="utf-8",
    )

    n_map = len(slug_to_file)
    n_pairs = len(pairs)
    n_files = len(stems)
    print(f"OK: {OUT_JSON.relative_to(BASE)} — mapováno {n_map}/{n_pairs} slugů, souborů HTML: {n_files}")
    if unmatched_slugs:
        print(f"Info: bez lokálního HTML ({len(unmatched_slugs)} slugů), fallback na seznam článků")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
