'use client';

import { copy } from '@/lib/copy';
import { Button } from '@/components/ui/Button';

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <h1 className="text-[24px] font-medium tracking-tight text-fg">{copy.errors.apiDown.title}</h1>
        <p className="mt-2 text-[15px] text-fg-muted">{copy.errors.apiDown.body}</p>
        <Button className="mt-6" onClick={reset}>
          {copy.errors.apiDown.cta}
        </Button>
      </div>
    </main>
  );
}
