/**
 * Opt-in related-donor groups. Exact filed names only — no surname heuristics.
 * Same person/entity variants and person+company when publicly the same source.
 * Spouses and family members stay separate.
 */

export type DonorGroup = {
  id: string;
  label: string;
  members: readonly string[];
  /** Short note shown in the donor modal and disclosure list. */
  note?: string;
};

/**
 * Curated groups. Every member string must match a published donor_name exactly.
 * Checked against src/data/donations.json.
 */
export const DONOR_GROUPS: readonly DonorGroup[] = [
  {
    id: "graeme-hart",
    label: "Graeme Hart / Rank Group",
    members: [
      "Graeme Hart",
      "Graeme Richard Hart",
      "Rank Group Limited",
      "Rank Group Limited via Graeme Hart",
    ],
    note: "Rank Group is owned by Graeme Hart (sole shareholder).",
  },
  {
    id: "nicholas-mowbray",
    label: "Nicholas Mowbray",
    members: ["Nicholas Mowbray", "Nicholas James Mowbray"],
  },
  {
    id: "alan-gibbs",
    label: "Alan Gibbs",
    members: ["Alan Gibbs", "Alan Timothy Gibbs", "Alan Gibbs (via Gibbs Holdings)"],
  },
  {
    id: "dame-jenny-gibbs",
    label: "Dame Jenny Gibbs",
    members: [
      "Dame Jenny Gibbs",
      "Dame Jenny Gibbs (via J B Gibbs Trust)",
      "Dame Jenny Gibbs (via JB Gibbs Trust)",
    ],
  },
  {
    id: "christopher-reeve",
    label: "Christopher Reeve",
    members: ["Christopher Reeve", "Christopher Reeve (via Matariki Trust)"],
  },
  {
    id: "sir-peter-vela",
    label: "Sir Peter Vela",
    members: ["P J Vela", "Peter James Vela", "Sir Peter Vela"],
  },
  {
    id: "trevor-farmer",
    label: "Trevor Farmer",
    members: ["T Farmer", "Trevor Farmer"],
  },
  {
    id: "bruce-plested",
    label: "Bruce Plested",
    members: ["B Plested", "Bruce Plested"],
  },
  {
    id: "roshan-nauhria",
    label: "Roshan Nauhria",
    members: ["Roshan Lal Nauhria", "Roshan Nauhria"],
  },
  {
    id: "michael-sullivan",
    label: "Michael Sullivan",
    members: ["Michael Grant Sullivan", "Michael Sullivan", "Micheal G Sullivan"],
  },
  {
    id: "mark-wyborn",
    label: "Mark Wyborn",
    members: ["M J Wyborn", "Mark J Wyborn", "Mark John Wyborn", "MJ Wyborn"],
  },
  {
    id: "fran-wyborn",
    label: "Fran Wyborn",
    members: ["Fran Wyborn", "Frances Wyborn"],
  },
  {
    id: "christopher-meehan",
    label: "Christopher Meehan",
    members: ["Christopher Meehan", "Christopher & Michaela Meehan"],
  },
  {
    id: "murray-chandler",
    label: "Murray Chandler",
    members: ["Murray Chandler", "Murray Graham Chandler"],
  },
  {
    id: "stuart-bramhall",
    label: "Stuart Bramhall",
    members: ["Dr Stuart Bramhall", "Dr. Stuart Bramhall", "Stuart Bramhall"],
  },
  {
    id: "robert-smellie",
    label: "Hon Robert Smellie QC",
    members: ["Hon Robert Smellie QC", "Hon. Robert Smellie QC"],
  },
  {
    id: "warwick-averil-norman",
    label: "Warwick and Averil Norman",
    members: ["Warwick & Averil Norman", "Warwick and Averil Norman"],
  },
  {
    id: "estate-hugh-barr",
    label: "Estate of Hugh Barr",
    members: ["Estate of Hugh Barr", "The Estate of Hugh Barr"],
  },
  {
    id: "phillip-mills",
    label: "Phillip Mills",
    members: ["Phillip Mills", "Phillip Mills Family"],
  },
  {
    id: "christopher-and-banks",
    label: "Christopher & Banks",
    members: [
      "Christopher & Banks Limited",
      "Christopher & Banks Ltd",
      "Christopher and Banks Limited",
    ],
  },
  {
    id: "christopher-and-banks-pe",
    label: "Christopher & Banks Private Equity",
    members: [
      "Christopher & Banks Private Equity Limited",
      "Christopher & Banks Private Equity Ltd",
    ],
  },
  {
    id: "gallagher-group",
    label: "Gallagher Group",
    members: ["Gallagher Group Ltd", "Gallagher Group Limited"],
  },
  {
    id: "alpha-laboratories",
    label: "Alpha Laboratories (NZ)",
    members: ["Alpha Laboratories (NZ) Limited", "ALPHA Laboratories (NZ) Limited"],
  },
  {
    id: "team-mcmillan",
    label: "Team McMillan",
    members: ["Team McMillan Ltd", "Team McMillan Limited"],
  },
  {
    id: "rorohara-farms",
    label: "Rorohara Farms",
    members: ["Rorohara Farm Ltd", "Rorohara Farms Limited"],
  },
  {
    id: "dairy-workers-union",
    label: "New Zealand Dairy Workers Union",
    members: [
      "New Zealand Dairy Workers Union",
      "Dairy Workers Union",
      "NZ Dairy Workers Union",
    ],
  },
  {
    id: "maritime-union",
    label: "Maritime Union of New Zealand",
    members: [
      "Maritime Union of New Zealand",
      "Maritime Union of New Zealand Incorporated",
    ],
  },
  {
    id: "rmtu",
    label: "Rail & Maritime Transport Union",
    members: [
      "Rail & Maritime Transport Union",
      "Rail & Maritime Transport Union of New Zealand",
      "Rail and Maritime Transport Union Inc",
    ],
  },
  {
    id: "meat-workers-union",
    label: "NZ Meat Workers Union",
    members: ["NZ Meat Workers Union", "NZ Meatworkers and Related Trades Union"],
  },
  {
    id: "canterbury-nationalist-trust",
    label: "Canterbury Nationalist Trust",
    members: [
      "Canterbury Nationalist Trust",
      "Canterbury Nationalist Trust (Trustee Jim Gerard QSO)",
    ],
  },
  {
    id: "van-den-brink",
    label: "Tony van den Brink / Van Den Brink Karaka",
    members: ["Tony van den Brink", "Van Den Brink Karaka Limited"],
    note: "Tony van den Brink is a director of Van Den Brink Karaka Limited.",
  },
];

const MEMBER_TO_GROUP = new Map<string, DonorGroup>();
for (const group of DONOR_GROUPS) {
  for (const member of group.members) {
    if (MEMBER_TO_GROUP.has(member)) {
      throw new Error(`Donor name listed in more than one group: ${member}`);
    }
    MEMBER_TO_GROUP.set(member, group);
  }
}

/** Group for a filed name, or null when the name is not in any curated group. */
export function donorGroup(name: string): DonorGroup | null {
  return MEMBER_TO_GROUP.get(name) ?? null;
}

/** Group by curated id, or null when unknown. */
export function donorGroupById(id: string): DonorGroup | null {
  return DONOR_GROUPS.find((group) => group.id === id) ?? null;
}

/**
 * Aggregation key when grouping is on: group id for curated members, else the filed name.
 * Withheld rows should not be passed here.
 */
export function donorKey(name: string, groupRelated: boolean): string {
  if (!groupRelated) return name;
  return donorGroup(name)?.id ?? name;
}

/** Display label for an aggregation key (group label or filed name). */
export function donorLabel(key: string, groupRelated: boolean): string {
  if (!groupRelated) return key;
  const group = DONOR_GROUPS.find((item) => item.id === key);
  return group?.label ?? key;
}

/** True when this key is a multi-member curated group. */
export function isDonorGroupId(key: string): boolean {
  return DONOR_GROUPS.some((group) => group.id === key);
}

/** Filed names that belong to a group id, or a single-name list for an exact name. */
export function donorMembers(key: string): readonly string[] {
  const group = DONOR_GROUPS.find((item) => item.id === key);
  if (group) return group.members;
  return [key];
}

/** Groups for disclosure UI, sorted by label. */
export function donorMergeGroups(): DonorGroup[] {
  return [...DONOR_GROUPS].sort((a, b) => a.label.localeCompare(b.label, "en-NZ"));
}

/**
 * When grouping is on and the query matches any member of a group, treat every
 * member of that group as a match (so search finds the whole cluster).
 */
export function donorQueryMatches(donorName: string, query: string, groupRelated: boolean): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (donorName.toLowerCase().includes(needle)) return true;
  if (!groupRelated) return false;
  const group = donorGroup(donorName);
  if (!group) return false;
  return group.members.some((member) => member.toLowerCase().includes(needle));
}
