'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { clientFetch } from '@/lib/api/client';
import { copy } from '@/lib/copy';

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const signOut = async () => {
    setBusy(true);
    try {
      await clientFetch('/v1/auth/logout', { method: 'POST' });
    } finally {
      router.push('/signin');
      router.refresh();
    }
  };
  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="font-mono text-[11px] uppercase tracking-micro text-fg-muted underline-offset-4 hover:text-fg hover:underline disabled:opacity-50"
    >
      {copy.network.signOut}
    </button>
  );
}
