import { jumpTo } from "../lib/jump.ts";
import { ALL_YEARS, selectedYear, withYearFilter } from "../lib/donations.ts";
import { useMatchMedia } from "../hooks/useMatchMedia.ts";
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
  const isMobile = useMatchMedia("(max-width: 760px)");

  return (
    <section className="explore-bar" aria-label="Years and page sections">
      {!isMobile && (
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
      )}

      <div className="explore-years" id="year-filter">
        <p className="explore-years-label" id="year-filter-label">
          Year received
        </p>
        {isMobile ? (
          <label className="year-select-label">
            <span className="visually-hidden">Year received</span>
            <select
              className="year-select"
              value={current === null ? "__custom" : current}
              aria-labelledby="year-filter-label"
              onChange={(event) => {
                const value = event.target.value;
                if (value === "__custom") return;
                onChange(withYearFilter(filters, value));
              }}
            >
              <option value="">All years</option>
              {current === null && <option value="__custom">Custom date range</option>}
              {ALL_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        ) : (
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
        )}
        <p className="year-filter-note year-gap-note">
          No 2024 or 2025 (
          <a
            href="#no-2024-2025"
            onClick={(e) => {
              const panel = document.getElementById("how-the-data-works");
              if (panel instanceof HTMLDetailsElement) panel.open = true;
              jumpTo("no-2024-2025", e);
            }}
          >
            why
          </a>
          ).
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
