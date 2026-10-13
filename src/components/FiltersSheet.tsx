import { useEffect, useId, useRef } from "react";

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), summary, a[href], [tabindex]:not([tabindex="-1"])';
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
  const sheetRef = useRef<HTMLDivElement>(null);
  const active = activeFilterCount(filters);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    // Lock the page behind the sheet, including iOS rubber-band scrolling.
    const { body, documentElement: html } = document;
    const scrollY = window.scrollY;
    const saved = {
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;
      const items = [...sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (item) => item.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      body.style.position = saved.bodyPosition;
      body.style.top = saved.bodyTop;
      body.style.width = saved.bodyWidth;
      body.style.overflow = saved.bodyOverflow;
      html.style.overscrollBehavior = saved.htmlOverscroll;
      window.scrollTo({ top: scrollY, behavior: "instant" });
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
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
        ref={sheetRef}
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
          compact
          onChange={onChange}
          onReset={onReset}
        />
      </div>
    </div>
  );
}
