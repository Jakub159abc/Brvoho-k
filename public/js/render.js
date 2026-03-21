/**
 * Vykreslování karet a seznamů do kontejnerů.
 */

const MONTH_NAMES = [
  'Leden',
  'Únor',
  'Březen',
  'Duben',
  'Květen',
  'Červen',
  'Červenec',
  'Srpen',
  'Září',
  'Říjen',
  'Listopad',
  'Prosinec',
];

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s ?? '';
  return d.innerHTML;
}

export function renderPlantCards(plants, container) {
  if (!container) return;
  if (!plants.length) {
    container.innerHTML = '<p class="muted">Žádná rostlina neodpovídá filtru.</p>';
    return;
  }
  container.innerHTML = plants
    .map(
      (p) => `
    <article class="card">
      <h3 class="card__title"><a data-spa-link href="/plant/${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
      <p class="card__excerpt">${esc((p.description || '').slice(0, 160))}${(p.description || '').length > 160 ? '…' : ''}</p>
      <div class="tags">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    </article>`
    )
    .join('');
}

export function renderSubstanceCards(substances, container) {
  if (!container) return;
  if (!substances.length) {
    container.innerHTML = '<p class="muted">Žádná látka.</p>';
    return;
  }
  container.innerHTML = substances
    .map((s) => {
      const desc = s.description || '';
      const short = desc.length > 140 ? `${desc.slice(0, 140)}…` : desc;
      return `
    <article class="card">
      <h3 class="card__title"><a data-spa-link href="/substance/${encodeURIComponent(s.id)}">${esc(s.name)}</a></h3>
      <p class="card__excerpt">${esc(short)}</p>
    </article>`;
    })
    .join('');
}

export function renderRecipeCards(recipes, container) {
  if (!container) return;
  if (!recipes.length) {
    container.innerHTML = '<p class="muted">Žádný recept neodpovídá výběru.</p>';
    return;
  }
  container.innerHTML = recipes
    .map(
      (r) => `
    <article class="card">
      <h3 class="card__title">${esc(r.name)}</h3>
      <p class="card__excerpt">${esc(r.description || '')}</p>
      <div class="tags">${(r.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    </article>`
    )
    .join('');
}

/**
 * Detail rostliny: látky, sklizeň → kalendář, recepty podle tagů.
 */
export function renderPlantDetail(plant, substancesById, relatedRecipes, container) {
  if (!container || !plant) {
    if (container) container.innerHTML = '<p class="muted">Rostlina nenalezena.</p>';
    return;
  }
  const subs = (plant.substances || [])
    .map((id) => substancesById[id])
    .filter(Boolean);
  const harvestLinks = (plant.harvestMonths || [])
    .map(
      (m) =>
        `<a data-spa-link class="pill" href="/calendar?plant=${encodeURIComponent(plant.id)}&month=${m}">${esc(MONTH_NAMES[m - 1] || m)}</a>`
    )
    .join(' ');
  container.innerHTML = `
    <header class="detail-head">
      <h1>${esc(plant.name)}</h1>
      <p class="lead">${esc(plant.description || '')}</p>
    </header>
    <section class="detail-section">
      <h2>Účinné látky</h2>
      <ul class="link-list">
        ${subs
          .map(
            (s) =>
              `<li><a data-spa-link href="/substance/${encodeURIComponent(s.id)}">${esc(s.name)}</a></li>`
          )
          .join('')}
      </ul>
    </section>
    <section class="detail-section">
      <h2>Sklizeň (měsíce)</h2>
      <p>Kliknutím otevřete kalendář s vybranou rostlinou${harvestLinks ? ` a zvýrazněním měsíce.` : '.'}</p>
      <div class="pills">${harvestLinks || '<span class="muted">Údaj není k dispozici.</span>'}</div>
      <p><a data-spa-link class="btn-secondary" href="/calendar?plant=${encodeURIComponent(plant.id)}">Celý kalendář pro tuto rostlinu</a></p>
    </section>
    <section class="detail-section">
      <h2>Související recepty</h2>
      ${
        relatedRecipes.length
          ? `<div class="cards cards--compact">${relatedRecipes
              .map(
                (r) => `
            <article class="card card--small">
              <h3 class="card__title">${esc(r.name)}</h3>
              <p class="card__excerpt">${esc(r.description || '')}</p>
              <div class="tags">${(r.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
            </article>`
              )
              .join('')}</div>`
          : '<p class="muted">K této rostlině nejsou v databázi přiřazeny recepty podle štítků.</p>'
      }
      <p><a data-spa-link class="btn-secondary" href="/recipes?fromPlant=${encodeURIComponent(plant.id)}">Filtrovat recepty podle této rostliny</a></p>
    </section>
  `;
}

export function renderSubstanceDetail(substance, container) {
  if (!container) return;
  if (!substance) {
    container.innerHTML = '<p class="muted">Látka nenalezena.</p>';
    return;
  }
  container.innerHTML = `
    <header class="detail-head">
      <h1>${esc(substance.name)}</h1>
      <p class="lead">${esc(substance.description || '')}</p>
    </header>
  `;
}

/**
 * Kalendář: 12 měsíců, zvýraznění sklizně; volitelně plantId a month z query.
 */
export function renderCalendar(plants, plantId, highlightMonth, container) {
  if (!container) return;
  const plant = plantId ? plants.find((p) => p.id === plantId) : null;
  const months = MONTH_NAMES.map((name, i) => {
    const month = i + 1;
    const inHarvest = plant && (plant.harvestMonths || []).includes(month);
    const isHl = highlightMonth && String(month) === String(highlightMonth);
    const classes = ['cal-month'];
    if (inHarvest) classes.push('cal-month--harvest');
    if (isHl) classes.push('cal-month--focus');
    const href = plant
      ? `/calendar?plant=${encodeURIComponent(plant.id)}&month=${month}`
      : `/calendar?month=${month}`;
    return `<a data-spa-link class="${classes.join(' ')}" href="${href}">${esc(name)}</a>`;
  });
  container.innerHTML = `
    <div class="calendar-toolbar">
      ${
        plant
          ? `<p>Zobrazení pro: <strong>${esc(plant.name)}</strong>. Měsíce sběru jsou zvýrazněny.</p>
             <p><a data-spa-link href="/calendar">Zrušit filtr rostliny</a></p>`
          : '<p class="muted">Vyberte rostlinu v detailu (odkaz „Celý kalendář“) nebo zvolte měsíc.</p>'
      }
    </div>
    <div class="calendar-grid">${months.join('')}</div>
  `;
}

export { MONTH_NAMES };
