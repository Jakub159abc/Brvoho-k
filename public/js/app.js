import { loadAllData } from './dataLoader.js';
import { parseRoute, onRoute, initLinkDelegation } from './router.js';
import {
  filterRecipesByTags,
  recipesForPlant,
  collectRecipeTags,
  filterSubstances,
} from './filter.js';
import * as render from './render.js';
import { resolvePlantsOutputUrl } from './plantsOutputUrl.js';

const appEl = document.getElementById('app');

/** @type {{ plants: object[], substances: object[], recipes: object[] } | null} */
let data = null;

function substancesByIdMap() {
  const m = {};
  (data?.substances || []).forEach((s) => {
    m[s.id] = s;
  });
  return m;
}

async function fetchPartial(name) {
  const url = new URL(`../pages/${name}.html`, import.meta.url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Chybí šablona stránky: ${name}`);
  return res.text();
}

async function mountShell(partialName) {
  appEl.innerHTML = await fetchPartial(partialName);
}

function fillRecipeTagSelect() {
  const sel = document.getElementById('recipe-tag-filter');
  if (!sel || !data) return;
  const tags = collectRecipeTags(data.recipes);
  sel.innerHTML = `<option value="">Všechny štítky</option>${tags
    .map((t) => `<option value="${escapeAttr(t)}">${escapeHtml(t)}</option>`)
    .join('')}`;
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s ?? '';
  return d.innerHTML;
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

async function mountPlantsSearchPage() {
  const src = await resolvePlantsOutputUrl();
  appEl.innerHTML = `<section class="page page--plants-embed">
    <iframe class="plants-iframe" title="Vyhledávání léčivých rostlin – filtrování" src="${escapeAttr(
      src
    )}" loading="lazy"></iframe>
  </section>`;
}

function setupSubstancesPage() {
  const root = document.getElementById('substances-root');
  const search = document.getElementById('substance-search');
  if (!root || !data) return;

  const run = () => {
    const list = filterSubstances(data.substances, search?.value || '');
    render.renderSubstanceCards(list, root);
  };
  search?.addEventListener('input', run);
  run();
}

function setupRecipesPage(query) {
  const root = document.getElementById('recipes-root');
  const tagSel = document.getElementById('recipe-tag-filter');
  const banner = document.getElementById('recipes-from-plant');
  if (!root || !data) return;

  fillRecipeTagSelect();

  const fromPlantId = query.get('fromPlant');
  const plant = fromPlantId ? data.plants.find((p) => p.id === fromPlantId) : null;

  if (banner) {
    if (plant) {
      banner.hidden = false;
      banner.innerHTML = `Zobrazují se recepty související s rostlinou <strong>${escapeHtml(
        plant.name
      )}</strong>. <a data-spa-link href="/recipes">Zobrazit všechny recepty</a>`;
    } else {
      banner.hidden = true;
      banner.innerHTML = '';
    }
  }

  const run = () => {
    let list = data.recipes;
    if (plant) {
      list = recipesForPlant(plant, data.recipes);
    }
    const t = tagSel?.value;
    if (t) {
      list = filterRecipesByTags(list, [t]);
    }
    render.renderRecipeCards(list, root);
  };

  tagSel?.addEventListener('change', run);
  run();
}

function setupCalendarPage(query) {
  const root = document.getElementById('calendar-root');
  if (!root || !data) return;
  const plantId = query.get('plant') || '';
  const month = query.get('month') || '';
  render.renderCalendar(data.plants, plantId || null, month || null, root);
}

async function route() {
  if (!data) return;

  const { name, params, query } = parseRoute();

  try {
    switch (name) {
      case 'home': {
        await mountShell('home');
        break;
      }
      case 'plants': {
        await mountPlantsSearchPage();
        break;
      }
      case 'plantDetail': {
        await mountShell('plantDetail');
        const plant = data.plants.find((p) => p.id === params.id);
        const byId = substancesByIdMap();
        const related = plant ? recipesForPlant(plant, data.recipes) : [];
        render.renderPlantDetail(plant, byId, related, document.getElementById('plant-detail-root'));
        break;
      }
      case 'substances': {
        await mountShell('substances');
        setupSubstancesPage();
        break;
      }
      case 'substanceDetail': {
        await mountShell('substanceDetail');
        const s = data.substances.find((x) => x.id === params.id);
        render.renderSubstanceDetail(s, document.getElementById('substance-detail-root'));
        break;
      }
      case 'recipes': {
        await mountShell('recipes');
        setupRecipesPage(query);
        break;
      }
      case 'calendar': {
        await mountShell('calendar');
        setupCalendarPage(query);
        break;
      }
      case 'mental': {
        await mountShell('mentalCauses');
        break;
      }
      default: {
        appEl.innerHTML =
          '<section class="page"><h1>Stránka nenalezena</h1><p><a data-spa-link href="/">Zpět na úvod</a></p></section>';
      }
    }
  } catch (e) {
    console.error(e);
    appEl.innerHTML = `<section class="page"><h1>Chyba</h1><p>${escapeHtml(String(e.message))}</p></section>`;
  }
}

async function bootstrap() {
  try {
    data = await loadAllData();
  } catch (e) {
    appEl.innerHTML = `<section class="page"><h1>Data se nepodařilo načíst</h1><p>${escapeHtml(
      String(e.message)
    )}</p><p>Spusťte lokální server z kořene projektu (kvůli vyhledávání rostlin z <code>Filtrování rostlin/output.html</code>), např. <code>npx serve .</code> a otevřete <code>/public/index.html</code>, nebo zkopírujte <code>output.html</code> do <code>public/plants-output.html</code> a používejte <code>npx serve public</code>.</p></section>`;
    return;
  }

  initLinkDelegation(document.body);
  onRoute(() => {
    route();
  });
  await route();
}

bootstrap();
