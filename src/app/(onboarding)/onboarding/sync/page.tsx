import type { Metadata } from 'next';
import { requireStep } from '@/lib/onboarding';
import { getCreator, getSyncCurrent } from '@/lib/api/server';
import { SyncScreen } from '@/components/onboarding/SyncScreen';

export const metadata: Metadata = { title: 'Syncing' };

// Only reached when the profile step is done but the backfill is still
// running (or failed). Completion routes onward server-side.
export default async function SyncPage() {
  await requireStep('sync');
  const [current, creator] = await Promise.all([getSyncCurrent(), getCreator()]);

  return <SyncScreen initial={current} username={creator.instagram?.username ?? null} />;
}
