import { formatCount, formatNzd } from "../lib/format.ts";
import type { Summary } from "../types.ts";

type Props = {
  summary: Summary;
  overall: Summary;
  rangeLabel: string;
};

function Context({ current, overall }: { current: string; overall: string }) {
  if (current === overall) return null;
  return <small>of {overall} in the full dataset</small>;
}

export function SummaryStrip({ summary, overall, rangeLabel }: Props) {
  return (
    <section className="summary" id="summary" aria-label="Summary of donations matching the filters">
      <p className="summary-range">
        Totals below include every matching donation received in <strong>{rangeLabel}</strong>
        {summary.donations === overall.donations
          ? ", with no other filters narrowing the list."
          : ", after the filters below."}
      </p>
      <div className="summary-grid">
        <article className="stat">
          <b>{formatNzd(summary.total)}</b>
          <span>Total declared in range</span>
          <Context current={formatNzd(summary.total)} overall={formatNzd(overall.total)} />
        </article>
        <article className="stat">
          <b>{formatCount(summary.donations)}</b>
          <span>Donations in range</span>
          <Context
            current={formatCount(summary.donations)}
            overall={formatCount(overall.donations)}
          />
        </article>
        <article className="stat">
          <b>{formatCount(summary.parties)}</b>
          <span>Parties</span>
          <Context current={formatCount(summary.parties)} overall={formatCount(overall.parties)} />
        </article>
        <article className="stat">
          <b>{formatCount(summary.donors)}</b>
          <span>Donors</span>
          <Context current={formatCount(summary.donors)} overall={formatCount(overall.donors)} />
        </article>
      </div>
    </section>
  );
}
