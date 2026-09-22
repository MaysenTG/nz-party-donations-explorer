import { donorTypeLabel } from "../lib/donors.ts";
import { formatNzd } from "../lib/format.ts";
import { safeHttps } from "../lib/donations.ts";
import type { Donation, SortKey, SortState } from "../types.ts";

type Props = {
  rows: Donation[];
  sort: SortState;
  onSort: (key: SortKey) => void;
};

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "party", label: "Party" },
  { key: "donor", label: "Donor" },
  { key: "amount", label: "Amount" },
  { key: "date", label: "Received by party" },
];

export function DonationsTable({ rows, sort, onSort }: Props) {
  return (
    <div className="table-scroll">
      <table>
        <caption className="visually-hidden">
          Donations matching the current filters, {rows.length} rows
        </caption>
        <thead>
          <tr>
            {COLUMNS.map((column) => {
              const active = sort.key === column.key;
              const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
              return (
                <th key={column.key} scope="col" aria-sort={ariaSort} className={column.key === "amount" ? "num" : undefined}>
                  <button type="button" onClick={() => onSort(column.key)}>
                    {column.label}
                    <span aria-hidden="true" className="sort-mark">
                      {active ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </button>
                </th>
              );
            })}
            <th scope="col">Official return</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const pdf = safeHttps(row.source_pdf_url);
            return (
              <tr key={row.id}>
                <td>{row.party}</td>
                <td>
                  <span className="donor-name">{row.donor_name}</span>
                  <span className="donor-address">{row.donor_address}</span>
                  <span className={`tag tag-${row.donorType}`}>{donorTypeLabel(row.donorType)}</span>
                </td>
                <td className="num">{formatNzd(row.amount)}</td>
                <td>
                  <span className="received-date">{row.donation_received_date}</span>
                  <span className="return-date">Return received {row.return_received_date}</span>
                </td>
                <td>
                  {pdf ? (
                    <a href={pdf} target="_blank" rel="noopener noreferrer">
                      View PDF
                      <span className="visually-hidden"> for {row.donor_name}</span>
                    </a>
                  ) : (
                    <span className="muted">Not published</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
