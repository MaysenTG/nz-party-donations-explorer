import { useEffect, useId, useMemo, useRef } from "react";
import { donations, safeHttps } from "../lib/donations.ts";
import { donorTypeLabel, classifyDonor } from "../lib/donors.ts";
import { formatCount, formatNzd } from "../lib/format.ts";
import { partyColour } from "../lib/parties.ts";
import { toCents } from "../lib/format.ts";

type Props = {
  name: string | null;
  onClose: () => void;
  onFilterToDonor: (name: string) => void;
};

/** All donations recorded under one exact published donor name, across every year and party. */
export function DonorDetail({ name, onClose, onFilterToDonor }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const rows = useMemo(
    () =>
      name
        ? donations
            .filter((row) => row.donor_name === name)
            .sort((a, b) => b.receivedIso.localeCompare(a.receivedIso))
        : [],
    [name],
  );

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

  const totalCents = rows.reduce((sum, row) => sum + toCents(row.amount), 0);
  const byParty = new Map<string, number>();
  for (const row of rows) byParty.set(row.party, (byParty.get(row.party) ?? 0) + toCents(row.amount));
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
          Every donation filed under this exact name, ignoring current filters. The same person or
          organisation may also appear under a different spelling. Donor type is a name-based guess:{" "}
          {donorTypeLabel(classifyDonor(name))}.
        </p>
        <dl className="donor-stats">
          <div>
            <dt>Total</dt>
            <dd>{formatNzd(totalCents / 100)}</dd>
          </div>
          <div>
            <dt>Donations</dt>
            <dd>{formatCount(rows.length)}</dd>
          </div>
          <div>
            <dt>Years received</dt>
            <dd>{years.length > 1 ? `${years[0]} to ${years[years.length - 1]}` : years[0]}</dd>
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
        <h3 className="donor-sub">Donations</h3>
        <div className="table-scroll">
          <table className="donor-table">
            <thead>
              <tr>
                <th scope="col">Received</th>
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
                    <td>{row.party}</td>
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
            Filter the page to this name
          </button>
        </p>
      </div>
    </div>
  );
}
