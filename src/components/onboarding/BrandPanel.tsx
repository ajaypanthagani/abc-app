import { copy } from '@/lib/copy';
import { Micro } from '@/components/ui/Micro';
import { Wordmark } from '@/components/ui/Wordmark';

// Left pitch panel on lg+; collapses to a compact ink band on mobile so the
// form stays above the fold.
export function BrandPanel() {
  return (
    <div className="on-ink bg-surface">
      {/* Mobile band */}
      <div className="flex items-center justify-between px-5 py-4 lg:hidden">
        <Wordmark tone="ink" />
        <Micro>{copy.pitch.eyebrow}</Micro>
      </div>

      {/* Full panel */}
      <div className="hidden min-h-screen flex-col justify-between p-14 lg:flex">
        <Wordmark tone="ink" />
        <div className="max-w-md">
          <Micro className="!text-lime">{copy.pitch.eyebrow}</Micro>
          <h1 className="mt-4 text-[44px] font-medium leading-[1.05] tracking-[-0.03em] text-paper">
            {copy.pitch.headline}
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-paper-dim">{copy.pitch.body}</p>
          <ol className="mt-9 space-y-4 border-t border-ink-line pt-7">
            {copy.pitch.points.map((point, i) => (
              <li key={point} className="flex gap-4 text-[14px] text-paper-dim">
                <span className="font-mono text-[11px] text-lime">{String(i + 1).padStart(2, '0')}</span>
                {point}
              </li>
            ))}
          </ol>
        </div>
        <Micro>Instagram · India · Early access</Micro>
      </div>
    </div>
  );
}
