/**
 * US-SOC-01 — Profiles + business articles feed (daily).
 * Prototype content pipeline only — not a live social network.
 * Honest WAITING_DATA when unbound; never fabricate live social/engagement metrics.
 * L4 false. No autonomous production mutations.
 */

export const PROFILES_ARTICLES_POLICY = {
  l4Autonomy: false as const,
  productionMutation: false as const,
  liveSocialMetrics: false as const,
  contentMode: 'prototype_demo' as const,
  feedCadence: 'daily' as const,
  label: 'PROFILES_ARTICLES_PROTOTYPE_PIPELINE',
} as const;

export type ContentGate = 'WAITING_DATA' | 'PROTOTYPE_DEMO';

export type EngagementMetricsGate = 'WAITING_DATA';

/** Engagement numbers stay null — never invent likes/views/followers/shares. */
export type EngagementMetrics = {
  gate: EngagementMetricsGate;
  likes: null;
  views: null;
  shares: null;
  followers: null;
  comments: null;
  note: string;
};

export type PrototypeProfile = {
  id: string;
  handle: string;
  displayName: string;
  persona: 'consumer' | 'business';
  headline: string;
  industry: string;
  /** Explicit: prototype/demo identity only — not a live social account. */
  prototypeOnly: true;
  liveSocial: false;
  engagement: EngagementMetrics;
};

export type PrototypeArticle = {
  id: string;
  title: string;
  summary: string;
  topic: string;
  /** ISO date (YYYY-MM-DD) for the daily feed slot. */
  feedDate: string;
  authorHandle: string;
  /** Explicit: AI/demo draft content — not published live engagement. */
  prototypeOnly: true;
  publishedLive: false;
  engagement: EngagementMetrics;
};

export type ProfilesArticlesView = {
  status: 'READY' | 'WAITING_DATA';
  role: 'consumer_business';
  l4Autonomy: false;
  productionMutation: false;
  liveSocialMetrics: false;
  contentMode: 'prototype_demo';
  feedCadence: 'daily';
  contentGate: ContentGate;
  /** null when unbound — honest empty; never invent profile rows. */
  profiles: PrototypeProfile[] | null;
  /** null when unbound — honest empty; never invent article rows. */
  articles: PrototypeArticle[] | null;
  /** Always WAITING_DATA — live social/engagement metrics are never fabricated. */
  engagementMetrics: EngagementMetricsGate;
  note: string;
};

const WAITING_ENGAGEMENT: EngagementMetrics = {
  gate: 'WAITING_DATA',
  likes: null,
  views: null,
  shares: null,
  followers: null,
  comments: null,
  note: 'WAITING_DATA — live social/engagement metrics are not fabricated in the prototype pipeline.',
};

/** Builtin prototype profiles — session demo only; not live social accounts. */
export const BUILTIN_PROTOTYPE_PROFILES: readonly Omit<PrototypeProfile, 'engagement'>[] = [
  {
    id: 'proto-profile-northstar',
    handle: 'northstar-ops',
    displayName: 'Northstar Operations',
    persona: 'business',
    headline: 'Operations twin for mid-market supply networks',
    industry: 'logistics',
    prototypeOnly: true,
    liveSocial: false,
  },
  {
    id: 'proto-profile-civicpulse',
    handle: 'civic-pulse',
    displayName: 'Civic Pulse',
    persona: 'consumer',
    headline: 'Community innovator exploring local commerce loops',
    industry: 'community',
    prototypeOnly: true,
    liveSocial: false,
  },
  {
    id: 'proto-profile-helixmfg',
    handle: 'helix-mfg',
    displayName: 'Helix Manufacturing',
    persona: 'business',
    headline: 'Component maker — prototype directory listing only',
    industry: 'manufacturing',
    prototypeOnly: true,
    liveSocial: false,
  },
] as const;

/** Builtin daily business article drafts — prototype/demo only. */
export const BUILTIN_PROTOTYPE_ARTICLES: readonly Omit<PrototypeArticle, 'engagement' | 'feedDate'>[] = [
  {
    id: 'proto-article-supply-resync',
    title: 'Why mid-market suppliers need a daily resync ritual',
    summary:
      'Prototype brief on aligning warehouse, carrier, and purchase-order signals without inventing live throughput numbers.',
    topic: 'supply_chain',
    authorHandle: 'northstar-ops',
    prototypeOnly: true,
    publishedLive: false,
  },
  {
    id: 'proto-article-honest-metrics',
    title: 'Honest metrics beats vanity engagement',
    summary:
      'Demo editorial on keeping WAITING_DATA visible until real engagement sources bind — never fabricate likes or followers.',
    topic: 'trust_data',
    authorHandle: 'civic-pulse',
    prototypeOnly: true,
    publishedLive: false,
  },
  {
    id: 'proto-article-oem-directory',
    title: 'OEM directory cards without fake social proof',
    summary:
      'Prototype note on manufacturer profiles that stay evidence-first: headline and industry only until verified signals exist.',
    topic: 'manufacturing',
    authorHandle: 'helix-mfg',
    prototypeOnly: true,
    publishedLive: false,
  },
] as const;

type SessionBundle = {
  loadedAt: string;
  feedDate: string;
  profiles: PrototypeProfile[];
  articles: PrototypeArticle[];
};

const globalStore = globalThis as typeof globalThis & {
  __xivProfilesArticlesBundle?: SessionBundle | null;
};

function todayFeedDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function resetProfilesArticlesSession() {
  globalStore.__xivProfilesArticlesBundle = null;
}

export function profilesArticlesAllowsL4(): false {
  return false;
}

export function profilesArticlesAllowsProductionMutation(): false {
  return false;
}

export function profilesArticlesAllowsLiveSocialMetrics(): false {
  return false;
}

export function isProfilesArticlesPrototypeLoaded(): boolean {
  return Boolean(globalStore.__xivProfilesArticlesBundle);
}

function withEngagement<T extends { engagement?: EngagementMetrics }>(
  row: Omit<T, 'engagement'> & { engagement?: EngagementMetrics },
): T {
  return {
    ...(row as Omit<T, 'engagement'>),
    engagement: WAITING_ENGAGEMENT,
  } as T;
}

/**
 * Load builtin prototype profiles + daily articles into session memory.
 * Explicit demo action only — does not bind live social or invent engagement counts.
 */
export function loadPrototypeProfilesArticlesFeed(input?: { feedDate?: string }): SessionBundle {
  const feedDate = (input?.feedDate ?? todayFeedDate()).slice(0, 10);
  const profiles = BUILTIN_PROTOTYPE_PROFILES.map((profile) =>
    withEngagement<PrototypeProfile>(profile),
  );
  const articles = BUILTIN_PROTOTYPE_ARTICLES.map((article) =>
    withEngagement<PrototypeArticle>({ ...article, feedDate }),
  );
  const bundle: SessionBundle = {
    loadedAt: new Date().toISOString(),
    feedDate,
    profiles,
    articles,
  };
  globalStore.__xivProfilesArticlesBundle = bundle;
  return bundle;
}

export function clearPrototypeProfilesArticlesFeed() {
  globalStore.__xivProfilesArticlesBundle = null;
}

/**
 * Profiles + daily business articles view.
 * Unbound → WAITING_DATA with null profiles/articles and engagement WAITING_DATA.
 * After explicit prototype load → PROTOTYPE_DEMO rows only; engagement stays WAITING_DATA.
 */
export function listProfilesArticlesView(): ProfilesArticlesView {
  const bundle = globalStore.__xivProfilesArticlesBundle ?? null;

  if (!bundle) {
    return {
      status: 'WAITING_DATA',
      role: 'consumer_business',
      l4Autonomy: false,
      productionMutation: false,
      liveSocialMetrics: false,
      contentMode: 'prototype_demo',
      feedCadence: 'daily',
      contentGate: 'WAITING_DATA',
      profiles: null,
      articles: null,
      engagementMetrics: 'WAITING_DATA',
      note:
        'WAITING_DATA — prototype profiles/articles feed not loaded. Live social and engagement metrics are not fabricated. L4 false; no production mutations.',
    };
  }

  return {
    status: 'READY',
    role: 'consumer_business',
    l4Autonomy: false,
    productionMutation: false,
    liveSocialMetrics: false,
    contentMode: 'prototype_demo',
    feedCadence: 'daily',
    contentGate: 'PROTOTYPE_DEMO',
    profiles: bundle.profiles.slice(),
    articles: bundle.articles.slice(),
    engagementMetrics: 'WAITING_DATA',
    note: `PROTOTYPE_DEMO — session prototype profiles + daily articles for ${bundle.feedDate} (loaded ${bundle.loadedAt}). Engagement metrics remain WAITING_DATA (likes/views/shares/followers/comments stay null). Not live social. L4 false; no production mutations.`,
  };
}
