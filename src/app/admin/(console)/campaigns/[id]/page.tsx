import type { Metadata } from 'next';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin/server';
import type { CampaignDetail, CampaignState, Objective } from '@/lib/admin/types';
import { bps, humanize, longDate, rupees, rupeesShort, shortDate, views, windowLabel } from '@/lib/admin/format';
import { ActionButton } from '@/components/admin/ActionButton';
import { DeliveryRow } from '@/components/admin/DeliveryRow';
import { InvoiceActions } from '@/components/admin/InvoiceActions';
import { CAMPAIGN_STATUS, FORMAT_LABEL, GENDER_LABEL, METRIC_LABEL, activityText } from '@/components/admin/status';
import { Bar, Empty, KpiStrip, LinkButton, Micro, PageHeader, Panel, Tag, buttonClass } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Campaign' };

type Tab = 'overview' | 'delivery' | 'performance' | 'money' | 'activity';
const TABS: [Tab, string][] = [
  ['overview', 'Overview'],
  ['delivery', 'Delivery & drafts'],
  ['performance', 'Performance'],
  ['money', 'Money'],
  ['activity', 'Activity'],
];

function allowedTabs(state: CampaignState): Tab[] {
  if (['DRAFT', 'AWAITING_MIX', 'MIX_PROPOSED', 'PAYMENT_PENDING', 'CANCELLED'].includes(state)) return ['overview', 'money', 'activity'];
  if (state === 'SCHEDULED') return ['overview', 'delivery', 'money', 'activity'];
  return ['overview', 'delivery', 'performance', 'money', 'activity'];
}

const STAGE_NOTE: Record<CampaignState, string> = {
  DRAFT: 'Draft — not yet briefed.',
  AWAITING_MIX: 'Brief locked — build the creator mix and share it for brand review.',
  MIX_PROPOSED: 'Mix with the brand for review. Once they sign off, finalize it to prepare the quote.',
  PAYMENT_PENDING: 'Quote sent and deposit invoice issued. The campaign schedules once the deposit lands.',
  SCHEDULED: 'Deposit paid — creators are contracted. Collect and approve drafts before the window opens.',
  ONGOING: 'Live — Meta metrics sync weekly. Close the live window when it ends.',
  MEASURING: 'Live window closed. Each post measures for its pinned window; close measurement to finalize payouts.',
  COMPLETED: 'Completed — payouts finalized and the balance invoiced.',
  CANCELLED: 'Cancelled.',
};

function fmtTarget(o: Objective) {
  return o.targetValue === null ? 'No target' : views(o.targetValue);
}

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, { tab: rawTab }] = await Promise.all([params, searchParams]);
  const c = await adminFetch<CampaignDetail>(`/campaigns/${id}`);
  const allowed = allowedTabs(c.state);
  const tab: Tab = allowed.includes(rawTab as Tab) ? (rawTab as Tab) : 'overview';
  const status = CAMPAIGN_STATUS[c.state];
  const quote = c.quote;
  const planning = c.state === 'AWAITING_MIX' || c.state === 'MIX_PROPOSED';
  const cancellable = ['DRAFT', 'AWAITING_MIX', 'MIX_PROPOSED', 'PAYMENT_PENDING'].includes(c.state);
  const formats = c.formats.map((f) => f.format);
  const liveRoster = c.roster.filter((r) => r.state !== 'CANCELLED');
  const awaitingReview = c.roster.filter((r) => r.state === 'DRAFT_SUBMITTED').length;
  const notLive = liveRoster.filter((r) => !['PUBLISHED', 'MEASURING', 'COMPLETED'].includes(r.state)).length;
  const depositInvoice = c.invoices.find((i) => i.kind === 'DEPOSIT' && i.status !== 'VOID');

  // Stage action: the one thing to do next at this stage.
  const stageAction = (() => {
    switch (c.state) {
      case 'AWAITING_MIX': return <LinkButton href={`/admin/campaigns/${c.id}/mix`} kind="hotMono">Build mix</LinkButton>;
      case 'MIX_PROPOSED':
        return quote ? <LinkButton href={`/admin/quotes/${quote.id}`} kind="hotMono">Open quote</LinkButton> : <LinkButton href={`/admin/campaigns/${c.id}/mix`} kind="hotMono">Mix builder</LinkButton>;
      case 'PAYMENT_PENDING': return <LinkButton href={`/admin/campaigns/${c.id}?tab=money`} kind="hotMono">Record deposit</LinkButton>;
      case 'SCHEDULED':
        return (
          <span className="flex gap-1.5">
            <LinkButton href={`/admin/campaigns/${c.id}?tab=delivery`} kind="hotMono">Review drafts</LinkButton>
            <ActionButton path={`/campaigns/${c.id}/go-live`} kind="smallGhost">Mark live</ActionButton>
          </span>
        );
      case 'ONGOING':
        return (
          <ActionButton path={`/campaigns/${c.id}/end-live`} kind="hotMono" confirm="Close the live window? Creators can no longer be marked live after measurement starts.">
            Close live window
          </ActionButton>
        );
      case 'MEASURING':
        return (
          <ActionButton path={`/campaigns/${c.id}/close-measurement`} kind="hotMono" confirm="Close measurement? Payouts finalize from measured views and the balance invoice is issued.">
            Close measurement
          </ActionButton>
        );
      default: return null;
    }
  })();

  const nextActions: string[] = [];
  if (c.state === 'AWAITING_MIX') nextActions.push('Build one or more mixes and share them for brand review', 'The quote unlocks once a mix is finalized');
  if (c.state === 'MIX_PROPOSED' && !quote) nextActions.push('Finalize the mix the brand signs off on — that drafts the quote');
  if (c.state === 'MIX_PROPOSED' && quote) {
    nextActions.push(`Quote ${quote.quoteNumber} is ${humanize(quote.status).toLowerCase()} — send it once it is right`);
    if (quote.marginBps < 3500) nextActions.push(`Margin ${bps(quote.marginBps)} is below the 35% floor — needs manager approval`);
  }
  if (c.state === 'PAYMENT_PENDING') {
    nextActions.push(depositInvoice?.paymentLinkUrl ? `Chase ${depositInvoice.number} — payment link is on the invoice` : `Add a payment link to ${depositInvoice?.number ?? 'the deposit invoice'} and mail it to the brand`);
  }
  if (awaitingReview) nextActions.push(`Review ${awaitingReview} submitted draft${awaitingReview === 1 ? '' : 's'}`);
  if (['SCHEDULED', 'ONGOING'].includes(c.state) && notLive) nextActions.push(`${notLive} creator${notLive === 1 ? '' : 's'} not live yet — window closes ${shortDate(c.liveTo)}`);
  if (c.state === 'ONGOING') nextActions.push('Weekly Meta sync keeps delivery current — use Sync now before brand check-ins');
  if (c.state === 'MEASURING') nextActions.push('Close measurement once every post’s window has ended');

  const groups = (['IG_REEL', 'IG_POST', 'IG_STORY'] as const)
    .filter((f) => c.objectives.some((o) => o.format === f))
    .map((f) => ({ label: FORMAT_LABEL[f].toUpperCase(), items: c.objectives.filter((o) => o.format === f) }));
  const addons = c.objectives.filter((o) => o.tier === 'ADDON');

  return (
    <div>
      <PageHeader
        back={{ href: '/admin/campaigns', label: 'Campaigns' }}
        eyebrow={`Campaign · ${c.brand.name}`}
        title={c.name}
        actions={
          <>
            <Tag tone={status.tone} className="mr-1 px-2 py-1.5">{status.label}</Tag>
            {planning ? <LinkButton href={`/admin/campaigns/${c.id}/mix`}>Mix builder</LinkButton> : null}
            {quote ? <LinkButton href={`/admin/quotes/${quote.id}`}>Quote</LinkButton> : null}
            {quote ? <LinkButton href={`/admin/quotes/${quote.id}/print`}>⤓ Quote PDF</LinkButton> : null}
            {c.state !== 'CANCELLED' && c.state !== 'COMPLETED' ? (
              <ActionButton path={`/campaigns/${c.id}/sync`}>↻ Sync now</ActionButton>
            ) : null}
            {cancellable ? (
              <ActionButton path={`/campaigns/${c.id}/cancel`} kind="danger" confirm="Cancel this campaign? Open invoices are voided.">
                Cancel
              </ActionButton>
            ) : null}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 border border-ink bg-ink px-4 py-3 text-paper">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.13em] text-lime">Stage · {status.label}</span>
        <span className="min-w-0 flex-1 text-[13px] text-paper-dim">{STAGE_NOTE[c.state]}</span>
        {stageAction}
      </div>

      <KpiStrip
        cols={4}
        items={[
          { label: 'Committed budget', value: rupeesShort(c.kpis.budgetMinor) },
          { label: 'Payout liability', value: rupeesShort(c.kpis.payoutLiabilityMinor), note: c.roster.length ? 'Max at cap, contracted' : c.kpis.payoutLiabilityMinor !== null ? 'Finalized mix, at cap' : undefined },
          { label: 'Margin', value: bps(c.kpis.marginBps), tone: c.kpis.marginBps !== null && c.kpis.marginBps < 3500 ? 'danger' : undefined, note: quote ? `Quote ${quote.quoteNumber}` : undefined },
          { label: 'Creators', value: c.kpis.creators ?? '—' },
        ]}
      />

      <nav aria-label="Campaign sections" className="mb-4 flex flex-wrap gap-1.5">
        {TABS.filter(([t]) => allowed.includes(t)).map(([t, label]) => (
          <Link
            key={t}
            href={`/admin/campaigns/${c.id}?tab=${t}`}
            aria-current={tab === t ? 'page' : undefined}
            className={`border px-3 py-[7px] font-mono text-[9.5px] uppercase tracking-[0.08em] ${tab === t ? 'border-ink bg-ink text-lime' : 'border-line text-gray hover:border-ink hover:text-ink'}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === 'overview' ? (
        <div className="flex flex-col gap-4">
          <Panel title="Campaign objectives" aside="Billed targets">
            <div className="grid gap-px bg-line md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
              {groups.map((g) => (
                <div key={g.label} className="bg-card p-4">
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="text-[13px] font-semibold">{g.label}</span>
                    <Micro>Base always billed · premium on top</Micro>
                  </div>
                  <div className="flex flex-col gap-3">
                    {g.items.map((o) => {
                      const prog = o.delivered !== null && o.delivered !== undefined && o.targetValue ? o.delivered / o.targetValue : null;
                      return (
                        <div key={o.id}>
                          <div className="flex items-center justify-between gap-2 text-[12.5px]">
                            <span className="flex items-center gap-2">
                              {METRIC_LABEL[o.metric] ?? o.metric}
                              <Tag tone={o.tier === 'PREMIUM' ? 'ink' : 'soft'}>{o.tier === 'PREMIUM' ? 'Premium' : 'Base'}</Tag>
                            </span>
                            <span className="tabular font-mono">{fmtTarget(o)}</span>
                          </div>
                          <Bar value={prog} tone={prog !== null && prog < 0.9 ? 'danger' : 'ink'} className="mt-1.5" />
                          <div className="mt-1 font-mono text-[9px] uppercase text-faint">
                            {prog !== null ? `${views(o.delivered ?? 0)} delivered · ${Math.round(prog * 100)}%` : c.roster.length ? 'Not live yet' : 'Projected in mix'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {addons.length ? (
                <div className="bg-card p-4">
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="text-[13px] font-semibold">ADD-ON</span>
                    <Micro>Billed separately on the quote</Micro>
                  </div>
                  {addons.map((o) => (
                    <div key={o.id} className="mb-2 text-[12.5px]">
                      <div className="flex justify-between gap-2">
                        <span>{METRIC_LABEL[o.metric] ?? o.metric}</span>
                        <span className="tabular font-mono">{fmtTarget(o)}</span>
                      </div>
                      {o.detail ? <div className="truncate font-mono text-[9.5px] text-faint">{o.detail}</div> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Panel>

          {nextActions.length ? (
            <Panel title="Next actions" pad>
              <div className="flex flex-col gap-1.5 text-[13px]">
                {nextActions.map((n) => (
                  <div key={n}>→ {n}</div>
                ))}
              </div>
            </Panel>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Panel
              title="Brief · what creators communicate"
              aside={formats.map((f) => FORMAT_LABEL[f]).join(' + ')}
              pad
            >
              <p className="whitespace-pre-line text-[13.5px] leading-relaxed">{c.brief ?? '—'}</p>
              {c.formats.some((f) => f.requirements || f.referenceUrls.length) ? (
                <div className="mt-4 flex flex-col gap-2 border-t border-pill pt-3">
                  {c.formats.map((f) =>
                    f.requirements || f.referenceUrls.length ? (
                      <div key={f.format} className="text-[12.5px]">
                        <span className="font-semibold">{FORMAT_LABEL[f.format]}:</span> {f.requirements}
                        {f.referenceUrls.map((u) => (
                          <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="ml-2 font-mono text-[10px] underline">ref ↗</a>
                        ))}
                      </div>
                    ) : null,
                  )}
                </div>
              ) : null}
              <div className="mt-4">
                <Tag tone="outline">⊘ {c.exclusions.length ? c.exclusions.map((x) => x.displayName).join(', ') : 'No exclusions'}</Tag>
              </div>
            </Panel>
            <Panel title="Target demography · who we're buying reach into" pad>
              <dl className="flex flex-col gap-2 text-[12.5px]">
                {[
                  ['Cities', c.targetCities.map((x) => x.displayName).join(', ') || 'Pan-India'],
                  ['Age bands', c.ageBands.map((a) => a.replace('-', '–')).join(', ') || 'Any'],
                  ['Gender', GENDER_LABEL[c.genderTarget] ?? c.genderTarget],
                  ['Languages', c.targetLanguages.map((x) => x.displayName).join(', ') || 'Any'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-pill pb-2 last:border-0">
                    <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 font-mono text-[9px] uppercase text-faint">Cumulative mix audience adds up to this profile — no per-creator exclusion</p>
            </Panel>
          </div>

          <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
            {[
              ['Live window', windowLabel(c.liveFrom, c.liveTo)],
              ['Sampling', c.samplingNote ?? '—'],
              ['Mixes', c.mixes.length ? c.mixes.map((m) => `${m.label} (${m.creators}) · ${humanize(m.status)}`).join(' · ') : 'None yet'],
              ['Quote', quote ? `${quote.quoteNumber}${quote.revision > 1 ? ` v${quote.revision}` : ''} · ${humanize(quote.status)} · ${rupees(quote.totalMinor)} incl. GST` : 'Not prepared — finalize a mix first'],
            ].map(([k, v]) => (
              <div key={k} className="bg-card p-4">
                <Micro>{k}</Micro>
                <div className="mt-1.5 text-[12.5px]">{v}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'delivery' ? (
        <Panel
          title="Creator mix & delivery"
          aside={`${liveRoster.length - notLive} of ${liveRoster.length} live · metrics from Meta sync`}
        >
          {c.roster.length === 0 ? (
            <Empty>No roster yet — the deposit locks the creator list</Empty>
          ) : (
            c.roster.map((r) => (
              <DeliveryRow
                key={r.id}
                row={r}
                formats={formats}
                campaignLive={['SCHEDULED', 'ONGOING', 'MEASURING'].includes(c.state)}
                editable={c.state !== 'COMPLETED' && c.state !== 'CANCELLED'}
              />
            ))
          )}
        </Panel>
      ) : null}

      {tab === 'performance' ? (
        <div className="flex flex-col gap-4">
          <Panel title="Live performance vs billed targets" aside={`Measured within each post's ${c.measurementDefinition?.windowDays ?? 30}-day window`} pad>
            <div className="flex flex-col gap-4">
              {c.objectives.filter((o) => o.tier !== 'ADDON').map((o) => {
                const d = o.delivered ?? 0;
                const prog = o.targetValue ? d / o.targetValue : null;
                const ok = prog === null || prog >= 0.9;
                return (
                  <div key={o.id}>
                    <div className="flex justify-between gap-3 text-[13px]">
                      <span>{FORMAT_LABEL[o.format!]} {METRIC_LABEL[o.metric]?.toLowerCase()} <span className="font-mono text-[9px] uppercase text-faint">{o.tier.toLowerCase()}</span></span>
                      <span className={`tabular font-mono ${ok ? '' : 'text-danger'}`}>
                        {views(d)} / {fmtTarget(o)}{prog !== null ? ` · ${Math.round(prog * 100)}%` : ''}
                      </span>
                    </div>
                    <Bar value={prog} tone={ok ? 'ink' : 'danger'} className="mt-1.5" />
                  </div>
                );
              })}
            </div>
          </Panel>
          {addons.length ? (
            <Panel title="Add-on objectives · billed separately" pad>
              {addons.map((o) => (
                <div key={o.id} className="text-[13px]">
                  {METRIC_LABEL[o.metric]} · target {fmtTarget(o)}{o.detail ? ` · ${o.detail}` : ''}
                  <span className="ml-2 font-mono text-[9px] uppercase text-faint">Tracked outside Meta insights</span>
                </div>
              ))}
            </Panel>
          ) : null}
        </div>
      ) : null}

      {tab === 'money' ? (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <Panel title="Brand billing" aside={humanize(c.paymentState)}>
            {quote ? (
              <div className="border-b border-pill px-4 py-3 text-[13px]">
                Quote <Link href={`/admin/quotes/${quote.id}`} className="font-mono underline">{quote.quoteNumber}{quote.revision > 1 ? ` v${quote.revision}` : ''}</Link> ·{' '}
                {humanize(quote.status)} · {rupees(quote.subtotalMinor)} + GST = <strong>{rupees(quote.totalMinor)}</strong>
                {quote.depositPct ? ` · ${quote.depositPct}% deposit` : ''}
              </div>
            ) : null}
            {c.invoices.length === 0 ? (
              <Empty>No invoices yet — the deposit invoice issues when the quote is sent</Empty>
            ) : (
              c.invoices.map((i) => (
                <div key={i.id} className="border-b border-pill px-4 py-3 last:border-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-[12px] font-semibold">{i.number}</span>
                      <span className="ml-2 font-mono text-[9.5px] uppercase text-faint">{i.kind} · issued {shortDate(i.issuedAt)} · due {shortDate(i.dueAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tabular font-mono text-[12.5px]">{rupees(i.totalMinor)}</span>
                      <Tag tone={i.status === 'PAID' ? 'soft' : i.status === 'VOID' ? 'outline' : i.dueAt && new Date(i.dueAt) < new Date() ? 'danger' : 'hot'}>
                        {i.status === 'ISSUED' && i.dueAt && new Date(i.dueAt) < new Date() ? 'Overdue' : humanize(i.status)}
                      </Tag>
                    </div>
                  </div>
                  {i.paidMinor > 0 && i.status !== 'PAID' ? <div className="mt-1 text-[11.5px] text-gray">{rupees(i.paidMinor)} received so far</div> : null}
                  <InvoiceActions invoice={i} />
                </div>
              ))
            )}
          </Panel>
          <Panel title="Creator payouts · internal — never shared with the brand">
            {c.roster.length === 0 ? (
              <Empty>No contracts yet</Empty>
            ) : (
              c.roster.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 border-b border-pill px-4 py-2.5 text-[12.5px] last:border-0">
                  <span className="min-w-0 truncate">{r.name} <span className="font-mono text-[10px] text-faint">@{r.handle}</span></span>
                  <span className="tabular font-mono text-[11px] text-gray">{views(r.delivered.views)} / {views(r.payableViewsCap)}</span>
                  <span className="tabular w-24 text-right font-mono">{rupees(r.payout && r.payout.status !== 'ACCRUING' ? r.payout.grossMinor : r.accruedGrossMinor)}</span>
                  <Tag tone={r.payout?.status === 'ON_HOLD' ? 'danger' : 'soft'}>{r.payout ? humanize(r.payout.status) : '—'}</Tag>
                </div>
              ))
            )}
          </Panel>
        </div>
      ) : null}

      {tab === 'activity' ? (
        <Panel title="Activity" aside={`Created ${longDate(c.createdAt)}`}>
          {c.activity.length === 0 ? (
            <Empty>No activity recorded</Empty>
          ) : (
            c.activity.map((a, i) => (
              <div key={i} className="flex gap-4 border-b border-pill px-4 py-2.5 text-[12.5px] last:border-0">
                <span className="w-16 flex-none font-mono text-[10px] text-faint">{shortDate(a.at)}</span>
                <span className="min-w-0 flex-1">{activityText(a.type, a.payload)}</span>
                <span className="font-mono text-[9.5px] text-faint">{a.actor}</span>
              </div>
            ))
          )}
        </Panel>
      ) : null}

      {c.state === 'PAYMENT_PENDING' && depositInvoice && tab !== 'money' ? (
        <p className="mt-4 text-[12px] text-gray">
          Deposit {depositInvoice.number} for {rupees(depositInvoice.totalMinor)} is open —{' '}
          <Link href={`/admin/campaigns/${c.id}?tab=money`} className={buttonClass('smallGhost', 'ml-1')}>Go to money</Link>
        </p>
      ) : null}
    </div>
  );
}
