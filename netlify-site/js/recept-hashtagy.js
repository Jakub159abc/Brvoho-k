/**
 * Pod receptem: tlačítka z hashtagů (#slovo …) nalezených v celém textu receptu (úvod, nadpisy, buňky).
 * Manifest: _generate_recepty_data.py → recepty-manifest.json (recipes, plantFiles).
 */
(function () {
  var MANIFEST_URL = encodeURI("/články html/recepty/recepty-manifest.json");

  var WORD =
    "[0-9A-Za-záčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+(?:-[0-9A-Za-záčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+)*";
  /* #slovo nebo # slovo; až 6 slov (např. #bez černý) */
  var TAG_RE = new RegExp("#\\s*(" + WORD + "(?:\\s+" + WORD + "){0,5})", "gu");
  var HEX_ONLY = /^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;
  var HAS_LETTER = /[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/;

  var css =
    ".recipe-hashtag-section{width:100%;margin:0;padding:0 1rem;box-sizing:border-box;}" +
    ".recipe-hashtag-row{display:flex;flex-wrap:wrap;gap:0.5rem;padding:0.85rem 0 0;margin:0;width:100%;box-sizing:border-box;align-items:center;}" +
    ".recipe-hashtag-btn{display:inline-block;padding:0.4rem 0.85rem;border-radius:999px;border:2px solid #81c784;background:#fff;color:#2e7d32;font-weight:600;text-decoration:none;font-size:0.95rem;font-family:Georgia,'Times New Roman',serif;transition:background .2s,border-color .2s;}" +
    ".recipe-hashtag-btn:hover{background:#e8f5e9;border-color:#4caf50;}" +
    "span.recipe-hashtag-btn{cursor:default;opacity:.88;}";

  (function injectStyles() {
    if (document.getElementById("recept-hashtagy-styles")) return;
    var st = document.createElement("style");
    st.id = "recept-hashtagy-styles";
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  })();

  function htmlPlainText(html) {
    if (!html) return "";
    var s = String(html);
    s = s.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
    s = s.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
    s = s.replace(/<!--[\s\S]*?-->/g, " ");
    s = s.replace(/<[^>]+>/g, " ");
    s = s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    return s;
  }

  function normName(str) {
    var s = String(str).trim();
    if (s.indexOf("(") !== -1) s = s.split("(")[0].trim();
    try {
      s = s.toLowerCase();
      s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    } catch (e) {
      s = s.toLowerCase();
    }
    s = s.replace(/[-_]+/g, " ");
    s = s.replace(/[^a-z0-9 ]+/g, " ");
    s = s.replace(/\s+/g, " ");
    return s.trim();
  }

  function extractTags(text) {
    var seen = {};
    var out = [];
    var re = new RegExp(TAG_RE.source, "gu");
    var m;
    while ((m = re.exec(text)) !== null) {
      var raw = m[1].trim().replace(/[.,;:!?)]+$/g, "");
      if (!raw || raw.length < 2) continue;
      if (HEX_ONLY.test(raw)) continue;
      if (!HAS_LETTER.test(raw)) continue;
      var key = normName(raw);
      if (key && !seen[key]) {
        seen[key] = true;
        out.push(raw);
      }
    }
    return out;
  }

  /** Z manifestu recipes[] → mapa normovaného štítku → seznam receptů (bez duplicit podle href). */
  function buildRecipesByTagNorm(recipes) {
    var map = {};
    if (!recipes || !recipes.length) return map;
    for (var i = 0; i < recipes.length; i++) {
      var r = recipes[i];
      if (!r || !r.file) continue;
      var href = encodeURI("/články html/recepty/" + r.file);
      var norms = r.tagsNorm || [];
      for (var j = 0; j < norms.length; j++) {
        var key = norms[j];
        if (!key) continue;
        if (!map[key]) map[key] = [];
        var dup = map[key].some(function (x) {
          return x.href === href;
        });
        if (!dup) map[key].push({ title: r.title, href: href });
      }
    }
    return map;
  }

  function receptyNavodHrefForTag(normKey) {
    return "/recepty-a-navody/?tag=" + encodeURIComponent(normKey);
  }

  function matchTagToFile(tag, plantFiles) {
    if (!plantFiles || !plantFiles.length) return null;
    var byNorm = {};
    for (var i = 0; i < plantFiles.length; i++) {
      var p = plantFiles[i];
      if (p && p.norm) byNorm[p.norm] = p.file;
    }
    var nt = normName(tag);
    if (!nt) return null;
    if (byNorm[nt]) return byNorm[nt];
    var prefixed = [];
    for (var j = 0; j < plantFiles.length; j++) {
      var pf = plantFiles[j];
      if (pf.norm && pf.norm.indexOf(nt + " ") === 0) prefixed.push(pf.file);
    }
    if (prefixed.length === 1) return prefixed[0];
    if (prefixed.length > 1) return null;
    for (var k = 0; k < plantFiles.length; k++) {
      var row = plantFiles[k];
      if (!row.norm) continue;
      if (nt.indexOf(row.norm) === 0 && row.norm.length >= 4 && nt !== row.norm) return row.file;
    }
    return null;
  }

  function plantHref(fileName) {
    return encodeURI("/články html/rostliny/" + fileName);
  }

  function removeOldRow(root) {
    var old = root.querySelector(".recipe-hashtag-section");
    if (old && old.parentNode) old.parentNode.removeChild(old);
  }

  function findRecipeArticleBody() {
    var root = document.querySelector(".bylinky-clanek .article-body");
    if (root) return root;
    var intro = document.querySelector(".recipe-intro-content");
    if (intro) {
      var ab = intro.closest(".article-body");
      if (ab) return ab;
    }
    return document.querySelector("article.article .article-body");
  }

  function run(data) {
    var root = findRecipeArticleBody();
    if (!root) return;

    removeOldRow(root);
    var plain = htmlPlainText(root.innerHTML);
    var tags = extractTags(plain);

    if (!tags.length) return;

    var plantFiles = (data && data.plantFiles) || [];
    var recipesByTag = buildRecipesByTagNorm((data && data.recipes) || []);

    var wrap = document.createElement("div");
    wrap.className = "section-row section-row-left recipe-hashtag-section";
    var nav = document.createElement("nav");
    nav.className = "recipe-hashtag-row";
    nav.setAttribute("aria-label", "Štítky receptu");

    tags.forEach(function (tag) {
      var label = "#" + tag;
      var nt = normName(tag);
      var sameRecipes = nt && recipesByTag[nt] && recipesByTag[nt].length;
      var fn = matchTagToFile(tag, plantFiles);
      var el;
      if (sameRecipes) {
        el = document.createElement("a");
        el.className = "recipe-hashtag-btn";
        el.href = receptyNavodHrefForTag(nt);
        el.textContent = label;
        el.title = "Recepty se stejným štítkem";
      } else if (fn) {
        el = document.createElement("a");
        el.className = "recipe-hashtag-btn";
        el.href = plantHref(fn);
        el.textContent = label;
        el.title = "Článek o rostlině";
      } else {
        el = document.createElement("span");
        el.className = "recipe-hashtag-btn";
        el.textContent = label;
      }
      nav.appendChild(el);
    });

    wrap.appendChild(nav);

    var grid = root.querySelector(".article-two-columns");
    if (grid && grid.parentNode) {
      grid.parentNode.insertBefore(wrap, grid.nextSibling);
    } else {
      root.appendChild(wrap);
    }
  }

  fetch(MANIFEST_URL, { credentials: "same-origin" })
    .then(function (r) {
      if (!r.ok) throw new Error("manifest");
      return r.json();
    })
    .then(run)
    .catch(function () {
      run(null);
    });
})();
