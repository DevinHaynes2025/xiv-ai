/**
 * 62L-DS Financial Command Brain —
 * Pricing/margin intelligence; recommend ≠ apply price.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DS_LOCKS,
  FINANCIAL_RECOMMEND_NEQ_APPLY_PRICE,
  HONESTY_BANNER,
  MAX_PRICE_RECOMMENDATIONS,
  type DsActor,
  isFounderOrHumanApprover,
} from './revenue-intelligence-os-types';

export type PriceRecommendation = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  sku: string;
  recommendedPrice: number;
  marginEstimate: number;
  recommendationOnly: true;
  applied: false;
  createdAt: string;
};

export type ApplyPriceAttempt = {
  id: string;
  recommendationId: string;
  status: 'denied' | 'founder_gated_advisory';
  reason: string;
  at: string;
};

type Store = { recommendations: PriceRecommendation[]; applies: ApplyPriceAttempt[] };

function storePath(root: string) {
  return xivLocalPath(root, 'financial-command-brain.json');
}
async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { recommendations: [], applies: [] });
}
async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}
function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function financialCommandBrainHonesty() {
  return {
    banner: HONESTY_BANNER,
    recommendEqApplyPrice: DS_LOCKS.RECOMMENDATION_EQ_APPLY_PRICE,
    l4AutonomyEnabled: DS_LOCKS.L4_AUTONOMY_ENABLED,
  };
}

export async function recommendPrice(input: {
  sku: string;
  recommendedPrice: number;
  marginEstimate: number;
  root: string;
  actor: DsActor;
}): Promise<PriceRecommendation> {
  const store = await load(input.root);
  if (store.recommendations.length >= MAX_PRICE_RECOMMENDATIONS) {
    throw new Error('MAX_PRICE_RECOMMENDATIONS_REACHED');
  }
  const rec: PriceRecommendation = {
    id: id('fprice'),
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    sku: input.sku,
    recommendedPrice: input.recommendedPrice,
    marginEstimate: input.marginEstimate,
    recommendationOnly: true,
    applied: false,
    createdAt: new Date().toISOString(),
  };
  store.recommendations.push(rec);
  await save(input.root, store);
  return rec;
}

export async function attemptApplyPrice(input: {
  recommendationId: string;
  root: string;
  actor: DsActor;
}): Promise<ApplyPriceAttempt> {
  const store = await load(input.root);
  const founderOk = isFounderOrHumanApprover(input.actor);
  const attempt: ApplyPriceAttempt = {
    id: id('fapply'),
    recommendationId: input.recommendationId,
    status: founderOk ? 'founder_gated_advisory' : 'denied',
    reason: founderOk
      ? 'FOUNDER_GATE_ADVISORY_PRICE_NOT_AUTO_APPLIED'
      : FINANCIAL_RECOMMEND_NEQ_APPLY_PRICE,
    at: new Date().toISOString(),
  };
  store.applies.push(attempt);
  await save(input.root, store);
  return attempt;
}
