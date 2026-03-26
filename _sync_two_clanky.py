# -*- coding: utf-8 -*-
import shutil
from pathlib import Path

BASE = Path(__file__).resolve().parent
SRC = BASE / "články html" / "rostliny"
DST = BASE / "netlify-site" / "články html" / "rostliny"
for fn in ("bez-černý.html", "Andělika čínská.html"):
    a, b = SRC / fn, DST / fn
    if a.is_file():
        shutil.copy2(a, b)
        print("OK", fn)
