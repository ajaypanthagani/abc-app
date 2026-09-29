'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminClientFetch, errorText } from '@/lib/admin/client';
import { buttonClass } from './ui';

// Confirm the model's CPM or override it. Writes creator_cpm_history.
export function RateForm({
  creatorId,
  proposedMinor,
  currentMinor,
  compact = false,
}: {
  creatorId: string;
  proposedMinor: number;
  currentMinor: number | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [overriding, setOverriding] = useState(false);
  const [value, setValue] = useState(String(proposedMinor / 100));
  const [noteText, setNoteText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function confirm(cpmMinor: number, note: string | null) {
    setBusy(true);
    setError(null);
    try {
      await adminClientFetch(`/rates/${creatorId}/confirm`, { method: 'POST', body: { cpmMinor, note } });
      setDone(true);
      setOverriding(false);
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (done) return <span className={buttonClass('hotMono')}>Confirmed</span>;

  if (overriding) {
    return (
      <form
        className="flex flex-wrap items-center justify-end gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Math.round(Number(value) * 100);
          if (!Number.isFinite(n) || n < 1000) return setError('Enter a CPM in rupees.');
          void confirm(n, noteText.trim() || null);
        }}
      >
        <span className="text-gray">₹</span>
        <input
          autoFocus
          aria-label="CPM in rupees"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-[28px] w-20 border border-ink bg-card px-2 text-right font-mono text-[12px] outline-none"
        />
        <input
          aria-label="Reason"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Reason"
          className="h-[28px] w-40 border border-field bg-card px-2 text-[12px] outline-none focus:border-ink"
        />
        <button type="submit" disabled={busy} className={buttonClass('hotMono')}>{busy ? '…' : 'Save'}</button>
        <button type="button" onClick={() => setOverriding(false)} className={buttonClass('smallGhost')}>Cancel</button>
        {error ? <span className="w-full text-right text-[11px] text-danger">{error}</span> : null}
      </form>
    );
  }

  return (
    <span className="flex flex-wrap items-center justify-end gap-1.5">
      <button type="button" disabled={busy} onClick={() => confirm(proposedMinor, null)} className={buttonClass('smallGhost')}>
        {busy ? '…' : currentMinor === null ? 'Set rate' : 'Confirm'}
      </button>
      <button type="button" onClick={() => setOverriding(true)} className={buttonClass('smallGhost')}>
        {compact ? 'Adjust' : 'Override'}
      </button>
      {error ? <span className="w-full text-right text-[11px] text-danger">{error}</span> : null}
    </span>
  );
}
