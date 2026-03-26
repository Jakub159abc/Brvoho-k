# -*- coding: utf-8 -*-
"""Přidá před </body> skript pro odkazy na Obsahové látky u článků se substance-group-heading."""
from __future__ import annotations

import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROST = BASE / "články html" / "rostliny"

TAG = '<script src="/js/clanek-obsahove-latky.js" defer></script>'


def main() -> int:
    if not ROST.is_dir():
        print("Chyba: složka", ROST, file=sys.stderr)
        return 1
    n = 0
    for p in sorted(ROST.glob("*.html")):
        try:
            t = p.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        if "substance-group-heading" not in t:
            continue
        if "clanek-obsahove-latky.js" in t:
            continue
        if "</body>" not in t:
            continue
        t = t.replace("</body>", TAG + "\n</body>", 1)
        p.write_text(t, encoding="utf-8")
        n += 1
        print("OK:", p.name)
    print("Souborů upraveno:", n)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
