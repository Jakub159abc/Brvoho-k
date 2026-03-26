# Netlify – struktura webové aplikace

**Rychlý přehled pro začátečníky:** přečtěte si **[NETLIFY-CO-A-JAK.md](NETLIFY-CO-A-JAK.md)** (co se na Netlify veze, co je `public/` vs `netlify-site/`, co udělat po pushi).

## Zdroj aplikace: složka `site/`

Tady je **menu a jednotlivé sekce** (ne editor ani Excel nástroje):

- `site/index.html` – úvodní stránka s dlaždicemi (jako `menu-vše nejen o bylinkách/menu.html`), odkazy vedou na lokální cesty
- `site/css/app.css` – společné styly pro menu i vnitřní stránky
- `site/vyhledavani/index.html` – šablona / nápověda; **při buildu** se v `netlify-site` nahradí souborem **`Filtrování rostlin/output.html`** (hotové filtrování rostlin)
- `site/clanky-o-rostlinach/index.html` – rozcestník k článkům; **při každém buildu** se přegeneruje skriptem **`_generate_clanky_rostliny_index.py`** ze seznamu `články html/rostliny/*.html`
- `site/clanky-o-rostlinach/sprava.html` – návod ke správě seznamu a odkazům
- `site/dusevni-priciny-nemoci/index.html` – šablona / nápověda; **při buildu** se v `netlify-site` nahradí souborem **`Duševní příčiny nemocí/index.html`** (filtrování podle problému / nemoci)
- `site/recepty-a-navody/index.html` – Recepty a návody
- `site/kalendar-sberu/index.html` – **při každém buildu** se přepíše z `kalendář sběru/kalendar_sberu.html` (hlavní tabulka)

Do `netlify-site/kalendar-sberu/` se navíc kopíruje `prehled.html` (stejná tabulka) a `sprava.html` ze `kalendar_sberu_sprava.html`.

## Důležité: www.brvohorik.cz vs Netlify

**Doména `www.brvohorik.cz` běží na Webnode** – obsah tam **není** tento git repozitář. Když tam u kalendáře vidíš starý rozcestník („Vyberte zobrazení…“) nebo jiný vzhled, jde o **stránky nahrané / vytvořené ve Webnode**, ne o deploy z GitHubu.

Aby se na hlavní adrese zobrazila verze z gitu (tabulka z tohoto projektu), je potřeba např.:

- v **Netlify** připojit custom domain `brvohorik.cz` a v DNS směrovat doménu na Netlify (podle jejich návodu), **nebo**
- **ručně** nahrát obsah složky `netlify-site/` (nebo aspoň `kalendar-sberu/`) do odpovídající cesty ve Webnode.

Novou verzi z gitu uvidíš na **URL tvého Netlify site** (např. `https://něco.netlify.app`), pokud je repozitář k Netlify připojený.

## Build výstupu pro nasazení

Z kořene projektu:

```bash
python _build_netlify_site.py
```

Vznikne složka **`netlify-site/`** (to nasazuje Netlify podle `netlify.toml`). Při deployi z GitHubu Netlify **spouští** `_build_netlify_site.py` (viz `netlify.toml`), takže vyhledávání se vždy sestaví z aktuálního `output.html`.

## Netlify

- **Publish directory:** `netlify-site`
- **Build command:** v `netlify.toml` je `true` (žádná kompilace na serveru)

Po změnách v `site/` nebo v článcích/kalendáři znovu spusťte build a commitněte aktualizovanou `netlify-site/`.

## Poznámka k původnímu menu

Soubor `menu-vše nejen o bylinkách/menu.html` zůstal jako reference; **živá verze pro Netlify je `site/index.html`**.
