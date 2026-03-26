#!/usr/bin/env bash
# Spustí se na Netlify (Linux) při deployi. Sestaví složku netlify-site/.
set -euo pipefail
cd "$(dirname "$0")"
if command -v python3 &>/dev/null; then
  exec python3 _build_netlify_site.py
fi
if command -v python &>/dev/null; then
  exec python _build_netlify_site.py
fi
echo "Chyba: nenalezen Python 3 (zkuste python3 nebo python)." >&2
exit 1
