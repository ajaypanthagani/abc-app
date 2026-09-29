// Hand-written types for /v1/admin/* (abc-api src/modules/admin). Money is
// integer paise, rates are fractions, margins are basis points, dates ISO.

export type StaffRole =
  | 'SUPER_ADMIN'
  | 'BRAND_RELATIONSHIP_MANAGER'
  | 'CAMPAIGN_MANAGER'
  | 'CREATOR_MANAGER'
  | 'SUPPORT'
  | 'FINANCE';

export interface StaffSession {
  staff: { id: string; role: StaffRole; email: string | null; displayName: string | null };
}

export interface Badges {
  campaigns: number;
  brands: number;
  payments: number;
  rates: number;
}

export interface Taxonomies {
  categories: { slug: string; displayName: string }[];
  cities: { slug: string; displayName: string; state: string | null }[];
  languages: { slug: string; displayName: string }[];
  exclusions: { slug: string; displayName: string }[];
}

export interface Overview {
  asOf: string;
  pipeline: { lastRunAt: string | null; lastRunStatus: string | null; failedRuns24h: number };
  kpis: {
    liveCampaigns: number;
    measuring: number;
    creatorsActive: number;
    creatorsNewThisWeek: number;
    brands: number;
    invitesPending: number;
    billingsMonthMinor: number;
    payoutLiabilityMinor: number;
    grossMarginBps: number | null;
  };
  queues: { key: string; count: number; label: string; detail: string; since: string | null; href: string; hot: boolean }[];
  economics: {
    billingsMonthMinor: number;
    payoutsAccruedMinor: number;
    acceptedMonthSubtotalMinor: number;
    acceptedMonthPayoutMinor: number;
    grossMarginBps: number | null;
    depositsHeldMinor: number;
    overdueMinor: number;
    overdueBrands: number;
  };
  alerts: { tag: string; title: string; detail: string; href: string }[];
}

export type CampaignState =
  | 'DRAFT' | 'AWAITING_MIX' | 'MIX_PROPOSED' | 'PAYMENT_PENDING' | 'SCHEDULED'
  | 'ONGOING' | 'MEASURING' | 'COMPLETED' | 'CANCELLED';
export type PaymentState = 'UNPAID' | 'DEPOSIT_PENDING' | 'DEPOSIT_PAID' | 'BALANCE_PENDING' | 'PAID' | 'REFUNDED';
export type Format = 'IG_REEL' | 'IG_STORY' | 'IG_POST';
export type Tier = 'BASE' | 'PREMIUM' | 'ADDON';

export interface CampaignRow {
  id: string;
  name: string;
  brand: { id: string; name: string };
  state: CampaignState;
  paymentState: PaymentState;
  liveFrom: string | null;
  liveTo: string | null;
  briefedAt: string | null;
  budgetMinor: number | null;
  creators: number | null;
  payoutLiabilityMinor: number | null;
  marginBps: number | null;
  quote: { id: string; number: string; status: string } | null;
}

export interface CampaignList {
  filterCounts: Record<string, number>;
  rows: CampaignRow[];
}

export interface Objective {
  id: string;
  format: Format | null;
  tier: Tier;
  metric: string;
  targetValue: number | null;
  detail: string | null;
  delivered?: number | null;
}

export interface MetricTotals {
  views: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface RosterPost {
  postId: string;
  format: Format;
  permalink: string | null;
  linked: boolean;
  publishedAt: string;
  measurementEndsAt: string;
  measuredAt: string | null;
  metrics: MetricTotals | null;
}

export type ParticipationState =
  | 'ACCEPTED' | 'BRIEFED' | 'DRAFTING' | 'DRAFT_SUBMITTED' | 'CHANGES_REQUESTED' | 'APPROVED'
  | 'SCHEDULED' | 'PUBLISHED' | 'MEASURING' | 'COMPLETED' | 'CANCELLED';

export interface RosterRow {
  id: string;
  creatorId: string;
  name: string | null;
  handle: string | null;
  city: string | null;
  state: ParticipationState;
  reviewRound: number;
  deliverables: string | null;
  cpmMinor: number;
  payableViewsCap: number;
  maxPayoutMinor: number;
  delivered: MetricTotals;
  capUtilisation: number | null;
  accruedGrossMinor: number;
  posts: RosterPost[];
  payout: { id: string; status: string; grossMinor: number; netMinor: number; holdReason: string | null } | null;
}

export interface CampaignDetail {
  id: string;
  name: string;
  brand: { id: string; name: string };
  state: CampaignState;
  paymentState: PaymentState;
  brief: string | null;
  budgetMinor: number | null;
  genderTarget: string;
  ageBands: string[];
  liveFrom: string | null;
  liveTo: string | null;
  samplingNote: string | null;
  briefedAt: string | null;
  createdAt: string;
  measurementDefinition: { version: number; name: string; windowDays: number } | null;
  targetCities: { slug: string; displayName: string }[];
  targetLanguages: { slug: string; displayName: string }[];
  exclusions: { slug: string; displayName: string }[];
  formats: { format: Format; requirements: string | null; referenceUrls: string[] }[];
  objectives: Objective[];
  mixes: { id: string; label: string; strategy: string | null; status: string; creators: number; brandPriceMinor: number; payoutMinor: number }[];
  quote: {
    id: string; quoteNumber: string; revision: number; status: string; subtotalMinor: number;
    totalMinor: number; marginBps: number; creatorPayoutMinor: number; depositPct: number | null; sentAt: string | null;
  } | null;
  invoices: {
    id: string; number: string; kind: string; status: string; amountExTaxMinor: number; taxAmountMinor: number;
    totalMinor: number; paymentLinkUrl: string | null; issuedAt: string | null; dueAt: string | null; paidAt: string | null; paidMinor: number;
  }[];
  kpis: { budgetMinor: number | null; payoutLiabilityMinor: number | null; marginBps: number | null; creators: number | null };
  roster: RosterRow[];
  activity: { at: string; type: string; actor: string; payload: Record<string, unknown> }[];
}

export interface Candidate {
  id: string;
  name: string | null;
  handle: string | null;
  city: string | null;
  categories: { slug: string; displayName: string }[];
  languages: string[];
  availability: string;
  syncHealth: string;
  followers: number | null;
  followerGrowth90d: number | null;
  medianReelViews: number | null;
  viewFollowerRatio: number | null;
  saveRate: number | null;
  shareRate: number | null;
  commentRate: number | null;
  consistency: number | null;
  sampleMediaCount: number | null;
  audience: { targetCity: number | null; targetAge: number | null; youngAdult: number | null; women: number | null; india: number | null };
  projection: { views: number; shares: number | null; saves: number | null; comments: number | null } | null;
  cpmMinor: number | null;
  pricing: { payableViewsCap: number; payoutMinor: number; brandPriceMinor: number; margin: number | null } | null;
  match: number;
  blockers: string[];
}

export interface MixEntry {
  creatorProfileId: string;
  cpmMinor: number;
  payableViewsCap: number;
  expectedPayoutMinor: number;
  brandPriceMinor: number;
  matchScore: number | null;
}

export interface Mix {
  id: string;
  label: string;
  strategy: string | null;
  status: 'DRAFT' | 'PROPOSED' | 'FINALIZED' | 'DISCARDED';
  proposedAt: string | null;
  finalizedAt: string | null;
  entries: MixEntry[];
}

export interface MixBuilder {
  campaign: {
    id: string;
    name: string;
    state: CampaignState;
    brand: { id: string; name: string; industrySlug: string | null };
    brief: string | null;
    budgetMinor: number | null;
    liveFrom: string | null;
    liveTo: string | null;
    genderTarget: string;
    ageBands: string[];
    targetCities: { slug: string; displayName: string }[];
    targetLanguages: { slug: string; displayName: string }[];
    exclusions: { slug: string; displayName: string }[];
    formats: Format[];
    objectives: Objective[];
    editable: boolean;
  };
  mixes: Mix[];
  candidates: Candidate[];
}

export interface Quote {
  id: string;
  quoteNumber: string;
  revision: number;
  status: 'DRAFT' | 'APPROVAL_REQUESTED' | 'APPROVED' | 'SENT' | 'ACCEPTED' | 'SUPERSEDED';
  campaign: {
    id: string; name: string; state: CampaignState; budgetMinor: number | null; liveFrom: string | null; liveTo: string | null;
    brand: { id: string; name: string; legalName: string | null; gstin: string | null };
    formats: { format: Format }[];
  };
  mix: { id: string; label: string };
  createdAt: string;
  validUntil: string;
  sentAt: string | null;
  acceptedAt: string | null;
  approvalRequestedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  creatorLines: {
    id: string; creatorProfileId: string; name: string | null; handle: string | null; deliverables: string | null;
    listPriceMinor: number | null; amountMinor: number; payoutMinor: number | null;
  }[];
  feeLines: { id: string; description: string; amountMinor: number }[];
  rightsOption: string;
  exclusivityOption: string;
  depositPct: number | null;
  balanceTerms: string;
  poNumber: string | null;
  totals: {
    creatorMinor: number; feesMinor: number; rightsMinor: number; exclusivityMinor: number; discountMinor: number;
    subtotalMinor: number; taxMinor: number; totalMinor: number; depositExTaxMinor: number | null; depositTotalMinor: number | null;
  };
  internal: { creatorPayoutMinor: number; marginBps: number; marginFloorBps: number; belowFloor: boolean };
  options: {
    rights: { value: string; label: string; amountMinor: number }[];
    exclusivity: { value: string; label: string; amountMinor: number }[];
    deposit: number[];
    balanceTerms: { value: string; label: string }[];
  };
  gst: { rateBps: number; sac: string };
  editable: boolean;
}

export type SyncHealth = 'OK' | 'SYNCING' | 'FAILING' | 'TOKEN_EXPIRED' | 'REVOKED' | 'DISCONNECTED' | 'NOT_CONNECTED';

export interface CreatorRow {
  id: string;
  name: string | null;
  handle: string | null;
  avatarUrl: string | null;
  categories: { slug: string; displayName: string }[];
  city: string | null;
  status: string;
  availability: string;
  syncHealth: SyncHealth;
  followers: number | null;
  medianReelViews: number | null;
  cpmMinor: number | null;
  campaignsCompleted: number;
  paidToDateMinor: number;
  held: boolean;
}

export interface CreatorList {
  total: number;
  all: number;
  page: number;
  pageSize: number;
  rows: CreatorRow[];
}

export interface RateProposal {
  creatorId: string;
  name: string | null;
  handle: string | null;
  kind: 'INITIAL' | 'REVIEW';
  currentCpmMinor: number | null;
  campaignsConsidered: number;
  proposal: { proposedCpmMinor: number; deltaBps: number | null; quality: number; drivers: string[] };
}

export interface CreatorProfile {
  id: string;
  name: string | null;
  handle: string | null;
  avatarUrl: string | null;
  categories: { slug: string; displayName: string }[];
  city: string | null;
  status: string;
  availability: string;
  syncHealth: SyncHealth;
  languages: { slug: string; displayName: string }[];
  exclusions: string[];
  brandSafetyStatus: string;
  joinedAt: string;
  instagram: { username: string; status: string; lastSyncAt: string | null; tokenExpiresAt: string | null } | null;
  lastSyncError: string | null;
  metrics: {
    computedAt: string; followersCount: number | null; medianReelViews: number | null; meanReelViews: number | null;
    viewFollowerRatio: number | null; saveRate: number | null; shareRate: number | null; commentRate: number | null;
    engagementRate: number | null; consistencyScore: number | null; eligibleViews90d: number | null; sampleMediaCount: number | null;
  } | null;
  followerGrowth90d: number | null;
  audience: {
    capturedAt: string;
    age: Record<string, number>;
    gender: Record<string, number>;
    cities: { bucket: string; share: number }[];
    countries: { bucket: string; share: number }[];
    indiaShare: number | null;
  } | null;
  reels: { id: string; postedAt: string; permalink: string | null; views: number | null }[];
  pricing: {
    cpmMinor: number | null;
    proposal: (RateProposal & { due: boolean }) | null;
    typicalBrandPricePer1kMinor: number | null;
    blendedMarginBps: number | null;
    history: { cpmMinor: number; previousCpmMinor: number | null; effectiveFrom: string; reason: string; note: string | null }[];
  };
  reliability: { campaigns: number; completed: number; cancelled: number; avgReviewRounds: number | null; payoutsOnHold: number };
  paidToDateMinor: number;
  history: {
    participationId: string;
    campaign: { id: string; name: string; liveFrom: string | null; brand: { name: string } };
    state: string;
    views: number;
    capUtilisation: number;
    payoutMinor: number;
    payoutStatus: string | null;
    reviewRounds: number;
  }[];
  events: { at: string; type: string; payload: Record<string, unknown> }[];
}

export interface BrandRow {
  id: string;
  name: string;
  industry: { slug: string; displayName: string } | null;
  status: 'INVITED' | 'ACTIVE' | 'ARCHIVED';
  displayStatus: 'OVERDUE' | 'INVITED' | 'ACTIVE' | 'IDLE';
  owner: { email: string | null; name: string | null } | null;
  invite: { email: string; expiresAt: string; createdAt: string } | null;
  campaigns: number;
  activeCampaigns: number;
  lifetimeBillingsMinor: number;
  outstandingMinor: number;
  overdueMinor: number;
}

export interface InvoiceRow {
  id: string;
  number: string;
  kind: string;
  status: string;
  brand: { id: string; name: string };
  campaign: { id: string; name: string };
  amountExTaxMinor: number;
  totalMinor: number;
  paidMinor: number;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  paymentLinkUrl: string | null;
  overdueDays: number | null;
}

export interface PayoutList {
  kpis: {
    awaitingApprovalMinor: number; awaitingApprovalCount: number; paidThisMonthMinor: number; paidThisMonthCount: number;
    heldMinor: number; heldCount: number; tdsFyMinor: number;
  };
  rows: {
    id: string;
    status: string;
    creator: { id: string; name: string | null; handle: string | null };
    campaign: { id: string; name: string };
    eligibleViews: number;
    cpmMinor: number;
    grossMinor: number;
    tdsMinor: number;
    netMinor: number;
    holdReason: string | null;
    finalizedAt: string | null;
    approvedAt: string | null;
    paidAt: string | null;
    paymentReference: string | null;
  }[];
}
