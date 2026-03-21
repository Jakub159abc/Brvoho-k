/**
 * Načítá JSON z /data a drží jednoduchou cache.
 */
const cache = new Map();

export async function loadJson(fileBase) {
  if (cache.has(fileBase)) {
    return cache.get(fileBase);
  }
  const url = new URL(`../data/${fileBase}.json`, import.meta.url);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Nelze načíst ${fileBase}.json (${res.status})`);
  }
  const data = await res.json();
  cache.set(fileBase, data);
  return data;
}

export async function loadAllData() {
  const [plants, substances, recipes] = await Promise.all([
    loadJson('plants'),
    loadJson('substances'),
    loadJson('recipes'),
  ]);
  return { plants, substances, recipes };
}

export function clearDataCache() {
  cache.clear();
}
