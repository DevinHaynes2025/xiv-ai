/**
 * 62L-EG Module E — Marketing Intelligence Team.
 * Expanded AI marketing dept; recommend ≠ spend/publish;
 * marketing ≠ deceptive claims.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MARKETING_NEQ_DECEPTIVE,
  MARKETING_NEQ_PUBLISH,
  MARKETING_NEQ_SPEND,
  MAX_MARKETING,
  type EgActor,
  type EgEvidenceState,
} from './cognitive-operations-backbone-types';

export type MarketingRecommendation = {
  id: string;
  campaignId: string;
  autoSpendRequested: boolean;
  status: 'recommendation_only' | 'denied';
  state: EgEvidenceState;
  reason: string;
  spent: false;
  at: string;
};

export type MarketingPublishGate = {
  id: string;
  campaignId: string;
  autoPublishRequested: boolean;
  status: 'recommendation_only' | 'denied';
  state: EgEvidenceState;
  reason: string;
  published: false;
  at: string;
};

export type MarketingClaimProbe = {
  id: string;
  claimText: string;
  deceptive: boolean;
  status: 'ok' | 'denied';
  state: EgEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  recommendations: MarketingRecommendation[];
  publishes: MarketingPublishGate[];
  claims: MarketingClaimProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'marketing-intelligence-team.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    recommendations: [],
    publishes: [],
    claims: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function marketingIntelligenceTeamHonesty() {
  return {
    recommendNeqSpend: true,
    recommendNeqPublish: true,
    deceptiveClaimsDenied: true,
    spent: false,
    published: false,
  };
}

export async function recommendMarketingCampaign(input: {
  campaignId: string;
  autoSpendRequested?: boolean;
  root: string;
  actor: EgActor;
}): Promise<MarketingRecommendation> {
  const store = await load(input.root);
  void input.actor;
  if (store.recommendations.length >= MAX_MARKETING) {
    throw new Error('MAX_MARKETING_REACHED');
  }
  const auto = Boolean(input.autoSpendRequested);
  const rec: MarketingRecommendation = {
    id: id('egmkt'),
    campaignId: input.campaignId.trim(),
    autoSpendRequested: auto,
    status: auto ? 'denied' : 'recommendation_only',
    state: auto ? 'DENIED' : 'RECOMMENDATION_ONLY',
    reason: MARKETING_NEQ_SPEND,
    spent: false,
    at: new Date().toISOString(),
  };
  store.recommendations.push(rec);
  await save(input.root, store);
  return rec;
}

export async function gateMarketingPublish(input: {
  campaignId: string;
  autoPublishRequested?: boolean;
  root: string;
  actor: EgActor;
}): Promise<MarketingPublishGate> {
  const store = await load(input.root);
  void input.actor;
  if (store.publishes.length >= MAX_MARKETING) {
    throw new Error('MAX_MARKETING_REACHED');
  }
  const auto = Boolean(input.autoPublishRequested);
  const gate: MarketingPublishGate = {
    id: id('egpub'),
    campaignId: input.campaignId.trim(),
    autoPublishRequested: auto,
    status: auto ? 'denied' : 'recommendation_only',
    state: auto ? 'DENIED' : 'RECOMMENDATION_ONLY',
    reason: MARKETING_NEQ_PUBLISH,
    published: false,
    at: new Date().toISOString(),
  };
  store.publishes.push(gate);
  await save(input.root, store);
  return gate;
}

export async function probeMarketingClaim(input: {
  claimText: string;
  deceptive: boolean;
  root: string;
  actor: EgActor;
}): Promise<MarketingClaimProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: MarketingClaimProbe = {
    id: id('egclaim'),
    claimText: input.claimText.trim(),
    deceptive: input.deceptive,
    status: input.deceptive ? 'denied' : 'ok',
    state: input.deceptive ? 'DENIED' : 'PASS',
    reason: MARKETING_NEQ_DECEPTIVE,
    at: new Date().toISOString(),
  };
  store.claims.push(probe);
  await save(input.root, store);
  return probe;
}
