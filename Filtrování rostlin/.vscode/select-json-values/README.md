# Vybrat výskyty jen za dvojtečkou (JSON hodnoty)

- V souborech **JSON** se při **Ctrl+Shift+L** vyberou jen výskyty v **hodnotách** (oranžový text za dvojtečkou). Klíče (modrý text) se neoznačí.
- **Modrý text (klíče) je zamčený** – při pokusu o úpravu se změna hned vrátí zpět.

## Instalace v Cursoru

1. **Ctrl+Shift+P** → **Developer: Install Extension from Location...**
2. Zvolte složku: `Filtrování rostlin\.vscode\select-json-values`
3. Po instalaci případně **Reload Window**.

## Pokud se při Ctrl+Shift+L stále označí i modrý text

Výchozí příkaz editoru může mít přednost. V JSON souborech ho vypněte a nechte jen tento:

1. **Ctrl+Shift+P** → **Preferences: Open Keyboard Shortcuts (JSON)**  
   (nebo **Soubor → Předvolby → Klávesové zkratky** a ikona „otevřít keybindings.json“)
2. Do pole `keybindings` přidejte (s čárkou podle okolního JSON):

```json
{
  "key": "ctrl+shift+l",
  "command": "-editor.action.selectHighlights",
  "when": "editorTextFocus && (editorLangId == json || editorLangId == jsonc)"
}
```

Tím se v JSON vypne výchozí „Select All Occurrences“ a zůstane jen „Vybrat výskyty jen za dvojtečkou“.

**Záložní zkratka** (funguje vždy): **Ctrl+Alt+Shift+V** – to samé jako Ctrl+Shift+L (jen hodnoty).

## Použití

- V souboru `.json` **klikněte na slovo v hodnotě** (oranžový text) nebo ho vyberte.
- Stiskněte **Ctrl+Shift+L** (nebo **Ctrl+Alt+Shift+V**).
- Označí se jen stejná slova v hodnotách; modrý text se neoznačí a nejde přepsat.
- Napište nový text – přepíše se jen na vybraných místech (hodnoty).

Příkaz lze spustit i z Command Palette: **Vybrat výskyty jen za dvojtečkou (hodnoty JSON)**.
