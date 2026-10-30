import { useMemo, useState } from "react";
import { donorGroup } from "../lib/donorGroups.ts";
import { donorTypeLabel } from "../lib/donors.ts";
import { formatCompactNzd, formatCount, formatNzd, toCents } from "../lib/format.ts";
import { safeHttps } from "../lib/donations.ts";
import { useMatchMedia } from "../hooks/useMatchMedia.ts";
import type { Donation, SortKey, SortState } from "../types.ts";

type Props = {
  rows: Donation[];
  sort: SortState;
  groupRelatedDonors: boolean;
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

type GroupMeta = {
  id: string;
  label: string;
  returnCount: number;
  filedNames: number;
  memberNames: string[];
  total: number;
};

type DisplayItem =
  | { kind: "header"; group: GroupMeta }
  | { kind: "row"; row: Donation; nested: boolean };

/** Keep sort order, but pull curated multi-member group rows together at first sighting. */
function clusterRelatedRows(rows: readonly Donation[]): Donation[] {
  const buckets = new Map<string, Donation[]>();
  const order: Array<{ kind: "solo"; row: Donation } | { kind: "group"; id: string }> = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (row.nameWithheld) {
      order.push({ kind: "solo", row });
      continue;
    }
    const group = donorGroup(row.donor_name);
    if (!group || group.members.length < 2) {
      order.push({ kind: "solo", row });
      continue;
    }
    const list = buckets.get(group.id) ?? [];
    list.push(row);
    buckets.set(group.id, list);
    if (!seen.has(group.id)) {
      seen.add(group.id);
      order.push({ kind: "group", id: group.id });
    }
  }

  const out: Donation[] = [];
  for (const item of order) {
    if (item.kind === "solo") out.push(item.row);
    else out.push(...(buckets.get(item.id) ?? []));
  }
  return out;
}

function groupMetaFor(rows: readonly Donation[], groupId: string): GroupMeta | null {
  const group = donorGroup(rows.find((row) => donorGroup(row.donor_name)?.id === groupId)?.donor_name ?? "");
  if (!group) return null;
  const slice = rows.filter((row) => !row.nameWithheld && donorGroup(row.donor_name)?.id === groupId);
  if (slice.length < 2) return null;
  const names = [...new Set(slice.map((row) => row.donor_name))].sort((a, b) =>
    a.localeCompare(b, "en-NZ"),
  );
  const total =
    slice
      .filter((row) => !row.returned_to_donor && !row.party_to_party)
      .reduce((sum, row) => sum + toCents(row.amount), 0) / 100;
  return {
    id: group.id,
    label: group.label,
    returnCount: slice.length,
    filedNames: names.length,
    memberNames: names,
    total,
  };
}

function buildDisplayItems(
  clusteredRows: readonly Donation[],
  groupRelatedDonors: boolean,
): DisplayItem[] {
  if (!groupRelatedDonors) {
    return clusteredRows.map((row) => ({ kind: "row" as const, row, nested: false }));
  }

  const items: DisplayItem[] = [];
  let index = 0;
  while (index < clusteredRows.length) {
    const row = clusteredRows[index]!;
    const group = row.nameWithheld ? null : donorGroup(row.donor_name);
    if (!group || group.members.length < 2) {
      items.push({ kind: "row", row, nested: false });
      index += 1;
      continue;
    }
    let end = index + 1;
    while (
      end < clusteredRows.length &&
      !clusteredRows[end]!.nameWithheld &&
      donorGroup(clusteredRows[end]!.donor_name)?.id === group.id
    ) {
      end += 1;
    }
    const slice = clusteredRows.slice(index, end);
    const meta = slice.length >= 2 ? groupMetaFor(clusteredRows, group.id) : null;
    if (meta) {
      items.push({ kind: "header", group: meta });
      for (const item of slice) items.push({ kind: "row", row: item, nested: true });
    } else {
      for (const item of slice) items.push({ kind: "row", row: item, nested: false });
    }
    index = end;
  }
  return items;
}

/** Page of display items covering return rows [start, end). */
function pageItems(items: readonly DisplayItem[], start: number, end: number): DisplayItem[] {
  const visible: DisplayItem[] = [];
  let rowIndex = 0;
  let pendingHeader: GroupMeta | null = null;

  for (const item of items) {
    if (item.kind === "header") {
      pendingHeader = item.group;
      continue;
    }
    if (rowIndex >= start && rowIndex < end) {
      if (pendingHeader) {
        visible.push({ kind: "header", group: pendingHeader });
        pendingHeader = null;
      }
      visible.push(item);
    } else if (rowIndex >= end) {
      break;
    } else {
      pendingHeader = null;
    }
    rowIndex += 1;
  }
  return visible;
}

function PdfLink({ url, donor }: { url: string | null; donor: string }) {
  if (!url) return <span className="muted">PDF not published</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      View PDF
      <span className="visually-hidden"> for {donor}</span>
    </a>
  );
}

function DonorName({
  row,
  onOpenDonor,
  groupRelatedDonors,
}: {
  row: Donation;
  onOpenDonor: (key: string) => void;
  groupRelatedDonors: boolean;
}) {
  if (row.nameWithheld) {
    return (
      <span
        className="donor-name donor-withheld"
        title="Hidden because “Hide names older than 6 years” is on. Amounts stay in the data."
      >
        {row.donor_name}
      </span>
    );
  }
  const group = groupRelatedDonors ? donorGroup(row.donor_name) : null;
  const openKey = group && group.members.length > 1 ? group.id : row.donor_name;
  return (
    <button type="button" className="donor-name donor-link" onClick={() => onOpenDonor(openKey)}>
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

function GroupBanner({
  group,
  open,
  onToggle,
  onOpen,
}: {
  group: GroupMeta;
  open: boolean;
  onToggle: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="donor-group-banner">
      <button
        type="button"
        className="group-fold donor-group-fold"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="group-fold-mark" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
        <span className="visually-hidden">
          {open ? "Hide" : "Show"} returns in this group
        </span>
      </button>
      <button type="button" className="donor-group-banner-btn" onClick={() => onOpen(group.id)}>
        <span className="donor-group-banner-label">{group.label}</span>
        <span className="donor-group-banner-meta">
          {formatCount(group.returnCount)}{" "}
          {group.returnCount === 1 ? "return" : "returns"} · {formatCompactNzd(group.total)}
        </span>
        <span className="donor-group-banner-within">
          {open
            ? `Within this group · ${formatCount(group.memberNames.length)} ${
                group.memberNames.length === 1 ? "name" : "names"
              } as filed`
            : `${formatCount(group.memberNames.length)} ${
                group.memberNames.length === 1 ? "name" : "names"
              } as filed · expand to show returns`}
        </span>
        {open && (
          <span className="donor-group-banner-members">{group.memberNames.join(" · ")}</span>
        )}
      </button>
    </div>
  );
}

export function DonationsTable({ rows, sort, groupRelatedDonors, onSort, onOpenDonor }: Props) {
  const cards = useMatchMedia("(max-width: 760px)");
  const [page, setPage] = useState(0);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const [activeRows, setActiveRows] = useState(rows);
  const [activeGrouped, setActiveGrouped] = useState(groupRelatedDonors);

  if (rows !== activeRows || groupRelatedDonors !== activeGrouped) {
    setActiveRows(rows);
    setActiveGrouped(groupRelatedDonors);
    setPage(0);
    if (!groupRelatedDonors) setCollapsed(new Set());
  }

  const clusteredRows = useMemo(
    () => (groupRelatedDonors ? clusterRelatedRows(rows) : rows),
    [rows, groupRelatedDonors],
  );
  const items = useMemo(
    () => buildDisplayItems(clusteredRows, groupRelatedDonors),
    [clusteredRows, groupRelatedDonors],
  );

  const pageCount = Math.max(1, Math.ceil(clusteredRows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const start = current * PAGE_SIZE;
  const visibleItems = useMemo(() => {
    const slice = pageItems(items, start, start + PAGE_SIZE);
    return slice.filter((item) => {
      if (item.kind !== "row" || !item.nested) return true;
      const group = donorGroup(item.row.donor_name);
      return !group || !collapsed.has(group.id);
    });
  }, [items, start, collapsed]);
  const visibleRowCount = visibleItems.filter((item) => item.kind === "row").length;

  function toggleGroup(id: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
    clusteredRows.length > PAGE_SIZE ? (
      <nav className="pager" aria-label="Table pages">
        <p>
          Showing {formatCount(start + 1)} to {formatCount(start + visibleRowCount)} of{" "}
          {formatCount(clusteredRows.length)}
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
          {visibleItems.map((item, index) => {
            if (item.kind === "header") {
              const open = !collapsed.has(item.group.id);
              return (
                <li
                  key={`group-${item.group.id}-${index}`}
                  className={`donation-group-card${open ? "" : " is-collapsed"}`}
                >
                  <GroupBanner
                    group={item.group}
                    open={open}
                    onToggle={() => toggleGroup(item.group.id)}
                    onOpen={onOpenDonor}
                  />
                </li>
              );
            }
            const { row, nested } = item;
            return (
              <li key={row.id} className={nested ? "is-grouped-child" : undefined}>
                <div className="donation-card-top">
                  <span className="donation-card-amount">{formatNzd(row.amount)}</span>
                  <span className={`tag tag-${row.donorType}`}>{donorTypeLabel(row.donorType)}</span>
                </div>
                <DonorName
                  row={row}
                  onOpenDonor={onOpenDonor}
                  groupRelatedDonors={groupRelatedDonors}
                />
                <span className="donation-card-party">{row.party}</span>
                <span className="received-date">Latest donation date {row.donation_received_date}</span>
                <ReturnDates row={row} />
                <RowNotes row={row} />
                <PdfLink url={safeHttps(row.source_pdf_url)} donor={row.donor_name} />
              </li>
            );
          })}
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
              Donations matching the current filters, showing {visibleRowCount} of{" "}
              {clusteredRows.length} rows
              {groupRelatedDonors ? ", with related donors grouped" : ""}
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
              {visibleItems.map((item, index) => {
                if (item.kind === "header") {
                  const open = !collapsed.has(item.group.id);
                  return (
                    <tr
                      key={`group-${item.group.id}-${index}`}
                      className={`donor-group-row${open ? "" : " is-collapsed"}`}
                    >
                      <td colSpan={5}>
                        <GroupBanner
                          group={item.group}
                          open={open}
                          onToggle={() => toggleGroup(item.group.id)}
                          onOpen={onOpenDonor}
                        />
                      </td>
                    </tr>
                  );
                }
                const { row, nested } = item;
                return (
                  <tr key={row.id} className={nested ? "is-grouped-child" : undefined}>
                    <td>{row.party}</td>
                    <td>
                      <DonorName
                        row={row}
                        onOpenDonor={onOpenDonor}
                        groupRelatedDonors={groupRelatedDonors}
                      />
                      <span className={`tag tag-${row.donorType}`}>
                        {donorTypeLabel(row.donorType)}
                      </span>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {moreControls}
    </>
  );
}
