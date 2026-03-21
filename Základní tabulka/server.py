#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Lokální server pro webové rozhraní zápisu GPT textu do tabulky bylinek.
Spusťte: python server.py
Poté otevřete v prohlížeči: http://127.0.0.1:5000
"""

from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory

# Import logiky z existujícího parseru
from parse_gpt_to_table import (
    CSV_PATH,
    load_csv,
    save_csv,
    parse_gpt_text,
    find_row_index,
    apply_to_table,
)

app = Flask(__name__, static_folder=".", static_url_path="")


@app.route("/")
def index():
    return send_from_directory(Path(__file__).parent, "index.html")


@app.route("/api/update", methods=["POST"])
def api_update():
    """Přijme pasted text z GPT a zapíše do tabulky."""
    text = request.get_data(as_text=True) or ""
    text = text.strip()
    if not text:
        return jsonify({"ok": False, "error": "Žádný text nebyl vložen."}), 400

    data = parse_gpt_text(text)
    if not data.get("nazev_lat") and not data.get("nazev_cz"):
        return (
            jsonify(
                {
                    "ok": False,
                    "error": "Ve vstupu chybí (nazev_lat) nebo (nazev_cz).",
                }
            ),
            400,
        )

    if not CSV_PATH.exists():
        return (
            jsonify(
                {
                    "ok": False,
                    "error": f"Tabulka nenalezena: {CSV_PATH}",
                }
            ),
            500,
        )

    header, rows = load_csv(CSV_PATH)
    idx = find_row_index(rows, data)
    if idx is None:
        nazev = data.get("nazev_cz") or data.get("nazev_lat") or "(neuvedeno)"
        return (
            jsonify(
                {
                    "ok": False,
                    "error": f"V tabulce nebyl nalezen řádek pro rostlinu „{nazev}“. Zkontrolujte, že (nazev_cz) nebo (nazev_lat) odpovídá záznamu v tabulce.",
                }
            ),
            404,
        )

    rows = apply_to_table(header, rows, data)
    save_csv(CSV_PATH, header, rows)
    nazev = data.get("nazev_cz") or data.get("nazev_lat")
    return jsonify({"ok": True, "message": f"Řádek pro „{nazev}“ byl aktualizován."})


if __name__ == "__main__":
    print("Server běží na http://127.0.0.1:5000")
    print("Otevřete tuto adresu v prohlížeči, vložte text z GPT a klikněte na Zapsat do tabulky.")
    app.run(host="127.0.0.1", port=5000)
