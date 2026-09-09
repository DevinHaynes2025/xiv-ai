/**
 * 62L-CT F — Global Scientific Discovery Graph
 * Evidence-typed. hypothesis ≠ verified; correlation ≠ causation.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CORRELATION_TO_CAUSATION_REJECTED,
  CT_LOCKS,
  HONESTY_BANNER,
  type CtActor,
  type DiscoveryEdgeKind,
} from './ai-research-civilization-os-types';

export type DiscoveryNode = {
  id: string;
  label: string;
  kind: DiscoveryEdgeKind;
  evidenceRefs: string[];
  status: 'recorded' | 'rejected';
  reason: string;
  createdAt: string;
};

export type PromotionAttempt = {
  id: string;
  fromId: string;
  fromKind: DiscoveryEdgeKind;
  toKind: DiscoveryEdgeKind;
  evidencePresent: boolean;
  status: 'rejected' | 'accepted';
  reason: string;
  at: string;
};

type Store = { nodes: DiscoveryNode[]; promotions: PromotionAttempt[] };

function storePath(root: string) {
  return xivLocalPath(root, 'global-scientific-discovery-graph.json');
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

export function discoveryGraphHonesty() {
  return {
    banner: HONESTY_BANNER,
    correlationEqCausation: CT_LOCKS.CORRELATION_EQ_CAUSATION,
    hypothesisEqVerified: CT_LOCKS.HYPOTHESIS_EQ_VERIFIED,
    simEqVerifiedDiscovery: CT_LOCKS.SIM_EQ_VERIFIED_DISCOVERY,
  };
}

export async function recordDiscoveryNode(input: {
  label: string;
  kind: DiscoveryEdgeKind;
  evidenceRefs?: string[];
  root: string;
  actor: CtActor;
}): Promise<DiscoveryNode> {
  const store = await load(input.root);
  if (input.kind === 'causation' && !(input.evidenceRefs && input.evidenceRefs.length > 0)) {
    const rejected: DiscoveryNode = {
      id: id('disc'),
      label: input.label,
      kind: input.kind,
      evidenceRefs: [],
      status: 'rejected',
      reason: CORRELATION_TO_CAUSATION_REJECTED,
      createdAt: new Date().toISOString(),
    };
    store.nodes.push(rejected);
    await save(input.root, store);
    return rejected;
  }
  if (input.kind === 'verified_discovery' && !(input.evidenceRefs && input.evidenceRefs.length > 0)) {
    const rejected: DiscoveryNode = {
      id: id('disc'),
      label: input.label,
      kind: 'hypothesis',
      evidenceRefs: [],
      status: 'rejected',
      reason: 'HYPOTHESIS_NOT_VERIFIED_WITHOUT_EVIDENCE',
      createdAt: new Date().toISOString(),
    };
    store.nodes.push(rejected);
    await save(input.root, store);
    return rejected;
  }
  const node: DiscoveryNode = {
    id: id('disc'),
    label: input.label,
    kind: input.kind,
    evidenceRefs: input.evidenceRefs ?? [],
    status: 'recorded',
    reason: `DISCOVERY_NODE_${input.kind.toUpperCase()}_RECORDED`,
    createdAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  void input.actor;
  return node;
}

export async function attemptPromoteDiscovery(input: {
  fromId: string;
  toKind: DiscoveryEdgeKind;
  evidencePresent?: boolean;
  root: string;
  actor: CtActor;
}): Promise<PromotionAttempt> {
  const store = await load(input.root);
  const from = store.nodes.find((n) => n.id === input.fromId);
  const fromKind = from?.kind ?? 'hypothesis';
  const evidencePresent = Boolean(input.evidencePresent);

  const blocked =
    (fromKind === 'correlation' && input.toKind === 'causation' && !evidencePresent) ||
    (fromKind === 'hypothesis' && input.toKind === 'verified_discovery' && !evidencePresent) ||
    (fromKind === 'simulation' && input.toKind === 'verified_discovery') ||
    (fromKind === 'correlation' && input.toKind === 'causation');

  // correlation→causation always requires explicit causal evidence; without it REJECTED
  const correlationToCausation =
    fromKind === 'correlation' && input.toKind === 'causation' && !evidencePresent;

  const attempt: PromotionAttempt = {
    id: id('prom'),
    fromId: input.fromId,
    fromKind,
    toKind: input.toKind,
    evidencePresent,
    status: correlationToCausation || blocked ? 'rejected' : evidencePresent ? 'accepted' : 'rejected',
    reason:
      correlationToCausation || (fromKind === 'correlation' && input.toKind === 'causation' && !evidencePresent)
        ? CORRELATION_TO_CAUSATION_REJECTED
        : blocked
          ? CORRELATION_TO_CAUSATION_REJECTED
          : evidencePresent
            ? 'PROMOTION_ACCEPTED_WITH_EVIDENCE'
            : CORRELATION_TO_CAUSATION_REJECTED,
    at: new Date().toISOString(),
  };

  // Force reject correlation→causation without evidence (hard rule)
  if (fromKind === 'correlation' && input.toKind === 'causation' && !evidencePresent) {
    attempt.status = 'rejected';
    attempt.reason = CORRELATION_TO_CAUSATION_REJECTED;
  }

  store.promotions.push(attempt);
  await save(input.root, store);
  void input.actor;
  return attempt;
}
