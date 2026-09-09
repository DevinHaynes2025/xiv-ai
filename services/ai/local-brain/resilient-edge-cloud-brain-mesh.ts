import { createHash, randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BP_LOCKS,
  CLOUD_MESH_UNAVAILABLE,
  DR_SIM_ONLY,
  FRESHNESS_STALE,
  ISLAND_BOUNDED,
  REJOIN_NO_AUTO_TRUST,
  type BpEvidenceState,
} from './cognitive-homeostasis-types';

/**
 * Resilient Edge/Cloud Brain Mesh + Global Intelligence Recovery Fabric.
 * Supports offline island mode (bounded), deterministic failover/failback,
 * mesh rejoin reconciliation (no auto-trust of unverified remote), versioned
 * recovery snapshots, and disaster-recovery **simulation** only.
 */

export const BRAIN_MESH_STORE = 'resilient-edge-cloud-brain-mesh.json';

export type MeshRouteKind = 'local' | 'edge' | 'cloud';

export type MeshRoute = {
  id: string;
  kind: MeshRouteKind;
  label: string;
  configured: boolean;
  verified: boolean;
  latencyMs: number;
};

export type IslandSession = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  nodeId: string;
  enteredAt: string;
  boundedOpsAllowed: true;
  unboundedExpand: false;
  productionAuthorized: false;
};

export type MeshOpResult = {
  accepted: boolean;
  reason: string;
  freshnessState: BpEvidenceState;
  islandMode: boolean;
  productionAuthorization: false;
};

export type RejoinReconciliation = {
  id: string;
  at: string;
  orgId: string;
  nodeId: string;
  remoteStateVerified: boolean;
  autoTrusted: false;
  accepted: boolean;
  reason: string;
};

export type RecoverySnapshot = {
  id: string;
  version: number;
  orgId: string;
  tenantId: string;
  universeId: string;
  digest: string;
  createdAt: string;
  productionAuthorized: false;
};

export type DrSimulation = {
  id: string;
  at: string;
  scenario: string;
  simulated: true;
  realDisasterAuthorization: false;
  productionAuthorized: false;
  result: string;
};

type MeshStore = {
  routes: MeshRoute[];
  islands: IslandSession[];
  ops: Array<{ id: string; at: string; op: string; reason: string; freshnessState: BpEvidenceState }>;
  rejoins: RejoinReconciliation[];
  snapshots: RecoverySnapshot[];
  drSims: DrSimulation[];
  denials: Array<{ id: string; at: string; reason: string }>;
};

const MAX_ROUTES = 500;
const MAX_ISLANDS = 2_000;
const MAX_OPS = 10_000;
const MAX_REJOINS = 5_000;
const MAX_SNAPSHOTS = 5_000;
const MAX_DR = 2_000;
const MAX_DENIALS = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, BRAIN_MESH_STORE);
}

async function load(root: string): Promise<MeshStore> {
  const parsed = await readJsonFile<MeshStore>(storePath(root), {
    routes: [],
    islands: [],
    ops: [],
    rejoins: [],
    snapshots: [],
    drSims: [],
    denials: [],
  });
  return {
    routes: Array.isArray(parsed.routes) ? parsed.routes : [],
    islands: Array.isArray(parsed.islands) ? parsed.islands : [],
    ops: Array.isArray(parsed.ops) ? parsed.ops : [],
    rejoins: Array.isArray(parsed.rejoins) ? parsed.rejoins : [],
    snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : [],
    drSims: Array.isArray(parsed.drSims) ? parsed.drSims : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: MeshStore) {
  await writeJsonFileAtomic(storePath(root), {
    routes: store.routes.slice(-MAX_ROUTES),
    islands: store.islands.slice(-MAX_ISLANDS),
    ops: store.ops.slice(-MAX_OPS),
    rejoins: store.rejoins.slice(-MAX_REJOINS),
    snapshots: store.snapshots.slice(-MAX_SNAPSHOTS),
    drSims: store.drSims.slice(-MAX_DR),
    denials: store.denials.slice(-MAX_DENIALS),
  });
}

export async function declareMeshRoute(input: {
  kind: MeshRouteKind;
  label: string;
  configured?: boolean;
  verified?: boolean;
  latencyMs?: number;
  root?: string;
}): Promise<MeshRoute> {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const route: MeshRoute = {
    id: randomUUID(),
    kind: input.kind,
    label: input.label,
    configured: input.configured === true,
    verified: input.verified === true,
    latencyMs: input.latencyMs ?? 50,
  };
  store.routes.push(route);
  await save(root, store);
  return route;
}

export async function selectMeshRoute(input: {
  prefer?: MeshRouteKind;
  root?: string;
}): Promise<
  | { available: true; route: MeshRoute; reason: string }
  | { available: false; state: 'UNAVAILABLE'; reason: string }
> {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const prefer = input.prefer ?? 'cloud';

  const candidates = store.routes
    .filter((r) => r.kind === prefer)
    .filter((r) => r.configured && r.verified)
    .sort((a, b) => a.latencyMs - b.latencyMs);

  if (candidates.length === 0) {
    if (prefer === 'cloud') {
      return { available: false, state: 'UNAVAILABLE', reason: CLOUD_MESH_UNAVAILABLE };
    }
    return {
      available: false,
      state: 'UNAVAILABLE',
      reason: `MESH_ROUTE_${prefer.toUpperCase()}_UNAVAILABLE`,
    };
  }

  return {
    available: true,
    route: candidates[0]!,
    reason: 'Verified configured mesh route selected (trust before speed).',
  };
}

export async function enterOfflineIslandMode(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  nodeId: string;
  root?: string;
}): Promise<{ accepted: true; island: IslandSession } | { accepted: false; reason: string }> {
  if (!input.orgId || !input.tenantId || !input.universeId || !input.nodeId) {
    return { accepted: false, reason: 'ORG_TENANT_UNIVERSE_NODE_REQUIRED' };
  }
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const island: IslandSession = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    nodeId: input.nodeId,
    enteredAt: new Date().toISOString(),
    boundedOpsAllowed: true,
    unboundedExpand: false,
    productionAuthorized: false,
  };
  store.islands.push(island);
  await save(root, store);
  return { accepted: true, island };
}

export async function runIslandOperation(input: {
  islandId: string;
  op: string;
  freshnessSensitive?: boolean;
  localFreshnessOk?: boolean;
  attemptUnbounded?: boolean;
  root?: string;
}): Promise<MeshOpResult> {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const island = store.islands.find((i) => i.id === input.islandId);

  if (!island) {
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason: 'ISLAND_NOT_FOUND',
    });
    await save(root, store);
    return {
      accepted: false,
      reason: 'ISLAND_NOT_FOUND',
      freshnessState: 'UNAVAILABLE',
      islandMode: false,
      productionAuthorization: false,
    };
  }

  if (input.attemptUnbounded === true || BP_LOCKS.OFFLINE_ISLAND_UNBOUNDED === true) {
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason: ISLAND_BOUNDED,
    });
    await save(root, store);
    return {
      accepted: false,
      reason: ISLAND_BOUNDED,
      freshnessState: 'DENIED',
      islandMode: true,
      productionAuthorization: false,
    };
  }

  if (input.freshnessSensitive === true && input.localFreshnessOk !== true) {
    const freshnessState: BpEvidenceState = 'STALE';
    store.ops.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      op: input.op,
      reason: FRESHNESS_STALE,
      freshnessState: 'WAITING_DATA',
    });
    await save(root, store);
    return {
      accepted: false,
      reason: FRESHNESS_STALE,
      freshnessState,
      islandMode: true,
      productionAuthorization: false,
    };
  }

  store.ops.push({
    id: randomUUID(),
    at: new Date().toISOString(),
    op: input.op,
    reason: ISLAND_BOUNDED,
    freshnessState: 'PASS',
  });
  await save(root, store);
  return {
    accepted: true,
    reason: ISLAND_BOUNDED,
    freshnessState: 'PASS',
    islandMode: true,
    productionAuthorization: false,
  };
}

export async function failoverMeshRoute(input: {
  fromKind: MeshRouteKind;
  toKind: MeshRouteKind;
  root?: string;
}): Promise<
  | { accepted: true; route: MeshRoute; reason: string }
  | { accepted: false; state: 'UNAVAILABLE'; reason: string }
> {
  const selected = await selectMeshRoute({ prefer: input.toKind, root: input.root });
  if (!selected.available) {
    return { accepted: false, state: 'UNAVAILABLE', reason: selected.reason };
  }
  return {
    accepted: true,
    route: selected.route,
    reason: `Deterministic failover ${input.fromKind} → ${input.toKind} on verified route only.`,
  };
}

export async function reconcileMeshRejoin(input: {
  orgId: string;
  nodeId: string;
  remoteStateVerified?: boolean;
  attemptAutoTrustUnverified?: boolean;
  root?: string;
}): Promise<RejoinReconciliation> {
  const root = input.root ?? process.cwd();
  const store = await load(root);

  if (input.attemptAutoTrustUnverified === true || input.remoteStateVerified !== true) {
    const record: RejoinReconciliation = {
      id: randomUUID(),
      at: new Date().toISOString(),
      orgId: input.orgId,
      nodeId: input.nodeId,
      remoteStateVerified: input.remoteStateVerified === true,
      autoTrusted: false,
      accepted: false,
      reason: REJOIN_NO_AUTO_TRUST,
    };
    store.rejoins.push(record);
    if (input.attemptAutoTrustUnverified === true) {
      store.denials.push({
        id: randomUUID(),
        at: record.at,
        reason: REJOIN_NO_AUTO_TRUST,
      });
    }
    await save(root, store);
    return record;
  }

  const record: RejoinReconciliation = {
    id: randomUUID(),
    at: new Date().toISOString(),
    orgId: input.orgId,
    nodeId: input.nodeId,
    remoteStateVerified: true,
    autoTrusted: false,
    accepted: true,
    reason: 'Verified remote state reconciled without auto-trust shortcut.',
  };
  store.rejoins.push(record);
  await save(root, store);
  return record;
}

export async function createRecoverySnapshot(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  payloadDigestSource: string;
  root?: string;
}): Promise<RecoverySnapshot> {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const version = store.snapshots.filter((s) => s.orgId === input.orgId).length + 1;
  const snapshot: RecoverySnapshot = {
    id: randomUUID(),
    version,
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    digest: createHash('sha256').update(input.payloadDigestSource).digest('hex').slice(0, 32),
    createdAt: new Date().toISOString(),
    productionAuthorized: false,
  };
  store.snapshots.push(snapshot);
  await save(root, store);
  return snapshot;
}

export async function runDisasterRecoverySimulation(input: {
  scenario: string;
  claimRealAuthorization?: boolean;
  root?: string;
}): Promise<
  | { accepted: true; sim: DrSimulation }
  | { accepted: false; reason: string; sim: DrSimulation }
> {
  const root = input.root ?? process.cwd();
  const store = await load(root);

  if (input.claimRealAuthorization === true) {
    const sim: DrSimulation = {
      id: randomUUID(),
      at: new Date().toISOString(),
      scenario: input.scenario,
      simulated: true,
      realDisasterAuthorization: false,
      productionAuthorized: false,
      result: DR_SIM_ONLY,
    };
    store.drSims.push(sim);
    store.denials.push({
      id: randomUUID(),
      at: sim.at,
      reason: DR_SIM_ONLY,
    });
    await save(root, store);
    return { accepted: false, reason: DR_SIM_ONLY, sim };
  }

  const sim: DrSimulation = {
    id: randomUUID(),
    at: new Date().toISOString(),
    scenario: input.scenario,
    simulated: true,
    realDisasterAuthorization: false,
    productionAuthorized: false,
    result: 'DR simulation completed — no production disaster authorization issued.',
  };
  store.drSims.push(sim);
  await save(root, store);
  return { accepted: true, sim };
}

export function brainMeshHonesty() {
  return {
    locks: BP_LOCKS,
    offlineIslandUnbounded: BP_LOCKS.OFFLINE_ISLAND_UNBOUNDED,
    rejoinAutoTrustRemote: BP_LOCKS.REJOIN_AUTO_TRUST_REMOTE,
    drSimIsRealAuth: BP_LOCKS.DR_SIM_IS_REAL_DISASTER_AUTH,
    unconfiguredMeshState: BP_LOCKS.UNCONFIGURED_MESH_STATE,
    privacyAboveSpeedPrice: BP_LOCKS.PRIVACY_ABOVE_SPEED_PRICE,
    productionAuthorization: false as const,
  };
}
