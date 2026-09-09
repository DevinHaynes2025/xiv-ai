/**
 * 62L-CF Multi-Provider Intelligence Router — local + configured providers.
 * Circuit breakers; unconfigured → UNAVAILABLE (not fake success).
 * Sealed/local-only never silently routes to cloud.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CF_LOCKS,
  HONESTY_BANNER,
  PROVIDER_CIRCUIT_OPEN,
  SEALED_CLOUD_ROUTE_DENIED,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  type CfActor,
} from './data-refinery-compression-replication-types';

export type ProviderKind = 'local' | 'cloud' | 'edge';

export type IntelligenceProvider = {
  id: string;
  name: string;
  kind: ProviderKind;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'available' | 'unavailable' | 'circuit_open' | 'denied';
  failureCount: number;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type RouteDecision = {
  id: string;
  providerId: string | null;
  contentClass: 'open' | 'local_only' | 'sealed';
  accepted: boolean;
  reason: string;
  silentCloudFallback: false;
  at: string;
};

type Store = {
  providers: IntelligenceProvider[];
  routes: RouteDecision[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multi-provider-intelligence-router.json');
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

const CIRCUIT_THRESHOLD = 3;

export function routerHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CF_LOCKS.L4_AUTONOMY_ENABLED,
    localFirstRouting: CF_LOCKS.LOCAL_FIRST_ROUTING,
    sealedSilentCloudFallback: CF_LOCKS.SEALED_SILENT_CLOUD_FALLBACK,
    unconfiguredProviderAvailable: CF_LOCKS.UNCONFIGURED_PROVIDER_AVAILABLE,
    providerCircuitBreakers: CF_LOCKS.PROVIDER_CIRCUIT_BREAKERS,
  };
}

export async function registerIntelligenceProvider(input: {
  name: string;
  kind: ProviderKind;
  configured: boolean;
  authorized: boolean;
  verified?: boolean;
  root: string;
}): Promise<IntelligenceProvider> {
  const store = await load(input.root);
  const ok = input.configured && input.authorized;
  const now = new Date().toISOString();
  const provider: IntelligenceProvider = {
    id: id('iprov'),
    name: input.name,
    kind: input.kind,
    configured: input.configured === true,
    authorized: input.authorized === true,
    verified: input.verified === true,
    status: ok ? 'available' : 'unavailable',
    failureCount: 0,
    reason: ok
      ? 'AUTHORIZED_CONFIGURED_PROVIDER'
      : UNCONFIGURED_PROVIDER_UNAVAILABLE,
    createdAt: now,
    updatedAt: now,
  };
  store.providers.push(provider);
  await save(input.root, store);
  return provider;
}

export async function recordProviderFailure(input: {
  providerId: string;
  root: string;
}): Promise<IntelligenceProvider | null> {
  const store = await load(input.root);
  const provider = store.providers.find((p) => p.id === input.providerId);
  if (!provider) return null;
  provider.failureCount += 1;
  if (provider.failureCount >= CIRCUIT_THRESHOLD) {
    provider.status = 'circuit_open';
    provider.reason = PROVIDER_CIRCUIT_OPEN;
  }
  provider.updatedAt = new Date().toISOString();
  await save(input.root, store);
  return provider;
}

export async function routeIntelligence(input: {
  providerId?: string;
  contentClass: 'open' | 'local_only' | 'sealed';
  preferLocal?: boolean;
  root: string;
  actor: CfActor;
}): Promise<RouteDecision> {
  const store = await load(input.root);
  const preferLocal = input.preferLocal !== false;
  let provider =
    (input.providerId
      ? store.providers.find((p) => p.id === input.providerId)
      : undefined) ?? null;

  if (!provider && preferLocal) {
    provider =
      store.providers.find(
        (p) => p.kind === 'local' && p.status === 'available',
      ) ?? null;
  }

  const decision: RouteDecision = {
    id: id('route'),
    providerId: provider?.id ?? null,
    contentClass: input.contentClass,
    accepted: false,
    reason: UNCONFIGURED_PROVIDER_UNAVAILABLE,
    silentCloudFallback: false,
    at: new Date().toISOString(),
  };

  // Sealed / local-only must never go to cloud — no silent fallback.
  if (
    (input.contentClass === 'sealed' || input.contentClass === 'local_only') &&
    provider?.kind === 'cloud'
  ) {
    decision.accepted = false;
    decision.reason = SEALED_CLOUD_ROUTE_DENIED;
    store.routes.push(decision);
    await save(input.root, store);
    return decision;
  }

  if (!provider) {
    decision.accepted = false;
    decision.reason = UNCONFIGURED_PROVIDER_UNAVAILABLE;
    store.routes.push(decision);
    await save(input.root, store);
    return decision;
  }

  if (provider.status === 'circuit_open') {
    decision.accepted = false;
    decision.reason = PROVIDER_CIRCUIT_OPEN;
    store.routes.push(decision);
    await save(input.root, store);
    return decision;
  }

  if (provider.status !== 'available') {
    decision.accepted = false;
    decision.reason = provider.reason || UNCONFIGURED_PROVIDER_UNAVAILABLE;
    store.routes.push(decision);
    await save(input.root, store);
    return decision;
  }

  decision.accepted = true;
  decision.reason = 'ROUTED_TO_AVAILABLE_PROVIDER';
  store.routes.push(decision);
  await save(input.root, store);
  return decision;
}
