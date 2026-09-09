/**
 * 62L-CT A — AI Research Civilization OS
 * Bounded research schools and labs under Superbrain coexistence.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { CT_LOCKS, HONESTY_BANNER, type CtActor } from './ai-research-civilization-os-types';

export type ResearchSchool = {
  id: string;
  name: string;
  domain: string;
  bounded: boolean;
  coexistenceWithSuperbrain: boolean;
  l4AutonomyEnabled: false;
  status: 'active' | 'bounded' | 'denied';
  reason: string;
  createdAt: string;
};

export type ResearchLab = {
  id: string;
  schoolId: string;
  name: string;
  universeId: string;
  bounded: boolean;
  permissionLevel: number;
  status: 'active' | 'bounded' | 'denied';
  reason: string;
  createdAt: string;
};

type Store = { schools: ResearchSchool[]; labs: ResearchLab[] };

function storePath(root: string) {
  return xivLocalPath(root, 'ai-research-civilization-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { schools: [], labs: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function researchCivilizationHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CT_LOCKS.L4_AUTONOMY_ENABLED,
    schoolsBounded: CT_LOCKS.RESEARCH_SCHOOLS_BOUNDED,
    coexistenceLayer: CT_LOCKS.OS_IS_COEXISTENCE_LAYER,
    productionAuthorized: CT_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function bootstrapResearchCivilization(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: CtActor;
}): Promise<{ id: string; schools: number; labs: number; coexistence: true }> {
  const store = await load(input.root);
  const civId = id('civ');
  await save(input.root, store);
  void input.actor;
  return {
    id: civId,
    schools: store.schools.length,
    labs: store.labs.length,
    coexistence: true,
  };
}

export async function registerResearchSchool(input: {
  name: string;
  domain: string;
  root: string;
  actor: CtActor;
}): Promise<ResearchSchool> {
  const store = await load(input.root);
  const school: ResearchSchool = {
    id: id('school'),
    name: input.name,
    domain: input.domain,
    bounded: true,
    coexistenceWithSuperbrain: true,
    l4AutonomyEnabled: false,
    status: 'bounded',
    reason: 'RESEARCH_SCHOOL_BOUNDED_UNDER_SUPERBRAIN_COEXISTENCE',
    createdAt: new Date().toISOString(),
  };
  store.schools.push(school);
  await save(input.root, store);
  void input.actor;
  return school;
}

export async function openResearchLab(input: {
  schoolId: string;
  name: string;
  universeId: string;
  root: string;
  actor: CtActor;
}): Promise<ResearchLab> {
  const store = await load(input.root);
  const school = store.schools.find((s) => s.id === input.schoolId);
  if (!school) {
    return {
      id: id('lab'),
      schoolId: input.schoolId,
      name: input.name,
      universeId: input.universeId,
      bounded: true,
      permissionLevel: 0,
      status: 'denied',
      reason: 'RESEARCH_SCHOOL_REQUIRED',
      createdAt: new Date().toISOString(),
    };
  }
  const lab: ResearchLab = {
    id: id('lab'),
    schoolId: school.id,
    name: input.name,
    universeId: input.universeId,
    bounded: true,
    permissionLevel: Math.min(input.actor.permissionLevel, 0),
    status: 'bounded',
    reason: 'LAB_BOUNDED_NO_PERMISSION_EXPANSION',
    createdAt: new Date().toISOString(),
  };
  store.labs.push(lab);
  await save(input.root, store);
  return lab;
}
