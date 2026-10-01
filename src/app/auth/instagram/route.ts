import { SERVER_API_URL } from '@/lib/api/shared';
import { androidIntentUrl, detectInApp, detectOs, metaExternalBrowserUrl, type InAppBrowser } from '@/lib/inapp';

// The hop between "Continue with Instagram" and Instagram's consent dialog.
//
// It is a plain server-rendered document on purpose — no React, no bundle to
// download, nothing to hydrate — and it moves on by itself as soon as it is
// parsed:
//  * The browser leaves for instagram.com from a freshly loaded document, never
//    from a tap. On Android, Instagram's app claims every instagram.com URL
//    (assetlinks handle_all_urls, no exclusions) and Chrome hands a
//    tap-initiated navigation — or a redirect riding one — to that app, which
//    cannot render the consent dialog and dead-ends on the feed. A load-time
//    navigation carries no user activation, so it stays in the browser. (iOS
//    is covered by the #weblink + trailing-slash URL the API builds.)
//  * The authorize URL is fetched here, server-to-server over the private
//    network, instead of by the phone after a second JS bundle — the old path
//    that sat on "Opening Instagram…" on slow phones.
//  * Instagram's and Threads' in-app browsers can hand instagram.com back to the
//    native app too; there we first offer (and on iOS attempt) Meta's own
//    extbrowser hand-off to the phone's real browser.
// Every state has a visible way forward: retry, back, or open in the browser.

export const dynamic = 'force-dynamic';

const PASSTHROUGH = ['returnTo', 'switch', 'as', 'account_type', 'followers'] as const;
const API_TIMEOUT_MS = 8_000;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = publicOrigin(request, url);
  const ua = request.headers.get('user-agent') ?? '';
  const inApp = detectInApp(ua);
  const os = detectOs(ua);

  const forward = new URLSearchParams();
  for (const key of PASSTHROUGH) {
    const v = url.searchParams.get(key);
    if (v) forward.set(key, v);
  }
  const qs = forward.toString();
  const self = `${origin}/auth/instagram${qs ? `?${qs}` : ''}`;
  const stayHere = `/auth/instagram?${new URLSearchParams([...forward, ['stay', '1']]).toString()}`;

  if ((inApp === 'instagram' || inApp === 'threads') && !url.searchParams.has('stay')) {
    return html(escapePage({ app: inApp, os, target: self, stayHere }));
  }

  const authorizeUrl = await fetchAuthorizeUrl(qs, clientIp(request));
  if (!authorizeUrl) return html(errorPage(`/auth/instagram${qs ? `?${qs}` : ''}`), 503);
  return html(redirectPage({ authorizeUrl, retry: `/auth/instagram${qs ? `?${qs}` : ''}`, inApp, os, self }));
}

async function fetchAuthorizeUrl(qs: string, ip: string | null): Promise<string | null> {
  const endpoint = `${SERVER_API_URL}/v1/auth/instagram/url${qs ? `?${qs}` : ''}`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(endpoint, {
        cache: 'no-store',
        headers: { accept: 'application/json', ...(ip ? { 'x-forwarded-for': ip } : {}) },
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      });
      if (res.ok) {
        const body = (await res.json()) as { url?: string };
        if (body.url) return body.url;
      }
      // 4xx (e.g. throttled) will not get better on an immediate retry.
      if (res.status < 500) return null;
    } catch {
      // network error / timeout: one quick retry
    }
  }
  return null;
}

function publicOrigin(request: Request, url: URL): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? url.host;
  const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  return `${proto}://${host}`;
}

function clientIp(request: Request): string | null {
  // Behind Cloudflare the edge addresses below are Cloudflare's; the visitor's
  // own address is in CF-Connecting-IP.
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  const xff = request.headers.get('x-forwarded-for');
  if (!xff) return null;
  const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

// ── HTML ──────────────────────────────────────────────────────────────────

const escHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Safe inside an inline <script>: no "</script>" or HTML-significant chars.
const jsString = (s: string) => JSON.stringify(s).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

function html(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Every visit mints a fresh single-use OAuth state.
      'cache-control': 'no-store, private',
      'x-robots-tag': 'noindex',
    },
  });
}

function shell(title: string, head: string, main: string) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escHtml(title)} · ABC</title>
${head}
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #fafaf7; color: #111; font: 16px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased; padding: 24px; }
  main { width: 100%; max-width: 380px; text-align: center; }
  .dot { width: 12px; height: 12px; background: #c7ff32; margin: 0 auto 20px; animation: pulse 1.2s ease-in-out infinite; }
  h1 { font-size: 19px; font-weight: 600; margin: 0 0 8px; letter-spacing: -0.01em; }
  p { font-size: 14px; color: #666; margin: 0 0 12px; }
  .actions { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
  .btn { display: block; padding: 14px 16px; border-radius: 2px; font-size: 15px; font-weight: 600;
    text-decoration: none; border: 1px solid #111; }
  .btn.primary { background: #111; color: #fafaf7; }
  .btn.lime { background: #c7ff32; color: #111; border-color: #c7ff32; }
  .btn.ghost { background: transparent; color: #111; border-color: #dcdcd6; font-weight: 500; }
  .note { font-size: 12.5px; color: #666; border-top: 1px solid #e6e6e0; padding-top: 14px; margin-top: 18px; }
  .later { opacity: 0; animation: reveal 0.3s ease 6s forwards; }
  @keyframes pulse { 50% { opacity: 0.35; } }
  @keyframes reveal { to { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
</style>
</head><body><main>${main}</main></body></html>`;
}

function browserHelp(inApp: InAppBrowser | null, os: string, self: string) {
  if (!inApp) return '';
  const android = os === 'android'
    ? `<a class="btn ghost" href="${escHtml(androidIntentUrl(self))}">Open in my browser</a>`
    : '';
  return `<p class="note">Stuck inside an app? Signing in works best in your phone's browser${
    os === 'ios' ? ' — tap <b>•••</b> or the share icon, then <b>Open in browser</b>.' : '.'
  }</p>${android}`;
}

function redirectPage(o: { authorizeUrl: string; retry: string; inApp: InAppBrowser | null; os: string; self: string }) {
  // Two gesture-free ways out, whichever fires first: the inline script (runs
  // while the head is parsed) and the meta refresh (works without JS).
  const head = `<link rel="preconnect" href="https://www.instagram.com">
<meta http-equiv="refresh" content="0;url=${escHtml(o.authorizeUrl)}">
<script>
  location.replace(${jsString(o.authorizeUrl)});
  // Restored from the back-forward cache (Back from Instagram): don't sit on a
  // spent redirect — go back to sign-in.
  addEventListener('pageshow', function (e) { if (e.persisted) location.replace('/signin'); });
</script>`;
  const main = `<div class="dot" aria-hidden="true"></div>
<h1 role="status">Opening Instagram…</h1>
<p>You'll confirm access on instagram.com. If your browser isn't signed in to Instagram, it asks you to log in there first.</p>
<div class="later">
  <div class="actions">
    <a class="btn primary" href="${escHtml(o.retry)}">Still here? Try again</a>
    <a class="btn ghost" href="/signin">Back to sign in</a>
  </div>
  ${browserHelp(o.inApp, o.os, o.self)}
</div>`;
  return shell('Opening Instagram', head, main);
}

function escapePage(o: { app: 'instagram' | 'threads'; os: string; target: string; stayHere: string }) {
  const appName = o.app === 'threads' ? 'Threads' : 'Instagram';
  const extbrowser = metaExternalBrowserUrl(o.app, o.target);
  // iOS: Meta's app honours its extbrowser link when it arrives declaratively
  // while the page parses (a scripted jump is dropped). One attempt only; if
  // it is ignored the buttons below remain. Android gets explicit buttons.
  const head = o.os === 'ios' ? `<meta http-equiv="refresh" content="0;url=${escHtml(extbrowser)}">` : '';
  const primary =
    o.os === 'android'
      ? `<a class="btn lime" href="${escHtml(androidIntentUrl(o.target))}">Open in my browser</a>
    <a class="btn ghost" href="${escHtml(extbrowser)}">Try ${appName}'s browser switch</a>`
      : `<a class="btn lime" href="${escHtml(extbrowser)}">Open in my browser</a>`;
  const main = `<div class="dot" aria-hidden="true"></div>
<h1>Continue in your browser</h1>
<p>You opened this inside ${appName}. Instagram sign-in often gets stuck in ${appName}'s built-in browser, so it's best finished in your phone's browser.</p>
<div class="actions">
  ${primary}
  <a class="btn ghost" href="${escHtml(o.stayHere)}">Continue here anyway</a>
</div>
<p class="note">If nothing happens, tap <b>•••</b> at the top right and choose <b>Open in external browser</b>.</p>`;
  return shell('Continue in your browser', head, main);
}

function errorPage(retry: string) {
  const main = `<h1>Couldn't reach Instagram sign-in</h1>
<p>Nothing was changed. This is usually a brief network hiccup.</p>
<div class="actions">
  <a class="btn primary" href="${escHtml(retry)}">Try again</a>
  <a class="btn ghost" href="/signin">Back to sign in</a>
</div>`;
  return shell('Sign-in unavailable', '', main);
}
