'use client';

import { copy } from '@/lib/copy';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useSyncPoll } from './useSyncPoll';

// Slim live progress strip on the profile step: sync runs in parallel while
// the creator fills the form.
export function SyncStrip() {
  const { current } = useSyncPoll();
  if (!current || current.status === 'no_connection') return null;

  const pct = current.overallPercent ?? 0;
  const done = current.status === 'idle';
  const failed = current.status === 'failed';

  return (
    <div className="rounded border border-edge bg-card px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-micro text-fg-muted">
          {done ? 'Instagram imported' : failed ? 'Import paused — will retry' : copy.profileStep.syncStripLabel}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-micro text-fg">{done ? '100%' : `${pct}%`}</span>
      </div>
      <ProgressBar value={done ? 100 : pct} label="Instagram import progress" />
    </div>
  );
}
