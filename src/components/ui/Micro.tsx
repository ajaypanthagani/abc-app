import type { ReactNode } from 'react';

// The mono uppercase micro-label used for eyebrows, stat captions, statuses.
export function Micro({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[11px] uppercase tracking-micro text-fg-muted ${className}`}>
      {children}
    </span>
  );
}
