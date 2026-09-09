/**
 * 62L-CX Multi-Model Evolution Laboratory —
 * Sandboxed multi-model evolution; eval + human review before promotion.
 * Models cannot self-promote to production.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CX_LOCKS,
  HONESTY_BANNER,
  MAX_EVOLUTION_CANDIDATES,
  MODEL_SELF_PROMOTION_DENIED,
  type CxActor,
} from './persistent-knowledge-civilization-types';

export type EvolutionCandidate = {
  id: string;
  modelId: string;
  parentModelId: string | null;
  status: 'SANDBOX' | 'EVAL_PASS' | 'HUMAN_REVIEW_PENDING' | 'APPROVED_CANDIDATE' | 'DENIED';
  evalPassed: boolean;
  humanReviewPassed: boolean;
  productionAuthorized: false;
  selfPromotionAttempted: boolean;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type EvolutionLabResult = {
  accepted: boolean;
  reason: string;
  candidate?: EvolutionCandidate;
  at: string;
};

type Store = { candidates: EvolutionCandidate[] };

function storePath(root: string) {
  return xivLocalPath(root, 'multi-model-evolution-laboratory.json');
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

export function multiModelEvolutionLabHonesty() {
  return {
    banner: HONESTY_BANNER,
    sandboxUntilEvalReview: CX_LOCKS.MODEL_EVOLUTION_SANDBOX_UNTIL_EVAL_REVIEW,
    selfPromotionToProduction: CX_LOCKS.MODEL_SELF_PROMOTION_TO_PRODUCTION,
    productionAuthorization: CX_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function proposeSandboxEvolution(input: {
  modelId: string;
  parentModelId?: string | null;
  root: string;
  actor: CxActor;
}): Promise<EvolutionLabResult> {
  void input.actor;
  const store = await load(input.root);
  if (store.candidates.length >= MAX_EVOLUTION_CANDIDATES) {
    return {
      accepted: false,
      reason: 'MAX_EVOLUTION_CANDIDATES_BOUNDED',
      at: new Date().toISOString(),
    };
  }
  const now = new Date().toISOString();
  const candidate: EvolutionCandidate = {
    id: id('mmel'),
    modelId: input.modelId,
    parentModelId: input.parentModelId ?? null,
    status: 'SANDBOX',
    evalPassed: false,
    humanReviewPassed: false,
    productionAuthorized: false,
    selfPromotionAttempted: false,
    reason: 'SANDBOXED_UNTIL_EVAL_AND_HUMAN_REVIEW',
    createdAt: now,
    updatedAt: now,
  };
  store.candidates.push(candidate);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'EVOLUTION_CANDIDATE_SANDBOXED',
    candidate,
    at: now,
  };
}

export async function attemptModelSelfPromotion(input: {
  candidateId: string;
  root: string;
  actor: CxActor;
}): Promise<EvolutionLabResult> {
  void input.actor;
  const store = await load(input.root);
  const candidate = store.candidates.find((c) => c.id === input.candidateId);
  const now = new Date().toISOString();
  if (!candidate) {
    return { accepted: false, reason: 'CANDIDATE_NOT_FOUND', at: now };
  }
  candidate.selfPromotionAttempted = true;
  candidate.updatedAt = now;
  // Models cannot promote themselves — even with eval+review flags set by actor claim
  await save(input.root, store);
  return {
    accepted: false,
    reason: MODEL_SELF_PROMOTION_DENIED,
    candidate: {
      ...candidate,
      productionAuthorized: false,
      status: candidate.status === 'SANDBOX' ? 'SANDBOX' : candidate.status,
    },
    at: now,
  };
}

export async function recordEvalAndHumanReview(input: {
  candidateId: string;
  evalPassed: boolean;
  humanReviewPassed: boolean;
  root: string;
  actor: CxActor;
}): Promise<EvolutionLabResult> {
  // Human curator path — still does NOT authorize production (separate founder gate)
  if (input.actor.authorityLevel < 1 && input.humanReviewPassed) {
    return {
      accepted: false,
      reason: 'HUMAN_REVIEW_REQUIRES_CURATOR_AUTHORITY',
      at: new Date().toISOString(),
    };
  }
  const store = await load(input.root);
  const candidate = store.candidates.find((c) => c.id === input.candidateId);
  const now = new Date().toISOString();
  if (!candidate) {
    return { accepted: false, reason: 'CANDIDATE_NOT_FOUND', at: now };
  }
  candidate.evalPassed = input.evalPassed === true;
  candidate.humanReviewPassed = input.humanReviewPassed === true;
  candidate.updatedAt = now;
  if (candidate.evalPassed && candidate.humanReviewPassed) {
    candidate.status = 'APPROVED_CANDIDATE';
    candidate.reason = 'APPROVED_CANDIDATE_NOT_PRODUCTION_AUTHORIZED';
  } else if (candidate.evalPassed) {
    candidate.status = 'HUMAN_REVIEW_PENDING';
    candidate.reason = 'EVAL_PASS_AWAITING_HUMAN_REVIEW';
  } else {
    candidate.status = 'SANDBOX';
    candidate.reason = 'REMAINS_SANDBOXED';
  }
  await save(input.root, store);
  return {
    accepted: true,
    reason: candidate.reason,
    candidate,
    at: now,
  };
}
