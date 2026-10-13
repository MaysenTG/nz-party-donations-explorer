import { useEffect, useId, useMemo, useRef } from "react";
import { INSPECTION_CUTOFF_ISO, donations, safeHttps } from "../lib/donations.ts";
import { donorTypeLabel } from "../lib/donors.ts";
import { INSPECTION_YEARS, isPastInspection } from "../lib/privacy.ts";
import { formatCount, formatNzd } from "../lib/format.ts";
import { partyColour } from "../lib/parties.ts";
import { toCents } from "../lib/format.ts";

type Props = {
  name: string | null;
  onClose: () => void;
  onFilterToDonor: (name: string) => void;
};

/**
 * Returns filed under one exact donor name, limited to returns still inside the
 * 6 year public inspection period. Opening this view does not change the page URL.
 */
export function DonorDetail({ name, onClose, onFilterToDonor }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const { rows, older } = useMemo(() => {
    if (!name) return { rows: [], older: 0 };
    const all = donations.filter((row) => !row.nameWithheld && row.donor_name === name);
    const recent = all
      .filter((row) => !isPastInspection(row.returnIso, INSPECTION_CUTOFF_ISO))
      .sort((a, b) => b.receivedIso.localeCompare(a.receivedIso));
    return { rows: recent, older: all.length - recent.length };
  }, [name]);
  const counted = rows.filter((row) => !row.returned_to_donor);

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
          <h2 id={titleId}>{name}</h2>
          <button ref={closeRef} type="button" className="modal-close" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="modal-lede">
          Returns filed under this name in the last {INSPECTION_YEARS} years, ignoring current
          filters.
          {" The same donor may appear under other spellings; those are listed separately."}
          {rows[0] && ` Donor type is a name-based guess: ${donorTypeLabel(rows[0].donorType)}.`}
          {older > 0 &&
            ` ${formatCount(older)} older ${older === 1 ? "return is" : "returns are"} not listed here; ${
              older === 1 ? "it stays" : "they stay"
            } in the main table.`}
          {counted.length < rows.length && " Donations returned to the donor are listed but not added to the total."}
        </p>
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
              {years.length === 0 ? "None" : years.length > 1 ? `${years[0]} to ${years[years.length - 1]}` : years[0]}
            </dd>
          </div>
        </dl>
        <h3 className="donor-sub">By party</h3>
        <ul className="donor-parties">
          {parties.map(([party, cents]) => (
            <li key={party}>
              <i className="party-dot" style={{ background: partyColour(party) }} aria-hidden="true" />
              <span>{party}</span>
              <strong>{formatNzd(cents / 100)}</strong>
            </li>
          ))}
        </ul>
        <h3 className="donor-sub">Returns</h3>
        <div className="table-scroll">
          <table className="donor-table">
            <thead>
              <tr>
                <th scope="col">Latest donation date</th>
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
                    <td>
                      {row.party}
                      {row.returned_to_donor && <span className="tag tag-flag">Returned to donor</span>}
                    </td>
                    <td className="num">{formatNzd(row.amount)}</td>
                    <td>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          View return
                        </a>
                      ) : (
                        <span className="muted">Not published as a file</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="modal-note">
          <button type="button" className="text-button" onClick={() => onFilterToDonor(name)}>
            Show these in the main table
          </button>
        </p>
      </div>
    </div>
  );
}
