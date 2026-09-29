'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { adminClientFetch, errorText } from '@/lib/admin/client';
import type { BrandRow, Format, Taxonomies } from '@/lib/admin/types';
import { rupeesShort } from '@/lib/admin/format';
import { buttonClass } from './ui';

const STEPS = [
  { title: 'Which brand is this for?', help: 'Pick a registered brand, or register a new one first.' },
  {
    title: 'Target demography',
    help: 'Who the brand wants to reach. Not a filter — the mix is composed so its cumulative audience adds up to this profile.',
  },
  {
    title: 'Objectives, KPIs and safety',
    help: 'Pick the formats and the KPIs the brand pays on. Views always bill; engagement bills at a premium on top.',
  },
  { title: 'Budget and sampling', help: 'Budget and business requirements only — no costs are quoted or committed in this flow.' },
  { title: 'Live window', help: 'When the content goes live. These constraints pre-apply in the mix builder.' },
];

const FORMAT_CARDS: { id: Format; label: string; base: string[]; premium: string[]; ph: string }[] = [
  { id: 'IG_REEL', label: 'REEL', base: ['views', 'reach'], premium: ['likes', 'comments', 'shares', 'saves'], ph: 'e.g. 30–45s, product in first 5s, honest tasting on camera' },
  { id: 'IG_STORY', label: 'STORY', base: ['views', 'reach'], premium: [], ph: 'e.g. 2 frames, link sticker on frame 2' },
  { id: 'IG_POST', label: 'POST', base: ['views', 'reach'], premium: ['likes', 'comments', 'shares', 'saves'], ph: 'e.g. carousel of 3–5 slides, first slide product hero' },
];
const AGE_BANDS = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const GENDERS: [string, string][] = [
  ['ANY', 'Any'],
  ['FEMALE_SKEWED', 'Female-skewed ≥ 60%'],
  ['MALE_SKEWED', 'Male-skewed ≥ 60%'],
  ['BALANCED', 'Balanced 40–60%'],
];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const micro = 'mb-2 font-mono text-[9px] uppercase tracking-[0.13em] text-faint';
const input = 'h-[42px] w-full border border-field bg-card px-3 text-[13.5px] text-ink outline-none focus:border-ink';

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`border px-3 py-2 text-[12.5px] ${on ? 'border-ink bg-ink text-paper' : 'border-field bg-card text-ink hover:border-ink'}`}
    >
      {children}
    </button>
  );
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const toInt = (s: string) => {
  const n = Number(s.replace(/[,\s]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

export function CampaignWizard({
  brands,
  taxonomies,
  initialBrandId,
}: {
  brands: BrandRow[];
  taxonomies: Taxonomies;
  initialBrandId: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [brandId, setBrandId] = useState<string | null>(initialBrandId ?? brands[0]?.id ?? null);
  const [name, setName] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [cityPick, setCityPick] = useState('');
  const [ages, setAges] = useState<string[]>(['18-24', '25-34']);
  const [gender, setGender] = useState('ANY');
  const [langs, setLangs] = useState<string[]>(['en']);
  const [brief, setBrief] = useState('');
  const [formatsOn, setFormatsOn] = useState<Format[]>(['IG_REEL']);
  const [premium, setPremium] = useState<Record<Format, string[]>>({ IG_REEL: [], IG_STORY: [], IG_POST: [] });
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [requirements, setRequirements] = useState<Record<string, string>>({});
  const [refs, setRefs] = useState<Record<string, string[]>>({});
  const [refDraft, setRefDraft] = useState<Record<string, string>>({});
  const [addons, setAddons] = useState<{ traffic: boolean; conversions: boolean }>({ traffic: false, conversions: false });
  const [addonVals, setAddonVals] = useState({ trafficLink: '', trafficTarget: '', convCode: '', convLink: '', convTarget: '' });
  const [safety, setSafety] = useState<string[]>([]);
  const [budget, setBudget] = useState(500000);
  const [sampling, setSampling] = useState('');
  const [liveFrom, setLiveFrom] = useState('');
  const [liveTo, setLiveTo] = useState('');

  const topCities = useMemo(() => taxonomies.cities.slice(0, 10), [taxonomies.cities]);
  const extraCities = cities.filter((c) => !topCities.some((t) => t.slug === c));
  const cityName = (slug: string) => taxonomies.cities.find((c) => c.slug === slug)?.displayName ?? slug;

  function stepError(s: number): string | null {
    if (s === 0 && !brandId) return 'Pick a brand.';
    if (s === 0 && !name.trim()) return 'Give the campaign a name.';
    if (s === 2 && !brief.trim()) return 'Write the brief — what creators should communicate.';
    if (s === 2 && formatsOn.length === 0) return 'Enable at least one format.';
    if (s === 2 && addons.traffic && !addonVals.trafficLink.trim()) return 'Traffic add-on needs a destination link.';
    if (s === 2 && addons.conversions && !addonVals.convCode.trim() && !addonVals.convLink.trim()) return 'Conversions add-on needs a promo code or link.';
    if (s === 3 && budget <= 0) return 'Enter the committed budget.';
    if (s === 4 && (!liveFrom || !liveTo)) return 'Set both live dates.';
    if (s === 4 && liveTo < liveFrom) return 'The live window ends before it starts.';
    return null;
  }

  function next() {
    const err = stepError(step);
    if (err) return setError(err);
    setError(null);
    if (step < 4) setStep(step + 1);
    else void submit();
  }

  async function submit() {
    setBusy(true);
    const objectives: { format: Format | null; tier: string; metric: string; targetValue: number | null; detail: string | null }[] = [];
    for (const f of FORMAT_CARDS.filter((c) => formatsOn.includes(c.id))) {
      for (const m of f.base) objectives.push({ format: f.id, tier: 'BASE', metric: m, targetValue: toInt(targets[`${f.id}.${m}`] ?? ''), detail: null });
      for (const m of premium[f.id]) objectives.push({ format: f.id, tier: 'PREMIUM', metric: m, targetValue: toInt(targets[`${f.id}.${m}`] ?? ''), detail: null });
    }
    if (addons.traffic) {
      objectives.push({ format: null, tier: 'ADDON', metric: 'link_clicks', targetValue: toInt(addonVals.trafficTarget), detail: addonVals.trafficLink.trim() });
    }
    if (addons.conversions) {
      const detail = [addonVals.convCode.trim() && `Code ${addonVals.convCode.trim()}`, addonVals.convLink.trim()].filter(Boolean).join(' · ');
      objectives.push({ format: null, tier: 'ADDON', metric: 'conversions', targetValue: toInt(addonVals.convTarget), detail });
    }
    try {
      const res = await adminClientFetch<{ id: string }>('/campaigns', {
        method: 'POST',
        body: {
          brandOrgId: brandId,
          name: name.trim(),
          brief: brief.trim(),
          targetCitySlugs: cities,
          ageBands: ages,
          genderTarget: gender,
          languageSlugs: langs,
          formats: formatsOn.map((f) => ({ format: f, requirements: requirements[f]?.trim() || null, referenceUrls: refs[f] ?? [] })),
          objectives,
          exclusionSlugs: safety,
          budgetMinor: budget * 100,
          samplingNote: sampling.trim() || null,
          liveFrom,
          liveTo,
        },
      });
      router.push(`/admin/campaigns/${res.id}/mix`);
      router.refresh();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  const s = STEPS[step];
  return (
    <div style={{ maxWidth: step === 2 ? 780 : 640 }}>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">New campaign · ops guided flow</div>
        <span className="font-mono text-[10px] text-faint">STEP {step + 1} OF 5</span>
      </div>
      <div className="mb-6 flex gap-0.5" aria-hidden="true">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-[3px] flex-1 ${i <= step ? 'bg-ink' : 'bg-line'}`} />
        ))}
      </div>
      <h1 className="mb-1.5 text-[26px] font-semibold tracking-[-0.03em]">{s.title}</h1>
      <p className="mb-[22px] text-[14px] text-gray">{s.help}</p>

      {step === 0 ? (
        <div>
          {brands.length === 0 ? (
            <p className="mb-4 border border-line bg-card p-4 text-[13.5px] text-gray">No brands registered yet.</p>
          ) : (
            <div className="mb-4 flex flex-col gap-2" role="radiogroup" aria-label="Brand">
              {brands.map((b) => {
                const on = brandId === b.id;
                const detail = [
                  b.industry?.displayName.toUpperCase(),
                  `${b.campaigns} campaign${b.campaigns === 1 ? '' : 's'}`,
                  b.overdueMinor ? `${rupeesShort(b.overdueMinor)} OVERDUE` : b.outstandingMinor ? `${rupeesShort(b.outstandingMinor)} outstanding` : 'No outstanding',
                ].filter(Boolean).join(' · ');
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setBrandId(b.id)}
                    className={`flex items-center justify-between gap-3.5 border px-4 py-3.5 text-left ${on ? 'border-ink bg-ink text-paper' : 'border-field bg-card text-ink hover:border-ink'}`}
                  >
                    <span>
                      <span className="block text-[14px] font-semibold">{b.name}</span>
                      <span className={`mt-0.5 block font-mono text-[10px] uppercase ${on ? 'text-faint' : b.overdueMinor ? 'text-danger' : 'text-gray'}`}>{detail}</span>
                    </span>
                    <span className="font-mono text-[9.5px] tracking-[0.08em] text-faint">{on ? 'SELECTED' : ''}</span>
                  </button>
                );
              })}
            </div>
          )}
          <Link
            href="/admin/brands?register=1"
            className="flex h-11 w-full items-center justify-center border border-dashed border-hush text-[13.5px] text-gray hover:border-ink hover:text-ink"
          >
            + Register a new brand
          </Link>
          <div className="mt-6">
            <label htmlFor="cname" className={`block ${micro}`}>Campaign name</label>
            <input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cold brew launch" className={input} />
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="flex flex-col gap-[18px]">
          <div>
            <div className={micro}>Target cities</div>
            <div className="flex flex-wrap gap-[7px]">
              {topCities.map((c) => (
                <Chip key={c.slug} on={cities.includes(c.slug)} onClick={() => setCities(toggle(cities, c.slug))}>{c.displayName}</Chip>
              ))}
              {extraCities.map((slug) => (
                <Chip key={slug} on onClick={() => setCities(toggle(cities, slug))}>{cityName(slug)} ×</Chip>
              ))}
              <select
                aria-label="Add another city"
                value={cityPick}
                onChange={(e) => {
                  if (e.target.value) setCities([...new Set([...cities, e.target.value])]);
                  setCityPick('');
                }}
                className="h-[38px] border border-dashed border-hush bg-card px-2 text-[12.5px] text-gray"
              >
                <option value="">+ Other city…</option>
                {taxonomies.cities.slice(10).map((c) => (
                  <option key={c.slug} value={c.slug}>{c.displayName}{c.state ? `, ${c.state}` : ''}</option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-[11.5px] text-faint">Leave empty for pan-India reach.</p>
          </div>
          <div>
            <div className={micro}>Age bands</div>
            <div className="flex flex-wrap gap-[7px]">
              {AGE_BANDS.map((a) => (
                <Chip key={a} on={ages.includes(a)} onClick={() => setAges(toggle(ages, a))}>{a.replace('-', '–')}</Chip>
              ))}
            </div>
          </div>
          <div className="grid gap-[18px] sm:grid-cols-2">
            <div>
              <div className={micro}>Gender skew</div>
              <div className="flex flex-wrap gap-[7px]">
                {GENDERS.map(([v, l]) => (
                  <Chip key={v} on={gender === v} onClick={() => setGender(v)}>{l}</Chip>
                ))}
              </div>
            </div>
            <div>
              <div className={micro}>Content languages</div>
              <div className="flex flex-wrap gap-[7px]">
                {taxonomies.languages.slice(0, 10).map((l) => (
                  <Chip key={l.slug} on={langs.includes(l.slug)} onClick={() => setLangs(toggle(langs, l.slug))}>{l.displayName}</Chip>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[11.5px] leading-normal text-faint">
            This is who the brand wants to reach — not a filter. No creator is excluded for their individual audience; ops composes the mix so its combined audience matches.
          </p>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-[18px]">
          <div>
            <label htmlFor="brief" className={`block ${micro}`}>Brief · what creators should communicate</label>
            <textarea
              id="brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              className="h-[110px] w-full resize-y border border-field bg-card p-[13px] text-[13.5px] leading-relaxed outline-none focus:border-ink"
              placeholder="Single-origin cold brew subscription. Lead with the morning ritual, not the discount."
            />
          </div>
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <div className="font-mono text-[9px] uppercase tracking-[0.13em] text-faint">Formats and billed KPIs</div>
              <div className="font-mono text-[8.5px] uppercase text-hush">Rates set at quote time · not here</div>
            </div>
            <div className="flex flex-col gap-2">
              {FORMAT_CARDS.map((f) => {
                const on = formatsOn.includes(f.id);
                const prem = premium[f.id];
                return (
                  <div key={f.id} className={`border bg-card ${on ? 'border-ink' : 'border-field'}`}>
                    <button
                      type="button"
                      aria-expanded={on}
                      onClick={() => setFormatsOn(toggle(formatsOn, f.id))}
                      className="flex w-full items-center justify-between gap-2.5 px-3.5 py-[13px] text-left"
                    >
                      <span className="flex items-center gap-[9px]">
                        <span className={`flex h-[17px] w-[17px] items-center justify-center border text-[10px] ${on ? 'border-ink bg-ink text-lime' : 'border-field bg-card text-gray'}`}>
                          {on ? '✓' : '+'}
                        </span>
                        <span className="text-[14px] font-semibold">{f.label}</span>
                      </span>
                      <span className="font-mono text-[8.5px] uppercase tracking-[0.06em] text-faint">
                        {on ? `${f.base.length} base${prem.length ? ` + ${prem.length} premium` : ''} KPIs billed` : 'Not in campaign'}
                      </span>
                    </button>
                    {on ? (
                      <div className="border-t border-pill px-3.5 pb-[13px] pt-0.5">
                        <div className="grid grid-cols-[1fr_150px_100px] gap-x-3 border-b border-pill py-2 font-mono text-[8px] uppercase tracking-[0.1em] text-faint">
                          <span>KPI</span>
                          <span>Billing</span>
                          <span className="text-right">Target</span>
                        </div>
                        {[...f.base.map((m) => ({ m, base: true })), ...f.premium.map((m) => ({ m, base: false }))].map(({ m, base }) => {
                          const mOn = base || prem.includes(m);
                          const key = `${f.id}.${m}`;
                          return (
                            <div key={m} className="grid grid-cols-[1fr_150px_100px] items-center gap-x-3 border-b border-[#f7f7f2] py-[5px]">
                              <button
                                type="button"
                                disabled={base}
                                aria-pressed={mOn}
                                onClick={() => setPremium({ ...premium, [f.id]: toggle(prem, m) })}
                                className="flex items-center gap-2 text-left disabled:cursor-default"
                              >
                                <span className={`flex h-3.5 w-3.5 items-center justify-center border text-[9px] ${mOn ? 'border-ink bg-ink text-lime' : 'border-hush bg-card'}`}>
                                  {mOn ? '✓' : ''}
                                </span>
                                <span className={`text-[12.5px] ${mOn ? 'text-ink' : 'text-faint'}`}>{cap(m)}</span>
                              </button>
                              <span className={`font-mono text-[8px] uppercase tracking-[0.07em] ${base ? 'text-faint' : mOn ? 'text-ink' : 'text-hush'}`}>
                                {base ? 'Base · always billed' : 'Engagement · premium'}
                              </span>
                              {mOn ? (
                                <input
                                  aria-label={`${f.label} ${m} target`}
                                  inputMode="numeric"
                                  value={targets[key] ?? ''}
                                  onChange={(e) => setTargets({ ...targets, [key]: e.target.value })}
                                  placeholder="—"
                                  className="h-[27px] w-full border border-field bg-paper px-2 text-right font-mono text-[11px] outline-none focus:border-ink"
                                />
                              ) : (
                                <span />
                              )}
                            </div>
                          );
                        })}
                        <div className="mt-[11px] grid gap-2.5 sm:grid-cols-[1.7fr_1fr]">
                          <div>
                            <div className="mb-[5px] font-mono text-[8px] uppercase tracking-[0.1em] text-hush">Format requirements</div>
                            <textarea
                              aria-label={`${f.label} requirements`}
                              value={requirements[f.id] ?? ''}
                              onChange={(e) => setRequirements({ ...requirements, [f.id]: e.target.value })}
                              placeholder={f.ph}
                              className="h-[54px] w-full resize-y border border-field bg-card px-2.5 py-2 text-[12px] leading-snug outline-none focus:border-ink"
                            />
                          </div>
                          <div>
                            <div className="mb-[5px] font-mono text-[8px] uppercase tracking-[0.1em] text-hush">Reference links</div>
                            <div className="flex flex-wrap gap-[5px]">
                              {(refs[f.id] ?? []).map((u) => (
                                <button
                                  key={u}
                                  type="button"
                                  onClick={() => setRefs({ ...refs, [f.id]: (refs[f.id] ?? []).filter((x) => x !== u) })}
                                  title="Remove"
                                  className="flex h-[26px] max-w-full items-center gap-1.5 truncate border border-line bg-paper px-2 font-mono text-[9px] text-gray"
                                >
                                  {u.replace(/^https?:\/\//, '').slice(0, 28)} ×
                                </button>
                              ))}
                              <input
                                aria-label={`${f.label} reference URL`}
                                value={refDraft[f.id] ?? ''}
                                onChange={(e) => setRefDraft({ ...refDraft, [f.id]: e.target.value })}
                                onKeyDown={(e) => {
                                  const v = (refDraft[f.id] ?? '').trim();
                                  if (e.key === 'Enter' && /^https?:\/\/\S+$/.test(v)) {
                                    e.preventDefault();
                                    setRefs({ ...refs, [f.id]: [...new Set([...(refs[f.id] ?? []), v])] });
                                    setRefDraft({ ...refDraft, [f.id]: '' });
                                  }
                                }}
                                placeholder="https://… ↵"
                                className="h-[26px] min-w-0 flex-1 border border-dashed border-hush bg-card px-2 font-mono text-[9px] outline-none focus:border-ink"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[11.5px] leading-normal text-faint">
              Views and reach bill on every enabled format. Engagement KPIs bill at a premium on top — never instead. Targets are what the mix is built against; leave blank to skip.
            </p>
          </div>

          <div>
            <div className={micro}>Add-on objectives · quoted separately</div>
            <div className="flex flex-col gap-2">
              {([
                ['traffic', 'Traffic', 'Link clicks · separate rate', [['Destination link', 'trafficLink', 2], ['Target link clicks', 'trafficTarget', 1]]],
                ['conversions', 'Conversions', 'Promo code / affiliate orders · separate rate', [['Promo code', 'convCode', 1], ['Affiliate / landing link', 'convLink', 2], ['Target orders', 'convTarget', 1]]],
              ] as const).map(([key, label, sub, fields]) => {
                const on = addons[key];
                return (
                  <div key={key} className={`border bg-card ${on ? 'border-ink' : 'border-field'}`}>
                    <button
                      type="button"
                      aria-expanded={on}
                      onClick={() => setAddons({ ...addons, [key]: !on })}
                      className="flex w-full items-center justify-between gap-2.5 px-3.5 py-[13px] text-left"
                    >
                      <span className="flex items-center gap-[9px]">
                        <span className={`flex h-[17px] w-[17px] items-center justify-center border text-[10px] ${on ? 'border-ink bg-ink text-lime' : 'border-field text-gray'}`}>
                          {on ? '✓' : '+'}
                        </span>
                        <span className="text-[14px] font-semibold">{label}</span>
                      </span>
                      <span className="font-mono text-[8.5px] uppercase tracking-[0.06em] text-faint">{sub}</span>
                    </button>
                    {on ? (
                      <div className="flex flex-wrap gap-2.5 border-t border-pill px-3.5 pb-[13px] pt-[11px]">
                        {fields.map(([fl, fk, grow]) => (
                          <label key={fk} className="min-w-[140px]" style={{ flex: grow }}>
                            <span className="mb-[5px] block font-mono text-[8px] uppercase tracking-[0.1em] text-faint">{fl}</span>
                            <input
                              value={addonVals[fk]}
                              onChange={(e) => setAddonVals({ ...addonVals, [fk]: e.target.value })}
                              className="h-9 w-full border border-field bg-card px-2.5 font-mono text-[12px] outline-none focus:border-ink"
                            />
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className={micro}>Brand safety exclusions</div>
            <div className="flex flex-wrap gap-[7px]">
              {taxonomies.exclusions.map((x) => (
                <Chip key={x.slug} on={safety.includes(x.slug)} onClick={() => setSafety(toggle(safety, x.slug))}>{x.displayName}</Chip>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] text-faint">Creators who won&apos;t promote a selected topic are never offered this campaign.</p>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div>
          <div className="mb-4 border border-line bg-card p-5">
            <label htmlFor="budget" className="font-mono text-[9px] uppercase tracking-[0.13em] text-faint">Committed budget</label>
            <div className="mb-4 mt-2 flex items-center">
              <span className="text-[38px] font-semibold tracking-[-0.04em]">₹</span>
              <input
                id="budget"
                inputMode="numeric"
                value={budget.toLocaleString('en-IN')}
                onChange={(e) => setBudget(Number(e.target.value.replace(/[^\d]/g, '')) || 0)}
                className="w-full border-none bg-transparent text-[38px] font-semibold tracking-[-0.04em] text-ink outline-none"
              />
            </div>
            <input
              type="range"
              aria-label="Budget slider"
              min={100000}
              max={5000000}
              step={50000}
              value={Math.min(5000000, Math.max(100000, budget))}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-ink"
            />
            <div className="mt-[18px] bg-ink px-3.5 py-3 text-[12.5px] leading-relaxed text-paper-dim">
              <span className="mb-[5px] block font-mono text-[9px] tracking-[0.13em] text-lime">NO COSTS COMMITTED HERE</span>
              This step records budget and requirements only. Pricing happens in the mix builder, where ops prepares one or more mixes against this budget for the brand to choose from.
            </div>
          </div>
          <label htmlFor="sampling" className={`block ${micro}`}>Product sampling</label>
          <input
            id="sampling"
            value={sampling}
            onChange={(e) => setSampling(e.target.value)}
            placeholder="Courier product to selected creators before the live window"
            className={input}
          />
        </div>
      ) : null}

      {step === 4 ? (
        <div className="flex flex-col gap-[18px]">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label>
              <span className={`block ${micro}`}>Live from</span>
              <input type="date" value={liveFrom} onChange={(e) => setLiveFrom(e.target.value)} className={input} />
            </label>
            <label>
              <span className={`block ${micro}`}>Live to</span>
              <input type="date" value={liveTo} min={liveFrom || undefined} onChange={(e) => setLiveTo(e.target.value)} className={input} />
            </label>
          </div>
          <div className="bg-ink px-[15px] py-[13px] text-[13px] leading-relaxed text-paper-dim">
            <span className="mb-1.5 block font-mono text-[9px] tracking-[0.13em] text-lime">NEXT</span>
            Finishing hands this campaign to the mix builder with these constraints pre-applied. The brand sees nothing until you send the proposal.
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-5 border border-danger px-3 py-2 text-[13px] text-danger">{error}</p>
      ) : null}

      <div className="mt-[26px] flex gap-2.5">
        <button
          type="button"
          onClick={() => (step === 0 ? router.push('/admin/campaigns') : (setError(null), setStep(step - 1)))}
          className="h-12 border border-field bg-card px-5 text-[14px] text-gray hover:border-ink hover:text-ink"
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </button>
        <button type="button" onClick={next} disabled={busy} className={buttonClass('ink', 'h-12 flex-1 text-[14px]')}>
          {busy ? 'Creating…' : step === 4 ? 'Finish and open mix builder' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
