/**
 * 62L-DB Multi-Provider Model Gateway —
 * Local-first multi-provider model routing gateway.
 * Unconfigured providers → UNAVAILABLE.
 * Consensus-only output is never verified proof.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CONSENSUS_NOT_VERIFIED_PROOF,
  DB_LOCKS,
  HONESTY_BANNER,
  MAX_GATEWAY_PROVIDERS,
  SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  type DbActor,
  type MemoryContentClass,
  type ProviderKind,
} from './distributed-superbrain-runtime-mesh-types';

export type GatewayProvider = {
  id: string;
  kind: ProviderKind;
  name: string;
  configured: boolean;
  verified: boolean;
  localPreferred: true;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'LOCAL_PREFERRED';
  reason: string;
  createdAt: string;
};

export type GatewayRoute = {
  id: string;
  providerId: string | null;
  contentClass: MemoryContentClass;
  silentCloudFallback: boolean;
  consensusOnly: boolean;
  verifiedProof: false;
  status: 'ROUTED' | 'UNAVAILABLE' | 'DENIED' | 'LOCAL_PREFERRED' | 'CONSENSUS_ONLY';
  reason: string;
  at: string;
};

type Store = { providers: GatewayProvider[]; routes: GatewayRoute[] };

function storePath(root: string) {
  return xivLocalPath(root, 'multi-provider-model-gateway.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { providers: [], routes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function multiProviderModelGatewayHonesty() {
  return {
    banner: HONESTY_BANNER,
    localFirst: DB_LOCKS.LOCAL_FIRST,
    unconfiguredProviderAvailable: DB_LOCKS.UNCONFIGURED_PROVIDER_AVAILABLE,
    unconfiguredModelAvailable: DB_LOCKS.UNCONFIGURED_MODEL_AVAILABLE,
    consensusEqProof: DB_LOCKS.CONSENSUS_EQ_PROOF,
  };
}

export async function registerGatewayProvider(input: {
  kind: ProviderKind;
  name: string;
  configured?: boolean;
  verified?: boolean;
  root: string;
  actor: DbActor;
}): Promise<GatewayProvider> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.providers.length >= MAX_GATEWAY_PROVIDERS) {
    return {
      id: id('gprov'),
      kind: input.kind,
      name: input.name,
      configured: false,
      verified: false,
      localPreferred: true,
      status: 'UNAVAILABLE',
      reason: 'MAX_GATEWAY_PROVIDERS_BOUNDED',
      createdAt: now,
    };
  }
  const configured = input.configured === true;
  const verified = input.verified === true;
  const isLocal = input.kind === 'local_model';
  const ok = isLocal ? configured : configured && verified;
  const provider: GatewayProvider = {
    id: id('gprov'),
    kind: input.kind,
    name: input.name.trim() || input.kind,
    configured,
    verified: isLocal ? configured : verified,
    localPreferred: true,
    status: ok ? (isLocal ? 'LOCAL_PREFERRED' : 'AVAILABLE') : 'UNAVAILABLE',
    reason: ok
      ? isLocal
        ? 'LOCAL_MODEL_PREFERRED'
        : 'PROVIDER_CONFIGURED_VERIFIED'
      : UNCONFIGURED_PROVIDER_UNAVAILABLE,
    createdAt: now,
  };
  store.providers.push(provider);
  await save(input.root, store);
  return provider;
}

export async function routeGatewayRequest(input: {
  providerId?: string | null;
  preferLocal?: boolean;
  contentClass?: MemoryContentClass;
  silentCloudFallback?: boolean;
  consensusOnly?: boolean;
  root: string;
  actor: DbActor;
}): Promise<GatewayRoute> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const contentClass = input.contentClass ?? 'open';
  const silent = input.silentCloudFallback === true;
  const consensusOnly = input.consensusOnly === true;

  if (silent && (contentClass === 'sealed' || contentClass === 'raw_private')) {
    const route: GatewayRoute = {
      id: id('groute'),
      providerId: input.providerId ?? null,
      contentClass,
      silentCloudFallback: true,
      consensusOnly: false,
      verifiedProof: false,
      status: 'DENIED',
      reason: SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED,
      at: now,
    };
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  if (consensusOnly) {
    const route: GatewayRoute = {
      id: id('groute'),
      providerId: input.providerId ?? null,
      contentClass,
      silentCloudFallback: false,
      consensusOnly: true,
      verifiedProof: false,
      status: 'CONSENSUS_ONLY',
      reason: CONSENSUS_NOT_VERIFIED_PROOF,
      at: now,
    };
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  if (input.preferLocal !== false) {
    const local = store.providers.find(
      (p) => p.kind === 'local_model' && p.status !== 'UNAVAILABLE',
    );
    if (local) {
      const route: GatewayRoute = {
        id: id('groute'),
        providerId: local.id,
        contentClass,
        silentCloudFallback: false,
        consensusOnly: false,
        verifiedProof: false,
        status: 'LOCAL_PREFERRED',
        reason: 'LOCAL_FIRST_GATEWAY',
        at: now,
      };
      store.routes.push(route);
      await save(input.root, store);
      return route;
    }
  }

  const provider = input.providerId
    ? store.providers.find((p) => p.id === input.providerId)
    : store.providers.find((p) => p.kind !== 'local_model' && p.status === 'AVAILABLE');

  if (!provider || provider.status === 'UNAVAILABLE' || !provider.configured) {
    const route: GatewayRoute = {
      id: id('groute'),
      providerId: provider?.id ?? input.providerId ?? null,
      contentClass,
      silentCloudFallback: silent,
      consensusOnly: false,
      verifiedProof: false,
      status: 'UNAVAILABLE',
      reason: UNCONFIGURED_PROVIDER_UNAVAILABLE,
      at: now,
    };
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  const route: GatewayRoute = {
    id: id('groute'),
    providerId: provider.id,
    contentClass,
    silentCloudFallback: false,
    consensusOnly: false,
    verifiedProof: false,
    status: 'ROUTED',
    reason: 'GATEWAY_ROUTE_ACCEPTED',
    at: now,
  };
  store.routes.push(route);
  await save(input.root, store);
  return route;
}
