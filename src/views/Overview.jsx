import Chart from "../components/Chart.jsx";
import KpiCard from "../components/KpiCard.jsx";
import SourceNote from "../components/SourceNote.jsx";
import { fmtInt, fmtMoney, fmtPct, fmtChange, latest, first } from "../format.js";

export default function Overview({ data, onSelect }) {
  const region = data.demographics[data.meta.region];
  const communities = data.meta.communities;

  const [popYear, pop] = latest(region.population);
  const [, pop0] = first(region.population);
  const [, lf] = latest(region.laborForce);
  const [, unemp] = latest(region.unemploymentRate);
  const [, bach] = latest(region.pctBachelors);

  const regionEmp = communities.reduce(
    (acc, c) => {
      const t = data.econ[c]?.totals || {};
      acc.e2019 += t["2019"]?.employment || 0;
      acc.e2025 += t["2025"]?.employment || 0;
      return acc;
    },
    { e2019: 0, e2025: 0 }
  );

  return (
    <div>
      <h2>Program Overview — Six Communities, One Region</h2>
      <p className="lede">
        The Roadmaps for Growth program tracks shared prosperity indicators for{" "}
        {communities.join(", ").replace(/, ([^,]*)$/, ", and $1")} — with county,
        state, and national comparisons where the data supports them. Select a
        community below or use the tabs above to explore its full scorecard.
      </p>

      <div className="kpi-grid">
        <KpiCard
          label={`Regional Population (${popYear})`}
          value={fmtInt(pop)}
          change={fmtChange(pop, pop0)}
          changeLabel="since 2014"
          good={pop >= pop0}
        />
        <KpiCard label="Regional Labor Force" value={fmtInt(lf)} />
        <KpiCard
          label="Regional Unemployment"
          value={fmtPct(unemp)}
          compare={`Maine: ${fmtPct(latest(data.demographics["Maine"].unemploymentRate)[1])}`}
        />
        <KpiCard
          label="Bachelor's or Higher"
          value={fmtPct(bach)}
          compare={`Maine: ${fmtPct(latest(data.demographics["Maine"].pctBachelors)[1])}`}
        />
        <KpiCard
          label="Covered Employment (2025)"
          value={fmtInt(regionEmp.e2025)}
          change={fmtChange(regionEmp.e2025, regionEmp.e2019)}
          changeLabel="vs 2019"
          good={regionEmp.e2025 >= regionEmp.e2019}
        />
      </div>
      <SourceNote>
        U.S. Census Bureau ACS 5-Year Estimates; Maine DOL QCEW. Regional
        figures are sums of the six communities.
      </SourceNote>

      <div className="chart-grid">
        <div className="chart-card">
          <h4>Population by Community</h4>
          <Chart
            data={data.meta.demoYears.map((y, i) => ({
              x: communities,
              y: communities.map((c) => data.demographics[c].population[y]),
              name: y,
              type: "bar",
              marker: { opacity: 0.45 + i * 0.27 },
            }))}
            layout={{ barmode: "group", yaxis: { title: "People" }, showlegend: true, legend: { orientation: "h", y: 1.12 } }}
          />
        </div>
        <div className="chart-card">
          <h4>Median Household Income by Community (2024)</h4>
          <Chart
            data={[
              {
                x: communities,
                y: communities.map((c) => latest(data.demographics[c].medianHHI)[1]),
                type: "bar",
                marker: { color: "#1f6f50" },
                hovertemplate: "%{x}: %{y:$,.0f}<extra></extra>",
              },
            ]}
            layout={{
              yaxis: { title: "US$", tickformat: "$~s" },
              shapes: [
                {
                  type: "line", xref: "paper", x0: 0, x1: 1,
                  y0: latest(data.demographics["Maine"].medianHHI)[1],
                  y1: latest(data.demographics["Maine"].medianHHI)[1],
                  line: { color: "#c8912a", width: 2, dash: "dash" },
                },
              ],
              annotations: [
                {
                  xref: "paper", x: 1, y: latest(data.demographics["Maine"].medianHHI)[1],
                  text: "Maine", showarrow: false, yshift: 10, font: { color: "#c8912a" },
                },
              ],
            }}
          />
        </div>
      </div>

      <h3>Community Scorecards</h3>
      <div className="community-cards">
        {communities.map((c) => {
          const d = data.demographics[c];
          const [, p] = latest(d.population);
          const [, p0] = first(d.population);
          const [, m] = latest(d.medianHHI);
          return (
            <button key={c} className="community-card" onClick={() => onSelect(c)}>
              <span className="cc-name">{c}</span>
              <span className="cc-stat">{fmtInt(p)} people ({fmtChange(p, p0)} since 2014)</span>
              <span className="cc-stat">Median HH income {fmtMoney(m)}</span>
              <span className="cc-link">View scorecard →</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
