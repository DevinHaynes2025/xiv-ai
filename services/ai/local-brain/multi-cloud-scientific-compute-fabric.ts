/**
 * 62L-CU Multi-Cloud Scientific Compute Fabric — local/AWS/GCP scientific
 * compute routing with verification honesty. Local-first; unconfigured →
 * UNAVAILABLE; sealed never silent cloud fallback.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CU_LOCKS,
  HONESTY_BANNER,
  SEALED_SILENT_CLOUD_COMPUTE_DENIED,
  UNCONFIGURED_COMPUTE_UNAVAILABLE,
  type CuActor,
} from './cognitive-research-cloud-types';

export type ComputeProvider = 'local' | 'aws' | 'gcp';

export type ScientificComputeEndpoint = {
  id: string;
  provider: ComputeProvider;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type ComputeRouteAttempt = {
  id: string;
  provider: ComputeProvider;
  contentMode: 'open' | 'sealed' | 'local_only';
  silentFallbackRequested: boolean;
  status: 'allowed' | 'denied' | 'unavailable';
  reason: string;
  at: string;
};

type Store = {
  endpoints: ScientificComputeEndpoint[];
  routes: ComputeRouteAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multi-cloud-scientific-compute-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { endpoints: [], routes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function multiCloudScientificComputeHonesty() {
  return {
    banner: HONESTY_BANNER,
    localFirst: CU_LOCKS.SCIENTIFIC_COMPUTE_LOCAL_FIRST,
    awsGcpRequiresCav: CU_LOCKS.AWS_GCP_REQUIRES_CONFIGURED_AUTHORIZED_VERIFIED,
    unconfiguredAvailable: CU_LOCKS.UNCONFIGURED_AWS_GCP_AVAILABLE,
    sealedSilentCloud: CU_LOCKS.SEALED_SILENT_CLOUD_COMPUTE_FALLBACK,
  };
}

export async function registerScientificComputeEndpoint(input: {
  provider: ComputeProvider;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  root: string;
  actor: CuActor;
}): Promise<ScientificComputeEndpoint> {
  const store = await load(input.root);
  void input.actor;
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;

  let status: ScientificComputeEndpoint['status'] = 'UNAVAILABLE';
  let reason = UNCONFIGURED_COMPUTE_UNAVAILABLE;

  if (input.provider === 'local') {
    // Local-first preferred path — available when explicitly configured.
    if (configured) {
      status = 'AVAILABLE';
      reason = 'LOCAL_SCIENTIFIC_COMPUTE_PREFERRED';
    } else {
      status = 'UNAVAILABLE';
      reason = 'LOCAL_SCIENTIFIC_COMPUTE_NOT_CONFIGURED';
    }
  } else if (configured && authorized && verified) {
    status = 'AVAILABLE';
    reason = 'AWS_GCP_SCIENTIFIC_COMPUTE_CONFIGURED_AUTHORIZED_VERIFIED';
  }

  const endpoint: ScientificComputeEndpoint = {
    id: id('sce'),
    provider: input.provider,
    configured,
    authorized,
    verified,
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.endpoints.push(endpoint);
  await save(input.root, store);
  return endpoint;
}

export async function routeScientificCompute(input: {
  provider: ComputeProvider;
  contentMode: 'open' | 'sealed' | 'local_only';
  silentFallbackRequested?: boolean;
  endpointId?: string;
  root: string;
  actor: CuActor;
}): Promise<ComputeRouteAttempt> {
  const store = await load(input.root);
  void input.actor;
  const silent = input.silentFallbackRequested === true;
  const sealedOrLocal =
    input.contentMode === 'sealed' || input.contentMode === 'local_only';

  let status: ComputeRouteAttempt['status'] = 'denied';
  let reason = SEALED_SILENT_CLOUD_COMPUTE_DENIED;

  if (sealedOrLocal && (input.provider === 'aws' || input.provider === 'gcp')) {
    status = 'denied';
    reason = SEALED_SILENT_CLOUD_COMPUTE_DENIED;
  } else if (silent && (input.provider === 'aws' || input.provider === 'gcp')) {
    status = 'denied';
    reason = SEALED_SILENT_CLOUD_COMPUTE_DENIED;
  } else if (input.provider === 'local') {
    const local = store.endpoints.find(
      (e) =>
        e.provider === 'local' &&
        e.status === 'AVAILABLE' &&
        (input.endpointId ? e.id === input.endpointId : true),
    );
    if (local) {
      status = 'allowed';
      reason = 'LOCAL_FIRST_SCIENTIFIC_COMPUTE_ROUTE';
    } else {
      status = 'unavailable';
      reason = 'LOCAL_SCIENTIFIC_COMPUTE_NOT_CONFIGURED';
    }
  } else {
    const ep = store.endpoints.find(
      (e) =>
        e.provider === input.provider &&
        e.status === 'AVAILABLE' &&
        e.configured &&
        e.authorized &&
        e.verified &&
        (input.endpointId ? e.id === input.endpointId : true),
    );
    if (!ep) {
      status = 'unavailable';
      reason = UNCONFIGURED_COMPUTE_UNAVAILABLE;
    } else if (input.contentMode === 'open') {
      status = 'allowed';
      reason = 'OPEN_WORKLOAD_ROUTED_TO_CONFIGURED_AUTHORIZED_VERIFIED_CLOUD';
    } else {
      status = 'denied';
      reason = SEALED_SILENT_CLOUD_COMPUTE_DENIED;
    }
  }

  const attempt: ComputeRouteAttempt = {
    id: id('scroute'),
    provider: input.provider,
    contentMode: input.contentMode,
    silentFallbackRequested: silent,
    status,
    reason,
    at: new Date().toISOString(),
  };
  store.routes.push(attempt);
  await save(input.root, store);
  return attempt;
}
