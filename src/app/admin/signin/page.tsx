import type { Metadata } from 'next';
import { Mark } from '@/components/admin/Sidebar';
import { SignInForm } from '@/components/admin/SignInForm';

export const metadata: Metadata = { title: 'Internal sign in' };

export default async function AdminSignIn({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-12 text-paper">
      <div className="w-full max-w-[380px]">
        <div className="mb-10 flex items-center gap-3">
          <Mark />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray">Ops console</span>
        </div>
        <h1 className="mb-1.5 text-[28px] font-semibold tracking-[-0.03em]">Internal sign in</h1>
        <p className="mb-7 text-[14px] text-[#888888]">Accounts are provisioned by the platform team. There is no signup.</p>
        {reason === 'expired' ? (
          <p role="status" className="mb-4 border border-ink-3 bg-ink-2 px-3.5 py-2.5 text-[13px] text-paper-dim">
            Your session ended. Sign in again to continue.
          </p>
        ) : null}
        <SignInForm />
        <div className="mt-5 flex justify-between font-mono text-[10.5px] text-[#555555]">
          <span>STAFF ACCOUNTS ONLY</span>
          <span>SESSION 8H</span>
        </div>
        <div className="mt-7 border border-ink-3 bg-ink-2 px-[15px] py-[13px] font-mono text-[10.5px] leading-relaxed text-[#777777]">
          Access is logged. Creator rates, payouts and margins shown here are internal and never shared with brands or
          creators.
        </div>
      </div>
    </div>
  );
}
