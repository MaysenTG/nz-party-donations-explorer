import { formatCompactNzd, formatCount, formatNzd } from "../lib/format.ts";

export type Stats = {
  total: number;
  donations: number;
  donors: number;
  parties: number;
  median: number;
  largest: number;
};

type Props = { stats: Stats; overall: Stats };

export function StatCards({ stats, overall }: Props) {
  const narrowed = stats.donations !== overall.donations;
  const cards: { label: string; value: string; title: string; of?: string }[] = [
    {
      label: "Total declared",
      value: formatCompactNzd(stats.total),
      title: formatNzd(stats.total),
      of: narrowed ? `of ${formatCompactNzd(overall.total)}` : undefined,
    },
    {
      label: "Returns",
      value: formatCount(stats.donations),
      title: formatCount(stats.donations),
      of: narrowed ? `of ${formatCount(overall.donations)}` : undefined,
    },
    {
      label: "Donor names",
      value: formatCount(stats.donors),
      title: "Distinct donor names as filed. One donor can appear under more than one spelling. Withheld names (returns over 6 years old) are not counted.",
      of: narrowed ? `of ${formatCount(overall.donors)}` : undefined,
    },
    {
      label: "Parties",
      value: formatCount(stats.parties),
      title: formatCount(stats.parties),
      of: narrowed ? `of ${formatCount(overall.parties)}` : undefined,
    },
    { label: "Median return", value: formatCompactNzd(stats.median), title: formatNzd(stats.median) },
    { label: "Largest return", value: formatCompactNzd(stats.largest), title: formatNzd(stats.largest) },
  ];
  return (
    <section className="stat-cards" aria-label="Summary for the current filters" aria-live="polite">
      {cards.map((card) => (
        <div className="stat-card" key={card.label}>
          <p className="stat-label">{card.label}</p>
          <p className="stat-value" title={card.title}>
            {card.value}
          </p>
          {card.of && <p className="stat-of">{card.of}</p>}
        </div>
      ))}
    </section>
  );
}
