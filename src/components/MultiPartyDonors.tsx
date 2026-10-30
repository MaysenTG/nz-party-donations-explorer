import { useState } from "react";
import { formatCompactNzd, formatCount, formatNzd } from "../lib/format.ts";
import type { MultiPartyDonor } from "../lib/insights.ts";
import { partyColour, shortPartyLabel } from "../lib/parties.ts";

type Props = {
  donors: MultiPartyDonor[];
  limit?: number;
  onOpenDonor: (name: string) => void;
};

export function MultiPartyDonors({ donors, limit = 12, onOpenDonor }: Props) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());

  if (donors.length === 0) {
    return <p className="empty-inline">No donor name appears with more than one party here.</p>;
  }

  function toggleGroup(id: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const shown = donors.slice(0, limit);
  return (
    <>
      <ul className="multi-list">
        {shown.map((donor) => {
          const members = donor.members ?? [];
          const open = members.length > 0 && !collapsed.has(donor.id);
          return (
            <li key={donor.id} className={members.length > 0 ? "multi-group" : undefined}>
              <button type="button" className="multi-row" onClick={() => onOpenDonor(donor.id)}>
                <span className="multi-head">
                  <span className="multi-name">{donor.name}</span>
                  <span className="multi-total" title={formatNzd(donor.total)}>
                    {formatCompactNzd(donor.total)}
                  </span>
                </span>
                <span className="multi-split" aria-hidden="true">
                  {donor.parties.map((item) => (
                    <span
                      key={item.party}
                      style={{
                        width: `${(item.amount / donor.total) * 100}%`,
                        background: partyColour(item.party),
                      }}
                    />
                  ))}
                </span>
                <span className="multi-parties">
                  {donor.parties
                    .map((item) => `${shortPartyLabel(item.party)} ${formatCompactNzd(item.amount)}`)
                    .join(" · ")}
                </span>
              </button>
              {members.length > 0 && (
                <div className={`multi-nest${open ? "" : " is-collapsed"}`}>
                  <button
                    type="button"
                    className="group-fold"
                    aria-expanded={open}
                    onClick={() => toggleGroup(donor.id)}
                  >
                    <span className="group-fold-mark" aria-hidden="true">
                      {open ? "▾" : "▸"}
                    </span>
                    <span>
                      {open
                        ? `Within this group · ${formatCount(members.length)} names as filed`
                        : `Show ${formatCount(members.length)} names as filed`}
                    </span>
                  </button>
                  {open && (
                    <ul className="multi-nest-list">
                      {members.map((member) => (
                        <li key={member.id}>
                          <button
                            type="button"
                            className="multi-nest-row"
                            onClick={() => onOpenDonor(donor.id)}
                          >
                            <span className="multi-nest-name">{member.name}</span>
                            <span className="multi-nest-meta">
                              {formatCount(member.count)}{" "}
                              {member.count === 1 ? "return" : "returns"} ·{" "}
                              {formatCompactNzd(member.total)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {donors.length > shown.length && (
        <p className="chart-note">
          {formatCount(donors.length - shown.length)} more in range. Search a name to narrow.
        </p>
      )}
    </>
  );
}
