/**
 * 62L-CU Agent University Federation — bounded agent universities federated
 * across departments/regions (builds on CH/CT). skill ≠ permission escalation.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CU_LOCKS,
  HONESTY_BANNER,
  UNIVERSITY_SKILL_NO_PERMISSION,
  type CuActor,
} from './cognitive-research-cloud-types';

export type FederatedUniversity = {
  id: string;
  name: string;
  department: string;
  region: string;
  orgId: string;
  tenantId: string;
  bounded: true;
  createdAt: string;
};

export type FederationBond = {
  id: string;
  universityIds: string[];
  status: 'bounded' | 'denied';
  reason: string;
  at: string;
};

export type UniversitySkillGrant = {
  id: string;
  universityId: string;
  agentId: string;
  skillKey: string;
  priorPermissionLevel: number;
  permissionLevel: number;
  permissionIncreased: false;
  skillIsPermissionGrant: false;
  status: 'accepted' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  universities: FederatedUniversity[];
  bonds: FederationBond[];
  skills: UniversitySkillGrant[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-university-federation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    universities: [],
    bonds: [],
    skills: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function agentUniversityFederationHonesty() {
  return {
    banner: HONESTY_BANNER,
    universitySkillIsPermission: CU_LOCKS.UNIVERSITY_SKILL_IS_PERMISSION,
    learningGrantsPermission: CU_LOCKS.LEARNING_GRANTS_PERMISSION,
    l4AutonomyEnabled: CU_LOCKS.L4_AUTONOMY_ENABLED,
  };
}

export async function enrollFederatedUniversity(input: {
  name: string;
  department: string;
  region: string;
  orgId: string;
  tenantId: string;
  root: string;
  actor: CuActor;
}): Promise<FederatedUniversity> {
  const store = await load(input.root);
  const uni: FederatedUniversity = {
    id: id('funi'),
    name: input.name.trim(),
    department: input.department.trim().toLowerCase(),
    region: input.region.trim().toLowerCase(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    bounded: true,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.universities.push(uni);
  await save(input.root, store);
  return uni;
}

export async function federateUniversities(input: {
  universityIds: string[];
  root: string;
  actor: CuActor;
}): Promise<FederationBond> {
  const store = await load(input.root);
  void input.actor;
  const found = input.universityIds.filter((uid) =>
    store.universities.some((u) => u.id === uid),
  );
  const ok = found.length === input.universityIds.length && found.length >= 2;
  const bond: FederationBond = {
    id: id('fbond'),
    universityIds: found,
    status: ok ? 'bounded' : 'denied',
    reason: ok
      ? 'UNIVERSITY_FEDERATION_BOUNDED_ACROSS_DEPARTMENTS_REGIONS'
      : 'UNIVERSITY_FEDERATION_REQUIRES_ENROLLED_MEMBERS',
    at: new Date().toISOString(),
  };
  store.bonds.push(bond);
  await save(input.root, store);
  return bond;
}

export async function grantUniversitySkill(input: {
  universityId: string;
  agentId: string;
  skillKey: string;
  priorPermissionLevel: number;
  claimedPermissionEscalation?: boolean;
  root: string;
  actor: CuActor;
}): Promise<UniversitySkillGrant> {
  const store = await load(input.root);
  void input.actor;
  const uni = store.universities.find((u) => u.id === input.universityId);
  const escalate = input.claimedPermissionEscalation === true;

  if (!uni || escalate) {
    const grant: UniversitySkillGrant = {
      id: id('uskill'),
      universityId: input.universityId,
      agentId: input.agentId,
      skillKey: input.skillKey,
      priorPermissionLevel: input.priorPermissionLevel,
      permissionLevel: input.priorPermissionLevel,
      permissionIncreased: false,
      skillIsPermissionGrant: false,
      status: 'denied',
      reason: UNIVERSITY_SKILL_NO_PERMISSION,
      at: new Date().toISOString(),
    };
    store.skills.push(grant);
    await save(input.root, store);
    return grant;
  }

  const grant: UniversitySkillGrant = {
    id: id('uskill'),
    universityId: uni.id,
    agentId: input.agentId,
    skillKey: input.skillKey.trim().toLowerCase(),
    priorPermissionLevel: input.priorPermissionLevel,
    permissionLevel: input.priorPermissionLevel,
    permissionIncreased: false,
    skillIsPermissionGrant: false,
    status: 'accepted',
    reason: 'UNIVERSITY_SKILL_RECORDED_WITHOUT_PERMISSION_ESCALATION',
    at: new Date().toISOString(),
  };
  store.skills.push(grant);
  await save(input.root, store);
  return grant;
}
