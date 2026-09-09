import { randomUUID } from 'node:crypto';

import { cloneLogicalUniverse, ensureLogicalUniverse } from './logical-universe-graph';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BC_LOCKS,
  MERGE_PLAN_NOT_AUTO_APPLY,
  UNIVERSE_SIM_NOT_FACT,
  type CognitiveMemoryKind,
} from './quantum-agentic-types';

export type UniverseForkRecord = {
  id: string;
  tenantId: string;
  parentUniverseId: string;
  forkUniverseId: string;
  purpose: 'simulation' | 'counterfactual' | 'sandbox';
  label: string;
  isVerifiedFact: false;
  physicalAlternateUniverse: false;
  productionAuthorization: false;
  memorySnapshotIds: string[];
  createdAt: string;
};

export type UniverseCompareResult = {
  id: string;
  tenantId: string;
  leftUniverseId: string;
  rightUniverseId: string;
  sharedKinds: CognitiveMemoryKind[];
  leftOnly: number;
  rightOnly: number;
  divergedSummaries: string[];
  correlationIsCausation: false;
  isVerifiedFact: false;
  notes: string;
};

export type UniverseMergePlan = {
  id: string;
  tenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
  proposedTransfers: Array<{ kind: CognitiveMemoryKind; memoryId: string; action: 'copy' | 'skip' | 'quarantine' }>;
  autoApplied: false;
  productionMergeAuthorized: false;
  humanGateRequired: true;
  reason: typeof MERGE_PLAN_NOT_AUTO_APPLY;
  notes: string;
  createdAt: string;
};

type ForkStore = {
  forks: UniverseForkRecord[];
  compares: UniverseCompareResult[];
  mergePlans: UniverseMergePlan[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universe-fork-fabric.json');
}

async function load(root: string): Promise<ForkStore> {
  const parsed = await readJsonFile<ForkStore>(storePath(root), { forks: [], compares: [], mergePlans: [] });
  return {
    forks: Array.isArray(parsed.forks) ? parsed.forks : [],
    compares: Array.isArray(parsed.compares) ? parsed.compares : [],
    mergePlans: Array.isArray(parsed.mergePlans) ? parsed.mergePlans : [],
  };
}

async function save(root: string, store: ForkStore) {
  await writeJsonFileAtomic(storePath(root), store);
}

export async function forkUniverseForSimulation(input: {
  tenantId: string;
  parentUniverseId: string;
  label: string;
  purpose?: UniverseForkRecord['purpose'];
  memorySnapshotIds?: string[];
  root?: string;
}) {
  if (!input.tenantId || !input.parentUniverseId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (BC_LOCKS.UNIVERSE_SIM_IS_VERIFIED_FACT) throw new Error('INVARIANT_BROKEN_SIM_MUST_NOT_BE_FACT');
  const root = input.root ?? process.cwd();
  await ensureLogicalUniverse({ tenantId: input.tenantId, universeId: input.parentUniverseId, root });
  const clone = await cloneLogicalUniverse({
    tenantId: input.tenantId,
    fromUniverseId: input.parentUniverseId,
    label: input.label,
    root,
  });
  const fork: UniverseForkRecord = {
    id: `ufork_${randomUUID()}`,
    tenantId: input.tenantId,
    parentUniverseId: input.parentUniverseId,
    forkUniverseId: clone.id,
    purpose: input.purpose ?? 'simulation',
    label: input.label,
    isVerifiedFact: false,
    physicalAlternateUniverse: false,
    productionAuthorization: false,
    memorySnapshotIds: [...(input.memorySnapshotIds ?? [])],
    createdAt: new Date().toISOString(),
  };
  const store = await load(root);
  store.forks.push(fork);
  await save(root, store);
  return { fork, clone, note: UNIVERSE_SIM_NOT_FACT };
}

export async function compareUniverses(input: {
  tenantId: string;
  leftUniverseId: string;
  rightUniverseId: string;
  leftMemory: Array<{ id: string; kind: CognitiveMemoryKind; summary: string }>;
  rightMemory: Array<{ id: string; kind: CognitiveMemoryKind; summary: string }>;
  root?: string;
}) {
  if (input.leftUniverseId === input.rightUniverseId) {
    throw new Error('COMPARE_REQUIRES_DISTINCT_UNIVERSES');
  }
  const leftIds = new Set(input.leftMemory.map((m) => m.id));
  const rightIds = new Set(input.rightMemory.map((m) => m.id));
  const leftOnly = input.leftMemory.filter((m) => !rightIds.has(m.id)).length;
  const rightOnly = input.rightMemory.filter((m) => !leftIds.has(m.id)).length;
  const sharedKinds = [...new Set(input.leftMemory.map((m) => m.kind))].filter((kind) =>
    input.rightMemory.some((m) => m.kind === kind),
  ) as CognitiveMemoryKind[];
  const divergedSummaries = input.leftMemory
    .filter((left) => {
      const right = input.rightMemory.find((r) => r.id === left.id);
      return right && right.summary !== left.summary;
    })
    .map((m) => m.id)
    .slice(0, 20);
  const result: UniverseCompareResult = {
    id: `ucomp_${randomUUID()}`,
    tenantId: input.tenantId,
    leftUniverseId: input.leftUniverseId,
    rightUniverseId: input.rightUniverseId,
    sharedKinds,
    leftOnly,
    rightOnly,
    divergedSummaries,
    correlationIsCausation: false,
    isVerifiedFact: false,
    notes: UNIVERSE_SIM_NOT_FACT,
  };
  const root = input.root ?? process.cwd();
  const store = await load(root);
  store.compares.push(result);
  await save(root, store);
  return result;
}

/**
 * Produce a merge *plan* only. Never auto-applies to production.
 */
export async function planUniverseMerge(input: {
  tenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
  candidates: Array<{ id: string; kind: CognitiveMemoryKind; sealed?: boolean }>;
  attemptAutoApply?: boolean;
  root?: string;
}) {
  if (BC_LOCKS.MERGE_PLAN_IS_AUTO_MERGE) throw new Error('INVARIANT_BROKEN_MERGE_MUST_NOT_AUTO');
  const proposedTransfers = input.candidates.map((c) => ({
    kind: c.kind,
    memoryId: c.id,
    action: (c.sealed ? 'quarantine' : 'copy') as 'copy' | 'skip' | 'quarantine',
  }));
  const plan: UniverseMergePlan = {
    id: `umerge_${randomUUID()}`,
    tenantId: input.tenantId,
    fromUniverseId: input.fromUniverseId,
    toUniverseId: input.toUniverseId,
    proposedTransfers,
    autoApplied: false,
    productionMergeAuthorized: false,
    humanGateRequired: true,
    reason: MERGE_PLAN_NOT_AUTO_APPLY,
    notes:
      input.attemptAutoApply === true
        ? 'Auto-apply requested and DENIED. Plan recorded for human review only.'
        : 'Merge plan recorded. Human gate required before any production merge.',
    createdAt: new Date().toISOString(),
  };
  const root = input.root ?? process.cwd();
  const store = await load(root);
  store.mergePlans.push(plan);
  await save(root, store);
  return {
    plan,
    applied: false as const,
    deniedAutoApply: input.attemptAutoApply === true,
  };
}

export async function listUniverseForks(input: { tenantId: string; root?: string }) {
  const store = await load(input.root ?? process.cwd());
  return store.forks.filter((f) => f.tenantId === input.tenantId);
}
