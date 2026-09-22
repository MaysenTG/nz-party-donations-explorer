import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactNzd, formatCount, formatNzd } from "../lib/format.ts";
import type { MonthPoint } from "../types.ts";

type Props = {
  points: MonthPoint[];
};

function tipAmount(value: unknown): string {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? formatNzd(amount) : "";
}

export function TimeSeries({ points }: Props) {
  if (points.length === 0) {
    return <p className="empty-inline">No donations in the current filters to plot over time.</p>;
  }

  return (
    <figure className="series">
      <div className="series-plot">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e2ddd2" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#5c645e", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#ddd6c8" }}
              interval={0}
            />
            <YAxis
              yAxisId="month"
              tickFormatter={(value: number) => formatCompactNzd(value)}
              tick={{ fill: "#2f6a5f", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <YAxis
              yAxisId="total"
              orientation="right"
              tickFormatter={(value: number) => formatCompactNzd(value)}
              tick={{ fill: "#9a7340", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              formatter={(value, name) => [tipAmount(value), name === "amount" ? "Received that month" : "Running total"]}
              labelFormatter={(label) => points.find((point) => point.label === label)?.fullLabel ?? String(label)}
              contentStyle={{
                border: "1px solid #ddd6c8",
                borderRadius: 10,
                background: "#fbfaf6",
                fontSize: 14,
              }}
            />
            <Bar
              yAxisId="month"
              dataKey="amount"
              name="amount"
              fill="#2f6a5f"
              radius={[3, 3, 0, 0]}
              maxBarSize={36}
            />
            <Line
              yAxisId="total"
              dataKey="cumulative"
              name="cumulative"
              stroke="#9a7340"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#fbfaf6", stroke: "#9a7340", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="chart-note">
        Bars use the left axis (amount received that month). The line uses the right axis (running
        total). Both are in New Zealand dollars. Months inside the range with no matching donations
        stay at zero. Only gifts over $20,000 are included.
      </figcaption>
      <div className="visually-hidden">
      <table>
        <caption>Monthly totals for the current filters</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Amount</th>
            <th>Donations</th>
            <th>Cumulative</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.key}>
              <td>{point.fullLabel}</td>
              <td>{formatNzd(point.amount)}</td>
              <td>
                {formatCount(point.count)}
              </td>
              <td>{formatNzd(point.cumulative)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </figure>
  );
}
