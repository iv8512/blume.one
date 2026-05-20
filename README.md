# blume.one

Start page built with Jekyll, primarily for use in the Steam overlay. Sections for CS2, Rust, and ARC Raiders — links, stats tools, practice commands, event schedules, and blueprint info.

## Development

```sh
bundle exec jekyll serve
```

## Data

- `_data/links.json` — navigation links for each game section
- `_data/arc_raiders.json` — blueprint list with images and wiki location data (run `python scripts/extract_blueprints.py` to refresh)
- `_data/events-schedule.json` — ARC Raiders event schedule, updated daily by a GitHub Actions workflow
