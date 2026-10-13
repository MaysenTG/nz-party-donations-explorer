import type { DonorType } from "../types.ts";

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
  "Bank",
  "Authority",
  "Vineyard",
  "Fund",
] as const;

/**
 * Names the word list gets wrong. Exact published names.
 * Checked by hand against the Commission tables (audit of 13 October 2026).
 */
export const DONOR_TYPE_OVERRIDES: Record<string, DonorType> = {
  "NZ Amalgamated Engineering, Printing": "organisation",
  "Vision New Zealand": "organisation",
  "E Tu": "organisation",
};

const ORGANISATION_PATTERN = new RegExp(`\\b(?:${ORGANISATION_TERMS.join("|")})\\b`, "i");

export function classifyDonor(name: string): DonorType {
  const override = DONOR_TYPE_OVERRIDES[name];
  if (override) return override;
  return ORGANISATION_PATTERN.test(name) ? "organisation" : "individual";
}

export function donorTypeLabel(type: DonorType): string {
  return type === "organisation" ? "Organisation" : "Individual";
}
