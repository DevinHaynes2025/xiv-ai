/**
 * 62L-BW Sparse Neural-Routing Fabric — connects consumers, businesses, software,
 * hardware, devices, agents, knowledge, workflows, evidence via sparse activation
 * + resource bounds. "Trillions" = logical sparse address space (partitioning /
 * sharding / streaming / compression / indexing / queues / routing), NOT live processes.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ACTIVATION_BOUNDED,
  BW_LOCKS,
  CAPACITY_UNVERIFIED,
  HONESTY_BANNER,
  TRILLION_PROCESSES_DENIED,
  type BwActor,
} from './planetary-chip-founder-avatar-ethics-types';

export type RouteEndpointKind =
  | 'consumer'
  | 'business'
  | 'software'
  | 'hardware'
  | 'device'
  | 'agent'
  | 'knowledge'
  | 'workflow'
  | 'evidence';

export type SparseCatalogEntry = {
  address: string;
  kind: RouteEndpointKind;
  materialized: false;
  processSpawned: false;
};

export type SparseRoute = {
  id: string;
  from: string;
  to: string;
  fromKind: RouteEndpointKind;
  toKind: RouteEndpointKind;
  activated: boolean;
  reason: string;
  createdAt: string;
};

type Store = {
  catalogSizeLogical: bigint | number;
  activatedRoutes: SparseRoute[];
  activeCount: number;
  capacityClaims: Array<{
    id: string;
    claim: string;
    labeledVerified: boolean;
    reason: string;
  }>;
};

/** Bound on concurrently activated sparse routes (not catalog size). */
export const MAX_ACTIVE_SPARSE_ROUTES = 128 as const;

/** Logical sparse address space size claim (not live processes). */
export const LOGICAL_CATALOG_ADDRESS_SPACE = 1_000_000_000_000n; // 1e12 logical addresses

function storePath(root: string) {
  return xivLocalPath(root, 'sparse-neural-routing-fabric.json');
}

async function load(root: string): Promise<Store> {
  const raw = await readJsonFile<Store & { catalogSizeLogical?: string | number }>(
    storePath(root),
    {
      catalogSizeLogical: Number(LOGICAL_CATALOG_ADDRESS_SPACE > BigInt(Number.MAX_SAFE_INTEGER)
        ? Number.MAX_SAFE_INTEGER
        : LOGICAL_CATALOG_ADDRESS_SPACE),
      activatedRoutes: [],
      activeCount: 0,
      capacityClaims: [],
    },
  );
  return {
    catalogSizeLogical:
      typeof raw.catalogSizeLogical === 'string'
        ? Number(raw.catalogSizeLogical)
        : raw.catalogSizeLogical,
    activatedRoutes: raw.activatedRoutes ?? [],
    activeCount: raw.activeCount ?? 0,
    capacityClaims: raw.capacityClaims ?? [],
  };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), {
    ...store,
    catalogSizeLogical: String(store.catalogSizeLogical),
    honesty: 'logical_sparse_address_space_not_live_processes',
  });
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function sparseRoutingHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: BW_LOCKS.L4_AUTONOMY_ENABLED,
    trillionLiveProcesses: BW_LOCKS.TRILLION_LIVE_PROCESSES,
    unlimitedCapacityClaim: BW_LOCKS.UNLIMITED_CAPACITY_CLAIM,
    sparseLogicalOnly: BW_LOCKS.SPARSE_LOGICAL_ONLY,
    capacityRequiresBenchmark: BW_LOCKS.CAPACITY_REQUIRES_BENCHMARK,
    maxActiveRoutes: MAX_ACTIVE_SPARSE_ROUTES,
    logicalCatalogAddressSpace: LOGICAL_CATALOG_ADDRESS_SPACE.toString(),
  };
}

/**
 * Address a catalog entry in the sparse logical space without spawning a process.
 */
export function addressSparseCatalog(input: {
  addressIndex: bigint | number;
  kind: RouteEndpointKind;
}): SparseCatalogEntry & { accepted: boolean; reason: string; processesSpawned: 0 } {
  const idx =
    typeof input.addressIndex === 'bigint' ? input.addressIndex : BigInt(input.addressIndex);
  if (idx < 0n || idx >= LOGICAL_CATALOG_ADDRESS_SPACE) {
    return {
      accepted: false,
      address: '',
      kind: input.kind,
      materialized: false,
      processSpawned: false,
      processesSpawned: 0,
      reason: 'ADDRESS_OUT_OF_LOGICAL_SPARSE_RANGE',
    };
  }
  return {
    accepted: true,
    address: `sparse://${input.kind}/${idx.toString(16)}`,
    kind: input.kind,
    materialized: false,
    processSpawned: false,
    processesSpawned: 0,
    reason: 'SPARSE_LOGICAL_ADDRESS_RESOLVED_NO_PROCESS',
  };
}

/**
 * Attempt to spawn "trillions of processes" — always DENIED. Catalog remains addressable.
 */
export async function attemptSpawnTrillionProcesses(input: {
  requestedProcesses: number | bigint;
  actor: BwActor;
  root?: string;
}) {
  const requested =
    typeof input.requestedProcesses === 'bigint'
      ? input.requestedProcesses
      : BigInt(Math.floor(input.requestedProcesses));
  if (requested > BigInt(MAX_ACTIVE_SPARSE_ROUTES)) {
    return {
      accepted: false as const,
      processesSpawned: 0 as const,
      reason: TRILLION_PROCESSES_DENIED,
      logicalCatalogAddressable: true as const,
      maxActiveRoutes: MAX_ACTIVE_SPARSE_ROUTES,
    };
  }
  return {
    accepted: false as const,
    processesSpawned: 0 as const,
    reason: TRILLION_PROCESSES_DENIED,
    logicalCatalogAddressable: true as const,
    maxActiveRoutes: MAX_ACTIVE_SPARSE_ROUTES,
  };
}

export async function activateSparseRoute(input: {
  from: string;
  to: string;
  fromKind: RouteEndpointKind;
  toKind: RouteEndpointKind;
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const active = store.activatedRoutes.filter((r) => r.activated).length;
  if (active >= MAX_ACTIVE_SPARSE_ROUTES) {
    return {
      accepted: false as const,
      reason: ACTIVATION_BOUNDED,
      activeCount: active,
      maxActive: MAX_ACTIVE_SPARSE_ROUTES,
      route: null,
    };
  }
  const route: SparseRoute = {
    id: id('sroute'),
    from: input.from,
    to: input.to,
    fromKind: input.fromKind,
    toKind: input.toKind,
    activated: true,
    reason: ACTIVATION_BOUNDED,
    createdAt: new Date().toISOString(),
  };
  store.activatedRoutes.push(route);
  store.activeCount = store.activatedRoutes.filter((r) => r.activated).length;
  await save(root, store);
  return {
    accepted: true as const,
    reason: 'SPARSE_ROUTE_ACTIVATED_BOUNDED',
    activeCount: store.activeCount,
    maxActive: MAX_ACTIVE_SPARSE_ROUTES,
    route,
    processesSpawned: 0 as const,
  };
}

export async function claimRoutingCapacity(input: {
  claim: string;
  evidenceRefs?: string[];
  forceVerifiedWithoutBenchmark?: boolean;
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const hasBench =
    Array.isArray(input.evidenceRefs) &&
    input.evidenceRefs.some((r) => /bench|benchmark|measure/i.test(r));
  if (input.forceVerifiedWithoutBenchmark || !hasBench) {
    const entry = {
      id: id('capclaim'),
      claim: input.claim,
      labeledVerified: false,
      reason: CAPACITY_UNVERIFIED,
    };
    store.capacityClaims.push(entry);
    await save(root, store);
    return {
      accepted: !input.forceVerifiedWithoutBenchmark,
      labeledVerified: false as const,
      reason: CAPACITY_UNVERIFIED,
      entry,
    };
  }
  const entry = {
    id: id('capclaim'),
    claim: input.claim,
    labeledVerified: true,
    reason: 'CAPACITY_CLAIM_VERIFIED_WITH_BENCHMARK',
  };
  store.capacityClaims.push(entry);
  await save(root, store);
  return {
    accepted: true as const,
    labeledVerified: true as const,
    reason: entry.reason,
    entry,
  };
}

export async function probeSparseCatalogStats(root?: string) {
  const store = await load(root ?? process.cwd());
  return {
    logicalCatalogAddressSpace: LOGICAL_CATALOG_ADDRESS_SPACE.toString(),
    activeRoutes: store.activatedRoutes.filter((r) => r.activated).length,
    maxActiveRoutes: MAX_ACTIVE_SPARSE_ROUTES,
    processesSpawned: 0,
    trillionLiveProcesses: false,
  };
}
