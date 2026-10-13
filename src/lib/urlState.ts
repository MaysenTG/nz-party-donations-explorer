import { ALL_PARTIES, createDefaultFilters } from "./donations.ts";
import type { DonorTypeFilter, Filters } from "../types.ts";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Read filters (and an open donor) from the page URL query string. */
export function readUrlState(search: string): { filters: Filters; donor: string | null } {
  const params = new URLSearchParams(search);
  const filters = createDefaultFilters();
  const parties = params.getAll("party").filter((party) => ALL_PARTIES.includes(party));
  if (parties.length > 0) filters.parties = parties;
  const from = params.get("from");
  const to = params.get("to");
  if (from && ISO.test(from)) filters.from = from;
  if (to && ISO.test(to)) filters.to = to;
  filters.minAmount = params.get("min") ?? "";
  filters.maxAmount = params.get("max") ?? "";
  filters.query = params.get("q") ?? "";
  const type = params.get("type");
  if (type === "individual" || type === "organisation") filters.donorType = type as DonorTypeFilter;
  filters.hideExtraParliamentary = params.get("seats") === "1";
  return { filters, donor: params.get("donor") };
}

export function writeUrlState(filters: Filters, donor: string | null): string {
  const params = new URLSearchParams();
  const allParties =
    filters.parties.length === ALL_PARTIES.length &&
    ALL_PARTIES.every((party) => filters.parties.includes(party));
  if (!allParties) for (const party of filters.parties) params.append("party", party);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.minAmount.trim()) params.set("min", filters.minAmount.trim());
  if (filters.maxAmount.trim()) params.set("max", filters.maxAmount.trim());
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.donorType !== "all") params.set("type", filters.donorType);
  if (filters.hideExtraParliamentary) params.set("seats", "1");
  if (donor) params.set("donor", donor);
  const text = params.toString();
  return text ? `?${text}` : "";
}
