/**
 * 62L-CG Autonomous Research Universities —
 * Bounded agent learning curricula/labs (builds on BS/BU patterns).
 * Skill certification ≠ permission/authority grant; learning ≠ self-escalation.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CG_LOCKS,
  HONESTY_BANNER,
  UNIVERSITY_SKILL_NOT_PERMISSION,
  type CgActor,
} from './deep-knowledge-refinery-os-types';

export type ResearchCurriculum = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  title: string;
  tracks: string[];
  bounded: true;
  createdAt: string;
};

export type ResearchLabActivity = {
  id: string;
  curriculumId: string;
  kind: 'seminar' | 'lab' | 'thesis_defense';
  title: string;
  score: number;
  evidenceRefs: string[];
  completedAt: string;
};

export type ResearchSkillGrant = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  agentId: string;
  skillKey: string;
  grantedAt: string;
  permissionLevel: number;
  authorityLevel: number;
  skillIsPermissionGrant: false;
  learningIsSelfEscalation: false;
  productionAuthorized: false;
  bounded: true;
  evidenceRefs: string[];
};

type Store = {
  curricula: ResearchCurriculum[];
  activities: ResearchLabActivity[];
  grants: ResearchSkillGrant[];
  denials: Array<{ id: string; at: string; reason: string; agentId: string }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'autonomous-research-universities.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    curricula: [],
    activities: [],
    grants: [],
    denials: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), {
    curricula: store.curricula.slice(-5_000),
    activities: store.activities.slice(-5_000),
    grants: store.grants.slice(-5_000),
    denials: store.denials.slice(-10_000),
  });
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function researchUniversitiesHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CG_LOCKS.L4_AUTONOMY_ENABLED,
    learningIsPermission: CG_LOCKS.LEARNING_IS_PERMISSION,
    universitySkillIsPermission: CG_LOCKS.UNIVERSITY_SKILL_IS_PERMISSION,
    selfPermissionExpansion: CG_LOCKS.SELF_PERMISSION_EXPANSION,
    productionAuthorization: CG_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function registerResearchCurriculum(input: {
  title: string;
  tracks?: string[];
  root: string;
  actor: CgActor;
}): Promise<ResearchCurriculum> {
  const store = await load(input.root);
  const curriculum: ResearchCurriculum = {
    id: id('rcurr'),
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    title: input.title.trim(),
    tracks: input.tracks ?? ['archive_research', 'storage_systems', 'reasoning_fabric', 'edge_ops'],
    bounded: true,
    createdAt: new Date().toISOString(),
  };
  store.curricula.push(curriculum);
  await save(input.root, store);
  return curriculum;
}

export async function completeResearchLab(input: {
  curriculumId: string;
  kind: ResearchLabActivity['kind'];
  title: string;
  score: number;
  evidenceRefs?: string[];
  root: string;
  actor: CgActor;
}): Promise<{ accepted: boolean; reason: string; activity: ResearchLabActivity | null }> {
  const store = await load(input.root);
  const curriculum = store.curricula.find((c) => c.id === input.curriculumId);
  if (!curriculum) {
    return { accepted: false, reason: 'CURRICULUM_NOT_FOUND', activity: null };
  }
  const activity: ResearchLabActivity = {
    id: id('rlab'),
    curriculumId: input.curriculumId,
    kind: input.kind,
    title: input.title.trim(),
    score: Math.max(0, Math.min(1, Number(input.score) || 0)),
    evidenceRefs: input.evidenceRefs ?? [],
    completedAt: new Date().toISOString(),
  };
  store.activities.push(activity);
  await save(input.root, store);
  return { accepted: true, reason: 'RESEARCH_LAB_RECORDED', activity };
}

export type GrantResearchSkillInput = {
  agentId: string;
  skillKey: string;
  examScore: number;
  evidenceRefs?: string[];
  currentPermissionLevel?: number;
  currentAuthorityLevel?: number;
  /** Hard-deny probe: claim skill grant escalates permission. */
  attemptPermissionEscalation?: boolean;
  /** Hard-deny probe: raise authority via learning. */
  attemptAuthorityIncrease?: boolean;
  root: string;
  actor: CgActor;
};

export type GrantResearchSkillResult = {
  accepted: boolean;
  reason: string;
  grant: ResearchSkillGrant | null;
  permissionIncreased: false;
  authorityIncreased: false;
  skillIsPermissionGrant: false;
  learningIsSelfEscalation: false;
  productionAuthorization: false;
};

export async function grantResearchSkill(
  input: GrantResearchSkillInput,
): Promise<GrantResearchSkillResult> {
  const baselinePermission = input.currentPermissionLevel ?? input.actor.permissionLevel ?? 0;
  const baselineAuthority = input.currentAuthorityLevel ?? input.actor.authorityLevel ?? 0;

  const deny = async (reason: string): Promise<GrantResearchSkillResult> => {
    const store = await load(input.root);
    store.denials.push({
      id: id('rdeny'),
      at: new Date().toISOString(),
      reason,
      agentId: input.agentId,
    });
    await save(input.root, store);
    return {
      accepted: false,
      reason,
      grant: null,
      permissionIncreased: false,
      authorityIncreased: false,
      skillIsPermissionGrant: false,
      learningIsSelfEscalation: false,
      productionAuthorization: false,
    };
  };

  if (!input.agentId || !input.skillKey) {
    return deny('AGENT_AND_SKILL_REQUIRED');
  }
  if (input.attemptPermissionEscalation || input.attemptAuthorityIncrease) {
    return deny(UNIVERSITY_SKILL_NOT_PERMISSION);
  }
  if ((Number(input.examScore) || 0) < 0.7) {
    return deny('EXAM_SCORE_BELOW_RESEARCH_SKILL_THRESHOLD');
  }

  const store = await load(input.root);
  const grant: ResearchSkillGrant = {
    id: id('rskill'),
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    agentId: input.agentId,
    skillKey: input.skillKey,
    grantedAt: new Date().toISOString(),
    permissionLevel: baselinePermission,
    authorityLevel: baselineAuthority,
    skillIsPermissionGrant: false,
    learningIsSelfEscalation: false,
    productionAuthorized: false,
    bounded: true,
    evidenceRefs: input.evidenceRefs ?? [],
  };

  if (
    grant.permissionLevel > baselinePermission ||
    grant.authorityLevel > baselineAuthority
  ) {
    return deny(UNIVERSITY_SKILL_NOT_PERMISSION);
  }

  store.grants.push(grant);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'RESEARCH_SKILL_GRANTED_BOUNDED_NO_PERMISSION',
    grant,
    permissionIncreased: false,
    authorityIncreased: false,
    skillIsPermissionGrant: false,
    learningIsSelfEscalation: false,
    productionAuthorization: false,
  };
}
