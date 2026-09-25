import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useElementWidth } from "../hooks/useElementWidth.ts";
import { useMatchMedia } from "../hooks/useMatchMedia.ts";
import { formatCompactNzd, formatCount, formatNzd } from "../lib/format.ts";
import { darkenColour } from "../lib/parties.ts";
import type { MonthPoint } from "../types.ts";

type Props = {
  points: MonthPoint[];
  grain: "month" | "year";
  /** When one party is selected, bars use that party’s colour. */
  colour?: string;
};

const CHART_HEIGHT_DESKTOP = 320;
const CHART_HEIGHT_MOBILE = 280;
const DEFAULT_BAR = "#2f6a5f";
const DEFAULT_LINE = "#9a7340";
/** Below this plot width, dual axes crush the drawing area. */
const NARROW_PLOT_PX = 520;

function tipAmount(value: unknown): string {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? formatNzd(amount) : "";
}

export function TimeSeries({ points, grain, colour }: Props) {
  const [plotRef, plotWidth] = useElementWidth<HTMLDivElement>();
  const isPhone = useMatchMedia("(max-width: 760px)");
  const rows = Array.isArray(points) ? points : [];

  if (rows.length === 0) {
    return <p className="empty-inline">No donations in these filters to plot over time.</p>;
  }

  const narrow = isPhone || (plotWidth > 0 && plotWidth < NARROW_PLOT_PX);
  const chartHeight = narrow ? CHART_HEIGHT_MOBILE : CHART_HEIGHT_DESKTOP;
  const barColour = colour ?? DEFAULT_BAR;
  const lineColour = colour ? darkenColour(colour, 0.28) : DEFAULT_LINE;
  const periodLabel = grain === "year" ? "year" : "month";

  // Fewer X labels on narrow screens so remaining ticks stay readable.
  const tickInterval = narrow
    ? rows.length <= 6
      ? 0
      : Math.max(0, Math.ceil(rows.length / (grain === "year" ? 6 : 5)) - 1)
    : rows.length <= 16
      ? 0
      : Math.max(0, Math.ceil(rows.length / 12) - 1);

  return (
    <figure className="series">
      <div
        className={`series-plot${narrow ? " is-narrow" : ""}`}
        ref={plotRef}
        style={{ height: chartHeight, minHeight: chartHeight }}
      >
        {plotWidth > 0 ? (
          <ComposedChart
            width={plotWidth}
            height={chartHeight}
            data={rows}
            margin={
              narrow
                ? { top: 10, right: 6, left: 2, bottom: grain === "month" ? 2 : 4 }
                : { top: 8, right: 4, left: 0, bottom: 4 }
            }
          >
            <CartesianGrid stroke="#e2ddd2" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#5c645e", fontSize: narrow ? 11 : 12 }}
              tickLine={false}
              axisLine={{ stroke: "#ddd6c8" }}
              interval={tickInterval}
              minTickGap={narrow ? 14 : 8}
              height={narrow ? 28 : 30}
            />
            <YAxis
              yAxisId="period"
              tickFormatter={(value: number) => formatCompactNzd(value)}
              tick={{ fill: barColour, fontSize: narrow ? 12 : 11 }}
              tickLine={false}
              axisLine={false}
              width={narrow ? 44 : 48}
              tickCount={narrow ? 4 : undefined}
            />
            <YAxis
              yAxisId="total"
              orientation="right"
              tickFormatter={(value: number) => formatCompactNzd(value)}
              tick={{ fill: lineColour, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={narrow ? 0 : 48}
              hide={narrow}
            />
            <Tooltip
              formatter={(value, name) => [
                tipAmount(value),
                name === "amount" ? `Received that ${periodLabel}` : "Running total",
              ]}
              labelFormatter={(label) =>
                rows.find((point) => point.label === label)?.fullLabel ?? String(label)
              }
              contentStyle={{
                border: "1px solid #ddd6c8",
                borderRadius: 10,
                background: "#fbfaf6",
                fontSize: narrow ? 15 : 14,
              }}
            />
            <Bar
              yAxisId="period"
              dataKey="amount"
              name="amount"
              fill={barColour}
              radius={[3, 3, 0, 0]}
              maxBarSize={grain === "year" ? (narrow ? 40 : 48) : narrow ? 28 : 36}
            />
            <Line
              yAxisId="total"
              dataKey="cumulative"
              name="cumulative"
              stroke={lineColour}
              strokeWidth={narrow ? 2 : 2.5}
              dot={{
                r: grain === "year" ? 4 : narrow ? 2.5 : 3,
                fill: "#fbfaf6",
                stroke: lineColour,
                strokeWidth: 2,
              }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        ) : null}
      </div>
      <figcaption className="chart-note">
        {narrow ? (
          <>
            Bars: amount received that {periodLabel} (left axis). Line: running total on its own
            scale. Tap for exact dollars. NZD.
          </>
        ) : (
          <>
            Bars use the left axis (amount received that {periodLabel}). The line uses the right
            axis (running total). NZD.
          </>
        )}
        {grain === "year"
          ? " Empty years stay at zero. Long ranges group by year."
          : " Empty months in range stay at zero."}{" "}
        Only gifts above disclosure thresholds are included. Data has $30,000 returns through 2022
        and $20,000 returns from 2026, so 2023–2025 appear empty here.
      </figcaption>
      <div className="visually-hidden">
        <table>
          <caption>
            {grain === "year" ? "Yearly" : "Monthly"} totals for the current filters
          </caption>
          <thead>
            <tr>
              <th>{grain === "year" ? "Year" : "Month"}</th>
              <th>Amount</th>
              <th>Donations</th>
              <th>Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((point) => (
              <tr key={point.key}>
                <td>{point.fullLabel}</td>
                <td>{formatNzd(point.amount)}</td>
                <td>{formatCount(point.count)}</td>
                <td>{formatNzd(point.cumulative)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
