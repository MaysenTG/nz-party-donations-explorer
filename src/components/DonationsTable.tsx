import { useState } from "react";
import { donorTypeLabel } from "../lib/donors.ts";
import { formatCount, formatNzd } from "../lib/format.ts";
import { safeHttps } from "../lib/donations.ts";
import { useMatchMedia } from "../hooks/useMatchMedia.ts";
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
  { key: "date", label: "Received" },
];

const PAGE_SIZE = 25;

function PdfLink({ url, donor }: { url: string | null; donor: string }) {
  if (!url) return <span className="muted">PDF not published</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      View PDF
      <span className="visually-hidden"> for {donor}</span>
    </a>
  );
}

export function DonationsTable({ rows, sort, onSort }: Props) {
  const cards = useMatchMedia("(max-width: 760px)");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeRows, setActiveRows] = useState(rows);

  if (rows !== activeRows) {
    setActiveRows(rows);
    setVisibleCount(PAGE_SIZE);
  }

  const visibleRows = rows.slice(0, visibleCount);
  const remaining = rows.length - visibleRows.length;

  const sortControls = (
    <div className="sort-bar" role="group" aria-label="Sort donations">
      {COLUMNS.map((column) => {
        const active = sort.key === column.key;
        return (
          <button
            key={column.key}
            type="button"
            className={active ? "is-active" : undefined}
            aria-pressed={active}
            onClick={() => onSort(column.key)}
          >
            {column.label}
            <span aria-hidden="true">{active ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}</span>
          </button>
        );
      })}
    </div>
  );

  const moreControls =
    remaining > 0 ? (
      <div className="table-more">
        <p>
          Showing {formatCount(visibleRows.length)} of {formatCount(rows.length)}
        </p>
        <button
          type="button"
          className="more-button"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          Show {formatCount(Math.min(PAGE_SIZE, remaining))} more
        </button>
      </div>
    ) : rows.length > PAGE_SIZE ? (
      <p className="table-more-note">
        Showing all {formatCount(rows.length)}
      </p>
    ) : null;

  return cards ? (
    <>
      {sortControls}
      <div className="donations-viewport">
        <ol className="donation-cards">
          {visibleRows.map((row) => (
            <li key={row.id}>
              <div className="donation-card-top">
                <span className="donation-card-amount">{formatNzd(row.amount)}</span>
                <span className={`tag tag-${row.donorType}`}>{donorTypeLabel(row.donorType)}</span>
              </div>
              <span className="donor-name">{row.donor_name}</span>
              <span className="donor-address">{row.donor_address}</span>
              <span className="donation-card-party">{row.party}</span>
              <span className="received-date">Received {row.donation_received_date}</span>
              <span className="return-date">Return received {row.return_received_date}</span>
              <PdfLink url={safeHttps(row.source_pdf_url)} donor={row.donor_name} />
            </li>
          ))}
        </ol>
      </div>
      {moreControls}
    </>
  ) : (
    <>
      <div className="donations-viewport table-scroll">
        <div className="table-min">
          <table>
            <caption className="visually-hidden">
              Donations matching the current filters, showing {visibleRows.length} of {rows.length}{" "}
              rows
            </caption>
            <thead>
              <tr>
                {COLUMNS.map((column) => {
                  const active = sort.key === column.key;
                  const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={ariaSort}
                      className={column.key === "amount" ? "num" : undefined}
                    >
                      <button type="button" onClick={() => onSort(column.key)}>
                        {column.label === "Received" ? "Received by party" : column.label}
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
              {visibleRows.map((row) => (
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
                    <PdfLink url={safeHttps(row.source_pdf_url)} donor={row.donor_name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {moreControls}
    </>
  );
}
