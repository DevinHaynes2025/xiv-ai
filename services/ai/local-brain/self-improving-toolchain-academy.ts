/**
 * 62L-CT G — Self-Improving Toolchain Academy
 * Sandbox coding/testing/debugging/refactoring/benchmarks.
 * Controlled improvement only; skill ≠ permission; no open-ended self-modify.
 * Queue cannot production-deploy.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ACADEMY_SKILL_NO_ESCALATION,
  CT_LOCKS,
  HONESTY_BANNER,
  QUEUE_PRODUCTION_DEPLOY_DENIED,
  UNCONTROLLED_SELF_IMPROVEMENT_DENIED,
  type CtActor,
} from './ai-research-civilization-os-types';

export type AcademySkill = {
  id: string;
  agentId: string;
  skill: string;
  sandbox: true;
  permissionLevelBefore: number;
  permissionLevelAfter: number;
  status: 'learned_sandbox' | 'denied';
  reason: string;
  createdAt: string;
};

export type SelfImproveAttempt = {
  id: string;
  mode: 'controlled_sandbox' | 'uncontrolled' | 'open_ended_self_modify';
  status: 'allowed_sandbox' | 'denied';
  reason: string;
  at: string;
};

export type DeployAttempt = {
  id: string;
  target: 'production' | 'staging_candidate';
  fromQueue: true;
  status: 'denied' | 'candidate_only';
  reason: string;
  at: string;
};

type Store = {
  skills: AcademySkill[];
  improves: SelfImproveAttempt[];
  deploys: DeployAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'self-improving-toolchain-academy.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    skills: [],
    improves: [],
    deploys: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function toolchainAcademyHonesty() {
  return {
    banner: HONESTY_BANNER,
    sandboxOnly: CT_LOCKS.TOOLCHAIN_ACADEMY_SANDBOX_ONLY,
    skillEscalatesPermissions: CT_LOCKS.ACADEMY_SKILL_ESCALATES_PERMISSIONS,
    learningEqPermission: CT_LOCKS.LEARNING_EQ_PERMISSION,
    uncontrolledSelfImprovement: CT_LOCKS.UNCONTROLLED_SELF_IMPROVEMENT,
    openEndedSelfModify: CT_LOCKS.OPEN_ENDED_SELF_MODIFY,
    queueProductionDeploy: CT_LOCKS.QUEUE_PRODUCTION_DEPLOY,
  };
}

export async function recordAcademySkill(input: {
  agentId: string;
  skill: string;
  permissionLevel: number;
  requestEscalation?: boolean;
  root: string;
  actor: CtActor;
}): Promise<AcademySkill> {
  const store = await load(input.root);
  const before = input.permissionLevel;
  const after = input.requestEscalation ? before : before;
  const row: AcademySkill = {
    id: id('skill'),
    agentId: input.agentId,
    skill: input.skill,
    sandbox: true,
    permissionLevelBefore: before,
    permissionLevelAfter: before,
    status: input.requestEscalation ? 'denied' : 'learned_sandbox',
    reason: input.requestEscalation
      ? ACADEMY_SKILL_NO_ESCALATION
      : 'ACADEMY_SKILL_SANDBOX_LEARNING_NOT_PERMISSION',
    createdAt: new Date().toISOString(),
  };
  // Even if somehow after differed, enforce no escalation
  row.permissionLevelAfter = row.permissionLevelBefore;
  if (input.requestEscalation) {
    row.status = 'denied';
    row.reason = ACADEMY_SKILL_NO_ESCALATION;
  }
  store.skills.push(row);
  await save(input.root, store);
  void after;
  void input.actor;
  return row;
}

export async function attemptSelfImprovement(input: {
  mode: 'controlled_sandbox' | 'uncontrolled' | 'open_ended_self_modify';
  root: string;
  actor: CtActor;
}): Promise<SelfImproveAttempt> {
  const store = await load(input.root);
  const denied =
    input.mode === 'uncontrolled' || input.mode === 'open_ended_self_modify';
  const row: SelfImproveAttempt = {
    id: id('improve'),
    mode: input.mode,
    status: denied ? 'denied' : 'allowed_sandbox',
    reason: denied
      ? UNCONTROLLED_SELF_IMPROVEMENT_DENIED
      : 'CONTROLLED_SANDBOX_IMPROVEMENT_ONLY',
    at: new Date().toISOString(),
  };
  store.improves.push(row);
  await save(input.root, store);
  void input.actor;
  return row;
}

export async function attemptQueueProductionDeploy(input: {
  target?: 'production' | 'staging_candidate';
  root: string;
  actor: CtActor;
}): Promise<DeployAttempt> {
  const store = await load(input.root);
  const target = input.target ?? 'production';
  const row: DeployAttempt = {
    id: id('deploy'),
    target,
    fromQueue: true,
    status: target === 'production' ? 'denied' : 'candidate_only',
    reason: QUEUE_PRODUCTION_DEPLOY_DENIED,
    at: new Date().toISOString(),
  };
  // production always denied from this queue
  if (target === 'production') {
    row.status = 'denied';
    row.reason = QUEUE_PRODUCTION_DEPLOY_DENIED;
  } else {
    row.status = 'candidate_only';
    row.reason = QUEUE_PRODUCTION_DEPLOY_DENIED;
  }
  store.deploys.push(row);
  await save(input.root, store);
  void input.actor;
  return row;
}
