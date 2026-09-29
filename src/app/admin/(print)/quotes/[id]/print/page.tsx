import type { Metadata } from 'next';
import { adminFetch } from '@/lib/admin/server';
import type { Quote } from '@/lib/admin/types';
import { longDate, rupees } from '@/lib/admin/format';
import { PrintBar } from '@/components/admin/PrintBar';

export const metadata: Metadata = { title: 'Quotation' };

const STANDARD_TERMS = [
  'Two revision rounds are included per draft; further rounds are mediated by ABC.',
  'If a creator becomes unavailable, ABC substitutes an equivalent-tier creator.',
  'Performance is reported from weekly-synced Meta insights, with a final report at measurement close.',
  'TDS is deducted as applicable against the certificate provided.',
  'This quotation supersedes all prior revisions.',
];

// Brand-facing quotation: line items and totals only. The CPM, creator
// payouts and margin on the ops screen never appear here.
export default async function QuotePrint({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await adminFetch<Quote>(`/quotes/${id}`);
  const rights = q.options.rights.find((o) => o.value === q.rightsOption);
  const excl = q.options.exclusivity.find((o) => o.value === q.exclusivityOption);
  const terms = q.options.balanceTerms.find((o) => o.value === q.balanceTerms)?.label;
  const draft = q.status !== 'SENT' && q.status !== 'ACCEPTED';

  return (
    <div className="min-h-screen bg-white text-ink">
      <PrintBar back={`/admin/quotes/${id}`} note={draft ? 'Draft · not yet sent' : 'Brand-facing quotation'} />
      <article className="relative mx-auto max-w-[860px] px-8 py-10">
        {draft ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 text-[120px] font-bold tracking-tight text-pill">DRAFT</span>
          </div>
        ) : null}
        <header className="relative mb-8 flex items-start justify-between gap-6 border-b-2 border-ink pb-5">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center bg-lime text-[11px] font-bold">ABC</div>
              <span className="text-[14px] font-semibold">Ads By Creators</span>
            </div>
            <h1 className="text-[26px] font-semibold tracking-[-0.03em]">Quotation</h1>
            <p className="text-[13px] text-gray">{q.campaign.name}</p>
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-right font-mono text-[10px] uppercase text-gray">
            <dt>Quote</dt><dd className="text-ink">{q.quoteNumber}{q.revision > 1 ? ` · Rev ${q.revision}` : ''}</dd>
            <dt>Issued</dt><dd className="text-ink">{longDate(q.sentAt ?? q.createdAt)}</dd>
            <dt>Valid until</dt><dd className="text-ink">{longDate(q.validUntil)}</dd>
            {q.poNumber ? (<><dt>PO</dt><dd className="text-ink">{q.poNumber}</dd></>) : null}
          </dl>
        </header>

        <section className="relative mb-6 text-[12.5px]">
          <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-gray">Prepared for</div>
          <div className="font-medium">{q.campaign.brand.legalName ?? q.campaign.brand.name}</div>
          {q.campaign.brand.gstin ? <div className="font-mono text-[11px] text-gray">GSTIN {q.campaign.brand.gstin}</div> : null}
        </section>

        <table className="relative w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-ink text-left font-mono text-[8.5px] uppercase tracking-[0.08em] text-gray">
              <th className="py-2 pr-3">Item</th>
              <th className="py-2 pr-3">Deliverables</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {q.creatorLines.map((l) => (
              <tr key={l.id} className="border-b border-line">
                <td className="py-2.5 pr-3">{l.name ?? 'Creator'} <span className="font-mono text-[10px] text-gray">@{l.handle}</span></td>
                <td className="py-2.5 pr-3">{l.deliverables}</td>
                <td className="tabular py-2.5 text-right font-mono">{rupees(l.amountMinor)}</td>
              </tr>
            ))}
            {q.feeLines.map((l) => (
              <tr key={l.id} className="border-b border-line">
                <td className="py-2.5 pr-3" colSpan={2}>{l.description}</td>
                <td className="tabular py-2.5 text-right font-mono">{rupees(l.amountMinor)}</td>
              </tr>
            ))}
            {q.totals.rightsMinor ? (
              <tr className="border-b border-line">
                <td className="py-2.5 pr-3" colSpan={2}>Content usage rights · {rights?.label}</td>
                <td className="tabular py-2.5 text-right font-mono">{rupees(q.totals.rightsMinor)}</td>
              </tr>
            ) : null}
            {q.totals.exclusivityMinor ? (
              <tr className="border-b border-line">
                <td className="py-2.5 pr-3" colSpan={2}>{excl?.label}</td>
                <td className="tabular py-2.5 text-right font-mono">{rupees(q.totals.exclusivityMinor)}</td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <div className="relative ml-auto mt-4 w-full max-w-[340px] text-[12.5px]">
          {q.totals.discountMinor ? (
            <div className="flex justify-between py-1"><span>Discount</span><span className="tabular font-mono">− {rupees(q.totals.discountMinor)}</span></div>
          ) : null}
          <div className="flex justify-between py-1"><span>Subtotal</span><span className="tabular font-mono">{rupees(q.totals.subtotalMinor)}</span></div>
          <div className="flex justify-between py-1"><span>GST {q.gst.rateBps / 100}% · SAC {q.gst.sac}</span><span className="tabular font-mono">{rupees(q.totals.taxMinor)}</span></div>
          <div className="mt-1 flex justify-between border-t-2 border-ink pt-2 text-[15px] font-semibold"><span>Total payable</span><span className="tabular font-mono">{rupees(q.totals.totalMinor)}</span></div>
        </div>

        <section className="relative mt-8 grid gap-6 border-t border-line pt-5 text-[12px] sm:grid-cols-2">
          <div>
            <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-gray">Payment terms</div>
            <p>
              {q.depositPct}% deposit ({rupees(q.totals.depositTotalMinor)} incl. GST) on acceptance · {terms}.
              {' '}Content usage: {rights?.label.replace(' · included', '')}. {excl?.label.replace(' · included', '')}.
            </p>
          </div>
          <div>
            <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-gray">Standard terms</div>
            <ul className="list-disc space-y-1 pl-4 text-gray">
              {STANDARD_TERMS.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        </section>
      </article>
    </div>
  );
}
