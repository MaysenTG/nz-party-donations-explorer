import {
  activeFilterCount,
  ALL_PARTIES,
  filtersAreDefault,
  RECEIVED_MAX,
  RECEIVED_MIN,
} from "../lib/donations.ts";
import { ORGANISATION_TERMS } from "../lib/donors.ts";
import { formatCount } from "../lib/format.ts";
import { hasParliamentarySeats } from "../lib/partyMeta.ts";
import type { DonorTypeFilter, Filters as FilterState } from "../types.ts";

export type FilterFieldsProps = {
  filters: FilterState;
  partyCounts: Record<string, number>;
  donorTypeCounts: Record<DonorTypeFilter, number>;
  problem: string | null;
  /** Matching returns for the current filters (used for live search feedback). */
  matchCount: number;
  idPrefix?: string;
  /** Compact layout for the mobile sheet: help text hidden, party list collapsed. */
  compact?: boolean;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  onViewDonorGroups?: () => void;
};

export function FilterFields({
  filters,
  partyCounts,
  donorTypeCounts,
  problem,
  matchCount,
  idPrefix = "",
  compact = false,
  onChange,
  onReset,
  onViewDonorGroups,
}: FilterFieldsProps) {
  const allSelected = filters.parties.length === ALL_PARTIES.length;
  const searchId = `${idPrefix}donor-search`;
  const donorTypeName = `${idPrefix}donor-type`;
  const searchQuery = filters.query.trim();
  const searchStatus =
    searchQuery === ""
      ? null
      : matchCount === 0
        ? `No returns match “${searchQuery}”`
        : `${formatCount(matchCount)} ${matchCount === 1 ? "return matches" : "returns match"} “${searchQuery}”`;

  function toggleParty(party: string) {
    const selected = filters.parties.includes(party)
      ? filters.parties.filter((item) => item !== party)
      : [...filters.parties, party];
    onChange({ ...filters, parties: selected });
  }

  const partyControls = (
    <>
        <div className="inline-actions">
          <button
            type="button"
            className="text-button"
            onClick={() => onChange({ ...filters, parties: [...ALL_PARTIES] })}
            disabled={allSelected}
          >
            Select all
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => onChange({ ...filters, parties: [] })}
            disabled={filters.parties.length === 0}
          >
            Clear
          </button>
        </div>
        <ul className="filter-list filter-list-scroll">
          {ALL_PARTIES.map((party) => {
            const count = partyCounts[party] ?? 0;
            const extra = !hasParliamentarySeats(party);
            return (
              <li key={party}>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.parties.includes(party)}
                    onChange={() => toggleParty(party)}
                  />
                  <span>
                    {party}
                    {extra && <small className="party-seat-note"> no seats</small>}
                  </span>
                  <span className="count">{count.toLocaleString("en-NZ")}</span>
                </label>
              </li>
            );
          })}
        </ul>
    </>
  );

  return (
    <div className="filter-body">
      <div className="field">
        <label htmlFor={searchId}>Search donor name</label>
        <div className="search-row">
          <input
            id={searchId}
            type="search"
            placeholder="Donor name, not party"
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            autoComplete="off"
          />
          {filters.query && (
            <button
              type="button"
              className="text-button"
              onClick={() => onChange({ ...filters, query: "" })}
            >
              Clear
            </button>
          )}
        </div>
        {searchStatus && (
          <p
            className={`search-status${matchCount === 0 ? " is-empty" : ""}`}
            aria-live="polite"
          >
            {searchStatus}
          </p>
        )}
      </div>

      <fieldset className="field">
        <legend>Donor type</legend>
        <div role="radiogroup" aria-label="Donor type">
          <ul className="filter-list">
            {(
              [
                ["all", "All"],
                ["individual", "Individuals"],
                ["organisation", "Organisations"],
              ] as const
            ).map(([value, label]) => (
              <li key={value}>
                <label>
                  <input
                    type="radio"
                    name={donorTypeName}
                    value={value}
                    checked={filters.donorType === value}
                    onChange={() => onChange({ ...filters, donorType: value })}
                  />
                  <span>{label}</span>
                  <span className="count">{donorTypeCounts[value].toLocaleString("en-NZ")}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        <details className="hint">
          <summary>How donor type is decided</summary>
          <p>
            Treated as an organisation if the name contains {ORGANISATION_TERMS.join(", ")}, plus a
            short list of names checked by hand. Everyone else is an individual, including joint
            personal names. This is a reading aid, not an Electoral Commission classification.
          </p>
        </details>
      </fieldset>

      <fieldset className="field">
        <legend>Returned donations</legend>
        <ul className="filter-list">
          <li>
            <label>
              <input
                type="checkbox"
                checked={filters.includeReturned}
                onChange={(event) => onChange({ ...filters, includeReturned: event.target.checked })}
              />
              <span>Include donations returned to the donor</span>
            </label>
          </li>
        </ul>
      </fieldset>

      <fieldset className="field">
        <legend>Related donors</legend>
        <ul className="filter-list">
          <li>
            <label>
              <input
                type="checkbox"
                checked={filters.groupRelatedDonors}
                onChange={(event) =>
                  onChange({ ...filters, groupRelatedDonors: event.target.checked })
                }
              />
              <span>Group related donors</span>
            </label>
          </li>
        </ul>
        <details className="hint">
          <summary>How related donors are grouped</summary>
          <p>
            Optional reading aid for charts and the table. Only listed same-person or same-entity
            name variants are combined (for example spelling differences, Ltd vs Limited, or a
            person and their company). Spouses and other family members stay separate. Each return
            still shows the name as filed. Not an Electoral Commission classification.
          </p>
          {onViewDonorGroups && (
            <p>
              <button type="button" className="text-button" onClick={onViewDonorGroups}>
                View related donor groups
              </button>
            </p>
          )}
        </details>
      </fieldset>

      <fieldset className="field">
        <legend>Older names</legend>
        <ul className="filter-list">
          <li>
            <label>
              <input
                type="checkbox"
                checked={filters.withholdOldNames}
                onChange={(event) =>
                  onChange({ ...filters, withholdOldNames: event.target.checked })
                }
              />
              <span>Hide names older than 6 years</span>
            </label>
          </li>
        </ul>
        <details className="hint">
          <summary>Why this exists</summary>
          <p>
            Returns stay open for public inspection for 6 years. This site shows older names by
            default so the history stays clear. Turn this on to hide individual names (and
            organisation names that include a person) on returns older than that. Amounts and
            parties stay visible either way.
          </p>
        </details>
      </fieldset>

      <fieldset className="field">
        <legend>Parliament</legend>
        <ul className="filter-list">
          <li>
            <label>
              <input
                type="checkbox"
                checked={filters.hideExtraParliamentary}
                onChange={(event) =>
                  onChange({ ...filters, hideExtraParliamentary: event.target.checked })
                }
              />
              <span>Hide parties with no current seats in Parliament</span>
            </label>
          </li>
        </ul>
      </fieldset>

      <fieldset className="field">
        <legend>Party</legend>
        {compact ? (
          <details className="party-collapse">
            <summary>
              {allSelected
                ? `All ${ALL_PARTIES.length} parties`
                : `${filters.parties.length} of ${ALL_PARTIES.length} parties`}
            </summary>
            {partyControls}
          </details>
        ) : (
          partyControls
        )}
      </fieldset>

      <fieldset className="field">
        <legend>Donation date</legend>
        <div className="pair">
          <label>
            From
            <input
              type="date"
              value={filters.from}
              min={RECEIVED_MIN}
              max={filters.to || RECEIVED_MAX}
              onChange={(event) => onChange({ ...filters, from: event.target.value })}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={filters.to}
              min={filters.from || RECEIVED_MIN}
              max={RECEIVED_MAX}
              onChange={(event) => onChange({ ...filters, to: event.target.value })}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>Amount (NZD)</legend>
        <div className="pair">
          <label>
            Minimum
            <input
              type="text"
              inputMode="decimal"
              placeholder="No minimum"
              value={filters.minAmount}
              onChange={(event) => onChange({ ...filters, minAmount: event.target.value })}
            />
          </label>
          <label>
            Maximum
            <input
              type="text"
              inputMode="decimal"
              placeholder="No maximum"
              value={filters.maxAmount}
              onChange={(event) => onChange({ ...filters, maxAmount: event.target.value })}
            />
          </label>
        </div>
      </fieldset>

      {problem && (
        <p className="filter-problem" role="alert">
          {problem}
        </p>
      )}

      <button
        type="button"
        className="reset-button"
        onClick={onReset}
        disabled={filtersAreDefault(filters)}
      >
        Reset filters
      </button>
    </div>
  );
}

type Props = FilterFieldsProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function Filters({
  filters,
  partyCounts,
  donorTypeCounts,
  problem,
  matchCount,
  open,
  onOpenChange,
  onChange,
  onReset,
  onViewDonorGroups,
}: Props) {
  const active = activeFilterCount(filters);

  return (
    <details
      id="filters-panel"
      className="filters"
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
    >
      <summary>
        <span>Filters</span>
        <span className="summary-meta">
          {active > 0 && <span className="badge">{active} active</span>}
          <span className="when-open">Hide</span>
          <span className="when-closed">Show</span>
        </span>
      </summary>

      <FilterFields
        filters={filters}
        partyCounts={partyCounts}
        donorTypeCounts={donorTypeCounts}
        problem={problem}
        matchCount={matchCount}
        onChange={onChange}
        onReset={onReset}
        onViewDonorGroups={onViewDonorGroups}
      />
    </details>
  );
}
