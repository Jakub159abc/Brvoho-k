/**
 * Výstup z generátoru: Filtrování rostlin/output.html
 * Relativně k public/js/ → ../../Filtrování rostlin/output.html
 */
export function getPlantsOutputPrimaryUrl() {
  return new URL('../../Filtrování rostlin/output.html', import.meta.url).href;
}

/** Záloha po zkopírování do public (např. nasazení jen složky public) */
export function getPlantsOutputFallbackUrl() {
  return new URL('../plants-output.html', import.meta.url).href;
}

/**
 * Zkusí primární cestu (zdrojový generátor), pak zálohu v public/plants-output.html.
 * Jinak vrátí primární URL (iframe zobrazí chybu jen pokud soubor opravdu chybí).
 */
export async function resolvePlantsOutputUrl() {
  const primary = getPlantsOutputPrimaryUrl();
  const fallback = getPlantsOutputFallbackUrl();
  for (const url of [primary, fallback]) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      if (r.ok) return url;
    } catch {
      /* file:// nebo nedostupná síť */
    }
  }
  return primary;
}
