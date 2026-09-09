/**
 * 62L-DC Agent Department API Mesh —
 * Department API mesh contracts/gateways.
 * Cannot bypass sealed/auth scopes. Fabric formalizes boundaries —
 * not production public exposure without gates.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  API_MESH_SEALED_AUTH_BYPASS_DENIED,
  DC_LOCKS,
  HONESTY_BANNER,
  MAX_API_MESH_CALLS,
  type AuthScope,
  type DcActor,
} from './superbrain-service-fabric-types';

export type ApiMeshGateway = {
  id: string;
  departmentId: string;
  contractId: string;
  requiredScope: AuthScope;
  publicExposureAuthorized: false;
  createdAt: string;
};

export type ApiMeshCall = {
  id: string;
  gatewayId: string;
  requestedScope: AuthScope;
  attemptBypassSealedAuth: boolean;
  status: 'ALLOWED' | 'DENIED' | 'REJECTED';
  reason: string;
  at: string;
};

export type ApiMeshResult = {
  accepted: boolean;
  reason: string;
  gateway?: ApiMeshGateway;
  call?: ApiMeshCall;
  at: string;
};

type Store = {
  gateways: ApiMeshGateway[];
  calls: ApiMeshCall[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-department-api-mesh.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { gateways: [], calls: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const SCOPE_RANK: Record<AuthScope, number> = {
  public_gated: 0,
  org_internal: 1,
  sealed: 2,
  founder_sealed: 3,
  raw_private: 4,
};

export function agentDepartmentApiMeshHonesty() {
  return {
    banner: HONESTY_BANNER,
    bypassSealedAuth: DC_LOCKS.API_MESH_BYPASS_SEALED_AUTH,
    publicExposureWithoutGates: DC_LOCKS.SERVICE_FABRIC_PUBLIC_EXPOSURE_WITHOUT_GATES,
    productionAuthorization: DC_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function registerDepartmentApiGateway(input: {
  departmentId: string;
  contractId: string;
  requiredScope: AuthScope;
  root: string;
  actor: DcActor;
}): Promise<ApiMeshResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const gateway: ApiMeshGateway = {
    id: id('adam'),
    departmentId: input.departmentId.trim(),
    contractId: input.contractId.trim(),
    requiredScope: input.requiredScope,
    publicExposureAuthorized: false,
    createdAt: now,
  };
  store.gateways.push(gateway);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'DEPARTMENT_API_GATEWAY_REGISTERED_NO_PUBLIC_EXPOSURE',
    gateway,
    at: now,
  };
}

export async function invokeDepartmentApiMesh(input: {
  gatewayId: string;
  requestedScope: AuthScope;
  attemptBypassSealedAuth?: boolean;
  root: string;
  actor: DcActor;
}): Promise<ApiMeshResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.calls.length >= MAX_API_MESH_CALLS) {
    return { accepted: false, reason: 'MAX_API_MESH_CALLS_BOUNDED', at: now };
  }

  const gateway = store.gateways.find((g) => g.id === input.gatewayId);
  if (!gateway) {
    return { accepted: false, reason: 'API_MESH_GATEWAY_NOT_FOUND', at: now };
  }

  const bypass = input.attemptBypassSealedAuth === true;
  const sealedOrHigher =
    gateway.requiredScope === 'sealed' ||
    gateway.requiredScope === 'founder_sealed' ||
    gateway.requiredScope === 'raw_private';

  if (bypass && sealedOrHigher) {
    const call: ApiMeshCall = {
      id: id('call'),
      gatewayId: gateway.id,
      requestedScope: input.requestedScope,
      attemptBypassSealedAuth: true,
      status: 'DENIED',
      reason: API_MESH_SEALED_AUTH_BYPASS_DENIED,
      at: now,
    };
    store.calls.push(call);
    await save(input.root, store);
    return { accepted: false, reason: call.reason, gateway, call, at: now };
  }

  if (SCOPE_RANK[input.requestedScope] < SCOPE_RANK[gateway.requiredScope]) {
    const call: ApiMeshCall = {
      id: id('call'),
      gatewayId: gateway.id,
      requestedScope: input.requestedScope,
      attemptBypassSealedAuth: bypass,
      status: 'DENIED',
      reason: API_MESH_SEALED_AUTH_BYPASS_DENIED,
      at: now,
    };
    store.calls.push(call);
    await save(input.root, store);
    return { accepted: false, reason: call.reason, gateway, call, at: now };
  }

  const call: ApiMeshCall = {
    id: id('call'),
    gatewayId: gateway.id,
    requestedScope: input.requestedScope,
    attemptBypassSealedAuth: false,
    status: 'ALLOWED',
    reason: 'API_MESH_CALL_WITHIN_AUTH_SCOPE_NO_PUBLIC_EXPOSURE',
    at: now,
  };
  store.calls.push(call);
  await save(input.root, store);
  return { accepted: true, reason: call.reason, gateway, call, at: now };
}
