export type DonorType = "individual" | "organisation";

export type OfficialSourceKind = "pdf" | "page";

export type RawDonation = {
  party: string;
  return_received_date: string;
  donor_name: string;
  amount: number;
  donation_received_date: string;
  source_pdf_url: string;
};

export type Donation = {
  id: string;
  party: string;
  donor_name: string;
  amount: number;
  donation_received_date: string;
  return_received_date: string;
  receivedIso: string;
  returnIso: string;
  donorType: DonorType;
  officialSourceUrl: string;
  officialSourceKind: OfficialSourceKind;
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
