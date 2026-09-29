'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminClientFetch, errorText } from '@/lib/admin/client';
import { parseRupees, rupees } from '@/lib/admin/format';
import { buttonClass } from './ui';

// Open-invoice controls: attach the payment link ops mails to the brand, and
// record money received (manual reconciliation against the bank / Razorpay).
export function InvoiceActions({
  invoice,
}: {
  invoice: { id: string; status: string; totalMinor: number; paidMinor: number; paymentLinkUrl: string | null };
}) {
  const router = useRouter();
  const outstanding = invoice.totalMinor - invoice.paidMinor;
  const [mode, setMode] = useState<'none' | 'link' | 'pay'>('none');
  const [link, setLink] = useState(invoice.paymentLinkUrl ?? '');
  const [amount, setAmount] = useState(String(outstanding / 100));
  const [method, setMethod] = useState('RAZORPAY');
  const [ref, setRef] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (invoice.status !== 'ISSUED') return null;

  async function send(path: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      await adminClientFetch(path, { method: 'POST', body });
      setMode('none');
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const field = 'h-9 border border-field bg-card px-2.5 text-[12.5px] outline-none focus:border-ink';
  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1.5">
        {invoice.paymentLinkUrl ? (
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(invoice.paymentLinkUrl!);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            }}
            className={buttonClass('smallGhost')}
          >
            {copied ? '✓ Link copied' : 'Copy payment link'}
          </button>
        ) : null}
        <button type="button" onClick={() => setMode(mode === 'link' ? 'none' : 'link')} className={buttonClass('smallGhost')}>
          {invoice.paymentLinkUrl ? 'Change link' : '⚡ Add payment link'}
        </button>
        <button type="button" onClick={() => setMode(mode === 'pay' ? 'none' : 'pay')} className={buttonClass('hotMono')}>
          Record payment
        </button>
      </div>
      {mode === 'link' ? (
        <form
          className="mt-2 flex flex-wrap gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            void send(`/invoices/${invoice.id}/payment-link`, { paymentLinkUrl: link.trim() });
          }}
        >
          <input aria-label="Payment link URL" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://rzp.io/l/…" className={`${field} min-w-[260px] flex-1 font-mono`} />
          <button type="submit" disabled={busy} className={buttonClass('inkMono')}>Save</button>
        </form>
      ) : null}
      {mode === 'pay' ? (
        <form
          className="mt-2 flex flex-wrap items-end gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            const minor = parseRupees(amount);
            if (!minor) return setError('Enter the amount received.');
            void send(`/invoices/${invoice.id}/payments`, { amountMinor: minor, method, providerRef: ref.trim() || null, receivedAt: date });
          }}
        >
          <label>
            <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-faint">Amount ₹ · {rupees(outstanding)} due</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className={`${field} w-32 font-mono`} />
          </label>
          <label>
            <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-faint">Method</span>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={field}>
              <option value="RAZORPAY">Razorpay</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="UPI">UPI</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-faint">Reference</span>
            <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="pay_… / UTR" className={`${field} w-40 font-mono`} />
          </label>
          <label>
            <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-faint">Received</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
          </label>
          <button type="submit" disabled={busy} className={buttonClass('inkMono')}>{busy ? 'Saving…' : 'Record'}</button>
        </form>
      ) : null}
      {error ? <p className="mt-1.5 text-[11.5px] text-danger">{error}</p> : null}
    </div>
  );
}
