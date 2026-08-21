---
name: run-blume-one
description: Build, run, and screenshot the blume.one Jekyll start page. Use when asked to start the site, preview a change, or take a screenshot of a section (e.g. the CS2, ARC Raiders, or Deadlock sections).
---

This is a static Jekyll site (Ruby/Bundler) with no client-side build step. Drive it by starting `jekyll serve` and screenshotting it with the Playwright driver at `.claude/skills/run-blume-one/driver.mjs` — there is no `chromium-cli` on this machine, so use the driver script instead. All paths below are relative to the repo root.

**This environment is Windows + Git Bash (MSYS)**, not Linux — several steps below exist specifically to work around that (path mangling, no `lsof`). If you're on a real Linux container, the `lsof`/lack-of-`taskkill` gotchas won't apply, but the rest holds.

## Prerequisites

- Ruby + Bundler with the gems in `Gemfile.lock` already installed (this session reused an existing gem environment — `bundle exec jekyll serve` worked without running `bundle install` first; on a genuinely fresh clone run `bundle install`).
- Node.js, and the project's `playwright` devDependency (`package.json` at repo root) installed via `npm install`.
- A Playwright-managed Chromium browser binary — separate from any system Chrome. First time only:

```bash
npx playwright install chromium
```

This downloads ~300MB to a shared machine-wide cache (`~/AppData/Local/ms-playwright` on Windows), so it only needs to happen once per machine, not per clone.

## Setup

```bash
npm install
```

## Run (agent path)

Check whether a server is already up before starting another — the user likely has one running for their own testing, and it's already good to drive:

```bash
curl -sf http://localhost:4000/ >/dev/null && echo "already up" || echo "need to start it"
```

Only if nothing answered, start the dev server in the background and poll until it's serving (default port 4000):

```bash
bundle exec jekyll serve > /tmp/jekyll.log 2>&1 &
disown
timeout 30 bash -c 'until curl -sf http://localhost:4000/ >/dev/null; do sleep 1; done' && echo UP || cat /tmp/jekyll.log
```

Then drive it with the screenshot driver:

```bash
MSYS_NO_PATHCONV=1 node .claude/skills/run-blume-one/driver.mjs \
  --path "/#deadlock" --selector "#deadlock" \
  --out .claude/skills/run-blume-one/shot.png --width 1440 --height 1000
```

`MSYS_NO_PATHCONV=1` is required in Git Bash — see Gotchas. Use a **relative** path for `--out` (as above), not an absolute `/tmp/...` one — see Gotchas for why. Drop `--selector` to screenshot the full page instead of one element. Exit code is 1 if the page logged any console errors (printed to stderr) even though the screenshot still gets written — check the file, don't just trust the exit code.

| flag | meaning | default |
|---|---|---|
| `--base` | server origin | `http://localhost:4000` |
| `--path` | path (+ hash) to navigate to | `/` |
| `--selector` | CSS selector to screenshot; omit for full page | none (full page) |
| `--out` | output PNG path | `screenshot.png` |
| `--width`, `--height` | viewport size | `1440`, `1000` |

**Don't stop the server when done.** The user runs their own manual testing against the same dev server — killing it after a verification pass pulls it out from under them. Leave it running; only stop it if the user asks, or if you need to restart it (e.g. after a `_config.yml` change Jekyll doesn't hot-reload) — in which case stop the specific PID you started, not whatever else may be listening.

If you do need to stop a server — **`lsof` is not available in this Git Bash**, use `netstat` + `taskkill` instead:

```bash
netstat -ano | grep ":4000" | grep LISTENING   # note the PID(s) in the last column
taskkill //PID <pid> //F
```

Before starting a new instance, check whether one is already listening on 4000 (same command) — if so, reuse it instead of launching another; repeated backgrounded launches without a clean stop leave stale listeners piling up on the port.

## Run (human path)

```bash
bundle exec jekyll serve   # → http://localhost:4000, Ctrl-C to stop
```

## Test

No automated test suite. Visual verification via the driver above (screenshot + zero console errors) is the check.

---

## Gotchas

- **Git Bash mangles leading-slash arguments.** `--path "/#deadlock"` gets rewritten to something like `C:/Program Files/Git/#deadlock`, which then fails as `page.goto: Cannot navigate to invalid URL`. Fix: prefix the command with `MSYS_NO_PATHCONV=1`.
- **`MSYS_NO_PATHCONV=1` also stops `/tmp/...` from meaning what Bash thinks it means.** With conversion disabled, Node receives `/tmp/foo.png` literally and resolves it as drive-root (`C:\tmp\foo.png`) — a different, usually-nonexistent directory from Git Bash's own `/tmp` (which is actually `C:\Users\<you>\AppData\Local\Temp`). The screenshot silently "disappears" from where you expect it. Fix: always pass a **relative** `--out` path (e.g. inside the skill dir) when using `MSYS_NO_PATHCONV=1`, never an absolute POSIX one.
- **No `lsof` on this machine.** The usual `lsof -ti:PORT | xargs kill` one-liner silently no-ops (command not found, swallowed by `2>/dev/null`) — it looks like it worked but doesn't. Use `netstat -ano | grep ":PORT"` to find the PID and `taskkill //PID <pid> //F` to kill it.
- **A 404 console error for `/favicon.ico` is expected**, not a regression — this site has no favicon. The driver reports it as a console error (exit code 1); don't chase it.
- **First Playwright run on a new machine needs its own browser download** (`npx playwright install chromium`) even if `playwright` itself is already an npm dependency — the npm package and the browser binary are fetched separately.

## Troubleshooting

- **`page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL`, log shows a Windows path instead of your URL path**: Git Bash path mangling, see Gotchas — rerun with `MSYS_NO_PATHCONV=1`.
- **`browserType.launch: Executable doesn't exist at ...chromium_headless_shell-<rev>...`**: Playwright's npm package version doesn't match the cached browser revision. Run `npx playwright install chromium`.
- **`curl -sf http://localhost:4000/` never comes up**: check `/tmp/jekyll.log` — most likely `Address already in use`, meaning a previous `jekyll serve` is still bound to the port from an earlier run that wasn't stopped (see the `netstat`/`taskkill` gotcha above).
