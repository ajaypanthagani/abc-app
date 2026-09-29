'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminClientFetch, errorText } from '@/lib/admin/client';
import type { Format, RosterRow } from '@/lib/admin/types';
import { humanize, pct, rupees, shortDate, views } from '@/lib/admin/format';
import { ActionButton } from './ActionButton';
import { FORMAT_LABEL } from './status';
import { Avatar, Bar, Tag, buttonClass } from './ui';
import { initials } from '@/lib/admin/format';

const DRAFT_ACTIONS: Partial<Record<RosterRow['state'], { action: string; label: string; hot?: boolean }[]>> = {
  ACCEPTED: [{ action: 'brief', label: 'Mark briefed' }, { action: 'draft_submitted', label: 'Draft received', hot: true }],
  BRIEFED: [{ action: 'draft_submitted', label: 'Draft received', hot: true }],
  DRAFTING: [{ action: 'draft_submitted', label: 'Draft received', hot: true }],
  CHANGES_REQUESTED: [{ action: 'draft_submitted', label: 'Revised draft received', hot: true }],
  DRAFT_SUBMITTED: [{ action: 'approve', label: 'Approve draft', hot: true }, { action: 'request_changes', label: 'Request changes' }],
};

const LIVE = ['PUBLISHED', 'MEASURING', 'COMPLETED'];

export function DeliveryRow({
  row,
  formats,
  campaignLive,
  editable,
}: {
  row: RosterRow;
  formats: Format[];
  campaignLive: boolean;
  editable: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [format, setFormat] = useState<Format>(formats[0] ?? 'IG_REEL');
  const [permalink, setPermalink] = useState('');
  const [published, setPublished] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const live = LIVE.includes(row.state);
  const canPost = editable && campaignLive && ['APPROVED', 'SCHEDULED', 'PUBLISHED', 'MEASURING'].includes(row.state);
  const util = row.capUtilisation;

  async function addPost(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await adminClientFetch<{ linked: boolean }>(`/participations/${row.id}/posts`, {
        method: 'POST',
        body: { format, permalink: permalink.trim() || null, publishedAt: published },
      });
      setNote(res.linked ? 'Linked to synced media.' : 'Recorded — links automatically once the next Meta sync picks it up.');
      setAdding(false);
      setPermalink('');
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const stateTone = row.state === 'CANCELLED' ? 'outline' : live ? 'ink' : row.state === 'DRAFT_SUBMITTED' ? 'hot' : 'soft';
  const stateLabel =
    row.state === 'DRAFT_SUBMITTED' ? `Draft R${row.reviewRound}` : row.state === 'CHANGES_REQUESTED' ? `Changes · R${row.reviewRound}` : humanize(row.state);

  return (
    <div className="border-b border-pill px-4 py-3.5 last:border-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2.5">
          <Avatar text={initials(row.name)} />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium">
              {row.name ?? 'Creator'} <span className="font-mono text-[10px] text-faint">@{row.handle ?? '—'}{row.city ? ` · ${row.city}` : ''}</span>
            </div>
            <div className="font-mono text-[9.5px] uppercase text-faint">{row.deliverables ?? '—'} · cap {views(row.payableViewsCap)}</div>
          </div>
        </div>
        <Tag tone={stateTone}>{stateLabel}</Tag>
        <div className="w-[150px]">
          <div className="flex justify-between font-mono text-[10px]">
            <span>{views(row.delivered.views)} views</span>
            <span className={util !== null && util < 0.85 && live ? 'text-danger' : 'text-gray'}>{util === null ? '—' : pct(util, 0)}</span>
          </div>
          <Bar value={util} tone={util !== null && util < 0.85 && live ? 'danger' : 'ink'} className="mt-1" />
        </div>
        <div className="w-[120px] text-right">
          <div className="tabular font-mono text-[12px]">{rupees(row.payout && row.payout.status !== 'ACCRUING' ? row.payout.grossMinor : row.accruedGrossMinor)}</div>
          <div className="font-mono text-[9px] uppercase text-faint">{row.payout ? humanize(row.payout.status) : '—'}</div>
        </div>
        {editable ? (
          <div className="flex flex-wrap justify-end gap-1.5">
            {(DRAFT_ACTIONS[row.state] ?? []).map((a) => (
              <ActionButton key={a.action} path={`/participations/${row.id}/action`} body={{ action: a.action }} kind={a.hot ? 'hotMono' : 'smallGhost'}>
                {a.label}
              </ActionButton>
            ))}
            {canPost ? (
              <button type="button" onClick={() => setAdding(!adding)} className={buttonClass(adding ? 'smallGhost' : 'hotMono')}>
                {adding ? 'Close' : '+ Content link'}
              </button>
            ) : null}
            {!['CANCELLED', 'COMPLETED', 'PUBLISHED', 'MEASURING'].includes(row.state) ? (
              <ActionButton
                path={`/participations/${row.id}/action`}
                body={{ action: 'cancel' }}
                kind="smallGhost"
                confirm={`Withdraw ${row.name ?? 'this creator'} from the campaign? Their payout is cancelled.`}
              >
                Withdraw
              </ActionButton>
            ) : null}
          </div>
        ) : null}
      </div>

      {adding ? (
        <form onSubmit={addPost} className="mt-3 flex flex-wrap items-end gap-2 border border-line bg-paper p-3">
          <label>
            <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-faint">Format</span>
            <select value={format} onChange={(e) => setFormat(e.target.value as Format)} className="h-9 border border-field bg-card px-2 text-[12.5px]">
              {formats.map((f) => (
                <option key={f} value={f}>{FORMAT_LABEL[f]}</option>
              ))}
            </select>
          </label>
          <label className="min-w-[240px] flex-1">
            <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-faint">
              {format === 'IG_STORY' ? 'Story link (optional — stories have no public permalink)' : 'Instagram permalink'}
            </span>
            <input
              value={permalink}
              onChange={(e) => setPermalink(e.target.value)}
              placeholder="https://www.instagram.com/reel/…"
              className="h-9 w-full border border-field bg-card px-2.5 font-mono text-[11.5px] outline-none focus:border-ink"
            />
          </label>
          <label>
            <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-faint">Went live</span>
            <input type="date" value={published} onChange={(e) => setPublished(e.target.value)} className="h-9 border border-field bg-card px-2 text-[12.5px]" />
          </label>
          <button type="submit" disabled={busy} className={buttonClass('inkMono')}>{busy ? 'Saving…' : 'Record live'}</button>
          {error ? <span className="w-full text-[11.5px] text-danger">{error}</span> : null}
        </form>
      ) : null}
      {note ? <p className="mt-2 text-[11.5px] text-gray">{note}</p> : null}

      {row.posts.length ? (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {row.posts.map((p) => (
            <div key={p.postId} className="border border-line bg-paper p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[12.5px] font-semibold">{FORMAT_LABEL[p.format]}</span>
                  <span className="ml-2 font-mono text-[9.5px] uppercase text-faint">
                    Live {shortDate(p.publishedAt)} · window to {shortDate(p.measurementEndsAt)}
                  </span>
                </div>
                {editable ? (
                  <ActionButton path={`/posts/${p.postId}`} method="DELETE" kind="smallGhost" confirm="Remove this content link?">
                    ×
                  </ActionButton>
                ) : null}
              </div>
              {p.metrics ? (
                <div className="grid grid-cols-3 gap-2">
                  {(['views', 'reach', 'likes', 'comments', 'shares', 'saves'] as const).map((k) => (
                    <div key={k}>
                      <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-faint">{k}</div>
                      <div className="tabular font-mono text-[12px]">{views(p.metrics![k])}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="font-mono text-[9.5px] uppercase text-faint">
                  {p.linked ? 'No snapshot inside the window yet' : p.format === 'IG_STORY' ? 'No public permalink — metrics arrive via sync' : 'Waiting for Meta sync to link this post'}
                </div>
              )}
              {p.permalink ? (
                <a
                  href={p.permalink.startsWith('http') ? p.permalink : `https://${p.permalink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink underline underline-offset-2"
                >
                  Open on Instagram ↗
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {row.payout?.holdReason ? <p className="mt-2 text-[11.5px] text-danger">Payout on hold: {row.payout.holdReason}</p> : null}
    </div>
  );
}
