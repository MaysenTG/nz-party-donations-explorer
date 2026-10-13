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

/**
 * Published spellings of the same donor, grouped under one name for charts and counts.
 * Only clear cases are listed: punctuation, middle names or initials, Ltd/Limited, and typos.
 * The table and the official returns keep the name exactly as published.
 */
export const DONOR_NAME_GROUPS: Record<string, string[]> = {
  "Alan Gibbs": ["Alan Timothy Gibbs"],
  "Alpha Laboratories (NZ) Limited": ["ALPHA Laboratories (NZ) Limited"],
  "Brendan Lindsay": ["Brendan J Lindsay", "B J Lindsay"],
  "Bruce Plested": ["B Plested"],
  "Christopher & Banks Limited": ["Christopher & Banks Ltd", "Christopher and Banks Limited"],
  "Christopher & Banks Private Equity Limited": ["Christopher & Banks Private Equity Ltd"],
  "Christopher Parkin": ["Chris Parkin"],
  "Craig Heatley": ["Craig Leonard Heatley"],
  "Dave Muller": ["D Muller"],
  "Diane Townshend": ["Diane Evelyn Townshend", "Diane Townsend"],
  "Estate of Hugh Barr": ["The Estate of Hugh Barr"],
  "Frances Wyborn": ["Fran Wyborn"],
  "Gallagher Group Limited": ["Gallagher Group Ltd"],
  "Gary Lane": ["Gary Rodney Lane"],
  "Graeme Hart": ["Graeme Richard Hart"],
  "Hon Robert Smellie QC": ["Hon. Robert Smellie QC"],
  "Jeff Douglas": ["Jeffrey Graeme Douglas"],
  "Jennifer Marcroft": ["Jenny Marcroft"],
  "Jillian Garing": ["Jillian Sandra Garing"],
  "Maritime Union of New Zealand": ["Maritime Union of New Zealand Incorporated"],
  "Mark Townshend": ["Mark Gray Townshend", "Mark Townsend"],
  "Mark Wyborn": ["Mark John Wyborn", "Mark J Wyborn", "M J Wyborn", "MJ Wyborn"],
  "Michael Sullivan": ["Michael Grant Sullivan", "Micheal G Sullivan"],
  "Morris Hey": ["Morris Owen Hey"],
  "Murray Chandler": ["Murray Graham Chandler"],
  "Nicholas Mowbray": ["Nicholas James Mowbray"],
  "Peter Goodfellow": ["Peter John Goodfellow"],
  "Peter Vela": ["Peter James Vela", "Sir Peter Vela", "P J Vela"],
  "Rail & Maritime Transport Union of New Zealand": [
    "Rail & Maritime Transport Union",
    "Rail and Maritime Transport Union Inc",
  ],
  "Richard Hubbard": ["Richard John Hubbard"],
  "Rorohara Farms Limited": ["Rorohara Farm Ltd"],
  "Roshan Nauhria": ["Roshan Lal Nauhria"],
  "Stuart Bramhall": ["Dr Stuart Bramhall", "Dr. Stuart Bramhall"],
  "Team McMillan Limited": ["Team McMillan Ltd"],
  "Trevor Farmer": ["T Farmer"],
  "Warwick and Averil Norman": ["Warwick & Averil Norman"],
  "E Tu Union": ["E Tu", "E tu Union"],
};

const DONOR_ALIAS: Record<string, string> = Object.fromEntries(
  Object.entries(DONOR_NAME_GROUPS).flatMap(([canonical, variants]) =>
    variants.map((variant) => [variant, canonical]),
  ),
);

/** Grouping key for a published donor name. */
export function donorGroup(name: string): string {
  return DONOR_ALIAS[name] ?? name;
}
