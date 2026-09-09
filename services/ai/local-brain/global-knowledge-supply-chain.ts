/**
 * 62L-CP Global Knowledge Supply Chain — governed intake of knowledge +
 * plugins/tools into Superbrain ecosystems. Registration ≠ authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CP_LOCKS,
  HONESTY_BANNER,
  REGISTRATION_NO_AUTHORITY,
  type CpActor,
} from './knowledge-supply-plugin-foundry-types';

export type SupplyChainRecord = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  name: string;
  coexistenceWithSuperbrain: true;
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  assetIds: string[];
  createdAt: string;
};

export type SupplyAssetKind = 'knowledge_pack' | 'plugin' | 'tool' | 'ai_service';

export type SupplyAsset = {
  id: string;
  chainId: string;
  kind: SupplyAssetKind;
  name: string;
  capabilityTag: string;
  registered: boolean;
  approved: boolean;
  grantsAuthority: false;
  grantsCredentials: false;
  grantsBilling: false;
  grantsDeployment: false;
  grantsBroaderDataAccess: false;
  status: 'registered' | 'denied' | 'candidate';
  reason: string;
  createdAt: string;
};

type Store = {
  chains: SupplyChainRecord[];
  assets: SupplyAsset[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-knowledge-supply-chain.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { chains: [], assets: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function supplyChainHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CP_LOCKS.L4_AUTONOMY_ENABLED,
    registrationGrantsAuthority: CP_LOCKS.REGISTRATION_GRANTS_AUTHORITY,
    registrationGrantsCredentials: CP_LOCKS.REGISTRATION_GRANTS_CREDENTIALS,
    registrationGrantsBilling: CP_LOCKS.REGISTRATION_GRANTS_BILLING,
    registrationGrantsDeployment: CP_LOCKS.REGISTRATION_GRANTS_DEPLOYMENT,
    registrationGrantsBroaderDataAccess: CP_LOCKS.REGISTRATION_GRANTS_BROADER_DATA_ACCESS,
    localFirst: CP_LOCKS.LOCAL_FIRST,
  };
}

export async function bootstrapKnowledgeSupplyChain(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  name?: string;
  root: string;
  actor: CpActor;
}): Promise<SupplyChainRecord> {
  const store = await load(input.root);
  const record: SupplyChainRecord = {
    id: id('gksc'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    name: input.name?.trim() || 'XIV Global Knowledge Supply Chain',
    coexistenceWithSuperbrain: true,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    assetIds: [],
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.chains.push(record);
  await save(input.root, store);
  return record;
}

export async function registerSupplyAsset(input: {
  chainId: string;
  kind: SupplyAssetKind;
  name: string;
  capabilityTag: string;
  root: string;
  actor: CpActor;
}): Promise<SupplyAsset> {
  const store = await load(input.root);
  const chain = store.chains.find((c) => c.id === input.chainId);
  const asset: SupplyAsset = {
    id: id('sasset'),
    chainId: input.chainId,
    kind: input.kind,
    name: input.name.trim(),
    capabilityTag: input.capabilityTag.trim().toLowerCase(),
    registered: true,
    approved: false,
    grantsAuthority: false,
    grantsCredentials: false,
    grantsBilling: false,
    grantsDeployment: false,
    grantsBroaderDataAccess: false,
    status: 'registered',
    reason: REGISTRATION_NO_AUTHORITY,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.assets.push(asset);
  if (chain) chain.assetIds.push(asset.id);
  await save(input.root, store);
  return asset;
}

export async function inspectRegistrationGrants(input: {
  assetId: string;
  root: string;
  actor: CpActor;
}): Promise<{
  status: 'denied' | 'bounded';
  authority: false;
  credentials: false;
  billing: false;
  deployment: false;
  broaderDataAccess: false;
  reason: string;
}> {
  const store = await load(input.root);
  const asset = store.assets.find((a) => a.id === input.assetId);
  void input.actor;
  if (!asset) {
    return {
      status: 'denied',
      authority: false,
      credentials: false,
      billing: false,
      deployment: false,
      broaderDataAccess: false,
      reason: 'SUPPLY_ASSET_NOT_FOUND',
    };
  }
  return {
    status: 'bounded',
    authority: false,
    credentials: false,
    billing: false,
    deployment: false,
    broaderDataAccess: false,
    reason: REGISTRATION_NO_AUTHORITY,
  };
}
