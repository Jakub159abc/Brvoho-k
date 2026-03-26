# -*- coding: utf-8 -*-
import shutil
from pathlib import Path

BASE = Path(__file__).resolve().parent
SRC = BASE / "obsahové látky" / "obsahove-latky.html"
for rel in (
    "netlify-site/obsahove-latky/aplikace.html",
    "public/obsahove-latky/aplikace.html",
):
    dest = BASE / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SRC, dest)
    print("OK", dest.relative_to(BASE))
js = BASE / "site" / "js" / "clanek-obsahove-latky.js"
for rel in ("netlify-site/js/clanek-obsahove-latky.js", "public/js/clanek-obsahove-latky.js"):
    dest = BASE / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(js, dest)
    print("OK", dest.relative_to(BASE))
