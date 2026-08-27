import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStep } from '@/lib/onboarding';
import { getCreator, getTaxonomies } from '@/lib/api/server';
import { Micro } from '@/components/ui/Micro';
import { ProfileForm } from '@/components/onboarding/ProfileForm';

export const metadata: Metadata = { title: 'Edit profile' };

export default async function EditProfilePage() {
  await requireStep('complete');
  const [taxonomies, creator] = await Promise.all([getTaxonomies(), getCreator()]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[560px] px-5 pb-16">
      <header className="flex items-center justify-between border-b border-edge py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center bg-ink font-bold text-[13px] text-lime">ABC</span>
          <Micro>Edit profile</Micro>
        </div>
        <Link href="/network" className="font-mono text-[11px] uppercase tracking-micro text-fg-muted hover:text-fg">
          ← Back
        </Link>
      </header>

      <h1 className="mt-8 text-[27px] font-medium tracking-[-0.02em] text-fg">Campaign preferences</h1>
      <p className="mt-2 text-[15px] text-fg-muted">
        ABC matches campaigns to these. Keep them current as your content evolves.
      </p>

      <div className="mt-8">
        <ProfileForm taxonomies={taxonomies} current={creator} mode="edit" />
      </div>
    </div>
  );
}
