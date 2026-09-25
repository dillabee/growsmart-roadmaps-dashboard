import Chart from "../components/Chart.jsx";
import SourceNote from "../components/SourceNote.jsx";

const TRADE_NOTE =
  "U.S. Census Bureau, USA Trade Online — port-level goods trade. Values reflect the port of export/entry, not necessarily local production.";
const CBP_NOTE =
  "U.S. Customs and Border Protection, border crossing statistics by port of entry, federal fiscal years.";

function series(obj, key) {
  const years = Object.keys(obj || {})
    .filter((y) => /^\d{4}$/.test(y))
    .sort();
  return { x: years, y: years.map((y) => (key ? obj[y]?.[key] : obj[y])) };
}

export default function TradeBorder({ data, port }) {
  const trade = data.trade[port];
  const cbp = data.cbp[port];

  return (
    <section className="topic">
      <h3>Trade &amp; Border Activity — {port} Port of Entry</h3>
      <div className="chart-grid">
        {trade && (
          <div className="chart-card">
            <h4>Goods Trade Through the Port</h4>
            <Chart
              data={["exports", "imports"].map((k) => {
                const s = series(trade.trend, k);
                return {
                  x: s.x,
                  y: s.y.map((v) => (v == null ? null : v / 1e6)),
                  name: k === "exports" ? "Exports" : "Imports",
                  type: "scatter",
                  mode: "lines+markers",
                  hovertemplate: "%{x}: $%{y:,.0f}M<extra>" + (k === "exports" ? "Exports" : "Imports") + "</extra>",
                };
              })}
              layout={{
                yaxis: { title: "US$ millions (nominal)", tickformat: "$,.0f", ticksuffix: "M" },
                showlegend: true,
                legend: { orientation: "h", y: -0.25 },
              }}
            />
          </div>
        )}
        {trade && (
          <div className="chart-card">
            <h4>Top Export Commodities ({trade.topYear})</h4>
            <Chart
              data={[
                {
                  y: trade.top.export_commodity.map((c) => c.name.replace(/^\d+\s*/, "").slice(0, 32)).reverse(),
                  x: trade.top.export_commodity.map((c) => c.value / 1e6).reverse(),
                  type: "bar",
                  orientation: "h",
                  marker: { color: "var(--gold)" },
                  hovertemplate: "%{y}: $%{x:,.0f}M<extra></extra>",
                },
              ]}
              layout={{ xaxis: { title: "Export value (US$ millions)", tickformat: "$,.0f", ticksuffix: "M" }, margin: { l: 230, r: 16, t: 8, b: 40 } }}
            />
          </div>
        )}
        {cbp && (
          <div className="chart-card">
            <h4>Border Crossings — Travelers by Mode (federal FY)</h4>
            <Chart
              data={["Passenger Vehicles", "Trucks", "Pedestrians"]
                .map((cat) => {
                  const s = cbp[`Travelers / ${cat}`];
                  if (!s) return null;
                  return { ...series(s), name: cat, type: "scatter", mode: "lines+markers" };
                })
                .filter(Boolean)}
              layout={{ yaxis: { title: "Travelers" }, showlegend: true, legend: { orientation: "h", y: -0.25 } }}
            />
          </div>
        )}
        {cbp && (
          <div className="chart-card">
            <h4>Truck Crossings (federal FY)</h4>
            <Chart
              data={[
                {
                  ...series(cbp["Conveyances / Trucks"]),
                  name: "Trucks",
                  type: "bar",
                  marker: { color: "var(--green-700)" },
                },
              ]}
              layout={{ yaxis: { title: "Trucks" } }}
            />
          </div>
        )}
      </div>
      <SourceNote>
        {TRADE_NOTE} {CBP_NOTE}
      </SourceNote>
    </section>
  );
}
