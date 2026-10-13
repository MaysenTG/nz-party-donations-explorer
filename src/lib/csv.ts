import { donorTypeLabel } from "./donors.ts";
import type { Donation } from "../types.ts";

function cell(value: string | number): string {
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export type PublicDonation = {
  party: string;
  donor_name: string;
  amount: number;
  donation_received_date: string;
  return_received_date: string;
  donor_type_estimate: string;
  official_source_url: string;
};

/** Fields this site publishes. Donor addresses are never included. */
export function toPublicDonation(row: Donation): PublicDonation {
  return {
    party: row.party,
    donor_name: row.donor_name,
    amount: row.amount,
    donation_received_date: row.donation_received_date,
    return_received_date: row.return_received_date,
    donor_type_estimate: donorTypeLabel(row.donorType),
    official_source_url: row.officialSourceUrl,
  };
}

const PUBLIC_HEADER: (keyof PublicDonation)[] = [
  "party",
  "donor_name",
  "amount",
  "donation_received_date",
  "return_received_date",
  "donor_type_estimate",
  "official_source_url",
];

export function donationsToCsv(rows: readonly Donation[]): string {
  const lines = rows.map((row) => {
    const record = toPublicDonation(row);
    return PUBLIC_HEADER.map((key) => cell(record[key])).join(",");
  });
  return `\uFEFF${[PUBLIC_HEADER.join(","), ...lines].join("\r\n")}`;
}

export function donationsToPublicJson(rows: readonly Donation[]): string {
  return JSON.stringify(rows.map(toPublicDonation), null, 2);
}

export function downloadText(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, csv: string): void {
  downloadText(filename, csv, "text/csv;charset=utf-8");
}
