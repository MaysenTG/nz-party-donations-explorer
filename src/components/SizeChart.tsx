import { formatCompactNzd, formatCount, formatNzd } from "../lib/format.ts";
import type { SizeBucket } from "../lib/insights.ts";

type Props = { buckets: SizeBucket[] };

export function SizeChart({ buckets }: Props) {
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  if (total === 0) return <p className="empty-inline">No donations in these filters.</p>;
  return (
    <table className="size-table">
      <caption className="visually-hidden">Number of donations and amount by size band</caption>
      <thead>
        <tr>
          <th scope="col">Size</th>
          <th scope="col">Donations</th>
          <th scope="col" className="num">
            Amount
          </th>
        </tr>
      </thead>
      <tbody>
        {buckets.map((bucket) => (
          <tr key={bucket.label}>
            <th scope="row">{bucket.label}</th>
            <td>
              <span className="size-bar-wrap">
                <span
                  className="size-bar"
                  style={{ width: `${(bucket.count / maxCount) * 100}%` }}
                  aria-hidden="true"
                />
                <span className="size-count">{formatCount(bucket.count)}</span>
              </span>
            </td>
            <td className="num" title={formatNzd(bucket.amount)}>
              {formatCompactNzd(bucket.amount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
