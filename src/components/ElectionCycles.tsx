import { useState } from "react";
import { formatCompactNzd, formatCount, formatNzd, formatShare } from "../lib/format.ts";
import type { ElectionCycleSummary } from "../lib/elections.ts";
import { axisTicks } from "../lib/scale.ts";

type Props = {
  cycles: ElectionCycleSummary[];
};

export function ElectionCycles({ cycles }: Props) {
  const [openYear, setOpenYear] = useState<number | null>(
    () => cycles[cycles.length - 1]?.cycle.year ?? null,
  );

  return (
    <section className="election-cycles card wide" aria-labelledby="election-cycles-title">
      <div className="card-head">
        <h2 id="election-cycles-title">Election cycles</h2>
        <p>
          Returns with a donation date from the day after the previous election through election
          day. Donations the party gave back are left out. This is not full campaign funding.
          Parties are listed by amount disclosed.
        </p>
      </div>

      <div className="election-list">
        {cycles.map((summary) => {
          const { cycle, parties, total, rows } = summary;
          const isOpen = openYear === cycle.year;
          const topParties = parties;
          const { top, ticks } = axisTicks(
            Math.max(0, ...topParties.map((party) => party.value)),
          );

          return (
            <article
              key={cycle.year}
              className={`election-card${isOpen ? " is-open" : ""}`}
            >
              <button
                type="button"
                className="election-summary"
                aria-expanded={isOpen}
                onClick={() => setOpenYear(isOpen ? null : cycle.year)}
              >
                <span className="election-summary-main">
                  <span className="election-summary-year">{cycle.year}</span>
                  <span className="election-summary-copy">
                    <span className="election-summary-gov">Election on {cycle.electionLabel}</span>
                    <span className="election-summary-meta">
                      {total === 0
                        ? "No disclosed returns in this data"
                        : `${formatCompactNzd(total)} disclosed in ${formatCount(rows.length)} ${
                            rows.length === 1 ? "return" : "returns"
                          }`}
                    </span>
                  </span>
                </span>
              </button>

              <div className="election-detail" hidden={!isOpen}>
                  {topParties.length === 0 ? (
                    <p className="empty-inline">
                      No disclosed returns in this data fall in this campaign cycle.
                    </p>
                  ) : (
                    <figure className="rank-chart election-rank">
                      <ol className="rank-rows">
                        {topParties.map((party) => {
                          const width =
                            top === 0
                              ? 0
                              : Math.max((party.value / top) * 100, party.value > 0 ? 1.2 : 0);
                          return (
                            <li key={party.id}>
                              <div className="rank-row static">
                                <span className="rank-copy">
                                  <span className="rank-label">
                                    {party.shortLabel}
                                  </span>
                                  <span className="rank-meta">
                                    {formatCount(party.count)}{" "}
                                    {party.count === 1 ? "return" : "returns"} ·{" "}
                                    {formatShare(party.share)}
                                  </span>
                                </span>
                                <span className="rank-plot">
                                  <span className="rank-track" aria-hidden="true">
                                    <span
                                      className="rank-fill"
                                      style={{
                                        width: `${width}%`,
                                        background: party.colour,
                                      }}
                                    />
                                  </span>
                                  <span className="rank-value">
                                    {formatCompactNzd(party.value)}
                                    <span className="visually-hidden">
                                      {" "}
                                      ({formatNzd(party.value)})
                                    </span>
                                  </span>
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                      <div className="rank-scale" aria-hidden="true">
                        <span className="rank-scale-spacer" />
                        <span className="rank-scale-axis">
                          {ticks.map((tick, index) => (
                            <span
                              key={tick}
                              className={
                                index === 0
                                  ? "is-start"
                                  : index === ticks.length - 1
                                    ? "is-end"
                                    : undefined
                              }
                              style={{ left: `${top === 0 ? 0 : (tick / top) * 100}%` }}
                            >
                              {formatCompactNzd(tick)}
                            </span>
                          ))}
                        </span>
                        <span className="rank-scale-value" />
                      </div>
                    </figure>
                  )}
                </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
