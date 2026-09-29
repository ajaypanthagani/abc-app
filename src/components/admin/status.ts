import type { CampaignState, SyncHealth } from '@/lib/admin/types';

type Tone = 'hot' | 'soft' | 'ink' | 'danger' | 'outline';

// Campaign states that need ops attention render lime ("hot").
export const CAMPAIGN_STATUS: Record<CampaignState, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Draft', tone: 'soft' },
  AWAITING_MIX: { label: 'Awaiting mix', tone: 'hot' },
  MIX_PROPOSED: { label: 'Mix proposed', tone: 'hot' },
  PAYMENT_PENDING: { label: 'Payment pending', tone: 'hot' },
  SCHEDULED: { label: 'Scheduled', tone: 'hot' },
  ONGOING: { label: 'Ongoing', tone: 'hot' },
  MEASURING: { label: 'Measuring', tone: 'soft' },
  COMPLETED: { label: 'Completed', tone: 'soft' },
  CANCELLED: { label: 'Cancelled', tone: 'outline' },
};

export const SYNC_STATUS: Record<SyncHealth, { label: string; tone: Tone }> = {
  OK: { label: 'OK', tone: 'soft' },
  SYNCING: { label: 'Syncing', tone: 'soft' },
  FAILING: { label: 'Sync failing', tone: 'hot' },
  TOKEN_EXPIRED: { label: 'Token expired', tone: 'hot' },
  REVOKED: { label: 'Revoked', tone: 'hot' },
  DISCONNECTED: { label: 'Disconnected', tone: 'hot' },
  NOT_CONNECTED: { label: 'Not connected', tone: 'outline' },
};

export const FORMAT_LABEL = { IG_REEL: 'Reel', IG_STORY: 'Story', IG_POST: 'Post' } as const;

export const METRIC_LABEL: Record<string, string> = {
  views: 'Views',
  reach: 'Reach',
  likes: 'Likes',
  comments: 'Comments',
  shares: 'Shares',
  saves: 'Saves',
  link_clicks: 'Link clicks',
  conversions: 'Conversions',
};

export const GENDER_LABEL: Record<string, string> = {
  ANY: 'Any gender',
  FEMALE_SKEWED: 'Female-skewed ≥ 60%',
  MALE_SKEWED: 'Male-skewed ≥ 60%',
  BALANCED: 'Balanced 40–60%',
};

// Human text for campaign activity rows (domain_event types).
export function activityText(type: string, p: Record<string, unknown>): string {
  const s = (k: string) => (p[k] === undefined || p[k] === null ? '' : String(p[k]));
  switch (type) {
    case 'CAMPAIGN_CREATED': return `Campaign created for ${s('brand')}`;
    case 'MIX_CREATED': return `${s('label')} created${p.copiedFrom ? ` from ${s('copiedFrom')}` : ''}`;
    case 'MIX_PROPOSED': return `${s('label')} shared for brand review · ${s('creators')} creators`;
    case 'MIX_FINALIZED': return `${s('label')} finalized · ${s('creators')} creators · quote drafted`;
    case 'QUOTE_APPROVAL_REQUESTED': return `Quote ${s('quote')} sent for margin approval`;
    case 'QUOTE_APPROVED': return `Quote ${s('quote')} approved below floor`;
    case 'QUOTE_APPROVAL_RESET': return `Quote ${s('quote')} edited — approval reset`;
    case 'QUOTE_SENT': return `Quote ${s('quote')} sent · deposit invoice ${s('depositInvoice')}`;
    case 'QUOTE_REVISED': return `Quote ${s('quote')} revised to v${s('revision')}`;
    case 'PAYMENT_LINK_SET': return `Payment link added to ${s('invoice')}`;
    case 'PAYMENT_RECORDED': return `Part payment recorded on ${s('invoice')}`;
    case 'INVOICE_PAID': return `${s('invoice')} paid (${s('method').toLowerCase().replace('_', ' ')})`;
    case 'CAMPAIGN_SCHEDULED': return `Deposit received — ${s('creators')} creators contracted`;
    case 'CAMPAIGN_WENT_LIVE': return 'Campaign marked live';
    case 'LIVE_WINDOW_CLOSED': return 'Live window closed — measuring';
    case 'MEASUREMENT_CLOSED': return `Measurement closed${p.balanceInvoice ? ` · balance invoice ${s('balanceInvoice')}` : ''}`;
    case 'CAMPAIGN_CANCELLED': return 'Campaign cancelled';
    case 'SYNC_REQUESTED': return `Meta sync queued for ${s('queued')} of ${s('creators')} creators`;
    case 'POST_RECORDED': return `${s('creator')} went live (${s('format').replace('IG_', '').toLowerCase()})${p.linked ? '' : ' · awaiting sync to link'}`;
    case 'POST_REMOVED': return 'Post removed';
    case 'PARTICIPATION_BRIEFED': return `${s('creator')} briefed`;
    case 'PARTICIPATION_DRAFT_SUBMITTED': return `${s('creator')} submitted draft round ${s('round')}`;
    case 'PARTICIPATION_CHANGES_REQUESTED': return `Changes requested from ${s('creator')}`;
    case 'PARTICIPATION_APPROVED': return `${s('creator')}'s draft approved`;
    case 'PARTICIPATION_CANCELLED': return `${s('creator')} withdrawn`;
    default: return type.replace(/_/g, ' ').toLowerCase();
  }
}
