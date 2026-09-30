'use client';

import { useEffect, useState, type ReactNode } from 'react';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded px-5 text-[15px] font-medium transition-colors aria-busy:opacity-70';
const variants = {
  primary: 'bg-ink text-paper hover:bg-black border border-ink',
  lime: 'bg-lime text-ink hover:bg-lime-hover border border-lime hover:border-lime-hover',
  ghost: 'bg-transparent text-fg border border-edge hover:border-fg',
} as const;

// Starts Instagram sign-in by navigating to /auth/instagram, the server-rendered
// hop that forwards to Instagram's consent dialog without a user gesture (see
// app/auth/instagram/route.ts for why the gesture matters on phones).
//
// It is a real link, not a JS button: a tap works the instant the page is
// visible, before (or without) hydration — a slow phone used to ignore taps
// until the bundle had loaded, which read as "stuck". Once hydrated it also
// shows a pressed state. Not next/link: /auth/instagram is a route handler
// that must load as a full document.
export function InstagramConnectButton({
  children,
  variant = 'primary',
  className = '',
  switchAccount = false,
  returnTo,
}: {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
  switchAccount?: boolean;
  returnTo?: string;
}) {
  const [busy, setBusy] = useState(false);

  // Back from Instagram can restore this page from the back-forward cache
  // with the pressed state still showing; reset it.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setBusy(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const params = new URLSearchParams();
  if (switchAccount) params.set('switch', '1');
  if (returnTo) params.set('returnTo', returnTo);
  const href = `/auth/instagram${params.size ? `?${params.toString()}` : ''}`;

  return (
    <a
      href={href}
      onClick={() => setBusy(true)}
      aria-busy={busy}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {busy ? 'Opening Instagram…' : children}
    </a>
  );
}
