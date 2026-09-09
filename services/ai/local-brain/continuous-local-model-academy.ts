/**
 * 62L-CU Continuous Local Model Academy — continuous local-model evaluation
 * and tuning; sandbox candidates until eval + human review. No uncontrolled
 * self-improvement; unknown-rights training DENIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CU_LOCKS,
  HONESTY_BANNER,
  LOCAL_MODEL_SANDBOX_UNTIL_REVIEW,
  UNCONTROLLED_SELF_IMPROVE_DENIED,
  UNKNOWN_RIGHTS_TRAINING_DENIED,
  type CuActor,
} from './cognitive-research-cloud-types';

export type LocalModelCandidate = {
  id: string;
  name: string;
  lifecycle: 'sandbox' | 'evaluated' | 'human_reviewed' | 'promoted' | 'denied';
  sandbox: boolean;
  evalPass: boolean;
  humanReviewPass: boolean;
  rightsKnown: boolean;
  reason: string;
  createdAt: string;
};

export type TrainingAttempt = {
  id: string;
  candidateId: string | null;
  rightsKnown: boolean;
  uncontrolled: boolean;
  status: 'allowed' | 'denied' | 'sandboxed';
  reason: string;
  at: string;
};

export type PromotionGate = {
  id: string;
  candidateId: string;
  status: 'promoted' | 'sandboxed' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  candidates: LocalModelCandidate[];
  training: TrainingAttempt[];
  promotions: PromotionGate[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'continuous-local-model-academy.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    candidates: [],
    training: [],
    promotions: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function continuousLocalModelAcademyHonesty() {
  return {
    banner: HONESTY_BANNER,
    sandboxUntilEvalReview: CU_LOCKS.LOCAL_MODEL_IMPROVEMENT_SANDBOX_UNTIL_EVAL_REVIEW,
    uncontrolledSelfImprovement: CU_LOCKS.UNCONTROLLED_SELF_IMPROVEMENT,
    unknownRightsTraining: CU_LOCKS.UNKNOWN_RIGHTS_TRAINING,
  };
}

export async function proposeLocalModelImprovement(input: {
  name: string;
  rightsKnown?: boolean;
  root: string;
  actor: CuActor;
}): Promise<LocalModelCandidate> {
  const store = await load(input.root);
  const rightsKnown = input.rightsKnown === true;
  void input.actor;

  if (!rightsKnown) {
    const denied: LocalModelCandidate = {
      id: id('lmc'),
      name: input.name.trim(),
      lifecycle: 'denied',
      sandbox: true,
      evalPass: false,
      humanReviewPass: false,
      rightsKnown: false,
      reason: UNKNOWN_RIGHTS_TRAINING_DENIED,
      createdAt: new Date().toISOString(),
    };
    store.candidates.push(denied);
    await save(input.root, store);
    return denied;
  }

  const candidate: LocalModelCandidate = {
    id: id('lmc'),
    name: input.name.trim(),
    lifecycle: 'sandbox',
    sandbox: true,
    evalPass: false,
    humanReviewPass: false,
    rightsKnown: true,
    reason: LOCAL_MODEL_SANDBOX_UNTIL_REVIEW,
    createdAt: new Date().toISOString(),
  };
  store.candidates.push(candidate);
  await save(input.root, store);
  return candidate;
}

export async function attemptUncontrolledSelfImprove(input: {
  candidateId?: string;
  root: string;
  actor: CuActor;
}): Promise<TrainingAttempt> {
  const store = await load(input.root);
  void input.actor;
  const attempt: TrainingAttempt = {
    id: id('selfimp'),
    candidateId: input.candidateId ?? null,
    rightsKnown: true,
    uncontrolled: true,
    status: 'denied',
    reason: UNCONTROLLED_SELF_IMPROVE_DENIED,
    at: new Date().toISOString(),
  };
  store.training.push(attempt);
  await save(input.root, store);
  return attempt;
}

export async function attemptUnknownRightsTraining(input: {
  datasetLabel: string;
  root: string;
  actor: CuActor;
}): Promise<TrainingAttempt> {
  const store = await load(input.root);
  void input.datasetLabel;
  void input.actor;
  const attempt: TrainingAttempt = {
    id: id('train'),
    candidateId: null,
    rightsKnown: false,
    uncontrolled: false,
    status: 'denied',
    reason: UNKNOWN_RIGHTS_TRAINING_DENIED,
    at: new Date().toISOString(),
  };
  store.training.push(attempt);
  await save(input.root, store);
  return attempt;
}

export async function evaluateLocalModelCandidate(input: {
  candidateId: string;
  evalPass?: boolean;
  root: string;
  actor: CuActor;
}): Promise<LocalModelCandidate | null> {
  const store = await load(input.root);
  void input.actor;
  const c = store.candidates.find((x) => x.id === input.candidateId);
  if (!c || c.lifecycle === 'denied') return null;
  c.evalPass = input.evalPass === true;
  if (c.evalPass) c.lifecycle = 'evaluated';
  c.reason = c.evalPass
    ? 'LOCAL_MODEL_EVAL_PASS_AWAITING_HUMAN_REVIEW'
    : LOCAL_MODEL_SANDBOX_UNTIL_REVIEW;
  await save(input.root, store);
  return c;
}

export async function humanReviewLocalModelCandidate(input: {
  candidateId: string;
  humanReviewPass?: boolean;
  root: string;
  actor: CuActor;
}): Promise<LocalModelCandidate | null> {
  const store = await load(input.root);
  void input.actor;
  const c = store.candidates.find((x) => x.id === input.candidateId);
  if (!c || c.lifecycle === 'denied') return null;
  c.humanReviewPass = input.humanReviewPass === true;
  if (c.humanReviewPass && c.evalPass) {
    c.lifecycle = 'human_reviewed';
    c.reason = 'LOCAL_MODEL_EVAL_AND_HUMAN_REVIEW_PASS_STILL_NOT_PRODUCTION';
  } else {
    c.lifecycle = 'sandbox';
    c.sandbox = true;
    c.reason = LOCAL_MODEL_SANDBOX_UNTIL_REVIEW;
  }
  await save(input.root, store);
  return c;
}

export async function promoteLocalModelCandidate(input: {
  candidateId: string;
  root: string;
  actor: CuActor;
}): Promise<PromotionGate> {
  const store = await load(input.root);
  void input.actor;
  const c = store.candidates.find((x) => x.id === input.candidateId);
  if (!c) {
    const gate: PromotionGate = {
      id: id('lmpromo'),
      candidateId: input.candidateId,
      status: 'denied',
      reason: 'LOCAL_MODEL_CANDIDATE_NOT_FOUND',
      at: new Date().toISOString(),
    };
    store.promotions.push(gate);
    await save(input.root, store);
    return gate;
  }

  if (!(c.evalPass && c.humanReviewPass && c.rightsKnown)) {
    c.lifecycle = 'sandbox';
    c.sandbox = true;
    const gate: PromotionGate = {
      id: id('lmpromo'),
      candidateId: c.id,
      status: 'sandboxed',
      reason: LOCAL_MODEL_SANDBOX_UNTIL_REVIEW,
      at: new Date().toISOString(),
    };
    store.promotions.push(gate);
    await save(input.root, store);
    return gate;
  }

  // Even with gates, remains a candidate — never PRODUCTION_AUTHORIZED here.
  c.lifecycle = 'promoted';
  c.sandbox = false;
  const gate: PromotionGate = {
    id: id('lmpromo'),
    candidateId: c.id,
    status: 'promoted',
    reason: 'LOCAL_MODEL_SANDBOX_GATES_PASSED_CANDIDATE_NOT_PRODUCTION_AUTHORIZED',
    at: new Date().toISOString(),
  };
  store.promotions.push(gate);
  await save(input.root, store);
  return gate;
}
