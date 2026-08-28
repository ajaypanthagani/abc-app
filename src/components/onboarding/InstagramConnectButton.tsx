'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

// Starts the Instagram OAuth flow via the /auth/instagram interstitial
// instead of navigating to instagram.com directly. A navigation to
// instagram.com that carries the tap's user gesture is eligible for
// app-link/universal-link interception: the phone hands the URL to the
// Instagram native app, which cannot render the OAuth consent dialog, and
// the flow dead-ends on the user's feed. The interstitial forwards from a
// fresh document without a gesture, which keeps the dialog in the browser
// (see InstagramRedirect).
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

  // Un-stick the button when the page is restored from the back-forward
  // cache (mobile Back from Instagram restores the old DOM, busy included).
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setBusy(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  function start() {
    if (busy) return;
    setBusy(true);
    window.location.assign('/auth/instagram');
  }

  return (
    <Button variant={variant} className={className} onClick={start} disabled={busy} aria-busy={busy}>
      {busy ? 'Opening Instagram…' : children}
    </Button>
  );
}
