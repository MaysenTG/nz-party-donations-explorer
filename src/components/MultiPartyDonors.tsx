import { formatCompactNzd, formatCount, formatNzd } from "../lib/format.ts";
import type { MultiPartyDonor } from "../lib/insights.ts";
import { partyColour, shortPartyLabel } from "../lib/parties.ts";

type Props = {
  donors: MultiPartyDonor[];
  limit?: number;
  onOpenDonor: (name: string) => void;
};

export function MultiPartyDonors({ donors, limit = 12, onOpenDonor }: Props) {
  if (donors.length === 0) {
    return <p className="empty-inline">No donor name appears with more than one party here.</p>;
  }
  const shown = donors.slice(0, limit);
  return (
    <>
      <ul className="multi-list">
        {shown.map((donor) => (
          <li key={donor.name}>
            <button type="button" className="multi-row" onClick={() => onOpenDonor(donor.name)}>
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
          </li>
        ))}
      </ul>
      {donors.length > shown.length && (
        <p className="chart-note">
          {formatCount(donors.length - shown.length)} more in range. Search a name to narrow.
        </p>
      )}
    </>
  );
}
