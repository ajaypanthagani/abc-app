'use client';

import { buttonClass } from '@/components/admin/ui';

export default function ConsoleError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-md border border-line bg-card p-6">
      <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.13em] text-faint">Something failed</div>
      <h1 className="text-[20px] font-semibold tracking-[-0.02em]">This page could not load</h1>
      <p className="mt-2 text-[13px] text-gray">{error.message || 'The API did not respond. Try again in a moment.'}</p>
      <button type="button" onClick={reset} className={buttonClass('ink', 'mt-5')}>
        Try again
      </button>
    </div>
  );
}
