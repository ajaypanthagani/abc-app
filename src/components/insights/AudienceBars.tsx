import type { AudienceBucket } from '@/lib/api/types';
import { formatNumber } from '@/lib/format';
import { Micro } from '@/components/ui/Micro';

// Meta hands gender back as single letters and age-gender buckets as "F.18-24";
// spell them out rather than showing the raw API string to the creator.
const GENDER_LABELS: Record<string, string> = { F: 'Women', M: 'Men', U: 'Not specified' };

// Country buckets arrive as ISO-3166 alpha-2 ("IN"); spell them out. Any other
// two-letter bucket resolves to itself, so the heuristic is safe.
const countryNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

function label(bucket: string): string {
  if (GENDER_LABELS[bucket]) return GENDER_LABELS[bucket];
  if (/^[A-Z]{2}$/.test(bucket)) {
    try {
      return countryNames?.of(bucket) ?? bucket;
    } catch {
      return bucket;
    }
  }
  return bucket;
}

// Shares are fractions of the follower base. Falling back to the largest
// bucket keeps the bars meaningful when Meta omits `share`.
function widthPct(b: AudienceBucket, max: number): number {
  if (b.share !== null) return Math.round(b.share * 100);
  if (max > 0 && b.followerCount !== null) return Math.round((b.followerCount / max) * 100);
  return 0;
}

export function AudienceBars({ title, buckets }: { title: string; buckets: AudienceBucket[] }) {
  if (buckets.length === 0) return null;
  const max = Math.max(...buckets.map((b) => b.followerCount ?? 0), 0);

  return (
    <div>
      <Micro>{title}</Micro>
      <ul className="mt-3 space-y-2">
        {buckets.map((b) => {
          const pct = widthPct(b, max);
          return (
            <li key={b.bucket} className="grid grid-cols-[7.5rem_1fr_4.5rem] items-center gap-3">
              <span className="truncate text-[13px] text-fg" title={label(b.bucket)}>
                {label(b.bucket)}
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-pill" aria-hidden="true">
                <span className="block h-full rounded-full bg-lime" style={{ width: `${pct}%` }} />
              </span>
              <span className="text-right font-mono text-[11px] text-fg-muted">
                {b.share !== null ? `${(b.share * 100).toFixed(1)}%` : formatNumber(b.followerCount)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
