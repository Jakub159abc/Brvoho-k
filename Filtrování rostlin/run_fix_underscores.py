# Spusťte z tohoto adresáře: python run_fix_underscores.py
import re
import os
import json

dir = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(dir, "tag_zobrazeni.json")

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

def repl(m):
    v = m.group(1)
    return ': "' + v.replace("_", " ") + '"'

out = re.sub(r': "([^"]*)"', repl, content)

with open(path, "w", encoding="utf-8") as f:
    f.write(out)

# Znovu načíst a zformátovat (odstavec 2)
data = json.loads(out)
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Hotovo: v oranžových textech (hodnotách) nahrazeno _ mezerou. Soubor:", path)
