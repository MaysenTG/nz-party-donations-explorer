import { useEffect, useId, useRef } from "react";
import { partyMergeGroups } from "../lib/donations.ts";

type Props = {
  open: boolean;
  onClose: () => void;
};

const GROUPS = partyMergeGroups();

export function PartyMergesModal({ open, onClose }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal-head">
          <h2 id={titleId}>Party name merges</h2>
          <button
            ref={closeRef}
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <p className="modal-lede">
          Exact published labels from Commission returns are mapped to one canonical party name
          before charts and filters run. Only these listed variants are merged; everything else
          stays as published.
        </p>
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
                    <span className="merge-to">{group.canonical}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="modal-note">
          Internet MANA was the 2014 Internet Party–Mana electoral alliance; those returns are
          grouped under Internet Party for this explorer.
        </p>
      </div>
    </div>
  );
}
