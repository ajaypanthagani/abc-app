import type { Metadata } from 'next';
import Link from 'next/link';
import { getHome, getShell } from '@/lib/api/server';
import { copy } from '@/lib/copy';
import { compactNumber, monthLabel, percent, rupees, rupeesCompact, windowRange } from '@/lib/format';
import { Card, Empty, PageHead, StatGrid, StatusTag } from '@/components/dashboard/ui';

export const metadata: Metadata = { title: 'Home' };

export default async function HomePage() {
  const [home, shell] = await Promise.all([getHome(), getShell()]);
  const t = copy.dashboard.home;
  const s = home.stats;
  const max = Math.max(1, ...home.earnings.map((m) => m.amountMinor));
  const total = home.earnings.reduce((a, m) => a + m.amountMinor, 0);
  const today = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(new Date()).toUpperCase();

  return (
    <div>
      <PageHead eyebrow={t.eyebrow} title={t.welcome(shell.name)} aside={today} />

      <StatGrid
        items={[
          { label: t.statPaid, value: rupees(s.paidToDateMinor), note: s.paidCampaigns ? `Across ${s.paidCampaigns} campaign${s.paidCampaigns === 1 ? '' : 's'}` : 'No payouts yet' },
          { label: t.statClearing, value: rupees(s.clearingMinor), note: s.clearingCount ? `${s.clearingCount} payout${s.clearingCount === 1 ? '' : 's'} in progress` : 'Nothing in progress' },
          { label: t.statViews, value: compactNumber(s.eligibleViews90d), note: 'Counted for payout' },
          {
            label: t.statCompletion,
            value: s.completionRate === null ? '—' : percent(s.completionRate, 0),
            note: s.finishedCampaigns ? `Of ${s.finishedCampaigns} finished campaign${s.finishedCampaigns === 1 ? '' : 's'}` : 'After your first campaign',
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Card title={t.earningsTitle} aside={`${rupees(total)} total`}>
          <div className="flex h-[170px] items-end gap-2 px-4 pb-3 pt-6" role="img" aria-label={`Earnings by month, ${rupees(total)} total`}>
            {home.earnings.map((m) => {
              const top = m.amountMinor === max && m.amountMinor > 0;
              return (
                <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="font-mono text-[9.5px] text-gray">{m.amountMinor ? rupeesCompact(m.amountMinor) : '—'}</span>
                  <div
                    className={`w-full ${top ? 'bg-lime' : m.amountMinor ? 'bg-ink' : 'bg-[#eeeee8]'}`}
                    style={{ height: `${m.amountMinor ? Math.max(6, (m.amountMinor / max) * 100) : 3}%` }}
                  />
                  <span className="font-mono text-[9.5px] uppercase text-faint">{monthLabel(m.month)}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <section>
          <div className="mb-2.5 flex items-baseline justify-between">
            <h2 className="text-[16px] font-semibold tracking-[-0.02em]">{t.upNextTitle}</h2>
            <span className="font-mono text-[10px] uppercase text-faint">{t.upNextAside}</span>
          </div>
          {home.upNext.length === 0 ? (
            <Card>
              <Empty>{t.upNextEmpty}</Empty>
            </Card>
          ) : (
            <div className="flex flex-col gap-2.5">
              {home.upNext.map((u) => (
                <Link key={u.id} href={`/campaigns#${u.id}`} className="block border border-line bg-card p-4 hover:border-ink">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <StatusTag tone={u.stage.tone}>{u.stage.label}</StatusTag>
                    <span className="font-mono text-[9.5px] uppercase text-gray">
                      {u.daysLeft !== null ? `${u.daysLeft} days left` : `Live ${windowRange(u.liveFrom, u.liveTo)}`}
                    </span>
                  </div>
                  <div className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{u.campaign}</div>
                  <div className="mt-0.5 text-[12.5px] text-gray">
                    {u.brand}
                    {u.deliverables ? ` · ${u.deliverables}` : ''}
                  </div>
                  <p className="mt-2.5 text-[13px] text-ink">{u.stage.next}</p>
                  <div className="mt-3 flex items-baseline justify-between border-t border-pill pt-2.5">
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">{t.upTo}</span>
                    <span className="font-mono text-[14px] font-semibold tabular-nums">{rupees(u.maxPayoutMinor)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
