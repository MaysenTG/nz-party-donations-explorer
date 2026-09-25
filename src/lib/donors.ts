import donorBlurbs from "../data/donorBlurbs.json";
import type { DonorType } from "../types.ts";

const BLURBS = donorBlurbs as Record<string, string>;

/** Short note for well-known top donors (exact published name). */
export function donorBlurb(name: string): string | undefined {
  return BLURBS[name];
}

/** Words that mark a donor name as an organisation. Matching is case-insensitive. */
export const ORGANISATION_TERMS = [
  "Ltd",
  "Limited",
  "Trust",
  "Trustee",
  "Union",
  "Incorporated",
  "Holdings",
  "Group",
  "Party",
  "Estate",
  "Foundation",
  "Society",
  "Association",
  "Company",
  "Corporation",
  "Corp",
  "Council",
  "Partners",
  "Partnership",
  "LLP",
  "Inc",
  "Enterprises",
  "Chambers",
] as const;

const ORGANISATION_PATTERN = new RegExp(
  `\\b(?:${ORGANISATION_TERMS.join("|")})\\b`,
  "i",
);

export function classifyDonor(name: string): DonorType {
  return ORGANISATION_PATTERN.test(name) ? "organisation" : "individual";
}

export function donorTypeLabel(type: DonorType): string {
  return type === "organisation" ? "Organisation" : "Individual";
}
