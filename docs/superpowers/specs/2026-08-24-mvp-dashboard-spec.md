# Spec: Rural Prosperity Scorecard MVP (retroactive)

**Date:** 2026-08-24 · **Status:** Built and deployed (documented after the
fact; treat as the design of record for the MVP)
**Live:** https://dillabee.github.io/growsmart-roadmaps-dashboard/

## Problem

The Roadmaps for Growth program (GrowSmart Maine; Camoin Associates with
North Star Planning) needs one public dashboard covering six communities —
Calais, Danforth, Houlton, Machias, Presque Isle, Van Buren — plus a
regional rollup, per the *Roadmaps Dashboard Strategy* doc. Requirements
from that doc:

- Same KPI set for the region and each community; user switches geography
- Trends over time, plus county / Maine comparison points
- Source notes and update dates on every indicator
- Print-friendly scorecard view
- GrowSmart can update data in years 2–3 without rebuilding the app
- One app, one normalized dataset — **not** six dashboards

## Decisions made (and why)

| Decision | Choice | Rationale / alternative |
|---|---|---|
| Framework | Vite + React | Strategy doc allowed React or SvelteKit; React is the safer handoff bet for an unknown developer |
| Charts | Plotly.js (`plotly.js-dist-min`) | Doc allowed Plotly or Observable Plot; Plotly gives hover/interactivity for free. Cost: ~1MB chunk — candidate for code-splitting in full build |
| Routing | Hash routing (`#/community/Houlton`) | Deep links work on any static host, iframe, or subdomain with zero server config |
| Base path | `base: "./"` in vite.config | Same build works on GitHub Pages, client subpage, or iframe |
| Data shape | One JSON (`public/data/dashboard_data.json`) built by `scripts/build_data.py` | Matches the doc's "one normalized dataset"; the Python script *is* the year-2/3 update path |
| Region rollup | Sum counts; pooled rates (summed numerators / summed denominators); **omit medians** | Medians don't sum; pooled rates avoid the averaged-rates fallacy. Locked in by tests |
| Topic model | Sections within the Community page, not separate routes | MVP cut; full build may promote to routes |
| Trade/CBP | Shown only for port communities (Calais, Houlton, Van Buren) | Data exists only for those ports |
| Hosting | GitHub Pages, `gh-pages` branch | gh token lacks `workflow` scope; Actions workflow preserved at `deploy/github-actions-deploy.yml.example` |

## Data model

Four sheets in `Dashboard Data - Community Profiles - NSP GSM.xlsx`
(OneDrive → GrowSmart Maine → 04 Dashboard Ready Files):

1. **Demographic Socioeconomic** — ACS 5-yr, long format, years 2014/2019/2024.
   `Clean Var Name` is summable by design (rows with the same name add).
2. **Economic Base** — QCEW, wide format, 2019 and 2025 annual averages.
   Total row spelled two ways ("Total, All Industries" / "Total All Industries") — both detected.
3. **Trade** — USA Trade Online port-level, 2015–2025 + partial 2026.
   Trend = "All Commodities" × "World Total" rows only; top-8 lists from 2025.
4. **Customs and Border Patrol** — monthly rows, FY2019–2025, summed to FY.
   **Contains 198 exact duplicate rows** (all of Houlton FY2022 duplicated);
   the build script dedupes, but the workbook should be fixed at source.

Derived rates (computed in `build_data.py`, tested in `tests/`):
unemployment, LFPR, % bachelor's+, % less-than-HS, homeownership,
renter/owner cost burden, % work-from-home, race shares, income distribution.

## Known open decisions (from the strategy doc — still open)

- Final hosting home: GrowSmart, project website vendor, or Camoin? (Repo
  currently under `dillabee` personal account — revisit before client launch)
- Downloadable CSV/PDF/PNG per chart?
- Maps in the dashboard, or only the broader planning deliverables?
- Who owns year 2–3 updates after training?
