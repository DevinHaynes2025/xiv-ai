/**
 * 62L-CO Worldwide Research Coordination Grid — bounded regional workcells.
 * Learning ≠ permission; no autonomous spend; no permission escalation.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CO_LOCKS,
  HONESTY_BANNER,
  RESEARCH_AUTHORITY_DENIED,
  type CoActor,
} from './global-knowledge-exchange-os-types';

export type ResearchWorkcell = {
  id: string;
  regionId: string;
  objective: string;
  bounded: true;
  permissionEscalation: false;
  spendAuthority: false;
  learningRecorded: boolean;
  accepted: boolean;
  reason: string;
  createdAt: string;
};

export type ResearchAuthorityProbe = {
  id: string;
  workcellId: string;
  attemptPermissionEscalation: boolean;
  attemptSpend: boolean;
  accepted: boolean;
  reason: string;
  at: string;
};

type Store = {
  workcells: ResearchWorkcell[];
  probes: ResearchAuthorityProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'worldwide-research-coordination-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { workcells: [], probes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function researchCoordinationHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CO_LOCKS.L4_AUTONOMY_ENABLED,
    researchWorkcellBounded: CO_LOCKS.RESEARCH_WORKCELL_BOUNDED,
    researchPermissionEscalation: CO_LOCKS.RESEARCH_PERMISSION_ESCALATION,
    researchAutonomousSpend: CO_LOCKS.RESEARCH_AUTONOMOUS_SPEND,
    learningIsPermission: CO_LOCKS.LEARNING_IS_PERMISSION,
    autonomousSpending: CO_LOCKS.AUTONOMOUS_SPENDING,
  };
}

export async function openResearchWorkcell(input: {
  regionId: string;
  objective: string;
  attemptPermissionEscalation?: boolean;
  attemptSpend?: boolean;
  root: string;
  actor: CoActor;
}): Promise<ResearchWorkcell> {
  const store = await load(input.root);
  const now = new Date().toISOString();

  if (input.attemptPermissionEscalation === true || input.attemptSpend === true) {
    const workcell: ResearchWorkcell = {
      id: id('rwc'),
      regionId: input.regionId,
      objective: input.objective,
      bounded: true,
      permissionEscalation: false,
      spendAuthority: false,
      learningRecorded: false,
      accepted: false,
      reason: RESEARCH_AUTHORITY_DENIED,
      createdAt: now,
    };
    store.workcells.push(workcell);
    await save(input.root, store);
    return workcell;
  }

  const workcell: ResearchWorkcell = {
    id: id('rwc'),
    regionId: input.regionId,
    objective: input.objective,
    bounded: true,
    permissionEscalation: false,
    spendAuthority: false,
    learningRecorded: false,
    accepted: true,
    reason: 'BOUNDED_REGIONAL_RESEARCH_WORKCELL_OPENED',
    createdAt: now,
  };
  store.workcells.push(workcell);
  await save(input.root, store);
  return workcell;
}

export async function recordResearchLearning(input: {
  workcellId: string;
  lesson: string;
  claimPermissionFromLearning?: boolean;
  root: string;
  actor: CoActor;
}): Promise<{ accepted: boolean; reason: string; learningIsPermission: false }> {
  const store = await load(input.root);
  const workcell = store.workcells.find((w) => w.id === input.workcellId);
  if (!workcell || !workcell.accepted) {
    return {
      accepted: false,
      reason: 'WORKCELL_NOT_FOUND_OR_NOT_ACCEPTED',
      learningIsPermission: false,
    };
  }

  if (input.claimPermissionFromLearning === true) {
    const probe: ResearchAuthorityProbe = {
      id: id('probe'),
      workcellId: workcell.id,
      attemptPermissionEscalation: true,
      attemptSpend: false,
      accepted: false,
      reason: RESEARCH_AUTHORITY_DENIED,
      at: new Date().toISOString(),
    };
    store.probes.push(probe);
    await save(input.root, store);
    return {
      accepted: false,
      reason: RESEARCH_AUTHORITY_DENIED,
      learningIsPermission: false,
    };
  }

  workcell.learningRecorded = true;
  await save(input.root, store);
  return {
    accepted: true,
    reason: `LEARNING_RECORDED_NOT_PERMISSION:${input.lesson.slice(0, 80)}`,
    learningIsPermission: false,
  };
}

export async function attemptResearchAuthorityEscalation(input: {
  workcellId: string;
  attemptPermissionEscalation?: boolean;
  attemptSpend?: boolean;
  root: string;
  actor: CoActor;
}): Promise<ResearchAuthorityProbe> {
  const store = await load(input.root);
  const probe: ResearchAuthorityProbe = {
    id: id('probe'),
    workcellId: input.workcellId,
    attemptPermissionEscalation: input.attemptPermissionEscalation === true,
    attemptSpend: input.attemptSpend === true,
    accepted: false,
    reason: RESEARCH_AUTHORITY_DENIED,
    at: new Date().toISOString(),
  };
  store.probes.push(probe);
  await save(input.root, store);
  return probe;
}
