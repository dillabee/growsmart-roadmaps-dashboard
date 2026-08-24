# Implementation Plan: MVP → Full Build

**For:** the developer taking over this dashboard
**Assumes:** you know React/Python but nothing about this project. Read
`docs/superpowers/specs/2026-08-24-mvp-dashboard-spec.md` and the README
first. Work test-first where a task touches `scripts/build_data.py` —
the suite in `tests/` shows the pattern (small in-memory openpyxl
worksheets; assert on the transformed output). Commit after each task.

**Ground rules**

- One app, one dataset. Never fork per-community copies.
- Any change to rollup/rate math needs a test in `tests/test_build_data.py` first.
- Run before every push: `python -m pytest tests/ -v` and `npm run build`.
- Deploy: push built `dist/` to the `gh-pages` branch (see README). To get
  push-to-deploy automation, run `gh auth refresh -s workflow` once, then move
  `deploy/github-actions-deploy.yml.example` to `.github/workflows/deploy.yml`.

---

## Task 1 — Fix the CBP duplicates at the source

1. Open the workbook (path in spec); remove the 198 duplicate CBP rows
   (all of Houlton FY2022 appears twice, plus others).
2. Run `python scripts/build_data.py` — the "skipped N exact duplicate"
   warning should drop to 0.
3. Confirm Houlton FY2022 truck travelers still ≈ 90k in the output JSON.
4. Keep the dedupe code and its tests — they're the guardrail.

**Done when:** build prints no duplicate warning; tests pass.

## Task 2 — Restore CI deploy (needs one-time auth)

1. `gh auth refresh -h github.com -s workflow` (interactive, needs Dillion).
2. `git mv deploy/github-actions-deploy.yml.example .github/workflows/deploy.yml`
3. Push to main; verify the Actions run publishes Pages.
4. Delete the manual `gh-pages` push instructions from the README.

**Done when:** a push to `main` auto-deploys the site.

## Task 3 — Agriculture dataset (county-level)

Per the *Dashboard Data Guide*: agriculture data is county-only (Aroostook),
lives in the source workbook's Agriculture tab, and attaches only to
Aroostook communities' profiles (Houlton, Presque Isle, Van Buren, Danforth).

1. Test first: add a `build_agriculture(ws)` test asserting the output shape
   you design (suggest: `{indicator: {year: value}}` keyed at county level).
2. Implement in `build_data.py`; add the sheet to the `required` list only
   if it ships in the dashboard workbook — otherwise make it optional with a
   warning.
3. Add an "Agriculture" topic section in `Community.jsx`, rendered only when
   the community is in Aroostook County; label clearly as county-level data.
4. Add source note + Data Notes row (USDA Census of Agriculture, 5-year cadence).

**Done when:** Aroostook communities show the section; Calais/Machias don't.

## Task 4 — Location quotients

Blocked on: US 2025 QCEW baseline being added to the workbook (noted in the
Dashboard Data Guide). LQ = (local industry share of local employment) /
(US industry share of US employment).

1. Test first: `build_econ` emits `lq` per industry/year when a US row exists,
   `None` when it doesn't.
2. Add an LQ column to the industry chart's hover, or a small LQ bar chart
   (LQ > 1.25 = specialization — worth a callout style).

**Done when:** LQs match the hand-calculated tables in the ED Profiles.

## Task 5 — Topic pages (optional per strategy doc)

Promote Community-page sections to routes (`#/community/Houlton/housing`)
only if workshops show users need shareable per-topic links. The section
components are already self-contained — extraction is mechanical. Keep the
all-sections view as the default.

## Task 6 — Per-chart downloads (open decision)

If the client confirms they want them: Plotly has built-in PNG export
(`displayModeBar` config) — cheapest win. CSV: add a "Download data" link
per chart that serializes the already-loaded JSON slice. Decide with client
before building.

## Task 7 — Performance pass

- Code-split Plotly (dynamic `import()` in `Chart.jsx`) — it's ~1MB and the
  reason for the build-size warning.
- Consider `plotly.js-basic-dist-min` (bar/scatter only) — everything this
  dashboard draws is bar/scatter, so the basic bundle should suffice.

**Done when:** `npm run build` emits no chunk-size warning; site still renders.

## Task 8 — Year-2 update rehearsal (before training GrowSmart)

Dry-run the documented update path end to end with next year's workbook:
refresh workbook → `build_data.py` → review warnings → `pytest` →
`npm run build` → review every community page + print view → deploy.
Record the screen capture for the training package (per strategy doc:
walkthrough recording, written checklist, data dictionary).

---

## Deferred / decisions needed from client

| Item | Blocked on |
|---|---|
| Maps (Leaflet/MapLibre) | Open decision in strategy doc |
| Repo/hosting ownership (currently personal `dillabee` account) | Camoin + client decision |
| Private-before-publication data handling | Client answer; all current data is public federal data |
