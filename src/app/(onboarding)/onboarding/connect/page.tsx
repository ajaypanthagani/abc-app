import type { Metadata } from 'next';
import { requireStep } from '@/lib/onboarding';
import { copy } from '@/lib/copy';
import { InstagramConnectButton } from '@/components/onboarding/InstagramConnectButton';
import { Micro } from '@/components/ui/Micro';

export const metadata: Metadata = { title: 'Connect Instagram' };

// Reached when a signed-in profile has no active Instagram connection
// (e.g. access was revoked in Instagram settings). The permission grant
// itself happens on Instagram's own consent screen.
export default async function ConnectPage() {
  await requireStep('connect');

  return (
    <div>
      <h2 className="text-[27px] font-medium tracking-[-0.02em] text-fg">{copy.connect.title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{copy.connect.sub}</p>

      <div className="mt-7 rounded border border-edge bg-card">
        <div className="border-b border-edge px-4 py-3">
          <Micro>{copy.connect.accessTitle}</Micro>
        </div>
        <ul className="divide-y divide-line">
          {copy.connect.permissions.map((perm) => (
            <li key={perm.title} className="flex gap-3 px-4 py-3">
              <span aria-hidden="true" className="mt-1 flex size-4 shrink-0 items-center justify-center bg-lime text-[10px] font-bold text-ink">
                ✓
              </span>
              <div>
                <div className="text-[14px] font-medium text-fg">{perm.title}</div>
                <div className="text-[13px] text-fg-muted">{perm.detail}</div>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-edge px-4 py-3 text-[12px] text-fg-muted">{copy.connect.footer}</div>
      </div>

      <InstagramConnectButton className="mt-6 h-14 w-full text-[16px]">
        {copy.connect.cta}
      </InstagramConnectButton>
    </div>
  );
}
