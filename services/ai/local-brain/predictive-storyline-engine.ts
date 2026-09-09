/**
 * 62L-DJ Predictive Storyline Engine —
 * Storyline feeds; predictive story cards (probabilistic, evidence-linked).
 * No guaranteed prediction claims.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DJ_LOCKS,
  GUARANTEED_PREDICTION_REJECTED,
  HONESTY_BANNER,
  MAX_STORYLINE_CARDS,
  STORYLINE_MUST_BE_PROBABILISTIC,
  type DjActor,
  type StorylineCardLabel,
} from './personal-intelligence-command-os-types';

export type StorylineFeed = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type PredictiveStoryCard = {
  id: string;
  feedId: string;
  title: string;
  probability: number;
  label: StorylineCardLabel;
  evidenceIds: string[];
  claimGuaranteed: false;
  status: 'ACCEPTED' | 'REJECTED';
  reason: string;
  at: string;
};

type Store = { feeds: StorylineFeed[]; cards: PredictiveStoryCard[] };

function storePath(root: string) {
  return xivLocalPath(root, 'predictive-storyline-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { feeds: [], cards: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function predictiveStorylineEngineHonesty() {
  return {
    banner: HONESTY_BANNER,
    guaranteedPredictionClaims: DJ_LOCKS.GUARANTEED_PREDICTION_CLAIMS,
    predictionsProbabilisticOnly: DJ_LOCKS.PREDICTIONS_PROBABILISTIC_ONLY,
    productionAuthorization: DJ_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function bootstrapPredictiveStorylineEngine(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DjActor;
}): Promise<StorylineFeed> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.feeds.find(
    (f) =>
      f.orgId === input.orgId &&
      f.tenantId === input.tenantId &&
      f.universeId === input.universeId,
  );
  if (existing) return existing;
  const feed: StorylineFeed = {
    id: id('djfeed'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.feeds.push(feed);
  await save(input.root, store);
  return feed;
}

export async function publishStorylineCard(input: {
  feedId: string;
  title: string;
  probability?: number;
  evidenceIds?: string[];
  claimGuaranteed?: boolean;
  labelAsCertain?: boolean;
  root: string;
  actor: DjActor;
}): Promise<{ accepted: boolean; reason: string; card?: PredictiveStoryCard; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const feed = store.feeds.find((f) => f.id === input.feedId);
  if (!feed) return { accepted: false, reason: 'STORYLINE_FEED_NOT_FOUND', at: now };
  if (store.cards.length >= MAX_STORYLINE_CARDS) {
    return { accepted: false, reason: 'MAX_STORYLINE_CARDS_BOUNDED', at: now };
  }

  if (input.claimGuaranteed === true || input.labelAsCertain === true) {
    const card: PredictiveStoryCard = {
      id: id('djcard'),
      feedId: feed.id,
      title: input.title.trim() || 'untitled',
      probability: 0,
      label: 'HYPOTHESIS',
      evidenceIds: [],
      claimGuaranteed: false,
      status: 'REJECTED',
      reason: GUARANTEED_PREDICTION_REJECTED,
      at: now,
    };
    store.cards.push(card);
    await save(input.root, store);
    return { accepted: false, reason: GUARANTEED_PREDICTION_REJECTED, card, at: now };
  }

  const evidenceIds = (input.evidenceIds ?? []).filter((e) => e.trim().length > 0);
  if (evidenceIds.length === 0) {
    return {
      accepted: false,
      reason: STORYLINE_MUST_BE_PROBABILISTIC,
      at: now,
    };
  }

  const probability =
    typeof input.probability === 'number' && Number.isFinite(input.probability)
      ? Math.min(1, Math.max(0, input.probability))
      : 0.5;

  const card: PredictiveStoryCard = {
    id: id('djcard'),
    feedId: feed.id,
    title: input.title.trim() || 'untitled',
    probability,
    label: 'PROBABILISTIC',
    evidenceIds,
    claimGuaranteed: false,
    status: 'ACCEPTED',
    reason: 'STORYLINE_CARD_PROBABILISTIC_EVIDENCE_LINKED',
    at: now,
  };
  store.cards.push(card);
  await save(input.root, store);
  return { accepted: true, reason: card.reason, card, at: now };
}
