'use client';

import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { adminClientFetch, errorText } from '@/lib/admin/client';
import { buttonClass, type ButtonKind } from './ui';

// One-shot admin mutation: POSTs, then refreshes the server-rendered page.
// `prompt` asks for a required reason/reference inline before sending; `confirm`
// guards irreversible actions.
export function ActionButton({
  path,
  method = 'POST',
  body,
  children,
  kind = 'ghost',
  confirm,
  prompt,
  redirectTo,
  className = '',
}: {
  path: string;
  method?: 'POST' | 'DELETE' | 'PATCH';
  body?: Record<string, unknown>;
  children: ReactNode;
  kind?: ButtonKind;
  confirm?: string;
  prompt?: { label: string; field: string; placeholder?: string };
  redirectTo?: (result: unknown) => string | null;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [value, setValue] = useState('');

  async function run(extra?: Record<string, unknown>) {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    setError(null);
    try {
      const payload = body || extra ? { ...body, ...extra } : method === 'POST' ? {} : undefined;
      const result = await adminClientFetch(path, { method, body: payload });
      setAsking(false);
      setValue('');
      const next = redirectTo?.(result);
      if (next) router.push(next);
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (prompt && asking) {
    return (
      <form
        className="inline-flex flex-wrap items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) void run({ [prompt.field]: value.trim() });
        }}
      >
        <input
          autoFocus
          aria-label={prompt.label}
          placeholder={prompt.placeholder ?? prompt.label}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 w-56 border border-ink bg-card px-2.5 text-[12.5px] text-ink outline-none"
        />
        <button type="submit" disabled={busy || !value.trim()} className={buttonClass('inkMono')}>
          {busy ? '…' : 'Confirm'}
        </button>
        <button type="button" onClick={() => setAsking(false)} className={buttonClass('ghost')}>
          Cancel
        </button>
        {error ? <span className="w-full text-[11.5px] text-danger">{error}</span> : null}
      </form>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => (prompt ? setAsking(true) : void run())}
        className={buttonClass(kind, className)}
      >
        {busy ? 'Working…' : children}
      </button>
      {error ? <span role="alert" className="max-w-[28ch] text-[11.5px] leading-snug text-danger">{error}</span> : null}
    </span>
  );
}
