import { formatCompactNzd, formatCount, formatNzd, formatShare } from "../lib/format.ts";
import type { ElectionCycleSummary } from "../lib/elections.ts";
import {
  darkenColour,
  partyColour,
  partyColourInk,
  shortPartyLabel,
} from "../lib/parties.ts";
import { axisTicks } from "../lib/scale.ts";

type Props = {
  cycles: ElectionCycleSummary[];
};

export function ElectionCycles({ cycles }: Props) {
  return (
    <section className="election-cycles card wide" aria-labelledby="election-cycles-title">
      <div className="card-head">
        <h2 id="election-cycles-title">Election cycles and large donations</h2>
        <p>
          Each cycle runs from the day after the previous general election through election day.
          Totals only include gifts that crossed the Electoral Commission’s disclosure thresholds —
          not all campaign funding. Many factors decide who forms government; this shows how much
          disclosed large-donation money the winning party received in that window.
        </p>
      </div>

      <div className="election-grid">
        {cycles.map((summary) => {
          const { cycle, parties, total, winnerTotal, winnerShare, winnerRank, hadMostDonations } =
            summary;
          const winnerColour = partyColour(cycle.winnerLabel);
          const topParties = parties.slice(0, 6);
          const { top, ticks } = axisTicks(
            Math.max(0, ...topParties.map((party) => party.value)),
          );

          return (
            <article key={cycle.year} className="election-card">
              <header className="election-card-head">
                <div>
                  <h3>{cycle.year} general election</h3>
                  <p>
                    {cycle.electionLabel} · {cycle.government}
                  </p>
                </div>
                <span
                  className="winner-pill"
                  style={{
                    background: winnerColour,
                    color: partyColourInk(winnerColour),
                  }}
                >
                  {cycle.winnerLabel} formed government
                </span>
              </header>

              <dl className="election-stats">
                <div>
                  <dt>Winner’s disclosed large donations</dt>
                  <dd>{formatNzd(winnerTotal)}</dd>
                </div>
                <div>
                  <dt>Share of cycle total</dt>
                  <dd>{total === 0 ? "—" : formatShare(winnerShare)}</dd>
                </div>
                <div>
                  <dt>Among parties in this cycle</dt>
                  <dd>
                    {winnerRank == null || total === 0
                      ? "No disclosed returns in range"
                      : hadMostDonations
                        ? "Most disclosed large donations"
                        : `Ranked #${winnerRank} for disclosed large donations`}
                  </dd>
                </div>
              </dl>

              {topParties.length === 0 ? (
                <p className="empty-inline">
                  No disclosed returns in this dataset fall inside this campaign cycle.
                </p>
              ) : (
                <figure className="rank-chart election-rank">
                  <ol className="rank-rows">
                    {topParties.map((party) => {
                      const width =
                        top === 0
                          ? 0
                          : Math.max((party.value / top) * 100, party.value > 0 ? 1.2 : 0);
                      const isWinner = party.family === cycle.winnerFamily;
                      return (
                        <li key={party.id}>
                          <div className={`rank-row static${isWinner ? " is-winner" : ""}`}>
                            <span className="rank-copy">
                              <span className="rank-label">
                                {shortPartyLabel(party.label)}
                                {isWinner ? " · winner" : ""}
                              </span>
                              <span className="rank-meta">
                                {formatCount(party.count)}{" "}
                                {party.count === 1 ? "donation" : "donations"} ·{" "}
                                {formatShare(party.share)}
                              </span>
                            </span>
                            <span className="rank-plot">
                              <span className="rank-track" aria-hidden="true">
                                <span
                                  className="rank-fill"
                                  style={{
                                    width: `${width}%`,
                                    background: isWinner
                                      ? darkenColour(party.colour, 0.08)
                                      : party.colour,
                                  }}
                                />
                              </span>
                              <span className="rank-value">
                                {formatCompactNzd(party.value)}
                                <span className="visually-hidden"> ({formatNzd(party.value)})</span>
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
            </article>
          );
        })}
      </div>
    </section>
  );
}
