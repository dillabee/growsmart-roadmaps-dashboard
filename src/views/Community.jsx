import { useMemo, useState } from "react";
import Chart from "../components/Chart.jsx";
import KpiCard from "../components/KpiCard.jsx";
import SourceNote from "../components/SourceNote.jsx";
import TradeBorder from "./TradeBorder.jsx";
import { fmtInt, fmtMoney, fmtPct, fmtChange, latest, first } from "../format.js";

const ACS_NOTE =
  "U.S. Census Bureau, American Community Survey 5-Year Estimates (2014, 2019, 2024 endpoints). Small-area estimates carry margins of error.";
const QCEW_NOTE =
  "Maine Department of Labor / Quarterly Census of Employment and Wages (QCEW), annual averages, 2019 and 2025.";

const PORT_COMMUNITIES = ["Calais", "Houlton", "Van Buren"];

function series(obj) {
  const years = Object.keys(obj || {}).sort();
  return { x: years, y: years.map((y) => obj[y]) };
}

export default function Community({ data, geo }) {
  const demo = data.demographics[geo];
  const econ = data.econ[geo];
  const isRegion = geo === data.meta.region;
  const [compareGeos, setCompareGeos] = useState(["Maine"]);

  const comparisons = data.meta.comparisons;
  const toggleCompare = (g) =>
    setCompareGeos((c) => (c.includes(g) ? c.filter((x) => x !== g) : [...c, g]));

  const [popYear, pop] = latest(demo.population);
  const [, pop0] = first(demo.population);
  const [, mhi] = latest(demo.medianHHI);
  const [, mhi0] = first(demo.medianHHI);
  const [, age] = latest(demo.medianAge);
  const [, unemp] = latest(demo.unemploymentRate);
  const [, unemp0] = first(demo.unemploymentRate);
  const [, bach] = latest(demo.pctBachelors);
  const [, bach0] = first(demo.pctBachelors);
  const [, own] = latest(demo.homeownershipRate);
  const maineMHI = latest(data.demographics["Maine"].medianHHI)[1];

  // Trend chart with optional comparison overlays, indexed or raw
  const trendTraces = (ind, name, indexed) => {
    const geos = [geo, ...compareGeos.filter((g) => g !== geo)];
    return geos
      .map((g) => {
        const s = series(data.demographics[g]?.[ind]);
        if (!s.y.some((v) => v != null)) return null;
        let y = s.y;
        if (indexed) {
          const base = s.y.find((v) => v != null);
          y = s.y.map((v) => (v == null || !base ? null : (v / base) * 100));
        }
        return {
          x: s.x,
          y,
          name: g,
          type: "scatter",
          mode: "lines+markers",
          line: { width: g === geo ? 3 : 1.5, dash: g === geo ? "solid" : "dot" },
        };
      })
      .filter(Boolean);
  };

  const raceLatest = useMemo(() => {
    const [, r] = latest(
      Object.fromEntries(
        Object.entries(demo.race).map(([y, v]) => [y, Object.values(v).some((x) => x != null) ? v : null])
      )
    );
    return r || {};
  }, [demo]);

  const incomeLatest = useMemo(() => {
    const yrs = Object.keys(demo.incomeDist).sort();
    return demo.incomeDist[yrs[yrs.length - 1]] || {};
  }, [demo]);
  const incomeTotal = Object.values(incomeLatest).reduce((a, b) => a + (b || 0), 0);
  const maineIncome = useMemo(() => {
    const d = data.demographics["Maine"].incomeDist;
    const yrs = Object.keys(d).sort();
    return d[yrs[yrs.length - 1]] || {};
  }, [data]);
  const maineIncomeTotal = Object.values(maineIncome).reduce((a, b) => a + (b || 0), 0);

  const industries = useMemo(() => {
    if (!econ) return [];
    return [...econ.industries]
      .filter((i) => i.y2025?.employment != null || i.y2019?.employment != null)
      .sort((a, b) => (b.y2025?.employment || 0) - (a.y2025?.employment || 0))
      .slice(0, 10);
  }, [econ]);

  const econTotals = econ?.totals || {};

  return (
    <div>
      <div className="section-head">
        <h2>{geo} Scorecard</h2>
        <div className="compare-toggle">
          <span>Compare with:</span>
          {comparisons.map((g) => (
            <label key={g}>
              <input
                type="checkbox"
                checked={compareGeos.includes(g)}
                onChange={() => toggleCompare(g)}
              />
              {g}
            </label>
          ))}
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard
          label={`Population (${popYear})`}
          value={fmtInt(pop)}
          change={fmtChange(pop, pop0)}
          changeLabel="since 2014"
          good={pop >= pop0}
        />
        <KpiCard
          label="Median Household Income"
          value={isRegion ? "See communities" : fmtMoney(mhi)}
          change={isRegion ? null : fmtChange(mhi, mhi0)}
          changeLabel="since 2014"
          good={mhi >= mhi0}
          compare={isRegion ? null : `Maine: ${fmtMoney(maineMHI)}`}
        />
        <KpiCard
          label="Median Age"
          value={isRegion ? "See communities" : (age ?? "–")}
          compare={isRegion ? null : `Maine: ${latest(data.demographics["Maine"].medianAge)[1]}`}
        />
        <KpiCard
          label="Unemployment Rate"
          value={fmtPct(unemp)}
          change={fmtChange(unemp, unemp0, true)}
          changeLabel="since 2014"
          good={unemp <= unemp0}
          compare={`Maine: ${fmtPct(latest(data.demographics["Maine"].unemploymentRate)[1])}`}
        />
        <KpiCard
          label="Bachelor's Degree or Higher"
          value={fmtPct(bach)}
          change={fmtChange(bach, bach0, true)}
          changeLabel="since 2014"
          good={bach >= bach0}
          compare={`Maine: ${fmtPct(latest(data.demographics["Maine"].pctBachelors)[1])}`}
        />
        <KpiCard
          label="Homeownership Rate"
          value={fmtPct(own)}
          compare={`Maine: ${fmtPct(latest(data.demographics["Maine"].homeownershipRate)[1])}`}
        />
      </div>
      <SourceNote>{ACS_NOTE}</SourceNote>

      <section className="topic">
        <h3>People</h3>
        <div className="chart-grid">
          <div className="chart-card">
            <h4>Population Trend {compareGeos.length ? "(indexed, 2014 = 100)" : ""}</h4>
            <Chart
              data={trendTraces("population", "Population", compareGeos.length > 0)}
              layout={{ yaxis: { title: compareGeos.length ? "Index (2014 = 100)" : "People" }, showlegend: true, legend: { orientation: "h", y: -0.25 } }}
            />
          </div>
          <div className="chart-card">
            <h4>Race &amp; Ethnicity (share of population, 2024)</h4>
            <Chart
              data={[
                {
                  y: Object.keys(raceLatest),
                  x: Object.values(raceLatest).map((v) =>
                    pop ? ((v || 0) / pop) * 100 : null
                  ),
                  type: "bar",
                  orientation: "h",
                  marker: { color: "#1f6f50" },
                  hovertemplate: "%{y}: %{x:.1f}%<extra></extra>",
                },
              ]}
              layout={{ xaxis: { title: "% of population" }, margin: { l: 110, r: 16, t: 8, b: 40 } }}
            />
          </div>
        </div>
        <SourceNote>{ACS_NOTE}</SourceNote>
      </section>

      <section className="topic">
        <h3>Income &amp; Housing</h3>
        <div className="chart-grid">
          <div className="chart-card">
            <h4>Household Income Distribution (2024)</h4>
            <Chart
              data={[
                {
                  x: Object.keys(incomeLatest),
                  y: Object.values(incomeLatest).map((v) =>
                    incomeTotal ? ((v || 0) / incomeTotal) * 100 : null
                  ),
                  type: "bar",
                  name: geo,
                  marker: { color: "#1f6f50" },
                },
                {
                  x: Object.keys(maineIncome),
                  y: Object.values(maineIncome).map((v) =>
                    maineIncomeTotal ? ((v || 0) / maineIncomeTotal) * 100 : null
                  ),
                  type: "scatter",
                  mode: "lines+markers",
                  name: "Maine",
                  line: { color: "#c8912a", dash: "dot" },
                },
              ]}
              layout={{
                yaxis: { title: "% of households" },
                xaxis: { tickangle: -45 },
                showlegend: true,
                legend: { orientation: "h", y: 1.1 },
                margin: { l: 60, r: 16, t: 8, b: 110 },
              }}
              height={340}
            />
          </div>
          <div className="chart-card">
            <h4>Housing Cost Burden (% paying 30%+ of income)</h4>
            <Chart
              data={[
                { ...series(demo.renterCostBurden), name: "Renters", type: "scatter", mode: "lines+markers" },
                { ...series(demo.ownerMortgageCostBurden), name: "Owners w/ mortgage", type: "scatter", mode: "lines+markers" },
              ]}
              layout={{ yaxis: { title: "% cost-burdened" }, showlegend: true, legend: { orientation: "h", y: -0.25 } }}
            />
          </div>
        </div>
        <SourceNote>{ACS_NOTE}</SourceNote>
      </section>

      <section className="topic">
        <h3>Workforce</h3>
        <div className="chart-grid">
          <div className="chart-card">
            <h4>Unemployment Rate</h4>
            <Chart
              data={trendTraces("unemploymentRate", "Unemployment", false)}
              layout={{ yaxis: { title: "%", rangemode: "tozero" }, showlegend: true, legend: { orientation: "h", y: -0.25 } }}
            />
          </div>
          <div className="chart-card">
            <h4>Labor Force Participation (age 16+)</h4>
            <Chart
              data={trendTraces("lfpr", "LFPR", false)}
              layout={{ yaxis: { title: "%" }, showlegend: true, legend: { orientation: "h", y: -0.25 } }}
            />
          </div>
        </div>
        <SourceNote>{ACS_NOTE}</SourceNote>
      </section>

      {econ && (
        <section className="topic">
          <h3>Economic Base</h3>
          <div className="kpi-grid kpi-grid-4">
            <KpiCard
              label="Establishments (2025)"
              value={fmtInt(econTotals["2025"]?.establishments)}
              change={fmtChange(econTotals["2025"]?.establishments, econTotals["2019"]?.establishments)}
              changeLabel="vs 2019"
              good={(econTotals["2025"]?.establishments || 0) >= (econTotals["2019"]?.establishments || 0)}
            />
            <KpiCard
              label="Avg Employment (2025)"
              value={fmtInt(econTotals["2025"]?.employment)}
              change={fmtChange(econTotals["2025"]?.employment, econTotals["2019"]?.employment)}
              changeLabel="vs 2019"
              good={(econTotals["2025"]?.employment || 0) >= (econTotals["2019"]?.employment || 0)}
            />
            <KpiCard
              label="Avg Weekly Wage (2025)"
              value={fmtMoney(econTotals["2025"]?.avgWeeklyWage)}
              change={fmtChange(econTotals["2025"]?.avgWeeklyWage, econTotals["2019"]?.avgWeeklyWage)}
              changeLabel="vs 2019"
              good={(econTotals["2025"]?.avgWeeklyWage || 0) >= (econTotals["2019"]?.avgWeeklyWage || 0)}
            />
            <KpiCard
              label="Total Wages (2025)"
              value={econTotals["2025"]?.totalWages != null ? "$" + (econTotals["2025"].totalWages / 1e6).toFixed(0) + "M" : "–"}
              change={fmtChange(econTotals["2025"]?.totalWages, econTotals["2019"]?.totalWages)}
              changeLabel="vs 2019"
              good={(econTotals["2025"]?.totalWages || 0) >= (econTotals["2019"]?.totalWages || 0)}
            />
          </div>
          <div className="chart-card">
            <h4>Employment by Industry — Top 10 (2025 vs 2019)</h4>
            <Chart
              data={[
                {
                  y: industries.map((i) => i.title).reverse(),
                  x: industries.map((i) => i.y2019?.employment ?? null).reverse(),
                  name: "2019",
                  type: "bar",
                  orientation: "h",
                  marker: { color: "#b9cdc2" },
                },
                {
                  y: industries.map((i) => i.title).reverse(),
                  x: industries.map((i) => i.y2025?.employment ?? null).reverse(),
                  name: "2025",
                  type: "bar",
                  orientation: "h",
                  marker: { color: "#1f6f50" },
                },
              ]}
              layout={{
                barmode: "group",
                xaxis: { title: "Average employment" },
                margin: { l: 280, r: 16, t: 8, b: 40 },
                showlegend: true,
                legend: { orientation: "h", y: 1.08 },
              }}
              height={420}
            />
          </div>
          <SourceNote>{QCEW_NOTE} Employment by place of residence code. Some industries suppressed for confidentiality in small areas.</SourceNote>
        </section>
      )}

      {PORT_COMMUNITIES.includes(geo) && <TradeBorder data={data} port={geo} />}
    </div>
  );
}
