import { Micro } from '@/components/ui/Micro';

// "Step N of 3" with the three progress bars from the onboarding design:
// 1 connect Instagram · 2 profile (+ import) · 3 ready.
export function StepBars({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-5">
      <div className="mb-3 flex gap-1" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-[3px] flex-1 ${i <= step ? 'bg-ink' : 'bg-line'}`} />
        ))}
      </div>
      <Micro>Step {step} of 3</Micro>
    </div>
  );
}
