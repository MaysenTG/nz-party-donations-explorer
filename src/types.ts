export type DonorType = "individual" | "organisation";

export type RawDonation = {
  party: string;
  return_received_date: string;
  donor_name: string;
  amount: number;
  donation_received_date: string;
  source_pdf_url: string;
  /** Date the Commission received an amended return, when there is one. */
  amended_return_received_date?: string;
  /** The Commission notes the party gave the donation back. */
  returned_to_donor?: boolean;
  /** The donor is itself a registered party. */
  party_to_party?: boolean;
  /** Notes taken from the Commission's tables. */
  notes?: string[];
  /** Set at build time when an individual's name is withheld (return over 6 years old). */
  name_withheld?: boolean;
};

export type Donation = Omit<RawDonation, "notes" | "name_withheld"> & {
  notes: string[];
  id: string;
  receivedIso: string;
  returnIso: string;
  donorType: DonorType;
  /** Name used to group spelling variants of one donor. */
  donorKey: string;
  /** True when the donor is an individual and the return is past the 6 year inspection period. */
  nameWithheld: boolean;
};

export type DonorTypeFilter = "all" | DonorType;

export type Filters = {
  parties: string[];
  from: string;
  to: string;
  minAmount: string;
  maxAmount: string;
  query: string;
  donorType: DonorTypeFilter;
  /** Include donations the party later returned to the donor. Off by default. */
  includeReturned: boolean;
  /** Drop parties that currently hold no seats in Parliament. */
  hideExtraParliamentary: boolean;
};

export type SortKey = "party" | "donor" | "amount" | "date";
export type SortDirection = "asc" | "desc";

export type SortState = {
  key: SortKey;
  dir: SortDirection;
};

export type Summary = {
  total: number;
  donations: number;
  parties: number;
  donors: number;
};

export type PartyTotal = {
  id: string;
  label: string;
  value: number;
  count: number;
  share: number;
};

export type DonorTotal = {
  id: string;
  label: string;
  value: number;
  count: number;
  partyCount: number;
};

export type MonthPoint = {
  key: string;
  label: string;
  fullLabel: string;
  amount: number;
  cumulative: number;
  count: number;
};
