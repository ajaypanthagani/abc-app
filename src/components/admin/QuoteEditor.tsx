'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminClientFetch, errorText } from '@/lib/admin/client';
import type { Quote } from '@/lib/admin/types';
import { bps, humanize, longDate, parseRupees, rupees } from '@/lib/admin/format';
import { Tag, buttonClass } from './ui';

const STANDARD_TERMS =
  '2 revision rounds included per draft; further rounds via mediation · Equivalent-tier replacement if a creator becomes unavailable · Weekly synced Meta metrics + final report at measurement close · TDS deducted as applicable · GSTIN and SAC shown on invoice · Quote supersedes all prior revisions';

const rupeeInput = (minor: number) => String(Math.round(minor / 100));
const micro = 'font-mono text-[9px] uppercase tracking-[0.13em] text-faint';
const field = 'h-9 border border-field bg-card px-2.5 text-[13px] outline-none focus:border-ink disabled:bg-paper disabled:text-gray';

export function QuoteEditor({ quote: q, canApprove }: { quote: Quote; canApprove: boolean }) {
  const router = useRouter();
  const editable = q.editable;
  const [lines, setLines] = useState(q.creatorLines.map((l) => ({ ...l, price: rupeeInput(l.amountMinor), deliv: l.deliverables ?? '' })));
  const [fees, setFees] = useState(q.feeLines.map((f) => ({ description: f.description, amount: rupeeInput(f.amountMinor) })));
  const [discount, setDiscount] = useState(rupeeInput(q.totals.discountMinor));
  const [rights, setRights] = useState(q.rightsOption);
  const [excl, setExcl] = useState(q.exclusivityOption);
  const [deposit, setDeposit] = useState(q.depositPct ?? 25);
  const [balance, setBalance] = useState(q.balanceTerms);
  const [po, setPo] = useState(q.poNumber ?? '');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // Live preview mirrors the API's quoteTotals(); the saved numbers are the
  // server's.
  const creator = lines.reduce((a, l) => a + (parseRupees(l.price) ?? 0), 0);
  const feeSum = fees.reduce((a, f) => a + (parseRupees(f.amount) ?? 0), 0);
  const rightsAmt = q.options.rights.find((o) => o.value === rights)?.amountMinor ?? 0;
  const exclAmt = q.options.exclusivity.find((o) => o.value === excl)?.amountMinor ?? 0;
  const gross = creator + feeSum + rightsAmt + exclAmt;
  const disc = Math.min(parseRupees(discount) ?? 0, gross);
  const sub = gross - disc;
  const gst = Math.round((sub * q.gst.rateBps) / 10_000);
  const marginBps = sub > 0 ? Math.round((1 - q.internal.creatorPayoutMinor / sub) * 10_000) : 0;
  const belowFloor = sub > 0 && marginBps < q.internal.marginFloorBps;
  const depositEx = Math.round((sub * deposit) / 100);
  const depositTotal = depositEx + Math.round((depositEx * q.gst.rateBps) / 10_000);

  const dirty =
    lines.some((l, i) => l.price !== rupeeInput(q.creatorLines[i].amountMinor) || l.deliv !== (q.creatorLines[i].deliverables ?? '')) ||
    JSON.stringify(fees) !== JSON.stringify(q.feeLines.map((f) => ({ description: f.description, amount: rupeeInput(f.amountMinor) }))) ||
    discount !== rupeeInput(q.totals.discountMinor) ||
    rights !== q.rightsOption || excl !== q.exclusivityOption || deposit !== q.depositPct || balance !== q.balanceTerms ||
    po !== (q.poNumber ?? '');

  async function run(key: string, fn: () => Promise<unknown>, after?: (r: unknown) => void) {
    setBusy(key);
    setError(null);
    setNote(null);
    try {
      const r = await fn();
      after?.(r);
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  const save = () =>
    adminClientFetch(`/quotes/${q.id}`, {
      method: 'PATCH',
      body: {
        creatorLines: lines.map((l) => ({ creatorProfileId: l.creatorProfileId, deliverables: l.deliv.trim() || '1 Reel', amountMinor: parseRupees(l.price) ?? 0 })),
        feeLines: fees.filter((f) => f.description.trim()).map((f) => ({ description: f.description.trim(), amountMinor: parseRupees(f.amount) ?? 0 })),
        discountMinor: parseRupees(discount) ?? 0,
        rightsOption: rights,
        exclusivityOption: excl,
        depositPct: deposit,
        balanceTerms: balance,
        poNumber: po.trim() || null,
      },
    });

  const statusTone = q.status === 'DRAFT' ? 'soft' : q.status === 'APPROVAL_REQUESTED' ? 'danger' : 'hot';

  return (
    <div className="max-w-[980px]">
      <Link
        href={`/admin/campaigns/${q.campaign.id}/mix?mix=${q.mix.id}`}
        className="mb-4 inline-flex h-[34px] items-center border border-field bg-card px-3.5 font-mono text-[10px] uppercase tracking-[0.08em] text-gray hover:border-ink hover:text-ink"
      >
        ← Mix builder
      </Link>
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
        Quotation · {q.campaign.brand.name} · {q.campaign.name}
      </div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Prepare quote from {q.mix.label}</h1>
        <Tag tone={statusTone} className="px-2 py-1.5">{q.status === 'APPROVAL_REQUESTED' ? 'Awaiting approval' : humanize(q.status)}</Tag>
      </div>
      <p className="mb-4 text-[13px] text-gray">
        Brand sees line items and totals only — never CPM or payouts. Send it, then share the PDF over email or WhatsApp.
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[q.quoteNumber, `Rev v${q.revision}`, `Created ${longDate(q.createdAt)}`, `Valid until ${longDate(q.validUntil)}`, q.approvedAt ? `Approved by ${q.approvedBy ?? 'manager'}` : null]
          .filter(Boolean)
          .map((c) => (
            <span key={c} className="bg-pill px-2 py-1 font-mono text-[9.5px] uppercase text-gray">{c}</span>
          ))}
      </div>

      <section className="mb-4 border border-line bg-card">
        <div className="border-b border-line px-4 py-3">
          <span className={micro}>Creator content · from finalized mix · {lines.length} creators</span>
        </div>
        <div className="hidden grid-cols-[1.3fr_1.2fr_1fr] gap-3 border-b border-line px-4 py-2 font-mono text-[8.5px] uppercase tracking-[0.1em] text-faint md:grid">
          <span>Creator</span><span>Deliverables · editable</span><span className="text-right">Price · override to negotiate</span>
        </div>
        {lines.map((l, i) => {
          const list = l.listPriceMinor ?? 0;
          const current = parseRupees(l.price) ?? 0;
          return (
            <div key={l.id} className="grid items-center gap-3 border-b border-pill px-4 py-2.5 md:grid-cols-[1.3fr_1.2fr_1fr]">
              <span className="text-[13px]">{l.name ?? 'Creator'} <span className="font-mono text-[10px] text-faint">@{l.handle}</span></span>
              <input
                aria-label={`Deliverables for ${l.name}`}
                disabled={!editable}
                value={l.deliv}
                onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, deliv: e.target.value } : x)))}
                className={field}
              />
              <div className="flex items-center justify-end gap-2">
                <span className="font-mono text-[9px] uppercase text-faint">{current === list ? 'List' : `List ${rupees(list)}`}</span>
                <span className="text-gray">₹</span>
                <input
                  aria-label={`Price for ${l.name}`}
                  disabled={!editable}
                  inputMode="numeric"
                  value={l.price}
                  onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, price: e.target.value.replace(/[^\d]/g, '') } : x)))}
                  className={`${field} w-28 text-right font-mono`}
                />
              </div>
            </div>
          );
        })}
        <div className="flex justify-between px-4 py-3 font-mono text-[11px] uppercase">
          <span className="text-faint">Creator content subtotal</span>
          <span className="tabular font-semibold">{rupees(creator)}</span>
        </div>
      </section>

      <section className="mb-4 border border-line bg-card">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className={micro}>Additional line items · fees, add-ons, logistics</span>
          {editable ? (
            <button type="button" onClick={() => setFees([...fees, { description: '', amount: '0' }])} className={buttonClass('smallGhost')}>
              + Add line item
            </button>
          ) : null}
        </div>
        {fees.length === 0 ? <div className="px-4 py-3 text-[12.5px] text-faint">No additional items.</div> : null}
        {fees.map((f, i) => (
          <div key={i} className="flex items-center gap-2 border-b border-pill px-4 py-2">
            <input
              aria-label="Line item description"
              disabled={!editable}
              value={f.description}
              placeholder="e.g. Traffic add-on · link-click tracking & reporting"
              onChange={(e) => setFees(fees.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
              className={`${field} flex-1`}
            />
            <span className="text-gray">₹</span>
            <input
              aria-label="Line item amount"
              disabled={!editable}
              inputMode="numeric"
              value={f.amount}
              onChange={(e) => setFees(fees.map((x, j) => (j === i ? { ...x, amount: e.target.value.replace(/[^\d]/g, '') } : x)))}
              className={`${field} w-28 text-right font-mono`}
            />
            {editable ? (
              <button type="button" aria-label="Remove line" onClick={() => setFees(fees.filter((_, j) => j !== i))} className={buttonClass('smallGhost')}>×</button>
            ) : null}
          </div>
        ))}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5">
          <span className={micro}>Discount · subtracted before GST</span>
          <span className="text-gray">− ₹</span>
          <input
            aria-label="Discount"
            disabled={!editable}
            inputMode="numeric"
            value={discount}
            onChange={(e) => setDiscount(e.target.value.replace(/[^\d]/g, ''))}
            className={`${field} w-28 text-right font-mono`}
          />
        </div>
      </section>

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <section className="border border-line bg-card p-4">
          <div className={`mb-3 ${micro}`}>Rights & exclusivity · priced terms</div>
          <label className="mb-3 block">
            <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-faint">Content usage rights</span>
            <select disabled={!editable} value={rights} onChange={(e) => setRights(e.target.value)} className={`${field} w-full`}>
              {q.options.rights.map((o) => (
                <option key={o.value} value={o.value}>{o.label}{o.amountMinor ? ` · +${rupees(o.amountMinor)}` : ''}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-faint">Category exclusivity</span>
            <select disabled={!editable} value={excl} onChange={(e) => setExcl(e.target.value)} className={`${field} w-full`}>
              {q.options.exclusivity.map((o) => (
                <option key={o.value} value={o.value}>{o.label}{o.amountMinor ? ` · +${rupees(o.amountMinor)}` : ''}</option>
              ))}
            </select>
          </label>
        </section>
        <section className="border border-line bg-card p-4">
          <div className={`mb-3 ${micro}`}>Payment terms</div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <label>
              <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-faint">Deposit</span>
              <select disabled={!editable} value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} className={`${field} w-full`}>
                {q.options.deposit.map((d) => (
                  <option key={d} value={d}>{d === 100 ? '100% prepaid' : `${d}% deposit`}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-faint">Balance</span>
              <select disabled={!editable} value={balance} onChange={(e) => setBalance(e.target.value)} className={`${field} w-full`}>
                {q.options.balanceTerms.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-faint">Brand PO number · optional</span>
            <input disabled={!editable} value={po} onChange={(e) => setPo(e.target.value)} placeholder="PO-XXXX" className={`${field} w-full font-mono`} />
          </label>
        </section>
      </div>

      <section className="mb-4 border border-line bg-card p-4">
        <div className={`mb-1.5 ${micro}`}>Standard terms printed on the PDF</div>
        <p className="text-[12px] leading-relaxed text-gray">{STANDARD_TERMS}</p>
      </section>

      <div className="mb-4 grid gap-4 md:grid-cols-[1fr_1fr]">
        <section className="bg-ink p-4 text-[12.5px] leading-relaxed text-paper-dim">
          <span className="mb-1.5 block font-mono text-[9px] tracking-[0.13em] text-lime">INTERNAL CHECK · NOT ON THE PDF</span>
          Creator payouts at cap: {rupees(q.internal.creatorPayoutMinor)} · effective margin on this quote:{' '}
          <span className={belowFloor ? 'text-danger-soft' : 'text-lime'}>{bps(marginBps)}</span> (floor {bps(q.internal.marginFloorBps)}).
          {dirty ? <span className="mt-1 block text-[11px] text-faint">Unsaved changes — preview shown.</span> : null}
        </section>
        <section className="border border-line bg-card p-4">
          {[
            ['Creator content', rupees(creator)],
            ['Additional line items', rupees(feeSum)],
            ['Rights & exclusivity', rupees(rightsAmt + exclAmt)],
            ['Discount', `− ${rupees(disc)}`],
            ['Subtotal', rupees(sub)],
            [`GST ${q.gst.rateBps / 100}% · SAC ${q.gst.sac}`, rupees(gst)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-0.5 text-[12.5px]">
              <span className="font-mono text-[10px] uppercase text-gray">{k}</span>
              <span className="tabular font-mono">{v}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t-2 border-ink pt-2">
            <span className="font-mono text-[11px] uppercase">Total payable</span>
            <span className="tabular font-mono text-[18px] font-semibold">{rupees(sub + gst)}</span>
          </div>
          <div className="mt-1 text-right font-mono text-[10px] text-gray">Deposit {deposit}% · {rupees(depositTotal)} incl. GST</div>
        </section>
      </div>

      {belowFloor && editable ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 border border-danger px-4 py-3">
          <span className="flex-1 font-mono text-[10px] uppercase tracking-[0.06em] text-danger">
            Margin below {bps(q.internal.marginFloorBps)} floor — manager approval required before this quote can go out
          </span>
          {q.status === 'DRAFT' && !dirty ? (
            <button type="button" disabled={busy !== null} onClick={() => run('req', () => adminClientFetch(`/quotes/${q.id}/request-approval`, { method: 'POST', body: {} }))} className={buttonClass('smallGhost')}>
              Request manager approval
            </button>
          ) : null}
          {q.status === 'APPROVAL_REQUESTED' && canApprove ? (
            <button type="button" disabled={busy !== null} onClick={() => run('approve', () => adminClientFetch(`/quotes/${q.id}/approve`, { method: 'POST', body: {} }))} className={buttonClass('hotMono')}>
              Approve below floor
            </button>
          ) : null}
          {q.status === 'APPROVAL_REQUESTED' && !canApprove ? <span className="font-mono text-[10px] uppercase text-gray">Approval requested</span> : null}
        </div>
      ) : null}

      {error ? <p role="alert" className="mb-3 border border-danger px-3 py-2 text-[12.5px] text-danger">{error}</p> : null}
      {note ? <p role="status" className="mb-3 text-[12.5px] text-gray">{note}</p> : null}

      <div className="flex flex-wrap items-center gap-2.5">
        {editable ? (
          <button
            type="button"
            disabled={!dirty || busy !== null}
            onClick={() => run('save', save, () => setNote('Saved.'))}
            className={buttonClass('ghost', 'h-12 px-5 text-[11px]')}
          >
            {busy === 'save' ? 'Saving…' : 'Save changes'}
          </button>
        ) : null}
        {editable ? (
          <button
            type="button"
            disabled={dirty || busy !== null || (belowFloor && q.status !== 'APPROVED')}
            title={dirty ? 'Save your changes first' : undefined}
            onClick={() => {
              if (!window.confirm(`Send ${q.quoteNumber} and issue the deposit invoice for ${rupees(depositTotal)}? The quote freezes once sent.`)) return;
              void run('send', () => adminClientFetch<{ invoiceNumber: string }>(`/quotes/${q.id}/send`, { method: 'POST', body: {} }), () =>
                router.push(`/admin/campaigns/${q.campaign.id}?tab=money`),
              );
            }}
            className={buttonClass('lime', 'h-12 min-w-0 flex-1 text-[14px]')}
          >
            {busy === 'send' ? (
              'Sending…'
            ) : (
              <>
                <span className="sm:hidden">⚡ Send quote</span>
                <span className="hidden sm:inline">⚡ Send quote · issue {deposit}% deposit invoice ({rupees(depositTotal)})</span>
              </>
            )}
          </button>
        ) : null}
        {q.status === 'SENT' ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => {
              if (!window.confirm('Revise this quote? The sent version is superseded and its unpaid deposit invoice voided.')) return;
              void run('revise', () => adminClientFetch<{ quoteId: string }>(`/quotes/${q.id}/revise`, { method: 'POST', body: {} }), (r) =>
                router.push(`/admin/quotes/${(r as { quoteId: string }).quoteId}`),
              );
            }}
            className={buttonClass('ghost', 'h-12 px-5 text-[11px]')}
          >
            Revise quote
          </button>
        ) : null}
        <a href={`/admin/quotes/${q.id}/print`} className={buttonClass('ink', 'h-12')}>⤓ Export quotation PDF</a>
        {!editable ? (
          <span className="font-mono text-[10px] uppercase text-gray">
            {q.status === 'SENT' ? `Sent ${longDate(q.sentAt)} — awaiting deposit` : q.status === 'ACCEPTED' ? `Accepted ${longDate(q.acceptedAt)}` : humanize(q.status)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
