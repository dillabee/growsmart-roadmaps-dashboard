# Rural Prosperity Scorecard — GrowSmart Maine Roadmaps for Growth

MVP dashboard for the Roadmaps for Growth program: one static web dashboard
with a shared regional view and six community views (Calais, Danforth,
Houlton, Machias, Presque Isle, Van Buren), with Aroostook County, Washington
County, and Maine comparisons.

**Live site:** https://dillabee.github.io/growsmart-roadmaps-dashboard/

This MVP implements the structure in *Roadmaps Dashboard Strategy — Grow
Smart Maine* (0 PM folder) and is intended as the starting point for the full
build. It is deliberately one app, one normalized dataset — not six
dashboards.

## Stack

- **Vite + React** (static export — no server required)
- **Plotly.js** for charts
- **Python + openpyxl** build script that converts the clean data workbook
  into one JSON file (`public/data/dashboard_data.json`)
- Hash routing (`#/community/Houlton`) so deep links work on any static host

## Page model (per the strategy doc)

| Page | Contents |
|---|---|
| Program Overview | Regional KPI cards, population & income by community, links to each scorecard |
| Community Scorecard | Geography pills (region + 6 towns), comparison toggles (counties/Maine), KPI cards, topic sections: People, Income & Housing, Workforce, Economic Base, Trade & Border (port towns only) |
| Data Notes | Sources, definitions, limitations, and the annual update process |
| Print scorecard | "Print scorecard" button + print stylesheet renders the current view as a clean handout |

## Data pipeline

Source of truth: `Dashboard Data - Community Profiles - NSP GSM.xlsx`
(04 Dashboard Ready Files, OneDrive). Four sheets:

1. **Demographic Socioeconomic** — ACS 5-year (2014/2019/2024), long format
2. **Economic Base** — QCEW (2019/2025), wide format
3. **Trade** — USA Trade Online port-level (2015–2026)
4. **Customs and Border Patrol** — CBP crossings FY2019–2025

To refresh data:

```bash
python scripts/build_data.py "path/to/workbook.xlsx"
npm run build
```

The script validates sheets/columns, warns on missing community/year combos,
dedupes exact duplicate rows (the CBP sheet currently contains 198), computes
derived rates (unemployment, LFPR, % bachelor's, cost burden, etc.), and
builds the regional rollup (sums for counts; medians intentionally omitted
at region level).

## Develop / deploy

```bash
npm install
npm run dev      # local dev server
npm run build    # static output in dist/
```

Deployment is automatic: pushing to `main` triggers the GitHub Actions
workflow (`.github/workflows/deploy.yml`) which builds and publishes to
GitHub Pages. `vite.config.js` uses `base: "./"` so the same build also works
in an iframe or on a client subdomain.

## Known gaps for the full build (intentional MVP cuts)

- Agriculture dataset (county-level, Aroostook communities only) not yet included
- Location quotients pending US 2025 QCEW baseline (see Dashboard Data Guide)
- Topic deep-dive pages are sections, not separate routes
- No downloadable CSV/PNG per chart yet (open decision in strategy doc)
- Trade "top commodities/countries" fixed to 2025; could be year-selectable
- No maps (open decision in strategy doc)
