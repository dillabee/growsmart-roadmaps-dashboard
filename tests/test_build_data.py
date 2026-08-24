"""
Characterization tests for scripts/build_data.py.

These lock in the transformation rules the dashboard depends on:
duplicate handling, derived rates, regional rollup math, total-row
detection, and trade trend/top-list construction. Run before every
annual data refresh:

    python -m pytest tests/ -v
"""
import sys
from pathlib import Path

import openpyxl
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import build_data  # noqa: E402


def make_ws(header, rows):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(header)
    for r in rows:
        ws.append(r)
    return ws


# ---------------------------------------------------------------- CBP

CBP_HDR = [
    "FY", "Month Grouping", "Month (abbv)", "Region", "Field Office", "State",
    "Port of Entry", "Mode of Transportation", "Measure Name", "Category", "Count",
]


def cbp_row(fy, month, count, port="HOULTON, ME (0106)", measure="Travelers", cat="Trucks"):
    return [fy, "FYTD", month, "Northern Border", "BOSTON", "ME", port, "Land", measure, cat, count]


def test_cbp_sums_months_within_fiscal_year():
    ws = make_ws(CBP_HDR, [cbp_row("2024", "JAN", 100), cbp_row("2024", "FEB", 50)])
    out = build_data.build_cbp(ws)
    assert out["Houlton"]["Travelers / Trucks"]["2024"] == 150


def test_cbp_skips_exact_duplicate_rows():
    # The source sheet is known to contain exact duplicates (198 as of
    # Aug 2026, e.g. all of Houlton FY2022). Identical rows count once.
    row = cbp_row("2022", "JAN", 100)
    ws = make_ws(CBP_HDR, [row, list(row), cbp_row("2022", "FEB", 50)])
    out = build_data.build_cbp(ws)
    assert out["Houlton"]["Travelers / Trucks"]["2022"] == 150


def test_cbp_keeps_ports_and_measures_separate():
    ws = make_ws(CBP_HDR, [
        cbp_row("2024", "JAN", 10, port="CALAIS, ME (0115)"),
        cbp_row("2024", "JAN", 20, port="CALAIS, ME (0115)", measure="Conveyances"),
        cbp_row("2024", "JAN", 30),
    ])
    out = build_data.build_cbp(ws)
    assert out["Calais"]["Travelers / Trucks"]["2024"] == 10
    assert out["Calais"]["Conveyances / Trucks"]["2024"] == 20
    assert out["Houlton"]["Travelers / Trucks"]["2024"] == 30


# ------------------------------------------------------- Demographics

DEMO_HDR = [
    "GEOID", "NAME", "Community", "variable", "Clean Var Name",
    "estimate", "moe", "geography_type", "year",
]


def demo_row(community, var, estimate, year=2024):
    return ["1", community, community, var.lower(), var, estimate, 1, "County Subdivision", year]


def demo_ws(rows):
    return make_ws(DEMO_HDR, rows)


def test_unemployment_rate_is_unemployed_over_labor_force():
    ws = demo_ws([
        demo_row("Houlton", "Unemployed", 50),
        demo_row("Houlton", "Labor Force", 1000),
    ])
    out, years = build_data.build_demographics(ws)
    assert out["Houlton"]["unemploymentRate"]["2024"] == 5.0


def test_same_var_rows_are_summed_before_rates():
    # "Clean Var Name" is designed so repeated rows sum (per the data guide)
    ws = demo_ws([
        demo_row("Houlton", "Unemployed", 30),
        demo_row("Houlton", "Unemployed", 20),
        demo_row("Houlton", "Labor Force", 1000),
    ])
    out, _ = build_data.build_demographics(ws)
    assert out["Houlton"]["unemploymentRate"]["2024"] == 5.0


def test_region_rollup_sums_counts_across_six_communities():
    rows = [demo_row(c, "Total Population", 100) for c in build_data.COMMUNITIES]
    rows += [demo_row("Maine", "Total Population", 999999)]
    out, _ = build_data.build_demographics(demo_ws(rows))
    # Region = six communities only; comparisons are never included
    assert out[build_data.REGION]["population"]["2024"] == 600


def test_region_rollup_omits_medians():
    rows = [demo_row(c, "Median Household Income", 50000) for c in build_data.COMMUNITIES]
    out, _ = build_data.build_demographics(demo_ws(rows))
    assert out[build_data.REGION]["medianHHI"]["2024"] is None
    assert out[build_data.REGION]["medianAge"]["2024"] is None


def test_region_rates_use_summed_numerators_not_averaged_rates():
    # Houlton: 10% on a big base; Calais: 0% on a tiny base.
    # Correct pooled rate is 100/1010 = 9.9%, not the 5% average of rates.
    rows = [
        demo_row("Houlton", "Unemployed", 100),
        demo_row("Houlton", "Labor Force", 1000),
        demo_row("Calais", "Unemployed", 0),
        demo_row("Calais", "Labor Force", 10),
    ]
    out, _ = build_data.build_demographics(demo_ws(rows))
    assert out[build_data.REGION]["unemploymentRate"]["2024"] == 9.9


def test_missing_denominator_yields_none_not_crash():
    ws = demo_ws([demo_row("Houlton", "Unemployed", 50)])
    out, _ = build_data.build_demographics(ws)
    assert out["Houlton"]["unemploymentRate"]["2024"] is None


# ------------------------------------------------------ Economic Base

ECON_HDR = [
    "Period Type", "Date", "Year", "Quarter", "Geography", "Area Name",
    "Town County", "Level", "Sort", "NAICS", "NAICS Title", "Ownership",
    "Establishments", "Average Employment", "Total Wages", "Average Weekly Wage",
]


def econ_row(area, naics, title, year=2025, est=10, emp=100, wages=520000, aww=100):
    return ["Annual", None, year, 0, "Residence Code", area, "Aroostook Cty",
            2, 1, naics, title, "Total", est, emp, wages, aww]


def test_total_row_detected_with_and_without_comma():
    # The workbook spells the total row two ways across geographies
    ws = make_ws(ECON_HDR, [
        econ_row("Houlton", "0", "Total, All Industries"),
        econ_row("Calais", "0", "Total All Industries"),
    ])
    out = build_data.build_econ(ws)
    assert out["Houlton"]["totals"]["2025"]["employment"] == 100
    assert out["Calais"]["totals"]["2025"]["employment"] == 100
    assert out["Houlton"]["industries"] == []


def test_industry_rows_keyed_by_year():
    ws = make_ws(ECON_HDR, [
        econ_row("Houlton", "31-33", "Manufacturing", year=2019, emp=400),
        econ_row("Houlton", "31-33", "Manufacturing", year=2025, emp=417),
    ])
    out = build_data.build_econ(ws)
    (mfg,) = out["Houlton"]["industries"]
    assert mfg["title"] == "Manufacturing"
    assert mfg["y2019"]["employment"] == 400
    assert mfg["y2025"]["employment"] == 417


def test_econ_region_rollup_sums_and_derives_weekly_wage():
    rows = [
        econ_row(c, "0", "Total, All Industries", est=10, emp=100, wages=520000)
        for c in build_data.COMMUNITIES
    ]
    rows.append(econ_row("Maine", "0", "Total, All Industries", est=99999, emp=99999))
    out = build_data.build_econ(make_ws(ECON_HDR, rows))
    region = out[build_data.REGION]["totals"]["2025"]
    assert region["establishments"] == 60
    assert region["employment"] == 600
    assert region["totalWages"] == 3120000
    # avg weekly wage derived from summed wages / summed employment / 52
    assert region["avgWeeklyWage"] == round(3120000 / 600 / 52)


# -------------------------------------------------------------- Trade

TRADE_HDR = ["Port", "Type", "Commodity", "Country", "Time", "Total Exports Value ($US)"]


def trade_row(port, ttype, commodity, country, year, value):
    return [f"{port}, ME (Port)", ttype, commodity, country, year, value]


def test_trade_trend_uses_only_all_commodities_world_total():
    ws = make_ws(TRADE_HDR, [
        trade_row("Calais", "Export", "All Commodities", "World Total", "2024", 1000),
        trade_row("Calais", "Export", "03 Fish", "World Total", "2024", 400),
        trade_row("Calais", "Export", "All Commodities", "Canada", "2024", 900),
    ])
    out = build_data.build_trade(ws)
    assert out["Calais"]["trend"]["2024"]["exports"] == 1000


def test_trade_top_commodities_exclude_all_commodities_and_sort_desc():
    y = "2025"  # top lists are built from the latest full year only
    ws = make_ws(TRADE_HDR, [
        trade_row("Calais", "Export", "All Commodities", "World Total", y, 1000),
        trade_row("Calais", "Export", "03 Fish", "World Total", y, 300),
        trade_row("Calais", "Export", "27 Mineral Fuel", "World Total", y, 600),
    ])
    out = build_data.build_trade(ws)
    top = out["Calais"]["top"]["export_commodity"]
    assert [c["name"] for c in top] == ["27 Mineral Fuel", "03 Fish"]


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
