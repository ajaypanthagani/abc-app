'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminClientFetch, errorText } from '@/lib/admin/client';
import type { Taxonomies } from '@/lib/admin/types';
import { longDate } from '@/lib/admin/format';
import { buttonClass } from './ui';

const FIELDS: { key: string; label: string; ph: string }[] = [
  { key: 'legalName', label: 'Legal name', ph: 'Nimbus Beverages Pvt Ltd' },
  { key: 'name', label: 'Brand name', ph: 'Nimbus Coffee' },
  { key: 'ownerName', label: 'Owner name', ph: 'Meera Krishnan' },
  { key: 'ownerEmail', label: 'Owner email', ph: 'meera@nimbuscoffee.in' },
  { key: 'phone', label: 'Phone', ph: '+91 98…' },
  { key: 'gstin', label: 'GSTIN', ph: '29AABCN1234F1Z5' },
  { key: 'website', label: 'Website', ph: 'nimbuscoffee.in' },
  { key: 'instagramHandle', label: 'Instagram', ph: '@nimbuscoffee' },
];

export function BrandRegisterForm({ categories, onClose }: { categories: Taxonomies['categories']; onClose?: () => void }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [industry, setIndustry] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; invite: { email: string; expiresAt: string } | null } | null>(null);

  async function submit(sendInvite: boolean) {
    if (!values.name?.trim()) return setError('Brand name is required.');
    setBusy(true);
    setError(null);
    try {
      const res = await adminClientFetch<{ id: string; invite: { email: string; expiresAt: string } | null }>('/brands', {
        method: 'POST',
        body: {
          ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim() || null])),
          name: values.name.trim(),
          industrySlug: industry || null,
          sendInvite,
        },
      });
      setResult(res);
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="mb-4 border border-ink bg-card p-5">
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.13em] text-faint">Brand registered</div>
        <p className="text-[13.5px]">
          {result.invite
            ? `Invitation recorded for ${result.invite.email}, open until ${longDate(result.invite.expiresAt)}. The brand portal isn't live yet, so onboard them on a call and mark the brand active.`
            : 'Saved without an invitation.'}
        </p>
        <div className="mt-4 flex gap-2">
          <a href={`/admin/campaigns/new?brand=${result.id}`} className={buttonClass('ink')}>Start a campaign for them</a>
          <button type="button" onClick={() => { setResult(null); setValues({}); onClose?.(); }} className={buttonClass('ghost')}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="mb-4 border border-ink bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        void submit(true);
      }}
    >
      <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.13em] text-faint">Register a brand</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((f) => (
          <label key={f.key}>
            <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-faint">{f.label}</span>
            <input
              value={values[f.key] ?? ''}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              placeholder={f.ph}
              className="h-10 w-full border border-field bg-card px-3 text-[13px] outline-none focus:border-ink"
            />
          </label>
        ))}
        <label>
          <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-faint">Category</span>
          <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="h-10 w-full border border-field bg-card px-2 text-[13px]">
            <option value="">—</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.displayName}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-3 font-mono text-[9px] uppercase text-faint">Deposit and payment terms are set per campaign on the quote</p>
      {error ? <p role="alert" className="mt-3 text-[12.5px] text-danger">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={buttonClass('ink')}>{busy ? 'Saving…' : 'Register and record invite'}</button>
        <button type="button" disabled={busy} onClick={() => submit(false)} className={buttonClass('ghost', 'h-10')}>Save without inviting</button>
        {onClose ? <button type="button" onClick={onClose} className={buttonClass('ghost', 'h-10')}>Cancel</button> : null}
      </div>
    </form>
  );
}
