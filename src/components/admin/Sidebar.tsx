'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminClientFetch } from '@/lib/admin/client';
import type { Badges, StaffSession } from '@/lib/admin/types';
import { initials } from '@/lib/admin/format';

const NAV: { href: string; label: string; badge?: keyof Badges }[] = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/campaigns', label: 'Campaigns', badge: 'campaigns' },
  { href: '/admin/creators', label: 'Creators' },
  { href: '/admin/brands', label: 'Brands', badge: 'brands' },
  { href: '/admin/payments', label: 'Payments', badge: 'payments' },
  { href: '/admin/rates', label: 'Rate reviews', badge: 'rates' },
];

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Ops admin',
  BRAND_RELATIONSHIP_MANAGER: 'Brand RM',
  CAMPAIGN_MANAGER: 'Campaign manager',
  CREATOR_MANAGER: 'Creator manager',
  SUPPORT: 'Support',
  FINANCE: 'Finance',
};

export function Mark() {
  return (
    <div className="flex h-[26px] w-[26px] flex-none items-center justify-center bg-lime text-[11px] font-bold text-ink">ABC</div>
  );
}

export function Sidebar({ staff, badges }: { staff: StaffSession['staff']; badges: Badges }) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const active = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));
  const name = staff.displayName ?? staff.email ?? 'staff';

  async function signOut() {
    setBusy(true);
    try {
      await adminClientFetch('/auth/logout', { method: 'POST', body: {} });
    } finally {
      router.push('/admin/signin');
      router.refresh();
    }
  }

  return (
    <aside className="no-print flex flex-col justify-between bg-ink px-3 py-5 text-paper lg:sticky lg:top-0 lg:h-screen">
      <div>
        <div className="flex items-center gap-2.5 px-2 pb-[18px]">
          <Mark />
          <span className="font-mono text-[10px] tracking-[0.14em] text-gray">OPS</span>
        </div>
        <nav aria-label="Ops console" className="-mx-1 flex gap-px overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {NAV.map((n) => {
            const on = active(n.href);
            const count = n.badge ? badges[n.badge] : 0;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? 'page' : undefined}
                className={`flex flex-none items-center justify-between gap-2 px-2.5 py-2 text-[13px] transition-colors ${on ? 'bg-[#242424] text-paper' : 'text-[#8c8c8c] hover:text-paper'}`}
              >
                <span>{n.label}</span>
                {count ? (
                  <span className="bg-lime px-1.5 py-0.5 font-mono text-[9px] text-ink">{count}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-6 border-t border-ink-3 pt-[13px]">
        <div className="flex items-center gap-2.5 px-2">
          <div className="flex h-[30px] w-[30px] flex-none items-center justify-center bg-ink-3 text-[11px] font-semibold text-lime">
            {initials(name)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-medium">{name}</div>
            <div className="font-mono text-[9.5px] uppercase text-[#888888]">{ROLE_LABEL[staff.role] ?? staff.role}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          className="mt-3 h-[34px] w-full border border-[#333333] bg-transparent font-mono text-[10px] uppercase tracking-[0.1em] text-[#888888] hover:border-paper hover:text-paper disabled:opacity-50"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
