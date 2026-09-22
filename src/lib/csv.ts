import { donorTypeLabel } from "./donors.ts";
import type { Donation } from "../types.ts";

function cell(value: string | number): string {
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function donationsToCsv(rows: readonly Donation[]): string {
  const header = [
    "party",
    "donor_name",
    "donor_address",
    "amount",
    "donation_received_date",
    "return_received_date",
    "donor_type",
    "source_pdf_url",
  ];
  const lines = rows.map((row) =>
    [
      row.party,
      row.donor_name,
      row.donor_address,
      row.amount,
      row.donation_received_date,
      row.return_received_date,
      donorTypeLabel(row.donorType),
      row.source_pdf_url,
    ]
      .map(cell)
      .join(","),
  );
  return `\uFEFF${[header.join(","), ...lines].join("\r\n")}`;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
