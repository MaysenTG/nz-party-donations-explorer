import { useEffect, useId, useRef } from "react";
import { activeFilterCount } from "../lib/donations.ts";
import { FilterFields, type FilterFieldsProps } from "./Filters.tsx";

type Props = FilterFieldsProps & {
  open: boolean;
  onClose: () => void;
};

export function FiltersSheet({
  open,
  onClose,
  filters,
  partyCounts,
  donorTypeCounts,
  problem,
  onChange,
  onReset,
}: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const active = activeFilterCount(filters);

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
      className="filters-sheet-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="filters-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="filters-sheet-head">
          <div>
            <h2 id={titleId}>Filters</h2>
            {active > 0 && <span className="badge">{active} active</span>}
          </div>
          <button
            ref={closeRef}
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            Done
          </button>
        </div>
        <FilterFields
          filters={filters}
          partyCounts={partyCounts}
          donorTypeCounts={donorTypeCounts}
          problem={problem}
          idPrefix="sheet-"
          onChange={onChange}
          onReset={onReset}
        />
      </div>
    </div>
  );
}
