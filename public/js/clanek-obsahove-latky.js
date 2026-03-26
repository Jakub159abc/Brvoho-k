/**
 * V článcích o rostlinách: sekce „Obsahové látky“ — odkazy na aplikaci /obsahove-latky/aplikace.html
 */
(function () {
  var BASE = "/obsahove-latky/aplikace.html";

  function norm(s) {
    if (!s) return "";
    try {
      s = s.normalize("NFD").replace(/\p{M}/gu, "");
    } catch (e) {
      s = s.replace(/[\u0300-\u036f]/g, "");
    }
    return s.toLowerCase().replace(/\s+/g, " ").trim();
  }

  /** České názvy skupin z článků → data-group slug v aplikaci Obsahové látky */
  var SKUPINA_SLUG = {
    flavonoidy: "fenolicke-latky",
    "fenolicke latky": "fenolicke-latky",
    "fenolické látky": "fenolicke-latky",
    glykosidy: "glykosidy",
    glykosid: "glykosidy",
    vitaminy: "vitaminy",
    vitamíny: "vitaminy",
    "minerální látky": "mineralni-latky",
    "mineralni latky": "mineralni-latky",
    mineraly: "mineralni-latky",
    alkaloidy: "alkaloidy",
    aminokyseliny: "aminokyseliny",
    "barviva rostlin": "barviva-rostlin",
    barviva: "barviva-rostlin",
    cukry: "cukry",
    "další bioaktivní látky": "dalsi-bioaktivni-latky",
    fytosteroly: "fytosteroly",
    horciny: "horciny",
    "hořčiny": "horciny",
    kanabinoidy: "kanabinoidy",
    kurkuminoidy: "kurkuminoidy",
    "mastné kyseliny": "mastne-kyseliny",
    "organické kyseliny": "organicke-kyseliny",
    polysacharidy: "polysacharidy",
    "polysacharidy a vláknina": "polysacharidy",
    "pryskyřice a balzámy": "pryskyrice-a-balzamy",
    saponiny: "saponiny",
    "silice / esenciální oleje": "silice--esencialni-oleje",
    silice: "silice--esencialni-oleje",
    "sirné sloučeniny": "sirne-slouceniny",
    "terpeny a terpenoidy": "terpeny-a-terpenoidy",
    terpeny: "terpeny-a-terpenoidy",
    terpenoidy: "terpeny-a-terpenoidy",
    fenoly: "fenolicke-latky",
    taniny: "fenolicke-latky",
  };

  function slugForGroupLabel(text) {
    var k = norm(text);
    if (SKUPINA_SLUG[k]) return SKUPINA_SLUG[k];
    return null;
  }

  function enhanceSection(section) {
    section.querySelectorAll("p.substance-group-heading").forEach(function (ph) {
      var strong = ph.querySelector("strong");
      if (!strong || strong.querySelector("a")) return;
      var label = (strong.textContent || "").trim();
      var slug = slugForGroupLabel(label);
      if (!slug) return;
      var a = document.createElement("a");
      a.href = BASE + "?skupina=" + encodeURIComponent(slug);
      a.className = "clanek-obsah-skupina-link";
      while (strong.firstChild) a.appendChild(strong.firstChild);
      strong.appendChild(a);
    });

    var sawObsahH2 = false;
    Array.prototype.forEach.call(section.children, function (c) {
      if (c.tagName === "H2") {
        var t = c.querySelector(".heading-title");
        if (t && norm(t.textContent || "").indexOf("obsahove latky") !== -1) sawObsahH2 = true;
        return;
      }
      if (!sawObsahH2 || c.tagName !== "UL") return;
      c.querySelectorAll(":scope > li").forEach(function (li) {
        if (li.querySelector("a")) return;
        var txt = (li.textContent || "").trim();
        if (!txt) return;
        var a = document.createElement("a");
        a.href = BASE + "?latka=" + encodeURIComponent(txt);
        a.className = "clanek-obsah-latka-link";
        a.textContent = txt;
        li.textContent = "";
        li.appendChild(a);
      });
    });
  }

  function run() {
    if (!document.getElementById("clanek-obsahove-latky-style")) {
      var st = document.createElement("style");
      st.id = "clanek-obsahove-latky-style";
      st.textContent =
        ".clanek-obsah-latka-link,.clanek-obsah-skupina-link{color:#1b5e20;text-decoration:underline;text-underline-offset:2px;cursor:pointer}" +
        ".clanek-obsah-latka-link:hover,.clanek-obsah-skupina-link:hover{color:#0d3d12}";
      document.head.appendChild(st);
    }
    var sections = document.querySelectorAll(".bylinky-clanek .article-body .article-grid-cell section");
    sections.forEach(function (sec) {
      var h2 = sec.querySelector("h2.article-heading .heading-title");
      if (!h2) return;
      var ht = norm(h2.textContent);
      if (ht.indexOf("obsahove latky") === -1) return;
      enhanceSection(sec);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
