/**
 * 62L-DO Zero-Trust Data Highway —
 * Extends DL/DM transit patterns; sealed never silent route;
 * no raw private pooling by default.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DO_LOCKS,
  HONESTY_BANNER,
  MAX_HIGHWAY_ROUTES,
  SEALED_SILENT_ROUTE_DENIED,
  type DoActor,
} from './distributed-cognitive-runtime-plugin-mesh-types';

export type ZeroTrustRoute = {
  id: string;
  fromNode: string;
  toNode: string;
  sealed: boolean;
  silent: boolean;
  authorized: boolean;
  rawPrivatePooling: boolean;
  status: 'allowed' | 'denied';
  reason: string;
  createdAt: string;
};

type Store = {
  routes: ZeroTrustRoute[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'zero-trust-data-highway.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { routes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function zeroTrustDataHighwayHonesty() {
  return {
    banner: HONESTY_BANNER,
    sealedSilentRoute: DO_LOCKS.SEALED_SILENT_ROUTE,
    sealedNeverSilent: DO_LOCKS.ZERO_TRUST_SEALED_NEVER_SILENT,
    rawPrivatePoolingByDefault: DO_LOCKS.RAW_PRIVATE_POOLING_BY_DEFAULT,
  };
}

export async function openZeroTrustRoute(input: {
  fromNode: string;
  toNode: string;
  sealed?: boolean;
  silent?: boolean;
  authorized?: boolean;
  rawPrivatePooling?: boolean;
  root: string;
  actor: DoActor;
}): Promise<ZeroTrustRoute> {
  const store = await load(input.root);
  void input.actor;
  if (store.routes.length >= MAX_HIGHWAY_ROUTES) {
    throw new Error('MAX_HIGHWAY_ROUTES_REACHED');
  }

  const sealed = input.sealed === true;
  const silent = input.silent === true;
  const authorized = input.authorized === true;
  const rawPrivatePooling = input.rawPrivatePooling === true;

  let status: 'allowed' | 'denied' = 'allowed';
  let reason = 'ZERO_TRUST_ROUTE_ALLOWED_EXPLICIT';

  if (sealed && silent) {
    status = 'denied';
    reason = SEALED_SILENT_ROUTE_DENIED;
  } else if (rawPrivatePooling) {
    status = 'denied';
    reason = 'RAW_PRIVATE_POOLING_DENIED_BY_DEFAULT';
  } else if (!authorized) {
    status = 'denied';
    reason = 'ZERO_TRUST_ROUTE_REQUIRES_AUTHORIZATION';
  }

  const route: ZeroTrustRoute = {
    id: id('dozth'),
    fromNode: input.fromNode.trim(),
    toNode: input.toNode.trim(),
    sealed,
    silent,
    authorized,
    rawPrivatePooling,
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.routes.push(route);
  await save(input.root, store);
  return route;
}
