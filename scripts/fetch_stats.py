import json, os, sys

input_file = sys.argv[1] if len(sys.argv) > 1 else "/tmp/itch_response.json"

with open(input_file) as f:
    data = json.load(f)

games = data.get("games", [])
game = next((g for g in games if "tiem-sua-xe-chu-tu" in (g.get("url") or "")), None)

stats = {
    "views_count": game.get("views_count", 14) if game else 14,
    "downloads_count": game.get("downloads_count", 0) if game else 0,
    "ratings_count": game.get("ratings_count", 0) if game else 0,
}

print("Stats:", stats)
os.makedirs("public", exist_ok=True)
with open("public/stats.json", "w") as f:
    json.dump(stats, f)
