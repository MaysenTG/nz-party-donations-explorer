import { formatCount, formatNzd } from "../lib/format.ts";
import type { Summary } from "../types.ts";

type Props = {
  summary: Summary;
  overall: Summary;
};

function Context({ current, overall }: { current: string; overall: string }) {
  if (current === overall) return null;
  return <small>of {overall}</small>;
}

export function SummaryStrip({ summary, overall }: Props) {
  return (
    <section className="summary" aria-label="Summary of donations matching the filters">
      <article className="stat">
        <b>{formatNzd(summary.total)}</b>
        <span>Total declared</span>
        <Context current={formatNzd(summary.total)} overall={formatNzd(overall.total)} />
      </article>
      <article className="stat">
        <b>{formatCount(summary.donations)}</b>
        <span>Donations</span>
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
    </section>
  );
}
