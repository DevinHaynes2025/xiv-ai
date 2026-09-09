/**
 * 62L-CJ Autonomous Agent Apprenticeship Network — mentor/eval gates.
 * Builds on BT apprenticeship patterns: skill ≠ permission; no authority transfer.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  APPRENTICE_PERMISSION_DENIED,
  CJ_LOCKS,
  HONESTY_BANNER,
  type CjActor,
} from './intelligence-resource-grid-apprenticeship-types';

export type PermissionTier = 'observer' | 'apprentice' | 'mentor' | 'production';

export type ApprenticeshipAgent = {
  agentId: string;
  role: 'mentor' | 'apprentice';
  permissionTier: PermissionTier;
  productionAuthority: boolean;
  skillLevel: number;
};

export type ApprenticeshipSession = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  mentor: ApprenticeshipAgent;
  apprentice: ApprenticeshipAgent;
  objective: string;
  mentorEvalPassed: boolean;
  mentorEvalRequired: true;
  workcellBounded: true;
  productionAuthorized: false;
  authorityTransferred: false;
  apprenticeGainedMentorPermissions: false;
  apprenticeGainedProductionAuthority: false;
  learningIsPermissionGrant: false;
  accepted: boolean;
  reason: string;
  createdAt: string;
};

type Store = {
  sessions: ApprenticeshipSession[];
  denials: Array<{ id: string; at: string; reason: string; sessionId?: string }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'autonomous-agent-apprenticeship-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { sessions: [], denials: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function apprenticeshipNetworkHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CJ_LOCKS.L4_AUTONOMY_ENABLED,
    apprenticeGainsMentorPermissions: CJ_LOCKS.APPRENTICE_GAINS_MENTOR_PERMISSIONS,
    apprenticeGainsProductionPermissions:
      CJ_LOCKS.APPRENTICE_GAINS_PRODUCTION_PERMISSIONS,
    skillIsPermission: CJ_LOCKS.SKILL_IS_PERMISSION,
    authorityTransferViaApprenticeship:
      CJ_LOCKS.AUTHORITY_TRANSFER_VIA_APPRENTICESHIP,
    mentorEvalGateRequired: CJ_LOCKS.MENTOR_EVAL_GATE_REQUIRED,
    learningIsPermission: CJ_LOCKS.LEARNING_IS_PERMISSION,
  };
}

export async function openApprenticeshipSession(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  mentorAgentId: string;
  apprenticeAgentId: string;
  objective: string;
  mentorEvalPassed?: boolean;
  apprenticeSkillLevel?: number;
  root: string;
  actor: CjActor;
  attemptApprenticeMentorPermissionTransfer?: boolean;
  attemptApprenticeProductionAuthority?: boolean;
  attemptAuthorityTransfer?: boolean;
}): Promise<{ accepted: boolean; reason: string; session: ApprenticeshipSession | null }> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const mentorEvalPassed = input.mentorEvalPassed === true;

  const permissionProbe =
    input.attemptApprenticeMentorPermissionTransfer === true ||
    input.attemptApprenticeProductionAuthority === true ||
    input.attemptAuthorityTransfer === true;

  if (permissionProbe) {
    const denial = {
      id: id('deny'),
      at: now,
      reason: APPRENTICE_PERMISSION_DENIED,
    };
    store.denials.push(denial);
    await save(input.root, store);
    return {
      accepted: false,
      reason: APPRENTICE_PERMISSION_DENIED,
      session: null,
    };
  }

  if (!mentorEvalPassed) {
    const reason = 'MENTOR_EVAL_GATE_NOT_PASSED';
    store.denials.push({ id: id('deny'), at: now, reason });
    await save(input.root, store);
    return { accepted: false, reason, session: null };
  }

  const session: ApprenticeshipSession = {
    id: id('appr'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    mentor: {
      agentId: input.mentorAgentId,
      role: 'mentor',
      permissionTier: 'mentor',
      productionAuthority: true,
      skillLevel: 10,
    },
    apprentice: {
      agentId: input.apprenticeAgentId,
      role: 'apprentice',
      permissionTier: 'apprentice',
      productionAuthority: false,
      skillLevel: input.apprenticeSkillLevel ?? 1,
    },
    objective: input.objective,
    mentorEvalPassed: true,
    mentorEvalRequired: true,
    workcellBounded: true,
    productionAuthorized: false,
    authorityTransferred: false,
    apprenticeGainedMentorPermissions: false,
    apprenticeGainedProductionAuthority: false,
    learningIsPermissionGrant: false,
    accepted: true,
    reason: 'APPRENTICESHIP_OPEN_MENTOR_EVAL_PASSED_NO_AUTHORITY_TRANSFER',
    createdAt: now,
  };
  store.sessions.push(session);
  await save(input.root, store);
  return { accepted: true, reason: session.reason, session };
}

export async function attemptSkillPermissionEscalation(input: {
  sessionId: string;
  claimMentorPermissions?: boolean;
  claimProductionAuthority?: boolean;
  root: string;
  actor: CjActor;
}): Promise<{ accepted: boolean; reason: string; skillRaised: boolean }> {
  const store = await load(input.root);
  const session = store.sessions.find((s) => s.id === input.sessionId);
  if (!session) {
    return { accepted: false, reason: 'SESSION_NOT_FOUND', skillRaised: false };
  }

  // Skill may rise; permission/authority must not.
  session.apprentice.skillLevel += 1;
  const claim =
    input.claimMentorPermissions === true ||
    input.claimProductionAuthority === true;

  if (claim) {
    store.denials.push({
      id: id('deny'),
      at: new Date().toISOString(),
      reason: APPRENTICE_PERMISSION_DENIED,
      sessionId: session.id,
    });
    await save(input.root, store);
    return {
      accepted: false,
      reason: APPRENTICE_PERMISSION_DENIED,
      skillRaised: true,
    };
  }

  await save(input.root, store);
  return {
    accepted: true,
    reason: 'SKILL_RAISED_WITHOUT_PERMISSION_GRANT',
    skillRaised: true,
  };
}
