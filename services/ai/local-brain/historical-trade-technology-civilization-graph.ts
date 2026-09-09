/**
 * 62L-CO Historical Trade/Technology Civilization Graph — provenance-typed edges.
 * Facts ≠ correlations ≠ hypotheses ≠ sims; reject promotion of correlation/sim to verified fact.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CO_LOCKS,
  GRAPH_HARD_SEPARATION,
  GRAPH_PROMOTE_REJECTED,
  HONESTY_BANNER,
  type CoActor,
  type GraphEdgeKind,
} from './global-knowledge-exchange-os-types';

export type TradeTechNode = {
  id: string;
  label: string;
  kind: GraphEdgeKind;
  provenanceRef: string | null;
  trustState: 'recorded' | 'supported' | 'verified_fact' | 'rejected' | 'labeled';
  reason: string;
  createdAt: string;
};

export type TradeTechEdge = {
  id: string;
  fromId: string;
  toId: string;
  kind: GraphEdgeKind;
  pathway: 'trade' | 'technology' | 'civilization';
  provenanceRef: string | null;
  trustState: 'recorded' | 'supported' | 'verified_fact' | 'rejected' | 'labeled';
  reason: string;
  createdAt: string;
};

export type GraphPromotionAttempt = {
  id: string;
  nodeOrEdgeId: string;
  fromKind: GraphEdgeKind;
  toTrust: 'verified_fact';
  accepted: boolean;
  reason: string;
  at: string;
};

type Store = {
  nodes: TradeTechNode[];
  edges: TradeTechEdge[];
  promotions: GraphPromotionAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'historical-trade-technology-civilization-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    nodes: [],
    edges: [],
    promotions: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function tradeTechGraphHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CO_LOCKS.L4_AUTONOMY_ENABLED,
    factsEqCorrelations: CO_LOCKS.FACTS_EQ_CORRELATIONS,
    correlationsEqHypotheses: CO_LOCKS.CORRELATIONS_EQ_HYPOTHESES,
    hypothesesEqSimulations: CO_LOCKS.HYPOTHESES_EQ_SIMULATIONS,
    simulationsEqVerifiedFacts: CO_LOCKS.SIMULATIONS_EQ_VERIFIED_FACTS,
    correlationPromoteToVerifiedFact: CO_LOCKS.CORRELATION_PROMOTE_TO_VERIFIED_FACT,
    simPromoteToVerifiedFact: CO_LOCKS.SIM_PROMOTE_TO_VERIFIED_FACT,
    hardSeparation: GRAPH_HARD_SEPARATION,
  };
}

export async function recordTradeTechNode(input: {
  label: string;
  kind: GraphEdgeKind;
  provenanceRef?: string | null;
  root: string;
  actor: CoActor;
}): Promise<TradeTechNode> {
  const store = await load(input.root);
  const kind = input.kind;
  let trustState: TradeTechNode['trustState'] = 'recorded';
  let reason = 'TRADE_TECH_NODE_RECORDED_WITH_KIND';

  if (kind === 'fact' && input.provenanceRef) {
    trustState = 'verified_fact';
    reason = 'FACT_NODE_WITH_PROVENANCE_LABELED_VERIFIED_FACT';
  } else if (kind === 'correlation') {
    trustState = 'labeled';
    reason = 'CORRELATION_LABELED_NOT_VERIFIED_FACT';
  } else if (kind === 'hypothesis') {
    trustState = 'labeled';
    reason = 'HYPOTHESIS_LABELED_NOT_VERIFIED_FACT';
  } else if (kind === 'simulation') {
    trustState = 'labeled';
    reason = 'SIMULATION_LABELED_NOT_VERIFIED_FACT';
  } else if (kind === 'fact' && !input.provenanceRef) {
    trustState = 'recorded';
    reason = 'FACT_CLAIM_WITHOUT_PROVENANCE_NOT_VERIFIED';
  }

  const node: TradeTechNode = {
    id: id('ttn'),
    label: input.label,
    kind,
    provenanceRef: input.provenanceRef ?? null,
    trustState,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

export async function recordTradeTechEdge(input: {
  fromId: string;
  toId: string;
  kind: GraphEdgeKind;
  pathway: TradeTechEdge['pathway'];
  provenanceRef?: string | null;
  root: string;
  actor: CoActor;
}): Promise<TradeTechEdge> {
  const store = await load(input.root);
  const kind = input.kind;
  let trustState: TradeTechEdge['trustState'] = 'recorded';
  let reason = 'TRADE_TECH_EDGE_RECORDED_PROVENANCE_TYPED';

  if (kind === 'fact' && input.provenanceRef) {
    trustState = 'verified_fact';
    reason = 'FACT_EDGE_WITH_PROVENANCE';
  } else if (kind !== 'fact') {
    trustState = 'labeled';
    reason = `EDGE_KIND_${kind.toUpperCase()}_NOT_VERIFIED_FACT`;
  }

  const edge: TradeTechEdge = {
    id: id('tte'),
    fromId: input.fromId,
    toId: input.toId,
    kind,
    pathway: input.pathway,
    provenanceRef: input.provenanceRef ?? null,
    trustState,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.edges.push(edge);
  await save(input.root, store);
  return edge;
}

export async function attemptTradeTechGraphPromotion(input: {
  nodeOrEdgeId: string;
  fromKind: GraphEdgeKind;
  root: string;
  actor: CoActor;
}): Promise<GraphPromotionAttempt> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const blocked =
    input.fromKind === 'correlation' ||
    input.fromKind === 'simulation' ||
    input.fromKind === 'hypothesis' ||
    CO_LOCKS.CORRELATION_PROMOTE_TO_VERIFIED_FACT === false ||
    CO_LOCKS.SIM_PROMOTE_TO_VERIFIED_FACT === false;

  if (blocked && input.fromKind !== 'fact') {
    const attempt: GraphPromotionAttempt = {
      id: id('promo'),
      nodeOrEdgeId: input.nodeOrEdgeId,
      fromKind: input.fromKind,
      toTrust: 'verified_fact',
      accepted: false,
      reason: GRAPH_PROMOTE_REJECTED,
      at: now,
    };
    store.promotions.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const attempt: GraphPromotionAttempt = {
    id: id('promo'),
    nodeOrEdgeId: input.nodeOrEdgeId,
    fromKind: input.fromKind,
    toTrust: 'verified_fact',
    accepted: false,
    reason: GRAPH_PROMOTE_REJECTED,
    at: now,
  };
  store.promotions.push(attempt);
  await save(input.root, store);
  return attempt;
}
