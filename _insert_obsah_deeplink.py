# -*- coding: utf-8 -*-
"""Vloží před </body> do obsahove-latky.html skript pro ?latka= & ?skupina=."""
from pathlib import Path

BASE = Path(__file__).resolve().parent
PATH = BASE / "obsahové látky" / "obsahove-latky.html"

DEEPLINK = r"""
<script>
(function () {
  function norm(s) {
    if (!s) return "";
    try {
      s = s.normalize("NFD").replace(/\p{M}/gu, "");
    } catch (e) {
      s = s.replace(/[\u0300-\u036f]/g, "");
    }
    return s.toLowerCase().replace(/\s+/g, " ").trim();
  }
  function applyFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var skupina = params.get("skupina");
    var latka = params.get("latka");
    var SK = {
      flavonoidy: "fenolicke-latky",
      "fenolicke latky": "fenolicke-latky",
      glykosidy: "glykosidy",
      vitaminy: "vitaminy",
      "minerální látky": "mineralni-latky",
      "mineralni latky": "mineralni-latky",
      alkaloidy: "alkaloidy",
      aminokyseliny: "aminokyseliny",
      saponiny: "saponiny",
      horciny: "horciny",
      terpeny: "terpeny-a-terpenoidy",
      fenoly: "fenolicke-latky"
    };
    function resolveSkupina(v) {
      if (!v) return null;
      var k = norm(v);
      if (SK[k]) return SK[k];
      var t = String(v).trim();
      if (/^[a-z0-9][a-z0-9-]*$/.test(t)) return t;
      return null;
    }
    skupina = resolveSkupina(skupina);
    var root = document.querySelector(".brvoho-substance-page-root");
    if (!root) return;
    var bar = root.querySelector(".substance-filter-bar");
    var groups = root.querySelectorAll(".substance-page-group");
    if (!bar || !groups.length) return;

    function clickShowAll() {
      var btn = bar.querySelector('.substance-filter-btn[data-show-all="1"]');
      if (btn) btn.click();
    }

    function activateGroupBySlug(gid) {
      if (!gid) return false;
      var btn = bar.querySelector('.substance-filter-btn[data-group="' + String(gid).replace(/"/g, "") + '"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }

    function findSubstanceButton(name) {
      var want = norm(name);
      if (!want) return null;
      clickShowAll();
      var candidates = root.querySelectorAll(".substance-substance-btn");
      var best = null;
      for (var i = 0; i < candidates.length; i++) {
        var t = norm(candidates[i].textContent || "");
        if (t === want) return candidates[i];
        if (t.indexOf(want) >= 0 || want.indexOf(t) >= 0) best = candidates[i];
      }
      return best;
    }

    if (latka) {
      var subBtn = findSubstanceButton(latka);
      if (subBtn) {
        var g = subBtn.closest(".substance-page-group");
        var gid = g ? g.getAttribute("data-group") : null;
        if (gid) activateGroupBySlug(gid);
        setTimeout(function () {
          subBtn.click();
          try {
            subBtn.scrollIntoView({ block: "center", behavior: "smooth" });
          } catch (e) {}
        }, 100);
        return;
      }
    }
    if (skupina) {
      if (activateGroupBySlug(skupina)) {
        setTimeout(function () {
          var vis = root.querySelector(".substance-page-group:not([style*='display: none'])") || root.querySelector(".substance-page-group");
          var first = vis && vis.querySelector(".substance-substance-btn");
          if (first) {
            try {
              first.scrollIntoView({ block: "center", behavior: "smooth" });
            } catch (e) {}
          }
        }, 100);
      }
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(applyFromQuery, 0);
    });
  } else {
    setTimeout(applyFromQuery, 0);
  }
})();
</script>
"""

def main() -> None:
    text = PATH.read_text(encoding="utf-8", errors="replace")
    needle = "</body>"
    if "applyFromQuery" in text:
        print("Already has deeplink script, skip")
        return
    if needle not in text:
        print("No </body> found")
        return
    text = text.replace(needle, DEEPLINK + "\n" + needle, 1)
    PATH.write_text(text, encoding="utf-8")
    print("OK:", PATH)


if __name__ == "__main__":
    main()
