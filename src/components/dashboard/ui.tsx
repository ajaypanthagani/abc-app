import type { ReactNode } from 'react';
import type { StageTone } from '@/lib/api/types';

// Dashboard primitives (creator side): square, hairline, mono micro-labels.

export function PageHead({ eyebrow, title, aside }: { eyebrow: string; title: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{eyebrow}</div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[28px]">{title}</h1>
      </div>
      {aside ? <div className="font-mono text-[10.5px] uppercase text-gray">{aside}</div> : null}
    </div>
  );
}

export function StatGrid({ items }: { items: { label: string; value: ReactNode; note?: ReactNode }[] }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
      {items.map((s) => (
        <div key={s.label} className="min-w-0 bg-card p-4">
          <div className="font-mono text-[9px] uppercase tracking-[0.11em] text-faint">{s.label}</div>
          <div className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-ink tabular-nums">{s.value}</div>
          {s.note ? <div className="mt-0.5 text-[12px] text-gray">{s.note}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function Card({ title, aside, children, className = '' }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`border border-line bg-card ${className}`}>
      {title ? (
        <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.13em] text-faint">{title}</span>
          {aside ? <span className="font-mono text-[9.5px] uppercase text-gray">{aside}</span> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

const TONE: Record<StageTone, string> = {
  hot: 'bg-lime text-ink',
  ink: 'bg-ink text-paper',
  soft: 'bg-pill text-gray',
  muted: 'border border-field text-gray',
};

export function StatusTag({ tone, children }: { tone: StageTone; children: ReactNode }) {
  return (
    <span className={`inline-flex whitespace-nowrap px-1.5 py-[3px] font-mono text-[9px] uppercase tracking-[0.08em] ${TONE[tone]}`}>
      {children}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-7 text-[14px] leading-relaxed text-gray">{children}</p>;
}
