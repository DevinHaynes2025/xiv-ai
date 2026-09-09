/**
 * 62L-CH Knowledge Civilization OS — OS-layer façade for civilization knowledge
 * + departments under Superbrain coexistence. Not production authorization.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CH_LOCKS,
  DEPARTMENT_KEYS,
  HONESTY_BANNER,
  SOUL_CLAIM_REJECTED,
  type ChActor,
  type DepartmentKey,
} from './knowledge-civilization-dept-universities-types';

export type CivilizationDepartmentSlot = {
  key: DepartmentKey;
  enrolled: boolean;
  status: 'available' | 'documented' | 'bounded';
};

export type KnowledgeCivilizationOsRecord = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  name: string;
  coexistenceWithSuperbrain: true;
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  departments: CivilizationDepartmentSlot[];
  createdAt: string;
};

export type SoulClaimDenial = {
  id: string;
  denied: true;
  reason: string;
  at: string;
};

type Store = {
  civilizations: KnowledgeCivilizationOsRecord[];
  soulDenials: SoulClaimDenial[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'knowledge-civilization-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { civilizations: [], soulDenials: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function civilizationOsHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CH_LOCKS.L4_AUTONOMY_ENABLED,
    soulResurrectionClaims: CH_LOCKS.SOUL_RESURRECTION_CLAIMS,
    founderSealedDenyByDefault: CH_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    learningIsPermission: CH_LOCKS.LEARNING_IS_PERMISSION,
    productionAuthorization: CH_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function bootstrapKnowledgeCivilizationOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  name?: string;
  root: string;
  actor: ChActor;
}): Promise<KnowledgeCivilizationOsRecord> {
  const store = await load(input.root);
  const record: KnowledgeCivilizationOsRecord = {
    id: id('kcos'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    name: input.name?.trim() || 'XIV Knowledge Civilization OS',
    coexistenceWithSuperbrain: true,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    departments: DEPARTMENT_KEYS.map((key) => ({
      key,
      enrolled: false,
      status: 'bounded' as const,
    })),
    createdAt: new Date().toISOString(),
  };
  store.civilizations.push(record);
  await save(input.root, store);
  return record;
}

export async function enrollDepartmentInCivilization(input: {
  civilizationId: string;
  department: DepartmentKey;
  root: string;
  actor: ChActor;
}): Promise<{ accepted: boolean; reason: string; civilization: KnowledgeCivilizationOsRecord | null }> {
  const store = await load(input.root);
  const civ = store.civilizations.find((c) => c.id === input.civilizationId);
  if (!civ) {
    return { accepted: false, reason: 'CIVILIZATION_NOT_FOUND', civilization: null };
  }
  const slot = civ.departments.find((d) => d.key === input.department);
  if (!slot) {
    return { accepted: false, reason: 'DEPARTMENT_UNKNOWN', civilization: null };
  }
  slot.enrolled = true;
  slot.status = 'available';
  await save(input.root, store);
  return { accepted: true, reason: 'DEPARTMENT_ENROLLED_BOUNDED', civilization: civ };
}

export async function rejectSoulResurrectionClaim(input: {
  claim: string;
  root: string;
  actor: ChActor;
}): Promise<SoulClaimDenial> {
  const store = await load(input.root);
  const denial: SoulClaimDenial = {
    id: id('soul'),
    denied: true,
    reason: SOUL_CLAIM_REJECTED,
    at: new Date().toISOString(),
  };
  void input.claim;
  void input.actor;
  store.soulDenials.push(denial);
  await save(input.root, store);
  return denial;
}
