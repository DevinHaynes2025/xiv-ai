/**
 * 12D-04 Database City + Neural Highway Fabric
 * Topology: device → local shard → company brain → regional brain → global brain
 * Software contracts + local-safe stubs only — NOT live production DDL/DML.
 */

import { PRODUCTION_DIMENSIONAL_FABRIC_ENABLED } from './fabric';
import { BUILDER_GUARDRAILS } from '../builder/policy';
import { bridgeHistoricalRef, type HistoricalTemporalRef } from './historical-bridge';
import type { PathwayEdge } from './types';

export type BrainTier =
  | 'device'
  | 'local_shard'
  | 'company_brain'
  | 'regional_brain'
  | 'global_brain';

export type MemoryHeatTier = 'hot' | 'warm' | 'cold' | 'archive';

export type DbEngineKind = 'POSTGRES' | 'SQLITE' | 'VECTOR' | 'GRAPH' | 'OBJECT_STORE';

export type SiliconDetectStatus = 'WAITING' | 'DETECTED' | 'VERIFIED' | 'UNAVAILABLE';

export type CityNodeKind = 'pocket_brain' | 'local_shard' | 'company_brain' | 'regional_brain' | 'global_brain';

/** Pocket Brain never equals Global Brain — phones hold compressed local state only. */
export type PocketBrain = {
  kind: 'pocket_brain';
  nodeId: string;
  deviceId: string;
  holdsGlobalBrain: false;
  offlineCapable: true;
  memoryHeat: MemoryHeatTier;
  enginePreference: ReadonlyArray<DbEngineKind>;
};

export type GlobalBrain = {
  kind: 'global_brain';
  nodeId: string;
  federated: true;
  /** Global brain is federated aggregate — never materializes wholly on a device. */
  materializesOnDevice: false;
  memoryHeat: MemoryHeatTier;
};

export type DatabaseCityNode = {
  nodeId: string;
  tier: BrainTier;
  kind: CityNodeKind;
  region: string | null;
  engine: DbEngineKind;
  memoryHeat: MemoryHeatTier;
  offlineCapable: boolean;
  /** Sparse city-inside-chips metaphor: bounded neighbor degree, not millions of unstructured DBs. */
  maxDegree: number;
  holdsGlobalBrain: false;
};

export type NeuralHighwayEdge = PathwayEdge & {
  fromTier: BrainTier;
  toTier: BrainTier;
  highwayKind: 'sync' | 'query' | 'promote' | 'demote' | 'reconcile';
};

export type SiliconCapabilityClaim = {
  backend: 'cpu' | 'gpu' | 'npu' | 'qpu';
  status: SiliconDetectStatus;
  notes: string;
};

export const DATABASE_CITY_GUARDRAILS = {
  PRODUCTION_DIMENSIONAL_FABRIC_ENABLED,
  L4_PRODUCTION_ENABLED: false as const,
  autonomousProductionDDL: BUILDER_GUARDRAILS.autonomousProductionDDL,
  autonomousProductionDML: BUILDER_GUARDRAILS.autonomousProductionDML,
  autonomousDestructiveMigration: BUILDER_GUARDRAILS.autonomousDestructiveMigration,
  autonomousSecretCreation: BUILDER_GUARDRAILS.autonomousSecretCreation,
  autonomousDeployment: BUILDER_GUARDRAILS.autonomousDeployment,
  /** City is sparse partitioned topology — not millions of unstructured databases. */
  unstructuredMillionDbClaim: false as const,
  liveProductionDdlAllowed: false as const,
} as const;

/** Default soft caps for city node degree (sparse routing). */
export const DEFAULT_CITY_MAX_DEGREE: Readonly<Record<BrainTier, number>> = Object.freeze({
  device: 8,
  local_shard: 32,
  company_brain: 128,
  regional_brain: 256,
  global_brain: 1024,
});

export const MEMORY_HEAT_PROMOTION: Readonly<Record<MemoryHeatTier, MemoryHeatTier | null>> = Object.freeze({
  archive: 'cold',
  cold: 'warm',
  warm: 'hot',
  hot: null,
});

export const MEMORY_HEAT_DEMOTION: Readonly<Record<MemoryHeatTier, MemoryHeatTier | null>> = Object.freeze({
  hot: 'warm',
  warm: 'cold',
  cold: 'archive',
  archive: null,
});

const TIER_ORDER: readonly BrainTier[] = [
  'device',
  'local_shard',
  'company_brain',
  'regional_brain',
  'global_brain',
] as const;

export function brainTierRank(tier: BrainTier): number {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx < 0) throw new RangeError('unknown brain tier: ' + tier);
  return idx;
}

export function createPocketBrain(input: {
  nodeId: string;
  deviceId: string;
  memoryHeat?: MemoryHeatTier;
}): PocketBrain {
  if (!input.nodeId || !input.deviceId) throw new TypeError('nodeId and deviceId are required');
  return {
    kind: 'pocket_brain',
    nodeId: input.nodeId,
    deviceId: input.deviceId,
    holdsGlobalBrain: false,
    offlineCapable: true,
    memoryHeat: input.memoryHeat ?? 'hot',
    enginePreference: Object.freeze(['SQLITE', 'VECTOR', 'GRAPH'] as DbEngineKind[]),
  };
}

export function createGlobalBrain(input: { nodeId: string; memoryHeat?: MemoryHeatTier }): GlobalBrain {
  if (!input.nodeId) throw new TypeError('nodeId is required');
  return {
    kind: 'global_brain',
    nodeId: input.nodeId,
    federated: true,
    materializesOnDevice: false,
    memoryHeat: input.memoryHeat ?? 'warm',
  };
}

export function createCityNode(input: {
  nodeId: string;
  tier: BrainTier;
  region?: string | null;
  engine?: DbEngineKind;
  memoryHeat?: MemoryHeatTier;
  offlineCapable?: boolean;
  maxDegree?: number;
}): DatabaseCityNode {
  if (!input.nodeId) throw new TypeError('nodeId is required');
  if (DATABASE_CITY_GUARDRAILS.liveProductionDdlAllowed) {
    throw new Error('live production DDL must remain false');
  }
  const maxDegree = input.maxDegree ?? DEFAULT_CITY_MAX_DEGREE[input.tier];
  if (!Number.isInteger(maxDegree) || maxDegree < 1) {
    throw new RangeError('maxDegree must be a positive integer');
  }
  if (maxDegree > DEFAULT_CITY_MAX_DEGREE[input.tier] * 4) {
    throw new RangeError('maxDegree ' + String(maxDegree) + ' exceeds sparse city bound for ' + input.tier);
  }

  const kind: CityNodeKind =
    input.tier === 'device'
      ? 'pocket_brain'
      : input.tier === 'local_shard'
        ? 'local_shard'
        : input.tier === 'company_brain'
          ? 'company_brain'
          : input.tier === 'regional_brain'
            ? 'regional_brain'
            : 'global_brain';

  const defaultEngine: DbEngineKind =
    input.tier === 'device' || input.tier === 'local_shard' ? 'SQLITE' : 'POSTGRES';

  return {
    nodeId: input.nodeId,
    tier: input.tier,
    kind,
    region: input.region ?? null,
    engine: input.engine ?? defaultEngine,
    memoryHeat: input.memoryHeat ?? (input.tier === 'device' ? 'hot' : 'warm'),
    offlineCapable: input.offlineCapable ?? (input.tier === 'device' || input.tier === 'local_shard'),
    maxDegree,
    holdsGlobalBrain: false,
  };
}

/**
 * Canonical city ladder matching CEO diagram.
 * device → local shard → company brain → regional brain → global brain
 */
export function createDefaultDatabaseCity(seed = 'xiv-12d04'): DatabaseCityNode[] {
  return [
    createCityNode({ nodeId: seed + ':device', tier: 'device', region: 'edge', engine: 'SQLITE', memoryHeat: 'hot' }),
    createCityNode({
      nodeId: seed + ':local_shard',
      tier: 'local_shard',
      region: 'edge',
      engine: 'SQLITE',
      memoryHeat: 'hot',
    }),
    createCityNode({
      nodeId: seed + ':company',
      tier: 'company_brain',
      region: 'us-central',
      engine: 'POSTGRES',
      memoryHeat: 'warm',
    }),
    createCityNode({
      nodeId: seed + ':regional',
      tier: 'regional_brain',
      region: 'americas',
      engine: 'GRAPH',
      memoryHeat: 'warm',
    }),
    createCityNode({
      nodeId: seed + ':global',
      tier: 'global_brain',
      region: 'federated',
      engine: 'OBJECT_STORE',
      memoryHeat: 'cold',
    }),
  ];
}

/**
 * Sparse neural-highway edges between adjacent city tiers only (city-inside-chips).
 * Does not invent millions of unstructured database links.
 */
export function buildNeuralHighways(nodes: readonly DatabaseCityNode[]): NeuralHighwayEdge[] {
  const byTier = new Map<BrainTier, DatabaseCityNode>();
  for (const node of nodes) byTier.set(node.tier, node);

  const edges: NeuralHighwayEdge[] = [];
  for (let i = 0; i < TIER_ORDER.length - 1; i += 1) {
    const fromTier = TIER_ORDER[i];
    const toTier = TIER_ORDER[i + 1];
    const from = byTier.get(fromTier);
    const to = byTier.get(toTier);
    if (!from || !to) continue;
    edges.push({
      from: from.nodeId,
      to: to.nodeId,
      weight: 1 + i,
      evidenceScore: 0.9,
      fromTier,
      toTier,
      highwayKind: 'sync',
    });
    edges.push({
      from: to.nodeId,
      to: from.nodeId,
      weight: 1 + i,
      evidenceScore: 0.85,
      fromTier: toTier,
      toTier: fromTier,
      highwayKind: 'query',
    });
  }
  return edges;
}

export type CityRoutePlan = {
  path: string[];
  tiers: BrainTier[];
  edges: NeuralHighwayEdge[];
  sparse: true;
  productionAuthorized: false;
};

/**
 * Route along sparse neural highways between city tiers.
 * Rejects non-adjacent long-haul inventiveness — climb/descend the ladder.
 */
export function routeCityPath(
  nodes: readonly DatabaseCityNode[],
  fromTier: BrainTier,
  toTier: BrainTier,
): CityRoutePlan | null {
  const highways = buildNeuralHighways(nodes);
  const fromRank = brainTierRank(fromTier);
  const toRank = brainTierRank(toTier);
  if (fromRank === toRank) {
    const node = nodes.find((n) => n.tier === fromTier);
    if (!node) return null;
    return {
      path: [node.nodeId],
      tiers: [fromTier],
      edges: [],
      sparse: true,
      productionAuthorized: false,
    };
  }

  const ascending = toRank > fromRank;
  const sequence: BrainTier[] = [];
  if (ascending) {
    for (let r = fromRank; r <= toRank; r += 1) sequence.push(TIER_ORDER[r]);
  } else {
    for (let r = fromRank; r >= toRank; r -= 1) sequence.push(TIER_ORDER[r]);
  }

  const byTier = new Map(nodes.map((n) => [n.tier, n] as const));
  const path: string[] = [];
  const edges: NeuralHighwayEdge[] = [];
  for (let i = 0; i < sequence.length; i += 1) {
    const node = byTier.get(sequence[i]);
    if (!node) return null;
    path.push(node.nodeId);
    if (i > 0) {
      const edge = highways.find((e) => e.from === path[i - 1] && e.to === node.nodeId);
      if (!edge) return null;
      edges.push(edge);
    }
  }

  return { path, tiers: sequence, edges, sparse: true, productionAuthorized: false };
}

export function promoteMemoryHeat(tier: MemoryHeatTier): MemoryHeatTier {
  return MEMORY_HEAT_PROMOTION[tier] ?? tier;
}

export function demoteMemoryHeat(tier: MemoryHeatTier): MemoryHeatTier {
  return MEMORY_HEAT_DEMOTION[tier] ?? tier;
}

/**
 * Historical memory bridge reuse: map a temporal ref into a city highway edge stub.
 */
export function bridgeHistoryOntoCity(
  ref: HistoricalTemporalRef,
  fromTier: BrainTier,
  toTier: BrainTier,
): NeuralHighwayEdge {
  const bridged = bridgeHistoricalRef(ref);
  return {
    ...bridged,
    fromTier,
    toTier,
    highwayKind: 'reconcile',
  };
}

/** CPU-first silicon claims; GPU/NPU/QPU never fake VERIFIED. */
export function defaultSiliconClaims(): SiliconCapabilityClaim[] {
  return [
    {
      backend: 'cpu',
      status: 'VERIFIED',
      notes: 'CPU-first local path; research fabric only',
    },
    {
      backend: 'gpu',
      status: 'WAITING',
      notes: 'GPU DETECTED/VERIFIED only after device receipt — never fake VERIFIED',
    },
    {
      backend: 'npu',
      status: 'WAITING',
      notes: 'NPU WAITING until capability probe; never fake VERIFIED',
    },
    {
      backend: 'qpu',
      status: 'WAITING',
      notes: 'QPU WAITING_PROVIDER; never fake VERIFIED',
    },
  ];
}

export function markSiliconDetected(
  claims: readonly SiliconCapabilityClaim[],
  backend: SiliconCapabilityClaim['backend'],
): SiliconCapabilityClaim[] {
  return claims.map((claim) => {
    if (claim.backend !== backend) return claim;
    if (claim.backend === 'cpu') return claim;
    // Non-CPU: DETECTED is allowed; VERIFIED is never auto-granted here.
    return {
      ...claim,
      status: 'DETECTED',
      notes: backend.toUpperCase() + ' DETECTED - not VERIFIED without receipt',
    };
  });
}

export function assertNoFakeAcceleratorVerified(claims: readonly SiliconCapabilityClaim[]): void {
  for (const claim of claims) {
    if (claim.backend !== 'cpu' && claim.status === 'VERIFIED') {
      throw new Error(claim.backend + ' must not be VERIFIED without explicit device receipt workflow');
    }
  }
}
