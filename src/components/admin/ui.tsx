import Link from 'next/link';
import type { ReactNode } from 'react';

// Ops console primitives — square, hairline, mono micro-labels (ops design).

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`font-mono text-[10px] uppercase tracking-[0.16em] text-faint ${className}`}>{children}</div>
  );
}

export function Micro({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`font-mono text-[9px] uppercase tracking-[0.13em] text-faint ${className}`}>{children}</span>;
}

export function PageHeader({
  eyebrow,
  title,
  actions,
  back,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-5">
      {back ? (
        <Link
          href={back.href}
          className="mb-4 inline-flex h-[34px] items-center border border-field bg-card px-3.5 font-mono text-[10px] uppercase tracking-[0.08em] text-gray hover:border-ink hover:text-ink"
        >
          ← {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Eyebrow className="mb-[7px]">{eyebrow}</Eyebrow>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-ink">{title}</h1>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-1.5">{actions}</div> : null}
      </div>
    </div>
  );
}

export function KpiStrip({
  items,
  cols = 6,
}: {
  items: { label: string; value: ReactNode; note?: ReactNode; tone?: 'danger' }[];
  cols?: 4 | 6;
}) {
  return (
    <div
      className={`mb-5 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 ${cols === 6 ? 'xl:grid-cols-6' : 'lg:grid-cols-4'}`}
    >
      {items.map((s) => (
        <div key={s.label} className="bg-card p-4">
          <div className="font-mono text-[8.5px] uppercase tracking-[0.11em] text-faint">{s.label}</div>
          <div
            className={`tabular mb-[3px] mt-[7px] text-[22px] font-semibold tracking-[-0.03em] ${s.tone === 'danger' ? 'text-danger' : 'text-ink'}`}
          >
            {s.value}
          </div>
          {s.note ? <div className={`text-[11.5px] ${s.tone === 'danger' ? 'text-danger' : 'text-gray'}`}>{s.note}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function Panel({
  title,
  aside,
  children,
  className = '',
  pad = false,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section className={`border border-line bg-card ${className}`}>
      {title ? (
        <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
          <Micro>{title}</Micro>
          {aside ? <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-gray">{aside}</span> : null}
        </div>
      ) : null}
      <div className={pad ? 'p-[18px]' : ''}>{children}</div>
    </section>
  );
}

export function InkPanel({ title, children, className = '' }: { title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`border border-line bg-ink p-5 text-paper ${className}`}>
      <div className="mb-3.5 font-mono text-[9px] uppercase tracking-[0.13em] text-lime">{title}</div>
      {children}
    </section>
  );
}

export function InkRow({ label, value, tone }: { label: ReactNode; value: ReactNode; tone?: 'lime' | 'danger' }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink-3 pb-[11px] last:border-0 last:pb-0">
      <span className="text-[13px] text-[#999999]">{label}</span>
      <span
        className={`tabular text-right font-mono text-[13px] font-medium ${tone === 'lime' ? 'text-lime' : tone === 'danger' ? 'text-danger-soft' : 'text-paper'}`}
      >
        {value}
      </span>
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-ink">{children}</h2>
      {aside ? <span className="font-mono text-[10px] uppercase text-faint">{aside}</span> : null}
    </div>
  );
}

type TagTone = 'hot' | 'soft' | 'ink' | 'danger' | 'outline';
const TAG: Record<TagTone, string> = {
  hot: 'bg-lime text-ink',
  soft: 'bg-pill text-gray',
  ink: 'bg-ink text-lime',
  danger: 'bg-danger text-white',
  outline: 'border border-field text-gray',
};

export function Tag({ tone = 'soft', children, className = '' }: { tone?: TagTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap px-1.5 py-[3px] font-mono text-[8.5px] uppercase tracking-[0.08em] ${TAG[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Bar({ value, tone = 'ink', className = '' }: { value: number | null; tone?: 'ink' | 'danger' | 'hush' | 'lime'; className?: string }) {
  const w = value === null ? 0 : Math.max(0, Math.min(100, value * 100));
  const fill = { ink: 'bg-ink', danger: 'bg-danger', hush: 'bg-hush', lime: 'bg-lime' }[tone];
  return (
    <div className={`h-[5px] bg-pill ${className}`}>
      <div className={`h-[5px] ${fill}`} style={{ width: `${w}%` }} />
    </div>
  );
}

export function Avatar({ text, size = 28 }: { text: string; size?: number }) {
  return (
    <div
      className="flex flex-none items-center justify-center bg-ink font-semibold text-lime"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {text}
    </div>
  );
}

const BTN = {
  ink: 'h-10 bg-ink px-[18px] text-[13.5px] font-semibold text-paper hover:bg-black border border-ink',
  lime: 'h-10 bg-lime px-[18px] text-[13.5px] font-semibold text-ink hover:bg-lime-hover border border-lime',
  ghost:
    'h-9 border border-field bg-card px-[13px] font-mono text-[9.5px] uppercase tracking-[0.07em] text-gray hover:border-ink hover:text-ink',
  inkMono: 'h-9 border border-ink bg-ink px-[13px] font-mono text-[9.5px] uppercase tracking-[0.07em] text-paper hover:bg-black',
  hotMono: 'h-[30px] border border-ink bg-ink px-2.5 font-mono text-[9px] uppercase tracking-[0.06em] text-lime hover:bg-black',
  smallGhost:
    'h-[28px] border border-field bg-card px-2.5 font-mono text-[9px] uppercase tracking-[0.06em] text-gray hover:border-ink hover:text-ink',
  danger:
    'h-9 border border-field bg-card px-[13px] font-mono text-[9.5px] uppercase tracking-[0.07em] text-gray hover:border-danger hover:text-danger',
} as const;
export type ButtonKind = keyof typeof BTN;
export const buttonClass = (kind: ButtonKind, extra = '') =>
  `inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-40 ${BTN[kind]} ${extra}`;

export function LinkButton({ href, kind = 'ghost', children, className = '' }: { href: string; kind?: ButtonKind; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={buttonClass(kind, className)}>
      {children}
    </Link>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-8 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-faint">{children}</div>;
}

// Column header row for grid tables.
export function GridHead({ cols, children }: { cols: string; children: ReactNode }) {
  return (
    <div
      className="hidden gap-[11px] border-b border-line px-4 py-[11px] font-mono text-[8.5px] uppercase tracking-[0.1em] text-faint md:grid"
      style={{ gridTemplateColumns: cols }}
    >
      {children}
    </div>
  );
}

export function GridRow({ cols, children, className = '' }: { cols: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={`grid grid-cols-2 items-center gap-x-[11px] gap-y-1.5 border-b border-pill px-4 py-[11px] last:border-0 md:[grid-template-columns:var(--cols)] ${className}`}
      style={{ ['--cols' as string]: cols }}
    >
      {children}
    </div>
  );
}
