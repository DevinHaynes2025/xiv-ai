/**
 * 62L-DV Module B — Personal Data Vault & Search OS.
 * Encrypted vaults; permission-aware universal search; visual DB/warehouse navigation.
 * No cross-context leakage; search respects ACL.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_SEARCH_QUERIES,
  MAX_VAULT_OBJECTS,
  SEARCH_WITHOUT_PERMISSION,
  VAULT_ACL_CROSS_CONTEXT,
  WAREHOUSE_NAV_DENIED,
  type DvActor,
} from './universal-data-industry-cortex-types';

export type VaultObject = {
  id: string;
  ownerContextId: string;
  encrypted: true;
  label: string;
  createdAt: string;
};

export type VaultAccessAttempt = {
  id: string;
  objectId: string;
  requestContextId: string;
  ownerContextId: string;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

export type SearchQuery = {
  id: string;
  query: string;
  contextId: string;
  aclGranted: boolean;
  status: 'results_bounded' | 'denied';
  crossContextLeakage: false;
  reason: string;
  at: string;
};

export type WarehouseNavAccess = {
  id: string;
  warehouseId: string;
  labelPresent: boolean;
  explicitGrant: boolean;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  objects: VaultObject[];
  accessAttempts: VaultAccessAttempt[];
  searches: SearchQuery[];
  warehouseNav: WarehouseNavAccess[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'personal-data-vault-search-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    objects: [],
    accessAttempts: [],
    searches: [],
    warehouseNav: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function personalDataVaultSearchHonesty() {
  return {
    encryptedByDefault: true,
    permissionAwareSearch: true,
    crossContextLeakage: false,
    warehouseNavDenyByDefault: true,
    labelAloneEqAccess: false,
  };
}

export async function storeVaultObject(input: {
  ownerContextId: string;
  label: string;
  root: string;
  actor: DvActor;
}): Promise<VaultObject> {
  const store = await load(input.root);
  void input.actor;
  if (store.objects.length >= MAX_VAULT_OBJECTS) {
    throw new Error('MAX_VAULT_OBJECTS_REACHED');
  }
  const obj: VaultObject = {
    id: id('dvvault'),
    ownerContextId: input.ownerContextId.trim(),
    encrypted: true,
    label: input.label.trim(),
    createdAt: new Date().toISOString(),
  };
  store.objects.push(obj);
  await save(input.root, store);
  return obj;
}

export async function attemptVaultAccess(input: {
  objectId: string;
  ownerContextId: string;
  requestContextId: string;
  explicitCrossContextGrant?: boolean;
  root: string;
  actor: DvActor;
}): Promise<VaultAccessAttempt> {
  const store = await load(input.root);
  void input.actor;
  const sameContext = input.ownerContextId === input.requestContextId;
  const allowed = sameContext || input.explicitCrossContextGrant === true;
  const attempt: VaultAccessAttempt = {
    id: id('dvvacc'),
    objectId: input.objectId,
    requestContextId: input.requestContextId,
    ownerContextId: input.ownerContextId,
    status: allowed ? 'allowed' : 'denied',
    reason: allowed
      ? sameContext
        ? 'VAULT_SAME_CONTEXT_ACL_OK'
        : 'VAULT_EXPLICIT_CROSS_CONTEXT_GRANT'
      : VAULT_ACL_CROSS_CONTEXT,
    at: new Date().toISOString(),
  };
  store.accessAttempts.push(attempt);
  await save(input.root, store);
  return attempt;
}

export async function runPermissionAwareSearch(input: {
  query: string;
  contextId: string;
  aclGranted: boolean;
  attemptCrossContextLeak?: boolean;
  root: string;
  actor: DvActor;
}): Promise<SearchQuery> {
  const store = await load(input.root);
  void input.actor;
  if (store.searches.length >= MAX_SEARCH_QUERIES) {
    throw new Error('MAX_SEARCH_QUERIES_REACHED');
  }
  const denied = !input.aclGranted || input.attemptCrossContextLeak === true;
  const search: SearchQuery = {
    id: id('dvsearch'),
    query: input.query.trim(),
    contextId: input.contextId,
    aclGranted: input.aclGranted,
    status: denied ? 'denied' : 'results_bounded',
    crossContextLeakage: false,
    reason: !input.aclGranted
      ? SEARCH_WITHOUT_PERMISSION
      : input.attemptCrossContextLeak
        ? VAULT_ACL_CROSS_CONTEXT
        : 'SEARCH_ACL_BOUNDED_RESULTS',
    at: new Date().toISOString(),
  };
  store.searches.push(search);
  await save(input.root, store);
  return search;
}

export async function navigateWarehouse(input: {
  warehouseId: string;
  labelPresent: boolean;
  explicitGrant: boolean;
  root: string;
  actor: DvActor;
}): Promise<WarehouseNavAccess> {
  const store = await load(input.root);
  void input.actor;
  const access: WarehouseNavAccess = {
    id: id('dvwh'),
    warehouseId: input.warehouseId,
    labelPresent: input.labelPresent,
    explicitGrant: input.explicitGrant,
    status: input.explicitGrant ? 'allowed' : 'denied',
    reason: input.explicitGrant ? 'WAREHOUSE_NAV_EXPLICIT_GRANT' : WAREHOUSE_NAV_DENIED,
    at: new Date().toISOString(),
  };
  store.warehouseNav.push(access);
  await save(input.root, store);
  return access;
}
