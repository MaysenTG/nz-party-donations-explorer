import { formatCompactNzd, formatNzd } from "../lib/format.ts";

export type BarItem = {
  id: string;
  label: string;
  value: number;
  meta: string;
};

type Props = {
  items: BarItem[];
  pressedId: string | null;
  onSelect: (id: string) => void;
  empty: string;
};

export function HorizontalBars({ items, pressedId, onSelect, empty }: Props) {
  if (items.length === 0) {
    return <p className="empty-inline">{empty}</p>;
  }

  const max = Math.max(...items.map((item) => item.value), 0);

  return (
    <ol className="bars">
      {items.map((item) => {
        const width = max === 0 ? 0 : Math.max((item.value / max) * 100, item.value > 0 ? 1.5 : 0);
        const pressed = item.id === pressedId;
        return (
          <li key={item.id}>
            <button
              type="button"
              className="bar-row"
              aria-pressed={pressed}
              onClick={() => onSelect(item.id)}
            >
              <span className="bar-label">{item.label}</span>
              <span className="bar-meta">{item.meta}</span>
              <span className="bar-track" aria-hidden="true">
                <span className="bar-fill" style={{ width: `${width}%` }} />
              </span>
              <span className="bar-value">
                {formatCompactNzd(item.value)}
                <span className="visually-hidden"> ({formatNzd(item.value)})</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
