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
import { formatCompactNzd, formatCount, formatNzd } from "../lib/format.ts";
import { darkenColour } from "../lib/parties.ts";
import type { MonthPoint } from "../types.ts";

type Props = {
  points: MonthPoint[];
  grain: "month" | "year";
  /** When one party is selected, bars use that party’s colour. */
  colour?: string;
};

const CHART_HEIGHT = 320;
const DEFAULT_BAR = "#2f6a5f";
const DEFAULT_LINE = "#9a7340";

function tipAmount(value: unknown): string {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? formatNzd(amount) : "";
}

export function TimeSeries({ points, grain, colour }: Props) {
  const [plotRef, plotWidth] = useElementWidth<HTMLDivElement>();
  const rows = Array.isArray(points) ? points : [];

  if (rows.length === 0) {
    return <p className="empty-inline">No donations in the current filters to plot over time.</p>;
  }

  const barColour = colour ?? DEFAULT_BAR;
  const lineColour = colour ? darkenColour(colour, 0.28) : DEFAULT_LINE;
  const periodLabel = grain === "year" ? "year" : "month";
  const tickInterval = rows.length <= 16 ? 0 : Math.max(0, Math.ceil(rows.length / 12) - 1);

  return (
    <figure className="series">
      <div className="series-plot" ref={plotRef}>
        {plotWidth > 0 ? (
          <ComposedChart
            width={plotWidth}
            height={CHART_HEIGHT}
            data={rows}
            margin={{ top: 8, right: 4, left: 0, bottom: 4 }}
          >
            <CartesianGrid stroke="#e2ddd2" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#5c645e", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#ddd6c8" }}
              interval={tickInterval}
              minTickGap={8}
            />
            <YAxis
              yAxisId="period"
              tickFormatter={(value: number) => formatCompactNzd(value)}
              tick={{ fill: barColour, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <YAxis
              yAxisId="total"
              orientation="right"
              tickFormatter={(value: number) => formatCompactNzd(value)}
              tick={{ fill: lineColour, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
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
                fontSize: 14,
              }}
            />
            <Bar
              yAxisId="period"
              dataKey="amount"
              name="amount"
              fill={barColour}
              radius={[3, 3, 0, 0]}
              maxBarSize={grain === "year" ? 48 : 36}
            />
            <Line
              yAxisId="total"
              dataKey="cumulative"
              name="cumulative"
              stroke={lineColour}
              strokeWidth={2.5}
              dot={{
                r: grain === "year" ? 4 : 3,
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
        Bars use the left axis (amount received that {periodLabel}). The line uses the right axis
        (running total). Both are in New Zealand dollars.
        {grain === "year"
          ? " Years with no matching donations stay at zero. Longer ranges are grouped by year so the chart stays readable."
          : " Months inside the range with no matching donations stay at zero."}{" "}
        Only gifts that crossed the disclosure thresholds are included. This dataset has historical
        $30,000 returns through 2022 and current $20,000 returns from 2026, so 2023–2025 appear empty
        here.
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
