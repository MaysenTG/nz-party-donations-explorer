import { formatIsoLong } from "../lib/dates.ts";
import {
  activeFilterCount,
  ALL_PARTIES,
  filtersAreDefault,
  RECEIVED_MAX,
  RECEIVED_MIN,
} from "../lib/donations.ts";
import { ORGANISATION_TERMS } from "../lib/donors.ts";
import { hasParliamentarySeats } from "../lib/partyMeta.ts";
import type { DonorTypeFilter, Filters as FilterState } from "../types.ts";

export type FilterFieldsProps = {
  filters: FilterState;
  partyCounts: Record<string, number>;
  donorTypeCounts: Record<DonorTypeFilter, number>;
  problem: string | null;
  idPrefix?: string;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
};

export function FilterFields({
  filters,
  partyCounts,
  donorTypeCounts,
  problem,
  idPrefix = "",
  onChange,
  onReset,
}: FilterFieldsProps) {
  const allSelected = filters.parties.length === ALL_PARTIES.length;
  const searchId = `${idPrefix}donor-search`;
  const donorTypeName = `${idPrefix}donor-type`;

  function toggleParty(party: string) {
    const selected = filters.parties.includes(party)
      ? filters.parties.filter((item) => item !== party)
      : [...filters.parties, party];
    onChange({ ...filters, parties: selected });
  }

  return (
    <div className="filter-body">
      <div className="field">
        <label htmlFor={searchId}>Search donor</label>
        <div className="search-row">
          <input
            id={searchId}
            type="search"
            placeholder="Donor name"
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
        <p className="field-help">
          Matches the donor name as filed. Individuals on returns over 6
          years old are not named, so they do not match. The search is not saved in the page link.
        </p>
      </div>

      <fieldset className="field">
        <legend>Donor type</legend>
        <div className="segment" role="radiogroup" aria-label="Donor type">
          {(
            [
              ["all", "All"],
              ["individual", "Individuals"],
              ["organisation", "Organisations"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={filters.donorType === value ? "checked" : ""}>
              <input
                type="radio"
                name={donorTypeName}
                value={value}
                checked={filters.donorType === value}
                onChange={() => onChange({ ...filters, donorType: value })}
              />
              <span>
                {label}
                <small> {donorTypeCounts[value].toLocaleString("en-NZ")}</small>
              </span>
            </label>
          ))}
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
        <p className="field-help">
          The Commission notes 2 donations that the party gave back to the donor. They are left out
          of totals unless you include them.
        </p>
        <ul className="party-list exclusion-list">
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
        <legend>Parliament</legend>
        <p className="field-help">
          Hide parties that hold no seats, without changing the party checklist.
        </p>
        <ul className="party-list exclusion-list">
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
        <p className="field-help">
          Renames and spelling variants of one party are combined (for example Greens, National,
          ACT, Te Pāti Māori and the Māori Party, NZ First, TOP). The full list is in About this
          page. Internet MANA (2014) is kept separate from the Internet Party.
        </p>
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
        <ul className="party-list">
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
                    {extra && <small className="party-seat-note"> no current seats</small>}
                  </span>
                  <span className="count">{count.toLocaleString("en-NZ")}</span>
                </label>
              </li>
            );
          })}
        </ul>
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
        <p className="field-help">
          The date the party received the donation, not the filing date. Where a return adds up
          several donations from one donor, this is the date of the latest one
          {RECEIVED_MIN && RECEIVED_MAX
            ? ` (${formatIsoLong(RECEIVED_MIN)} to ${formatIsoLong(RECEIVED_MAX)})`
            : ""}
          .
        </p>
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
        <p className="field-help">
          Commas optional. Each amount is a return total, which can add up several donations.
        </p>
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
  open,
  onOpenChange,
  onChange,
  onReset,
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
        onChange={onChange}
        onReset={onReset}
      />
    </details>
  );
}
