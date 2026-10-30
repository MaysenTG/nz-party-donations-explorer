import { ALL_PARTIES, createDefaultFilters } from "./donations.ts";
import type { DonorTypeFilter, Filters } from "../types.ts";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Read filters from the page URL query string. */
export function readUrlState(search: string): { filters: Filters } {
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
  // Prefer `q`; accept older `donor` links too.
  filters.query = params.get("q") ?? params.get("donor") ?? "";
  const type = params.get("type");
  if (type === "individual" || type === "organisation") filters.donorType = type as DonorTypeFilter;
  filters.hideExtraParliamentary = params.get("seats") === "1";
  filters.includeReturned = params.get("returned") === "1";
  filters.groupRelatedDonors = params.get("grouped") === "1";
  filters.withholdOldNames = params.get("hideOldNames") === "1";
  return { filters };
}

export function writeUrlState(filters: Filters): string {
  const params = new URLSearchParams();
  const allParties =
    filters.parties.length === ALL_PARTIES.length &&
    ALL_PARTIES.every((party) => filters.parties.includes(party));
  if (!allParties) for (const party of filters.parties) params.append("party", party);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.minAmount.trim()) params.set("min", filters.minAmount.trim());
  if (filters.maxAmount.trim()) params.set("max", filters.maxAmount.trim());
  const query = filters.query.trim();
  if (query) params.set("q", query);
  if (filters.donorType !== "all") params.set("type", filters.donorType);
  if (filters.hideExtraParliamentary) params.set("seats", "1");
  if (filters.includeReturned) params.set("returned", "1");
  if (filters.groupRelatedDonors) params.set("grouped", "1");
  if (filters.withholdOldNames) params.set("hideOldNames", "1");
  const text = params.toString();
  return text ? `?${text}` : "";
}
