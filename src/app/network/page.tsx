import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStep } from '@/lib/onboarding';
import { apiFetch, getCreator } from '@/lib/api/server';
import type { ConnectionHealth } from '@/lib/api/types';
import { compactNumber, formatDate, formatNumber, relativeTime } from '@/lib/format';
import { copy } from '@/lib/copy';
import { Banner } from '@/components/ui/Banner';
import { InstagramConnectButton } from '@/components/onboarding/InstagramConnectButton';
import { Micro } from '@/components/ui/Micro';
import { Wordmark } from '@/components/ui/Wordmark';
import { Pill } from '@/components/ui/Pill';
import { StatTile } from '@/components/ui/StatTile';
import { ResyncButton } from '@/components/network/ResyncButton';
import { SignOutButton } from '@/components/network/SignOutButton';

export const metadata: Metadata = { title: 'Network' };

export default async function NetworkPage() {
  await requireStep('complete');
  const [creator, connection] = await Promise.all([
    getCreator(),
    apiFetch<ConnectionHealth>('/v1/creators/me/instagram/connection'),
  ]);

  const connectionHealthy = connection.status === 'ACTIVE';
  const labelFor = (slugs: string[], list: 'categories' | 'exclusions') =>
    slugs.length === 0 ? (list === 'exclusions' ? 'None' : '—') : slugs.map(prettySlug).join(' · ');

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-5 pb-16">
      <header className="flex items-center justify-between border-b border-edge py-5">
        <Wordmark />
        <SignOutButton />
      </header>

      {!connectionHealthy ? (
        <div className="mt-6">
          <Banner
            action={
              <InstagramConnectButton variant="lime" className="min-h-9 px-4 text-[13px]">
                {copy.banner.reconnectCta}
              </InstagramConnectButton>
            }
          >
            {copy.banner.reconnect}
          </Banner>
        </div>
      ) : null}

      <section className="mt-10">
        <Micro>{copy.network.eyebrow}</Micro>
        <h1 className="mt-3 text-[34px] font-medium leading-tight tracking-[-0.03em] text-fg">
          {copy.network.title}
        </h1>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-fg-muted">{copy.network.sub}</p>
      </section>

      <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3" aria-label="Your Instagram numbers">
        <StatTile
          label={copy.network.statMedian}
          value={compactNumber(creator.metrics?.medianReelViews)}
          footnote={creator.metrics?.sampleMediaCount ? `Last ${creator.metrics.sampleMediaCount} Reels` : undefined}
        />
        <StatTile label={copy.network.statFollowers} value={formatNumber(creator.metrics?.followersCount)} />
        <StatTile
          label={copy.network.statReels}
          value={creator.metrics ? 'Synced' : 'Importing…'}
          footnote={creator.instagram?.lastSyncAt ? `Updated ${relativeTime(creator.instagram.lastSyncAt)}` : undefined}
        />
      </section>

      <section className="mt-8 rounded border border-edge bg-card">
        <div className="flex items-center justify-between gap-4 border-b border-edge px-5 py-3">
          <Micro>{copy.network.insightsTitle}</Micro>
          <Link
            href="/insights"
            className="shrink-0 font-mono text-[11px] uppercase tracking-micro text-fg underline underline-offset-4"
          >
            {copy.network.insightsCta}
          </Link>
        </div>
        <p className="px-5 py-4 text-[14px] leading-relaxed text-fg-muted">{copy.network.insightsBody}</p>
      </section>

      <section className="mt-6 rounded border border-edge bg-card">
        <div className="border-b border-edge px-5 py-3">
          <Micro>{copy.network.howPaidTitle}</Micro>
        </div>
        <div className="space-y-3 px-5 py-4">
          {copy.network.howPaid.map((line) => (
            <p key={line} className="text-[14px] leading-relaxed text-fg">
              {line}
            </p>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded border border-edge bg-card">
        <div className="flex items-center justify-between border-b border-edge px-5 py-3">
          <Micro>{copy.network.profileTitle}</Micro>
          <Link
            href="/profile"
            className="font-mono text-[11px] uppercase tracking-micro text-fg underline underline-offset-4"
          >
            {copy.network.editProfile}
          </Link>
        </div>
        <dl className="divide-y divide-line">
          <ProfileRow
            label="Categories"
            value={
              creator.categories.length === 0
                ? '—'
                : creator.categories
                    .map((c) => (c === 'other' ? creator.categoriesOtherText ?? 'Other' : prettySlug(c)))
                    .join(' · ')
            }
          />
          <ProfileRow
            label="City"
            value={
              creator.city?.slug === 'other'
                ? creator.cityOtherText ?? creator.city.displayName
                : creator.city?.displayName ?? '—'
            }
          />
          <ProfileRow
            label="Languages"
            value={
              creator.languages
                .map((l) => (l === 'other' ? creator.languagesOtherText ?? 'Other' : l.toUpperCase()))
                .join(' · ') || '—'
            }
          />
          <ProfileRow label="Won't promote" value={labelFor(creator.exclusions, 'exclusions')} />
        </dl>
      </section>

      <section className="mt-6 rounded border border-edge bg-card">
        <div className="flex items-center justify-between border-b border-edge px-5 py-3">
          <Micro>{copy.network.connectionTitle}</Micro>
          <Pill tone={connectionHealthy ? 'lime' : 'warning'}>
            {connectionHealthy ? 'Healthy' : connection.status.replace('_', ' ')}
          </Pill>
        </div>
        <dl className="divide-y divide-line">
          <ProfileRow label="Account" value={connection.igUsername ? `@${connection.igUsername}` : '—'} />
          <ProfileRow label="Last sync" value={relativeTime(connection.lastSyncAt)} />
          <ProfileRow label="Token valid until" value={formatDate(connection.tokenValidUntil)} />
          <ProfileRow label="Weekly snapshots" value={String(connection.snapshotsStored ?? 0)} />
        </dl>
        <div className="border-t border-edge px-5 py-3">
          <ResyncButton />
        </div>
      </section>

      <section className="mt-10 border-t border-edge pt-6">
        <Micro>{copy.network.nextTitle}</Micro>
        <p className="mt-2 max-w-[56ch] text-[14px] leading-relaxed text-fg-muted">{copy.network.next}</p>
      </section>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 px-5 py-3">
      <dt className="shrink-0 font-mono text-[10px] uppercase tracking-micro text-fg-muted">{label}</dt>
      <dd className="text-right text-[14px] text-fg">{value}</dd>
    </div>
  );
}

function prettySlug(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}
