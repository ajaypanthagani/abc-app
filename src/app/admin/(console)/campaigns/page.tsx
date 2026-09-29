import type { Metadata } from 'next';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin/server';
import type { CampaignList, CampaignRow } from '@/lib/admin/types';
import { bps, rupeesShort, shortDate, windowLabel } from '@/lib/admin/format';
import { CAMPAIGN_STATUS } from '@/components/admin/status';
import { CsvButton } from '@/components/admin/CsvButton';
import { Empty, GridHead, LinkButton, PageHeader, Tag, buttonClass } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Campaigns' };

const FILTERS: [string, string][] = [
  ['', 'All'],
  ['awaiting_mix', 'Awaiting mix'],
  ['mix_proposed', 'Mix proposed'],
  ['scheduled', 'Scheduled'],
  ['ongoing', 'Ongoing'],
  ['measuring', 'Measuring'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
];

// Primary action per state — what ops does next on this row.
function nextAction(r: CampaignRow): { label: string; href: string; hot: boolean } {
  const detail = (tab: string) => `/admin/campaigns/${r.id}?tab=${tab}`;
  switch (r.state) {
    case 'AWAITING_MIX': return { label: 'Build mix', href: `/admin/campaigns/${r.id}/mix`, hot: true };
    case 'MIX_PROPOSED':
      return r.quote ? { label: 'Open quote', href: `/admin/quotes/${r.quote.id}`, hot: true } : { label: 'Mix builder', href: `/admin/campaigns/${r.id}/mix`, hot: true };
    case 'PAYMENT_PENDING': return { label: 'Awaiting payment', href: detail('money'), hot: false };
    case 'SCHEDULED': return { label: 'Review drafts', href: detail('delivery'), hot: false };
    case 'ONGOING': return { label: 'Track delivery', href: detail('delivery'), hot: false };
    case 'MEASURING': return { label: 'Performance', href: detail('performance'), hot: false };
    default: return { label: 'Open', href: detail('overview'), hot: false };
  }
}

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = '' } = await searchParams;
  const data = await adminFetch<CampaignList>(`/campaigns${filter ? `?filter=${encodeURIComponent(filter)}` : ''}`);
  const cols = 'minmax(230px,2.2fr) 130px 120px 170px';

  return (
    <div>
      <PageHeader
        eyebrow="Campaigns"
        title="All campaigns, all brands"
        actions={
          <>
            <CsvButton
              filename="campaigns"
              rows={data.rows.map((r) => ({
                campaign: r.name,
                brand: r.brand.name,
                state: r.state,
                payment_state: r.paymentState,
                live_from: r.liveFrom?.slice(0, 10) ?? null,
                live_to: r.liveTo?.slice(0, 10) ?? null,
                creators: r.creators,
                budget_inr: r.budgetMinor === null ? null : r.budgetMinor / 100,
                payout_liability_inr: r.payoutLiabilityMinor === null ? null : r.payoutLiabilityMinor / 100,
                margin_pct: r.marginBps === null ? null : r.marginBps / 100,
                quote: r.quote?.number ?? null,
              }))}
            />
            <LinkButton href="/admin/campaigns/new" kind="ink">+ New campaign</LinkButton>
          </>
        }
      />

      <nav aria-label="Filter campaigns" className="mb-3.5 flex flex-wrap gap-[7px]">
        {FILTERS.map(([key, label]) => {
          const on = filter === key;
          const count = key ? data.filterCounts[key] : undefined;
          return (
            <Link
              key={key || 'all'}
              href={key ? `/admin/campaigns?filter=${key}` : '/admin/campaigns'}
              aria-current={on ? 'true' : undefined}
              className={`border px-3 py-[7px] text-[12.5px] ${on ? 'border-ink bg-ink text-paper' : 'border-field bg-card text-ink hover:border-ink'}`}
            >
              {label}
              {count ? <span className={`ml-1.5 font-mono text-[10px] ${on ? 'text-lime' : 'text-faint'}`}>{count}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border border-line bg-card">
        <GridHead cols={cols}>
          <span>Campaign</span>
          <span className="text-right">Budget · margin</span>
          <span>Status</span>
          <span />
        </GridHead>
        {data.rows.length === 0 ? (
          <Empty>No campaigns here yet</Empty>
        ) : (
          data.rows.map((r) => {
            const status = CAMPAIGN_STATUS[r.state];
            const act = nextAction(r);
            const window =
              r.state === 'AWAITING_MIX' && r.briefedAt ? `Briefed ${shortDate(r.briefedAt)}` : windowLabel(r.liveFrom, r.liveTo);
            const sub = [r.brand.name.toUpperCase(), window, r.creators ? `${r.creators} creators` : null].filter(Boolean).join(' · ');
            const liab = [r.payoutLiabilityMinor !== null ? `${rupeesShort(r.payoutLiabilityMinor)} payout` : null, r.marginBps !== null ? bps(r.marginBps) : null]
              .filter(Boolean)
              .join(' · ');
            return (
              <div
                key={r.id}
                className="grid grid-cols-[1fr_auto] items-center gap-x-[11px] gap-y-2 border-b border-pill px-4 py-[13px] last:border-0 md:[grid-template-columns:var(--cols)]"
                style={{ ['--cols' as string]: cols }}
              >
                <Link href={`/admin/campaigns/${r.id}`} className="min-w-0 hover:opacity-70">
                  <div className="truncate text-[13.5px] font-medium underline decoration-field underline-offset-[3px]">{r.name}</div>
                  <div className="truncate font-mono text-[9.5px] uppercase text-[#888888]">{sub}</div>
                </Link>
                <div className="text-right max-md:col-start-2 max-md:row-start-1">
                  <div className="tabular font-mono text-[12.5px] font-semibold">{rupeesShort(r.budgetMinor)}</div>
                  <div className="font-mono text-[9.5px] text-faint">{liab || '—'}</div>
                </div>
                <div>
                  <Tag tone={status.tone}>{status.label}</Tag>
                </div>
                <div className="flex justify-end gap-[5px]">
                  {r.quote ? (
                    <Link
                      href={`/admin/quotes/${r.quote.id}/print`}
                      title={`Quotation ${r.quote.number}`}
                      className={buttonClass('smallGhost')}
                    >
                      ⤓
                    </Link>
                  ) : null}
                  <Link href={act.href} className={buttonClass(act.hot ? 'hotMono' : 'smallGhost')}>
                    {act.label}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
