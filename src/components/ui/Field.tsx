import type { ReactNode } from 'react';

// Every input gets a real label (the mockup had none).
export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block font-mono text-[11px] uppercase tracking-micro text-fg">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-[13px] text-fg-muted">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-[13px] font-medium text-fg" role="alert">{error}</p> : null}
    </div>
  );
}
