/**
 * 62L-DB Agent Department Microservices —
 * Bounded department microservice contracts over DA department OS.
 * Microservices cannot self-escalate production authority.
 * Heartbeat truth; WAITING_NODE / OFFLINE_STOPPED when no powered node.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DB_LOCKS,
  HEARTBEAT_TTL_MS,
  HONESTY_BANNER,
  MAX_MICROSERVICES,
  MICROSERVICE_SELF_ESCALATE_DENIED,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  REGISTRATION_NOT_AUTHORITY,
  type DbActor,
  type MeshNodeStatus,
} from './distributed-superbrain-runtime-mesh-types';

export type DepartmentMicroservice = {
  id: string;
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  sandboxed: true;
  productionAuthority: false;
  authorizedNodePowered: boolean;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  status: MeshNodeStatus | 'BOUNDED' | 'SANDBOXED' | 'REGISTERED' | 'DENIED';
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type MicroserviceResult = {
  accepted: boolean;
  reason: string;
  service?: DepartmentMicroservice;
  at: string;
};

type Store = { services: DepartmentMicroservice[] };

function storePath(root: string) {
  return xivLocalPath(root, 'agent-department-microservices.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { services: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function agentDepartmentMicroservicesHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DB_LOCKS.L4_AUTONOMY_ENABLED,
    selfEscalateProductionAuthority:
      DB_LOCKS.MICROSERVICE_SELF_ESCALATE_PRODUCTION_AUTHORITY,
    registrationEqAuthority: DB_LOCKS.REGISTRATION_EQ_AUTHORITY,
    runningVerifiedWithoutHeartbeat: DB_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT,
  };
}

export async function registerDepartmentMicroservice(input: {
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  authorizedNodePowered?: boolean;
  root: string;
  actor: DbActor;
}): Promise<MicroserviceResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.services.length >= MAX_MICROSERVICES) {
    return { accepted: false, reason: 'MAX_MICROSERVICES_BOUNDED', at: now };
  }
  const powered = input.authorizedNodePowered === true;
  const service: DepartmentMicroservice = {
    id: id('adms'),
    name: input.name.trim() || 'unnamed-ms',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    sandboxed: true,
    productionAuthority: false,
    authorizedNodePowered: powered,
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    status: powered ? 'REGISTERED' : 'WAITING_NODE',
    reason: REGISTRATION_NOT_AUTHORITY,
    createdAt: now,
    updatedAt: now,
  };
  store.services.push(service);
  await save(input.root, store);
  return {
    accepted: true,
    reason: REGISTRATION_NOT_AUTHORITY,
    service,
    at: now,
  };
}

export async function requestMicroserviceProductionAuthority(input: {
  serviceId: string;
  selfEscalate: boolean;
  root: string;
  actor: DbActor;
}): Promise<MicroserviceResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const service = store.services.find((s) => s.id === input.serviceId);
  if (!service) {
    return { accepted: false, reason: 'MICROSERVICE_NOT_FOUND', at: now };
  }
  if (input.selfEscalate) {
    service.productionAuthority = false;
    service.status = 'DENIED';
    service.reason = MICROSERVICE_SELF_ESCALATE_DENIED;
    service.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: MICROSERVICE_SELF_ESCALATE_DENIED,
      service,
      at: now,
    };
  }
  service.productionAuthority = false;
  service.reason = 'PRODUCTION_AUTHORITY_REQUIRES_FOUNDER_SEAL';
  service.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: false,
    reason: service.reason,
    service,
    at: now,
  };
}

export async function recordMicroserviceHeartbeat(input: {
  serviceId: string;
  runtimeEvidence: string;
  root: string;
  actor: DbActor;
}): Promise<MicroserviceResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const service = store.services.find((s) => s.id === input.serviceId);
  if (!service) {
    return { accepted: false, reason: 'MICROSERVICE_NOT_FOUND', at: now };
  }
  if (!service.authorizedNodePowered) {
    service.status = 'WAITING_NODE';
    service.reason = NO_POWERED_NODE_WAITING_OR_STOPPED;
    service.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      service,
      at: now,
    };
  }
  service.lastHeartbeatAt = now;
  service.runtimeEvidence = input.runtimeEvidence;
  service.status = 'RUNNING_VERIFIED';
  service.reason = 'HEARTBEAT_RUNTIME_EVIDENCE_ACCEPTED';
  service.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: service.reason, service, at: now };
}

export async function claimMicroserviceRunningVerified(input: {
  serviceId: string;
  root: string;
  actor: DbActor;
}): Promise<MicroserviceResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const service = store.services.find((s) => s.id === input.serviceId);
  if (!service) {
    return { accepted: false, reason: 'MICROSERVICE_NOT_FOUND', at: now };
  }
  if (!service.authorizedNodePowered) {
    if (service.status !== 'OFFLINE_STOPPED') service.status = 'WAITING_NODE';
    service.reason = NO_POWERED_NODE_WAITING_OR_STOPPED;
    service.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      service,
      at: now,
    };
  }
  const hbOk =
    service.lastHeartbeatAt &&
    Date.now() - Date.parse(service.lastHeartbeatAt) <= HEARTBEAT_TTL_MS &&
    Boolean(service.runtimeEvidence);
  if (!hbOk) {
    service.status =
      service.status === 'RUNNING_VERIFIED' ? 'HEARTBEAT_STALE' : service.status;
    if (service.status === 'RUNNING_VERIFIED') service.status = 'HEARTBEAT_STALE';
    service.reason = NO_HEARTBEAT_NOT_RUNNING_VERIFIED;
    service.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      service,
      at: now,
    };
  }
  service.status = 'RUNNING_VERIFIED';
  service.reason = 'RUNNING_VERIFIED_WITH_HEARTBEAT';
  service.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: service.reason, service, at: now };
}

export async function setMicroserviceNodePower(input: {
  serviceId: string;
  poweredOn: boolean;
  stopMode?: 'WAITING_NODE' | 'OFFLINE_STOPPED';
  root: string;
  actor: DbActor;
}): Promise<MicroserviceResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const service = store.services.find((s) => s.id === input.serviceId);
  if (!service) {
    return { accepted: false, reason: 'MICROSERVICE_NOT_FOUND', at: now };
  }
  service.authorizedNodePowered = input.poweredOn;
  if (!input.poweredOn) {
    service.status = input.stopMode ?? 'WAITING_NODE';
    service.reason = NO_POWERED_NODE_WAITING_OR_STOPPED;
  } else {
    service.status = service.lastHeartbeatAt ? 'MATERIALIZED' : 'REGISTERED';
    service.reason = 'NODE_POWERED_AWAITING_HEARTBEAT';
  }
  service.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: service.reason, service, at: now };
}
