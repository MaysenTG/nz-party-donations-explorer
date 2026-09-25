import rawDonations from "../data/donations.json";
import { formatIsoLong, monthKey, monthLabels, nextMonthKey, nzDateToIso } from "./dates.ts";
import { classifyDonor } from "./donors.ts";
import { toCents } from "./format.ts";
import { hasParliamentarySeats } from "./partyMeta.ts";
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

/** Same party published under slightly different names in Commission returns. */
export const PARTY_ALIASES: Record<string, string> = {
  // ACT
  "The ACT Party": "ACT New Zealand",
  "The Act Party": "ACT New Zealand",

  // National
  "New Zealand National Party": "The New Zealand National Party",

  // Greens
  "The Greens, Green Party": "The Green Party of Aotearoa New Zealand",
  "The Green Party of Aotearoa NZ": "The Green Party of Aotearoa New Zealand",
  "Green Party of Aotearoa New Zealand": "The Green Party of Aotearoa New Zealand",
  "The Green Party of Aotearoa": "The Green Party of Aotearoa New Zealand",
  "Green Party": "The Green Party of Aotearoa New Zealand",

  // Te Pāti Māori (formerly Māori Party)
  "Māori Party": "Te Pāti Māori",
  "Maori Party": "Te Pāti Māori",

  // NZ First
  "New Zealand First": "New Zealand First Party",

  // TOP
  "Opportunity Party": "The Opportunities Party",
  "The Opportunities Party (TOP)": "The Opportunities Party",

  // Internet Party / 2014 Internet MANA alliance returns
  "Internet MANA": "Internet Party",
};

export type PartyMergeGroup = {
  canonical: string;
  aliases: string[];
};

/** Alias map grouped by canonical party name for display. */
export function partyMergeGroups(): PartyMergeGroup[] {
  const groups = new Map<string, string[]>();
  for (const [alias, canonical] of Object.entries(PARTY_ALIASES)) {
    const list = groups.get(canonical) ?? [];
    list.push(alias);
    groups.set(canonical, list);
  }
  return [...groups.entries()]
    .map(([canonical, aliases]) => ({
      canonical,
      aliases: aliases.sort((a, b) => a.localeCompare(b, "en-NZ")),
    }))
    .sort((a, b) => a.canonical.localeCompare(b.canonical, "en-NZ"));
}

export function normalizeParty(party: string): string {
  return PARTY_ALIASES[party] ?? party;
}

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
      party: normalizeParty(row.party),
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

export const ALL_YEARS: string[] = [
  ...new Set(donations.map((row) => row.receivedIso.slice(0, 4))),
].sort((a, b) => a.localeCompare(b));

export function yearBounds(year: string): { from: string; to: string } {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

/** Empty string = all years; null = custom from/to that is not a full calendar year. */
export function selectedYear(filters: Filters): string | null {
  if (!filters.from && !filters.to) return "";
  for (const year of ALL_YEARS) {
    const bounds = yearBounds(year);
    if (filters.from === bounds.from && filters.to === bounds.to) return year;
  }
  return null;
}

export function withYearFilter(filters: Filters, year: string): Filters {
  if (year === "") return { ...filters, from: "", to: "" };
  const bounds = yearBounds(year);
  return { ...filters, from: bounds.from, to: bounds.to };
}

export function filterRangeLabel(filters: Filters): string {
  const year = selectedYear(filters);
  const minYear = RECEIVED_MIN.slice(0, 4);
  const maxYear = RECEIVED_MAX.slice(0, 4);
  if (year === "") {
    return minYear === maxYear ? `all of ${minYear}` : `all years ${minYear}–${maxYear}`;
  }
  if (year) return year;
  if (filters.from && filters.to) {
    return `${formatIsoLong(filters.from)} to ${formatIsoLong(filters.to)}`;
  }
  if (filters.from) return `from ${formatIsoLong(filters.from)}`;
  if (filters.to) return `to ${formatIsoLong(filters.to)}`;
  return minYear === maxYear ? `all of ${minYear}` : `all years ${minYear}–${maxYear}`;
}

export function createDefaultFilters(): Filters {
  return {
    parties: [...ALL_PARTIES],
    from: "",
    to: "",
    minAmount: "",
    maxAmount: "",
    query: "",
    donorType: "all",
    excludedDonors: [],
    hideExtraParliamentary: false,
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
    filters.donorType === "all" &&
    filters.excludedDonors.length === 0 &&
    !filters.hideExtraParliamentary
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
  if (filters.excludedDonors.length > 0) count += 1;
  if (filters.hideExtraParliamentary) count += 1;
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
    return "Start date is after end date.";
  }
  const min = parseBound(filters.minAmount);
  const max = parseBound(filters.maxAmount);
  if (!min.ok) return "Minimum amount must be a number.";
  if (!max.ok) return "Maximum amount must be a number.";
  if (min.value !== null && max.value !== null && min.value > max.value) {
    return "Minimum is greater than maximum.";
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
  const excludedDonors = new Set(filters.excludedDonors);

  return rows.filter((row) => {
    if (!ignore.party && !parties.has(row.party)) return false;
    if (filters.hideExtraParliamentary && !hasParliamentarySeats(row.party)) return false;
    if (excludedDonors.has(row.donor_name)) return false;
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

export function topDonors(rows: readonly Donation[], limit = 15): DonorTotal[] {
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

const MONTH_SERIES_LIMIT = 24;

function monthPoint(
  key: string,
  bucket: { cents: number; count: number },
  cumulative: number,
  grain: "month" | "year",
): MonthPoint {
  if (grain === "year") {
    return {
      key,
      label: key,
      fullLabel: key,
      amount: bucket.cents / 100,
      cumulative: cumulative / 100,
      count: bucket.count,
    };
  }
  const [year] = key.split("-").map(Number);
  const shortMonth = monthLabels(key).short;
  return {
    key,
    label: `${shortMonth} ${String(year).slice(2)}`,
    fullLabel: monthLabels(key).full,
    amount: bucket.cents / 100,
    cumulative: cumulative / 100,
    count: bucket.count,
  };
}

function nextYearKey(year: string): string {
  return String(Number(year) + 1);
}

export type DonationSeries = {
  points: MonthPoint[];
  grain: "month" | "year";
};

/** Month bars for short ranges; year bars when the span would be too dense to read. */
export function donationSeries(rows: readonly Donation[]): DonationSeries {
  if (rows.length === 0) return { points: [], grain: "month" };

  const monthBuckets = new Map<string, { cents: number; count: number }>();
  let minMonth = monthKey(rows[0].receivedIso);
  let maxMonth = minMonth;
  for (const row of rows) {
    const key = monthKey(row.receivedIso);
    if (key < minMonth) minMonth = key;
    if (key > maxMonth) maxMonth = key;
    const current = monthBuckets.get(key) ?? { cents: 0, count: 0 };
    current.cents += toCents(row.amount);
    current.count += 1;
    monthBuckets.set(key, current);
  }

  let monthCount = 0;
  for (let key = minMonth; key <= maxMonth; key = nextMonthKey(key)) monthCount += 1;
  const grain: "month" | "year" = monthCount > MONTH_SERIES_LIMIT ? "year" : "month";

  const points: MonthPoint[] = [];
  let cumulative = 0;

  if (grain === "year") {
    const yearBuckets = new Map<string, { cents: number; count: number }>();
    for (const [month, bucket] of monthBuckets) {
      const year = month.slice(0, 4);
      const current = yearBuckets.get(year) ?? { cents: 0, count: 0 };
      current.cents += bucket.cents;
      current.count += bucket.count;
      yearBuckets.set(year, current);
    }
    const minYear = minMonth.slice(0, 4);
    const maxYear = maxMonth.slice(0, 4);
    for (let year = minYear; year <= maxYear; year = nextYearKey(year)) {
      const bucket = yearBuckets.get(year) ?? { cents: 0, count: 0 };
      cumulative += bucket.cents;
      points.push(monthPoint(year, bucket, cumulative, "year"));
    }
  } else {
    for (let key = minMonth; key <= maxMonth; key = nextMonthKey(key)) {
      const bucket = monthBuckets.get(key) ?? { cents: 0, count: 0 };
      cumulative += bucket.cents;
      points.push(monthPoint(key, bucket, cumulative, "month"));
    }
  }

  return { points, grain };
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
