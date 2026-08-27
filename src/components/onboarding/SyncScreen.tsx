'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { copy } from '@/lib/copy';
import { clientFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Micro } from '@/components/ui/Micro';
import type { SyncCurrent } from '@/lib/api/types';
import { SyncStages } from './SyncStages';
import { useSyncPoll } from './useSyncPoll';

// Full sync screen: shown when the profile step is already done but the
// backfill is still running. On completion the server decides where to go.
export function SyncScreen({ initial, username }: { initial: SyncCurrent; username: string | null }) {
  const { current, terminal, restart } = useSyncPoll(initial);
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (terminal && current?.status === 'idle') router.refresh();
  }, [terminal, current?.status, router]);

  const retry = async () => {
    setRetrying(true);
    try {
      await clientFetch('/v1/creators/me/sync', { method: 'POST' });
      restart();
    } finally {
      setRetrying(false);
    }
  };

  const failed = current?.status === 'failed';
  const pct = current?.overallPercent ?? 0;

  return (
    <div>
      <Micro>Step 2 of 2</Micro>
      <h2 className="mt-3 text-[27px] font-medium tracking-[-0.02em] text-fg">
        {username ? `Syncing @${username}` : copy.sync.title}
      </h2>
      <p className="mt-2 text-[15px] text-fg-muted">{copy.sync.sub}</p>

      <div className="mt-7">
        <ProgressBar value={pct} label="Sync progress" />
        <div className="mt-2 text-right font-mono text-[11px] uppercase tracking-micro text-fg-muted">{pct}%</div>
      </div>

      <div className="mt-4">{current?.stages ? <SyncStages stages={current.stages} /> : null}</div>

      {failed ? (
        <div className="mt-6 rounded border border-ink bg-ink p-4 text-paper">
          <p className="text-[15px] font-medium">{copy.sync.failed.title}</p>
          <p className="mt-1 text-[14px] text-paper-dim">{copy.sync.failed.body}</p>
          <Button variant="lime" className="mt-4" onClick={retry} disabled={retrying}>
            {retrying ? 'Retrying…' : copy.sync.failed.cta}
          </Button>
        </div>
      ) : (
        <p className="mt-6 text-[13px] text-fg-muted">{copy.sync.closeNote}</p>
      )}
    </div>
  );
}
