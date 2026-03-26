/**
 * V článcích o rostlinách: tlačítka na recepty, které v textu obsahují tag #… pro tuto bylinku.
 * Manifest generuje _generate_recepty_data.py → články html/recepty/recepty-manifest.json
 */
(function () {
  var MANIFEST_URL = encodeURI("/články html/recepty/recepty-manifest.json");

  var css =
    ".plant-recipe-links{margin:0 0 1.25rem 0;padding:0.85rem 1rem;border-radius:10px;border:1px solid #c8e6c9;background:linear-gradient(rgba(241,248,244,0.95),rgba(241,248,244,0.95));box-shadow:0 2px 6px rgba(61,107,74,0.08);}" +
    ".plant-recipe-links-title{margin:0 0 0.6rem 0;font-size:1.05rem;font-weight:700;color:#2e7d32;font-family:Georgia,'Times New Roman',serif;}" +
    ".plant-recipe-links-buttons{display:flex;flex-wrap:wrap;gap:0.5rem;}" +
    ".plant-recipe-btn{display:inline-block;padding:0.45rem 0.9rem;border-radius:999px;border:2px solid #81c784;background:#fff;color:#2e7d32;font-weight:600;text-decoration:none;font-size:1rem;font-family:Georgia,'Times New Roman',serif;transition:background 0.2s,border-color 0.2s,transform 0.15s;}" +
    ".plant-recipe-btn:hover{background:#e8f5e9;border-color:#4caf50;transform:translateY(-1px);}";

  (function injectStyles() {
    if (document.getElementById("clanek-recepty-styles")) return;
    var st = document.createElement("style");
    st.id = "clanek-recepty-styles";
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  })();

  function currentFileName() {
    var path = location.pathname || "";
    var parts = path.split("/").filter(function (p) {
      return p.length > 0;
    });
    var last = parts[parts.length - 1] || "";
    try {
      return decodeURIComponent(last);
    } catch (e) {
      return last;
    }
  }

  function run(data) {
    var fname = currentFileName();
    if (!fname || !data || !data.recipesByPlantFile) return;
    var list = data.recipesByPlantFile[fname];
    if (!list || !list.length) return;

    var root = document.querySelector(".bylinky-clanek .article-body");
    if (!root) return;

    var wrap = document.createElement("div");
    wrap.className = "plant-recipe-links";
    wrap.setAttribute("aria-label", "Recepty s touto bylinkou");

    var title = document.createElement("p");
    title.className = "plant-recipe-links-title";
    title.textContent = "Recepty s touto bylinkou";
    wrap.appendChild(title);

    var nav = document.createElement("div");
    nav.className = "plant-recipe-links-buttons";

    list.forEach(function (r) {
      var a = document.createElement("a");
      a.className = "plant-recipe-btn";
      a.href = r.href || "#";
      a.textContent = r.title || "";
      nav.appendChild(a);
    });

    wrap.appendChild(nav);

    var intro = root.querySelector("section.article-intro");
    var introRow = intro ? intro.closest(".section-row") : null;
    if (introRow && introRow.parentNode) {
      introRow.parentNode.insertBefore(wrap, introRow.nextSibling);
    } else if (intro && intro.parentNode) {
      intro.parentNode.insertBefore(wrap, intro.nextSibling);
    } else {
      root.insertBefore(wrap, root.firstChild);
    }
  }

  fetch(MANIFEST_URL, { credentials: "same-origin" })
    .then(function (r) {
      if (!r.ok) throw new Error("manifest");
      return r.json();
    })
    .then(run)
    .catch(function () {
      /* tichý fail – článek funguje i bez manifestu */
    });
})();
