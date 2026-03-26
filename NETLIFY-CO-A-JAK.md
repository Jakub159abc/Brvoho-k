# Netlify – co se nasazuje a co máte dělat

## Důležité: jsou tu dva „weby“ v jednom repozitáři

| Složka | K čemu je | Nasazuje se na Netlify? |
|--------|-----------|-------------------------|
| **`netlify-site/`** | Hotový statický web (menu, vyhledávání, články, kalendář…) | **Ano** – tohle Netlify opravdu zveřejňuje (`publish = netlify-site` v `netlify.toml`). |
| **`public/`** | Samostatná malá SPA (JavaScript, `/plants`, …) | **Ne** – pokud v Netlify nemáte jiné nastavení, tato složka se **vůbec nepoužívá**. |

Proto když řešíte „co funguje na Netlify“, myslelte **`netlify-site`**, ne `public`.

---

## Jak to má fungovat po kliknutí v menu

Úvodní stránka je **`/`** (soubor `netlify-site/index.html`). Menu odkazuje například na:

- **Vyhledávání rostlin** → `/vyhledavani/`
- **Články o rostlinách** → `/clanky-o-rostlinach/`
- **Duševní příčiny** → `/dusevni-priciny-nemoci/`
- **Recepty** → `/recepty-a-navody/`
- **Kalendář sběru** → `/kalendar-sberu/`

To jsou **normální složky s `index.html`**, ne jedna velká SPA. Stránka vyhledávání se při **buildu** na Netlify **vygeneruje** zkopírováním souboru **`Filtrování rostlin/output.html`** do `netlify-site/vyhledavani/index.html`. Sekce **Duševní příčiny nemocí** se zase bere ze souboru **`Duševní příčiny nemocí/index.html`** a kopíruje se do `netlify-site/dusevni-priciny-nemoci/index.html`. Obojí dělá skript `_build_netlify_site.py`.

---

## Co musíte udělat vy (krok za krokem)

1. **Mít repozitář na GitHubu** (nebo jinde) a **Netlify** k němu připojené (Deploy from Git).
2. Po každé změně obsahu, která má být na webu, udělat **commit a push**.
3. V Netlify počkat na **úspěšný deploy** (zelená fajfka). V logu buildu by měl být řádek podobný:  
   `OK: … souborů v …/netlify-site`
4. Otevřít **URL vašeho Netlify webu** (např. `https://něco.netlify.app`), **ne** soubor `index.html` z disku a **ne** omylem jiný projekt.

Pokud build **spadne** (červeně), Netlify může zobrazovat **starší verzi** – pak se může zdát, že „funguje jen menu“. Vždy zkontrolujte **Deploy log**.

---

## Lokální sestavení (stejné jako na Netlify)

Z kořene projektu (složka, kde je `_build_netlify_site.py`):

```bash
python _build_netlify_site.py
```

nebo `python3 …`. Tím se přepíše lokální složka `netlify-site/` – můžete ji otevřít v prohlížeči přes lokální server a ověřit, že `/vyhledavani/` obsahuje velkou stránku s filtrováním.

---

## Když „nejde nic kromě menu“

- **Build na Netlify neproběhl** – v Deploy logu hledejte chybu (často Python nebo chybějící složka `Filtrování rostlin`).
- **Otevíráte špatnou adresu** – musí být HTTPS z Netlify, ne `file:///…`.
- **Custom doména / cache** – zkuste anonymní okno nebo `Ctrl+F5`.

---

## Souvislost s `public/`

Složka **`public/`** je určená hlavně pro **vývoj SPA** jiným způsobem (jedna stránka + JavaScript). **Standardní Netlify deploy z tohoto repa** používá **`netlify-site`**, ne `public`. Neměňte v Netlify „Publish directory“ na `public`, pokud nechcete záměrně hostovat tu SPA místo tohoto statického webu.
