import type { Metadata } from 'next';
import { getMyCampaigns } from '@/lib/api/server';
import type { CreatorCampaign } from '@/lib/api/types';
import { copy } from '@/lib/copy';
import { compactNumber, percent, rupees, shortDate, windowRange } from '@/lib/format';
import { Card, Empty, PageHead, StatusTag } from '@/components/dashboard/ui';

export const metadata: Metadata = { title: 'Campaigns' };

function payoutText(c: CreatorCampaign): string {
  if (!c.payout) return `Up to ${rupees(c.maxPayoutMinor)}`;
  return c.payout.kind === 'final' ? rupees(c.payout.netMinor) : rupees(c.payout.grossMinor);
}

function dateText(c: CreatorCampaign): string {
  if (c.state === 'COMPLETED' && c.payout?.kind === 'final' && c.payout.paidAt) return `Paid ${shortDate(c.payout.paidAt)}`;
  if (c.publishedAt) return `Posted ${shortDate(c.publishedAt)}${c.measurementEndsAt ? ` · measured until ${shortDate(c.measurementEndsAt)}` : ''}`;
  return `Live window ${windowRange(c.campaign.liveFrom, c.campaign.liveTo)}`;
}

export default async function CampaignsPage() {
  const data = await getMyCampaigns();
  const t = copy.dashboard.campaigns;
  const f = data.featured;

  return (
    <div>
      <PageHead eyebrow={t.eyebrow} title={t.title(data.activeCount, data.completedCount)} />

      {f ? (
        <Card className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4">
            <div className="min-w-0">
              <div className="text-[16px] font-semibold tracking-[-0.01em]">{f.campaign.name}</div>
              <div className="mt-0.5 text-[12.5px] text-gray">
                {f.campaign.brand} · {f.deliverables ?? '—'} · {dateText(f)}
              </div>
            </div>
            <StatusTag tone={f.stage.tone}>{f.stage.label}</StatusTag>
          </div>

          <ol className="mt-5 grid grid-cols-7 gap-1 px-4" aria-label="Campaign progress">
            {data.pipeline.map((step, i) => {
              const done = i <= f.stage.index;
              const current = i === f.stage.index;
              return (
                <li key={step} className="min-w-0" aria-current={current ? 'step' : undefined}>
                  <div className={`h-1 ${current ? 'bg-lime' : done ? 'bg-ink' : 'bg-line'}`} />
                  <div className={`mt-1.5 truncate font-mono text-[8.5px] uppercase tracking-[0.06em] ${done ? 'text-ink' : 'text-hush'}`}>{step}</div>
                </li>
              );
            })}
          </ol>
          <p className="px-4 pt-3 text-[13px] text-ink">{f.stage.next}</p>

          <div className="mt-4 grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
            {[
              [t.eligibleViews, f.eligibleViews === null ? '—' : compactNumber(f.eligibleViews)],
              [t.ofCap, f.capShare === null ? '—' : percent(f.capShare, 0)],
              [t.accrued, f.payout ? payoutText(f) : '—'],
              [t.daysLeft, f.daysLeft === null ? '—' : String(f.daysLeft)],
            ].map(([label, value]) => (
              <div key={label} className="bg-card px-4 py-3">
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">{label}</div>
                <div className="mt-1 text-[19px] font-semibold tracking-[-0.02em] tabular-nums">{value}</div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card title={t.allTitle}>
        {data.rows.length === 0 ? (
          <Empty>{t.empty}</Empty>
        ) : (
          <ul className="divide-y divide-pill">
            {data.rows.map((c) => (
              <li key={c.id} id={c.id} className="scroll-mt-6">
                <details className="group">
                  <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3.5 sm:grid-cols-[1fr_110px_120px_150px] [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium">{c.campaign.name}</div>
                      <div className="truncate font-mono text-[10px] uppercase text-gray">{c.campaign.brand} · {dateText(c)}</div>
                    </div>
                    <span className="hidden text-right font-mono text-[12.5px] tabular-nums sm:block">
                      {c.eligibleViews === null ? '—' : compactNumber(c.eligibleViews)}
                    </span>
                    <span className="text-right font-mono text-[12.5px] font-semibold tabular-nums">{payoutText(c)}</span>
                    <span className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
                      <StatusTag tone={c.stage.tone}>{c.stage.label}</StatusTag>
                      <span className="text-gray transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                    </span>
                  </summary>
                  <div className="grid gap-4 border-t border-pill bg-paper px-4 py-4 text-[13.5px] leading-relaxed sm:grid-cols-[1.4fr_1fr]">
                    <div>
                      <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">{t.brief}</div>
                      <p className="whitespace-pre-line">{c.campaign.brief ?? '—'}</p>
                      {c.campaign.formats.some((x) => x.requirements || x.referenceUrls.length) ? (
                        <ul className="mt-3 space-y-1.5">
                          {c.campaign.formats.map((x) => (
                            <li key={x.format}>
                              <span className="font-medium">{x.format}:</span> {x.requirements ?? '—'}
                              {x.referenceUrls.map((u, i) => (
                                <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="ml-2 font-mono text-[11px] underline underline-offset-2">
                                  {t.references} {i + 1} ↗
                                </a>
                              ))}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <dl className="space-y-2">
                      {[
                        [t.deliverables, c.deliverables ?? '—'],
                        [t.liveWindow, windowRange(c.campaign.liveFrom, c.campaign.liveTo)],
                        ...(c.campaign.sampling ? [[t.sampling, c.campaign.sampling]] : []),
                        [t.maxPayout, `${rupees(c.maxPayoutMinor)} · cap ${compactNumber(c.payableViewsCap)} views`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 border-b border-line pb-2 last:border-0">
                          <dt className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint">{k}</dt>
                          <dd className="text-right">{v}</dd>
                        </div>
                      ))}
                      <p className="pt-1 text-[12px] text-gray">{t.measurement(c.campaign.measurementDays)}</p>
                      {c.posts.map((p) =>
                        p.permalink ? (
                          <a key={p.permalink} href={p.permalink} target="_blank" rel="noopener noreferrer" className="block font-mono text-[11px] underline underline-offset-2">
                            Your {p.format.toLowerCase()} · {p.views === null ? 'awaiting sync' : `${compactNumber(p.views)} views`} ↗
                          </a>
                        ) : null,
                      )}
                    </dl>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
