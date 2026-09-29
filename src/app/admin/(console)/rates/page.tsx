import type { Metadata } from 'next';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin/server';
import type { RateProposal } from '@/lib/admin/types';
import { cpm, initials } from '@/lib/admin/format';
import { RateForm } from '@/components/admin/RateForm';
import { Avatar, Empty, GridHead, Tag } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Rate reviews' };

export default async function RatesPage() {
  const rows = await adminFetch<RateProposal[]>('/rates');
  const reviews = rows.filter((r) => r.kind === 'REVIEW').length;
  const initial = rows.length - reviews;
  const cols = '1.6fr .7fr .8fr .6fr 2fr 200px';

  return (
    <div>
      <div className="mb-[7px] font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Rate reviews</div>
      <h1 className="mb-1.5 text-[28px] font-semibold tracking-[-0.03em]">
        {rows.length ? `${rows.length} creator${rows.length === 1 ? '' : 's'} due` : 'All rates current'}
      </h1>
      <p className="mb-5 max-w-[70ch] text-[14px] text-gray">
        Triggered every three completed campaigns{initial ? `, plus ${initial} newly onboarded creator${initial === 1 ? '' : 's'} without a rate` : ''}. The model proposes;
        ops confirms or overrides. Creators see the earnings change, never the CPM.
      </p>

      <div className="border border-line bg-card">
        <GridHead cols={cols}>
          <span>Creator</span><span>Current CPM</span><span>Model proposes</span><span>Delta</span><span>Driver</span><span />
        </GridHead>
        {rows.length === 0 ? (
          <Empty>Nothing to review</Empty>
        ) : (
          rows.map((r) => {
            const delta = r.proposal.deltaBps;
            return (
              <div
                key={r.creatorId}
                className="grid grid-cols-2 items-center gap-x-[11px] gap-y-1.5 border-b border-pill px-4 py-[11px] last:border-0 md:[grid-template-columns:var(--cols)]"
                style={{ ['--cols' as string]: cols }}
              >
                <Link href={`/admin/creators/${r.creatorId}`} className="col-span-2 flex min-w-0 items-center gap-2.5 hover:opacity-70 md:col-span-1">
                  <Avatar text={initials(r.name)} />
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-medium">{r.name ?? '—'}</div>
                    <div className="font-mono text-[9.5px] text-[#888888]">@{r.handle ?? '—'}</div>
                  </div>
                </Link>
                <span className="tabular font-mono text-[12px]">{r.currentCpmMinor === null ? <Tag tone="hot">New</Tag> : cpm(r.currentCpmMinor)}</span>
                <span className="tabular font-mono text-[12px] font-semibold">{cpm(r.proposal.proposedCpmMinor)}</span>
                <span className={`tabular font-mono text-[12px] ${delta !== null && delta < 0 ? 'text-danger' : ''}`}>
                  {delta === null ? '—' : `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${Math.abs(delta / 100).toFixed(0)}%`}
                </span>
                <span className="col-span-2 text-[12px] text-gray md:col-span-1">{r.proposal.drivers.join(' · ')}</span>
                <div className="col-span-2 md:col-span-1">
                  <RateForm creatorId={r.creatorId} proposedMinor={r.proposal.proposedCpmMinor} currentMinor={r.currentCpmMinor} />
                </div>
              </div>
            );
          })
        )}
      </div>
      <p className="mt-3 font-mono text-[9px] uppercase leading-relaxed text-faint">
        Model v1 · base ₹180 per 1,000 eligible views, scaled by save rate, share rate, consistency and view-to-follower vs benchmarks · reviews move at most ±15% per cycle
      </p>
    </div>
  );
}
