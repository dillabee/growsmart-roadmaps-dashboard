import { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist-min";

const BASE_LAYOUT = {
  font: { family: "'Source Sans 3', 'Segoe UI', sans-serif", size: 13, color: "#2d3a35" },
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  margin: { l: 60, r: 16, t: 8, b: 40 },
  hovermode: "closest",
  colorway: ["#1f6f50", "#c8912a", "#3a7ca5", "#8a5a83", "#6b7f76", "#b0543f"],
  xaxis: { gridcolor: "#e4e9e6", zerolinecolor: "#cfd8d3" },
  yaxis: { gridcolor: "#e4e9e6", zerolinecolor: "#cfd8d3" },
};

export default function Chart({ data, layout = {}, height = 300 }) {
  const ref = useRef(null);

  useEffect(() => {
    const merged = {
      ...BASE_LAYOUT,
      ...layout,
      xaxis: { ...BASE_LAYOUT.xaxis, ...(layout.xaxis || {}) },
      yaxis: { ...BASE_LAYOUT.yaxis, ...(layout.yaxis || {}) },
      height,
      autosize: true,
    };
    Plotly.react(ref.current, data, merged, {
      displayModeBar: false,
      responsive: true,
    });
  }, [data, layout, height]);

  useEffect(() => {
    const el = ref.current;
    return () => el && Plotly.purge(el);
  }, []);

  return <div ref={ref} className="chart" style={{ width: "100%", minHeight: height }} />;
}
