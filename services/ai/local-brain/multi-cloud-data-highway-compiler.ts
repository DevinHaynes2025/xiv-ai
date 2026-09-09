/**
 * 62L-CL Multi-Cloud Data Highway Compiler — compile authorized multi-cloud
 * data highways/routes (candidates; verified endpoints only).
 * Sealed content never silent-routes onto cloud highway.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CL_LOCKS,
  HONESTY_BANNER,
  SEALED_SILENT_CLOUD_HIGHWAY_DENIED,
  UNCONFIGURED_HIGHWAY_DENIED,
  type ClActor,
} from './global-knowledge-server-constellation-types';

export type CloudEndpoint = {
  id: string;
  provider: string;
  label: string;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'available' | 'unavailable' | 'denied';
  reason: string;
  createdAt: string;
};

export type HighwayCandidate = {
  id: string;
  name: string;
  endpointIds: string[];
  mode: 'open' | 'sealed' | 'local_only';
  status: 'candidate' | 'denied' | 'unavailable';
  reason: string;
  silentCloudFallback: false;
  productionAuthorized: false;
  createdAt: string;
};

export type HighwayRouteAttempt = {
  id: string;
  highwayId: string;
  contentClass: 'open' | 'sealed' | 'local_only';
  status: 'routed_candidate' | 'denied' | 'unavailable';
  reason: string;
  silentCloudFallback: false;
  at: string;
};

type Store = {
  endpoints: CloudEndpoint[];
  highways: HighwayCandidate[];
  routes: HighwayRouteAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multi-cloud-data-highway-compiler.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    endpoints: [],
    highways: [],
    routes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function highwayCompilerHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CL_LOCKS.L4_AUTONOMY_ENABLED,
    requiresConfigAuth: CL_LOCKS.HIGHWAY_REQUIRES_CONFIG_AUTH,
    unconfiguredAllowed: CL_LOCKS.HIGHWAY_UNCONFIGURED_ALLOWED,
    sealedSilentCloudHighway: CL_LOCKS.SEALED_SILENT_CLOUD_HIGHWAY,
  };
}

export async function registerCloudEndpoint(input: {
  provider: string;
  label: string;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  root: string;
  actor: ClActor;
}): Promise<CloudEndpoint> {
  const store = await load(input.root);
  const ready =
    input.configured === true &&
    input.authorized === true &&
    input.verified === true;
  const endpoint: CloudEndpoint = {
    id: id('cend'),
    provider: input.provider,
    label: input.label,
    configured: input.configured === true,
    authorized: input.authorized === true,
    verified: input.verified === true,
    status: ready ? 'available' : 'unavailable',
    reason: ready
      ? 'CLOUD_ENDPOINT_CONFIGURED_AUTHORIZED_VERIFIED'
      : UNCONFIGURED_HIGHWAY_DENIED,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.endpoints.push(endpoint);
  await save(input.root, store);
  return endpoint;
}

export async function compileDataHighway(input: {
  name: string;
  endpointIds: string[];
  mode?: 'open' | 'sealed' | 'local_only';
  root: string;
  actor: ClActor;
}): Promise<HighwayCandidate> {
  const store = await load(input.root);
  const mode = input.mode ?? 'open';
  void input.actor;

  if (mode === 'sealed' || mode === 'local_only') {
    // Sealed/local highways must not compile onto cloud endpoints.
    const cloudTargets = input.endpointIds
      .map((eid) => store.endpoints.find((e) => e.id === eid))
      .filter(Boolean);
    if (cloudTargets.length > 0) {
      const denied: HighwayCandidate = {
        id: id('hwy'),
        name: input.name,
        endpointIds: input.endpointIds,
        mode,
        status: 'denied',
        reason: SEALED_SILENT_CLOUD_HIGHWAY_DENIED,
        silentCloudFallback: false,
        productionAuthorized: false,
        createdAt: new Date().toISOString(),
      };
      store.highways.push(denied);
      await save(input.root, store);
      return denied;
    }
  }

  const endpoints = input.endpointIds.map((eid) =>
    store.endpoints.find((e) => e.id === eid),
  );
  const missing = endpoints.some((e) => !e);
  const unready = endpoints.some(
    (e) => !e || e.status !== 'available' || !e.configured || !e.authorized || !e.verified,
  );

  if (missing || unready || input.endpointIds.length === 0) {
    const denied: HighwayCandidate = {
      id: id('hwy'),
      name: input.name,
      endpointIds: input.endpointIds,
      mode,
      status: 'unavailable',
      reason: UNCONFIGURED_HIGHWAY_DENIED,
      silentCloudFallback: false,
      productionAuthorized: false,
      createdAt: new Date().toISOString(),
    };
    store.highways.push(denied);
    await save(input.root, store);
    return denied;
  }

  const candidate: HighwayCandidate = {
    id: id('hwy'),
    name: input.name,
    endpointIds: input.endpointIds,
    mode,
    status: 'candidate',
    reason: 'DATA_HIGHWAY_CANDIDATE_AUTHORIZED_ENDPOINTS_ONLY',
    silentCloudFallback: false,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  store.highways.push(candidate);
  await save(input.root, store);
  return candidate;
}

export async function routeContentOnHighway(input: {
  highwayId: string;
  contentClass: 'open' | 'sealed' | 'local_only';
  root: string;
  actor: ClActor;
}): Promise<HighwayRouteAttempt> {
  const store = await load(input.root);
  const highway = store.highways.find((h) => h.id === input.highwayId);
  void input.actor;

  if (!highway || highway.status !== 'candidate') {
    const attempt: HighwayRouteAttempt = {
      id: id('hroute'),
      highwayId: input.highwayId,
      contentClass: input.contentClass,
      status: 'unavailable',
      reason: UNCONFIGURED_HIGHWAY_DENIED,
      silentCloudFallback: false,
      at: new Date().toISOString(),
    };
    store.routes.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  if (
    (input.contentClass === 'sealed' || input.contentClass === 'local_only') &&
    highway.endpointIds.length > 0
  ) {
    const attempt: HighwayRouteAttempt = {
      id: id('hroute'),
      highwayId: highway.id,
      contentClass: input.contentClass,
      status: 'denied',
      reason: SEALED_SILENT_CLOUD_HIGHWAY_DENIED,
      silentCloudFallback: false,
      at: new Date().toISOString(),
    };
    store.routes.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const attempt: HighwayRouteAttempt = {
    id: id('hroute'),
    highwayId: highway.id,
    contentClass: input.contentClass,
    status: 'routed_candidate',
    reason: 'HIGHWAY_ROUTE_CANDIDATE_NOT_PRODUCTION_AUTHORIZED',
    silentCloudFallback: false,
    at: new Date().toISOString(),
  };
  store.routes.push(attempt);
  await save(input.root, store);
  return attempt;
}
