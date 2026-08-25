# Deadlock Items Tab — Data Sourcing

How `_data/deadlock-items.json` and the item card/tooltip assets were built. There's no build step — this is a one-time generated snapshot. If item balance changes in-game, it needs to be regenerated manually using the process below.

## Item list, icons, tiers, costs

- The 156 current shop items (Weapon/Vitality/Spirit × Tier 1–4) were identified from the user's local game asset export, under `panorama/images/items/{weapon,vitality,spirit}/*.png` — one icon per item, 156 files total, which matched exactly against deadlock.wiki's reported item count.
- Names/tiers/costs were cross-referenced against [deadlock.wiki/Items](https://deadlock.wiki/Items) and later validated byte-for-byte against `Data:ItemCards.json` (see below) — zero mismatches on tier/cost/category once the icon slugs were mapped to wiki names.
- 14 of the 156 icon filenames didn't slugify cleanly from their wiki display name (e.g. `basic_magazine.png` for "Extended Magazine", `backstabber.png` for "Stalker") and were matched by elimination/theming; all 14 were later confirmed correct via exact name matches in `Data:ItemCards.json`.

## Card art, textures, category icons

All sourced directly from the game's own asset export (not the wiki), under `panorama/images/shop/`:

- `catalog/cards/card_backer_{category}_t{tier}_psd.png` → per-tier card background art
- `catalog/cards/icon_mask0{1,2,3}_psd.png` → torn-edge icon masks
- `catalog/cards/shopitem_paperwear0{1-4}_psd.png` → paper wear/scratch overlays
- `catalog/catalog_shop_tab_icon_{category}_psd.png` → the Weapon/Vitality/Spirit column icons
- `catalog/catalog_tooltip_bg_modifies_{category}_psd.png` → tooltip background gradient (the non-`_modifies` variant has a baked-in bottom bar that doesn't stretch cleanly to variable tooltip heights, so this one was used instead)
- `catalog/catalog_tooltip_header_{category}_psd.png` → tooltip header texture
- `panorama/images/icons/properties/*.svg` → the stat-type icon set (damage/health/duration/cooldown/conditions/etc.) used in tooltip stat rows

The `tier-badge-shape.svg` and `tier-num-{1-4}.svg` corner-badge assets, plus the general card layout (icon area / name plate / tier badge / active-tag / imbue-tag positioning), were reverse-engineered from a SingleFile-saved copy of a deadlock.wiki hero page (the `.itembox` CSS component), since that's a faithful CSS recreation of the in-game shop card — the wiki page itself doesn't ship the raw game textures, so the two sources (game files for art, wiki page for exact layout/CSS) were combined.

## Tooltip data (description, stats, cooldowns, upgrade chain)

Sourced from two public MediaWiki `Data:` pages that deadlock.wiki's own item-card Lua module (`Module:Infobox_item`) reads from — fetched directly as JSON via `?action=raw`:

- `https://deadlock.wiki/Data:ItemCards.json` — per-item `Description`, `Cost`, `Tier`, `Slot`, `Activation`, `IsImbue`, `Components` (what it upgrades from), and up to 4 `InfoN` ability blocks (`Innate`/`Passive`/`Active`), each with a `DescKey`, `Cooldown`/`ChargeUp`, and `Main`/`Alt` stat arrays.
- `https://deadlock.wiki/Data:StatLinks.json` — maps some stat keys to display labels (e.g. `AbilityCastRange` → "Ability Range"). Incomplete — most labels are humanized from the raw key instead (`camelCase` → `Title Case`), so occasional wording differs slightly from the exact in-game text (e.g. "Max Slow" instead of "Max Move Speed").

Notes on the extraction logic (in case this needs to be redone):

- **`DescKey` resolution**: an `InfoN` block's description isn't inline — `DescKey` is a string like `#upgrade_goose_egg_active_desc` that must be matched against item keys by **longest prefix match** (strip the `#`, find the longest existing item key that the string starts with, e.g. `upgrade_goose_egg`), then that matched item's own `Description` field is used. A same-item DescKey (an item describing itself) resolves the same way.
- **`_hint` suffix**: a few `DescKey`s end in `_hint` (e.g. `#upgrade_ultimate_burst_hint`) and have no real description text anywhere in the data — they represent an inherited-but-unexpanded ability (shown in-game as e.g. "Mystic Slow effects" with no stat box). Synthesized as `"{upgradesFrom name} effects"` using the item's own `Components` relationship, since that pattern matched the real UI exactly on inspection.
- **`_upgrade`/`_note` suffixes**: no visible content in-game; dropped entirely.
- **Status-effect stats** (e.g. `StatusEffectStun`) carry `Value: null` — they're boolean flags, not numbers. Hardcoded a small lookup (`StatusEffectStun` → "Stun" + gold swirl icon, etc.) since only 5 such keys exist across the whole dataset.
- **`Main` vs `Alt`** stats map to different tooltip layouts: `Main` renders as the grouped multi-column stat box, `Alt` as plain rows below it — matching the real tooltip's visual distinction between primary and secondary numbers.
- **Upgrade chain**: `Components` on an item lists what it upgrades *from*; the reverse ("upgrades to") is derived by scanning every other item's `Components` array for a match.

## Known gaps

- Exact stat *label* wording sometimes differs from the real UI (see StatLinks note above) — values, signs, and units are accurate, just not always the exact phrasing.
- Flavor/mechanic notes that aren't tied to a stat (e.g. "This effect can only trigger once per target per ultimate.") aren't present in either `Data:ItemCards.json` or the wiki's Lua module source — likely a hardcoded UI string keyed off internal game logic that isn't exposed anywhere fetchable. Not reproduced.
- Legendary/Street Brawl–exclusive items are out of scope — only the 156 standard shop items are covered.
