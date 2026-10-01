import { requireStep } from '@/lib/onboarding';
import { getShell } from '@/lib/api/server';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { ReconnectBanner } from '@/components/dashboard/ReconnectBanner';

// The creator dashboard: only for creators who finished onboarding.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireStep('complete');
  const shell = await getShell();
  const needsReconnect = shell.instagram?.status !== 'ACTIVE';

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[216px_1fr]">
      <DashboardNav shell={shell} />
      <main className="min-w-0 px-5 pb-28 pt-6 sm:px-8 lg:pb-16 lg:pt-7">
        <div className="mx-auto max-w-[1080px]">
          {needsReconnect ? <ReconnectBanner /> : null}
          {children}
        </div>
      </main>
    </div>
  );
}
