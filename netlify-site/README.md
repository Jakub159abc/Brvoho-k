# Webová aplikace (zdroj pro Netlify)

- **Úvod:** `index.html` – mřížka odkazů na sekce
- **Styly:** `css/app.css`
- **Sekce:** každá vlastní podsložka s `index.html` (můžete přidávat další `.html` soubory jako podstránky)

Build skript `_build_netlify_site.py` z této složky sestaví obsah `netlify-site/` a přidá články (`články html/`) a kalendář ze zdrojů v kořeni projektu.
