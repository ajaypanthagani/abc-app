import type { Metadata } from 'next';
import { requireStep } from '@/lib/onboarding';
import { getCreator, getTaxonomies } from '@/lib/api/server';
import { copy } from '@/lib/copy';
import { Micro } from '@/components/ui/Micro';
import { Pill } from '@/components/ui/Pill';
import { ProfileForm } from '@/components/onboarding/ProfileForm';
import { SyncStrip } from '@/components/onboarding/SyncStrip';

export const metadata: Metadata = { title: 'Your profile' };

export default async function ProfileStepPage() {
  await requireStep('profile');
  const [taxonomies, creator] = await Promise.all([getTaxonomies(), getCreator()]);

  return (
    <div>
      <Micro>Step 1 of 2</Micro>
      <h2 className="mt-3 text-[27px] font-medium tracking-[-0.02em] text-fg">{copy.profileStep.title}</h2>
      <p className="mt-2 text-[15px] text-fg-muted">{copy.profileStep.sub}</p>

      {creator.instagram ? (
        <div className="mt-6 flex items-center justify-between rounded border border-edge bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center bg-ink font-mono text-[11px] uppercase text-lime">
              {creator.instagram.username.slice(0, 2)}
            </span>
            <div>
              <div className="text-[14px] font-medium text-fg">@{creator.instagram.username}</div>
              <div className="text-[12px] text-fg-muted">
                {creator.instagram.accountType === 'BUSINESS' ? 'Business account' : 'Creator account'}
              </div>
            </div>
          </div>
          <Pill tone="lime">Connected</Pill>
        </div>
      ) : null}

      <div className="mt-4">
        <SyncStrip />
      </div>

      <div className="mt-8">
        <ProfileForm taxonomies={taxonomies} current={creator} mode="onboarding" />
      </div>
    </div>
  );
}
