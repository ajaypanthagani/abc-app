import type { Metadata } from 'next';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin/server';
import type { CreatorList, Taxonomies } from '@/lib/admin/types';
import { cpm, initials, rupees, views } from '@/lib/admin/format';
import { CsvButton } from '@/components/admin/CsvButton';
import { SYNC_STATUS } from '@/components/admin/status';
import { Avatar, Empty, GridHead, PageHeader, Tag, buttonClass } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Creators' };

type Params = { q?: string; category?: string; size?: string; status?: string; page?: string };

const SIZES: [string, string][] = [['', 'All'], ['lt50k', '<50K'], ['50to100k', '50–100K'], ['gt100k', '100K+']];
const STATUSES: [string, string][] = [['', 'All'], ['sync_failing', 'Sync failing'], ['held', 'Held from payout'], ['suspended', 'Suspended']];

function href(p: Params, patch: Partial<Params>) {
  const next = { ...p, ...patch };
  if (!('page' in patch)) delete next.page;
  const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
  return `/admin/creators${qs ? `?${qs}` : ''}`;
}

function FilterChip({ on, to, children }: { on: boolean; to: string; children: React.ReactNode }) {
  return (
    <Link
      href={to}
      aria-current={on ? 'true' : undefined}
      className={`border px-[11px] py-[7px] text-[12px] ${on ? 'border-ink bg-ink text-paper' : 'border-field bg-card text-ink hover:border-ink'}`}
    >
      {children}
    </Link>
  );
}

export default async function CreatorsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const qs = new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][]).toString();
  const [data, tax] = await Promise.all([
    adminFetch<CreatorList>(`/creators${qs ? `?${qs}` : ''}`),
    adminFetch<Taxonomies>('/taxonomies'),
  ]);
  const filtered = Boolean(p.q || p.category || p.size || p.status);
  const cols = '1.7fr .8fr .8fr .6fr .7fr .8fr .8fr 150px';
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div>
      <PageHeader
        eyebrow="Creators"
        title={filtered ? `${data.total.toLocaleString('en-IN')} of ${data.all.toLocaleString('en-IN')} match` : `${data.all.toLocaleString('en-IN')} creators`}
        actions={
          <CsvButton
            label="⤓ Shortlist CSV"
            filename="creator-shortlist"
            rows={data.rows.map((c) => ({
              name: c.name,
              handle: c.handle,
              categories: c.categories.map((x) => x.displayName).join('; '),
              city: c.city,
              followers: c.followers,
              median_reel_views: c.medianReelViews,
              cpm_inr: c.cpmMinor === null ? null : c.cpmMinor / 100,
              campaigns_completed: c.campaignsCompleted,
              paid_to_date_inr: c.paidToDateMinor / 100,
              sync: c.syncHealth,
              status: c.status,
            }))}
          />
        }
      />

      <div className="mb-3.5 border border-line bg-card px-4 py-3.5">
        <div className="mb-2.5 font-mono text-[8.5px] uppercase tracking-[0.13em] text-faint">Filter by brand requirement</div>
        <div className="flex flex-wrap items-center gap-3.5">
          <form action="/admin/creators" className="flex gap-1.5">
            {Object.entries(p).filter(([k, v]) => v && k !== 'q' && k !== 'page').map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <input
              name="q"
              defaultValue={p.q ?? ''}
              placeholder="Search handle, name…"
              aria-label="Search creators"
              className="h-[38px] w-[220px] border border-field bg-card px-3 text-[13px] outline-none focus:border-ink"
            />
          </form>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-faint">Category</span>
            <FilterChip on={!p.category} to={href(p, { category: undefined })}>All</FilterChip>
            {tax.categories.slice(0, 7).map((c) => (
              <FilterChip key={c.slug} on={p.category === c.slug} to={href(p, { category: c.slug })}>{c.displayName}</FilterChip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-faint">Size</span>
            {SIZES.map(([v, l]) => (
              <FilterChip key={l} on={(p.size ?? '') === v} to={href(p, { size: v || undefined })}>{l}</FilterChip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-faint">Status</span>
            {STATUSES.map(([v, l]) => (
              <FilterChip key={l} on={(p.status ?? '') === v} to={href(p, { status: v || undefined })}>{l}</FilterChip>
            ))}
          </div>
          {filtered ? (
            <Link href="/admin/creators" className="font-mono text-[9px] uppercase tracking-[0.08em] text-faint underline underline-offset-[3px] hover:text-ink">
              Clear
            </Link>
          ) : null}
        </div>
      </div>

      <div className="border border-line bg-card">
        <GridHead cols={cols}>
          <span>Creator</span><span>Followers</span><span>Median views</span><span>CPM</span><span>Campaigns</span><span>Paid to date</span><span>Sync</span><span />
        </GridHead>
        {data.rows.length === 0 ? (
          <Empty>{filtered ? 'No creators match these filters' : 'No creators have finished onboarding yet'}</Empty>
        ) : (
          data.rows.map((c) => {
            const sync = c.held ? { label: 'Held', tone: 'danger' as const } : c.status === 'SUSPENDED' ? { label: 'Suspended', tone: 'danger' as const } : SYNC_STATUS[c.syncHealth];
            return (
              <div
                key={c.id}
                className="grid grid-cols-2 items-center gap-x-[11px] gap-y-1.5 border-b border-pill px-4 py-[11px] last:border-0 md:[grid-template-columns:var(--cols)]"
                style={{ ['--cols' as string]: cols }}
              >
                <Link href={`/admin/creators/${c.id}`} className="col-span-2 flex min-w-0 items-center gap-2.5 hover:opacity-70 md:col-span-1">
                  <Avatar text={initials(c.name)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium underline decoration-field underline-offset-[3px]">{c.name ?? '—'}</div>
                    <div className="truncate font-mono text-[9.5px] text-[#888888]">
                      @{c.handle ?? '—'} · {c.categories.map((x) => x.displayName).join(' · ') || '—'}
                    </div>
                  </div>
                </Link>
                <span className="tabular font-mono text-[12px]">{views(c.followers)}</span>
                <span className="tabular font-mono text-[12px]">{views(c.medianReelViews)}</span>
                <span className="tabular font-mono text-[12px] font-semibold">{cpm(c.cpmMinor)}</span>
                <span className="tabular font-mono text-[12px] text-gray">{c.campaignsCompleted}</span>
                <span className="tabular font-mono text-[12px]">{rupees(c.paidToDateMinor)}</span>
                <span><Tag tone={sync.tone}>{sync.label}</Tag></span>
                <div className="flex justify-end">
                  <Link href={`/admin/creators/${c.id}`} className={buttonClass('smallGhost')}>Profile</Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {pages > 1 ? (
        <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase text-gray">
          <span>Page {data.page} of {pages}</span>
          <span className="flex gap-1.5">
            {data.page > 1 ? <Link href={href(p, { page: String(data.page - 1) })} className={buttonClass('smallGhost')}>← Prev</Link> : null}
            {data.page < pages ? <Link href={href(p, { page: String(data.page + 1) })} className={buttonClass('smallGhost')}>Next →</Link> : null}
          </span>
        </div>
      ) : null}
    </div>
  );
}
