import type { Metadata } from 'next';
import { getInsights, getPerformance } from '@/lib/api/server';
import { copy } from '@/lib/copy';
import { compactNumber, percent, shortDate } from '@/lib/format';
import { Card, Empty, PageHead } from '@/components/dashboard/ui';
import { AudienceBars } from '@/components/insights/AudienceBars';
import { FollowerTrend } from '@/components/insights/FollowerTrend';
import { ReelTable } from '@/components/insights/ReelTable';

export const metadata: Metadata = { title: 'Performance' };

function consistencyLabel(c: number | null): { value: string; note: string } {
  if (c === null) return { value: '—', note: 'Needs 4+ recent Reels' };
  if (c >= 0.75) return { value: 'High', note: 'Low variance across recent Reels' };
  if (c >= 0.5) return { value: 'Medium', note: 'Some swing between Reels' };
  return { value: 'Low', note: 'Views vary a lot between Reels' };
}

export default async function PerformancePage() {
  const [perf, insights] = await Promise.all([getPerformance(), getInsights()]);
  const t = copy.dashboard.performance;
  const m = perf.metrics;
  const cons = consistencyLabel(m?.consistency ?? null);

  const tiles = [
    { label: 'Median Reel views', value: compactNumber(m?.medianReelViews), note: m?.sampleMediaCount ? `Last ${m.sampleMediaCount} Reels` : 'From your recent Reels' },
    { label: 'View-to-follower', value: m?.viewFollowerRatio === null || !m ? '—' : m.viewFollowerRatio.toFixed(2), note: 'Median views ÷ followers' },
    { label: 'Consistency', value: cons.value, note: cons.note },
    { label: 'Save rate', value: percent(m?.saveRate), note: 'Of reach' },
    { label: 'Share rate', value: percent(m?.shareRate), note: 'Of reach' },
  ];

  return (
    <div>
      <PageHead
        eyebrow={t.eyebrow}
        title={t.title}
        aside={m ? `Updated ${shortDate(m.computedAt)}` : undefined}
      />

      <div className="mb-6 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((s) => (
          <div key={s.label} className="min-w-0 bg-card p-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.11em] text-faint">{s.label}</div>
            <div className="mt-2 text-[22px] font-semibold tracking-[-0.03em] tabular-nums">{s.value}</div>
            <div className="mt-0.5 text-[12px] text-gray">{s.note}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card title={t.reviewsTitle}>
          {perf.reviews.length === 0 ? (
            <Empty>{t.reviewsEmpty}</Empty>
          ) : (
            <ol className="divide-y divide-pill">
              {perf.reviews.map((r) => (
                <li key={r.at + r.change} className="grid grid-cols-[72px_1fr] gap-3 px-4 py-3.5">
                  <span className="font-mono text-[10px] uppercase text-faint">
                    {new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(new Date(r.at))}
                  </span>
                  <div>
                    <div className="text-[14px] font-medium">{r.change}</div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-gray">{r.reason}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {perf.reviews.length > 0 && perf.completedCampaigns < 3 ? (
            <p className="border-t border-pill px-4 py-3 text-[12px] text-gray">{t.reviewsEmpty}</p>
          ) : null}
        </Card>

        <Card title={t.audienceTitle}>
          {insights.connected && insights.audience.available ? (
            <div className="grid gap-6 px-4 py-4 sm:grid-cols-2">
              <AudienceBars title="Age" buckets={insights.audience.age} />
              <AudienceBars title="Gender" buckets={insights.audience.gender} />
              <AudienceBars title="Top cities" buckets={insights.audience.cities.slice(0, 5)} />
              <AudienceBars title="Top countries" buckets={insights.audience.countries.slice(0, 3)} />
            </div>
          ) : (
            <Empty>{copy.insights.audienceUnavailable}</Empty>
          )}
        </Card>
      </div>

      {insights.connected ? (
        <>
          <Card title={t.reelsTitle} className="mb-6">
            <ReelTable reels={insights.reels.slice(0, 12)} />
          </Card>
          <Card title={t.trendTitle}>
            <FollowerTrend points={insights.followerTrend} />
          </Card>
        </>
      ) : null}
    </div>
  );
}
