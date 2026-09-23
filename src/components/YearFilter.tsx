import { ALL_YEARS, selectedYear, withYearFilter } from "../lib/donations.ts";
import type { Filters } from "../types.ts";

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export function YearFilter({ filters, onChange }: Props) {
  const current = selectedYear(filters);

  return (
    <section className="year-filter" aria-label="Filter by year received">
      <div className="year-filter-head">
        <h2>Year received</h2>
        <p>Quick filter by the calendar year the party received the donation.</p>
      </div>
      <div className="year-chips" role="group" aria-label="Years">
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
          A custom date range is active. Pick a year above, or choose All years, to replace it.
        </p>
      )}
    </section>
  );
}
