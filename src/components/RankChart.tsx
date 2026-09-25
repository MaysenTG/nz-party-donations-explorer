import { formatCompactNzd, formatNzd } from "../lib/format.ts";
import { darkenColour } from "../lib/parties.ts";
import { axisTicks } from "../lib/scale.ts";

export type RankItem = {
  id: string;
  label: string;
  value: number;
  meta: string;
  blurb?: string;
  colour?: string;
};

type Props = {
  items: RankItem[];
  pressedId: string | null;
  onSelect: (id: string) => void;
  empty: string;
};

export function RankChart({ items, pressedId, onSelect, empty }: Props) {
  if (items.length === 0) {
    return <p className="empty-inline">{empty}</p>;
  }

  const { top, ticks } = axisTicks(Math.max(...items.map((item) => item.value)));

  return (
    <figure className="rank-chart">
      <ol className="rank-rows">
        {items.map((item) => {
          const width = top === 0 ? 0 : Math.max((item.value / top) * 100, item.value > 0 ? 1.2 : 0);
          const pressed = item.id === pressedId;
          const fill = item.colour
            ? pressed
              ? darkenColour(item.colour, 0.28)
              : item.colour
            : undefined;
          return (
            <li key={item.id}>
              <button
                type="button"
                className="rank-row"
                aria-pressed={pressed}
                onClick={() => onSelect(item.id)}
              >
                <span className="rank-copy">
                  <span className="rank-label">{item.label}</span>
                  {item.blurb && <span className="rank-blurb">{item.blurb}</span>}
                  <span className="rank-meta">{item.meta}</span>
                </span>
                <span className="rank-plot">
                  <span className="rank-track" aria-hidden="true">
                    <span
                      className="rank-fill"
                      style={{
                        width: `${width}%`,
                        ...(fill ? { background: fill } : {}),
                      }}
                    />
                  </span>
                  <span className="rank-value">
                    {formatCompactNzd(item.value)}
                    <span className="visually-hidden"> ({formatNzd(item.value)})</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="rank-scale" aria-hidden="true">
        <span className="rank-scale-spacer" />
        <span className="rank-scale-axis">
          {ticks.map((tick, index) => (
            <span
              key={tick}
              className={index === 0 ? "is-start" : index === ticks.length - 1 ? "is-end" : undefined}
              style={{ left: `${(tick / top) * 100}%` }}
            >
              {formatCompactNzd(tick)}
            </span>
          ))}
        </span>
        <span className="rank-scale-value" />
      </div>
      <figcaption className="chart-note">Amounts in NZD.</figcaption>
    </figure>
  );
}
