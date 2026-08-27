import type { ReactNode } from 'react';

export function Banner({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded border border-ink bg-ink p-4 text-paper sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[14px]">{children}</p>
      {action}
    </div>
  );
}
