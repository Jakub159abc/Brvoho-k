#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V tag_zobrazeni.json nahradí v každé hodnotě (oranžový text) _ mezerou - na úrovni textu."""
import re
import os
import sys

if len(sys.argv) > 1:
    PATH = os.path.abspath(sys.argv[1])
else:
    PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tag_zobrazeni.json")

if not os.path.isfile(PATH):
    print("Soubor nenalezen:", PATH)
    sys.exit(1)

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

# Nahradit _ mezerou jen v hodnotách (text za ": ")
def repl(m):
    val = m.group(1)
    if "_" in val:
        return ': "' + val.replace("_", " ") + '"'
    return m.group(0)

new_content = re.sub(r': "([^"]*)"', repl, content)
count = content.count('": "') - new_content.count('_')  # zjednodušeně: počet nahrazených
changed = sum(1 for m in re.finditer(r': "([^"]*)"', content) if "_" in m.group(1))

with open(PATH, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Hotovo. V hodnotách (za dvojtečkou) nahrazeno _ mezerou.")
