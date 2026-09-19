// All user-facing strings live here (future i18n seam). Tone: factual, no
// fake promises — nothing is claimed that the product does not do today.

export const copy = {
  pitch: {
    eyebrow: 'Creator onboarding',
    headline: 'Get paid for brand campaigns.',
    body:
      'Connect Instagram once. ABC matches you with brand campaigns that fit your audience — the payout is stated before you accept. No pitching, no negotiating.',
    points: [
      'Paid per campaign, with the payout stated up front',
      'Campaign briefs matched to your categories',
      'Instagram only at launch · India',
    ],
  },
  signin: {
    title: 'Sign up with Instagram',
    sub: "Your Instagram account is your ABC account. There's nothing else to fill in — no password, no email verification.",
    cta: 'Continue with Instagram',
    notes: [
      'Requires a professional Instagram account — Creator or Business.',
      'One Instagram account per ABC creator profile.',
      'Already on ABC? The same button signs you in.',
      'You confirm access on instagram.com — if your browser is not signed in to Instagram, it asks you to log in there first.',
    ],
    legal:
      'By continuing you agree to the ABC creator terms, including the eligible-delivery measurement rules and payout caps stated on every campaign.',
  },
  signinErrors: {
    ig_denied: {
      title: 'Instagram sign-in was cancelled',
      body: 'Nothing was connected. Try again whenever you like.',
    },
    professional_account_required: {
      title: 'ABC works with professional Instagram accounts',
      body: 'Your account is currently personal. Switching to a Creator or Business account is free, takes about a minute, and you can switch back anytime:',
      steps: [
        'Open Instagram and go to your profile',
        'Tap the menu → Settings and activity',
        'Tap "Account type and tools"',
        'Choose "Switch to professional account" and pick Creator',
      ],
    },
    ig_already_linked: {
      title: 'This Instagram account is already on ABC',
      body: 'It is connected to another ABC profile. If that is unexpected, contact us and we will sort it out.',
    },
    missing_permissions: {
      title: 'ABC needs insights access',
      body: 'Your rate and campaign matching are calculated from your Reel performance. Reconnect and keep all permissions on.',
    },
    session_expired_retry: {
      title: 'That sign-in attempt expired',
      body: 'It was open too long. Try again — it only takes a moment.',
    },
    switch_requires_support: {
      title: 'This profile is connected to a different Instagram account',
      body: 'Switching the Instagram account on an ABC profile needs a quick check from us. Contact support and we will move it.',
    },
    ig_error: {
      title: 'Something went wrong connecting to Instagram',
      body: 'It is not you — try again in a minute.',
    },
    expired: {
      title: 'Your session expired',
      body: 'Sign in again to continue.',
    },
  } as Record<string, { title: string; body: string; steps?: string[] }>,
  connect: {
    title: 'Grant ABC access',
    sub: "ABC reads your account through Meta's official creator API so you never have to type your numbers in by hand.",
    accessTitle: 'ABC will access',
    permissions: [
      { title: 'Profile & follower count', detail: 'Handle, bio, category, follower history' },
      { title: 'Reels & post insights', detail: 'Views, reach, saves, shares, comments' },
      { title: 'Audience demographics', detail: 'Age, gender, top cities and countries' },
      { title: 'Weekly re-sync', detail: 'So your profile reflects how you grow' },
    ],
    footer: 'ABC never posts on your behalf and never shares your contact details or rate with brands.',
    cta: 'Continue with Instagram',
  },
  sync: {
    title: 'Syncing your Instagram',
    sub: 'Pulling twelve months of Reels and audience data.',
    closeNote: 'Sync runs on our side — you can close this tab and come back anytime.',
    partialDemographics:
      "Instagram doesn't share audience demographics for smaller accounts yet. Everything else synced fine.",
    failed: {
      title: 'Sync hit a problem',
      body: "Something went wrong on Instagram's side. We retry automatically — you can also retry now.",
      cta: 'Retry sync',
    },
  },
  profileStep: {
    title: "A few things Instagram can't tell us",
    sub: 'Everything else is imported automatically.',
    syncStripLabel: 'Importing your Instagram in the background',
    categories: 'Content categories',
    categoriesHint: 'Campaigns are matched to these. Pick up to 6.',
    categoriesOtherPlaceholder: 'Tell us what you create (optional)',
    city: 'City',
    cityOtherPlaceholder: 'Type your city or town',
    languages: 'Languages',
    languagesHint: 'The languages you make content in.',
    languagesOtherPlaceholder: 'Which language? (optional)',
    exclusions: "Won't promote",
    exclusionsHint: "Campaigns in these categories will never be offered to you.",
    submit: 'Continue',
  },
  network: {
    eyebrow: "You're in",
    title: "You're in the ABC network",
    sub: 'ABC matches campaigns to your categories and audience. When one fits, it lands here first — with the payout stated before you accept.',
    statMedian: 'Median Reel views',
    statFollowers: 'Followers',
    statReels: 'Reels synced',
    howPaidTitle: 'How you get paid',
    howPaid: [
      'Every campaign ABC sends you states an estimated payout and a maximum payable-views cap before you accept.',
      'Your final payout is calculated from eligible views measured for 30 days after publication, up to that cap.',
    ],
    profileTitle: 'Your campaign profile',
    editProfile: 'Edit profile',
    connectionTitle: 'Instagram connection',
    resync: 'Re-sync now',
    signOut: 'Sign out',
    insightsTitle: 'Your Instagram insights',
    insightsBody:
      'Every Reel ABC imported, with its views, reach, saves and shares, plus who your followers are by age, gender and city.',
    insightsCta: 'Open insights',
    nextTitle: "What happens next",
    next: 'ABC is onboarding early creators now and campaigns are matched as brands come on board. You will be contacted when a campaign fits. In the meantime your insights page stays current — ABC re-syncs it every week.',
  },
  insights: {
    eyebrow: 'Your numbers',
    title: 'Instagram insights',
    sub: 'Imported from your Instagram professional account and visible only to you. ABC re-syncs weekly, and you can re-sync any time from your profile.',
    back: 'Back to network',
    summaryTitle: 'Performance summary',
    statMedian: 'Median Reel views',
    statMean: 'Average Reel views',
    statFollowers: 'Followers',
    statSaveRate: 'Save rate',
    statShareRate: 'Share rate',
    statEngagement: 'Engagement rate',
    reelsTitle: 'Reel performance',
    reelsSub: 'Your most recent Reels, newest first. Open any Reel on Instagram from its permalink.',
    reelsEmpty:
      'No Reels imported yet. Publish a Reel on Instagram, then re-sync from your profile — it appears here once Instagram reports its insights.',
    colReel: 'Reel',
    colViews: 'Views',
    colReach: 'Reach',
    colLikes: 'Likes',
    colComments: 'Comments',
    colSaves: 'Saves',
    colShares: 'Shares',
    audienceTitle: 'Who follows you',
    audienceSub: 'Follower demographics as Instagram reports them, aggregated — never individual follower identities.',
    audienceUnavailable:
      'Instagram only shares follower demographics for accounts with 100 or more followers. Once your account passes that threshold, your age, gender and location breakdowns appear here automatically on the next sync.',
    audienceAge: 'Age',
    audienceGender: 'Gender',
    audienceCities: 'Top cities',
    audienceCountries: 'Top countries',
    trendTitle: 'Follower trend',
    trendSub: 'One point per sync, so you can see growth between weekly imports.',
    trendEmpty: 'Two or more syncs are needed before a trend can be drawn.',
    notConnected: 'Connect your Instagram account to see your insights.',
  },
  banner: {
    reconnect: 'Your Instagram connection needs attention. Reconnect to keep your profile current.',
    reconnectCta: 'Reconnect Instagram',
  },
  errors: {
    apiDown: {
      title: "We can't reach ABC right now",
      body: 'Your data is safe. Try again in a minute.',
      cta: 'Try again',
    },
  },
} as const;
