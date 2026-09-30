import { describe, expect, it } from 'vitest';
import { androidIntentUrl, detectInApp, detectOs, metaExternalBrowserUrl } from '../inapp';

const UA = {
  iosSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
  iosInstagram:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.25.94 (iPhone15,2; iOS 18_5; en_IN; en-IN; scale=3.00; 1179x2556; 648338402)',
  androidInstagram:
    'Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.127 Mobile Safari/537.36 Instagram 348.0.0.40.109 Android (34/14; 480dpi; 1080x2340; samsung; SM-S918B; dm3q; qcom; en_IN; 640171524)',
  iosThreads:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Barcelona 350.0.0.0.0 Instagram 350.0.0.25.94',
  iosFacebook:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/480.0.0.40.108;FBBV/650000000;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/18.5;FBSS/3;FBLC/en_US;FBOP/5]',
  androidTikTok:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.0.0 Mobile Safari/537.36 trill_360000 BytedanceWebview/d8a21c6',
  androidWebview:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.0.0 Mobile Safari/537.36',
  desktopChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
};

describe('in-app browser detection', () => {
  it('leaves real browsers alone', () => {
    expect(detectInApp(UA.iosSafari)).toBeNull();
    expect(detectInApp(UA.androidChrome)).toBeNull();
    expect(detectInApp(UA.desktopChrome)).toBeNull();
  });

  it('recognises Meta and other social in-app browsers', () => {
    expect(detectInApp(UA.iosInstagram)).toBe('instagram');
    expect(detectInApp(UA.androidInstagram)).toBe('instagram');
    expect(detectInApp(UA.iosThreads)).toBe('threads');
    expect(detectInApp(UA.iosFacebook)).toBe('facebook');
    expect(detectInApp(UA.androidTikTok)).toBe('tiktok');
    expect(detectInApp(UA.androidWebview)).toBe('webview');
  });

  it('detects the OS', () => {
    expect(detectOs(UA.iosInstagram)).toBe('ios');
    expect(detectOs(UA.androidInstagram)).toBe('android');
    expect(detectOs(UA.desktopChrome)).toBe('other');
  });

  it('builds escape URLs', () => {
    const target = 'https://app.adsbycreators.com/auth/instagram?returnTo=%2Fnetwork';
    expect(metaExternalBrowserUrl('instagram', target)).toBe(
      'instagram://extbrowser/?url=https%3A%2F%2Fapp.adsbycreators.com%2Fauth%2Finstagram%3FreturnTo%3D%252Fnetwork',
    );
    expect(metaExternalBrowserUrl('threads', target).startsWith('barcelona://extbrowser/?url=')).toBe(true);
    expect(androidIntentUrl(target)).toBe(
      'intent://app.adsbycreators.com/auth/instagram?returnTo=%2Fnetwork#Intent;scheme=https;S.browser_fallback_url=https%3A%2F%2Fapp.adsbycreators.com%2Fauth%2Finstagram%3FreturnTo%3D%252Fnetwork;end',
    );
  });
});
