import rawDonations from "../data/donations.json";
import { monthKey, monthLabels, nextMonthKey, nzDateToIso } from "./dates.ts";
import { classifyDonor } from "./donors.ts";
import { toCents } from "./format.ts";
import type {
  Donation,
  DonorTotal,
  Filters,
  MonthPoint,
  PartyTotal,
  RawDonation,
  SortState,
  Summary,
} from "../types.ts";

function isRawDonation(value: unknown): value is RawDonation {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.party === "string" &&
    typeof row.return_received_date === "string" &&
    typeof row.donor_name === "string" &&
    typeof row.donor_address === "string" &&
    typeof row.amount === "number" &&
    Number.isFinite(row.amount) &&
    typeof row.donation_received_date === "string" &&
    typeof row.source_pdf_url === "string"
  );
}

function loadDonations(value: unknown): Donation[] {
  if (!Array.isArray(value)) {
    throw new Error("donations.json must be an array");
  }
  return value.map((row, index) => {
    if (!isRawDonation(row)) {
      throw new Error(`Invalid donation record at index ${index}`);
    }
    return {
      ...row,
      id: String(index),
      receivedIso: nzDateToIso(row.donation_received_date),
      returnIso: nzDateToIso(row.return_received_date),
      donorType: classifyDonor(row.donor_name),
    };
  });
}

export const donations: Donation[] = loadDonations(rawDonations);

export const ALL_PARTIES: string[] = [
  ...new Set(donations.map((row) => row.party)),
].sort((a, b) => a.localeCompare(b, "en-NZ"));

export const RECEIVED_MIN = donations.reduce(
  (min, row) => (row.receivedIso < min ? row.receivedIso : min),
  donations[0]?.receivedIso ?? "",
);

export const RECEIVED_MAX = donations.reduce(
  (max, row) => (row.receivedIso > max ? row.receivedIso : max),
  donations[0]?.receivedIso ?? "",
);

export function createDefaultFilters(): Filters {
  return {
    parties: [...ALL_PARTIES],
    from: "",
    to: "",
    minAmount: "",
    maxAmount: "",
    query: "",
    donorType: "all",
  };
}

export function filtersAreDefault(filters: Filters): boolean {
  const allParties =
    filters.parties.length === ALL_PARTIES.length &&
    ALL_PARTIES.every((party) => filters.parties.includes(party));
  return (
    allParties &&
    filters.from === "" &&
    filters.to === "" &&
    filters.minAmount.trim() === "" &&
    filters.maxAmount.trim() === "" &&
    filters.query.trim() === "" &&
    filters.donorType === "all"
  );
}

export function activeFilterCount(filters: Filters): number {
  let count = 0;
  if (
    filters.parties.length !== ALL_PARTIES.length ||
    !ALL_PARTIES.every((party) => filters.parties.includes(party))
  ) {
    count += 1;
  }
  if (filters.from) count += 1;
  if (filters.to) count += 1;
  if (filters.minAmount.trim()) count += 1;
  if (filters.maxAmount.trim()) count += 1;
  if (filters.query.trim()) count += 1;
  if (filters.donorType !== "all") count += 1;
  return count;
}

type Bound = { ok: true; value: number | null } | { ok: false };

function parseBound(value: string): Bound {
  const trimmed = value.trim().replace(/[$,\s]/g, "");
  if (trimmed === "") return { ok: true, value: null };
  const amount = Number(trimmed);
  if (!Number.isFinite(amount)) return { ok: false };
  return { ok: true, value: amount };
}

export function filterProblem(filters: Filters): string | null {
  if (filters.parties.length === 0) {
    return "Select at least one party.";
  }
  if (filters.from && filters.to && filters.from > filters.to) {
    return "The start date is after the end date.";
  }
  const min = parseBound(filters.minAmount);
  const max = parseBound(filters.maxAmount);
  if (!min.ok) return "Minimum amount must be a number.";
  if (!max.ok) return "Maximum amount must be a number.";
  if (min.value !== null && max.value !== null && min.value > max.value) {
    return "The minimum amount is greater than the maximum.";
  }
  return null;
}

type Ignore = {
  party?: boolean;
  donorType?: boolean;
};

export function applyFilters(
  rows: readonly Donation[],
  filters: Filters,
  ignore: Ignore = {},
): Donation[] {
  const min = parseBound(filters.minAmount);
  const max = parseBound(filters.maxAmount);
  const invalidRange = filters.from !== "" && filters.to !== "" && filters.from > filters.to;
  const invalidAmount =
    !min.ok ||
    !max.ok ||
    (min.value !== null && max.value !== null && min.value > max.value);

  if (!ignore.party && filters.parties.length === 0) return [];
  if (invalidRange || invalidAmount) return [];

  const minValue = min.ok ? min.value : null;
  const maxValue = max.ok ? max.value : null;
  const query = filters.query.trim().toLowerCase();
  const parties = new Set(filters.parties);

  return rows.filter((row) => {
    if (!ignore.party && !parties.has(row.party)) return false;
    if (!ignore.donorType && filters.donorType !== "all" && row.donorType !== filters.donorType) {
      return false;
    }
    if (query) {
      const haystack = `${row.donor_name} ${row.donor_address}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.from && row.receivedIso < filters.from) return false;
    if (filters.to && row.receivedIso > filters.to) return false;
    if (minValue !== null && row.amount < minValue) return false;
    if (maxValue !== null && row.amount > maxValue) return false;
    return true;
  });
}

export function summarise(rows: readonly Donation[]): Summary {
  let cents = 0;
  const parties = new Set<string>();
  const donors = new Set<string>();
  for (const row of rows) {
    cents += toCents(row.amount);
    parties.add(row.party);
    donors.add(row.donor_name);
  }
  return {
    total: cents / 100,
    donations: rows.length,
    parties: parties.size,
    donors: donors.size,
  };
}

export function partyTotals(rows: readonly Donation[]): PartyTotal[] {
  const buckets = new Map<string, { cents: number; count: number }>();
  for (const row of rows) {
    const current = buckets.get(row.party) ?? { cents: 0, count: 0 };
    current.cents += toCents(row.amount);
    current.count += 1;
    buckets.set(row.party, current);
  }
  const totalCents = [...buckets.values()].reduce((sum, bucket) => sum + bucket.cents, 0);
  return [...buckets.entries()]
    .map(([id, bucket]) => ({
      id,
      label: id,
      value: bucket.cents / 100,
      count: bucket.count,
      share: totalCents === 0 ? 0 : bucket.cents / totalCents,
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "en-NZ"));
}

export function topDonors(rows: readonly Donation[], limit = 12): DonorTotal[] {
  const buckets = new Map<string, { cents: number; count: number; parties: Set<string> }>();
  for (const row of rows) {
    const current = buckets.get(row.donor_name) ?? {
      cents: 0,
      count: 0,
      parties: new Set<string>(),
    };
    current.cents += toCents(row.amount);
    current.count += 1;
    current.parties.add(row.party);
    buckets.set(row.donor_name, current);
  }
  return [...buckets.entries()]
    .map(([id, bucket]) => ({
      id,
      label: id,
      value: bucket.cents / 100,
      count: bucket.count,
      partyCount: bucket.parties.size,
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "en-NZ"))
    .slice(0, limit);
}

export function donorCount(rows: readonly Donation[]): number {
  return new Set(rows.map((row) => row.donor_name)).size;
}

export function monthlySeries(rows: readonly Donation[]): MonthPoint[] {
  if (rows.length === 0) return [];
  const buckets = new Map<string, { cents: number; count: number }>();
  let min = monthKey(rows[0].receivedIso);
  let max = min;
  for (const row of rows) {
    const key = monthKey(row.receivedIso);
    if (key < min) min = key;
    if (key > max) max = key;
    const current = buckets.get(key) ?? { cents: 0, count: 0 };
    current.cents += toCents(row.amount);
    current.count += 1;
    buckets.set(key, current);
  }

  const points: MonthPoint[] = [];
  let cumulative = 0;
  for (let key = min; key <= max; key = nextMonthKey(key)) {
    const bucket = buckets.get(key) ?? { cents: 0, count: 0 };
    cumulative += bucket.cents;
    const labels = monthLabels(key);
    points.push({
      key,
      label: labels.short,
      fullLabel: labels.full,
      amount: bucket.cents / 100,
      cumulative: cumulative / 100,
      count: bucket.count,
    });
  }
  return points;
}

export function partyCounts(rows: readonly Donation[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const party of ALL_PARTIES) counts[party] = 0;
  for (const row of rows) counts[row.party] = (counts[row.party] ?? 0) + 1;
  return counts;
}

export function sortDonations(rows: readonly Donation[], sort: SortState): Donation[] {
  const direction = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let compared = 0;
    switch (sort.key) {
      case "party":
        compared = a.party.localeCompare(b.party, "en-NZ");
        break;
      case "donor":
        compared = a.donor_name.localeCompare(b.donor_name, "en-NZ");
        break;
      case "amount":
        compared = a.amount - b.amount;
        break;
      case "date":
        compared = a.receivedIso.localeCompare(b.receivedIso);
        break;
    }
    if (compared !== 0) return compared * direction;
    const byDate = b.receivedIso.localeCompare(a.receivedIso);
    if (byDate !== 0) return byDate;
    return a.donor_name.localeCompare(b.donor_name, "en-NZ");
  });
}

export function safeHttps(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}
