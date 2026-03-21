/**
 * Filtrování rostlin a receptů.
 */

/**
 * @param {object[]} plants
 * @param {{ q?: string, tags?: string[] }} filters
 */
export function filterPlants(plants, filters = {}) {
  const q = (filters.q || '').trim().toLowerCase();
  const tags = filters.tags || [];
  return plants.filter((p) => {
    if (q) {
      const blob = `${p.name} ${(p.description || '')} ${(p.tags || []).join(' ')}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    if (tags.length) {
      const pt = p.tags || [];
      const ok = tags.every((t) => pt.includes(t));
      if (!ok) return false;
    }
    return true;
  });
}

/**
 * @param {object[]} recipes
 * @param {{ tags?: string[] }} filters
 */
export function filterRecipesByTags(recipes, tags = []) {
  if (!tags.length) return recipes;
  return recipes.filter((r) => {
    const rt = r.tags || [];
    return tags.some((t) => rt.includes(t));
  });
}

/**
 * Recepty související s rostlinou podle průniku tagů.
 * @param {object} plant
 * @param {object[]} recipes
 */
export function recipesForPlant(plant, recipes) {
  const pt = plant?.tags || [];
  if (!pt.length) return [];
  return recipes.filter((r) => {
    const rt = r.tags || [];
    return rt.some((t) => pt.includes(t));
  });
}

/**
 * Unikátní seznam tagů ze všech rostlin.
 * @param {object[]} plants
 */
export function collectPlantTags(plants) {
  const s = new Set();
  plants.forEach((p) => (p.tags || []).forEach((t) => s.add(t)));
  return [...s].sort((a, b) => a.localeCompare(b, 'cs'));
}

/**
 * @param {object[]} recipes
 */
export function collectRecipeTags(recipes) {
  const s = new Set();
  recipes.forEach((r) => (r.tags || []).forEach((t) => s.add(t)));
  return [...s].sort((a, b) => a.localeCompare(b, 'cs'));
}

/**
 * @param {object[]} substances
 * @param {string} q
 */
export function filterSubstances(substances, q) {
  const needle = (q || '').trim().toLowerCase();
  if (!needle) return substances;
  return substances.filter(
    (s) =>
      (s.name || '').toLowerCase().includes(needle) ||
      (s.description || '').toLowerCase().includes(needle)
  );
}
