import { Ref } from "./Ref.tsx";
import { jumpTo } from "../lib/jump.ts";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useElementWidth } from "../hooks/useElementWidth.ts";
import { formatCompactNzd, formatNzd } from "../lib/format.ts";
import { OTHER_PARTIES, type PartyYearSeries } from "../lib/insights.ts";
import { partyColour, shortPartyLabel } from "../lib/parties.ts";

type Props = { series: PartyYearSeries };

function colourFor(party: string): string {
  return party === OTHER_PARTIES ? "#a8a196" : partyColour(party);
}

export function PartyYearChart({ series }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  if (series.rows.length === 0) {
    return <p className="empty-inline">No returns in these filters.</p>;
  }
  const narrow = width > 0 && width < 560;
  return (
    <figure className="series">
      <ul className="legend party-legend">
        {series.parties.map((party) => (
          <li key={party}>
            <i className="party-dot" style={{ background: colourFor(party) }} aria-hidden="true" />
            {party === OTHER_PARTIES ? party : shortPartyLabel(party)}
          </li>
        ))}
      </ul>
      <div ref={ref} className="series-plot">
        {width > 0 && (
          <BarChart
            width={width}
            height={narrow ? 300 : 340}
            data={series.rows}
            margin={{ top: 8, right: 8, bottom: 12, left: narrow ? 0 : 8 }}
          >
            <CartesianGrid vertical={false} stroke="#e6e0d4" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(value: number) => formatCompactNzd(value)}
              width={narrow ? 52 : 64}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value, name) => [formatNzd(Number(value)), String(name)]}
              labelFormatter={(label) => `Received in ${label}`}
            />
            {series.parties.map((party) => (
              <Bar
                key={party}
                dataKey={party}
                stackId="party"
                fill={colourFor(party)}
                stroke="#fbfaf6"
                strokeWidth={0.5}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        )}
      </div>
      <figcaption>
        Amount declared by the year of each return's latest donation date, stacked by party. The
        Commission lists no returns for 2024 or 2025
        <Ref n={5} />, so those years show no bar (<a href="#no-2024-2025" onClick={(e) => jumpTo("no-2024-2025", e)}>why</a>).
      </figcaption>
      <div className="visually-hidden">
        <table>
          <caption>Amount by party and year</caption>
          <thead>
            <tr>
              <th scope="col">Year</th>
              {series.parties.map((party) => (
                <th scope="col" key={party}>
                  {party}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series.rows.map((row) => (
              <tr key={String(row.year)}>
                <th scope="row">{row.year}</th>
                {series.parties.map((party) => (
                  <td key={party}>{formatNzd(Number(row[party]))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
