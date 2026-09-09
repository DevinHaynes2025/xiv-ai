/**
 * 62L-CZ Global Universe Routing & Recovery Mesh —
 * Resilient authorized Universe routing and recovery.
 * Authorized + signed only; sealed/raw private silent route DENIED.
 * Recovery cannot invent RUNNING_VERIFIED without heartbeat.
 * No powered node → WAITING_NODE or OFFLINE_STOPPED.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CZ_LOCKS,
  HEARTBEAT_TTL_MS,
  HONESTY_BANNER,
  MAX_UNIVERSE_ROUTES,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  RECOVERY_NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED,
  UNAUTHORIZED_UNIVERSE_ROUTE_DENIED,
  UNSIGNED_UNIVERSE_ROUTE_REJECTED,
  type CzActor,
  type MeshNodeStatus,
} from './intelligence-civilization-kernel-types';

export type MeshNode = {
  id: string;
  name: string;
  universeId: string;
  authorized: boolean;
  poweredOn: boolean;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  status: MeshNodeStatus;
  createdAt: string;
  updatedAt: string;
};

export type UniverseRoute = {
  id: string;
  sourceUniverseId: string;
  targetUniverseId: string;
  payloadDigest: string;
  signature: string | null;
  signed: boolean;
  authorized: boolean;
  contentClass: 'open' | 'sealed' | 'raw_private';
  silentRoute: boolean;
  status: 'ACCEPTED' | 'DENIED' | 'REJECTED';
  reason: string;
  createdAt: string;
};

export type RecoveryAttempt = {
  id: string;
  nodeId: string;
  claimedRunningVerified: boolean;
  status: MeshNodeStatus;
  reason: string;
  at: string;
};

export type MeshResult = {
  accepted: boolean;
  reason: string;
  node?: MeshNode;
  route?: UniverseRoute;
  recovery?: RecoveryAttempt;
  at: string;
};

type Store = {
  nodes: MeshNode[];
  routes: UniverseRoute[];
  recoveries: RecoveryAttempt[];
  authorizedLinks: Array<{
    id: string;
    sourceUniverseId: string;
    targetUniverseId: string;
    authorized: boolean;
  }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-universe-routing-recovery-mesh.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    nodes: [],
    routes: [],
    recoveries: [],
    authorizedLinks: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function signUniverseRoutePayload(payload: string, keyMaterial: string): string {
  return createHash('sha256').update(`${keyMaterial}::${payload}`).digest('hex');
}

export function universeRoutingMeshHonesty() {
  return {
    banner: HONESTY_BANNER,
    unauthorizedRoute: CZ_LOCKS.UNAUTHORIZED_UNIVERSE_ROUTE,
    unsignedAccepted: CZ_LOCKS.UNSIGNED_UNIVERSE_ROUTE_ACCEPTED,
    sealedRawPrivateSilentRoute: CZ_LOCKS.SEALED_RAW_PRIVATE_SILENT_UNIVERSE_ROUTE,
    recoveryInventsRunningVerified: CZ_LOCKS.RECOVERY_INVENTS_RUNNING_VERIFIED,
    offlineDevicesPretendRunning: CZ_LOCKS.OFFLINE_DEVICES_PRETEND_RUNNING,
  };
}

function deriveNodeStatus(node: MeshNode, preferStopped = false): MeshNodeStatus {
  if (!node.poweredOn) {
    return preferStopped || node.status === 'OFFLINE_STOPPED'
      ? 'OFFLINE_STOPPED'
      : 'WAITING_NODE';
  }
  if (!node.lastHeartbeatAt || !node.runtimeEvidence) {
    return node.status === 'REGISTERED' ? 'REGISTERED' : 'HEARTBEAT_STALE';
  }
  const age = Date.now() - Date.parse(node.lastHeartbeatAt);
  if (Number.isNaN(age) || age > HEARTBEAT_TTL_MS) return 'HEARTBEAT_STALE';
  return 'RUNNING_VERIFIED';
}

export async function registerMeshNode(input: {
  name: string;
  universeId: string;
  authorized?: boolean;
  poweredOn?: boolean;
  root: string;
  actor: CzActor;
}): Promise<MeshResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node: MeshNode = {
    id: id('mnode'),
    name: input.name.trim(),
    universeId: input.universeId,
    authorized: input.authorized !== false,
    poweredOn: input.poweredOn === true,
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    status: 'REGISTERED',
    createdAt: now,
    updatedAt: now,
  };
  node.status = deriveNodeStatus(node);
  store.nodes.push(node);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'MESH_NODE_REGISTERED',
    node,
    at: now,
  };
}

export async function setMeshNodesPower(input: {
  poweredOn: boolean;
  stopMode?: boolean;
  root: string;
  actor: CzActor;
}): Promise<MeshResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  for (const node of store.nodes) {
    if (!node.authorized) continue;
    node.poweredOn = input.poweredOn;
    if (!input.poweredOn && input.stopMode) node.status = 'OFFLINE_STOPPED';
    node.status = deriveNodeStatus(node, input.stopMode === true);
    node.updatedAt = now;
  }
  await save(input.root, store);
  const allOff = store.nodes.filter((n) => n.authorized).every((n) => !n.poweredOn);
  return {
    accepted: true,
    reason: allOff ? NO_POWERED_NODE_WAITING_OR_STOPPED : 'MESH_NODE_POWER_UPDATED',
    at: now,
  };
}

export async function recordMeshHeartbeat(input: {
  nodeId: string;
  runtimeEvidence: string;
  root: string;
  actor: CzActor;
}): Promise<MeshResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) return { accepted: false, reason: 'MESH_NODE_NOT_FOUND', at: now };
  node.lastHeartbeatAt = now;
  node.runtimeEvidence = input.runtimeEvidence;
  node.status = deriveNodeStatus(node);
  node.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'MESH_HEARTBEAT_RECORDED', node, at: now };
}

export async function authorizeUniverseRouteLink(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  root: string;
  actor: CzActor;
}): Promise<MeshResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  store.authorizedLinks.push({
    id: id('ulink'),
    sourceUniverseId: input.sourceUniverseId.trim(),
    targetUniverseId: input.targetUniverseId.trim(),
    authorized: true,
  });
  await save(input.root, store);
  return { accepted: true, reason: 'UNIVERSE_ROUTE_LINK_AUTHORIZED', at: now };
}

export async function routeUniversePayload(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  payload: string;
  signature?: string | null;
  signingKey?: string | null;
  contentClass?: 'open' | 'sealed' | 'raw_private';
  silentRoute?: boolean;
  root: string;
  actor: CzActor;
}): Promise<MeshResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();

  if (store.routes.length >= MAX_UNIVERSE_ROUTES) {
    return { accepted: false, reason: 'MAX_UNIVERSE_ROUTES_BOUNDED', at: now };
  }

  const contentClass = input.contentClass ?? 'open';
  const silent = input.silentRoute === true;
  const digest = createHash('sha256').update(input.payload).digest('hex');
  const signature = input.signature?.trim() || null;
  const expected = input.signingKey?.trim()
    ? signUniverseRoutePayload(input.payload, input.signingKey.trim())
    : null;
  const signed = Boolean(signature && expected && signature === expected);

  if (
    (contentClass === 'sealed' || contentClass === 'raw_private') &&
    silent
  ) {
    const route: UniverseRoute = {
      id: id('uroute'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      payloadDigest: digest,
      signature,
      signed,
      authorized: false,
      contentClass,
      silentRoute: true,
      status: 'DENIED',
      reason: SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED,
      createdAt: now,
    };
    store.routes.push(route);
    await save(input.root, store);
    return { accepted: false, reason: route.reason, route, at: now };
  }

  if (!signed) {
    const route: UniverseRoute = {
      id: id('uroute'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      payloadDigest: digest,
      signature,
      signed: false,
      authorized: false,
      contentClass,
      silentRoute: silent,
      status: 'REJECTED',
      reason: UNSIGNED_UNIVERSE_ROUTE_REJECTED,
      createdAt: now,
    };
    store.routes.push(route);
    await save(input.root, store);
    return { accepted: false, reason: route.reason, route, at: now };
  }

  const link = store.authorizedLinks.find(
    (l) =>
      l.sourceUniverseId === input.sourceUniverseId &&
      l.targetUniverseId === input.targetUniverseId &&
      l.authorized,
  );
  if (!link) {
    const route: UniverseRoute = {
      id: id('uroute'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      payloadDigest: digest,
      signature,
      signed: true,
      authorized: false,
      contentClass,
      silentRoute: silent,
      status: 'DENIED',
      reason: UNAUTHORIZED_UNIVERSE_ROUTE_DENIED,
      createdAt: now,
    };
    store.routes.push(route);
    await save(input.root, store);
    return { accepted: false, reason: route.reason, route, at: now };
  }

  const route: UniverseRoute = {
    id: id('uroute'),
    sourceUniverseId: input.sourceUniverseId,
    targetUniverseId: input.targetUniverseId,
    payloadDigest: digest,
    signature,
    signed: true,
    authorized: true,
    contentClass,
    silentRoute: silent,
    status: 'ACCEPTED',
    reason: 'UNIVERSE_ROUTE_ACCEPTED_SIGNED_AUTHORIZED',
    createdAt: now,
  };
  store.routes.push(route);
  await save(input.root, store);
  return { accepted: true, reason: route.reason, route, at: now };
}

/**
 * Recovery cannot invent RUNNING_VERIFIED without heartbeat + powered node.
 */
export async function attemptMeshRecovery(input: {
  nodeId: string;
  claimRunningVerified?: boolean;
  stopMode?: boolean;
  root: string;
  actor: CzActor;
}): Promise<MeshResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) return { accepted: false, reason: 'MESH_NODE_NOT_FOUND', at: now };

  node.status = deriveNodeStatus(node, input.stopMode === true);

  if (input.claimRunningVerified === true) {
    const hasHeartbeat =
      Boolean(node.lastHeartbeatAt) &&
      Boolean(node.runtimeEvidence) &&
      node.poweredOn &&
      Date.now() - Date.parse(node.lastHeartbeatAt!) <= HEARTBEAT_TTL_MS;

    if (!hasHeartbeat) {
      const status: MeshNodeStatus = !node.poweredOn
        ? input.stopMode
          ? 'OFFLINE_STOPPED'
          : 'WAITING_NODE'
        : 'HEARTBEAT_STALE';
      node.status = status;
      node.updatedAt = now;
      const recovery: RecoveryAttempt = {
        id: id('mrec'),
        nodeId: node.id,
        claimedRunningVerified: true,
        status,
        reason: !node.poweredOn
          ? NO_POWERED_NODE_WAITING_OR_STOPPED
          : RECOVERY_NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
        at: now,
      };
      store.recoveries.push(recovery);
      await save(input.root, store);
      return {
        accepted: false,
        reason: recovery.reason,
        node,
        recovery,
        at: now,
      };
    }
  }

  const authorizedPowered = store.nodes.filter((n) => n.authorized && n.poweredOn);
  if (authorizedPowered.length === 0) {
    const status: MeshNodeStatus = input.stopMode ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    node.status = status;
    node.updatedAt = now;
    const recovery: RecoveryAttempt = {
      id: id('mrec'),
      nodeId: node.id,
      claimedRunningVerified: false,
      status,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      at: now,
    };
    store.recoveries.push(recovery);
    await save(input.root, store);
    return {
      accepted: false,
      reason: recovery.reason,
      node,
      recovery,
      at: now,
    };
  }

  node.status = deriveNodeStatus(node);
  node.updatedAt = now;
  const recovery: RecoveryAttempt = {
    id: id('mrec'),
    nodeId: node.id,
    claimedRunningVerified: input.claimRunningVerified === true,
    status: node.status,
    reason:
      node.status === 'RUNNING_VERIFIED'
        ? 'RECOVERY_RUNNING_VERIFIED_WITH_HEARTBEAT'
        : RECOVERY_NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
    at: now,
  };
  store.recoveries.push(recovery);
  await save(input.root, store);
  return {
    accepted: node.status === 'RUNNING_VERIFIED',
    reason: recovery.reason,
    node,
    recovery,
    at: now,
  };
}

export function meshOfflineTruth(nodes: MeshNode[]): {
  allAuthorizedOff: boolean;
  status: MeshNodeStatus | 'MIXED';
} {
  const auth = nodes.filter((n) => n.authorized);
  if (auth.length === 0 || auth.every((n) => !n.poweredOn)) {
    const stopped = auth.every((n) => n.status === 'OFFLINE_STOPPED');
    return {
      allAuthorizedOff: true,
      status: stopped ? 'OFFLINE_STOPPED' : 'WAITING_NODE',
    };
  }
  return { allAuthorizedOff: false, status: 'MIXED' };
}
