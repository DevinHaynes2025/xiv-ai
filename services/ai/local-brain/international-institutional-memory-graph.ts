/**
 * 62L-CP International Institutional Memory Graph —
 * provenance-aware institutional memory; facts ≠ simulations.
 * Rejects sim→fact promotion.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CP_LOCKS,
  GRAPH_HARD_SEPARATION,
  HONESTY_BANNER,
  SIM_TO_FACT_REJECTED,
  SOUL_CLAIM_REJECTED,
  type CpActor,
  type InstitutionalMemoryKind,
} from './knowledge-supply-plugin-foundry-types';

export type MemoryNode = {
  id: string;
  kind: InstitutionalMemoryKind;
  institution: string;
  statement: string;
  provenanceRef: string | null;
  trustState: 'recorded' | 'verified_fact' | 'labeled_simulation' | 'rejected';
  createdAt: string;
};

export type PromotionAttempt = {
  id: string;
  nodeId: string;
  fromKind: InstitutionalMemoryKind;
  toKind: InstitutionalMemoryKind;
  rejected: true;
  reason: string;
  at: string;
};

type Store = {
  nodes: MemoryNode[];
  promotions: PromotionAttempt[];
  soulDenials: { id: string; denied: true; reason: string; at: string }[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'international-institutional-memory-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    nodes: [],
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

function defaultTrust(
  kind: InstitutionalMemoryKind,
): MemoryNode['trustState'] {
  switch (kind) {
    case 'fact':
      return 'verified_fact';
    case 'simulation':
      return 'labeled_simulation';
    default:
      return 'recorded';
  }
}

export function institutionalMemoryHonesty() {
  return {
    banner: HONESTY_BANNER,
    hardSeparation: GRAPH_HARD_SEPARATION,
    factsEqSimulations: CP_LOCKS.FACTS_EQ_SIMULATIONS,
    simPromoteToFact: CP_LOCKS.SIM_PROMOTE_TO_FACT,
    provenanceAware: true,
    soulClaims: CP_LOCKS.SOUL_RESURRECTION_CLAIMS,
  };
}

export async function recordInstitutionalMemory(input: {
  kind: InstitutionalMemoryKind;
  institution: string;
  statement: string;
  provenanceRef?: string | null;
  root: string;
  actor: CpActor;
}): Promise<MemoryNode> {
  const store = await load(input.root);
  const node: MemoryNode = {
    id: id('imem'),
    kind: input.kind,
    institution: input.institution.trim(),
    statement: input.statement.trim(),
    provenanceRef: input.provenanceRef ?? null,
    trustState: defaultTrust(input.kind),
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

export async function attemptInstitutionalPromotion(input: {
  nodeId: string;
  toKind: InstitutionalMemoryKind;
  root: string;
  actor: CpActor;
}): Promise<PromotionAttempt | { status: 'allowed'; node: MemoryNode; reason: string }> {
  const store = await load(input.root);
  const node = store.nodes.find((n) => n.id === input.nodeId);
  void input.actor;
  if (!node) {
    const attempt: PromotionAttempt = {
      id: id('iprom'),
      nodeId: input.nodeId,
      fromKind: 'simulation',
      toKind: input.toKind,
      rejected: true,
      reason: 'INSTITUTIONAL_MEMORY_NODE_NOT_FOUND',
      at: new Date().toISOString(),
    };
    store.promotions.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  // Hard reject simulation → fact
  if (node.kind === 'simulation' && input.toKind === 'fact') {
    const attempt: PromotionAttempt = {
      id: id('iprom'),
      nodeId: node.id,
      fromKind: node.kind,
      toKind: input.toKind,
      rejected: true,
      reason: SIM_TO_FACT_REJECTED,
      at: new Date().toISOString(),
    };
    store.promotions.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  // Other cross-kind promotions that collapse honesty also rejected
  if (node.kind !== input.toKind && input.toKind === 'fact') {
    const attempt: PromotionAttempt = {
      id: id('iprom'),
      nodeId: node.id,
      fromKind: node.kind,
      toKind: input.toKind,
      rejected: true,
      reason: SIM_TO_FACT_REJECTED,
      at: new Date().toISOString(),
    };
    store.promotions.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  return {
    status: 'allowed',
    node,
    reason: 'SAME_KIND_OR_NON_FACT_TRANSITION_BOUNDED',
  };
}

export async function rejectSoulClaim(input: {
  claim: string;
  root: string;
  actor: CpActor;
}) {
  const store = await load(input.root);
  const denial = {
    id: id('soul'),
    denied: true as const,
    reason: SOUL_CLAIM_REJECTED,
    at: new Date().toISOString(),
  };
  void input.claim;
  void input.actor;
  store.soulDenials.push(denial);
  await save(input.root, store);
  return denial;
}
