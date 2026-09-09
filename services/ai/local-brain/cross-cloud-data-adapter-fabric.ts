/**
 * 62L-DP Cross-Cloud Data Adapter Fabric —
 * Cloud/data adapters: configured + authorized + verified only.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_ADAPTERS,
  PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED,
  UNVERIFIED_SEALED_DATA_DENIED,
  type DpActor,
} from './plugin-civilization-os-types';

export type CloudAdapter = {
  id: string;
  name: string;
  provider: string;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'available' | 'unavailable' | 'denied';
  reason: string;
  createdAt: string;
};

export type AdapterRoute = {
  id: string;
  adapterId: string;
  sealedData: boolean;
  status: 'allowed' | 'denied' | 'unavailable';
  reason: string;
  at: string;
};

type Store = {
  adapters: CloudAdapter[];
  routes: AdapterRoute[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'cross-cloud-data-adapter-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { adapters: [], routes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function crossCloudDataAdapterFabricHonesty() {
  return {
    requiresConfiguredAuthorizedVerified: true,
    sealedSilentRoute: false,
    liveSupabaseApply: false,
  };
}

export async function registerCloudAdapter(input: {
  name: string;
  provider: string;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  root: string;
  actor: DpActor;
}): Promise<CloudAdapter> {
  const store = await load(input.root);
  void input.actor;
  if (store.adapters.length >= MAX_ADAPTERS) throw new Error('MAX_ADAPTERS_REACHED');
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;
  const ok = configured && authorized && verified;
  const adapter: CloudAdapter = {
    id: id('dpadapt'),
    name: input.name.trim(),
    provider: input.provider.trim(),
    configured,
    authorized,
    verified,
    status: ok ? 'available' : 'unavailable',
    reason: ok
      ? 'ADAPTER_CONFIGURED_AUTHORIZED_VERIFIED'
      : PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED,
    createdAt: new Date().toISOString(),
  };
  store.adapters.push(adapter);
  await save(input.root, store);
  return adapter;
}

export async function routeViaAdapter(input: {
  adapterId: string;
  sealedData?: boolean;
  root: string;
  actor: DpActor;
}): Promise<AdapterRoute> {
  const store = await load(input.root);
  void input.actor;
  const adapter = store.adapters.find((a) => a.id === input.adapterId);
  const sealed = input.sealedData === true;
  const now = new Date().toISOString();

  if (!adapter || adapter.status !== 'available' || !adapter.verified) {
    const route: AdapterRoute = {
      id: id('dproute'),
      adapterId: input.adapterId,
      sealedData: sealed,
      status: !adapter ? 'unavailable' : 'denied',
      reason: sealed ? UNVERIFIED_SEALED_DATA_DENIED : PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED,
      at: now,
    };
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  if (sealed && !adapter.verified) {
    const route: AdapterRoute = {
      id: id('dproute'),
      adapterId: adapter.id,
      sealedData: true,
      status: 'denied',
      reason: UNVERIFIED_SEALED_DATA_DENIED,
      at: now,
    };
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  const route: AdapterRoute = {
    id: id('dproute'),
    adapterId: adapter.id,
    sealedData: sealed,
    status: 'allowed',
    reason: 'ADAPTER_ROUTE_ALLOWED',
    at: now,
  };
  store.routes.push(route);
  await save(input.root, store);
  return route;
}
