import { countsInTotals } from "./donations.ts";
import { donorKey, donorLabel } from "./donorGroups.ts";
import { toCents } from "./format.ts";
import type { Donation } from "../types.ts";

export type PartyYearSeries = {
  years: string[];
  parties: string[];
  rows: Record<string, number | string>[];
};

/** Amount per party per year received. Parties ordered by total, largest first. */
export function partyYearSeries(rows: readonly Donation[], maxParties = 8): PartyYearSeries {
  const totals = new Map<string, number>();
  const cells = new Map<string, Map<string, number>>();
  for (const row of rows) {
    if (!countsInTotals(row)) continue;
    const year = row.receivedIso.slice(0, 4);
    const cents = toCents(row.amount);
    totals.set(row.party, (totals.get(row.party) ?? 0) + cents);
    const byParty = cells.get(year) ?? new Map<string, number>();
    byParty.set(row.party, (byParty.get(row.party) ?? 0) + cents);
    cells.set(year, byParty);
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([party]) => party);
  const shown = ranked.slice(0, maxParties);
  const hasOther = ranked.length > maxParties;
  const parties = hasOther ? [...shown, OTHER_PARTIES] : shown;
  const years = [...cells.keys()].sort();
  const out = years.map((year) => {
    const record: Record<string, number | string> = { year };
    for (const party of parties) record[party] = 0;
    for (const [party, cents] of cells.get(year) ?? []) {
      const key = shown.includes(party) ? party : OTHER_PARTIES;
      record[key] = (record[key] as number) + cents / 100;
    }
    return record;
  });
  return { years, parties, rows: out };
}

export const OTHER_PARTIES = "Other parties";

export type MultiPartyDonorMember = {
  id: string;
  name: string;
  total: number;
  count: number;
};

export type MultiPartyDonor = {
  /** Aggregation key: group id when grouping is on, else filed name. */
  id: string;
  name: string;
  total: number;
  count: number;
  parties: { party: string; amount: number }[];
  /** Filed names inside a related-donor group, when grouping combined more than one. */
  members?: MultiPartyDonorMember[];
};

/** Donors who gave to more than one party in the rows. Withheld names and party donors are skipped. */
export function multiPartyDonors(
  rows: readonly Donation[],
  options: { groupRelatedDonors?: boolean } = {},
): MultiPartyDonor[] {
  const groupRelated = options.groupRelatedDonors === true;
  type Bucket = {
    parties: Map<string, number>;
    count: number;
    members: Map<string, { cents: number; count: number }>;
  };
  const byDonor = new Map<string, Bucket>();
  for (const row of rows) {
    if (row.nameWithheld || row.party_to_party) continue;
    const key = donorKey(row.donor_name, groupRelated);
    const current = byDonor.get(key) ?? {
      parties: new Map<string, number>(),
      count: 0,
      members: new Map(),
    };
    const cents = toCents(row.amount);
    current.parties.set(row.party, (current.parties.get(row.party) ?? 0) + cents);
    current.count += 1;
    const member = current.members.get(row.donor_name) ?? { cents: 0, count: 0 };
    member.cents += cents;
    member.count += 1;
    current.members.set(row.donor_name, member);
    byDonor.set(key, current);
  }
  const result: MultiPartyDonor[] = [];
  for (const [id, bucket] of byDonor) {
    if (bucket.parties.size < 2) continue;
    const list = [...bucket.parties.entries()]
      .map(([party, cents]) => ({ party, amount: cents / 100 }))
      .sort((a, b) => b.amount - a.amount);
    const members = [...bucket.members.entries()]
      .map(([memberId, member]) => ({
        id: memberId,
        name: memberId,
        total: member.cents / 100,
        count: member.count,
      }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "en-NZ"));
    result.push({
      id,
      name: donorLabel(id, groupRelated),
      total: list.reduce((sum, item) => sum + item.amount, 0),
      count: bucket.count,
      parties: list,
      members: members.length > 1 ? members : undefined,
    });
  }
  return result.sort((a, b) => b.parties.length - a.parties.length || b.total - a.total);
}

export type SizeBucket = { label: string; count: number; amount: number };

const SIZE_EDGES: { label: string; max: number }[] = [
  { label: "Under $30k", max: 30_000 },
  { label: "$30k to $50k", max: 50_000 },
  { label: "$50k to $100k", max: 100_000 },
  { label: "$100k to $250k", max: 250_000 },
  { label: "$250k to $1m", max: 1_000_000 },
  { label: "$1m and over", max: Number.POSITIVE_INFINITY },
];

/** Count and total of returns by size band. Lower bound inclusive, upper exclusive. */
export function sizeDistribution(rows: readonly Donation[]): SizeBucket[] {
  const buckets = SIZE_EDGES.map((edge) => ({ label: edge.label, count: 0, cents: 0 }));
  for (const row of rows) {
    if (!countsInTotals(row)) continue;
    const index = SIZE_EDGES.findIndex((edge) => row.amount < edge.max);
    const bucket = buckets[index === -1 ? buckets.length - 1 : index];
    bucket.count += 1;
    bucket.cents += toCents(row.amount);
  }
  return buckets.map((bucket) => ({
    label: bucket.label,
    count: bucket.count,
    amount: bucket.cents / 100,
  }));
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
