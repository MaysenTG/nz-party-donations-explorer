import { formatIsoLong } from "../lib/dates.ts";
import { ALL_PARTIES } from "../lib/donations.ts";
import { formatNzd } from "../lib/format.ts";
import type { Filters } from "../types.ts";

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
};

function amountLabel(value: string): string {
  const numeric = Number(value.trim().replace(/[$,\s]/g, ""));
  return Number.isFinite(numeric) ? formatNzd(numeric) : value;
}

export function ActiveFilters({ filters, onChange, onReset }: Props) {
  const allParties =
    filters.parties.length === ALL_PARTIES.length &&
    ALL_PARTIES.every((party) => filters.parties.includes(party));
  const selectedParties = [...filters.parties].sort((a, b) => a.localeCompare(b, "en-NZ"));

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (!allParties) {
    for (const party of selectedParties) {
      chips.push({
        key: `party-${party}`,
        label: party,
        onRemove: () => {
          const remaining = filters.parties.filter((item) => item !== party);
          onChange({
            ...filters,
            parties: remaining.length === 0 ? [...ALL_PARTIES] : remaining,
          });
        },
      });
    }
    if (selectedParties.length === 0) {
      chips.push({
        key: "parties-none",
        label: "No parties selected",
        onRemove: () => onChange({ ...filters, parties: [...ALL_PARTIES] }),
      });
    }
  }
  if (filters.from) {
    chips.push({
      key: "from",
      label: `From ${formatIsoLong(filters.from)}`,
      onRemove: () => onChange({ ...filters, from: "" }),
    });
  }
  if (filters.to) {
    chips.push({
      key: "to",
      label: `To ${formatIsoLong(filters.to)}`,
      onRemove: () => onChange({ ...filters, to: "" }),
    });
  }
  if (filters.minAmount.trim()) {
    chips.push({
      key: "min",
      label: `At least ${amountLabel(filters.minAmount)}`,
      onRemove: () => onChange({ ...filters, minAmount: "" }),
    });
  }
  if (filters.maxAmount.trim()) {
    chips.push({
      key: "max",
      label: `At most ${amountLabel(filters.maxAmount)}`,
      onRemove: () => onChange({ ...filters, maxAmount: "" }),
    });
  }
  if (filters.query.trim()) {
    chips.push({
      key: "query",
      label: `Search: ${filters.query.trim()}`,
      onRemove: () => onChange({ ...filters, query: "" }),
    });
  }
  if (filters.donorType === "individual") {
    chips.push({
      key: "type",
      label: "Individuals",
      onRemove: () => onChange({ ...filters, donorType: "all" }),
    });
  }
  if (filters.donorType === "organisation") {
    chips.push({
      key: "type",
      label: "Organisations",
      onRemove: () => onChange({ ...filters, donorType: "all" }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="chips" aria-label="Active filters">
      {chips.map((chip) => (
        <button key={chip.key} type="button" className="chip" onClick={chip.onRemove}>
          <span>{chip.label}</span>
          <span className="visually-hidden">Remove filter</span>
          <span aria-hidden="true">×</span>
        </button>
      ))}
      <button type="button" className="text-button" onClick={onReset}>
        Reset
      </button>
    </div>
  );
}
