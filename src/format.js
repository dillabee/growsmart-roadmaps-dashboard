export const fmtInt = (v) =>
  v == null ? "–" : Math.round(v).toLocaleString("en-US");

export const fmtMoney = (v) =>
  v == null ? "–" : "$" + Math.round(v).toLocaleString("en-US");

export const fmtMoneyCompact = (v) => {
  if (v == null) return "–";
  if (Math.abs(v) >= 1e9) return "$" + (v / 1e9).toFixed(1) + "B";
  if (Math.abs(v) >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
  return fmtMoney(v);
};

export const fmtPct = (v, d = 1) => (v == null ? "–" : v.toFixed(d) + "%");

export const fmtChange = (curr, prev, pct = false) => {
  if (curr == null || prev == null) return null;
  const diff = curr - prev;
  const sign = diff > 0 ? "+" : "";
  if (pct) return sign + diff.toFixed(1) + " pts";
  const p = prev !== 0 ? (diff / prev) * 100 : null;
  return p == null ? null : sign + p.toFixed(1) + "%";
};

export const latest = (series) => {
  if (!series) return [null, null];
  const years = Object.keys(series).filter((y) => series[y] != null).sort();
  const y = years[years.length - 1];
  return y ? [y, series[y]] : [null, null];
};

export const first = (series) => {
  if (!series) return [null, null];
  const years = Object.keys(series).filter((y) => series[y] != null).sort();
  return years.length ? [years[0], series[years[0]]] : [null, null];
};
