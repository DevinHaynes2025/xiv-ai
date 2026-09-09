/**
 * 62L-DL Distributed Edge Microserver Fabric —
 * Edge microserver candidates with enrollment/health.
 * NOT_APPLIED to production infra; no stealth install.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DL_LOCKS,
  EDGE_AUTO_APPLY_DENIED,
  EDGE_STEALTH_INSTALL_DENIED,
  HONESTY_BANNER,
  MAX_EDGE_MICROSERVERS,
  UNENROLLED_MICROSERVER_UNAVAILABLE,
  type DlActor,
} from './neural-transportation-os-types';

export type DistributedEdgeMicroserverFabric = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  productionInfraApplied: false;
  stealthInstallAllowed: false;
  createdAt: string;
};

export type EdgeMicroserver = {
  id: string;
  fabricId: string;
  name: string;
  enrolled: boolean;
  health: 'UNKNOWN' | 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  status: 'CANDIDATE' | 'ENROLLED' | 'UNAVAILABLE' | 'DENIED' | 'NOT_APPLIED';
  stealthInstallAttempted: boolean;
  autoApplyProdInfraAttempted: boolean;
  appliedToProduction: false;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

type Store = {
  fabrics: DistributedEdgeMicroserverFabric[];
  servers: EdgeMicroserver[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-edge-microserver-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { fabrics: [], servers: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function distributedEdgeMicroserverFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    unenrolledMicroserverAvailable: DL_LOCKS.UNENROLLED_MICROSERVER_AVAILABLE,
    edgeMicroserverStealthInstall: DL_LOCKS.EDGE_MICROSERVER_STEALTH_INSTALL,
    edgeMicroserverCandidatesNotApplied: DL_LOCKS.EDGE_MICROSERVER_CANDIDATES_NOT_APPLIED,
    edgeMicroserverAutoApplyProdInfra: DL_LOCKS.EDGE_MICROSERVER_AUTO_APPLY_PROD_INFRA,
  };
}

export async function bootstrapDistributedEdgeMicroserverFabric(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DlActor;
}): Promise<DistributedEdgeMicroserverFabric> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.fabrics.find(
    (f) =>
      f.orgId === input.orgId &&
      f.tenantId === input.tenantId &&
      f.universeId === input.universeId,
  );
  if (existing) return existing;
  const fabric: DistributedEdgeMicroserverFabric = {
    id: id('dledge'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    productionInfraApplied: false,
    stealthInstallAllowed: false,
    createdAt: new Date().toISOString(),
  };
  store.fabrics.push(fabric);
  await save(input.root, store);
  return fabric;
}

export async function proposeEdgeMicroserverCandidate(input: {
  fabricId: string;
  name: string;
  stealthInstall?: boolean;
  autoApplyProductionInfra?: boolean;
  root: string;
  actor: DlActor;
}): Promise<{ accepted: boolean; reason: string; server?: EdgeMicroserver; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) return { accepted: false, reason: 'FABRIC_NOT_FOUND', at: now };

  if (store.servers.length >= MAX_EDGE_MICROSERVERS) {
    return { accepted: false, reason: 'MAX_EDGE_MICROSERVERS_REACHED', at: now };
  }

  if (input.stealthInstall === true) {
    const server: EdgeMicroserver = {
      id: id('dlms'),
      fabricId: input.fabricId,
      name: input.name.trim() || 'unnamed-edge',
      enrolled: false,
      health: 'UNAVAILABLE',
      status: 'DENIED',
      stealthInstallAttempted: true,
      autoApplyProdInfraAttempted: false,
      appliedToProduction: false,
      reason: EDGE_STEALTH_INSTALL_DENIED,
      createdAt: now,
      updatedAt: now,
    };
    store.servers.push(server);
    await save(input.root, store);
    return { accepted: false, reason: EDGE_STEALTH_INSTALL_DENIED, server, at: now };
  }

  if (input.autoApplyProductionInfra === true) {
    const server: EdgeMicroserver = {
      id: id('dlms'),
      fabricId: input.fabricId,
      name: input.name.trim() || 'unnamed-edge',
      enrolled: false,
      health: 'UNAVAILABLE',
      status: 'DENIED',
      stealthInstallAttempted: false,
      autoApplyProdInfraAttempted: true,
      appliedToProduction: false,
      reason: EDGE_AUTO_APPLY_DENIED,
      createdAt: now,
      updatedAt: now,
    };
    store.servers.push(server);
    await save(input.root, store);
    return { accepted: false, reason: EDGE_AUTO_APPLY_DENIED, server, at: now };
  }

  const server: EdgeMicroserver = {
    id: id('dlms'),
    fabricId: input.fabricId,
    name: input.name.trim() || 'unnamed-edge',
    enrolled: false,
    health: 'UNKNOWN',
    status: 'CANDIDATE',
    stealthInstallAttempted: false,
    autoApplyProdInfraAttempted: false,
    appliedToProduction: false,
    reason: 'EDGE_MICROSERVER_CANDIDATE_RECORDED_NOT_APPLIED',
    createdAt: now,
    updatedAt: now,
  };
  store.servers.push(server);
  await save(input.root, store);
  return { accepted: true, reason: server.reason, server, at: now };
}

export async function enrollEdgeMicroserver(input: {
  serverId: string;
  root: string;
  actor: DlActor;
}): Promise<{ accepted: boolean; reason: string; server?: EdgeMicroserver; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const server = store.servers.find((s) => s.id === input.serverId);
  if (!server) return { accepted: false, reason: 'SERVER_NOT_FOUND', at: now };
  if (server.status === 'DENIED') {
    return { accepted: false, reason: server.reason, server, at: now };
  }
  server.enrolled = true;
  server.status = 'ENROLLED';
  server.health = 'HEALTHY';
  server.updatedAt = now;
  server.reason = 'EDGE_MICROSERVER_ENROLLED_CANDIDATE_NOT_APPLIED_TO_PROD';
  await save(input.root, store);
  return { accepted: true, reason: server.reason, server, at: now };
}

export async function queryEdgeMicroserverAvailability(input: {
  serverId: string;
  root: string;
  actor: DlActor;
}): Promise<{
  available: boolean;
  reason: string;
  server?: EdgeMicroserver;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const server = store.servers.find((s) => s.id === input.serverId);
  if (!server) return { available: false, reason: 'SERVER_NOT_FOUND', at: now };

  if (!server.enrolled) {
    server.health = 'UNAVAILABLE';
    server.status = 'UNAVAILABLE';
    server.updatedAt = now;
    server.reason = UNENROLLED_MICROSERVER_UNAVAILABLE;
    await save(input.root, store);
    return {
      available: false,
      reason: UNENROLLED_MICROSERVER_UNAVAILABLE,
      server,
      at: now,
    };
  }

  return {
    available: true,
    reason: 'ENROLLED_MICROSERVER_AVAILABLE_AS_CANDIDATE_NOT_APPLIED',
    server,
    at: now,
  };
}
