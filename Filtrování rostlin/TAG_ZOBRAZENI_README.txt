Soubor: tag_zobrazeni.json
=========================

Tento soubor řídí, jak se tagy (hodnoty filtrů) zobrazují na tlačítkách v rozhraní.

  • Klíč = hodnota tak, jak je uložena v datech (bez diakritiky, s podtržítky)
  • Hodnota = text, který se zobrazí na tlačítku (s diakritikou, s mezerami)

Příklady:
  "zluta"     → "žlutá"
  "cervena"   → "červená"
  "zanety_dychacich_cest" → "záněty dýchacích cest"

Jak upravit zobrazení:
  1. Otevřete tag_zobrazeni.json v editoru.
  2. Upravte hodnotu u příslušného klíče (nebo přidejte nový řádek ve tvaru "klic": "Zobrazený text").
  3. Uložte soubor a znovu spusťte generátor: python generate_html.py

Chcete-li přepsat jeden text zobrazení všude v seznamu (všechny stejné hodnoty najednou):
  python generate_html.py --replace-display "původní text" "nový text"
  Např.: python generate_html.py --replace-display "červená" "červená (světlá)"
  U všech položek, které měly zobrazení „původní text“, se rovnou nastaví „nový text“.

Chcete-li nahradit slovo uvnitř všech zobrazení (bez ohledu na okolní text):
  python generate_html.py --replace-display-substring "cisti" "čistí"
  Všechna „cisti“ v textech na tlačítkách se změní na „čistí“ (i v „cisti ledviny“ → „čistí ledviny“ atd.).

Pro znovu vyexportování výchozí mapy ze skriptu:
  python generate_html.py --export-tag-map

(Přepíše tag_zobrazeni.json aktuální vestavěnou mapou z generate_html.py.)
