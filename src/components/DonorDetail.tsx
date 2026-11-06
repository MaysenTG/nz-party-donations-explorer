import { useEffect, useId, useMemo, useRef } from "react";
import { safeHttps } from "../lib/donations.ts";
import {
  donorGroup,
  donorGroupById,
  donorLabel,
  donorMembers,
  isDonorGroupId,
} from "../lib/donorGroups.ts";
import { donorTypeLabel } from "../lib/donors.ts";
import { OLD_INDIVIDUAL_LABEL } from "../lib/privacy.ts";
import { formatCount, formatNzd, toCents } from "../lib/format.ts";
import { partyColour } from "../lib/parties.ts";
import type { Donation } from "../types.ts";

type Props = {
  /** Filed donor name, or curated group id when related donors are grouped. */
  name: string | null;
  /** Filtered page rows - modal totals match the charts and table. */
  sourceRows: readonly Donation[];
  groupRelatedDonors: boolean;
  onClose: () => void;
  onFilterToDonor: (name: string) => void;
};

function resolveDonorView(
  name: string,
  groupRelatedDonors: boolean,
): { title: string; matchNames: readonly string[]; grouped: boolean; note?: string } {
  if (groupRelatedDonors && isDonorGroupId(name)) {
    const group = donorGroupById(name);
    const members = group?.members ?? donorMembers(name);
    return {
      title: group?.label ?? donorLabel(name, true),
      matchNames: members,
      grouped: members.length > 1,
      note: group?.note,
    };
  }
  if (groupRelatedDonors) {
    const group = donorGroup(name);
    if (group) {
      return {
        title: group.label,
        matchNames: group.members,
        grouped: group.members.length > 1,
        note: group.note,
      };
    }
  }
  return { title: name, matchNames: [name], grouped: false };
}

/**
 * Returns under one donor key within the current filters. When grouping is on,
 * a curated group id (or any member name) shows every matching member. Names
 * already withheld for privacy cannot be opened. Opening this view does not
 * change the URL.
 */
export function DonorDetail({
  name,
  sourceRows,
  groupRelatedDonors,
  onClose,
  onFilterToDonor,
}: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const { rows, blocked, title, members, grouped, note } = useMemo(() => {
    if (!name || name === OLD_INDIVIDUAL_LABEL) {
      return {
        rows: [] as Donation[],
        blocked: Boolean(name),
        title: name ?? "",
        members: [] as string[],
        grouped: false,
        note: undefined as string | undefined,
      };
    }
    const view = resolveDonorView(name, groupRelatedDonors);
    const nameSet = new Set(view.matchNames);
    const matching = sourceRows
      .filter((row) => !row.nameWithheld && nameSet.has(row.donor_name))
      .sort((a, b) => b.receivedIso.localeCompare(a.receivedIso));
    return {
      rows: matching,
      blocked: false,
      title: view.title,
      members: [...new Set(matching.map((row) => row.donor_name))].sort((a, b) =>
        a.localeCompare(b, "en-NZ"),
      ),
      grouped: view.grouped,
      note: view.note,
    };
  }, [name, sourceRows, groupRelatedDonors]);
  const counted = rows.filter((row) => !row.returned_to_donor && !row.party_to_party);

  useEffect(() => {
    if (!name) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, [name, onClose]);

  if (!name) return null;

  const totalCents = counted.reduce((sum, row) => sum + toCents(row.amount), 0);
  const byParty = new Map<string, number>();
  for (const row of counted) byParty.set(row.party, (byParty.get(row.party) ?? 0) + toCents(row.amount));
  const parties = [...byParty.entries()].sort((a, b) => b[1] - a[1]);
  const years = [...new Set(rows.map((row) => row.receivedIso.slice(0, 4)))].sort();
  const filterTarget = members[0] ?? name;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal donor-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button ref={closeRef} type="button" className="modal-close" onClick={onClose}>
            Close
          </button>
        </div>
        {blocked ? (
          <p className="modal-lede">
            Withheld names cover many different people and cannot be opened as one donor.
          </p>
        ) : (
          <>
            <p className="modal-lede">
              {grouped
                ? "Returns under the filed names in this group that match the current filters."
                : "Returns under this name that match the current filters."}
              {!grouped &&
                " Other spellings of the same donor stay separate unless related-donor grouping is on."}
              {rows[0] &&
                !grouped &&
                ` Donor type is a name-based guess: ${donorTypeLabel(rows[0].donorType)}.`}
              {rows.length === 0 && " None of the returns under this name match the current filters."}
              {counted.length < rows.length &&
                " Donations returned to the donor are listed but not added to the total."}
            </p>
            {note && <p className="donor-group-note">{note}</p>}
            {grouped && members.length > 0 && (
              <>
                <h3 className="donor-sub">Filed as</h3>
                <ul className="donor-filed-as">
                  {members.map((member) => (
                    <li key={member}>{member}</li>
                  ))}
                </ul>
              </>
            )}
            <dl className="donor-stats">
              <div>
                <dt>Total</dt>
                <dd>{formatNzd(totalCents / 100)}</dd>
              </div>
              <div>
                <dt>Returns</dt>
                <dd>{formatCount(rows.length)}</dd>
              </div>
              <div>
                <dt>Years received</dt>
                <dd>
                  {years.length === 0
                    ? "None"
                    : years.length > 1
                      ? `${years[0]} to ${years[years.length - 1]}`
                      : years[0]}
                </dd>
              </div>
            </dl>
            {parties.length > 0 && (
              <>
                <h3 className="donor-sub">By party</h3>
                <ul className="donor-parties">
                  {parties.map(([party, cents]) => (
                    <li key={party}>
                      <i
                        className="party-dot"
                        style={{ background: partyColour(party) }}
                        aria-hidden="true"
                      />
                      <span>{party}</span>
                      <strong>{formatNzd(cents / 100)}</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {rows.length > 0 && (
              <>
                <h3 className="donor-sub">Returns</h3>
                <div className="table-scroll">
                  <table className="donor-table">
                    <thead>
                      <tr>
                        <th scope="col">Latest donation date</th>
                        {grouped && <th scope="col">Donor</th>}
                        <th scope="col">Party</th>
                        <th scope="col" className="num">
                          Amount
                        </th>
                        <th scope="col">Official return</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const url = safeHttps(row.source_pdf_url);
                        return (
                          <tr key={row.id}>
                            <td>{row.donation_received_date}</td>
                            {grouped && (
                              <td className="donor-table-donor">
                                <span className="donor-name">{row.donor_name}</span>
                                <span className={`tag tag-${row.donorType}`}>
                                  {donorTypeLabel(row.donorType)}
                                </span>
                              </td>
                            )}
                            <td>
                              {row.party}
                              {row.returned_to_donor && (
                                <span className="tag tag-flag">Returned to donor</span>
                              )}
                            </td>
                            <td className="num">{formatNzd(row.amount)}</td>
                            <td>
                              {url ? (
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                  View return
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
              </>
            )}
            <p className="modal-note">
              <button
                type="button"
                className="text-button"
                onClick={() => onFilterToDonor(filterTarget)}
              >
                {grouped ? "Show this group in the main table" : "Show this name in the main table"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
