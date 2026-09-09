/**
 * 62L-CJ Self-Optimizing Retrieval/Memory Lab — sandbox candidates only.
 * Recommendations ≠ auto production index/schema alter.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CJ_LOCKS,
  HONESTY_BANNER,
  RETRIEVAL_LAB_AUTO_APPLY_DENIED,
  type CjActor,
} from './intelligence-resource-grid-apprenticeship-types';

export type LabCandidateKind = 'retrieval_strategy' | 'memory_index' | 'schema_hint' | 'cache_policy';

export type RetrievalMemoryCandidate = {
  id: string;
  kind: LabCandidateKind;
  proposal: string;
  status: 'sandbox_candidate' | 'recommendation_only' | 'rejected';
  productionAuthorized: false;
  autoApplied: false;
  reason: string;
  at: string;
};

type Store = {
  candidates: RetrievalMemoryCandidate[];
  denials: Array<{ id: string; at: string; reason: string; candidateId?: string }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'self-optimizing-retrieval-memory-lab.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { candidates: [], denials: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function retrievalMemoryLabHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CJ_LOCKS.L4_AUTONOMY_ENABLED,
    retrievalLabAutoApplyProduction: CJ_LOCKS.RETRIEVAL_LAB_AUTO_APPLY_PRODUCTION,
    retrievalLabSandboxOnly: CJ_LOCKS.RETRIEVAL_LAB_SANDBOX_ONLY,
    memoryLabAutoAlterIndexSchema: CJ_LOCKS.MEMORY_LAB_AUTO_ALTER_INDEX_SCHEMA,
    recommendEqAutoProductionAlter: CJ_LOCKS.RECOMMEND_EQ_AUTO_PRODUCTION_ALTER,
  };
}

export async function proposeRetrievalMemoryCandidate(input: {
  kind: LabCandidateKind;
  proposal: string;
  root: string;
  actor: CjActor;
}): Promise<RetrievalMemoryCandidate> {
  const store = await load(input.root);
  const candidate: RetrievalMemoryCandidate = {
    id: id('rmlab'),
    kind: input.kind,
    proposal: input.proposal,
    status: 'sandbox_candidate',
    productionAuthorized: false,
    autoApplied: false,
    reason: 'SANDBOX_CANDIDATE_RECOMMENDATION_ONLY',
    at: new Date().toISOString(),
  };
  store.candidates.push(candidate);
  await save(input.root, store);
  return candidate;
}

export async function attemptAutoApplyProductionIndexOrSchema(input: {
  candidateId: string;
  root: string;
  actor: CjActor;
}): Promise<{
  accepted: boolean;
  denied: boolean;
  reason: string;
  candidate: RetrievalMemoryCandidate | null;
}> {
  const store = await load(input.root);
  const candidate = store.candidates.find((c) => c.id === input.candidateId) ?? null;
  store.denials.push({
    id: id('deny'),
    at: new Date().toISOString(),
    reason: RETRIEVAL_LAB_AUTO_APPLY_DENIED,
    candidateId: input.candidateId,
  });
  if (candidate) {
    candidate.status = 'recommendation_only';
    candidate.reason = RETRIEVAL_LAB_AUTO_APPLY_DENIED;
  }
  await save(input.root, store);
  return {
    accepted: false,
    denied: true,
    reason: RETRIEVAL_LAB_AUTO_APPLY_DENIED,
    candidate,
  };
}
