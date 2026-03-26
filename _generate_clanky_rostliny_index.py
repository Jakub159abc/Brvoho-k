# -*- coding: utf-8 -*-
"""Vygeneruje site/clanky-o-rostlinach/index.html ze seznamu *.html v články html/rostliny."""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path
from urllib.parse import quote

BASE = Path(__file__).resolve().parent
ROSTLINY_DIR = BASE / "články html" / "rostliny"
OUT = BASE / "site" / "clanky-o-rostlinach" / "index.html"

TITLE_RE = re.compile(r"<title[^>]*>([^<]*)</title>", re.IGNORECASE | re.DOTALL)


def title_from_file(path: Path) -> str:
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return path.stem
    m = TITLE_RE.search(text)
    if m:
        t = re.sub(r"\s+", " ", m.group(1).strip())
        if t:
            return t
    return path.stem


def href_article(filename: str) -> str:
    return "/články html/rostliny/" + quote(filename)


# Stejné logo jako dlaždice „Články o rostlinách“ na hlavním menu (site/index.html)
MENU_LOGO_CLANKY = (
    "https://5894bc8f2a.clvaw-cdnwnd.com/9c5c0180b020bd4a2c598d6ffeaae1da/"
    "200000927-929ce929d0/%C4%8Dl%C3%A1nky%20o%20rostlin%C3%A1ch%20v%C3%BD%C5%99ez.png"
    "?ph=5894bc8f2a"
)


def main() -> int:
    if not ROSTLINY_DIR.is_dir():
        print(f"Chyba: složka neexistuje: {ROSTLINY_DIR}", file=sys.stderr)
        return 1

    entries: list[tuple[str, str, str]] = []
    for p in sorted(ROSTLINY_DIR.glob("*.html"), key=lambda x: x.name.casefold()):
        if p.is_file():
            title = title_from_file(p)
            entries.append((title.casefold(), title, p.name))

    entries.sort(key=lambda x: (x[0], x[1]))

    rows: list[str] = []
    for _, title, fname in entries:
        url = href_article(fname)
        rows.append(
            f'      <li class="clanky-item"><a href="{html.escape(url, quote=True)}">'
            f"{html.escape(title)}</a></li>"
        )

    list_html = "\n".join(rows)
    n = len(entries)

    logo_src = html.escape(MENU_LOGO_CLANKY, quote=True)

    content = f"""<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Články o rostlinách</title>
  <link rel="stylesheet" href="/css/app.css">
</head>
<body class="clanky-app-body">
  <a href="/" class="clanky-back-home">← Hlavní menu</a>
  <div class="clanky-container">
    <div class="clanky-title-block">
      <div class="clanky-title-row" aria-hidden="true">
        <span class="clanky-title-emoji">🌿</span>
        <img class="clanky-logo" src="{logo_src}" alt="Články o rostlinách" loading="lazy">
        <span class="clanky-title-emoji">🌿</span>
      </div>
      <h1>Články o rostlinách</h1>
      <p class="clanky-subtitle">Samostatné články k jednotlivým rostlinám. Zadejte název do pole níže (stejně jako u <a href="/vyhledavani/">vyhledávání rostlin</a>) – vyhledávání bere v úvahu i psaní <strong>bez diakritiky</strong>.</p>
      <p class="clanky-meta-links"><a href="/clanky-o-rostlinach/sprava.html">Správa seznamu a návod</a> · <a href="/vyhledavani/">Databáze rostlin</a></p>
    </div>

    <div class="clanky-search-panel">
      <div class="clanky-results-counter">
        <div class="clanky-results-header">Počet článků</div>
        <div class="clanky-results-value" id="clanky-count-num" aria-live="polite">{n}</div>
      </div>
      <div class="clanky-search-container">
        <div class="clanky-search-wrapper">
          <label class="visually-hidden" for="clanky-search">Hledat článek podle názvu</label>
          <input type="search" id="clanky-search" class="clanky-search-field" placeholder="🔍 Zadejte název rostliny…" autocomplete="off">
        </div>
      </div>
    </div>

    <ul id="clanky-list" class="clanky-list">
{list_html}
    </ul>

    <div class="page-actions clanky-page-actions">
      <a class="btn-primary" href="/">Zpět na menu</a>
    </div>
  </div>
  <script>
(function() {{
  const input = document.getElementById('clanky-search');
  const list = document.getElementById('clanky-list');
  const numEl = document.getElementById('clanky-count-num');
  if (!input || !list) return;
  const items = list.querySelectorAll('.clanky-item');
  function stripDiacritics(s) {{
    return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
  }}
  function norm(s) {{
    return stripDiacritics(s.toLowerCase());
  }}
  function filter() {{
    const q = norm(input.value.trim());
    let visible = 0;
    items.forEach(function(li) {{
      const a = li.querySelector('a');
      const t = a ? norm(a.textContent) : '';
      const show = !q || t.indexOf(q) !== -1;
      li.style.display = show ? '' : 'none';
      if (show) visible++;
    }});
    if (numEl) numEl.textContent = String(visible);
  }}
  input.addEventListener('input', filter);
  input.addEventListener('search', filter);
}})();
  </script>
</body>
</html>
"""
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(content, encoding="utf-8")
    print(f"OK: {n} článků → {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
