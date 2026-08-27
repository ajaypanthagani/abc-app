'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiClientError, clientFetch } from '@/lib/api/client';
import { copy } from '@/lib/copy';

export function ResyncButton() {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [note, setNote] = useState<string | null>(null);

  const resync = async () => {
    setState('busy');
    setNote(null);
    try {
      await clientFetch('/v1/creators/me/sync', { method: 'POST' });
      setState('done');
      setNote('Sync started — fresh numbers land in a few minutes.');
      router.refresh();
    } catch (err) {
      setState('idle');
      if (err instanceof ApiClientError && err.code === 'RESYNC_COOLDOWN') {
        const seconds = (err.details as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds;
        const mins = seconds ? Math.max(1, Math.ceil(seconds / 60)) : null;
        setNote(mins ? `Synced recently — try again in ${mins} min.` : err.message);
      } else {
        setNote(err instanceof ApiClientError ? err.message : 'Could not start the sync. Try again.');
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={resync}
        disabled={state !== 'idle'}
        className="rounded border border-edge bg-card px-3 py-1.5 text-[13px] text-fg hover:border-fg disabled:opacity-50"
      >
        {state === 'busy' ? 'Starting…' : copy.network.resync}
      </button>
      {note ? <span className="text-[12px] text-fg-muted">{note}</span> : null}
    </div>
  );
}
