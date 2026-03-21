# Netlify – struktura webové aplikace

## Zdroj aplikace: složka `site/`

Tady je **menu a jednotlivé sekce** (ne editor ani Excel nástroje):

- `site/index.html` – úvodní stránka s dlaždicemi (jako `menu-vše nejen o bylinkách/menu.html`), odkazy vedou na lokální cesty
- `site/css/app.css` – společné styly pro menu i vnitřní stránky
- `site/vyhledavani/index.html` – sekce Vyhledávání rostlin
- `site/clanky-o-rostlinach/index.html` – rozcestník k článkům
- `site/dusevni-priciny-nemoci/index.html` – Duševní příčiny nemocí
- `site/recepty-a-navody/index.html` – Recepty a návody
- `site/kalendar-sberu/index.html` – rozcestník k přehledu a správě kalendáře

Velké soubory kalendáře se při buildu kopírují z `kalendář sběru/` do `netlify-site/kalendar-sberu/` jako `prehled.html` a `sprava.html`.

## Build výstupu pro nasazení

Z kořene projektu:

```bash
python _build_netlify_site.py
```

Vznikne složka **`netlify-site/`** (to nasazuje Netlify podle `netlify.toml`).

## Netlify

- **Publish directory:** `netlify-site`
- **Build command:** v `netlify.toml` je `true` (žádná kompilace na serveru)

Po změnách v `site/` nebo v článcích/kalendáři znovu spusťte build a commitněte aktualizovanou `netlify-site/`.

## Poznámka k původnímu menu

Soubor `menu-vše nejen o bylinkách/menu.html` zůstal jako reference; **živá verze pro Netlify je `site/index.html`**.
