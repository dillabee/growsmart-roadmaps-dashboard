export default function KpiCard({ label, value, change, changeLabel, compare, good }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {change != null && (
        <div className={"kpi-change " + (good == null ? "" : good ? "kpi-up" : "kpi-down")}>
          {change} <span className="kpi-change-label">{changeLabel}</span>
        </div>
      )}
      {compare && <div className="kpi-compare">{compare}</div>}
    </div>
  );
}
