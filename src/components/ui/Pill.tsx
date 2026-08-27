import type { ReactNode } from 'react';

type Tone = 'neutral' | 'lime' | 'warning' | 'muted';

const tones: Record<Tone, string> = {
  neutral: 'bg-pill text-fg border-edge',
  // Attention/active: ink on lime (the only informational use of lime).
  lime: 'bg-lime text-ink border-lime',
  warning: 'bg-ink text-paper border-ink',
  muted: 'bg-pill text-fg-muted border-edge',
};

export function Pill({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-micro ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
