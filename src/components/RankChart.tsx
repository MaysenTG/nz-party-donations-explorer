import { useState } from "react";
import { formatCompactNzd, formatCount, formatNzd } from "../lib/format.ts";
import { darkenColour } from "../lib/parties.ts";
import { axisTicks } from "../lib/scale.ts";

export type RankItem = {
  id: string;
  label: string;
  value: number;
  meta: string;
  colour?: string;
  /** Nested filed names / orgs that make up a related-donor group. */
  children?: RankItem[];
};

type Props = {
  items: RankItem[];
  pressedId: string | null;
  onSelect: (id: string) => void;
  empty: string;
};

function RankBar({
  item,
  top,
  pressed,
  onSelect,
  child,
}: {
  item: RankItem;
  top: number;
  pressed: boolean;
  onSelect: (id: string) => void;
  child?: boolean;
}) {
  const width = top === 0 ? 0 : Math.max((item.value / top) * 100, item.value > 0 ? 1.2 : 0);
  const fill = item.colour
    ? pressed
      ? darkenColour(item.colour, 0.28)
      : item.colour
    : undefined;

  return (
    <button
      type="button"
      className={`rank-row${child ? " rank-row-child" : ""}`}
      aria-pressed={pressed}
      onClick={() => onSelect(item.id)}
    >
      <span className="rank-copy">
        <span className="rank-label">{item.label}</span>
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
  );
}

export function RankChart({ items, pressedId, onSelect, empty }: Props) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());

  if (items.length === 0) {
    return <p className="empty-inline">{empty}</p>;
  }

  const { top, ticks } = axisTicks(Math.max(...items.map((item) => item.value)));

  function toggleGroup(id: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <figure className="rank-chart">
      <ol className="rank-rows">
        {items.map((item) => {
          const pressed = item.id === pressedId;
          const children = item.children?.filter((child) => child.value > 0) ?? [];
          const nestTop = Math.max(item.value, ...children.map((child) => child.value));
          const open = children.length > 0 && !collapsed.has(item.id);

          return (
            <li key={item.id} className={children.length > 0 ? "rank-group" : undefined}>
              <RankBar item={item} top={top} pressed={pressed} onSelect={onSelect} />
              {children.length > 0 && (
                <div className={`rank-nest${open ? "" : " is-collapsed"}`}>
                  <button
                    type="button"
                    className="group-fold"
                    aria-expanded={open}
                    onClick={() => toggleGroup(item.id)}
                  >
                    <span className="group-fold-mark" aria-hidden="true">
                      {open ? "▾" : "▸"}
                    </span>
                    <span>
                      {open
                        ? `Within this group · ${formatCount(children.length)} ${
                            children.length === 1 ? "name" : "names"
                          } as filed`
                        : `Show ${formatCount(children.length)} ${
                            children.length === 1 ? "name" : "names"
                          } as filed`}
                    </span>
                  </button>
                  {open && (
                    <ol className="rank-nest-rows">
                      {children.map((child) => (
                        <li key={child.id}>
                          <RankBar
                            item={child}
                            top={nestTop}
                            pressed={child.id === pressedId}
                            onSelect={onSelect}
                            child
                          />
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
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
    </figure>
  );
}
