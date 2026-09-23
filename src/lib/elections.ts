import { donations } from "./donations.ts";
import { toCents } from "./format.ts";
import { partyColour, partyFamily, shortPartyLabel, type PartyFamily } from "./parties.ts";
import type { Donation, PartyTotal } from "../types.ts";

export type ElectionCycle = {
  year: number;
  electionIso: string;
  electionLabel: string;
  /** Inclusive start: day after the previous general election. */
  cycleStartIso: string;
  cycleEndIso: string;
  winnerFamily: PartyFamily;
  winnerLabel: string;
  government: string;
};

/**
 * General elections covered by the donation dataset window.
 * Campaign cycle = day after the previous election through election day.
 * Sources: electionresults.govt.nz; Te Ara / Wikipedia for government formation.
 */
export const ELECTION_CYCLES: ElectionCycle[] = [
  {
    year: 2008,
    electionIso: "2008-11-08",
    electionLabel: "8 November 2008",
    cycleStartIso: "2005-09-18",
    cycleEndIso: "2008-11-08",
    winnerFamily: "national",
    winnerLabel: "National",
    government: "National-led government",
  },
  {
    year: 2011,
    electionIso: "2011-11-26",
    electionLabel: "26 November 2011",
    cycleStartIso: "2008-11-09",
    cycleEndIso: "2011-11-26",
    winnerFamily: "national",
    winnerLabel: "National",
    government: "National-led government",
  },
  {
    year: 2014,
    electionIso: "2014-09-20",
    electionLabel: "20 September 2014",
    cycleStartIso: "2011-11-27",
    cycleEndIso: "2014-09-20",
    winnerFamily: "national",
    winnerLabel: "National",
    government: "National-led government",
  },
  {
    year: 2017,
    electionIso: "2017-09-23",
    electionLabel: "23 September 2017",
    cycleStartIso: "2014-09-21",
    cycleEndIso: "2017-09-23",
    winnerFamily: "labour",
    winnerLabel: "Labour",
    government: "Labour–NZ First coalition, Greens confidence and supply",
  },
  {
    year: 2020,
    electionIso: "2020-10-17",
    electionLabel: "17 October 2020",
    cycleStartIso: "2017-09-24",
    cycleEndIso: "2020-10-17",
    winnerFamily: "labour",
    winnerLabel: "Labour",
    government: "Labour majority government",
  },
  {
    year: 2023,
    electionIso: "2023-10-14",
    electionLabel: "14 October 2023",
    cycleStartIso: "2020-10-18",
    cycleEndIso: "2023-10-14",
    winnerFamily: "national",
    winnerLabel: "National",
    government: "National–ACT–NZ First coalition",
  },
];

export type CyclePartyTotal = PartyTotal & {
  colour: string;
  family: PartyFamily | null;
  shortLabel: string;
};

export type ElectionCycleSummary = {
  cycle: ElectionCycle;
  rows: Donation[];
  parties: CyclePartyTotal[];
  total: number;
  winnerTotal: number;
  winnerShare: number;
  winnerRank: number | null;
  hadMostDonations: boolean;
};

function inCycle(row: Donation, cycle: ElectionCycle): boolean {
  return row.receivedIso >= cycle.cycleStartIso && row.receivedIso <= cycle.cycleEndIso;
}

export function summariseElectionCycle(cycle: ElectionCycle): ElectionCycleSummary {
  const rows = donations.filter((row) => inCycle(row, cycle));

  const familyBuckets = new Map<
    PartyFamily,
    { cents: number; count: number; label: string }
  >();
  let otherCents = 0;
  let otherCount = 0;
  let totalCents = 0;

  for (const row of rows) {
    const cents = toCents(row.amount);
    totalCents += cents;
    const family = partyFamily(row.party);
    if (!family) {
      otherCents += cents;
      otherCount += 1;
      continue;
    }
    const current = familyBuckets.get(family) ?? {
      cents: 0,
      count: 0,
      label: shortPartyLabel(row.party),
    };
    current.cents += cents;
    current.count += 1;
    familyBuckets.set(family, current);
  }

  const parties: CyclePartyTotal[] = [...familyBuckets.entries()]
    .map(([family, bucket]) => ({
      id: family,
      label: bucket.label,
      shortLabel: bucket.label,
      value: bucket.cents / 100,
      count: bucket.count,
      share: totalCents === 0 ? 0 : bucket.cents / totalCents,
      colour: partyColour(bucket.label),
      family,
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "en-NZ"));

  if (otherCount > 0) {
    parties.push({
      id: "other",
      label: "Other parties",
      shortLabel: "Other parties",
      value: otherCents / 100,
      count: otherCount,
      share: totalCents === 0 ? 0 : otherCents / totalCents,
      colour: "#5c645e",
      family: null,
    });
  }

  const total = totalCents / 100;
  const winnerBucket = familyBuckets.get(cycle.winnerFamily);
  const winnerTotal = (winnerBucket?.cents ?? 0) / 100;
  const rankedFamilies = [...familyBuckets.entries()].sort((a, b) => b[1].cents - a[1].cents);
  const winnerRankIndex = rankedFamilies.findIndex(([family]) => family === cycle.winnerFamily);
  const winnerRank = winnerRankIndex >= 0 ? winnerRankIndex + 1 : null;
  const topFamily = rankedFamilies[0]?.[0] ?? null;

  return {
    cycle,
    rows,
    parties,
    total,
    winnerTotal,
    winnerShare: total === 0 ? 0 : winnerTotal / total,
    winnerRank,
    hadMostDonations: topFamily === cycle.winnerFamily && winnerTotal > 0,
  };
}

export const ELECTION_CYCLE_SUMMARIES: ElectionCycleSummary[] =
  ELECTION_CYCLES.map(summariseElectionCycle);
