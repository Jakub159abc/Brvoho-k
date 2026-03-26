# one-off patch for editor.html — run from repo root
import pathlib

p = pathlib.Path(__file__).resolve().parent / "editor.html"
text = p.read_text(encoding="utf-8")
old_start = "        function substanceFilterScript() {"
old_end = "        }\n\n        function substanceExtraCss() {"
i = text.find(old_start)
if i == -1:
    raise SystemExit("start not found")
j = text.find(old_end, i)
if j == -1:
    raise SystemExit("end not found")
new_fn = """        /** Webnode export bez <script>: skryje filtry/vyhledávání, zobrazí celý obsah. */
        function substanceStaticExportCss() {
          return '.brvoho-substance-page-root.substance-export-static .substance-filter-bar,' +
            '.brvoho-substance-page-root.substance-export-static .substance-filter-hint,' +
            '.brvoho-substance-page-root.substance-export-static .substance-search-wrap,' +
            '.brvoho-substance-page-root.substance-export-static .substance-subgroup-buttons,' +
            '.brvoho-substance-page-root.substance-export-static .substance-substance-buttons { display:none !important; }' +
            '.brvoho-substance-page-root.substance-export-static .substance-group-subgroups-question,' +
            '.brvoho-substance-page-root.substance-export-static .substance-group-substances-question { display:none !important; }' +
            '.brvoho-substance-page-root.substance-export-static .substance-page-group { display:block !important; }' +
            '.brvoho-substance-page-root.substance-export-static .substance-subgroup-panel,' +
            '.brvoho-substance-page-root.substance-export-static .substance-substance-article { display:block !important; }';
        }

        function substanceExtraCss() {"""
text2 = text[:i] + new_fn + text[j + len("        }\n\n        function substanceExtraCss() {") :]
text2 = text2.replace(
    "var fullStyle = frag.style + '\\n' + extra;",
    "var fullStyle = frag.style + '\\n' + extra + '\\n' + substanceStaticExportCss();",
)
text2 = text2.replace(
    'var wrapOpen = \'<div class="bylinky-clanek brvoho-substance-page-root">\';',
    'var wrapOpen = \'<div class="bylinky-clanek brvoho-substance-page-root substance-export-static">\';',
)
text2 = text2.replace(
    "var htmlBlock = '<style type=\"text/css\">\\n' + fullStyle + '</style>\\n' + wrapOpen + articleInner + wrapClose + '\\n' + substanceFilterScript();",
    "var htmlBlock = '<style type=\"text/css\">\\n' + fullStyle + '</style>\\n' + wrapOpen + articleInner + wrapClose;",
)
text2 = text2.replace(
    "doc: '<!DOCTYPE html>\\n<html lang=\"cs\">\\n<head>\\n  <meta charset=\"UTF-8\">\\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\\n  <title>' + escapeHtml(title) + '</title>\\n  <style type=\"text/css\">\\n' + fullStyle + '  </style>\\n</head>\\n<body>\\n' + wrapOpen + articleInner + wrapClose + '\\n' + substanceFilterScript() + '\\n</body>\\n</html>',",
    "doc: '<!DOCTYPE html>\\n<html lang=\"cs\">\\n<head>\\n  <meta charset=\"UTF-8\">\\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\\n  <title>' + escapeHtml(title) + '</title>\\n  <style type=\"text/css\">\\n' + fullStyle + '  </style>\\n</head>\\n<body>\\n' + wrapOpen + articleInner + wrapClose + '\\n</body>\\n</html>',",
)
if "substanceFilterScript" in text2:
    raise SystemExit("substanceFilterScript still referenced")
p.write_text(text2, encoding="utf-8")
print("OK")
