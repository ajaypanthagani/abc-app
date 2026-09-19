import { copy } from '@/lib/copy';
import { formatDate, formatNumber } from '@/lib/format';

type Point = { capturedAt: string; followersCount: number | null; mediaCount: number | null };

// A bar per sync rather than a line chart: the series is short (one point per
// weekly sync) and bars stay readable without a charting dependency.
export function FollowerTrend({ points }: { points: Point[] }) {
  const usable = points.filter((p) => p.followersCount !== null);
  if (usable.length < 2) {
    return <p className="px-5 py-6 text-[14px] leading-relaxed text-fg-muted">{copy.insights.trendEmpty}</p>;
  }

  const counts = usable.map((p) => p.followersCount as number);
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  // Scale from a floor slightly below the minimum so small week-on-week
  // changes are visible instead of every bar looking full height.
  const floor = min === max ? 0 : min - (max - min) * 0.4;
  const height = (n: number) => Math.max(6, Math.round(((n - floor) / (max - floor)) * 100));

  const first = counts[0];
  const last = counts[counts.length - 1];
  const delta = last - first;

  return (
    <div className="px-5 py-5">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-medium tracking-tight text-fg">{formatNumber(last)}</span>
        <span className="font-mono text-[11px] uppercase tracking-micro text-fg-muted">
          {delta === 0 ? 'no change' : `${delta > 0 ? '+' : ''}${formatNumber(delta)} since ${formatDate(usable[0].capturedAt)}`}
        </span>
      </div>
      <ol className="mt-5 flex h-28 items-end gap-2">
        {usable.map((p) => (
          <li key={p.capturedAt} className="flex h-full flex-1 flex-col justify-end">
            <span
              className="w-full rounded-t bg-lime"
              style={{ height: `${height(p.followersCount as number)}%` }}
              title={`${formatDate(p.capturedAt)} · ${formatNumber(p.followersCount)} followers`}
            />
          </li>
        ))}
      </ol>
      <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-micro text-fg-muted">
        <span>{formatDate(usable[0].capturedAt)}</span>
        <span>{formatDate(usable[usable.length - 1].capturedAt)}</span>
      </div>
    </div>
  );
}
