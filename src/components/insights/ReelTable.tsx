import type { InsightsReel } from '@/lib/api/types';
import { copy } from '@/lib/copy';
import { compactNumber, formatDate } from '@/lib/format';

function Cell({ value }: { value: number | null }) {
  return (
    <td className="px-3 py-3 text-right font-mono text-[12px] tabular-nums text-fg">
      {compactNumber(value)}
    </td>
  );
}

export function ReelTable({ reels }: { reels: InsightsReel[] }) {
  if (reels.length === 0) {
    return <p className="px-5 py-6 text-[14px] leading-relaxed text-fg-muted">{copy.insights.reelsEmpty}</p>;
  }

  return (
    // Insight columns are numerous on a phone; let the table scroll sideways
    // rather than crushing the numbers.
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse">
        <thead>
          <tr className="border-b border-edge">
            <th scope="col" className="px-5 py-2 text-left font-mono text-[10px] uppercase tracking-micro text-fg-muted">
              {copy.insights.colReel}
            </th>
            {[
              copy.insights.colViews,
              copy.insights.colReach,
              copy.insights.colLikes,
              copy.insights.colComments,
              copy.insights.colSaves,
              copy.insights.colShares,
            ].map((h) => (
              <th
                key={h}
                scope="col"
                className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-micro text-fg-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {reels.map((r) => (
            <tr key={r.id}>
              <th scope="row" className="max-w-[16rem] px-5 py-3 text-left font-normal">
                {r.permalink ? (
                  <a
                    href={r.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-fg underline underline-offset-4"
                  >
                    {formatDate(r.postedAt)}
                  </a>
                ) : (
                  <span className="text-[13px] text-fg">{formatDate(r.postedAt)}</span>
                )}
                {r.caption ? (
                  <span className="mt-0.5 block truncate text-[12px] text-fg-muted">{r.caption}</span>
                ) : null}
              </th>
              <Cell value={r.views} />
              <Cell value={r.reach} />
              <Cell value={r.likes} />
              <Cell value={r.comments} />
              <Cell value={r.saves} />
              <Cell value={r.shares} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
