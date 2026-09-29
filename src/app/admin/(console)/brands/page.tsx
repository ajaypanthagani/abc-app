import type { Metadata } from 'next';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin/server';
import type { BrandRow, Taxonomies } from '@/lib/admin/types';
import { initials, rupees, rupeesShort, shortDate } from '@/lib/admin/format';
import { ActionButton } from '@/components/admin/ActionButton';
import { BrandRegisterForm } from '@/components/admin/BrandRegisterForm';
import { CsvButton } from '@/components/admin/CsvButton';
import { Avatar, Empty, GridHead, LinkButton, PageHeader, Tag } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Brands' };

const STATUS_TONE = { OVERDUE: 'danger', INVITED: 'soft', ACTIVE: 'hot', IDLE: 'soft' } as const;

export default async function BrandsPage({ searchParams }: { searchParams: Promise<{ register?: string }> }) {
  const [{ register }, brands, tax] = await Promise.all([
    searchParams,
    adminFetch<BrandRow[]>('/brands'),
    adminFetch<Taxonomies>('/taxonomies'),
  ]);
  const cols = '1.6fr 1.3fr .7fr .9fr 1fr .8fr 190px';

  return (
    <div>
      <PageHeader
        eyebrow="Brands"
        title={`${brands.length} brand${brands.length === 1 ? '' : 's'} · invite-only`}
        actions={
          <>
            <CsvButton
              label="⤓ Statements"
              filename="brand-statements"
              rows={brands.map((b) => ({
                brand: b.name,
                category: b.industry?.displayName ?? null,
                owner: b.owner?.email ?? null,
                campaigns: b.campaigns,
                lifetime_billings_inr: b.lifetimeBillingsMinor / 100,
                outstanding_inr: b.outstandingMinor / 100,
                overdue_inr: b.overdueMinor / 100,
                status: b.displayStatus,
              }))}
            />
            <LinkButton href="/admin/brands?register=1" kind="ink">+ Register a brand</LinkButton>
          </>
        }
      />

      {register ? <BrandRegisterForm categories={tax.categories} /> : null}

      <div className="border border-line bg-card">
        <GridHead cols={cols}>
          <span>Brand</span><span>Owner</span><span>Campaigns</span><span>Lifetime billings</span><span>Outstanding</span><span>Status</span><span />
        </GridHead>
        {brands.length === 0 ? (
          <Empty>No brands yet — register the first one</Empty>
        ) : (
          brands.map((b) => (
            <div
              key={b.id}
              className="grid grid-cols-2 items-center gap-x-[11px] gap-y-1.5 border-b border-pill px-4 py-[11px] last:border-0 md:[grid-template-columns:var(--cols)]"
              style={{ ['--cols' as string]: cols }}
            >
              <div className="col-span-2 flex min-w-0 items-center gap-2.5 md:col-span-1">
                <Avatar text={initials(b.name)} />
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-medium">{b.name}</div>
                  <div className="font-mono text-[9.5px] uppercase text-[#888888]">{b.industry?.displayName ?? '—'}</div>
                </div>
              </div>
              <span className="truncate font-mono text-[11px] text-gray">
                {b.status === 'INVITED' && b.invite ? `Invited ${shortDate(b.invite.createdAt)} · lapses ${shortDate(b.invite.expiresAt)}` : b.owner?.email ?? '—'}
              </span>
              <span className="tabular font-mono text-[12px]">{b.campaigns || '—'}</span>
              <span className="tabular font-mono text-[12px]">{b.lifetimeBillingsMinor ? rupeesShort(b.lifetimeBillingsMinor) : '—'}</span>
              <span className={`tabular font-mono text-[12px] ${b.overdueMinor ? 'text-danger' : b.outstandingMinor ? '' : 'text-hush'}`}>
                {b.overdueMinor ? `${rupees(b.overdueMinor)} overdue` : b.outstandingMinor ? rupeesShort(b.outstandingMinor) : '—'}
              </span>
              <span><Tag tone={STATUS_TONE[b.displayStatus]}>{b.displayStatus}</Tag></span>
              <div className="flex flex-wrap justify-end gap-[5px]">
                {b.status === 'INVITED' ? (
                  <ActionButton path={`/brands/${b.id}/activate`} kind="smallGhost">Mark active</ActionButton>
                ) : null}
                {b.status === 'INVITED' && b.owner?.email ? (
                  <ActionButton path={`/brands/${b.id}/invite`} body={{ email: b.owner.email }} kind="smallGhost">Re-invite</ActionButton>
                ) : null}
                <Link href={`/admin/campaigns/new?brand=${b.id}`} className="inline-flex h-[28px] items-center border border-ink bg-ink px-2.5 font-mono text-[9px] uppercase tracking-[0.06em] text-lime hover:bg-black">
                  + Campaign
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
