/**
 * 62L-CW Scientific Algorithm Discovery Foundry —
 * Reproducible algorithm discovery with evidence gates.
 * Without reproducibility metadata → not VERIFIED (hypothesis/candidate only).
 * Negative results retained.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ALGORITHM_NOT_VERIFIED_WITHOUT_REPRO,
  CW_LOCKS,
  HONESTY_BANNER,
  HYPOTHESIS_NOT_VERIFIED,
  MAX_ALGORITHM_CANDIDATES,
  type CwActor,
} from './autonomous-research-infrastructure-os-types';

export type AlgorithmCandidate = {
  id: string;
  name: string;
  hypothesisText: string;
  reproducibilityMetadata: Record<string, string> | null;
  negativeResult: boolean;
  status: 'HYPOTHESIS' | 'CANDIDATE' | 'VERIFIED' | 'NEGATIVE_KEPT' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type AlgorithmFoundryResult = {
  accepted: boolean;
  reason: string;
  candidate?: AlgorithmCandidate;
  at: string;
};

type Store = { candidates: AlgorithmCandidate[] };

function storePath(root: string) {
  return xivLocalPath(root, 'scientific-algorithm-discovery-foundry.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { candidates: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function reproComplete(meta: Record<string, string> | null | undefined): boolean {
  if (!meta) return false;
  const keys = Object.keys(meta).filter((k) => meta[k]?.trim());
  return keys.length >= 2 && Boolean(meta.seed?.trim() || meta.commit?.trim());
}

export function algorithmDiscoveryFoundryHonesty() {
  return {
    banner: HONESTY_BANNER,
    verifiedWithoutReproducibility: CW_LOCKS.ALGORITHM_VERIFIED_WITHOUT_REPRODUCIBILITY,
    hypothesisEqVerified: CW_LOCKS.HYPOTHESIS_EQ_VERIFIED,
    negativeResultsRetained: CW_LOCKS.NEGATIVE_RESULTS_RETAINED,
  };
}

export async function proposeAlgorithmDiscovery(input: {
  name: string;
  hypothesisText: string;
  reproducibilityMetadata?: Record<string, string> | null;
  negativeResult?: boolean;
  claimVerified?: boolean;
  root: string;
  actor: CwActor;
}): Promise<AlgorithmFoundryResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.candidates.length >= MAX_ALGORITHM_CANDIDATES) {
    return {
      accepted: false,
      reason: 'MAX_ALGORITHM_CANDIDATES_BOUNDED',
      at: now,
    };
  }

  const repro = input.reproducibilityMetadata ?? null;
  const hasRepro = reproComplete(repro);
  const wantsVerified = input.claimVerified === true;

  if (wantsVerified && !hasRepro) {
    const candidate: AlgorithmCandidate = {
      id: id('algo'),
      name: input.name.trim() || 'unnamed-algorithm',
      hypothesisText: input.hypothesisText.trim() || 'hypothesis',
      reproducibilityMetadata: repro,
      negativeResult: input.negativeResult === true,
      status: 'HYPOTHESIS',
      reason: ALGORITHM_NOT_VERIFIED_WITHOUT_REPRO,
      createdAt: now,
    };
    store.candidates.push(candidate);
    await save(input.root, store);
    return {
      accepted: false,
      reason: ALGORITHM_NOT_VERIFIED_WITHOUT_REPRO,
      candidate,
      at: now,
    };
  }

  if (!hasRepro) {
    const candidate: AlgorithmCandidate = {
      id: id('algo'),
      name: input.name.trim() || 'unnamed-algorithm',
      hypothesisText: input.hypothesisText.trim() || 'hypothesis',
      reproducibilityMetadata: repro,
      negativeResult: input.negativeResult === true,
      status: input.negativeResult ? 'NEGATIVE_KEPT' : 'HYPOTHESIS',
      reason: input.negativeResult
        ? 'NEGATIVE_RESULT_RETAINED_HYPOTHESIS'
        : HYPOTHESIS_NOT_VERIFIED,
      createdAt: now,
    };
    store.candidates.push(candidate);
    await save(input.root, store);
    return {
      accepted: true,
      reason: candidate.reason,
      candidate,
      at: now,
    };
  }

  const candidate: AlgorithmCandidate = {
    id: id('algo'),
    name: input.name.trim() || 'unnamed-algorithm',
    hypothesisText: input.hypothesisText.trim() || 'hypothesis',
    reproducibilityMetadata: repro,
    negativeResult: input.negativeResult === true,
    status: input.negativeResult ? 'NEGATIVE_KEPT' : wantsVerified ? 'VERIFIED' : 'CANDIDATE',
    reason: input.negativeResult
      ? 'NEGATIVE_RESULT_RETAINED_WITH_REPRO'
      : wantsVerified
        ? 'ALGORITHM_VERIFIED_WITH_REPRODUCIBILITY'
        : 'ALGORITHM_CANDIDATE_WITH_REPRO',
    createdAt: now,
  };
  store.candidates.push(candidate);
  await save(input.root, store);
  return { accepted: true, reason: candidate.reason, candidate, at: now };
}

export async function listAlgorithmCandidates(root: string): Promise<AlgorithmCandidate[]> {
  const store = await load(root);
  return store.candidates;
}

export async function listRetainedNegatives(root: string): Promise<AlgorithmCandidate[]> {
  const store = await load(root);
  return store.candidates.filter((c) => c.negativeResult || c.status === 'NEGATIVE_KEPT');
}
