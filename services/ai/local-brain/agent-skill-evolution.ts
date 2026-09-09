import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BO_LOCKS,
  SKILL_NOT_PERMISSION,
  type OutcomeVerification,
} from './superbrain-neuroplasticity-types';

/**
 * Agent Skill Evolution — evidence-backed skill updates with continuing evaluation.
 * Skill evolution ≠ permission grant; learning ≠ authority.
 */

export const SKILL_EVOLUTION_STORE = 'agent-skill-evolution.json';

export type AgentSkillRecord = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  agentId: string;
  skillKey: string;
  proficiency: number;
  evaluationScore: number;
  evidenceRefs: string[];
  version: number;
  updatedAt: string;
  /** Explicit non-authority fields. */
  permissionLevel: number;
  authorityLevel: number;
  skillIsPermissionGrant: false;
  learningIsAuthority: false;
  productionAuthorized: false;
};

type SkillStore = {
  skills: AgentSkillRecord[];
  denials: Array<{ id: string; at: string; reason: string; agentId: string }>;
};

const MAX_SKILLS = 5_000;
const MAX_DENIALS = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, SKILL_EVOLUTION_STORE);
}

async function load(root: string): Promise<SkillStore> {
  const parsed = await readJsonFile<SkillStore>(storePath(root), {
    skills: [],
    denials: [],
  });
  return {
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: SkillStore) {
  await writeJsonFileAtomic(storePath(root), {
    skills: store.skills.slice(-MAX_SKILLS),
    denials: store.denials.slice(-MAX_DENIALS),
  });
}

export type SkillEvolutionInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  agentId: string;
  skillKey: string;
  proposedProficiency: number;
  evaluationScore: number;
  evidenceRefs?: string[];
  outcomeVerification: OutcomeVerification;
  /** Baseline authority/permission — evolution must not raise these. */
  currentPermissionLevel?: number;
  currentAuthorityLevel?: number;
  /** Hard-deny probe: claim skill evolution grants permission. */
  attemptPermissionGrantViaSkill?: boolean;
  /** Hard-deny probe: raise authority via skill update. */
  attemptAuthorityIncrease?: boolean;
  root?: string;
};

export type SkillEvolutionResult = {
  accepted: boolean;
  reason: string;
  skill: AgentSkillRecord | null;
  permissionIncreased: false;
  authorityIncreased: false;
  skillIsPermissionGrant: false;
  learningIsAuthority: false;
  productionAuthorization: false;
};

export async function evolveAgentSkill(input: SkillEvolutionInput): Promise<SkillEvolutionResult> {
  const root = input.root ?? process.cwd();
  const baselinePermission = input.currentPermissionLevel ?? 0;
  const baselineAuthority = input.currentAuthorityLevel ?? 0;

  const deny = async (reason: string): Promise<SkillEvolutionResult> => {
    const store = await load(root);
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason,
      agentId: input.agentId,
    });
    await save(root, store);
    return {
      accepted: false,
      reason,
      skill: null,
      permissionIncreased: false,
      authorityIncreased: false,
      skillIsPermissionGrant: false,
      learningIsAuthority: false,
      productionAuthorization: false,
    };
  };

  if (!input.orgId || !input.tenantId || !input.universeId || !input.agentId) {
    return deny('ORG_TENANT_UNIVERSE_AGENT_REQUIRED');
  }

  if (input.attemptPermissionGrantViaSkill || input.attemptAuthorityIncrease) {
    return deny(SKILL_NOT_PERMISSION);
  }

  if (input.outcomeVerification !== 'verified') {
    return deny('SKILL_EVOLUTION_REQUIRES_VERIFIED_OUTCOME');
  }

  const proficiency = Math.max(0, Math.min(1, Number(input.proposedProficiency) || 0));
  const evaluationScore = Math.max(0, Math.min(1, Number(input.evaluationScore) || 0));

  const store = await load(root);
  const existing = store.skills.find(
    (s) =>
      s.orgId === input.orgId &&
      s.universeId === input.universeId &&
      s.agentId === input.agentId &&
      s.skillKey === input.skillKey,
  );

  const skill: AgentSkillRecord = {
    id: existing?.id ?? randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    agentId: input.agentId,
    skillKey: input.skillKey,
    proficiency,
    evaluationScore,
    evidenceRefs: input.evidenceRefs ?? [],
    version: (existing?.version ?? 0) + 1,
    updatedAt: new Date().toISOString(),
    // Skill evolution NEVER raises permission/authority.
    permissionLevel: baselinePermission,
    authorityLevel: baselineAuthority,
    skillIsPermissionGrant: false,
    learningIsAuthority: false,
    productionAuthorized: false,
  };

  if (
    skill.permissionLevel > baselinePermission ||
    skill.authorityLevel > baselineAuthority
  ) {
    return deny(SKILL_NOT_PERMISSION);
  }

  if (existing) {
    const idx = store.skills.indexOf(existing);
    store.skills[idx] = skill;
  } else {
    store.skills.push(skill);
  }
  await save(root, store);

  return {
    accepted: true,
    reason: 'SKILL_EVOLVED_EVIDENCE_BACKED_NO_AUTHORITY_CHANGE',
    skill,
    permissionIncreased: false,
    authorityIncreased: false,
    skillIsPermissionGrant: false,
    learningIsAuthority: false,
    productionAuthorization: false,
  };
}

export async function listAgentSkills(root: string, orgId: string, agentId: string) {
  const store = await load(root);
  return store.skills.filter((s) => s.orgId === orgId && s.agentId === agentId);
}

export function skillEvolutionHonesty() {
  return {
    locks: BO_LOCKS,
    skillEvolutionIsPermissionGrant: BO_LOCKS.SKILL_EVOLUTION_IS_PERMISSION_GRANT,
    learningIsAuthority: BO_LOCKS.LEARNING_IS_AUTHORITY,
    productionAuthorization: false as const,
  };
}
