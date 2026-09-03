import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Label,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#1f6f50", "#c8912a", "#3a7ca5", "#8a5a83", "#6b7f76", "#b0543f"];
const AXIS_STYLE = { fill: "#1f6f50", fontSize: 12, fontWeight: 600 };

function compactNumber(value) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

function axisTitle(axis = {}) {
  return String(axis.title || "").toLowerCase();
}

function seriesKey(trace, index) {
  return trace.name || `Series ${index + 1}`;
}

function isHorizontal(data) {
  return data.some((trace) => trace.orientation === "h");
}

function colorFor(trace, index) {
  return trace.marker?.color || trace.line?.color || COLORS[index % COLORS.length];
}

function tickFormatter(axis = {}) {
  return (value) => {
    if (value == null || value === "") return "";
    if (typeof value !== "number") return value;

    const title = axisTitle(axis);
    const isMoney = axis.tickformat?.includes("$") || title.includes("us$") || title.includes("wage");
    const isPct = title.includes("%") || title.includes("percent");
    const useCompact = axis.tickformat?.includes("~s") || Math.abs(value) >= 100_000;
    const formatted = useCompact ? compactNumber(value) : value.toLocaleString("en-US");
    const prefix = isMoney ? "$" : "";
    const suffix = axis.ticksuffix || (isPct ? "%" : "");
    return `${prefix}${formatted}${suffix}`;
  };
}

function valueFormatter(value, name, props) {
  if (value == null) return ["-", name];
  const key = props?.payload?.__format?.[name] || {};
  const axis = key.axis || {};
  return [tickFormatter(axis)(value), name];
}

function ChartTooltip({ active, label, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload
        .filter((item) => item.value != null)
        .map((item) => {
          const [value] = valueFormatter(item.value, item.name, item);
          return (
            <div className="chart-tooltip-row" key={item.dataKey}>
              <span className="chart-tooltip-dot" style={{ background: item.color }} />
              <span>{item.name}</span>
              <strong>{value}</strong>
            </div>
          );
        })}
    </div>
  );
}

function toChartData(traces, horizontal) {
  const rows = new Map();

  traces.forEach((trace, index) => {
    const key = seriesKey(trace, index);
    const categories = horizontal ? trace.y || [] : trace.x || [];
    const values = horizontal ? trace.x || [] : trace.y || [];

    categories.forEach((category, valueIndex) => {
      if (!rows.has(category)) rows.set(category, { name: category, __format: {} });
      const row = rows.get(category);
      row[key] = values[valueIndex] ?? null;
    });
  });

  return Array.from(rows.values());
}

function axisLabel(value, position, angle = 0) {
  if (!value) return null;
  return <Label value={value} position={position} angle={angle} offset={0} />;
}

function referenceLines(layout = {}, horizontal) {
  return (layout.shapes || [])
    .filter((shape) => shape.type === "line")
    .map((shape, index) => {
      const annotation = layout.annotations?.[index];
      const stroke = shape.line?.color || "#c8912a";
      const dash = shape.line?.dash === "dash" ? "6 6" : shape.line?.dash === "dot" ? "2 4" : undefined;
      const value = horizontal ? shape.x0 : shape.y0;

      return (
        <ReferenceLine
          key={`${value}-${index}`}
          x={horizontal ? value : undefined}
          y={horizontal ? undefined : value}
          stroke={stroke}
          strokeDasharray={dash}
          strokeWidth={shape.line?.width || 2}
          label={
            annotation?.text
              ? {
                  value: annotation.text,
                  fill: annotation.font?.color || stroke,
                  position: horizontal ? "insideRight" : "insideTopRight",
                }
              : undefined
          }
        />
      );
    });
}

function renderSeries(traces, horizontal, forceLine = false) {
  return traces.map((trace, index) => {
    const key = seriesKey(trace, index);
    const stroke = colorFor(trace, index);

    if (forceLine || trace.type === "scatter") {
      return (
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          stroke={stroke}
          strokeWidth={trace.line?.width || 2.5}
          strokeDasharray={trace.line?.dash === "dot" ? "2 5" : undefined}
          dot={{ r: 3.5, strokeWidth: 2, fill: "#ffffff" }}
          activeDot={{ r: 5.5, strokeWidth: 2, fill: "#ffffff" }}
          connectNulls
          isAnimationActive={false}
        />
      );
    }

    return (
      <Bar
        key={key}
        dataKey={key}
        fill={stroke}
        fillOpacity={0.96}
        radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
        maxBarSize={52}
        isAnimationActive={false}
      />
    );
  });
}

export default function Chart({ data, layout = {}, height = 300 }) {
  const traces = data || [];
  const horizontal = isHorizontal(traces);
  const chartData = toChartData(traces, horizontal);
  const hasBars = traces.some((trace) => trace.type === "bar");
  const hasLines = traces.some((trace) => trace.type === "scatter");
  const showLegend = layout.showlegend || traces.length > 1;
  const ChartType = hasBars && hasLines ? ComposedChart : hasBars ? BarChart : ComposedChart;
  const xAxis = layout.xaxis || {};
  const yAxis = layout.yaxis || {};
  const margin = {
    top: showLegend ? 18 : 14,
    right: Math.max(layout.margin?.r ?? 18, layout.annotations?.length ? 42 : 18),
    bottom: layout.margin?.b ?? 44,
    left: Math.max(8, (layout.margin?.l ?? 60) - 44),
  };

  chartData.forEach((row) => {
    traces.forEach((trace, index) => {
      const key = seriesKey(trace, index);
      row.__format[key] = { axis: horizontal ? xAxis : yAxis };
    });
  });

  return (
    <div className="chart" style={{ width: "100%", height, minHeight: height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartType
          data={chartData}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={margin}
          barCategoryGap="18%"
          barGap={5}
        >
          <CartesianGrid stroke="#dfe8e3" strokeDasharray="2 5" vertical={false} />
          {horizontal ? (
            <>
              <XAxis
                type="number"
                tickFormatter={tickFormatter(xAxis)}
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={{ stroke: "#d6e1dc" }}
              >
                {axisLabel(xAxis.title, "insideBottom", 0)}
              </XAxis>
              <YAxis
                dataKey="name"
                type="category"
                width={layout.margin?.l ? Math.max(90, layout.margin.l - 24) : 120}
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={{ stroke: "#d6e1dc" }}
                interval={0}
                angle={xAxis.tickangle || 0}
                textAnchor={xAxis.tickangle ? "end" : "middle"}
                height={xAxis.tickangle ? 86 : 42}
              />
              <YAxis tickFormatter={tickFormatter(yAxis)} tick={AXIS_STYLE} tickLine={false} axisLine={false}>
                {axisLabel(yAxis.title, "insideLeft", -90)}
              </YAxis>
            </>
          )}
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(31, 111, 80, 0.06)" }} />
          {showLegend && (
            <Legend
              verticalAlign={layout.legend?.y < 0 ? "bottom" : "top"}
              height={32}
              iconType="circle"
              wrapperStyle={{ color: "#3f5049", fontSize: "0.82rem", fontWeight: 700 }}
            />
          )}
          {referenceLines(layout, horizontal)}
          {renderSeries(traces, horizontal)}
        </ChartType>
      </ResponsiveContainer>
    </div>
  );
}
