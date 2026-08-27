import type { SyncStage } from '@/lib/api/types';

const statusLabel: Record<SyncStage['status'], string> = {
  pending: 'Queued',
  running: 'Syncing',
  done: 'Done',
  skipped: 'Skipped',
  failed: 'Failed',
};

export function SyncStages({ stages }: { stages: SyncStage[] }) {
  return (
    <ul aria-live="polite" className="divide-y divide-line rounded border border-edge bg-card">
      {stages.map((stage) => (
        <li key={stage.key} className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <div className={`text-[14px] ${stage.status === 'pending' ? 'text-fg-muted' : 'text-fg'}`}>
              {stage.label}
            </div>
            {stage.note ? <div className="mt-0.5 text-[12px] text-fg-muted">{stage.note}</div> : null}
          </div>
          <span
            className={`font-mono text-[10px] uppercase tracking-micro ${
              stage.status === 'running'
                ? 'text-fg motion-safe:animate-[abcPulse_1.6s_ease-in-out_infinite]'
                : stage.status === 'done'
                  ? 'text-fg'
                  : 'text-fg-muted'
            }`}
          >
            {statusLabel[stage.status]}
            {stage.status === 'running' && stage.progress && stage.progress.total > 0
              ? ` ${stage.progress.done}/${stage.progress.total}`
              : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}
