/**
 * 62L-CH Historical World Model Graph — hard separation:
 * facts ≠ correlations ≠ causal hypotheses ≠ simulations.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CH_LOCKS,
  CORRELATION_TO_FACT_REJECTED,
  HONESTY_BANNER,
  SIM_TO_VERIFIED_FACT_REJECTED,
  WORLD_MODEL_HARD_SEPARATION,
  type ChActor,
  type WorldModelNodeKind,
  type WorldModelTrustState,
} from './knowledge-civilization-dept-universities-types';

export type WorldModelNode = {
  id: string;
  kind: WorldModelNodeKind;
  label: string;
  statement: string;
  trustState: WorldModelTrustState;
  evidenceRefs: string[];
  simulationLabeled: boolean;
  createdAt: string;
};

export type PromotionAttempt = {
  id: string;
  nodeId: string;
  fromKind: WorldModelNodeKind;
  toKind: WorldModelNodeKind;
  rejected: true;
  reason: string;
  at: string;
};

type Store = {
  nodes: WorldModelNode[];
  promotions: PromotionAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'historical-world-model-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { nodes: [], promotions: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultTrust(kind: WorldModelNodeKind): WorldModelTrustState {
  switch (kind) {
    case 'fact':
      return 'verified_fact';
    case 'simulation':
      return 'labeled_simulation';
    case 'correlation':
    case 'causal_hypothesis':
    default:
      return 'recorded';
  }
}

export function worldModelHonesty() {
  return {
    banner: HONESTY_BANNER,
    hardSeparation: WORLD_MODEL_HARD_SEPARATION,
    factsEqCorrelations: CH_LOCKS.FACTS_EQ_CORRELATIONS,
    correlationsEqCausal: CH_LOCKS.CORRELATIONS_EQ_CAUSAL_HYPOTHESES,
    causalEqSimulations: CH_LOCKS.CAUSAL_HYPOTHESES_EQ_SIMULATIONS,
    simulationsEqVerifiedFacts: CH_LOCKS.SIMULATIONS_EQ_VERIFIED_FACTS,
    correlationPromoteToFact: CH_LOCKS.CORRELATION_PROMOTE_TO_FACT,
    simPromoteToVerifiedFact: CH_LOCKS.SIM_PROMOTE_TO_VERIFIED_FACT,
  };
}

export async function recordWorldModelNode(input: {
  kind: WorldModelNodeKind;
  label: string;
  statement: string;
  evidenceRefs?: string[];
  root: string;
  actor: ChActor;
}): Promise<WorldModelNode> {
  const store = await load(input.root);
  const node: WorldModelNode = {
    id: id('wmn'),
    kind: input.kind,
    label: input.label,
    statement: input.statement,
    trustState: defaultTrust(input.kind),
    evidenceRefs: input.evidenceRefs ?? [],
    simulationLabeled: input.kind === 'simulation',
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

export async function attemptWorldModelPromotion(input: {
  nodeId: string;
  toKind: WorldModelNodeKind;
  claimVerifiedFact?: boolean;
  root: string;
  actor: ChActor;
}): Promise<{
  accepted: false;
  rejected: true;
  reason: string;
  node: WorldModelNode | null;
  attempt: PromotionAttempt | null;
}> {
  const store = await load(input.root);
  const node = store.nodes.find((n) => n.id === input.nodeId) ?? null;
  void input.actor;

  if (!node) {
    return {
      accepted: false,
      rejected: true,
      reason: 'WORLD_MODEL_NODE_NOT_FOUND',
      node: null,
      attempt: null,
    };
  }

  let reason = 'WORLD_MODEL_ILLEGAL_PROMOTION_REJECTED';
  if (node.kind === 'correlation' && (input.toKind === 'fact' || input.claimVerifiedFact)) {
    reason = CORRELATION_TO_FACT_REJECTED;
  } else if (
    node.kind === 'simulation' &&
    (input.toKind === 'fact' || input.claimVerifiedFact || input.toKind === 'causal_hypothesis')
  ) {
    reason = SIM_TO_VERIFIED_FACT_REJECTED;
  } else if (node.kind === 'causal_hypothesis' && input.toKind === 'fact') {
    reason = CORRELATION_TO_FACT_REJECTED;
  } else if (node.kind !== input.toKind) {
    // Any cross-kind silent promotion is rejected — hard separation.
    if (input.toKind === 'fact' || input.claimVerifiedFact) {
      reason =
        node.kind === 'simulation'
          ? SIM_TO_VERIFIED_FACT_REJECTED
          : CORRELATION_TO_FACT_REJECTED;
    } else {
      reason = WORLD_MODEL_HARD_SEPARATION;
    }
  } else {
    reason = WORLD_MODEL_HARD_SEPARATION;
  }

  const attempt: PromotionAttempt = {
    id: id('promo'),
    nodeId: node.id,
    fromKind: node.kind,
    toKind: input.toKind,
    rejected: true,
    reason,
    at: new Date().toISOString(),
  };
  store.promotions.push(attempt);
  // Never mutate kind/trust on illegal promotion.
  await save(input.root, store);
  return {
    accepted: false,
    rejected: true,
    reason,
    node,
    attempt,
  };
}
