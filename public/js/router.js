/**
 * Klientské routování (History API). Cesty odpovídají zadání.
 */

function normalizePath(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/';
  return p === '' ? '/' : p;
}

/**
 * @returns {{ name: string, params: Record<string, string>, query: URLSearchParams }}
 */
export function parseRoute() {
  const path = normalizePath(window.location.pathname);
  const query = new URLSearchParams(window.location.search);

  if (path === '/') {
    return { name: 'home', params: {}, query };
  }
  if (path === '/plants') {
    return { name: 'plants', params: {}, query };
  }
  let m = path.match(/^\/plant\/([^/]+)$/);
  if (m) {
    return { name: 'plantDetail', params: { id: decodeURIComponent(m[1]) }, query };
  }
  if (path === '/substances') {
    return { name: 'substances', params: {}, query };
  }
  m = path.match(/^\/substance\/([^/]+)$/);
  if (m) {
    return { name: 'substanceDetail', params: { id: decodeURIComponent(m[1]) }, query };
  }
  if (path === '/recipes') {
    return { name: 'recipes', params: {}, query };
  }
  if (path === '/calendar') {
    return { name: 'calendar', params: {}, query };
  }
  if (path === '/mental') {
    return { name: 'mental', params: {}, query };
  }
  if (path === '/obsahove-latky') {
    return { name: 'obsahoveLatky', params: {}, query };
  }

  return { name: 'notFound', params: {}, query };
}

/**
 * @param {string} path - např. "/plants" nebo "/plant/medunka?x=1"
 * @param {{ replace?: boolean }} [opts]
 */
export function navigate(path, opts = {}) {
  const { replace = false } = opts;
  if (replace) {
    window.history.replaceState(null, '', path);
  } else {
    window.history.pushState(null, '', path);
  }
  window.dispatchEvent(new CustomEvent('app:route'));
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * Delegace kliků na interní odkazy (stejný origin, bez modifierů).
 */
export function initLinkDelegation(root, handler) {
  root.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[data-spa-link]');
    if (!a) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    let url;
    try {
      url = new URL(href, window.location.origin);
    } catch {
      return;
    }
    if (url.origin !== window.location.origin) return;
    e.preventDefault();
    navigate(url.pathname + url.search + url.hash);
    if (typeof handler === 'function') handler(url);
  });
}

export function onRoute(callback) {
  window.addEventListener('popstate', () => callback());
  window.addEventListener('app:route', () => callback());
}
