import { donations } from "./donations.ts";
import { toCents } from "./format.ts";
import { partyColour, shortPartyLabel } from "./parties.ts";
import type { Donation, PartyTotal } from "../types.ts";

export type ElectionCycle = {
  year: number;
  electionIso: string;
  electionLabel: string;
  /** Inclusive start: day after the previous general election. */
  cycleStartIso: string;
  cycleEndIso: string;
};

/**
 * General elections covered by the data. A cycle runs from the day after the previous
 * general election through election day. Dates: electionresults.govt.nz.
 */
export const ELECTION_CYCLES: ElectionCycle[] = [
  { year: 2008, electionIso: "2008-11-08", electionLabel: "8 November 2008", cycleStartIso: "2005-09-18", cycleEndIso: "2008-11-08" },
  { year: 2011, electionIso: "2011-11-26", electionLabel: "26 November 2011", cycleStartIso: "2008-11-09", cycleEndIso: "2011-11-26" },
  { year: 2014, electionIso: "2014-09-20", electionLabel: "20 September 2014", cycleStartIso: "2011-11-27", cycleEndIso: "2014-09-20" },
  { year: 2017, electionIso: "2017-09-23", electionLabel: "23 September 2017", cycleStartIso: "2014-09-21", cycleEndIso: "2017-09-23" },
  { year: 2020, electionIso: "2020-10-17", electionLabel: "17 October 2020", cycleStartIso: "2017-09-24", cycleEndIso: "2020-10-17" },
  { year: 2023, electionIso: "2023-10-14", electionLabel: "14 October 2023", cycleStartIso: "2020-10-18", cycleEndIso: "2023-10-14" },
];

export type CyclePartyTotal = PartyTotal & { colour: string; shortLabel: string };

export type ElectionCycleSummary = {
  cycle: ElectionCycle;
  rows: Donation[];
  parties: CyclePartyTotal[];
  total: number;
};

/** Parties shown by name in each cycle; the rest are grouped as "Other parties". */
const CYCLE_PARTY_LIMIT = 6;

function inCycle(row: Donation, cycle: ElectionCycle): boolean {
  return row.receivedIso >= cycle.cycleStartIso && row.receivedIso <= cycle.cycleEndIso;
}

/**
 * Totals by party for one cycle. Parties are the same merged names used everywhere else
 * on the site. Donations the party returned to the donor are left out.
 */
export function summariseElectionCycle(cycle: ElectionCycle): ElectionCycleSummary {
  const rows = donations.filter((row) => inCycle(row, cycle) && !row.returned_to_donor);
  const buckets = new Map<string, { cents: number; count: number }>();
  let totalCents = 0;
  for (const row of rows) {
    const cents = toCents(row.amount);
    totalCents += cents;
    const current = buckets.get(row.party) ?? { cents: 0, count: 0 };
    current.cents += cents;
    current.count += 1;
    buckets.set(row.party, current);
  }
  const sorted = [...buckets.entries()].sort(
    (a, b) => b[1].cents - a[1].cents || a[0].localeCompare(b[0], "en-NZ"),
  );
  const share = (cents: number) => (totalCents === 0 ? 0 : cents / totalCents);
  const parties: CyclePartyTotal[] = sorted.slice(0, CYCLE_PARTY_LIMIT).map(([party, bucket]) => ({
    id: party,
    label: party,
    shortLabel: shortPartyLabel(party),
    value: bucket.cents / 100,
    count: bucket.count,
    share: share(bucket.cents),
    colour: partyColour(party),
  }));
  const rest = sorted.slice(CYCLE_PARTY_LIMIT);
  if (rest.length > 0) {
    const cents = rest.reduce((sum, [, bucket]) => sum + bucket.cents, 0);
    parties.push({
      id: "other",
      label: "Other parties",
      shortLabel: `Other parties (${rest.length})`,
      value: cents / 100,
      count: rest.reduce((sum, [, bucket]) => sum + bucket.count, 0),
      share: share(cents),
      colour: "#5c645e",
    });
  }
  return { cycle, rows, parties, total: totalCents / 100 };
}

export const ELECTION_CYCLE_SUMMARIES: ElectionCycleSummary[] =
  ELECTION_CYCLES.map(summariseElectionCycle);
