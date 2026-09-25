import { useMatchMedia } from "../hooks/useMatchMedia.ts";

type Props = {
  activeCount: number;
  onOpen: () => void;
};

export function FiltersFab({ activeCount, onOpen }: Props) {
  const isMobile = useMatchMedia("(max-width: 760px)");
  if (!isMobile) return null;

  const label =
    activeCount > 0
      ? `Open filters, ${activeCount} active`
      : "Open filters";

  return (
    <button type="button" className="filters-fab" aria-label={label} onClick={onOpen}>
      <span className="filters-fab-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
        </svg>
      </span>
      {activeCount > 0 && (
        <span className="filters-fab-count" aria-hidden="true">
          {activeCount > 9 ? "9+" : activeCount}
        </span>
      )}
    </button>
  );
}
