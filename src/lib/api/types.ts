// Hand-written types for the abc-api surface. The API is small and stable;
// switch to OpenAPI codegen when the surface grows past onboarding.

export type OnboardingStep = 'connect' | 'profile' | 'sync' | 'complete';

export interface SessionResponse {
  user: { id: string; displayName: string | null; role: 'CREATOR' };
  creator: { id: string; igUsername: string | null; avatarUrl: string | null } | null;
}

export interface OnboardingState {
  currentStep: OnboardingStep;
}

export type SyncStageStatus = 'pending' | 'running' | 'done' | 'skipped' | 'failed';

export interface SyncStage {
  key: string;
  label: string;
  status: SyncStageStatus;
  progress?: { done: number; total: number };
  note?: string;
}

export interface SyncCurrent {
  status: 'no_connection' | 'idle' | 'queued' | 'running' | 'failed';
  runId?: string;
  runType?: string;
  overallPercent?: number;
  stages?: SyncStage[];
  startedAt?: string | null;
  finishedAt?: string | null;
  lastFullSyncAt?: string | null;
}

export interface CreatorMe {
  id: string;
  displayName: string | null;
  availability: 'OPEN' | 'LIMITED' | 'PAUSED';
  city: { slug: string; displayName: string } | null;
  cityOtherText: string | null;
  categories: string[];
  categoriesOtherText: string | null;
  languages: string[];
  languagesOtherText: string | null;
  exclusions: string[];
  profileCompletedAt: string | null;
  onboardingCompletedAt: string | null;
  instagram: {
    username: string;
    avatarUrl: string | null;
    accountType: string | null;
    status: 'ACTIVE' | 'TOKEN_EXPIRED' | 'REVOKED' | 'DISCONNECTED';
    lastSyncAt: string | null;
  } | null;
  metrics: {
    computedAt: string;
    followersCount: number | null;
    medianReelViews: number | null;
    viewFollowerRatio: string | null;
    saveRate: string | null;
    shareRate: string | null;
    engagementRate: string | null;
    consistencyScore: string | null;
    eligibleViews90d: string | null;
    sampleMediaCount: number | null;
  } | null;
}

export interface AudienceBucket {
  bucket: string;
  followerCount: number | null;
  share: number | null;
}

export interface InsightsReel {
  id: string;
  permalink: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
  mediaType: string;
  postedAt: string;
  measuredAt: string | null;
  views: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  totalInteractions: number | null;
}

export type CreatorInsights =
  | { connected: false }
  | {
      connected: true;
      username: string;
      lastSyncAt: string | null;
      reels: InsightsReel[];
      audience: {
        capturedAt: string | null;
        available: boolean;
        age: AudienceBucket[];
        gender: AudienceBucket[];
        cities: AudienceBucket[];
        countries: AudienceBucket[];
      };
      followerTrend: { capturedAt: string; followersCount: number | null; mediaCount: number | null }[];
      summary: {
        computedAt: string;
        windowDays: number;
        followersCount: number | null;
        medianReelViews: number | null;
        meanReelViews: number | null;
        saveRate: number | null;
        shareRate: number | null;
        commentRate: number | null;
        engagementRate: number | null;
        viewFollowerRatio: number | null;
        sampleMediaCount: number | null;
      } | null;
    };

export interface ConnectionHealth {
  status: 'NONE' | 'ACTIVE' | 'TOKEN_EXPIRED' | 'REVOKED' | 'DISCONNECTED';
  igUsername?: string;
  accountType?: string | null;
  avatarUrl?: string | null;
  tokenValidUntil?: string | null;
  lastSyncAt?: string | null;
  snapshotsStored?: number;
  grantedScopes?: string[];
}

export interface TaxonomyItem {
  slug: string;
  displayName: string;
  state?: string | null;
}

export interface Taxonomies {
  categories: TaxonomyItem[];
  exclusionTopics: TaxonomyItem[];
  languages: TaxonomyItem[];
  cities: TaxonomyItem[];
}

export interface ProfilePayload {
  categories: string[];
  categoriesOtherText?: string;
  citySlug: string;
  cityOtherText?: string;
  languages: string[];
  languagesOtherText?: string;
  exclusions: string[];
  availability?: 'OPEN' | 'LIMITED' | 'PAUSED';
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown; requestId?: string | number };
}

// ── Creator dashboard (/v1/creators/me/{shell,home,campaigns,performance,payments})
// Money is integer paise; dates ISO. Creators never see CPM or brand pricing.

export type StageTone = 'hot' | 'ink' | 'soft' | 'muted';
export interface Stage {
  index: number;
  label: string;
  tone: StageTone;
  next: string;
}

export interface DashboardShell {
  name: string | null;
  handle: string | null;
  avatarUrl: string | null;
  availability: 'OPEN' | 'LIMITED' | 'PAUSED';
  instagram: { status: string; lastSyncAt: string | null } | null;
  badges: { campaigns: number; payments: number };
}

export interface DashboardHome {
  stats: {
    paidToDateMinor: number;
    paidCampaigns: number;
    clearingMinor: number;
    clearingCount: number;
    eligibleViews90d: number;
    completionRate: number | null;
    finishedCampaigns: number;
  };
  earnings: { month: string; amountMinor: number }[];
  upNext: {
    id: string;
    campaign: string;
    brand: string;
    stage: Stage;
    deliverables: string | null;
    liveFrom: string | null;
    liveTo: string | null;
    maxPayoutMinor: number;
    daysLeft: number | null;
  }[];
}

export interface CreatorCampaign {
  id: string;
  campaign: {
    id: string;
    name: string;
    brand: string;
    brief: string | null;
    liveFrom: string | null;
    liveTo: string | null;
    sampling: string | null;
    measurementDays: number;
    formats: { format: string; requirements: string | null; referenceUrls: string[] }[];
  };
  deliverables: string | null;
  state: string;
  stage: Stage;
  payableViewsCap: number;
  eligibleViews: number | null;
  capShare: number | null;
  maxPayoutMinor: number;
  payout:
    | { kind: 'final'; grossMinor: number; netMinor: number; tdsMinor: number; status: string; paidAt: string | null; reference: string | null }
    | { kind: 'accruing'; grossMinor: number }
    | null;
  publishedAt: string | null;
  measurementEndsAt: string | null;
  daysLeft: number | null;
  posts: { format: string; permalink: string | null; publishedAt: string; measurementEndsAt: string; views: number | null }[];
}

export interface DashboardCampaigns {
  activeCount: number;
  completedCount: number;
  pipeline: string[];
  featured: CreatorCampaign | null;
  rows: CreatorCampaign[];
}

export interface DashboardPerformance {
  metrics: {
    computedAt: string;
    medianReelViews: number | null;
    viewFollowerRatio: number | null;
    consistency: number | null;
    saveRate: number | null;
    shareRate: number | null;
    sampleMediaCount: number | null;
  } | null;
  completedCampaigns: number;
  reviews: { at: string; change: string; reason: string }[];
}

export interface DashboardPayments {
  stats: {
    clearingMinor: number;
    clearingCount: number;
    paidFyMinor: number;
    tdsFyMinor: number;
    avgPerCampaignMinor: number | null;
    avgSample: number;
    fyStartYear: number;
  };
  rows: {
    id: string;
    campaign: string;
    brand: string;
    eligibleViews: number | null;
    amountMinor: number;
    status: { label: string; tone: 'hot' | 'ink' | 'soft' };
    measurementEndsAt: string | null;
    paidAt: string | null;
    reference: string | null;
    tdsMinor: number | null;
  }[];
  payoutAccount: null;
}
