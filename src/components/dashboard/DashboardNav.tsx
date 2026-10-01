'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DashboardShell } from '@/lib/api/types';
import { copy } from '@/lib/copy';
import { relativeTime } from '@/lib/format';

const NAV = [
  { href: '/home', key: 'home', badge: null },
  { href: '/campaigns', key: 'campaigns', badge: 'campaigns' },
  { href: '/performance', key: 'performance', badge: null },
  { href: '/payments', key: 'payments', badge: 'payments' },
  { href: '/profile', key: 'profile', badge: null },
] as const;

function initials(name: string | null, handle: string | null) {
  const src = (name ?? handle ?? '').trim();
  const parts = src.split(/[\s._]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase() || '··';
}

// Dark sidebar on desktop, bottom tab bar on phones (where most creators are).
export function DashboardNav({ shell }: { shell: DashboardShell }) {
  const pathname = usePathname();
  const healthy = shell.instagram?.status === 'ACTIVE';

  return (
    <>
      <aside className="on-ink sticky top-0 hidden h-screen flex-col justify-between bg-surface px-3 py-5 text-paper lg:flex">
        <div>
          <div className="flex items-center gap-2.5 px-2 pb-5">
            <div className="flex h-[26px] w-[26px] items-center justify-center bg-lime text-[11px] font-bold text-ink">ABC</div>
            <span className="font-mono text-[10px] tracking-[0.14em] text-paper-dim/60">CREATOR</span>
          </div>
          <nav aria-label="Dashboard" className="flex flex-col gap-px">
            {NAV.map((n) => {
              const on = pathname === n.href || pathname.startsWith(`${n.href}/`);
              const count = n.badge ? shell.badges[n.badge] : 0;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? 'page' : undefined}
                  className={`flex items-center justify-between rounded px-2.5 py-2 text-[13.5px] transition-colors ${
                    on ? 'bg-[#242424] text-paper' : 'text-[#8c8c8c] hover:text-paper'
                  }`}
                >
                  {copy.dashboard.nav[n.key]}
                  {count ? <span className="bg-lime px-1.5 py-0.5 font-mono text-[9px] text-ink">{count}</span> : null}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="border-t border-ink-line px-2 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 flex-none items-center justify-center bg-ink-line text-[11px] font-semibold text-lime">
              {initials(shell.name, shell.handle)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-medium">@{shell.handle ?? '—'}</div>
              <div className="truncate font-mono text-[9.5px] uppercase text-[#888888]">
                {copy.dashboard.availability[shell.availability]}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 font-mono text-[9.5px] uppercase text-[#777777]">
            <span className={`h-1.5 w-1.5 rounded-full ${healthy ? 'bg-lime' : 'bg-[#ff7a6e]'}`} aria-hidden="true" />
            {healthy ? copy.dashboard.synced(relativeTime(shell.instagram?.lastSyncAt)) : 'Instagram needs reconnecting'}
          </div>
        </div>
      </aside>

      {/* Phones: bottom tabs, thumb-reachable, with safe-area padding. */}
      <nav
        aria-label="Dashboard"
        className="on-ink fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-ink-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {NAV.map((n) => {
          const on = pathname === n.href || pathname.startsWith(`${n.href}/`);
          const count = n.badge ? shell.badges[n.badge] : 0;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={on ? 'page' : undefined}
              className={`relative flex h-14 flex-col items-center justify-center gap-1 text-[11px] ${on ? 'text-lime' : 'text-[#8c8c8c]'}`}
            >
              <span className={`h-[3px] w-5 ${on ? 'bg-lime' : 'bg-transparent'}`} aria-hidden="true" />
              {copy.dashboard.nav[n.key]}
              {count ? (
                <span className="absolute right-[18%] top-2 min-w-4 bg-lime px-1 font-mono text-[9px] leading-4 text-ink">{count}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
