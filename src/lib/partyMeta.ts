import { partyFamily, type PartyFamily } from "./parties.ts";

/** Parties with seats in the 54th New Zealand Parliament. */
const PARLIAMENTARY_FAMILIES = new Set<PartyFamily>([
  "national",
  "labour",
  "green",
  "act",
  "nzfirst",
  "maori",
]);

export function hasParliamentarySeats(party: string): boolean {
  const family = partyFamily(party);
  return family !== null && PARLIAMENTARY_FAMILIES.has(family);
}
