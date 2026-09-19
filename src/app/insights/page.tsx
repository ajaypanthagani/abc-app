import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStep } from '@/lib/onboarding';
import { getInsights } from '@/lib/api/server';
import { compactNumber, formatNumber, relativeTime } from '@/lib/format';
import { copy } from '@/lib/copy';
import { Micro } from '@/components/ui/Micro';
import { StatTile } from '@/components/ui/StatTile';
import { Wordmark } from '@/components/ui/Wordmark';
import { AudienceBars } from '@/components/insights/AudienceBars';
import { FollowerTrend } from '@/components/insights/FollowerTrend';
import { ReelTable } from '@/components/insights/ReelTable';

export const metadata: Metadata = { title: 'Insights' };

// Rates arrive as fractions (0.0182 -> "1.8%").
function percent(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return '—';
  return `${(rate * 100).toFixed(1)}%`;
}

export default async function InsightsPage() {
  await requireStep('complete');
  const insights = await getInsights();

  if (!insights.connected) {
    return (
      <Shell>
        <p className="mt-10 text-[15px] leading-relaxed text-fg-muted">{copy.insights.notConnected}</p>
      </Shell>
    );
  }

  const { summary, audience, reels, followerTrend } = insights;
  const hasAudience = audience.available;

  return (
    <Shell>
      <section className="mt-10">
        <Micro>{copy.insights.eyebrow}</Micro>
        <h1 className="mt-3 text-[34px] font-medium leading-tight tracking-[-0.03em] text-fg">
          {copy.insights.title}
        </h1>
        <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-fg-muted">{copy.insights.sub}</p>
        {insights.lastSyncAt ? (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-micro text-fg-muted">
            Last sync {relativeTime(insights.lastSyncAt)} · @{insights.username}
          </p>
        ) : null}
      </section>

      <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3" aria-label={copy.insights.summaryTitle}>
        <StatTile
          label={copy.insights.statMedian}
          value={compactNumber(summary?.medianReelViews)}
          footnote={summary?.sampleMediaCount ? `Last ${summary.sampleMediaCount} Reels` : undefined}
        />
        <StatTile label={copy.insights.statMean} value={compactNumber(summary?.meanReelViews)} />
        <StatTile label={copy.insights.statFollowers} value={formatNumber(summary?.followersCount)} />
        <StatTile label={copy.insights.statSaveRate} value={percent(summary?.saveRate)} />
        <StatTile label={copy.insights.statShareRate} value={percent(summary?.shareRate)} />
        <StatTile label={copy.insights.statEngagement} value={percent(summary?.engagementRate)} />
      </section>

      <Card title={copy.insights.reelsTitle} sub={copy.insights.reelsSub}>
        <ReelTable reels={reels} />
      </Card>

      <Card title={copy.insights.audienceTitle} sub={copy.insights.audienceSub}>
        {hasAudience ? (
          <div className="grid gap-8 px-5 py-5 md:grid-cols-2">
            <AudienceBars title={copy.insights.audienceAge} buckets={audience.age} />
            <AudienceBars title={copy.insights.audienceGender} buckets={audience.gender} />
            <AudienceBars title={copy.insights.audienceCities} buckets={audience.cities} />
            <AudienceBars title={copy.insights.audienceCountries} buckets={audience.countries} />
          </div>
        ) : (
          <p className="px-5 py-6 text-[14px] leading-relaxed text-fg-muted">
            {copy.insights.audienceUnavailable}
          </p>
        )}
      </Card>

      <Card title={copy.insights.trendTitle} sub={copy.insights.trendSub}>
        <FollowerTrend points={followerTrend} />
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[860px] px-5 pb-16">
      <header className="flex items-center justify-between border-b border-edge py-5">
        <Wordmark />
        <Link
          href="/network"
          className="font-mono text-[11px] uppercase tracking-micro text-fg underline underline-offset-4"
        >
          {copy.insights.back}
        </Link>
      </header>
      {children}
    </div>
  );
}

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded border border-edge bg-card">
      <div className="border-b border-edge px-5 py-3">
        <Micro>{title}</Micro>
        <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-fg-muted">{sub}</p>
      </div>
      {children}
    </section>
  );
}
