import { partyMergeGroups } from "../lib/donations.ts";

const GROUPS = partyMergeGroups();

/** Party labels grouped by the normalisation map, not a hand-maintained copy. */
export function PartyMergeList() {
  return (
    <ul className="merge-groups">
      {GROUPS.map((group) => (
        <li key={group.canonical}>
          <p className="merge-canonical">{group.canonical}</p>
          <ul className="merge-aliases">
            {group.aliases.map((alias) => (
              <li key={alias}>
                <span className="merge-from">{alias}</span>
                <span className="merge-arrow" aria-hidden="true">
                  →
                </span>
                <span className="visually-hidden"> is shown as </span>
                <span className="merge-to">{group.canonical}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
