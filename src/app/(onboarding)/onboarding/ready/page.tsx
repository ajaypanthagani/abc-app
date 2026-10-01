import type { Metadata } from 'next';
import { requireStep } from '@/lib/onboarding';
import { getCreator } from '@/lib/api/server';
import { copy } from '@/lib/copy';
import { compactNumber } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Micro } from '@/components/ui/Micro';
import { StepBars } from '@/components/onboarding/StepBars';

export const metadata: Metadata = { title: "You're ready" };

// Step 3 of 3: shown once onboarding completes (profile done and the
// Instagram import finished). If the import is still running, requireStep
// sends the creator to the sync screen, which comes back here when done.
export default async function ReadyPage() {
  await requireStep('complete');
  const creator = await getCreator();
  const t = copy.ready;

  return (
    <div>
      <StepBars step={3} />
      <h2 className="text-[27px] font-medium tracking-[-0.02em] text-fg">{t.title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{t.sub}</p>

      <div className="mt-6 rounded border border-ink bg-ink p-5 text-paper">
        <Micro className="!text-lime">{t.howPaidTitle}</Micro>
        {t.howPaid.map((line) => (
          <p key={line} className="mt-3 text-[14px] leading-relaxed text-paper-dim">
            {line}
          </p>
        ))}
        <div className="mt-5 grid grid-cols-2 gap-px border-t border-ink-line pt-4">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-paper-dim/70">{t.statMedian}</div>
            <div className="mt-1 text-[22px] font-semibold tracking-[-0.03em]">{compactNumber(creator.metrics?.medianReelViews)}</div>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-paper-dim/70">{t.statReview}</div>
            <div className="mt-1 text-[16px] font-semibold">{t.statReviewValue}</div>
          </div>
        </div>
      </div>

      <Button href="/home" className="mt-6 h-14 w-full text-[16px]">
        {t.cta}
      </Button>
    </div>
  );
}
