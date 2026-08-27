/**
 * The brand wordmark, identical to the marketing site's: script "abc" mark
 * (black + lime shadow) with the company name. `tone="ink"` swaps in the
 * inverted mark (paper glyphs) for dark surfaces.
 */
export function Wordmark({ tone = 'paper' }: { tone?: 'paper' | 'ink' }) {
  const onInk = tone === 'ink';
  return (
    <span className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={onInk ? '/logo-mark-inverse.png' : '/logo-mark.png'}
        alt=""
        width={258}
        height={120}
        decoding="async"
        className="h-7 w-auto"
      />
      <span aria-hidden="true" className={`h-5 w-px ${onInk ? 'bg-ink-line' : 'bg-line'}`} />
      <span className={`text-[15px] font-medium tracking-[-0.01em] ${onInk ? 'text-paper' : 'text-ink'}`}>
        Ads By Creators
      </span>
    </span>
  );
}
