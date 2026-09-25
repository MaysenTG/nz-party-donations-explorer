import { ALL_YEARS, selectedYear, withYearFilter } from "../lib/donations.ts";
import { formatCount, formatNzd } from "../lib/format.ts";
import type { Filters, Summary } from "../types.ts";

const SECTIONS = [
  { id: "party-chart-title", label: "Parties" },
  { id: "donor-chart-title", label: "Donors" },
  { id: "time-title", label: "Over time" },
  { id: "election-cycles-title", label: "Elections" },
  { id: "table-title", label: "Table" },
] as const;

type Props = {
  filters: Filters;
  summary: Summary;
  overall: Summary;
  rangeLabel: string;
  onChange: (filters: Filters) => void;
};

export function ExploreBar({ filters, summary, overall, rangeLabel, onChange }: Props) {
  const current = selectedYear(filters);
  const narrowed = summary.donations !== overall.donations;

  return (
    <section className="explore-bar" aria-label="Years, totals, and page sections">
      <nav className="explore-jump" aria-label="On this page">
        <p className="explore-jump-label">Jump to</p>
        <ul>
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="explore-years" id="year-filter">
        <p className="explore-years-label" id="year-filter-label">
          Year received
        </p>
        <div className="year-chips" role="group" aria-labelledby="year-filter-label">
          <button
            type="button"
            className={current === "" ? "is-active" : undefined}
            aria-pressed={current === ""}
            onClick={() => onChange(withYearFilter(filters, ""))}
          >
            All years
          </button>
          {ALL_YEARS.map((year) => (
            <button
              key={year}
              type="button"
              className={current === year ? "is-active" : undefined}
              aria-pressed={current === year}
              onClick={() => onChange(withYearFilter(filters, year))}
            >
              {year}
            </button>
          ))}
        </div>
        {current === null && (
          <p className="year-filter-note">
            Custom date range active. Pick a year or All years to replace it.
          </p>
        )}
      </div>

      <div className="explore-totals" id="summary" aria-live="polite">
        <div className="explore-total-hero">
          <p className="explore-total-label">Total declared</p>
          <p className="explore-total-amount">{formatNzd(summary.total)}</p>
          <p className="explore-totals-range">
            {narrowed ? "Matching" : "All"} donations received in <strong>{rangeLabel}</strong>
            {narrowed ? ` · of ${formatNzd(overall.total)} overall` : ""}
          </p>
        </div>
        <dl className="explore-totals-side">
          <div>
            <dt>Donations</dt>
            <dd>
              {formatCount(summary.donations)}
              {narrowed ? <small>of {formatCount(overall.donations)}</small> : null}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
