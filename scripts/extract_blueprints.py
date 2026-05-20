"""
Fetches the ARC Raiders wiki blueprints table and merges location data
into _data/arc_raiders.json.

Usage: python scripts/extract_blueprints.py
"""

import json
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

WIKI_URL = "https://arcraiders.wiki/wiki/Blueprints"
DATA_FILE = Path(__file__).parent.parent / "_data" / "arc_raiders.json"


class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_table = False
        self.in_row = False
        self.in_cell = False
        self.rows = []
        self._current_row = []
        self._current_cell = []
        self._depth = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "table" and "wikitable" in attrs.get("class", ""):
            self.in_table = True
            self._depth = 0
        if self.in_table:
            if tag == "tr":
                self.in_row = True
                self._current_row = []
            elif tag in ("td", "th"):
                self.in_cell = True
                self._current_cell = []
            elif tag == "br" and self.in_cell:
                self._current_cell.append(",")

    def handle_endtag(self, tag):
        if self.in_table:
            if tag in ("td", "th") and self.in_cell:
                self._current_row.append(" ".join(self._current_cell).strip())
                self.in_cell = False
            elif tag == "tr" and self.in_row:
                if self._current_row:
                    self.rows.append(self._current_row)
                self.in_row = False
            elif tag == "table":
                self.in_table = False

    def handle_data(self, data):
        if self.in_cell:
            text = data.strip()
            if text:
                self._current_cell.append(text)


def fetch_wiki():
    req = urllib.request.Request(WIKI_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as r:
        return r.read().decode("utf-8")


def parse_table(html):
    parser = TableParser()
    parser.feed(html)
    rows = parser.rows

    if not rows:
        raise ValueError("No table rows found")

    header = [c.lower() for c in rows[0]]
    data_rows = rows[1:]

    def idx(row, *names):
        for name in names:
            for i, h in enumerate(header):
                if name in h and i < len(row):
                    return row[i]
        return ""

    result = {}
    for row in data_rows:
        name = idx(row, "blueprint")
        if not name:
            continue
        def split_field(raw):
            return [v.strip() for v in raw.split(",") if v.strip()] if raw else []

        result[name] = {
            "map": split_field(idx(row, "map [ 2 ]", "map")),
            "condition": split_field(idx(row, "map condition", "condition")),
            "containers": split_field(idx(row, "containers [ 2 ]", "containers", "source")),
        }

    return result


def normalize(s):
    """Lowercase + collapse whitespace for fuzzy matching."""
    return " ".join(s.lower().split())


def main():
    print("Fetching wiki...")
    html = fetch_wiki()

    print("Parsing table...")
    wiki = parse_table(html)
    print(f"  Found {len(wiki)} wiki entries")

    with open(DATA_FILE) as f:
        data = json.load(f)

    wiki_norm = {normalize(k): v for k, v in wiki.items()}

    matched = 0
    unmatched = []

    for bp in data["blueprints"]:
        key = normalize(bp["name"])
        # Try exact normalized match first
        loc = wiki_norm.get(key)
        # Fallback: "mag" ↔ "magazine"
        if not loc:
            alt = key.replace(" mag ", " magazine ").replace(" mag$", " magazine")
            loc = wiki_norm.get(alt) or wiki_norm.get(alt.replace("magazine", "mag"))
        if loc:
            bp["map"] = loc["map"]
            bp["condition"] = loc["condition"]
            bp["containers"] = loc["containers"]
            matched += 1
        else:
            unmatched.append(bp["name"])

    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

    print(f"\nMatched: {matched}/{len(data['blueprints'])}")
    if unmatched:
        print(f"Unmatched ({len(unmatched)}) — no location data added for these:")
        for name in unmatched:
            print(f"  - {name}")
    else:
        print("All blueprints matched.")

    print(f"\nWrote {DATA_FILE}")


if __name__ == "__main__":
    main()
