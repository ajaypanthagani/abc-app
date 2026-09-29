import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { adminFetch } from '@/lib/admin/server';
import type { MixBuilder } from '@/lib/admin/types';
import { longDate, pct, rupees, views, windowLabel } from '@/lib/admin/format';
import { PrintBar } from '@/components/admin/PrintBar';
import { FORMAT_LABEL } from '@/components/admin/status';

export const metadata: Metadata = { title: 'Mix for brand review' };

// Brand-facing: who is in the mix, their reach and audience, and the price.
// Never CPM, payouts or margin.
export default async function MixPrint({ params }: { params: Promise<{ id: string; mixId: string }> }) {
  const { id, mixId } = await params;
  const data = await adminFetch<MixBuilder>(`/campaigns/${id}/mix-builder`);
  const mix = data.mixes.find((m) => m.id === mixId);
  if (!mix) notFound();
  const byId = new Map(data.candidates.map((c) => [c.id, c]));
  const rows = mix.entries.map((e) => ({ e, c: byId.get(e.creatorProfileId) }));
  const total = mix.entries.reduce((a, e) => a + e.brandPriceMinor, 0);
  const reach = mix.entries.reduce((a, e) => a + e.payableViewsCap, 0);
  const c = data.campaign;

  return (
    <div className="min-h-screen bg-white text-ink">
      <PrintBar back={`/admin/campaigns/${id}/mix?mix=${mixId}`} note="Brand-facing · no CPM or payouts" />
      <article className="mx-auto max-w-[900px] px-8 py-10">
        <header className="mb-8 flex items-start justify-between gap-6 border-b-2 border-ink pb-5">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center bg-lime text-[11px] font-bold">ABC</div>
              <span className="text-[14px] font-semibold">Ads By Creators</span>
            </div>
            <h1 className="text-[26px] font-semibold tracking-[-0.03em]">{c.name}</h1>
            <p className="text-[13px] text-gray">Proposed creator mix for {c.brand.name}</p>
          </div>
          <div className="text-right font-mono text-[10px] uppercase leading-relaxed text-gray">
            <div>{mix.label}{mix.strategy ? ` · ${mix.strategy}` : ''}</div>
            <div>Prepared {longDate(new Date().toISOString())}</div>
            <div>Live {windowLabel(c.liveFrom, c.liveTo)}</div>
            <div>{c.formats.map((f) => FORMAT_LABEL[f]).join(' + ')}</div>
          </div>
        </header>

        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-ink text-left font-mono text-[8.5px] uppercase tracking-[0.08em] text-gray">
              <th className="py-2 pr-2">Creator</th>
              <th className="py-2 pr-2">City</th>
              <th className="py-2 pr-2 text-right">Followers</th>
              <th className="py-2 pr-2 text-right">Median Reel views</th>
              <th className="py-2 pr-2 text-right">Audience in target cities</th>
              <th className="py-2 pr-2 text-right">Audience in target ages</th>
              <th className="py-2 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ e, c: cand }) => (
              <tr key={e.creatorProfileId} className="border-b border-line">
                <td className="py-2.5 pr-2">
                  <div className="font-medium">{cand?.name ?? 'Creator'}</div>
                  <div className="font-mono text-[10px] text-gray">@{cand?.handle ?? '—'}</div>
                </td>
                <td className="py-2.5 pr-2">{cand?.city ?? '—'}</td>
                <td className="tabular py-2.5 pr-2 text-right font-mono">{views(cand?.followers)}</td>
                <td className="tabular py-2.5 pr-2 text-right font-mono">{views(cand?.medianReelViews)}</td>
                <td className="tabular py-2.5 pr-2 text-right font-mono">{pct(cand?.audience.targetCity, 0)}</td>
                <td className="tabular py-2.5 pr-2 text-right font-mono">{pct(cand?.audience.targetAge, 0)}</td>
                <td className="tabular py-2.5 text-right font-mono">{rupees(e.brandPriceMinor)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} className="pt-4 text-right font-mono text-[10px] uppercase text-gray">
                {mix.entries.length} creators · up to {views(reach)} payable views · price excl. GST
              </td>
              <td className="tabular pt-4 text-right font-mono text-[15px] font-semibold">{rupees(total)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-8 text-[11.5px] leading-relaxed text-gray">
          Reach and audience figures are each creator&apos;s own Instagram insights over the last 90 days, shared with consent via Meta&apos;s
          API. Prices are indicative until the quotation is issued; the quotation states the final line items, GST and payment terms.
        </p>
      </article>
    </div>
  );
}
