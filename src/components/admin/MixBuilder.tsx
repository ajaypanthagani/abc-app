'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { adminClientFetch, errorText } from '@/lib/admin/client';
import type { Candidate, MixBuilder as Data, Objective } from '@/lib/admin/types';
import { cpm, humanize, pct, rupees, views, windowLabel } from '@/lib/admin/format';
import { FORMAT_LABEL, GENDER_LABEL, METRIC_LABEL } from './status';
import { Avatar, Bar, KpiStrip, Tag, buttonClass } from './ui';
import { initials } from '@/lib/admin/format';

type Sort = 'MATCH' | 'MARGIN' | 'VIEWS' | 'SAVE RATE' | 'GROWTH';
const SORTS: Sort[] = ['MATCH', 'MARGIN', 'VIEWS', 'SAVE RATE', 'GROWTH'];
const MARGIN_FLOOR = 0.35;

interface Filters {
  vMin: string; vfMin: string; saveMin: string; shareMin: string; consMin: string; sampleMin: string;
  cityShareMin: string; ageMin: string; womenMin: string; indiaMin: string; lang: string;
  cat: string; fMin: string; fMax: string; growthMin: string; syncOk: boolean; avail: boolean;
  cpmMax: string; marginMin: string; capMin: string;
}
const EMPTY: Filters = {
  vMin: '', vfMin: '', saveMin: '', shareMin: '', consMin: '', sampleMin: '', cityShareMin: '', ageMin: '',
  womenMin: '', indiaMin: '', lang: '', cat: '', fMin: '', fMax: '', growthMin: '', syncOk: false, avail: false,
  cpmMax: '', marginMin: '', capMin: '',
};
const num = (s: string) => (s.trim() === '' || Number.isNaN(Number(s)) ? null : Number(s));

function passes(c: Candidate, f: Filters): boolean {
  const gte: [string, number | null][] = [
    [f.vMin, c.medianReelViews === null ? null : c.medianReelViews / 1000],
    [f.vfMin, c.viewFollowerRatio],
    [f.saveMin, c.saveRate === null ? null : c.saveRate * 100],
    [f.shareMin, c.shareRate === null ? null : c.shareRate * 100],
    [f.consMin, c.consistency],
    [f.sampleMin, c.sampleMediaCount],
    [f.cityShareMin, c.audience.targetCity === null ? null : c.audience.targetCity * 100],
    [f.ageMin, c.audience.targetAge === null ? null : c.audience.targetAge * 100],
    [f.womenMin, c.audience.women === null ? null : c.audience.women * 100],
    [f.indiaMin, c.audience.india === null ? null : c.audience.india * 100],
    [f.fMin, c.followers === null ? null : c.followers / 1000],
    [f.growthMin, c.followerGrowth90d === null ? null : c.followerGrowth90d * 100],
    [f.marginMin, c.pricing?.margin === null || c.pricing?.margin === undefined ? null : c.pricing.margin * 100],
    [f.capMin, c.pricing ? c.pricing.payableViewsCap / 1000 : null],
  ];
  for (const [lim, v] of gte) {
    const x = num(lim);
    if (x !== null && (v === null || v < x)) return false;
  }
  const fMax = num(f.fMax);
  if (fMax !== null && (c.followers === null || c.followers / 1000 > fMax)) return false;
  const cpmMax = num(f.cpmMax);
  if (cpmMax !== null && (c.cpmMinor === null || c.cpmMinor / 100 > cpmMax)) return false;
  if (f.lang && !c.languages.includes(f.lang)) return false;
  if (f.cat && !c.categories.some((x) => x.slug === f.cat)) return false;
  if (f.syncOk && c.syncHealth !== 'OK') return false;
  if (f.avail && c.availability !== 'OPEN') return false;
  return true;
}

const SORTERS: Record<Sort, (a: Candidate, b: Candidate) => number> = {
  MATCH: (a, b) => b.match - a.match,
  MARGIN: (a, b) => (b.pricing?.margin ?? -1) - (a.pricing?.margin ?? -1),
  VIEWS: (a, b) => (b.medianReelViews ?? 0) - (a.medianReelViews ?? 0),
  'SAVE RATE': (a, b) => (b.saveRate ?? 0) - (a.saveRate ?? 0),
  GROWTH: (a, b) => (b.followerGrowth90d ?? -9) - (a.followerGrowth90d ?? -9),
};

// Per-creator contribution to a KPI target, from 90-day medians (one Reel).
function projectionFor(c: Candidate, o: Objective): number | null {
  if (!c.projection) return null;
  if (o.format !== 'IG_REEL') return null;
  if (o.metric === 'views') return c.projection.views;
  if (o.metric === 'shares') return c.projection.shares;
  if (o.metric === 'saves') return c.projection.saves;
  if (o.metric === 'comments') return c.projection.comments;
  return null;
}

export function MixBuilder({ data, activeMixId }: { data: Data; activeMixId: string | null }) {
  const router = useRouter();
  const { campaign, mixes, candidates } = data;
  const active = mixes.find((m) => m.id === activeMixId) ?? mixes.find((m) => m.status === 'FINALIZED') ?? mixes[0] ?? null;
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [sort, setSort] = useState<Sort>('MATCH');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byId = useMemo(() => new Map(candidates.map((c) => [c.id, c])), [candidates]);
  const inMix = useMemo(() => new Set(active?.entries.map((e) => e.creatorProfileId) ?? []), [active]);
  const locked = !campaign.editable || active?.status === 'FINALIZED';
  const shown = useMemo(
    () => candidates.filter((c) => inMix.has(c.id) || passes(c, filters)).sort(SORTERS[sort]),
    [candidates, filters, sort, inMix],
  );
  const activeFilters = Object.entries(filters).filter(([, v]) => v !== '' && v !== false).length;

  // Mix economics come from the frozen entry pricing, not live candidate data.
  const entries = active?.entries ?? [];
  const price = entries.reduce((a, e) => a + e.brandPriceMinor, 0);
  const payout = entries.reduce((a, e) => a + e.expectedPayoutMinor, 0);
  const capSum = entries.reduce((a, e) => a + e.payableViewsCap, 0);
  const margin = price ? 1 - payout / price : null;
  const weighted = (sel: (c: Candidate) => number | null) => {
    let num = 0;
    let den = 0;
    for (const e of entries) {
      const v = byId.get(e.creatorProfileId) ? sel(byId.get(e.creatorProfileId)!) : null;
      if (v === null) continue;
      num += v * e.payableViewsCap;
      den += e.payableViewsCap;
    }
    return den ? num / den : null;
  };
  const cumCity = weighted((c) => c.audience.targetCity);
  const cumAge = weighted((c) => c.audience.targetAge);

  const targetRows = campaign.objectives
    .filter((o) => o.tier !== 'ADDON' && o.targetValue)
    .map((o) => {
      let proj: number | null = 0;
      for (const e of entries) {
        const c = byId.get(e.creatorProfileId);
        const p = c ? projectionFor(c, o) : null;
        if (p === null) {
          proj = null;
          break;
        }
        proj += p;
      }
      return { o, proj, ratio: proj === null ? null : proj / o.targetValue! };
    });
  const onTrack = targetRows.filter((t) => t.ratio !== null && t.ratio >= 0.9).length;
  const projectable = targetRows.filter((t) => t.ratio !== null).length;

  async function call(key: string, path: string, method: 'POST' | 'DELETE', body?: unknown, after?: (r: unknown) => void) {
    setBusy(key);
    setError(null);
    try {
      const res = await adminClientFetch(path, { method, body: body ?? (method === 'POST' ? {} : undefined) });
      after?.(res);
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  const setF = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFilters({ ...filters, [k]: e.target.value });
  const inp = (label: string, k: keyof Filters, ph: string) => (
    <label key={k} className="min-w-0">
      <span className="mb-1 block truncate font-mono text-[7.5px] uppercase tracking-[0.08em] text-faint">{label}</span>
      <input
        value={filters[k] as string}
        onChange={setF(k)}
        placeholder={ph}
        inputMode="decimal"
        className={`h-[30px] w-full border px-2 font-mono text-[11px] outline-none focus:border-ink ${filters[k] !== '' ? 'border-ink bg-paper' : 'border-field bg-card'}`}
      />
    </label>
  );
  const tog = (label: string, k: 'syncOk' | 'avail') => (
    <div key={k}>
      <span className="mb-1 block truncate font-mono text-[7.5px] uppercase tracking-[0.08em] text-faint">{label}</span>
      <button
        type="button"
        aria-pressed={filters[k]}
        onClick={() => setFilters({ ...filters, [k]: !filters[k] })}
        className={`h-[30px] w-full border font-mono text-[9px] tracking-[0.06em] ${filters[k] ? 'border-ink bg-ink text-lime' : 'border-field bg-card text-gray'}`}
      >
        {filters[k] ? 'REQUIRED' : 'ANY'}
      </button>
    </div>
  );

  const groups: { label: string; items: React.ReactNode[] }[] = [
    { label: 'Performance', items: [inp('Min median views · K', 'vMin', '40'), inp('Min V:F ratio', 'vfMin', '0.85'), inp('Min save %', 'saveMin', '3.5'), inp('Min share %', 'shareMin', '2.5'), inp('Min consistency', 'consMin', '0.75'), inp('Min sample · Reels', 'sampleMin', '8')] },
    {
      label: 'Audience',
      items: [
        inp('Min target-city %', 'cityShareMin', '20'),
        inp('Min target-age %', 'ageMin', '70'),
        inp('Min women %', 'womenMin', '55'),
        inp('Min India %', 'indiaMin', '90'),
        <label key="lang" className="min-w-0">
          <span className="mb-1 block font-mono text-[7.5px] uppercase tracking-[0.08em] text-faint">Language</span>
          <select value={filters.lang} onChange={setF('lang')} className="h-[30px] w-full border border-field bg-card px-1 text-[11px]">
            <option value="">Any</option>
            {campaign.targetLanguages.map((l) => <option key={l.slug} value={l.slug}>{l.displayName}</option>)}
          </select>
        </label>,
      ],
    },
    {
      label: 'Account',
      items: [
        <label key="cat" className="min-w-0">
          <span className="mb-1 block font-mono text-[7.5px] uppercase tracking-[0.08em] text-faint">Category</span>
          <select value={filters.cat} onChange={setF('cat')} className="h-[30px] w-full border border-field bg-card px-1 text-[11px]">
            <option value="">Any</option>
            {[...new Map(candidates.flatMap((c) => c.categories).map((x) => [x.slug, x])).values()].map((x) => (
              <option key={x.slug} value={x.slug}>{x.displayName}</option>
            ))}
          </select>
        </label>,
        inp('Min followers · K', 'fMin', '40'),
        inp('Max followers · K', 'fMax', '100'),
        inp('Min 90d growth %', 'growthMin', '0'),
        tog('Sync healthy', 'syncOk'),
        tog('Available now', 'avail'),
      ],
    },
    { label: 'Economics', items: [inp('Max CPM · ₹', 'cpmMax', '200'), inp('Min margin %', 'marginMin', '42'), inp('Min payable cap · K', 'capMin', '150')] },
  ];

  const briefLocks = [
    `Formats: ${campaign.formats.map((f) => FORMAT_LABEL[f]).join(' + ')}`,
    campaign.objectives.some((o) => o.tier === 'PREMIUM')
      ? `Premium KPIs: ${campaign.objectives.filter((o) => o.tier === 'PREMIUM').map((o) => `${METRIC_LABEL[o.metric]} (${FORMAT_LABEL[o.format!]})`).join(' + ')}`
      : null,
    ...campaign.objectives.filter((o) => o.tier === 'ADDON').map((o) => `Add-on: ${METRIC_LABEL[o.metric]}${o.detail ? ` → ${o.detail}` : ''}`),
    `Target: ${campaign.targetCities.map((c) => c.displayName).join('+') || 'Pan-India'} · ${campaign.ageBands.map((a) => a.replace('-', '–')).join(', ') || 'any age'} · ${GENDER_LABEL[campaign.genderTarget] ?? campaign.genderTarget}`,
    `Budget ${rupees(campaign.budgetMinor)}`,
    campaign.exclusions.length ? `Safety: ${campaign.exclusions.map((x) => x.displayName).join(', ')} excluded` : null,
  ].filter(Boolean) as string[];

  const cols = '220px 110px 90px 90px 70px 70px 70px 70px 110px 64px 56px 86px';

  return (
    <div>
      <Link
        href={`/admin/campaigns/${campaign.id}`}
        className="mb-4 inline-flex h-[34px] items-center border border-field bg-card px-3.5 font-mono text-[10px] uppercase tracking-[0.08em] text-gray hover:border-ink hover:text-ink"
      >
        ← Campaign
      </Link>
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Mix builder · {campaign.brand.name}</div>
      <h1 className="text-[28px] font-semibold tracking-[-0.03em]">{campaign.name}</h1>
      <p className="mb-4 mt-1 text-[13px] text-gray">
        {rupees(campaign.budgetMinor)} budget · live {windowLabel(campaign.liveFrom, campaign.liveTo)} · CPM and payouts are never shared with the brand
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.13em] text-faint">Mixes</span>
        {mixes.map((m) => {
          const on = m.id === active?.id;
          return (
            <Link
              key={m.id}
              href={`/admin/campaigns/${campaign.id}/mix?mix=${m.id}`}
              className={`border px-3 py-[7px] font-mono text-[9.5px] uppercase tracking-[0.06em] ${on ? 'border-ink bg-ink text-lime' : 'border-line bg-card text-gray hover:border-ink'}`}
            >
              {m.label}{m.strategy ? ` · ${m.strategy}` : ''} · {m.entries.length} creators{m.status !== 'DRAFT' ? ` · ${humanize(m.status)}` : ''}
            </Link>
          );
        })}
        {campaign.editable ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() =>
              call('new', `/campaigns/${campaign.id}/mixes`, 'POST', { strategy: null, copyFromMixId: active?.id ?? null }, (r) =>
                router.push(`/admin/campaigns/${campaign.id}/mix?mix=${(r as { id: string }).id}`),
              )
            }
            className="border border-dashed border-hush px-3 py-[7px] font-mono text-[9.5px] uppercase text-gray hover:border-ink hover:text-ink"
          >
            + New mix{active ? ` (copy ${active.label})` : ''}
          </button>
        ) : null}
        <span className="ml-auto font-mono text-[9px] uppercase text-faint">Finalize a mix to prepare the quote</span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5 border border-line bg-card px-4 py-2.5">
        <span className="mr-1 font-mono text-[8.5px] uppercase tracking-[0.13em] text-faint">From brief · locked</span>
        {briefLocks.map((l) => (
          <span key={l} className="bg-pill px-2 py-1 font-mono text-[9px] uppercase tracking-[0.04em] text-gray">{l}</span>
        ))}
        <span className="font-mono text-[8.5px] uppercase text-faint">Demography is a target, not a filter</span>
      </div>

      <details className="mb-3 border border-line bg-card" open={activeFilters > 0}>
        <summary className="flex cursor-pointer items-center justify-between px-4 py-3">
          <span className="font-mono text-[8.5px] uppercase tracking-[0.13em] text-faint">
            Shortlist filters · 90-day metrics from weekly Meta sync{activeFilters ? ` · ${activeFilters} active` : ''}
          </span>
          {activeFilters ? (
            <button type="button" onClick={(e) => { e.preventDefault(); setFilters(EMPTY); }} className="font-mono text-[9px] uppercase text-gray underline underline-offset-2">
              Clear all
            </button>
          ) : null}
        </summary>
        <div className="grid gap-4 border-t border-pill px-4 py-3">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="mb-1.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink">{g.label}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{g.items}</div>
            </div>
          ))}
        </div>
      </details>

      <div className="mb-3 border border-line bg-card p-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-mono text-[8.5px] uppercase tracking-[0.13em] text-faint">Brief targets vs this mix · projected from 90-day medians, one Reel each</span>
          <span className={`font-mono text-[9.5px] uppercase ${projectable && onTrack < projectable ? 'text-danger' : 'text-ink'}`}>
            {!entries.length ? 'Add creators to project' : projectable ? `${onTrack} of ${projectable} targets on track` : 'No projectable targets'}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {targetRows.map(({ o, proj, ratio }) => (
            <div key={o.id}>
              <div className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-faint">
                {FORMAT_LABEL[o.format!]} {METRIC_LABEL[o.metric]} · {o.tier.toLowerCase()}
              </div>
              <div className="tabular mt-1 text-[15px] font-semibold">
                {proj === null ? '—' : views(proj)} <span className="font-mono text-[9px] font-normal text-faint">/ {views(o.targetValue)} target</span>
              </div>
              <Bar value={ratio} tone={ratio !== null && ratio < 0.9 ? 'danger' : 'ink'} className="mt-1" />
              {proj === null ? <div className="mt-1 font-mono text-[8.5px] uppercase text-faint">Not projectable from Reel insights</div> : null}
            </div>
          ))}
        </div>
      </div>

      <KpiStrip
        items={[
          { label: 'In mix', value: entries.length, note: `Of ${candidates.length} eligible creators` },
          { label: 'Brand price', value: rupees(price), note: `Of ${rupees(campaign.budgetMinor)} budget`, tone: campaign.budgetMinor && price > campaign.budgetMinor ? 'danger' : undefined },
          { label: 'Creator payouts', value: rupees(payout), note: 'At cap' },
          { label: 'Payable views', value: views(capSum), note: 'Caps summed' },
          { label: 'Cum. audience', value: `${pct(cumCity, 0)} · ${pct(cumAge, 0)}`, note: 'Target city · age, view-weighted' },
          { label: 'Margin', value: pct(margin), note: margin === null ? '—' : margin < MARGIN_FLOOR ? 'Below 35% floor' : 'Above 35% floor', tone: margin !== null && margin < MARGIN_FLOOR ? 'danger' : undefined },
        ]}
      />

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[9.5px] uppercase text-gray">
          {activeFilters ? `${shown.length} of ${candidates.length} candidates match filters` : `${candidates.length} candidates · ranked by ${sort.toLowerCase()}`}
        </span>
        <div className="flex items-center gap-1">
          <span className="mr-1 font-mono text-[8.5px] uppercase text-faint">Sort</span>
          {SORTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              aria-pressed={sort === s}
              className={`border px-2 py-1 font-mono text-[9px] ${sort === s ? 'border-ink bg-ink text-lime' : 'border-line bg-card text-gray'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error ? <p role="alert" className="mb-2 border border-danger px-3 py-2 text-[12.5px] text-danger">{error}</p> : null}

      <div className="overflow-x-auto border border-line bg-card">
        <div className="min-w-[1180px]">
          <div className="grid gap-2.5 border-b border-line px-4 py-2.5 font-mono text-[8px] uppercase tracking-[0.08em] text-faint" style={{ gridTemplateColumns: cols }}>
            <span>Creator</span>
            <span>Median Reel views</span>
            <span>Save · share</span>
            <span>Consistency</span>
            <span>Target city</span>
            <span>Target age</span>
            <span>Women</span>
            <span>India</span>
            <span>Brand price · cap</span>
            <span>Margin</span>
            <span>Match</span>
            <span />
          </div>
          {shown.map((c) => {
            const on = inMix.has(c.id);
            const entry = active?.entries.find((e) => e.creatorProfileId === c.id);
            const priceMinor = entry?.brandPriceMinor ?? c.pricing?.brandPriceMinor ?? null;
            const capV = entry?.payableViewsCap ?? c.pricing?.payableViewsCap ?? null;
            const m = entry ? 1 - entry.expectedPayoutMinor / entry.brandPriceMinor : c.pricing?.margin ?? null;
            const blocked = c.blockers.length > 0;
            return (
              <div
                key={c.id}
                className={`grid items-center gap-2.5 border-b border-pill px-4 py-2.5 last:border-0 ${on ? 'bg-paper' : ''}`}
                style={{ gridTemplateColumns: cols }}
              >
                <Link href={`/admin/creators/${c.id}`} className="flex min-w-0 items-center gap-2.5 hover:opacity-70">
                  <Avatar text={initials(c.name)} />
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-medium">{c.name ?? '—'}</div>
                    <div className="truncate font-mono text-[9px] uppercase text-[#888888]">
                      @{c.handle} · {views(c.followers)} fol · {c.city ?? '—'}
                    </div>
                  </div>
                </Link>
                <div className="tabular font-mono text-[12px]">
                  {views(c.medianReelViews)}
                  <span className="ml-1 text-[9px] text-faint">{c.viewFollowerRatio !== null ? `${c.viewFollowerRatio.toFixed(2)} v:f` : ''}</span>
                </div>
                <div className="tabular font-mono text-[11px]">{pct(c.saveRate)} · {pct(c.shareRate)}</div>
                <div className="tabular font-mono text-[11px]">{c.consistency === null ? '—' : c.consistency.toFixed(2)}</div>
                <div className="tabular font-mono text-[11px]">{pct(c.audience.targetCity, 0)}</div>
                <div className="tabular font-mono text-[11px]">{pct(c.audience.targetAge, 0)}</div>
                <div className="tabular font-mono text-[11px]">{pct(c.audience.women, 0)}</div>
                <div className="tabular font-mono text-[11px]">{pct(c.audience.india, 0)}</div>
                <div>
                  <div className="tabular font-mono text-[12px] font-semibold">{priceMinor === null ? '—' : rupees(priceMinor)}</div>
                  <div className="font-mono text-[9px] text-faint">{capV === null ? cpm(c.cpmMinor) : `CAP ${views(capV)} · ${cpm(entry?.cpmMinor ?? c.cpmMinor)}`}</div>
                </div>
                <div className={`tabular font-mono text-[11.5px] ${m !== null && m < MARGIN_FLOOR ? 'text-danger' : ''}`}>{pct(m, 0)}</div>
                <div className={`tabular font-mono text-[12px] font-semibold ${c.match >= 80 ? 'text-ink' : 'text-faint'}`}>{c.match}%</div>
                <div className="flex justify-end">
                  {on ? (
                    <button
                      type="button"
                      disabled={locked || busy !== null}
                      onClick={() => call(c.id, `/mixes/${active!.id}/entries/${c.id}`, 'DELETE')}
                      className={buttonClass('hotMono')}
                    >
                      {busy === c.id ? '…' : 'Remove'}
                    </button>
                  ) : blocked ? (
                    <span title={c.blockers.join(' · ')}>
                      <Tag tone="outline">{c.blockers[0].startsWith('No CPM') ? 'No rate' : 'Blocked'}</Tag>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!active || locked || busy !== null}
                      onClick={() => call(c.id, `/mixes/${active!.id}/entries`, 'POST', { creatorProfileId: c.id })}
                      className={buttonClass('smallGhost')}
                    >
                      {busy === c.id ? '…' : 'Add'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {shown.length === 0 ? <div className="px-4 py-8 text-center font-mono text-[10px] uppercase text-faint">No creators match these filters</div> : null}
        </div>
      </div>

      <p className="mt-2 font-mono text-[8.5px] uppercase leading-relaxed text-faint">
        Projections = 90-day median Reel views × rates · Match = 40% category + 25% target-city + 20% target-age + 15% consistency · Price and cap freeze when a creator is added · All metrics from Meta, creator-consented
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        {!active ? (
          campaign.editable ? (
            <button
              type="button"
              onClick={() => call('new', `/campaigns/${campaign.id}/mixes`, 'POST', { strategy: null }, (r) => router.push(`/admin/campaigns/${campaign.id}/mix?mix=${(r as { id: string }).id}`))}
              className={buttonClass('ink', 'h-12')}
            >
              Start Mix A
            </button>
          ) : null
        ) : (
          <>
            {active.status !== 'FINALIZED' ? (
              <a href={`/admin/campaigns/${campaign.id}/mix/${active.id}/print`} target="_blank" className={buttonClass('ghost', 'h-12 px-5 text-[11px]')}>
                ⤓ Export {active.label} for brand review
              </a>
            ) : null}
            {campaign.editable && active.status === 'DRAFT' ? (
              <button
                type="button"
                disabled={!entries.length || busy !== null}
                onClick={() => call('propose', `/mixes/${active.id}/propose`, 'POST')}
                className={buttonClass('ghost', 'h-12 px-5 text-[11px]')}
              >
                Mark {active.label} shared with brand
              </button>
            ) : null}
            {campaign.editable && active.status !== 'FINALIZED' ? (
              <button
                type="button"
                disabled={!entries.length || busy !== null}
                onClick={() =>
                  call('finalize', `/mixes/${active.id}/finalize`, 'POST', undefined, (r) =>
                    router.push(`/admin/quotes/${(r as { quoteId: string }).quoteId}`),
                  )
                }
                className={buttonClass('ink', 'h-12 flex-1 text-[14px]')}
              >
                {busy === 'finalize' ? 'Finalizing…' : `Finalize ${active.label} → prepare quote`}
              </button>
            ) : null}
            {active.status === 'FINALIZED' ? (
              <span className="font-mono text-[10px] uppercase text-gray">
                {active.label} is finalized — copy it into a new mix to change the roster
              </span>
            ) : null}
            <span className="font-mono text-[9.5px] uppercase text-faint">
              {entries.length} creators in {active.label} · share for brand review, finalize once the brand signs off
            </span>
          </>
        )}
      </div>
    </div>
  );
}
