'use client';

import { useState, type ReactNode } from 'react';
import { apiUrl } from '@/lib/api/shared';
import { Button } from '@/components/ui/Button';

// Starts the Instagram OAuth flow with a script navigation instead of a
// plain <a href>. A tapped link to instagram.com (or a server 302 riding
// that tap) is eligible for universal-link/app-link interception on phones,
// which hands the OAuth URL to the Instagram app — and the app cannot render
// the consent dialog, so the flow dead-ends on the user's feed.
// window.location.assign is not eligible for interception, keeping the whole
// flow in the browser.
export function InstagramConnectButton({
  children,
  variant,
  className,
}: {
  children: ReactNode;
  variant?: 'primary' | 'lime' | 'ghost';
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function start() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl('/v1/auth/instagram/url'));
      if (!res.ok) throw new Error(`start_url_${res.status}`);
      const { url } = (await res.json()) as { url: string };
      window.location.assign(url);
    } catch {
      // Don't strand the tap — the redirecting endpoint still completes the
      // flow, just without the interception safeguard.
      window.location.assign(apiUrl('/v1/auth/instagram/start'));
    }
  }

  return (
    <Button variant={variant} className={className} onClick={start} disabled={busy} aria-busy={busy}>
      {busy ? 'Opening Instagram…' : children}
    </Button>
  );
}
