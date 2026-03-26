# -*- coding: utf-8 -*-
"""Seznam receptů, manifest tagů (#bylinka) → články rostlin, rozcestník recepty-a-navody."""

from __future__ import annotations

import html
import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.parse import quote

BASE = Path(__file__).resolve().parent
RECEPTY_DIR = BASE / "články html" / "recepty"
ROSTLINY_DIR = BASE / "články html" / "rostliny"
OUT_MANIFEST = RECEPTY_DIR / "recepty-manifest.json"
OUT_INDEX = BASE / "site" / "recepty-a-navody" / "index.html"
NETLIFY_MANIFEST = BASE / "netlify-site" / "články html" / "recepty" / "recepty-manifest.json"

TITLE_RE = re.compile(r"<title[^>]*>([^<]*)</title>", re.IGNORECASE | re.DOTALL)
# Tag: #slovo nebo #více slov (ukončení: mezera před dalším #, konec tagu u interpunkce)
# Slova z písmen (česká abeceda + číslice v názvu); max. 6 slov – aby tag nenarostl do celé věty
_WORD = r"[0-9A-Za-záčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+(?:-[0-9A-Za-záčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+)*"
TAG_RE = re.compile(
    rf"#\s*({_WORD}(?:\s+{_WORD}){{0,5}})",
    re.UNICODE,
)

# Jen „barvy“ z CSS (#rgb / #rrggbb) – ne jako tag bylinky
_HEX_ONLY = re.compile(r"^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$")


def html_plain_text_for_tags(html: str) -> str:
    """Text z HTML bez <style>/<script> a bez značek – aby # v CSS nešly za tagy."""
    html = re.sub(r"<style[^>]*>.*?</style>", " ", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<!--.*?-->", " ", html, flags=re.DOTALL)
    html = re.sub(r"<[^>]+>", " ", html)
    html = (
        html.replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
    )
    return html


def norm_name(s: str) -> str:
    s = s.strip()
    if "(" in s:
        s = s.split("(", 1)[0].strip()
    s = s.casefold()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = re.sub(r"[-_]+", " ", s)
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def extract_tags(text: str) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for m in TAG_RE.finditer(text):
        raw = m.group(1).strip().rstrip(".,;:!?)")
        if not raw or len(raw) < 2:
            continue
        if _HEX_ONLY.match(raw):
            continue
        if not re.search(r"[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]", raw):
            continue
        key = norm_name(raw)
        if key and key not in seen:
            seen.add(key)
            out.append(raw)
    return out


def plant_stems() -> list[tuple[str, str]]:
    """(norm_name stem, filename)"""
    rows: list[tuple[str, str]] = []
    for p in sorted(ROSTLINY_DIR.glob("*.html"), key=lambda x: x.name.casefold()):
        if p.is_file():
            rows.append((norm_name(p.stem), p.name))
    return rows


def match_tag_to_file(tag: str, stems: list[tuple[str, str]]) -> str | None:
    """Vrátí název souboru článku nebo None. Krátké nejednoznačné slovo (např. „bez“ u více druhů) nespáruje."""
    nt = norm_name(tag)
    if not nt:
        return None
    by_ns = {ns: fn for ns, fn in stems}
    if nt in by_ns:
        return by_ns[nt]
    # Stem začíná tagem jako prvním slovem (např. tag „bez černý“ → „bez cerny …“)
    prefixed = [(ns, fn) for ns, fn in stems if ns.startswith(nt + " ")]
    if len(prefixed) == 1:
        return prefixed[0][1]
    if len(prefixed) > 1:
        return None
    # Tag je delší / stem je prefix tagu (zřídka)
    for ns, fn in stems:
        if nt.startswith(ns) and len(ns) >= 4 and nt != ns:
            return fn
    return None


def href_recept(fname: str) -> str:
    return "/články html/recepty/" + quote(fname)


def main() -> int:
    if not RECEPTY_DIR.is_dir():
        print(f"Chyba: {RECEPTY_DIR}", file=sys.stderr)
        return 1
    stems = plant_stems()
    recipes_out: list[dict] = []
    by_plant: dict[str, list[dict]] = {}

    for p in sorted(RECEPTY_DIR.glob("*.html"), key=lambda x: x.name.casefold()):
        if p.name == "recepty-manifest.json":
            continue
        if not p.is_file():
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        m = TITLE_RE.search(text)
        title = re.sub(r"\s+", " ", m.group(1).strip()) if m else p.stem
        tags_raw = extract_tags(html_plain_text_for_tags(text))
        tags_norm = [norm_name(t) for t in tags_raw]
        entry = {
            "file": p.name,
            "title": title,
            "tags": tags_raw,
            "tagsNorm": tags_norm,
        }
        recipes_out.append(entry)
        for t in tags_raw:
            pfn = match_tag_to_file(t, stems)
            if not pfn:
                continue
            by_plant.setdefault(pfn, [])
            href = href_recept(p.name)
            pair = {"title": title, "href": href}
            if pair not in by_plant[pfn]:
                by_plant[pfn].append(pair)

    # Seznam článků o rostlinách (normovaný stem → soubor) pro skript recept-hashtagy.js
    plant_files = [{"norm": ns, "file": fn} for ns, fn in stems]

    manifest = {
        "recipes": recipes_out,
        "recipesByPlantFile": by_plant,
        "plantFiles": plant_files,
    }
    OUT_MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    manifest_text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    OUT_MANIFEST.write_text(manifest_text, encoding="utf-8")

    try:
        NETLIFY_MANIFEST.parent.mkdir(parents=True, exist_ok=True)
        NETLIFY_MANIFEST.write_text(manifest_text, encoding="utf-8")
    except OSError as e:
        print(f"Varování: nepovedlo se zkopírovat manifest do netlify-site ({e})", file=sys.stderr)

    # Rozcestník
    rows: list[str] = []
    for r in sorted(recipes_out, key=lambda x: x["title"].casefold()):
        url = href_recept(r["file"])
        tag_note = ""
        if r["tags"]:
            tag_note = (
                ' <span class="recepty-tag-note">('
                + ", ".join("#" + html.escape(t) for t in r["tags"])
                + ")</span>"
            )
        norms_joined = "|".join(r["tagsNorm"]) if r["tagsNorm"] else ""
        rows.append(
            f'      <li class="recepty-item" data-tags-norm="{html.escape(norms_joined, quote=True)}"><a href="{html.escape(url, quote=True)}">'
            f"{html.escape(r['title'])}</a>{tag_note}</li>"
        )
    n = len(rows)
    list_html = "\n".join(rows) if rows else '      <li class="muted">Zatím žádné recepty – přidej HTML soubory do složky <code>články html/recepty</code> v projektu.</li>'

    OUT_INDEX.parent.mkdir(parents=True, exist_ok=True)
    OUT_INDEX.write_text(
        f"""<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recepty a návody</title>
  <link rel="stylesheet" href="/css/app.css">
</head>
<body class="clanky-app-body">
  <a href="/" class="clanky-back-home">← Hlavní menu</a>
  <div class="clanky-container">
    <div class="clanky-title-block">
      <h1>Recepty a návody</h1>
      <p class="clanky-subtitle">Recepty z projektu. Uvnitř receptu označ související bylinky tagem <strong>#název</strong> (např. <strong>#bez černý</strong>) – u článku dané bylinky se pak zobrazí odkaz na recept.</p>
      <p class="clanky-meta-links"><a href="/clanky-o-rostlinach/">Články o rostlinách</a> · <a href="/vyhledavani/">Databáze rostlin</a></p>
    </div>
    <div class="clanky-search-panel">
      <div class="clanky-results-counter">
        <div class="clanky-results-header">Počet receptů</div>
        <div class="clanky-results-value" id="recepty-count-num" aria-live="polite">{n}</div>
      </div>
      <div class="clanky-search-container">
        <div class="clanky-search-wrapper">
          <label class="visually-hidden" for="recepty-search">Hledat recept</label>
          <input type="search" id="recepty-search" class="clanky-search-field" placeholder="🔍 Hledat v názvu nebo tagu…" autocomplete="off">
        </div>
      </div>
    </div>
    <ul id="recepty-list" class="clanky-list">
{list_html}
    </ul>
    <div class="page-actions clanky-page-actions">
      <a class="btn-primary" href="/">Zpět na menu</a>
    </div>
  </div>
  <script>
(function() {{
  var input = document.getElementById("recepty-search");
  var list = document.getElementById("recepty-list");
  var numEl = document.getElementById("recepty-count-num");
  if (!input || !list) return;
  var items = list.querySelectorAll(".recepty-item");
  function stripDiacritics(s) {{
    try {{ return s.normalize("NFD").replace(/\\p{{M}}/gu, ""); }} catch (e) {{ return s; }}
  }}
  var params = new URLSearchParams(location.search);
  var tagParam = params.get("tag");
  var tagFromUrl = false;
  if (tagParam) {{
    input.value = decodeURIComponent(tagParam);
    tagFromUrl = true;
  }}
  function filter() {{
    var q = stripDiacritics((input.value || "").trim().toLowerCase());
    var n = 0;
    items.forEach(function(li) {{
      var show = false;
      if (!q) {{
        show = true;
      }} else if (tagFromUrl) {{
        var norms = (li.getAttribute("data-tags-norm") || "").split("|").filter(Boolean);
        show = norms.some(function(s) {{
          return stripDiacritics(s.toLowerCase()) === q;
        }});
      }} else {{
        var t = stripDiacritics(li.textContent.toLowerCase());
        show = t.indexOf(q) !== -1;
      }}
      li.style.display = show ? "" : "none";
      if (show) n++;
    }});
    if (numEl) numEl.textContent = String(n);
  }}
  input.addEventListener("input", function() {{ tagFromUrl = false; filter(); }});
  filter();
}})();
  </script>
</body>
</html>
""",
        encoding="utf-8",
    )

    print(f"OK: {len(recipes_out)} receptů, manifest {OUT_MANIFEST.relative_to(BASE)}, index {OUT_INDEX.relative_to(BASE)}")

    _patch_rostliny_recepty_script()
    return 0


RECEPTY_JS = '<script src="/js/clanek-recepty.js" defer></script>\n'


def _patch_rostliny_recepty_script() -> None:
    """Do každého článku o rostlině přidá načtení skriptu pro odkazy na recepty (idempotentně)."""
    if not ROSTLINY_DIR.is_dir():
        return
    needle = "clanek-recepty.js"
    n = 0
    for p in sorted(ROSTLINY_DIR.glob("*.html"), key=lambda x: x.name.casefold()):
        if not p.is_file():
            continue
        s = p.read_text(encoding="utf-8", errors="replace")
        if needle in s:
            continue
        low = s.lower()
        if "</body>" not in low:
            continue
        s = re.sub(r"(</body\s*>)", RECEPTY_JS + r"\1", s, count=1, flags=re.IGNORECASE)
        p.write_text(s, encoding="utf-8")
        n += 1
    if n:
        print(f"OK: přidán skript receptů do {n} souborů v {ROSTLINY_DIR.relative_to(BASE)}")


if __name__ == "__main__":
    raise SystemExit(main())
