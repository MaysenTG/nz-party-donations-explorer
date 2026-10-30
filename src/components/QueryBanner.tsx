import { ALL_PARTIES } from "../lib/donations.ts";
import { partiesMatchingQuery } from "../lib/partyMatch.ts";
import { formatNzd } from "../lib/format.ts";
import { shortPartyLabel } from "../lib/parties.ts";
import type { Filters, PartyTotal } from "../types.ts";

type Props = {
  query: string;
  partyTotals: PartyTotal[];
  filters: Filters;
  onChange: (filters: Filters) => void;
};

/** Explains donor-name search when it looks like a party filter (e.g. “national”). */
export function QueryBanner({ query, partyTotals, filters, onChange }: Props) {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const matched = partiesMatchingQuery(trimmed, ALL_PARTIES);
  const suggested = matched.length === 1 ? matched[0] : null;
  const total = partyTotals.reduce((sum, party) => sum + party.value, 0);
  const parts = partyTotals
    .filter((party) => party.value > 0)
    .map((party) => `${formatNzd(party.value)} to ${shortPartyLabel(party.id)}`);

  return (
    <div className="query-banner" role="status">
      <p>
        Showing returns whose <strong>donor name</strong> contains “{trimmed}”. This is not a
        party filter.
        {parts.length > 1 && <> Matching money went to more than one party ({parts.join("; ")}).</>}
        {parts.length === 1 && total > 0 && <> All matching money went to {parts[0]}.</>}
      </p>
      {suggested && (
        <p>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              onChange({
                ...filters,
                query: "",
                parties: [suggested],
              })
            }
          >
            Show all returns to {shortPartyLabel(suggested)} instead
          </button>
        </p>
      )}
    </div>
  );
}
