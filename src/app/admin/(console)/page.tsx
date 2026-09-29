import Link from 'next/link';
import { adminFetch } from '@/lib/admin/server';
import type { Overview } from '@/lib/admin/types';
import { ago, bps, rupees, rupeesShort } from '@/lib/admin/format';
import { InkPanel, InkRow, KpiStrip, Panel, SectionTitle, Tag } from '@/components/admin/ui';

const TAG_TONE: Record<string, 'ink' | 'danger' | 'soft'> = { MARGIN: 'ink', HOLD: 'danger', OVERDUE: 'danger', SYNC: 'soft' };

export default async function OverviewPage() {
  const o = await adminFetch<Overview>('/overview');
  const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(o.asOf));
  const healthy = o.pipeline.failedRuns24h === 0 && o.pipeline.lastRunStatus !== 'FAILED';
  const k = o.kpis;
  const e = o.economics;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-[7px] font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Overview</div>
          <h1 className="text-[28px] font-semibold tracking-[-0.03em]">{today}</h1>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase text-gray">
          <span
            className={`h-[7px] w-[7px] rounded-full ${healthy ? 'bg-lime motion-safe:animate-[abcPulse_2s_infinite]' : 'bg-danger'}`}
            aria-hidden="true"
          />
          {healthy ? 'Meta sync healthy' : `${o.pipeline.failedRuns24h} failed sync runs in 24h`} · last run {ago(o.pipeline.lastRunAt)}
        </div>
      </div>

      <KpiStrip
        items={[
          { label: 'Live campaigns', value: k.liveCampaigns, note: `${k.measuring} in measurement` },
          { label: 'Creators active', value: k.creatorsActive.toLocaleString('en-IN'), note: `+${k.creatorsNewThisWeek} this week` },
          { label: 'Brands', value: k.brands, note: `${k.invitesPending} invites pending` },
          { label: 'Billings MTD', value: rupeesShort(k.billingsMonthMinor), note: 'Invoiced ex-GST' },
          { label: 'Payout liability', value: rupeesShort(k.payoutLiabilityMinor), note: 'Accrued to creators' },
          { label: 'Gross margin', value: bps(k.grossMarginBps), note: 'MTD, accepted quotes' },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <SectionTitle aside="Oldest first">Work queues</SectionTitle>
          <div className="border border-line bg-card">
            {o.queues.map((q) => (
              <Link
                key={q.key}
                href={q.href}
                className="flex w-full items-center gap-[13px] border-b border-pill px-4 py-[13px] last:border-0 hover:bg-paper"
              >
                <span className={`tabular min-w-[30px] font-mono text-[13px] font-semibold ${q.hot ? 'text-danger' : 'text-ink'}`}>
                  {q.count}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium text-ink">{q.label}</div>
                  <div className="truncate text-[12px] text-[#888888]">{q.detail}</div>
                </div>
                <span className={`font-mono text-[9.5px] uppercase tracking-[0.08em] ${q.hot ? 'text-danger' : 'text-faint'}`}>
                  {q.since ? ago(q.since) : '→'}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle aside="Internal">This month&apos;s economics</SectionTitle>
          <InkPanel title="Month to date">
            <div className="flex flex-col gap-[13px]">
              <InkRow label="Brand billings (invoiced)" value={rupees(e.billingsMonthMinor)} />
              <InkRow label="Creator payouts accrued" value={rupees(e.payoutsAccruedMinor)} />
              <InkRow
                label="Gross margin, accepted quotes"
                value={
                  e.acceptedMonthSubtotalMinor
                    ? `${rupees(e.acceptedMonthSubtotalMinor - e.acceptedMonthPayoutMinor)} · ${bps(e.grossMarginBps)}`
                    : '—'
                }
                tone="lime"
              />
              <InkRow label="Deposits held" value={rupees(e.depositsHeldMinor)} />
              <InkRow
                label="Overdue receivables"
                value={e.overdueMinor ? `${rupees(e.overdueMinor)} · ${e.overdueBrands} brand${e.overdueBrands === 1 ? '' : 's'}` : '—'}
                tone={e.overdueMinor ? 'danger' : undefined}
              />
            </div>
            <p className="mt-3.5 font-mono text-[9.5px] tracking-[0.06em] text-[#555555]">
              MARGIN = QUOTE SUBTOTAL − CREATOR PAYOUTS AT CAP, ACCEPTED THIS MONTH
            </p>
          </InkPanel>

          <Panel title="Alerts" className="mt-3.5">
            {o.alerts.length === 0 ? (
              <div className="px-4 py-3 text-[13px] text-gray">Nothing needs attention.</div>
            ) : (
              o.alerts.map((a, i) => (
                <Link key={i} href={a.href} className="flex items-start gap-[11px] border-b border-pill px-4 py-3 last:border-0 hover:bg-paper">
                  <Tag tone={TAG_TONE[a.tag] ?? 'soft'} className="mt-px flex-none">{a.tag}</Tag>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium">{a.title}</div>
                    <div className="text-[12px] text-[#888888]">{a.detail}</div>
                  </div>
                </Link>
              ))
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
