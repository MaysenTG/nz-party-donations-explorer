import { useState } from "react";
import { formatCompactNzd, formatCount, formatNzd } from "../lib/format.ts";
import type { MonthPoint } from "../types.ts";

type Props = {
  points: MonthPoint[];
};

const WIDTH = 720;
const HEIGHT = 268;
const PAD = { top: 16, right: 12, bottom: 32, left: 52 };

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const padded = value * 1.12;
  const power = 10 ** Math.floor(Math.log10(padded));
  const scaled = padded / power;
  const nice = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10;
  return nice * power;
}

function axisLabel(value: number, max: number): string {
  if (max >= 1_000_000) {
    const millions = value / 1_000_000;
    const digits = millions >= 10 || Number.isInteger(millions) ? 0 : 1;
    return `$${millions.toLocaleString("en-NZ", { maximumFractionDigits: digits })}m`;
  }
  if (max >= 10_000) {
    return `$${Math.round(value / 1000).toLocaleString("en-NZ")}k`;
  }
  return formatCompactNzd(value);
}

export function TimeSeries({ points }: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  if (points.length === 0) {
    return <p className="empty-inline">No donations in the current filters to plot over time.</p>;
  }

  const active = points.find((point) => point.key === activeKey) ?? points[points.length - 1];
  const max = niceMax(Math.max(...points.map((point) => point.cumulative)));
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const slot = innerW / points.length;
  const barWidth = Math.min(28, slot * 0.52);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((step) => max * step);
  const yFor = (value: number) => PAD.top + innerH - (value / max) * innerH;
  const line = points
    .map((point, index) => {
      const x = PAD.left + slot * index + slot / 2;
      return `${x},${yFor(point.cumulative)}`;
    })
    .join(" ");

  return (
    <figure className="series">
      <div className="series-readout" aria-live="polite">
        <strong>{active.fullLabel}</strong>
        <span>
          {formatNzd(active.amount)} received
          {active.count === 0
            ? " · no donations over $20,000"
            : ` · ${formatCount(active.count)} ${active.count === 1 ? "donation" : "donations"}`}
        </span>
        <span>Running total {formatNzd(active.cumulative)}</span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="group"
        aria-label="Donations by month, with a cumulative total"
      >
        {ticks.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line className="grid-line" x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} />
              <text className="axis-label" x={PAD.left - 8} y={y + 4} textAnchor="end">
                {axisLabel(tick, max)}
              </text>
            </g>
          );
        })}
        {points.map((point, index) => {
          const x = PAD.left + slot * index + (slot - barWidth) / 2;
          const y = yFor(point.amount);
          const height = Math.max(PAD.top + innerH - y, point.amount > 0 ? 1.5 : 0);
          const selected = point.key === active.key;
          return (
            <g key={point.key}>
              <rect
                className="month-hit"
                x={PAD.left + slot * index}
                y={PAD.top}
                width={slot}
                height={innerH}
                tabIndex={0}
                aria-label={`${point.fullLabel}: ${formatNzd(point.amount)}, ${point.count} donations. Cumulative ${formatNzd(point.cumulative)}.`}
                onMouseEnter={() => setActiveKey(point.key)}
                onFocus={() => setActiveKey(point.key)}
              />
              <rect
                className={selected ? "month-bar is-active" : "month-bar"}
                x={x}
                y={point.amount === 0 ? yFor(0) : y}
                width={barWidth}
                height={height}
                rx={3}
                pointerEvents="none"
              />
              <text className="month-label" x={PAD.left + slot * index + slot / 2} y={HEIGHT - 10} textAnchor="middle">
                {point.label}
              </text>
            </g>
          );
        })}
        <polyline className="cumulative-line" points={line} />
        {points.map((point, index) => {
          const cx = PAD.left + slot * index + slot / 2;
          const selected = point.key === active.key;
          return (
            <circle
              key={point.key}
              className={selected ? "cumulative-dot is-active" : "cumulative-dot"}
              cx={cx}
              cy={yFor(point.cumulative)}
              r={selected ? 4.5 : 3}
              pointerEvents="none"
            />
          );
        })}
      </svg>
      <figcaption className="chart-note">
        Bars are the amount received that month. The line is the running total. Months inside the
        range with no matching donations are left at zero. Only gifts over $20,000 are included, and
        a return can be published after the month the party received the money.
      </figcaption>
      <table className="visually-hidden">
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
              <td>{point.count}</td>
              <td>{formatNzd(point.cumulative)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
