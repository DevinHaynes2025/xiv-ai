/**
 * 62L-CE Historical Civilization Memory Lake — time-aware lake fed by authorized
 * historical/cultural/business/legal/health/supply-chain archives.
 * Persona/archive sims labeled; soul-resurrection claims REJECTED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CE_LOCKS,
  HONESTY_BANNER,
  PERSONA_LABELED_SIMULATION,
  SOUL_CLAIM_REJECTED,
  UNAUTHORIZED_ARCHIVE_DENIED,
  type CeActor,
} from './knowledge-excavation-memory-lake-types';

export type MemoryDomain =
  | 'historical'
  | 'cultural'
  | 'business'
  | 'legal'
  | 'health'
  | 'supply_chain';

export type MemoryRecord = {
  id: string;
  domain: MemoryDomain;
  title: string;
  eraStartYear: number;
  eraEndYear: number;
  authorized: boolean;
  timeAware: true;
  status: 'retained' | 'denied';
  reason: string;
  createdAt: string;
};

export type PersonaSimulation = {
  id: string;
  label: string;
  eraYear: number;
  labeledSimulation: true;
  soulResurrectionClaim: false;
  status: 'labeled_simulation' | 'rejected';
  reason: string;
  createdAt: string;
};

type Store = {
  records: MemoryRecord[];
  personas: PersonaSimulation[];
  soulClaimAttempts: Array<{
    id: string;
    rejected: true;
    reason: string;
    at: string;
  }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'historical-civilization-memory-lake.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    records: [],
    personas: [],
    soulClaimAttempts: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function memoryLakeHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CE_LOCKS.L4_AUTONOMY_ENABLED,
    timeAware: CE_LOCKS.MEMORY_LAKE_TIME_AWARE,
    personaMustBeLabeledSimulation: CE_LOCKS.PERSONA_MUST_BE_LABELED_SIMULATION,
    soulResurrectionClaims: CE_LOCKS.SOUL_RESURRECTION_CLAIMS,
  };
}

export async function ingestMemoryArchive(input: {
  domain: MemoryDomain;
  title: string;
  eraStartYear: number;
  eraEndYear: number;
  authorized: boolean;
  root: string;
  actor: CeActor;
}): Promise<MemoryRecord> {
  const store = await load(input.root);
  if (input.eraEndYear < input.eraStartYear) {
    throw new Error('ERA_RANGE_INVALID');
  }
  const authorized = input.authorized === true;
  const record: MemoryRecord = {
    id: id('mem'),
    domain: input.domain,
    title: input.title,
    eraStartYear: input.eraStartYear,
    eraEndYear: input.eraEndYear,
    authorized,
    timeAware: true,
    status: authorized ? 'retained' : 'denied',
    reason: authorized ? 'TIME_AWARE_AUTHORIZED_INGEST' : UNAUTHORIZED_ARCHIVE_DENIED,
    createdAt: new Date().toISOString(),
  };
  store.records.push(record);
  await save(input.root, store);
  return record;
}

export async function createPersonaSimulation(input: {
  label: string;
  eraYear: number;
  claimSoulResurrection?: boolean;
  root: string;
  actor: CeActor;
}): Promise<PersonaSimulation> {
  const store = await load(input.root);
  if (input.claimSoulResurrection) {
    const rejected: PersonaSimulation = {
      id: id('persona'),
      label: input.label,
      eraYear: input.eraYear,
      labeledSimulation: true,
      soulResurrectionClaim: false,
      status: 'rejected',
      reason: SOUL_CLAIM_REJECTED,
      createdAt: new Date().toISOString(),
    };
    store.personas.push(rejected);
    store.soulClaimAttempts.push({
      id: id('soul'),
      rejected: true,
      reason: SOUL_CLAIM_REJECTED,
      at: new Date().toISOString(),
    });
    await save(input.root, store);
    return rejected;
  }
  const persona: PersonaSimulation = {
    id: id('persona'),
    label: input.label,
    eraYear: input.eraYear,
    labeledSimulation: true,
    soulResurrectionClaim: false,
    status: 'labeled_simulation',
    reason: PERSONA_LABELED_SIMULATION,
    createdAt: new Date().toISOString(),
  };
  store.personas.push(persona);
  await save(input.root, store);
  return persona;
}

export async function rejectSoulResurrectionClaim(input: {
  label: string;
  eraYear: number;
  root: string;
  actor: CeActor;
}): Promise<{ rejected: true; reason: string; persona: PersonaSimulation }> {
  const persona = await createPersonaSimulation({
    label: input.label,
    eraYear: input.eraYear,
    claimSoulResurrection: true,
    root: input.root,
    actor: input.actor,
  });
  return { rejected: true, reason: SOUL_CLAIM_REJECTED, persona };
}
