import type { Metadata } from 'next';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin/server';
import type { CreatorProfile } from '@/lib/admin/types';
import { ago, bps, cpm, humanize, initials, pct, rupees, shortDate, views } from '@/lib/admin/format';
import { ActionButton } from '@/components/admin/ActionButton';
import { RateForm } from '@/components/admin/RateForm';
import { SYNC_STATUS } from '@/components/admin/status';
import { Avatar, Bar, Empty, InkPanel, InkRow, KpiStrip, Micro, Panel, Tag } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Creator' };

const AGE_ORDER = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

export default async function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await adminFetch<CreatorProfile>(`/creators/${id}`);
  const m = c.metrics;
  const a = c.audience;
  const sync = SYNC_STATUS[c.syncHealth];
  const proposal = c.pricing.proposal;
  const maxReel = Math.max(1, ...c.reels.map((r) => r.views ?? 0));

  // Every bar here is a real synced metric, scaled against a stated range.
  const quality: { label: string; value: string; fill: number | null; bench: string }[] = [
    { label: 'Save rate', value: pct(m?.saveRate), fill: m?.saveRate === null || !m ? null : m.saveRate! / 0.08, bench: 'Saves ÷ reach, 90 days · bar scale 0–8%' },
    { label: 'Share rate', value: pct(m?.shareRate), fill: m?.shareRate === null || !m ? null : m.shareRate! / 0.05, bench: 'Shares ÷ reach, 90 days · bar scale 0–5%' },
    { label: 'Engagement rate', value: pct(m?.engagementRate), fill: m?.engagementRate === null || !m ? null : m.engagementRate! / 0.2, bench: 'All interactions ÷ reach · bar scale 0–20%' },
    { label: 'Consistency', value: m?.consistencyScore === null || !m ? '—' : m.consistencyScore!.toFixed(2), fill: m?.consistencyScore ?? null, bench: '1 − variation across last 12 Reels' },
    { label: 'View-to-follower', value: m?.viewFollowerRatio === null || !m ? '—' : m.viewFollowerRatio!.toFixed(2), fill: m?.viewFollowerRatio === null || !m ? null : m.viewFollowerRatio! / 1.5, bench: 'Median Reel views ÷ followers · bar scale 0–1.5' },
    { label: 'India audience', value: pct(a?.indiaShare ?? null, 0), fill: a?.indiaShare ?? null, bench: 'Payable geography for current briefs' },
  ];

  const ages = a ? AGE_ORDER.filter((b) => a.age[b] !== undefined).map((b) => ({ band: b, share: a.age[b] })) : [];

  return (
    <div>
      <Link
        href="/admin/creators"
        className="mb-4 inline-flex h-[34px] items-center border border-field bg-card px-3.5 font-mono text-[10px] uppercase tracking-[0.08em] text-gray hover:border-ink hover:text-ink"
      >
        ← All creators
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-center gap-4">
          <Avatar text={initials(c.name)} size={56} />
          <div>
            <h1 className="text-[26px] font-semibold tracking-[-0.03em]">{c.name ?? 'Creator'}</h1>
            <div className="mt-[3px] font-mono text-[11.5px] uppercase text-[#888888]">
              @{c.handle ?? '—'} · {c.categories.map((x) => x.displayName).join(' · ') || '—'} · {c.city ?? '—'} · joined {shortDate(c.joinedAt)}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {c.status === 'SUSPENDED' ? <Tag tone="danger" className="px-2 py-1.5">Suspended</Tag> : null}
          <Tag tone={sync.tone} className="px-2 py-1.5">{sync.label}</Tag>
          <ActionButton path={`/creators/${c.id}/resync`}>Re-sync</ActionButton>
          {c.status === 'SUSPENDED' ? (
            <ActionButton path={`/creators/${c.id}/reinstate`} confirm="Reinstate this creator?">Reinstate</ActionButton>
          ) : (
            <ActionButton path={`/creators/${c.id}/suspend`} kind="danger" prompt={{ label: 'Reason for suspending', field: 'reason' }}>
              Suspend
            </ActionButton>
          )}
        </div>
      </div>

      {c.lastSyncError ? (
        <p className="mb-4 border border-danger px-3 py-2 text-[12.5px] text-danger">Last sync failed: {c.lastSyncError}</p>
      ) : null}

      <KpiStrip
        items={[
          { label: 'Followers', value: views(m?.followersCount), note: c.followerGrowth90d === null ? 'Growth needs 2+ syncs' : `${c.followerGrowth90d >= 0 ? '+' : ''}${pct(c.followerGrowth90d)} / 90d` },
          { label: 'Median Reel views', value: views(m?.medianReelViews), note: m?.viewFollowerRatio !== null && m ? `${m.viewFollowerRatio!.toFixed(2)} view-to-follower` : undefined },
          { label: 'Save rate', value: pct(m?.saveRate), note: m?.sampleMediaCount ? `Over ${m.sampleMediaCount} Reels` : undefined },
          { label: 'Share rate', value: pct(m?.shareRate), note: 'Shares ÷ reach' },
          { label: 'Campaigns', value: c.reliability.campaigns, note: c.reliability.campaigns ? `${c.reliability.completed} completed` : 'None yet' },
          { label: 'Paid to date', value: rupees(c.paidToDateMinor), note: 'Gross of TDS' },
        ]}
      />

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Panel title="Audience quality" pad>
          <div className="flex flex-col gap-3">
            {quality.map((q) => (
              <div key={q.label}>
                <div className="mb-[5px] flex justify-between text-[12.5px]">
                  <span>{q.label}</span>
                  <span className="tabular font-mono">{q.value}</span>
                </div>
                <Bar value={q.fill} />
                <div className="mt-[3px] font-mono text-[9px] uppercase text-faint">{q.bench}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Demography" aside={a ? `Captured ${shortDate(a.capturedAt)}` : undefined} pad>
          {!a ? (
            <p className="text-[12.5px] text-gray">Instagram withholds follower demographics below 100 followers, or the first sync hasn&apos;t landed.</p>
          ) : (
            <>
              <Micro className="mb-2 block text-hush">Age</Micro>
              <div className="mb-4 flex flex-col gap-[9px]">
                {ages.map((x) => (
                  <div key={x.band} className="flex items-center gap-[9px]">
                    <span className="min-w-[42px] font-mono text-[10px] text-gray">{x.band.replace('-', '–')}</span>
                    <div className="h-3.5 flex-1 bg-pill"><div className="h-3.5 bg-ink" style={{ width: `${Math.min(100, x.share * 100)}%` }} /></div>
                    <span className="tabular min-w-[34px] text-right font-mono text-[10px] text-gray">{pct(x.share, 0)}</span>
                  </div>
                ))}
              </div>
              <div className="mb-4 flex h-3.5 gap-px" aria-label="Gender split">
                <div className="bg-ink" style={{ width: `${(a.gender.F ?? 0) * 100}%` }} />
                <div className="bg-lime" style={{ width: `${(a.gender.M ?? 0) * 100}%` }} />
                <div className="bg-hush" style={{ width: `${(a.gender.U ?? 0) * 100}%` }} />
              </div>
              <div className="mb-4 flex flex-wrap gap-3.5 font-mono text-[9px] text-faint">
                <span className="flex items-center gap-[5px]"><span className="h-2 w-2 bg-ink" />WOMEN {pct(a.gender.F ?? 0, 0)}</span>
                <span className="flex items-center gap-[5px]"><span className="h-2 w-2 bg-lime" />MEN {pct(a.gender.M ?? 0, 0)}</span>
                {a.gender.U ? <span className="flex items-center gap-[5px]"><span className="h-2 w-2 bg-hush" />UNSPECIFIED {pct(a.gender.U, 0)}</span> : null}
              </div>
              <Micro className="mb-2 block text-hush">Top cities</Micro>
              <div className="flex flex-col gap-2">
                {a.cities.slice(0, 5).map((x) => (
                  <div key={x.bucket} className="flex justify-between text-[12px]">
                    <span className="truncate">{x.bucket.split(',')[0]}</span>
                    <span className="tabular font-mono text-gray">{pct(x.share, 0)}</span>
                  </div>
                ))}
              </div>
              {a.countries.length ? (
                <div className="mt-3 font-mono text-[9.5px] uppercase text-faint">
                  {a.countries.slice(0, 3).map((x) => `${countryNames.of(x.bucket) ?? x.bucket} ${pct(x.share, 0)}`).join(' · ')}
                </div>
              ) : null}
            </>
          )}
        </Panel>

        <div className="flex flex-col gap-5">
          <InkPanel title="Pricing · internal">
            <div className="flex flex-col gap-2.5">
              <InkRow label="Current CPM" value={cpm(c.pricing.cpmMinor)} tone="lime" />
              <InkRow
                label="Model proposes"
                value={proposal ? `${cpm(proposal.proposal.proposedCpmMinor)}${proposal.due ? ' · review due' : ''}` : '—'}
              />
              <InkRow label="List brand price / 1K" value={cpm(c.pricing.typicalBrandPricePer1kMinor)} />
              <InkRow label="Blended margin on their rows" value={bps(c.pricing.blendedMarginBps)} />
            </div>
            {proposal ? (
              <div className="mt-3.5 border-t border-ink-3 pt-3">
                <div className="mb-2 text-[11.5px] text-faint">{proposal.proposal.drivers.join(' · ')}</div>
                <div className="[&_button]:border-[#333333] [&_button]:bg-transparent [&_button]:text-paper-dim [&_input]:bg-ink-2 [&_input]:text-paper">
                  <RateForm creatorId={c.id} proposedMinor={proposal.proposal.proposedCpmMinor} currentMinor={c.pricing.cpmMinor} compact />
                </div>
              </div>
            ) : null}
          </InkPanel>
          <Panel title="Reliability" pad className="flex-1">
            <div className="flex flex-col gap-[9px] text-[12.5px]">
              {[
                ['Campaigns completed', `${c.reliability.completed} / ${c.reliability.campaigns}`],
                ['Withdrawn / cancelled', String(c.reliability.cancelled)],
                ['Draft rounds, avg', c.reliability.avgReviewRounds === null ? '—' : c.reliability.avgReviewRounds.toFixed(1)],
                ['Payouts on hold', String(c.reliability.payoutsOnHold)],
                ['Brand safety review', humanize(c.brandSafetyStatus)],
                ['Instagram token', c.instagram?.tokenExpiresAt ? `Valid to ${shortDate(c.instagram.tokenExpiresAt)}` : '—'],
                ['Last sync', ago(c.instagram?.lastSyncAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <span className="text-gray">{k}</span>
                  <span className="tabular font-mono text-[12px]">{v}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="Campaign history">
          {c.history.length === 0 ? (
            <Empty>No campaigns yet</Empty>
          ) : (
            <>
              <div className="hidden grid-cols-[1.6fr_.8fr_.7fr_.9fr_.8fr] gap-[11px] border-b border-line px-4 py-2.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-faint md:grid">
                <span>Campaign</span><span>Views</span><span>Vs cap</span><span>Payout</span><span>Status</span>
              </div>
              {c.history.map((h) => (
                <div key={h.participationId} className="grid grid-cols-2 items-center gap-[11px] border-b border-pill px-4 py-[11px] last:border-0 md:grid-cols-[1.6fr_.8fr_.7fr_.9fr_.8fr]">
                  <Link href={`/admin/campaigns/${h.campaign.id}`} className="hover:opacity-70">
                    <div className="text-[12.5px] font-medium">{h.campaign.name}</div>
                    <div className="font-mono text-[9.5px] uppercase text-faint">{h.campaign.brand.name} · {shortDate(h.campaign.liveFrom)}</div>
                  </Link>
                  <span className="tabular font-mono text-[12px]">{views(h.views)}</span>
                  <span className={`tabular font-mono text-[12px] ${h.capUtilisation >= 0.95 ? 'text-ink' : 'text-gray'}`}>{pct(h.capUtilisation, 0)}</span>
                  <span className="tabular font-mono text-[12px]">{rupees(h.payoutMinor)}</span>
                  <span className="font-mono text-[10px] uppercase text-gray">{humanize(h.payoutStatus ?? h.state)}</span>
                </div>
              ))}
            </>
          )}
        </Panel>
        <Panel title={`Views per Reel · last ${c.reels.length}`} aside={`Median ${views(m?.medianReelViews)}`} pad>
          {c.reels.length === 0 ? (
            <p className="text-[12.5px] text-gray">No Reels synced yet.</p>
          ) : (
            <>
              <div className="mb-3.5 flex h-[110px] items-end gap-[5px]">
                {c.reels.map((r) => {
                  const v = r.views ?? 0;
                  return (
                    <a
                      key={r.id}
                      href={r.permalink ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${shortDate(r.postedAt)} · ${views(v)} views`}
                      className={`flex-1 ${v === maxReel ? 'bg-lime' : 'bg-ink'} hover:opacity-70`}
                      style={{ height: `${Math.max(3, (v / maxReel) * 100)}%` }}
                    />
                  );
                })}
              </div>
              <div className="border border-pill bg-paper px-3.5 py-3 text-[12.5px] leading-relaxed text-gray">
                {m?.consistencyScore !== null && m
                  ? `Consistency ${m.consistencyScore!.toFixed(2)} across the last ${m.sampleMediaCount ?? c.reels.length} Reels — ${
                      m.consistencyScore! >= 0.75 ? 'low variance, dependable reach per post.' : m.consistencyScore! >= 0.5 ? 'moderate variance; plan caps conservatively.' : 'high variance — one post can swing delivery.'
                    }`
                  : 'Not enough Reels for a consistency score yet (needs 4).'}
              </div>
            </>
          )}
        </Panel>
      </div>

      {c.pricing.history.length ? (
        <Panel title="Rate history" className="mt-5">
          {c.pricing.history.map((h) => (
            <div key={h.effectiveFrom} className="flex flex-wrap justify-between gap-3 border-b border-pill px-4 py-2.5 text-[12.5px] last:border-0">
              <span className="font-mono">{h.previousCpmMinor ? `${cpm(h.previousCpmMinor)} → ` : ''}{cpm(h.cpmMinor)}</span>
              <span className="text-gray">{humanize(h.reason)}{h.note ? ` · ${h.note}` : ''}</span>
              <span className="font-mono text-[10px] text-faint">{shortDate(h.effectiveFrom)}</span>
            </div>
          ))}
        </Panel>
      ) : null}
    </div>
  );
}
