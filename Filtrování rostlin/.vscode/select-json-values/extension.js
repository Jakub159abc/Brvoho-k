const vscode = require('vscode');

// Pro každý otevřený JSON dokument uchováváme „zamčený“ obsah klíčů (modrý text).
const savedKeyContentsByUri = new Map();

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSelectedWord(editor) {
  const doc = editor.document;
  const sel = editor.selection;
  let text = sel.isEmpty
    ? doc.getText(doc.getWordRangeAtPosition(sel.active))
    : doc.getText(sel);
  return text.trim();
}

/**
 * Najde všechny rozsahy klíčů v JSON (text uvnitř uvozovek před dvojtečkou, tedy modrý text).
 * Vrací pole { start, end } – pozice obsahu klíče bez uvozovek.
 */
function findKeyRanges(text) {
  const ranges = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === '"') {
      const keyStart = i + 1;
      i++;
      while (i < text.length) {
        if (text[i] === '\\' && i + 1 < text.length) {
          i += 2;
          continue;
        }
        if (text[i] === '"') {
          const keyEnd = i;
          i++;
          while (i < text.length && /\s/.test(text[i])) i++;
          if (i < text.length && text[i] === ':') {
            ranges.push({ start: keyStart, end: keyEnd });
          }
          break;
        }
        i++;
      }
    } else {
      i++;
    }
  }
  return ranges;
}

/**
 * Inicializuje nebo obnoví uložený obsah klíčů pro daný dokument.
 */
function ensureSavedKeyContents(doc) {
  const uri = doc.uri.toString();
  const text = doc.getText();
  const keyRanges = findKeyRanges(text);
  const contents = keyRanges.map(r => text.substring(r.start, r.end));
  savedKeyContentsByUri.set(uri, contents);
  return contents;
}

/**
 * Vrátí uložený obsah klíčů; pokud chybí, uloží z aktuálního dokumentu.
 */
function getSavedKeyContents(doc) {
  const uri = doc.uri.toString();
  let saved = savedKeyContentsByUri.get(uri);
  if (saved === undefined) {
    saved = ensureSavedKeyContents(doc);
  }
  return saved;
}

/**
 * Vrátí true, pokud na pozici i začíná řetězcová hodnota (ne objekt/pole/číslo/null/true/false).
 */
function isStringValueStart(text, i) {
  const c = text[i];
  if (c === '"') return true;
  if (c === '{' || c === '[') return false;
  if (c === 't' && text.substring(i, i + 4) === 'true') return false;
  if (c === 'f' && text.substring(i, i + 5) === 'false') return false;
  if (c === 'n' && text.substring(i, i + 4) === 'null') return false;
  if (c === '-' || (c >= '0' && c <= '9')) return false;
  return true;
}

/**
 * Najde pouze intervaly uvnitř ŘETĚZCOVÝCH hodnot v JSON.
 */
function findJsonStringValueRanges(text) {
  const ranges = [];
  const re = /:\s*"/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const afterQuote = m.index + m[0].length;
    if (afterQuote >= text.length) continue;
    if (!isStringValueStart(text, afterQuote)) continue;

    const valueStart = afterQuote;
    let i = valueStart;
    let valueEnd = -1;
    while (i < text.length) {
      const c = text[i];
      if (c === '\\' && i + 1 < text.length) {
        i += 2;
        continue;
      }
      if (c === '"') {
        valueEnd = i;
        break;
      }
      i++;
    }
    if (valueEnd !== -1) {
      ranges.push({ start: valueStart, end: valueEnd });
    }
  }
  return ranges;
}

function activate(context) {
  const isJsonDoc = (doc) => doc.languageId === 'json' || doc.languageId === 'jsonc';

  // Při otevření JSON uložíme obsah klíčů (modrý text) jako neměnný
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doc => {
      if (isJsonDoc(doc)) {
        ensureSavedKeyContents(doc);
      }
    })
  );

  // Po každé změně: pokud byl upraven modrý text (klíč), vrátíme ho zpět – modrý je vždy zamčený
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => {
      const doc = e.document;
      if (!isJsonDoc(doc)) return;

      const uri = doc.uri.toString();
      const currentText = doc.getText();
      const currentKeyRanges = findKeyRanges(currentText);
      const currentKeyContents = currentKeyRanges.map(r => currentText.substring(r.start, r.end));

      let saved = savedKeyContentsByUri.get(uri);
      if (saved === undefined) {
        saved = ensureSavedKeyContents(doc);
      }

      // Počet klíčů se změnil (přidán/odebrán řádek) – znovu zamkneme aktuální stav
      if (currentKeyRanges.length !== saved.length) {
        savedKeyContentsByUri.set(uri, currentKeyContents);
        return;
      }

      const edits = [];
      for (let i = 0; i < saved.length; i++) {
        if (currentKeyContents[i] !== saved[i]) {
          const r = currentKeyRanges[i];
          edits.push(
            vscode.TextEdit.replace(
              new vscode.Range(doc.positionAt(r.start), doc.positionAt(r.end)),
              saved[i]
            )
          );
        }
      }

      if (edits.length > 0) {
        const edit = new vscode.WorkspaceEdit();
        edit.set(doc.uri, edits);
        vscode.workspace.applyEdit(edit).then(() => {
          vscode.window.showInformationMessage('Klíče (modrý text) jsou zamčené – úpravy byly vráceny.');
        });
      }
    })
  );

  // Příkaz: vybrat výskyty jen v hodnotách
  const cmd = vscode.commands.registerCommand('selectJsonValues.selectInValues', function () {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const word = getSelectedWord(editor);
    if (!word) {
      vscode.window.showInformationMessage('Vyberte slovo nebo na něj klikněte.');
      return;
    }

    const doc = editor.document;
    const fullText = doc.getText();
    const valueRanges = findJsonStringValueRanges(fullText);
    const escaped = escapeRegex(word);
    const wordRegex = new RegExp(escaped, 'g');

    const selections = [];
    for (const { start: rangeStart, end: rangeEnd } of valueRanges) {
      const valueText = fullText.substring(rangeStart, rangeEnd);
      wordRegex.lastIndex = 0;
      let m;
      while ((m = wordRegex.exec(valueText)) !== null) {
        const absStart = rangeStart + m.index;
        const absEnd = absStart + m[0].length;
        selections.push(new vscode.Selection(doc.positionAt(absStart), doc.positionAt(absEnd)));
      }
    }

    if (selections.length === 0) {
      vscode.window.showInformationMessage('Žádný výskyt „' + word + '“ v hodnotách (za dvojtečkou) nebyl nalezen.');
      return;
    }

    editor.selections = selections;
    editor.revealRange(selections[0]);
    vscode.window.showInformationMessage('Vybráno ' + selections.length + ' výskytů v hodnotách.');
  });

  context.subscriptions.push(cmd);

  // U již otevřených JSON dokumentů uložíme klíče při aktivaci
  vscode.window.visibleTextEditors.forEach(editor => {
    if (isJsonDoc(editor.document)) {
      ensureSavedKeyContents(editor.document);
    }
  });
}

function deactivate() {}

module.exports = { activate, deactivate };
