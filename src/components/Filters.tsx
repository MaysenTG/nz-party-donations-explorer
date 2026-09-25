import { formatIsoLong } from "../lib/dates.ts";
import {
  activeFilterCount,
  ALL_PARTIES,
  filtersAreDefault,
  RECEIVED_MAX,
  RECEIVED_MIN,
} from "../lib/donations.ts";
import { ORGANISATION_TERMS } from "../lib/donors.ts";
import { SUGGESTED_DONOR_EXCLUSIONS } from "../lib/exclusions.ts";
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
  const excludedSet = new Set(filters.excludedDonors);
  const searchId = `${idPrefix}donor-search`;
  const donorTypeName = `${idPrefix}donor-type`;

  function toggleParty(party: string) {
    const selected = filters.parties.includes(party)
      ? filters.parties.filter((item) => item !== party)
      : [...filters.parties, party];
    onChange({ ...filters, parties: selected });
  }

  function toggleExcludedDonor(name: string) {
    const excludedDonors = excludedSet.has(name)
      ? filters.excludedDonors.filter((item) => item !== name)
      : [...filters.excludedDonors, name];
    onChange({ ...filters, excludedDonors });
  }

  return (
    <div className="filter-body">
      <div className="field">
        <label htmlFor={searchId}>Search donor</label>
        <div className="search-row">
          <input
            id={searchId}
            type="search"
            placeholder="Name or address"
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
          Matches donor name or address. Chart selection uses the same search, so related wording
          (for example “via … Trust”) is included.
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
            Treated as an organisation if the name contains {ORGANISATION_TERMS.join(", ")}.
            Everyone else is an individual, including joint personal names. This is a reading aid,
            not an Electoral Commission classification.
          </p>
        </details>
      </fieldset>

      <fieldset className="field">
        <legend>Exclusions</legend>
        <p className="field-help">
          Hide names from totals, charts, and the table without changing the party checklist.
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
          {SUGGESTED_DONOR_EXCLUSIONS.map((item) => (
            <li key={item.name}>
              <label>
                <input
                  type="checkbox"
                  checked={excludedSet.has(item.name)}
                  onChange={() => toggleExcludedDonor(item.name)}
                />
                <span>
                  Exclude {item.name}
                  <small className="exclusion-note">{item.note}</small>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset className="field">
        <legend>Party</legend>
        <p className="field-help">
          Renames and spelling variants are combined (for example Greens, National, ACT, Te Pāti
          Māori / Māori Party, NZ First, TOP, and Internet Party / Internet MANA).
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
        <legend>Date received</legend>
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
          Date the party received the donation
          {RECEIVED_MIN && RECEIVED_MAX
            ? ` (${formatIsoLong(RECEIVED_MIN)} to ${formatIsoLong(RECEIVED_MAX)})`
            : ""}
          — not the filing date.
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
          Commas optional. These amounts crossed the $20,000 or $30,000 disclosure thresholds.
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
