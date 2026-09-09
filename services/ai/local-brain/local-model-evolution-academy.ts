/**
 * 62L-CI Local Model Evolution Academy —
 * Eval-driven local-model improvement candidates.
 * Skill/model update ≠ authority / permission grant.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CI_LOCKS,
  HONESTY_BANNER,
  MODEL_EVOLUTION_NO_PERMISSION,
  type CiActor,
} from './persistent-intelligence-economy-types';

export type ModelEvolutionCandidate = {
  id: string;
  modelId: string;
  evalScore: number;
  baselineScore: number;
  status: 'CANDIDATE' | 'EVAL_PASS' | 'EVAL_FAIL' | 'REJECTED';
  permissionEscalation: false;
  productionAuthorized: false;
  createdAt: string;
  updatedAt: string;
};

export type AcademyResult = {
  accepted: boolean;
  reason: string;
  candidate?: ModelEvolutionCandidate;
  permissionLevelAfter?: number;
  at: string;
};

type Store = { candidates: ModelEvolutionCandidate[] };

function storePath(root: string) {
  return xivLocalPath(root, 'local-model-evolution-academy.json');
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

export function modelAcademyHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CI_LOCKS.L4_AUTONOMY_ENABLED,
    modelEvolutionGrantsPermission: CI_LOCKS.MODEL_EVOLUTION_GRANTS_PERMISSION,
    learningIsPermission: CI_LOCKS.LEARNING_IS_PERMISSION,
    selfPermissionExpansion: CI_LOCKS.SELF_PERMISSION_EXPANSION,
  };
}

export async function submitEvalDrivenCandidate(input: {
  modelId: string;
  evalScore: number;
  baselineScore: number;
  root: string;
  actor: CiActor;
}): Promise<AcademyResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const pass = input.evalScore > input.baselineScore;
  const candidate: ModelEvolutionCandidate = {
    id: id('mlea'),
    modelId: input.modelId,
    evalScore: input.evalScore,
    baselineScore: input.baselineScore,
    status: pass ? 'EVAL_PASS' : 'EVAL_FAIL',
    permissionEscalation: false,
    productionAuthorized: false,
    createdAt: now,
    updatedAt: now,
  };
  store.candidates.push(candidate);
  await save(input.root, store);
  return {
    accepted: pass,
    reason: pass
      ? 'MODEL_EVOLUTION_CANDIDATE_EVAL_PASS_NO_AUTHORITY'
      : 'MODEL_EVOLUTION_CANDIDATE_EVAL_FAIL',
    candidate,
    permissionLevelAfter: input.actor.permissionLevel,
    at: now,
  };
}

/**
 * Attempting to escalate permissions via model evolution is always DENIED.
 * Actor permission level is unchanged.
 */
export async function attemptPermissionEscalationViaEvolution(input: {
  candidateId: string;
  requestedPermissionLevel: number;
  root: string;
  actor: CiActor;
}): Promise<AcademyResult> {
  const store = await load(input.root);
  const candidate = store.candidates.find((c) => c.id === input.candidateId);
  const now = new Date().toISOString();
  if (candidate) {
    candidate.permissionEscalation = false;
    candidate.productionAuthorized = false;
    candidate.updatedAt = now;
    await save(input.root, store);
  }
  return {
    accepted: false,
    reason: MODEL_EVOLUTION_NO_PERMISSION,
    candidate,
    permissionLevelAfter: input.actor.permissionLevel,
    at: now,
  };
}
