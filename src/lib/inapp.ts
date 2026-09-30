// In-app browser detection for the Instagram sign-in hop. Social apps open
// links in their own embedded browsers; OAuth is least reliable there —
// Instagram's and Threads' can hand instagram.com back to the native app
// (which cannot show the consent dialog), and every in-app browser keeps its
// own cookie jar, separate from the phone's real browser.

export type InAppBrowser =
  | 'instagram'
  | 'threads'
  | 'facebook'
  | 'tiktok'
  | 'linkedin'
  | 'snapchat'
  | 'twitter'
  | 'line'
  | 'pinterest'
  | 'webview';

export type MobileOs = 'ios' | 'android' | 'other';

// Order matters: Threads' UA also carries "Instagram", and Meta's apps can
// carry FBAN/FBAV alongside their own token.
const RULES: [InAppBrowser, RegExp][] = [
  ['threads', /\bBarcelona\b/i],
  ['instagram', /\bInstagram\b/i],
  ['facebook', /\bFBA[NV]\/|\bFB_IAB\b|\bFBIOS\b|\bMessenger(?:ForiOS|LiteForiOS)?\b/i],
  ['tiktok', /\b(musical_ly|BytedanceWebview|TikTok|trill)\b/i],
  ['linkedin', /\bLinkedInApp\b/i],
  ['snapchat', /\bSnapchat\b/i],
  ['twitter', /\bTwitter(?:Android)?\b/i],
  ['line', /\bLine\/\d/i],
  ['pinterest', /\bPinterest\b/i],
];

export function detectInApp(ua: string): InAppBrowser | null {
  for (const [name, re] of RULES) if (re.test(ua)) return name;
  // Generic Android WebView (not Chrome Custom Tabs, which report as Chrome).
  if (/; wv\)/.test(ua) && /Android/.test(ua)) return 'webview';
  return null;
}

export function detectOs(ua: string): MobileOs {
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && /Mobile\//.test(ua))) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

// Meta's documented-by-behaviour way out of its own in-app browsers: the host
// app handles its extbrowser deep link and opens the URL in the real browser.
export function metaExternalBrowserUrl(app: 'instagram' | 'threads', target: string): string {
  const scheme = app === 'threads' ? 'barcelona' : 'instagram';
  return `${scheme}://extbrowser/?url=${encodeURIComponent(target)}`;
}

// Android: a package-less intent hands the page to the default browser.
export function androidIntentUrl(target: string): string {
  const u = new URL(target);
  return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(':', '')};S.browser_fallback_url=${encodeURIComponent(target)};end`;
}
