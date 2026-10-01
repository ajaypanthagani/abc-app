import type { Metadata } from 'next';
import { getPayments } from '@/lib/api/server';
import { copy } from '@/lib/copy';
import { compactNumber, rupees, shortDate } from '@/lib/format';
import { Card, Empty, PageHead, StatusTag } from '@/components/dashboard/ui';

export const metadata: Metadata = { title: 'Payments' };

export default async function PaymentsPage() {
  const data = await getPayments();
  const t = copy.dashboard.payments;
  const s = data.stats;

  return (
    <div>
      <PageHead eyebrow={t.eyebrow} title={s.clearingMinor ? t.title(rupees(s.clearingMinor)) : t.titleNone} />

      <div className="mb-6 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-3">
        {[
          { label: t.statClearing, value: rupees(s.clearingMinor), note: s.clearingCount ? `${s.clearingCount} in progress · ${t.statClearingNote.toLowerCase()}` : t.statClearingNote },
          { label: t.statPaidFy(s.fyStartYear), value: rupees(s.paidFyMinor), note: s.tdsFyMinor ? `${rupees(s.tdsFyMinor)} TDS withheld` : 'Since 1 April' },
          { label: t.statAvg, value: rupees(s.avgPerCampaignMinor), note: s.avgSample ? `Last ${s.avgSample} paid campaign${s.avgSample === 1 ? '' : 's'}` : 'After your first payout' },
        ].map((x) => (
          <div key={x.label} className="bg-card p-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.11em] text-faint">{x.label}</div>
            <div className="mt-2 text-[22px] font-semibold tracking-[-0.03em] tabular-nums">{x.value}</div>
            <div className="mt-0.5 text-[12px] text-gray">{x.note}</div>
          </div>
        ))}
      </div>

      <Card className="mb-6">
        <div className="hidden grid-cols-[1fr_110px_120px_130px] gap-4 border-b border-line px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-faint sm:grid">
          <span>Payout</span>
          <span className="text-right">Eligible views</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Status</span>
        </div>
        {data.rows.length === 0 ? (
          <Empty>{t.empty}</Empty>
        ) : (
          <ul className="divide-y divide-pill">
            {data.rows.map((p) => {
              const detail =
                p.paidAt
                  ? `Paid ${shortDate(p.paidAt)}${p.reference ? ` · ref ${p.reference}` : ''}`
                  : p.status.label === 'Measuring' && p.measurementEndsAt
                    ? `Accruing · measured until ${shortDate(p.measurementEndsAt)}`
                    : p.status.label;
              return (
                <li key={p.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 sm:grid-cols-[1fr_110px_120px_130px]">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium">{p.campaign}</div>
                    <div className="truncate font-mono text-[10px] uppercase text-gray">{p.brand} · {detail}</div>
                  </div>
                  <span className="hidden text-right font-mono text-[12.5px] tabular-nums sm:block">
                    {p.eligibleViews === null ? '—' : compactNumber(p.eligibleViews)}
                  </span>
                  <span className="text-right font-mono text-[13px] font-semibold tabular-nums">{rupees(p.amountMinor)}</span>
                  <span className="col-span-2 text-right sm:col-span-1">
                    <StatusTag tone={p.status.tone}>{p.status.label}</StatusTag>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="border-t border-pill px-4 py-3 text-[12px] text-gray">{t.tdsNote}</p>
      </Card>

      <Card title={t.accountTitle}>
        <p className="px-4 py-4 text-[14px] leading-relaxed text-ink">{t.accountMissing}</p>
      </Card>
    </div>
  );
}
