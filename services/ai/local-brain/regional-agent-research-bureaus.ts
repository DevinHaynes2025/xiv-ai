/**
 * 62L-CL Regional Agent Research Bureaus — bounded regional research bureaus
 * (sandboxed learning/eval). Learning ≠ permission; no autonomous spend.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BUREAU_SKILL_NOT_PERMISSION,
  CL_LOCKS,
  HONESTY_BANNER,
  type ClActor,
} from './global-knowledge-server-constellation-types';

export type ResearchBureau = {
  id: string;
  regionCode: string;
  title: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  sandboxed: true;
  autonomousSpend: false;
  createdAt: string;
};

export type BureauSkillGrant = {
  id: string;
  bureauId: string;
  agentId: string;
  skillKey: string;
  score: number;
  permissionLevel: number;
  authorityLevel: number;
  skillIsPermissionGrant: false;
  learningIsAuthority: false;
  autonomousSpend: false;
  status: 'granted_bounded' | 'denied';
  reason: string;
  createdAt: string;
};

export type BureauEscalationAttempt = {
  id: string;
  grantId: string;
  requestedPermissionDelta: number;
  requestedAuthorityDelta: number;
  rejected: true;
  reason: string;
  at: string;
};

type Store = {
  bureaus: ResearchBureau[];
  grants: BureauSkillGrant[];
  escalations: BureauEscalationAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'regional-agent-research-bureaus.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    bureaus: [],
    grants: [],
    escalations: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function researchBureausHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CL_LOCKS.L4_AUTONOMY_ENABLED,
    learningIsPermission: CL_LOCKS.LEARNING_IS_PERMISSION,
    skillIsPermission: CL_LOCKS.BUREAU_SKILL_IS_PERMISSION,
    skillIsAuthority: CL_LOCKS.BUREAU_SKILL_IS_AUTHORITY,
    autonomousSpend: CL_LOCKS.AUTONOMOUS_SPEND,
  };
}

export async function openRegionalResearchBureau(input: {
  regionCode: string;
  title?: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: ClActor;
}): Promise<ResearchBureau> {
  const store = await load(input.root);
  const bureau: ResearchBureau = {
    id: id('rarb'),
    regionCode: input.regionCode,
    title: input.title?.trim() || `${input.regionCode} Research Bureau`,
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    sandboxed: true,
    autonomousSpend: false,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.bureaus.push(bureau);
  await save(input.root, store);
  return bureau;
}

export async function grantBureauSkill(input: {
  bureauId: string;
  agentId: string;
  skillKey: string;
  score: number;
  actorPermissionLevel: number;
  actorAuthorityLevel: number;
  root: string;
  actor: ClActor;
}): Promise<BureauSkillGrant> {
  const store = await load(input.root);
  const bureau = store.bureaus.find((b) => b.id === input.bureauId);
  void input.actor;

  if (!bureau) {
    const denied: BureauSkillGrant = {
      id: id('bsg'),
      bureauId: input.bureauId,
      agentId: input.agentId,
      skillKey: input.skillKey,
      score: input.score,
      permissionLevel: input.actorPermissionLevel,
      authorityLevel: input.actorAuthorityLevel,
      skillIsPermissionGrant: false,
      learningIsAuthority: false,
      autonomousSpend: false,
      status: 'denied',
      reason: 'RESEARCH_BUREAU_NOT_FOUND',
      createdAt: new Date().toISOString(),
    };
    store.grants.push(denied);
    await save(input.root, store);
    return denied;
  }

  const grant: BureauSkillGrant = {
    id: id('bsg'),
    bureauId: bureau.id,
    agentId: input.agentId,
    skillKey: input.skillKey,
    score: input.score,
    // Skill grant NEVER escalates permission/authority.
    permissionLevel: input.actorPermissionLevel,
    authorityLevel: input.actorAuthorityLevel,
    skillIsPermissionGrant: false,
    learningIsAuthority: false,
    autonomousSpend: false,
    status: 'granted_bounded',
    reason: BUREAU_SKILL_NOT_PERMISSION,
    createdAt: new Date().toISOString(),
  };
  store.grants.push(grant);
  await save(input.root, store);
  return grant;
}

export async function attemptBureauPermissionEscalation(input: {
  grantId: string;
  requestedPermissionDelta: number;
  requestedAuthorityDelta: number;
  root: string;
  actor: ClActor;
}): Promise<{
  accepted: false;
  rejected: true;
  reason: string;
  grant: BureauSkillGrant | null;
  attempt: BureauEscalationAttempt | null;
}> {
  const store = await load(input.root);
  const grant = store.grants.find((g) => g.id === input.grantId) ?? null;
  void input.actor;

  const attempt: BureauEscalationAttempt = {
    id: id('besc'),
    grantId: input.grantId,
    requestedPermissionDelta: input.requestedPermissionDelta,
    requestedAuthorityDelta: input.requestedAuthorityDelta,
    rejected: true,
    reason: BUREAU_SKILL_NOT_PERMISSION,
    at: new Date().toISOString(),
  };
  store.escalations.push(attempt);
  // Never mutate grant permission/authority.
  await save(input.root, store);
  return {
    accepted: false,
    rejected: true,
    reason: BUREAU_SKILL_NOT_PERMISSION,
    grant,
    attempt,
  };
}
