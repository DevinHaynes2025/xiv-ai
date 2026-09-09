/**
 * 62L-DK Neural Highway Expansion —
 * Highways, bridges, tunnels, indexes, caches, agent routes, storage nodes,
 * wormholes (authorized fast paths), black-hole bounded archive/anomaly nodes,
 * mini-server/database candidates (NOT_APPLIED).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BLACK_HOLE_UNBOUNDED_DENIED,
  DK_LOCKS,
  HONESTY_BANNER,
  MAX_ACTIVE_HIGHWAY_ROUTES,
  MAX_BLACK_HOLE_ARCHIVE_BYTES,
  MAX_BLACK_HOLE_NODES,
  MAX_MINI_SERVER_CANDIDATES,
  MAX_NEURAL_HIGHWAYS,
  MINI_SERVER_AUTO_APPLY_DENIED,
  NEURAL_HIGHWAY_WORMHOLE_BYPASS_DENIED,
  type BlackHoleKind,
  type DkActor,
  type NeuralPathKind,
} from './unified-intelligence-experience-os-types';

export type NeuralHighwayFabric = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  sparseBounded: true;
  activeRouteCount: number;
  createdAt: string;
};

export type NeuralPath = {
  id: string;
  fabricId: string;
  kind: NeuralPathKind;
  from: string;
  to: string;
  authorized: boolean;
  sealedScope: boolean;
  activated: boolean;
  status: 'ALLOWED' | 'DENIED' | 'BOUNDED' | 'CANDIDATE';
  reason: string;
  createdAt: string;
};

export type BlackHoleNode = {
  id: string;
  fabricId: string;
  kind: BlackHoleKind;
  bounded: true;
  maxArchiveBytes: number;
  archiveBytesUsed: number;
  destroysSealedAuditWithoutPolicy: false;
  status: 'BOUNDED' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type MiniServerDbCandidate = {
  id: string;
  fabricId: string;
  name: string;
  status: 'CANDIDATE' | 'NOT_APPLIED' | 'DENIED';
  autoApplyAttempted: boolean;
  applied: false;
  reason: string;
  createdAt: string;
};

type Store = {
  fabrics: NeuralHighwayFabric[];
  paths: NeuralPath[];
  blackHoles: BlackHoleNode[];
  miniServers: MiniServerDbCandidate[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'neural-highway-expansion.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    fabrics: [],
    paths: [],
    blackHoles: [],
    miniServers: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function neuralHighwayExpansionHonesty() {
  return {
    banner: HONESTY_BANNER,
    wormholeBypassSealedAuth: DK_LOCKS.WORMHOLE_BYPASS_SEALED_AUTH,
    neuralHighwayBypassSealedAuth: DK_LOCKS.NEURAL_HIGHWAY_BYPASS_SEALED_AUTH,
    wormholeAuthorizedFastPathOnly: DK_LOCKS.WORMHOLE_IS_AUTHORIZED_FAST_PATH_ONLY,
    sparseBounded: DK_LOCKS.NEURAL_HIGHWAYS_SPARSE_BOUNDED,
    blackHoleUnboundedDestruction: DK_LOCKS.BLACK_HOLE_UNBOUNDED_DESTRUCTION,
    blackHoleBoundedArchiveOrAnomaly: DK_LOCKS.BLACK_HOLE_IS_BOUNDED_ARCHIVE_OR_ANOMALY,
    miniServerDbAutoApply: DK_LOCKS.MINI_SERVER_DB_AUTO_APPLY_MIGRATION,
    miniServerDbCandidatesNotApplied: DK_LOCKS.MINI_SERVER_DB_CANDIDATES_NOT_APPLIED,
    maxActiveRoutes: MAX_ACTIVE_HIGHWAY_ROUTES,
  };
}

export async function bootstrapNeuralHighwayExpansion(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DkActor;
}): Promise<NeuralHighwayFabric> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.fabrics.find(
    (f) =>
      f.orgId === input.orgId &&
      f.tenantId === input.tenantId &&
      f.universeId === input.universeId,
  );
  if (existing) return existing;
  const fabric: NeuralHighwayFabric = {
    id: id('dkhwy'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    sparseBounded: true,
    activeRouteCount: 0,
    createdAt: new Date().toISOString(),
  };
  store.fabrics.push(fabric);
  await save(input.root, store);
  return fabric;
}

export async function openNeuralPath(input: {
  fabricId: string;
  kind: NeuralPathKind;
  from: string;
  to: string;
  authorized: boolean;
  sealedScope?: boolean;
  bypassSealed?: boolean;
  bypassAuth?: boolean;
  root: string;
  actor: DkActor;
}): Promise<{ accepted: boolean; reason: string; path?: NeuralPath; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) return { accepted: false, reason: 'FABRIC_NOT_FOUND', at: now };

  if (store.paths.length >= MAX_NEURAL_HIGHWAYS) {
    return { accepted: false, reason: 'MAX_NEURAL_HIGHWAYS_REACHED', at: now };
  }

  const bypassAttempt =
    input.bypassSealed === true ||
    input.bypassAuth === true ||
    (input.sealedScope === true && input.authorized !== true) ||
    input.authorized !== true;

  if (
    input.bypassSealed === true ||
    input.bypassAuth === true ||
    (input.kind === 'wormhole' && input.authorized !== true) ||
    input.authorized !== true
  ) {
    const path: NeuralPath = {
      id: id('dkpath'),
      fabricId: input.fabricId,
      kind: input.kind,
      from: input.from,
      to: input.to,
      authorized: input.authorized === true,
      sealedScope: input.sealedScope === true,
      activated: false,
      status: 'DENIED',
      reason: NEURAL_HIGHWAY_WORMHOLE_BYPASS_DENIED,
      createdAt: now,
    };
    store.paths.push(path);
    await save(input.root, store);
    return { accepted: false, reason: NEURAL_HIGHWAY_WORMHOLE_BYPASS_DENIED, path, at: now };
  }

  if (bypassAttempt && input.sealedScope === true && !input.authorized) {
    return { accepted: false, reason: NEURAL_HIGHWAY_WORMHOLE_BYPASS_DENIED, at: now };
  }

  if (fabric.activeRouteCount >= MAX_ACTIVE_HIGHWAY_ROUTES) {
    const path: NeuralPath = {
      id: id('dkpath'),
      fabricId: input.fabricId,
      kind: input.kind,
      from: input.from,
      to: input.to,
      authorized: true,
      sealedScope: input.sealedScope === true,
      activated: false,
      status: 'BOUNDED',
      reason: 'MAX_ACTIVE_HIGHWAY_ROUTES_REACHED_SPARSE_BOUND',
      createdAt: now,
    };
    store.paths.push(path);
    await save(input.root, store);
    return { accepted: false, reason: path.reason, path, at: now };
  }

  const path: NeuralPath = {
    id: id('dkpath'),
    fabricId: input.fabricId,
    kind: input.kind,
    from: input.from,
    to: input.to,
    authorized: true,
    sealedScope: input.sealedScope === true,
    activated: true,
    status: 'ALLOWED',
    reason: 'AUTHORIZED_SPARSE_NEURAL_PATH_OPENED',
    createdAt: now,
  };
  store.paths.push(path);
  fabric.activeRouteCount += 1;
  await save(input.root, store);
  return { accepted: true, reason: path.reason, path, at: now };
}

export async function registerBlackHoleNode(input: {
  fabricId: string;
  kind: BlackHoleKind;
  unboundedDestruction?: boolean;
  destroySealedAuditWithoutPolicy?: boolean;
  archiveBytes?: number;
  root: string;
  actor: DkActor;
}): Promise<{ accepted: boolean; reason: string; node?: BlackHoleNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) return { accepted: false, reason: 'FABRIC_NOT_FOUND', at: now };

  if (store.blackHoles.length >= MAX_BLACK_HOLE_NODES) {
    return { accepted: false, reason: 'MAX_BLACK_HOLE_NODES_REACHED', at: now };
  }

  if (
    input.unboundedDestruction === true ||
    input.destroySealedAuditWithoutPolicy === true ||
    (input.archiveBytes ?? 0) > MAX_BLACK_HOLE_ARCHIVE_BYTES
  ) {
    const node: BlackHoleNode = {
      id: id('dkbh'),
      fabricId: input.fabricId,
      kind: input.kind,
      bounded: true,
      maxArchiveBytes: MAX_BLACK_HOLE_ARCHIVE_BYTES,
      archiveBytesUsed: 0,
      destroysSealedAuditWithoutPolicy: false,
      status: 'DENIED',
      reason: BLACK_HOLE_UNBOUNDED_DENIED,
      createdAt: now,
    };
    store.blackHoles.push(node);
    await save(input.root, store);
    return { accepted: false, reason: BLACK_HOLE_UNBOUNDED_DENIED, node, at: now };
  }

  const node: BlackHoleNode = {
    id: id('dkbh'),
    fabricId: input.fabricId,
    kind: input.kind,
    bounded: true,
    maxArchiveBytes: MAX_BLACK_HOLE_ARCHIVE_BYTES,
    archiveBytesUsed: Math.max(0, input.archiveBytes ?? 0),
    destroysSealedAuditWithoutPolicy: false,
    status: 'BOUNDED',
    reason: 'BLACK_HOLE_BOUNDED_ARCHIVE_OR_ANOMALY_REGISTERED',
    createdAt: now,
  };
  store.blackHoles.push(node);
  await save(input.root, store);
  return { accepted: true, reason: node.reason, node, at: now };
}

export async function proposeMiniServerDbCandidate(input: {
  fabricId: string;
  name: string;
  autoApplyProductionMigration?: boolean;
  root: string;
  actor: DkActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  candidate?: MiniServerDbCandidate;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) return { accepted: false, reason: 'FABRIC_NOT_FOUND', at: now };

  if (store.miniServers.length >= MAX_MINI_SERVER_CANDIDATES) {
    return { accepted: false, reason: 'MAX_MINI_SERVER_CANDIDATES_REACHED', at: now };
  }

  if (input.autoApplyProductionMigration === true) {
    const candidate: MiniServerDbCandidate = {
      id: id('dkmini'),
      fabricId: input.fabricId,
      name: input.name.trim() || 'unnamed-candidate',
      status: 'DENIED',
      autoApplyAttempted: true,
      applied: false,
      reason: MINI_SERVER_AUTO_APPLY_DENIED,
      createdAt: now,
    };
    store.miniServers.push(candidate);
    await save(input.root, store);
    return { accepted: false, reason: MINI_SERVER_AUTO_APPLY_DENIED, candidate, at: now };
  }

  const candidate: MiniServerDbCandidate = {
    id: id('dkmini'),
    fabricId: input.fabricId,
    name: input.name.trim() || 'unnamed-candidate',
    status: 'NOT_APPLIED',
    autoApplyAttempted: false,
    applied: false,
    reason: 'MINI_SERVER_DB_CANDIDATE_RECORDED_NOT_APPLIED',
    createdAt: now,
  };
  store.miniServers.push(candidate);
  await save(input.root, store);
  return { accepted: true, reason: candidate.reason, candidate, at: now };
}
