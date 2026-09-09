import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BK_LOCKS,
  SPECIALIZED_COEXISTENCE_BRANCHES,
  SWALLOW_DENIED,
  type SpecializedBranchId,
} from './superbrain-coexistence-types';

export const COEXISTENCE_REGISTRY_FILE = 'superbrain-coexistence-registry.json';

export type CoexistenceBranchRecord = {
  id: SpecializedBranchId;
  registeredAt: string;
  status: 'REGISTERED' | 'ACTIVE' | 'QUIESCED';
  swallowed: false;
  deleted: false;
  adapterOnly: true;
  note: string;
};

export type CoexistenceRegistry = {
  root: 'global_operations_brain_superbrain';
  rootDeclaredAt: string;
  swallowSpecializedBranches: false;
  branches: CoexistenceBranchRecord[];
  denyEvents: Array<{
    id: string;
    at: string;
    reason: string;
    attemptedBranchId?: SpecializedBranchId;
    action: 'swallow' | 'delete' | 'mega_merge';
  }>;
};

function registryPath(root: string) {
  return xivLocalPath(root, COEXISTENCE_REGISTRY_FILE);
}

async function load(root: string): Promise<CoexistenceRegistry | null> {
  const parsed = await readJsonFile<CoexistenceRegistry | null>(registryPath(root), null);
  return parsed;
}

async function save(root: string, registry: CoexistenceRegistry) {
  await writeJsonFileAtomic(registryPath(root), registry);
}

/**
 * Declare Superbrain as root. Specialized systems remain coexisting branches —
 * never forced into one code blob.
 */
export async function declareSuperbrainRoot(root: string): Promise<CoexistenceRegistry> {
  const existing = await load(root);
  if (existing) return existing;
  const registry: CoexistenceRegistry = {
    root: 'global_operations_brain_superbrain',
    rootDeclaredAt: new Date().toISOString(),
    swallowSpecializedBranches: false,
    branches: [],
    denyEvents: [],
  };
  await save(root, registry);
  return registry;
}

export async function registerSpecializedBranch(
  root: string,
  branchId: SpecializedBranchId,
  note = 'Registered as coexistence adapter under Superbrain root; not swallowed.',
): Promise<{
  accepted: boolean;
  record?: CoexistenceBranchRecord;
  reason: string;
  registry: CoexistenceRegistry;
}> {
  const registry = (await declareSuperbrainRoot(root))!;
  if (!SPECIALIZED_COEXISTENCE_BRANCHES.includes(branchId)) {
    return {
      accepted: false,
      reason: `Unknown specialized branch: ${branchId}`,
      registry,
    };
  }
  const already = registry.branches.find((b) => b.id === branchId);
  if (already) {
    return {
      accepted: true,
      record: already,
      reason: 'Branch already registered; coexistence preserved (not deleted/swallowed).',
      registry,
    };
  }
  const record: CoexistenceBranchRecord = {
    id: branchId,
    registeredAt: new Date().toISOString(),
    status: 'REGISTERED',
    swallowed: false,
    deleted: false,
    adapterOnly: true,
    note,
  };
  registry.branches.push(record);
  await save(root, registry);
  return {
    accepted: true,
    record,
    reason: 'Specialized branch registered under Superbrain coexistence fabric.',
    registry,
  };
}

/**
 * Hard deny: specialized branches must not be swallowed or deleted via fabric.
 */
export async function attemptSwallowSpecializedBranch(
  root: string,
  branchId: SpecializedBranchId,
): Promise<{
  denied: true;
  reason: typeof SWALLOW_DENIED;
  swallowed: false;
  deleted: false;
  stillRegistered: boolean;
}> {
  const registry = await declareSuperbrainRoot(root);
  registry.denyEvents.push({
    id: randomUUID(),
    at: new Date().toISOString(),
    reason: SWALLOW_DENIED,
    attemptedBranchId: branchId,
    action: 'swallow',
  });
  // Ensure branch remains if previously registered
  const existing = registry.branches.find((b) => b.id === branchId);
  if (existing) {
    existing.swallowed = false;
    existing.deleted = false;
    existing.status = existing.status === 'QUIESCED' ? 'REGISTERED' : existing.status;
  }
  await save(root, registry);
  return {
    denied: true,
    reason: SWALLOW_DENIED,
    swallowed: false,
    deleted: false,
    stillRegistered: Boolean(existing),
  };
}

export async function listCoexistenceBranches(root: string): Promise<CoexistenceBranchRecord[]> {
  const registry = await declareSuperbrainRoot(root);
  return [...registry.branches];
}

export function coexistenceHonesty() {
  return {
    locks: BK_LOCKS,
    swallowSpecializedBranches: BK_LOCKS.SWALLOW_SPECIALIZED_BRANCHES,
    tipLand: BK_LOCKS.TIP_LAND,
    productionAuthorization: BK_LOCKS.PRODUCTION_AUTHORIZATION,
    root: 'global_operations_brain_superbrain' as const,
  };
}

export function defaultSpecializedBranchSet(): SpecializedBranchId[] {
  return [...SPECIALIZED_COEXISTENCE_BRANCHES];
}
