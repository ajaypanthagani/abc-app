'use client';

import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '@/lib/api/shared';

// Forwards to the Instagram OAuth dialog from a freshly loaded document.
// Because this navigation carries NO user gesture, mobile browsers will not
// hand it to the Instagram native app (Android App Links / iOS Universal
// Links both require user activation to launch an app) — the consent dialog
// opens in the browser, which is the only place it can render. Navigating
// straight from the tapped button kept the gesture alive and let Android
// hand the URL to the Instagram app, dead-ending the flow on the feed.
export function InstagramRedirect() {
  const started = useRef(false);
  const [slow, setSlow] = useState(false);

  // If a browser ever restores this page from the back-forward cache the
  // effect below won't re-run — reload so the redirect fires fresh.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const slowTimer = setTimeout(() => setSlow(true), 8000);
    (async () => {
      try {
        const res = await fetch(apiUrl('/v1/auth/instagram/url'));
        if (!res.ok) throw new Error(`start_url_${res.status}`);
        const { url } = (await res.json()) as { url: string };
        // replace() keeps this page out of history: Back from Instagram
        // returns to /signin instead of re-triggering the redirect.
        window.location.replace(url);
      } catch {
        window.location.replace('/signin?error=ig_error');
      }
    })();
    return () => clearTimeout(slowTimer);
  }, []);

  return (
    <div role="status" className="flex flex-col items-center gap-4 text-center">
      <span aria-hidden="true" className="size-3 animate-pulse bg-lime" />
      <p className="text-[17px] font-medium text-fg">Opening Instagram…</p>
      <p className="max-w-[36ch] text-[14px] leading-relaxed text-fg-muted">
        You&apos;ll confirm access on instagram.com. If your browser isn&apos;t signed in to
        Instagram, it asks you to log in there first.
      </p>
      {slow ? (
        <a href="/signin" className="text-[14px] underline underline-offset-4">
          Taking too long? Go back and try again
        </a>
      ) : null}
    </div>
  );
}
