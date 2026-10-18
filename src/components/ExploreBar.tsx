import { Ref } from "./Ref.tsx";
import { jumpTo } from "../lib/jump.ts";
import { ALL_YEARS, selectedYear, withYearFilter } from "../lib/donations.ts";
import type { Filters } from "../types.ts";

const SECTIONS = [
  { id: "party-chart-title", label: "Parties" },
  { id: "donor-chart-title", label: "Donors" },
  { id: "time-title", label: "Over time" },
  { id: "party-year-title", label: "Party by year" },
  { id: "multi-title", label: "Several parties" },
  { id: "size-title", label: "Sizes" },
  { id: "election-cycles-title", label: "Elections" },
  { id: "table-title", label: "Table" },
] as const;

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export function ExploreBar({ filters, onChange }: Props) {
  const current = selectedYear(filters);

  return (
    <section className="explore-bar" aria-label="Years and page sections">
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
        <p className="year-filter-note year-gap-note">
          No 2024 or 2025: the Commission lists no returns for those years
          <Ref n={5} /> (<a href="#no-2024-2025" onClick={(e) => jumpTo("no-2024-2025", e)}>why</a>).
        </p>
        {current === null && (
          <p className="year-filter-note">
            Custom date range active. Pick a year or All years to replace it.
          </p>
        )}
      </div>

    </section>
  );
}
