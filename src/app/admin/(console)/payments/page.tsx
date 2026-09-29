import type { Metadata } from 'next';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin/server';
import type { InvoiceRow, PayoutList } from '@/lib/admin/types';
import { cpm, humanize, rupees, shortDate, views } from '@/lib/admin/format';
import { ActionButton } from '@/components/admin/ActionButton';
import { CsvButton } from '@/components/admin/CsvButton';
import { Empty, GridHead, KpiStrip, PageHeader, Tag } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Payments' };

const PAYOUT_TONE: Record<string, 'hot' | 'soft' | 'danger' | 'ink'> = {
  FINALIZED: 'hot', SCHEDULED: 'ink', PROCESSING: 'ink', PAID: 'soft', ON_HOLD: 'danger', FAILED: 'danger',
};

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = 'payouts' } = await searchParams;
  const invoicesTab = tab === 'invoices';
  const [payouts, invoices] = await Promise.all([adminFetch<PayoutList>('/payouts'), adminFetch<InvoiceRow[]>('/invoices')]);
  const k = payouts.kpis;

  const tabs: [string, string][] = [['payouts', 'Creator payouts'], ['invoices', 'Brand invoices']];

  return (
    <div>
      <PageHeader
        eyebrow="Payments"
        title="Money in, money out"
        actions={
          <CsvButton
            label="⤓ Reconciliation"
            filename="reconciliation"
            rows={[
              ...invoices.map((i) => ({
                direction: 'IN', reference: i.number, party: i.brand.name, campaign: i.campaign.name, kind: i.kind,
                amount_inr: i.totalMinor / 100, settled_inr: i.paidMinor / 100, status: i.status,
                date: (i.paidAt ?? i.issuedAt)?.slice(0, 10) ?? null,
              })),
              ...payouts.rows.map((p) => ({
                direction: 'OUT', reference: p.paymentReference, party: p.creator.name ?? p.creator.handle, campaign: p.campaign.name, kind: 'PAYOUT',
                amount_inr: p.netMinor / 100, settled_inr: p.status === 'PAID' ? p.netMinor / 100 : 0, status: p.status,
                date: (p.paidAt ?? p.finalizedAt)?.slice(0, 10) ?? null,
              })),
            ]}
          />
        }
      />

      <nav aria-label="Payments" className="mb-4 flex gap-[7px]">
        {tabs.map(([t, label]) => {
          const on = (t === 'invoices') === invoicesTab;
          return (
            <Link
              key={t}
              href={`/admin/payments?tab=${t}`}
              aria-current={on ? 'page' : undefined}
              className={`border px-3 py-[7px] text-[12.5px] ${on ? 'border-ink bg-ink text-paper' : 'border-field bg-card hover:border-ink'}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {!invoicesTab ? (
        <>
          <KpiStrip
            cols={4}
            items={[
              { label: 'Awaiting approval', value: rupees(k.awaitingApprovalMinor), note: `${k.awaitingApprovalCount} payouts, measurement closed` },
              { label: 'Paid this month', value: rupees(k.paidThisMonthMinor), note: `${k.paidThisMonthCount} transfers` },
              { label: 'Held', value: rupees(k.heldMinor), note: `${k.heldCount} payout${k.heldCount === 1 ? '' : 's'} under review`, tone: k.heldCount ? 'danger' : undefined },
              { label: 'TDS withheld, FY', value: rupees(k.tdsFyMinor), note: 'On paid payouts' },
            ]}
          />
          <div className="border border-line bg-card">
            <GridHead cols="1.3fr 1.3fr .8fr .6fr .7fr .8fr 230px">
              <span>Creator</span><span>Campaign</span><span>Eligible views</span><span>CPM</span><span>TDS</span><span>Net payout</span><span />
            </GridHead>
            {payouts.rows.length === 0 ? (
              <Empty>No payouts yet — they appear when a campaign closes measurement</Empty>
            ) : (
              payouts.rows.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-2 items-center gap-x-[11px] gap-y-1.5 border-b border-pill px-4 py-[11px] last:border-0 md:[grid-template-columns:var(--cols)]"
                  style={{ ['--cols' as string]: '1.3fr 1.3fr .8fr .6fr .7fr .8fr 230px' }}
                >
                  <Link href={`/admin/creators/${p.creator.id}`} className="min-w-0 hover:opacity-70">
                    <div className="truncate text-[12.5px] font-medium">{p.creator.name ?? '—'}</div>
                    <div className="font-mono text-[9.5px] text-faint">@{p.creator.handle ?? '—'}</div>
                  </Link>
                  <Link href={`/admin/campaigns/${p.campaign.id}?tab=money`} className="truncate text-[12px] text-gray hover:text-ink">{p.campaign.name}</Link>
                  <span className="tabular font-mono text-[12px]">{views(p.eligibleViews)}</span>
                  <span className="tabular font-mono text-[12px]">{cpm(p.cpmMinor)}</span>
                  <span className="tabular font-mono text-[12px] text-gray">{rupees(p.tdsMinor)}</span>
                  <span className="tabular font-mono text-[12px] font-semibold">{rupees(p.netMinor)}</span>
                  <div className="col-span-2 flex flex-wrap items-center justify-end gap-[5px] md:col-span-1">
                    <Tag tone={PAYOUT_TONE[p.status] ?? 'soft'}>{p.status === 'SCHEDULED' ? 'Approved' : humanize(p.status)}</Tag>
                    {p.status === 'FINALIZED' ? <ActionButton path={`/payouts/${p.id}/approve`} kind="hotMono">Approve</ActionButton> : null}
                    {['FINALIZED', 'SCHEDULED'].includes(p.status) ? (
                      <ActionButton path={`/payouts/${p.id}/hold`} kind="smallGhost" prompt={{ label: 'Why hold this payout?', field: 'reason' }}>Hold</ActionButton>
                    ) : null}
                    {p.status === 'SCHEDULED' ? (
                      <ActionButton path={`/payouts/${p.id}/mark-paid`} kind="smallGhost" prompt={{ label: 'UTR / transfer reference', field: 'paymentReference' }}>Mark paid</ActionButton>
                    ) : null}
                    {p.status === 'ON_HOLD' ? (
                      <ActionButton path={`/payouts/${p.id}/release`} kind="smallGhost" confirm={`Release this hold? Reason was: ${p.holdReason ?? '—'}`}>Release</ActionButton>
                    ) : null}
                    {p.status === 'PAID' && p.paymentReference ? <span className="font-mono text-[9px] text-faint">{p.paymentReference}</span> : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="border border-line bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-faint">GST invoices · payment links mailed to the brand by ops · receipts recorded here</span>
            <span className="font-mono text-[9px] uppercase text-faint">Razorpay · manual reconciliation</span>
          </div>
          <GridHead cols="100px 1.6fr .8fr .7fr .9fr 130px">
            <span>Invoice</span><span>Brand / campaign</span><span>Kind</span><span>Issued</span><span>Amount</span><span>Status</span>
          </GridHead>
          {invoices.length === 0 ? (
            <Empty>No invoices yet</Empty>
          ) : (
            invoices.map((i) => (
              <div
                key={i.id}
                className="grid grid-cols-2 items-center gap-x-[11px] gap-y-1.5 border-b border-pill px-4 py-[11px] last:border-0 md:[grid-template-columns:var(--cols)]"
                style={{ ['--cols' as string]: '100px 1.6fr .8fr .7fr .9fr 130px' }}
              >
                <span className="font-mono text-[12px] font-semibold">{i.number}</span>
                <Link href={`/admin/campaigns/${i.campaign.id}?tab=money`} className="min-w-0 hover:opacity-70">
                  <div className="truncate text-[12.5px] font-medium">{i.brand.name}</div>
                  <div className="truncate font-mono text-[9.5px] uppercase text-faint">{i.campaign.name}</div>
                </Link>
                <span className="font-mono text-[10px] uppercase text-gray">{i.kind}</span>
                <span className="font-mono text-[10px] text-gray">{shortDate(i.issuedAt)}</span>
                <span className="tabular font-mono text-[12px]">{rupees(i.totalMinor)}</span>
                <span>
                  {i.overdueDays !== null ? (
                    <Tag tone="danger">Overdue {i.overdueDays}d</Tag>
                  ) : (
                    <Tag tone={i.status === 'ISSUED' ? 'hot' : i.status === 'VOID' ? 'outline' : 'soft'}>{i.status === 'ISSUED' ? 'Awaiting payment' : humanize(i.status)}</Tag>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
