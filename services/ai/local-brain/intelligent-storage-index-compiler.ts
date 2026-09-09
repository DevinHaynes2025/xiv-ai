/**
 * 62L-CG Intelligent Storage/Index Compiler —
 * Compile storage/index candidates; dry-run/recommend only.
 * Cannot auto-apply production DDL. Candidates remain NOT_APPLIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CG_LOCKS,
  HONESTY_BANNER,
  STORAGE_INDEX_AUTO_APPLY_DENIED,
  type CgActor,
} from './deep-knowledge-refinery-os-types';

export type StorageIndexCandidateKind =
  | 'schema'
  | 'index'
  | 'partition'
  | 'cache'
  | 'compression'
  | 'migration'
  | 'rollback';

export type StorageIndexCandidate = {
  id: string;
  kind: StorageIndexCandidateKind;
  ddlHint: string;
  status: 'candidate' | 'dry_run' | 'recommendation_only' | 'not_applied';
  autoApplied: false;
  productionAlter: false;
  liveSupabaseApply: false;
  reason: string;
  createdAt: string;
};

export type ApplyAttempt = {
  id: string;
  candidateId: string;
  target: 'production' | 'sandbox';
  status: 'denied' | 'dry_run_ok';
  reason: string;
  at: string;
};

type Store = {
  candidates: StorageIndexCandidate[];
  applyAttempts: ApplyAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'intelligent-storage-index-compiler.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { candidates: [], applyAttempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function storageIndexCompilerHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CG_LOCKS.L4_AUTONOMY_ENABLED,
    storageIndexAutoApply: CG_LOCKS.STORAGE_INDEX_AUTO_APPLY,
    liveSupabaseApply: CG_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: CG_LOCKS.DB_CANDIDATES_APPLIED,
    productionDatabaseWrite: CG_LOCKS.PRODUCTION_DATABASE_WRITE,
    productionAuthorization: CG_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function compileStorageIndexCandidate(input: {
  kind: StorageIndexCandidateKind;
  ddlHint: string;
  root: string;
  actor: CgActor;
}): Promise<StorageIndexCandidate> {
  const store = await load(input.root);
  const candidate: StorageIndexCandidate = {
    id: id('sicand'),
    kind: input.kind,
    ddlHint: input.ddlHint.slice(0, 2_000),
    status: 'candidate',
    autoApplied: false,
    productionAlter: false,
    liveSupabaseApply: false,
    reason: 'STORAGE_INDEX_CANDIDATE_NOT_APPLIED',
    createdAt: new Date().toISOString(),
  };
  store.candidates.push(candidate);
  await save(input.root, store);
  return candidate;
}

export async function dryRunStorageIndexCandidate(input: {
  candidateId: string;
  root: string;
  actor: CgActor;
}): Promise<{ ok: boolean; reason: string; candidate: StorageIndexCandidate | null }> {
  const store = await load(input.root);
  const candidate = store.candidates.find((c) => c.id === input.candidateId);
  if (!candidate) {
    return { ok: false, reason: 'CANDIDATE_NOT_FOUND', candidate: null };
  }
  candidate.status = 'dry_run';
  candidate.reason = 'STORAGE_INDEX_DRY_RUN_RECOMMENDATION_ONLY';
  await save(input.root, store);
  return { ok: true, reason: candidate.reason, candidate };
}

/**
 * Hard deny: cannot auto-apply production DDL / live Supabase alter.
 */
export async function attemptApplyStorageIndex(input: {
  candidateId: string;
  target: 'production' | 'sandbox';
  autoApply?: boolean;
  root: string;
  actor: CgActor;
}): Promise<ApplyAttempt> {
  const store = await load(input.root);
  const candidate = store.candidates.find((c) => c.id === input.candidateId);

  // Production auto-apply always denied — even if autoApply flag unset.
  if (input.target === 'production' || input.autoApply === true) {
    const attempt: ApplyAttempt = {
      id: id('siapply'),
      candidateId: input.candidateId,
      target: input.target,
      status: 'denied',
      reason: STORAGE_INDEX_AUTO_APPLY_DENIED,
      at: new Date().toISOString(),
    };
    store.applyAttempts.push(attempt);
    if (candidate) {
      candidate.status = 'not_applied';
      candidate.autoApplied = false;
      candidate.productionAlter = false;
      candidate.liveSupabaseApply = false;
      candidate.reason = STORAGE_INDEX_AUTO_APPLY_DENIED;
    }
    await save(input.root, store);
    return attempt;
  }

  // Sandbox without autoApply = dry-run recommendation only (still not production alter).
  const attempt: ApplyAttempt = {
    id: id('siapply'),
    candidateId: input.candidateId,
    target: 'sandbox',
    status: 'dry_run_ok',
    reason: 'SANDBOX_DRY_RUN_ONLY_NOT_PRODUCTION_ALTER',
    at: new Date().toISOString(),
  };
  store.applyAttempts.push(attempt);
  if (candidate) {
    candidate.status = 'recommendation_only';
    candidate.reason = attempt.reason;
  }
  await save(input.root, store);
  return attempt;
}
