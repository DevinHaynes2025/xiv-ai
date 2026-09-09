/**
 * 62L-EK Module C — Neural Pathway graph (software plasticity, not biological brain).
 * Weighted auditable edges with source + provenance + confidence + owner + Universe +
 * permissions + version + expiry + rollback. Strengthen/weaken with audit.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_PATHWAY_EVENTS,
  PATHWAY_REQUIRED_FIELDS,
  type EkActor,
  type EkEvidenceState,
} from './windows-amd-local-cognitive-os-types';

export type PathwayNodeKind =
  | 'historical_event'
  | 'business_principle'
  | 'supply_chain_pattern'
  | 'problem'
  | 'algorithm'
  | 'experiment'
  | 'agent'
  | 'decision'
  | 'outcome';

export type NeuralPathwayEdge = {
  id: string;
  edgeId: string;
  fromKind: PathwayNodeKind;
  toKind: PathwayNodeKind;
  weight: number;
  source: string;
  provenance: string;
  confidence: number;
  owner: string;
  universe: string;
  permissions: string[];
  version: string;
  expiry: string | null;
  rollback: string | null;
  status: 'ok' | 'denied';
  state: EkEvidenceState;
  reason: string;
  at: string;
};

export type PathwayWeightChange = {
  id: string;
  edgeId: string;
  direction: 'strengthen' | 'weaken';
  cause: 'retrieval_usefulness' | 'tests' | 'measured_outcome' | 'bad_link' | 'stale' | 'contradicted';
  previousWeight: number;
  nextWeight: number;
  status: 'ok' | 'denied';
  state: EkEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  edges: NeuralPathwayEdge[];
  changes: PathwayWeightChange[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'neural-pathway-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { edges: [], changes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function neuralPathwayGraphHonesty() {
  return {
    softwarePlasticityNotBiologicalBrain: true,
    requiredFields: PATHWAY_REQUIRED_FIELDS,
    strengthenOnUsefulnessTestsOutcomes: true,
    weakenOnBadStaleContradicted: true,
    auditable: true,
    l4AutonomyEnabled: false,
  };
}

export async function registerNeuralPathway(input: {
  edgeId: string;
  fromKind: PathwayNodeKind;
  toKind: PathwayNodeKind;
  weight: number;
  source: string;
  provenance: string;
  confidence: number;
  owner: string;
  universe: string;
  permissions: string[];
  version: string;
  expiry?: string | null;
  rollback?: string | null;
  root: string;
  actor: EkActor;
}): Promise<NeuralPathwayEdge> {
  void input.actor;
  const store = await load(input.root);
  if (store.edges.length >= MAX_PATHWAY_EVENTS) throw new Error('MAX_PATHWAY_EVENTS');

  const missing: string[] = [];
  if (!input.source.trim()) missing.push('source');
  if (!input.provenance.trim()) missing.push('provenance');
  if (!input.owner.trim()) missing.push('owner');
  if (!input.universe.trim()) missing.push('universe');
  if (!input.version.trim()) missing.push('version');
  if (input.confidence < 0 || input.confidence > 1) missing.push('confidence');

  if (missing.length > 0) {
    const denied: NeuralPathwayEdge = {
      id: id('ekpath'),
      edgeId: input.edgeId.trim(),
      fromKind: input.fromKind,
      toKind: input.toKind,
      weight: input.weight,
      source: input.source,
      provenance: input.provenance,
      confidence: input.confidence,
      owner: input.owner,
      universe: input.universe,
      permissions: input.permissions,
      version: input.version,
      expiry: input.expiry ?? null,
      rollback: input.rollback ?? null,
      status: 'denied',
      state: 'DENIED',
      reason: `PATHWAY_MISSING_REQUIRED_FIELDS:${missing.join(',')}`,
      at: new Date().toISOString(),
    };
    store.edges.push(denied);
    await save(input.root, store);
    return denied;
  }

  const rec: NeuralPathwayEdge = {
    id: id('ekpath'),
    edgeId: input.edgeId.trim(),
    fromKind: input.fromKind,
    toKind: input.toKind,
    weight: Math.max(0, Math.min(1, input.weight)),
    source: input.source.trim(),
    provenance: input.provenance.trim(),
    confidence: input.confidence,
    owner: input.owner.trim(),
    universe: input.universe.trim(),
    permissions: input.permissions,
    version: input.version.trim(),
    expiry: input.expiry ?? null,
    rollback: input.rollback ?? null,
    status: 'ok',
    state: 'PROVENANCE_LABELED',
    reason: 'NEURAL_PATHWAY_REGISTERED_WITH_PROVENANCE',
    at: new Date().toISOString(),
  };
  store.edges.push(rec);
  await save(input.root, store);
  return rec;
}

export async function adjustPathwayWeight(input: {
  edgeId: string;
  direction: 'strengthen' | 'weaken';
  cause: PathwayWeightChange['cause'];
  previousWeight: number;
  root: string;
  actor: EkActor;
}): Promise<PathwayWeightChange> {
  void input.actor;
  const store = await load(input.root);
  const delta = input.direction === 'strengthen' ? 0.05 : -0.05;
  const next = Math.max(0, Math.min(1, input.previousWeight + delta));
  const change: PathwayWeightChange = {
    id: id('ekpw'),
    edgeId: input.edgeId.trim(),
    direction: input.direction,
    cause: input.cause,
    previousWeight: input.previousWeight,
    nextWeight: next,
    status: 'ok',
    state: 'BOUNDED',
    reason: `PATHWAY_${input.direction.toUpperCase()}_${input.cause.toUpperCase()}`,
    at: new Date().toISOString(),
  };
  store.changes.push(change);
  await save(input.root, store);
  return change;
}
