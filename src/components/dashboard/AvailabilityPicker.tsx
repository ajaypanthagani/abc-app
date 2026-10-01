'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiClientError, clientFetch } from '@/lib/api/client';
import { copy } from '@/lib/copy';

type Availability = 'OPEN' | 'LIMITED' | 'PAUSED';
const OPTIONS: Availability[] = ['OPEN', 'LIMITED', 'PAUSED'];

// One tap, saved immediately; the sidebar reflects it after refresh.
export function AvailabilityPicker({ current }: { current: Availability }) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(next: Availability) {
    if (next === value || busy) return;
    const prev = value;
    setValue(next);
    setBusy(true);
    setError(null);
    try {
      await clientFetch('/v1/creators/me/availability', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ availability: next }),
      });
      router.refresh();
    } catch (err) {
      setValue(prev);
      setError(err instanceof ApiClientError ? err.message : 'Could not save. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={copy.dashboard.profile.availabilityTitle}>
        {OPTIONS.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={value === o}
            onClick={() => pick(o)}
            className={`rounded border px-3 py-2 text-[13px] transition-colors ${
              value === o ? 'border-ink bg-ink text-paper' : 'border-field bg-card text-ink hover:border-ink'
            }`}
          >
            {copy.dashboard.availability[o]}
          </button>
        ))}
      </div>
      {error ? <p role="alert" className="mt-2 text-[12.5px] text-danger">{error}</p> : null}
      <p className="mt-2 text-[12.5px] text-gray">
        {value === 'PAUSED'
          ? 'ABC will not add you to new campaigns until you switch back.'
          : value === 'LIMITED'
            ? 'ABC will check with you before adding you to a campaign.'
            : 'ABC can add you to campaigns that match your categories.'}
      </p>
    </div>
  );
}
