/**
 * 62L-CL Historical Civilization Knowledge Graph — civilization-scale temporal
 * knowledge graph with honesty-typed edges/nodes.
 * facts ≠ correlations ≠ hypotheses ≠ simulations; no soul claims.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CL_LOCKS,
  GRAPH_HARD_SEPARATION,
  HONESTY_BANNER,
  SIM_TO_VERIFIED_FACT_REJECTED,
  SOUL_CLAIM_REJECTED,
  type CivilizationGraphNodeKind,
  type CivilizationGraphTrustState,
  type ClActor,
} from './global-knowledge-server-constellation-types';

export type CivilizationGraphNode = {
  id: string;
  kind: CivilizationGraphNodeKind;
  label: string;
  statement: string;
  era?: string;
  regionCode?: string;
  trustState: CivilizationGraphTrustState;
  evidenceRefs: string[];
  simulationLabeled: boolean;
  createdAt: string;
};

export type CivilizationGraphEdge = {
  id: string;
  fromId: string;
  toId: string;
  relation: string;
  honestyType: CivilizationGraphNodeKind;
  createdAt: string;
};

export type GraphPromotionAttempt = {
  id: string;
  nodeId: string;
  fromKind: CivilizationGraphNodeKind;
  toKind: CivilizationGraphNodeKind;
  rejected: true;
  reason: string;
  at: string;
};

export type SoulClaimDenial = {
  id: string;
  denied: true;
  reason: string;
  at: string;
};

type Store = {
  nodes: CivilizationGraphNode[];
  edges: CivilizationGraphEdge[];
  promotions: GraphPromotionAttempt[];
  soulDenials: SoulClaimDenial[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'historical-civilization-knowledge-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    nodes: [],
    edges: [],
    promotions: [],
    soulDenials: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultTrust(kind: CivilizationGraphNodeKind): CivilizationGraphTrustState {
  switch (kind) {
    case 'fact':
      return 'verified_fact';
    case 'simulation':
      return 'labeled_simulation';
    case 'correlation':
    case 'hypothesis':
    default:
      return 'recorded';
  }
}

export function civilizationGraphHonesty() {
  return {
    banner: HONESTY_BANNER,
    hardSeparation: GRAPH_HARD_SEPARATION,
    factsEqCorrelations: CL_LOCKS.FACTS_EQ_CORRELATIONS,
    correlationsEqHypotheses: CL_LOCKS.CORRELATIONS_EQ_HYPOTHESES,
    hypothesesEqSimulations: CL_LOCKS.HYPOTHESES_EQ_SIMULATIONS,
    simulationsEqVerifiedFacts: CL_LOCKS.SIMULATIONS_EQ_VERIFIED_FACTS,
    simPromoteToVerifiedFact: CL_LOCKS.SIM_PROMOTE_TO_VERIFIED_FACT,
    soulClaims: CL_LOCKS.SOUL_RESURRECTION_CLAIMS,
  };
}

export async function recordCivilizationGraphNode(input: {
  kind: CivilizationGraphNodeKind;
  label: string;
  statement: string;
  era?: string;
  regionCode?: string;
  evidenceRefs?: string[];
  root: string;
  actor: ClActor;
}): Promise<CivilizationGraphNode> {
  const store = await load(input.root);
  const node: CivilizationGraphNode = {
    id: id('hcgn'),
    kind: input.kind,
    label: input.label,
    statement: input.statement,
    era: input.era,
    regionCode: input.regionCode,
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

export async function linkCivilizationGraphEdge(input: {
  fromId: string;
  toId: string;
  relation: string;
  honestyType: CivilizationGraphNodeKind;
  root: string;
  actor: ClActor;
}): Promise<CivilizationGraphEdge | { denied: true; reason: string }> {
  const store = await load(input.root);
  const from = store.nodes.find((n) => n.id === input.fromId);
  const to = store.nodes.find((n) => n.id === input.toId);
  void input.actor;
  if (!from || !to) {
    return { denied: true, reason: 'CIVILIZATION_GRAPH_NODE_NOT_FOUND' };
  }
  // Edge honesty type must not silently upgrade simulation to fact.
  if (
    (from.kind === 'simulation' || to.kind === 'simulation') &&
    input.honestyType === 'fact'
  ) {
    return { denied: true, reason: SIM_TO_VERIFIED_FACT_REJECTED };
  }
  const edge: CivilizationGraphEdge = {
    id: id('hcge'),
    fromId: from.id,
    toId: to.id,
    relation: input.relation,
    honestyType: input.honestyType,
    createdAt: new Date().toISOString(),
  };
  store.edges.push(edge);
  await save(input.root, store);
  return edge;
}

export async function attemptCivilizationGraphPromotion(input: {
  nodeId: string;
  toKind: CivilizationGraphNodeKind;
  claimVerifiedFact?: boolean;
  root: string;
  actor: ClActor;
}): Promise<{
  accepted: false;
  rejected: true;
  reason: string;
  node: CivilizationGraphNode | null;
  attempt: GraphPromotionAttempt | null;
}> {
  const store = await load(input.root);
  const node = store.nodes.find((n) => n.id === input.nodeId) ?? null;
  void input.actor;

  if (!node) {
    return {
      accepted: false,
      rejected: true,
      reason: 'CIVILIZATION_GRAPH_NODE_NOT_FOUND',
      node: null,
      attempt: null,
    };
  }

  let reason = 'CIVILIZATION_GRAPH_ILLEGAL_PROMOTION_REJECTED';
  if (
    node.kind === 'simulation' &&
    (input.toKind === 'fact' || input.claimVerifiedFact)
  ) {
    reason = SIM_TO_VERIFIED_FACT_REJECTED;
  } else if (node.kind !== input.toKind) {
    reason =
      input.toKind === 'fact' || input.claimVerifiedFact
        ? node.kind === 'simulation'
          ? SIM_TO_VERIFIED_FACT_REJECTED
          : GRAPH_HARD_SEPARATION
        : GRAPH_HARD_SEPARATION;
  } else {
    reason = GRAPH_HARD_SEPARATION;
  }

  const attempt: GraphPromotionAttempt = {
    id: id('cgpromo'),
    nodeId: node.id,
    fromKind: node.kind,
    toKind: input.toKind,
    rejected: true,
    reason,
    at: new Date().toISOString(),
  };
  store.promotions.push(attempt);
  await save(input.root, store);
  return {
    accepted: false,
    rejected: true,
    reason,
    node,
    attempt,
  };
}

export async function rejectCivilizationSoulClaim(input: {
  claim: string;
  root: string;
  actor: ClActor;
}): Promise<SoulClaimDenial> {
  const store = await load(input.root);
  const denial: SoulClaimDenial = {
    id: id('soul'),
    denied: true,
    reason: SOUL_CLAIM_REJECTED,
    at: new Date().toISOString(),
  };
  void input.claim;
  void input.actor;
  store.soulDenials.push(denial);
  await save(input.root, store);
  return denial;
}
