import { useEffect, useId, useRef } from "react";
import { donorMergeGroups } from "../lib/donorGroups.ts";

type Props = {
  open: boolean;
  onClose: () => void;
};

const GROUPS = donorMergeGroups();

export function DonorGroupsModal({ open, onClose }: Props) {
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
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-head">
          <h2 id={titleId}>Related donor groups</h2>
          <button ref={closeRef} type="button" className="modal-close" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="modal-lede">
          Optional reading aid when “Group related donors” is on. Only the listed same-person or
          same-entity name variants are combined. Spouses and other family members stay separate.
          Each return still shows the name as filed. This is not an Electoral Commission
          classification.
        </p>
        <ul className="merge-groups">
          {GROUPS.map((group) => (
            <li key={group.id}>
              <p className="merge-canonical">{group.label}</p>
              {group.note && <p className="merge-note">{group.note}</p>}
              <ul className="merge-aliases merge-aliases-plain">
                {group.members.map((member) => (
                  <li key={member}>
                    <span className="merge-from">{member}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
