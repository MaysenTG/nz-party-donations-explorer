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
  onOpenDonor: (key: string) => void;
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

function DonorName({ row, onOpenDonor }: { row: Donation; onOpenDonor: (key: string) => void }) {
  if (row.nameWithheld) {
    return (
      <span className="donor-name donor-withheld" title="Returns stay open for public inspection for 6 years.">
        {row.donor_name}
      </span>
    );
  }
  return (
    <button type="button" className="donor-name donor-link" onClick={() => onOpenDonor(row.donorKey)}>
      {row.donor_name}
    </button>
  );
}

function ReturnDates({ row }: { row: Donation }) {
  return (
    <>
      <span className="return-date">Return received {row.return_received_date}</span>
      {row.amended_return_received_date && (
        <span className="return-date">Amended return received {row.amended_return_received_date}</span>
      )}
    </>
  );
}

function RowNotes({ row }: { row: Donation }) {
  if (!row.returned_to_donor && !row.party_to_party && row.notes.length === 0) return null;
  return (
    <span className="row-notes">
      {row.returned_to_donor && <span className="tag tag-flag">Returned to donor</span>}
      {row.party_to_party && <span className="tag tag-flag">Donor is a party</span>}
      {row.notes.map((note) => (
        <span key={note} className="row-note">
          {note}
        </span>
      ))}
    </span>
  );
}

export function DonationsTable({ rows, sort, onSort, onOpenDonor }: Props) {
  const cards = useMatchMedia("(max-width: 760px)");
  const [page, setPage] = useState(0);
  const [activeRows, setActiveRows] = useState(rows);

  if (rows !== activeRows) {
    setActiveRows(rows);
    setPage(0);
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const start = current * PAGE_SIZE;
  const visibleRows = rows.slice(start, start + PAGE_SIZE);

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
    rows.length > PAGE_SIZE ? (
      <nav className="pager" aria-label="Table pages">
        <p>
          Showing {formatCount(start + 1)} to {formatCount(start + visibleRows.length)} of{" "}
          {formatCount(rows.length)}
        </p>
        <div className="pager-buttons">
          <button type="button" onClick={() => setPage(0)} disabled={current === 0}>
            First
          </button>
          <button type="button" onClick={() => setPage(current - 1)} disabled={current === 0}>
            Previous
          </button>
          <span className="pager-status" aria-live="polite">
            Page {current + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage(current + 1)}
            disabled={current >= pageCount - 1}
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => setPage(pageCount - 1)}
            disabled={current >= pageCount - 1}
          >
            Last
          </button>
        </div>
      </nav>
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
              <DonorName row={row} onOpenDonor={onOpenDonor} />
              <span className="donation-card-party">{row.party}</span>
              <span className="received-date">Latest donation date {row.donation_received_date}</span>
              <ReturnDates row={row} />
              <RowNotes row={row} />
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
                        {column.label === "Received" ? "Latest donation date in return" : column.label}
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
                    <DonorName row={row} onOpenDonor={onOpenDonor} />
                    <span className={`tag tag-${row.donorType}`}>{donorTypeLabel(row.donorType)}</span>
                  </td>
                  <td className="num">{formatNzd(row.amount)}</td>
                  <td>
                    <span className="received-date">{row.donation_received_date}</span>
                    <ReturnDates row={row} />
                    <RowNotes row={row} />
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
