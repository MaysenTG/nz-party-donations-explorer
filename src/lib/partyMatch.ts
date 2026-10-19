import { partyFamily, shortPartyLabel } from "./parties.ts";

/**
 * Parties whose short label or published name the query is clearly aiming at.
 * Used to offer “show this party instead” when donor search looks like a party name.
 */
export function partiesMatchingQuery(query: string, parties: readonly string[]): string[] {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 3) return [];

  return parties.filter((party) => {
    const short = shortPartyLabel(party).toLowerCase();
    const full = party.toLowerCase();
    const family = partyFamily(party);
    if (short === q || full === q) return true;
    // Whole-word style: query is the short label, or short label starts with query.
    if (short.startsWith(q) || q.startsWith(short)) return true;
    if (family && (family === q || family.startsWith(q))) return true;
    // Avoid matching "national" inside long unrelated strings via full name only when
    // the short label also relates (National Party contains "national").
    if (full.includes(q) && (short.includes(q) || q.includes(short))) return true;
    return false;
  });
}
