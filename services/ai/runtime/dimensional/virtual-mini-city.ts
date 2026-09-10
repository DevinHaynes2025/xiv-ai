/**
 * 12D-14 — Virtual Mini City registry (SIMULATION-only catalog).
 * LOCAL / OFFLINE_PREFER_LOCAL stubs toward Virtual City + Neural Brain.
 * Catalog of virtual servers + virtual DB shards + pathways stubs.
 * No DDL / no PRODUCTION / accelerators UNVERIFIED.
 * Atomic Data Cell scale labels: aspirational vs measured (honesty only).
 */
import { isomorphicContentHash } from './datagene';
import {
  assertEthicsSafeCopy,
  BUSINESS_BAR_METRICS,
  HIGH_AUTONOMY_TARGETS,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  VALUATION_THEATER_ALLOWED,
} from './universe-ethics';
import { BUILDER_GUARDRAILS } from '../builder/policy';
import { OFFLINE_PREFER_LOCAL } from './ollama-local-writer';
import { ATOMIC_DATA_CELL_GUARDRAILS } from './atomic-data-cell';
import {
  createCityNode,
  createDefaultDatabaseCity,
  type BrainTier,
  type DatabaseCityNode,
  type DbEngineKind,
  type MemoryHeatTier,
  type SiliconCapabilityClaim,
} from './database-city';
import type { PathwayEdge } from './types';
import { findPathway } from './pathways';

export const VIRTUAL_MINI_CITY_SCHEMA_VERSION = '12d14.1' as const;

/** Locked: LOCAL only — never CLOUD_SANDBOX / PRODUCTION for this catalog. */
export const VIRTUAL_MINI_CITY_SAFE_ENVIRONMENTS = ['LOCAL'] as const;

export type VirtualServerRole =
  | 'pocket_edge'
  | 'local_shard_host'
  | 'pathway_relay'
  | 'neural_brain_stub'
  | 'catalog_registry';

export type VirtualDbShardKind = 'SQLITE' | 'OBJECT_STORE' | 'VECTOR_STUB' | 'GRAPH_STUB';

/** Honesty: ADC / city scale claims must say aspirational vs measured. */
export type ScaleClaimKind = 'aspirational' | 'measured';

export type ScaleClaim = {
  kind: ScaleClaimKind;
  metric: string;
  value: number | string;
  unit: string;
  notes: string;
};

export type VirtualServerStub = {
  serverId: string;
  role: VirtualServerRole;
  region: string | null;
  offlineCapable: true;
  productionAuthorized: false;
  simulationOnly: true;
  linkedNodeId: string | null;
  heat: MemoryHeatTier;
};

export type VirtualDbShardStub = {
  shardId: string;
  kind: VirtualDbShardKind;
  hostServerId: string;
  tier: BrainTier;
  engine: DbEngineKind;
  offlineEligible: true;
  ddlApplied: false;
  productionAuthorized: false;
  simulationOnly: true;
  heat: MemoryHeatTier;
};

export type VirtualPathwayStub = PathwayEdge & {
  pathwayKind: 'sync' | 'query' | 'catalog' | 'neural_stub';
  simulationOnly: true;
  liveCloudSyncClaimed: false;
};

export type VirtualMiniCityCatalog = {
  schemaVersion: typeof VIRTUAL_MINI_CITY_SCHEMA_VERSION;
  cityId: string;
  simulationOnly: true;
  preferredExecution: 'LOCAL';
  OFFLINE_PREFER_LOCAL: true;
  servers: readonly VirtualServerStub[];
  shards: readonly VirtualDbShardStub[];
  pathways: readonly VirtualPathwayStub[];
  scaleClaims: readonly ScaleClaim[];
  underlyingCityNodes: readonly DatabaseCityNode[];
  accelerators: readonly SiliconCapabilityClaim[];
  liveCloudSyncClaimed: false;
  productionAutoApply: false;
  ethicsNotice: string;
};

export const VIRTUAL_MINI_CITY_GUARDRAILS = {
  readOnly: true as const,
  simulationOnly: true as const,
  OFFLINE_PREFER_LOCAL: true as const,
  preferredExecution: 'LOCAL' as const,
  cloudSandboxAllowed: false as const,
  productionAllowed: false as const,
  productionAutoApply: false as const,
  productionAutoMerge: false as const,
  productionAutoDeploy: false as const,
  autonomousProductionDDL: false as const,
  autonomousProductionDML: false as const,
  destructiveDbAutoApply: false as const,
  L4_PRODUCTION_ENABLED: false as const,
  liveCloudSyncClaimed: false as const,
  liveCloudSyncFabricationAllowed: false as const,
  policyGateBypassAllowed: false as const,
  noDdl: true as const,
  noDml: true as const,
  noDeploy: true as const,
  /** Catalog stubs only — never materialize production infra. */
  materializeProductionInfraAllowed: false as const,
  acceleratorVerifiedAllowed: false as const,
  fakeVerifiedAcceleratorAllowed: false as const,
  /** ADC scale honesty: aspirational labels must not be presented as measured. */
  aspirationalScaleAsMeasuredAllowed: false as const,
  atomDbClaimAllowed: false as const,
  highAutonomyTargets: HIGH_AUTONOMY_TARGETS,
  executionAllowList: Object.freeze(['LOCAL'] as const),
  businessBarMetrics: BUSINESS_BAR_METRICS,
  VALUATION_THEATER_ALLOWED,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  ticket: '12D-14' as const,
  virtualMiniCityWire: 'WIRED' as const,
} as const;

function assertVirtualMiniCityGuardrails(): void {
  const g = VIRTUAL_MINI_CITY_GUARDRAILS;
  if (!g.readOnly) throw new Error('readOnly must remain true');
  if (!g.simulationOnly) throw new Error('simulationOnly must remain true');
  if (!g.OFFLINE_PREFER_LOCAL || !OFFLINE_PREFER_LOCAL) {
    throw new Error('OFFLINE_PREFER_LOCAL must remain true');
  }
  if (g.preferredExecution !== 'LOCAL') throw new Error('preferredExecution must remain LOCAL');
  if (g.cloudSandboxAllowed) throw new Error('cloudSandboxAllowed must remain false — LOCAL only');
  if (g.productionAllowed) throw new Error('productionAllowed must remain false');
  if (g.productionAutoApply || g.productionAutoMerge || g.productionAutoDeploy) {
    throw new Error('productionAuto* must remain false');
  }
  if (
    g.autonomousProductionDDL ||
    g.autonomousProductionDML ||
    BUILDER_GUARDRAILS.autonomousProductionDDL ||
    BUILDER_GUARDRAILS.autonomousProductionDML
  ) {
    throw new Error('autonomousProductionDDL/DML must remain false');
  }
  if (g.destructiveDbAutoApply) throw new Error('destructiveDbAutoApply must remain false');
  if (g.L4_PRODUCTION_ENABLED) throw new Error('L4_PRODUCTION_ENABLED must remain false');
  if (g.liveCloudSyncClaimed || g.liveCloudSyncFabricationAllowed) {
    throw new Error('liveCloudSyncClaimed/fabrication must remain false');
  }
  if (g.policyGateBypassAllowed) throw new Error('policyGateBypassAllowed must remain false');
  if (!g.noDdl || !g.noDml || !g.noDeploy) throw new Error('noDdl/noDml/noDeploy must remain true');
  if (g.materializeProductionInfraAllowed) {
    throw new Error('materializeProductionInfraAllowed must remain false');
  }
  if (g.acceleratorVerifiedAllowed || g.fakeVerifiedAcceleratorAllowed) {
    throw new Error('accelerators must remain UNVERIFIED — never fake VERIFIED');
  }
  if (g.aspirationalScaleAsMeasuredAllowed) {
    throw new Error('aspirational scale must never be labeled measured');
  }
  if (ATOMIC_DATA_CELL_GUARDRAILS.atomDbClaimAllowed || g.atomDbClaimAllowed) {
    throw new Error('atomDbClaimAllowed must remain false');
  }
  if (VALUATION_THEATER_ALLOWED) throw new Error('VALUATION_THEATER_ALLOWED must remain false');
  if (!UNIVERSES_ARE_SIMULATION_LAYERS_ONLY) {
    throw new Error('UNIVERSES_ARE_SIMULATION_LAYERS_ONLY must remain true');
  }
  if (![...g.executionAllowList].every((e) => e === 'LOCAL') || g.executionAllowList.length !== 1) {
    throw new Error('executionAllowList must be LOCAL only');
  }
}

/** Guardrail dump for evidence / Policy Gate alignment. */
export function dumpVirtualMiniCityGuardrails(): Readonly<Record<string, unknown>> {
  assertVirtualMiniCityGuardrails();
  return Object.freeze({
    ticket: VIRTUAL_MINI_CITY_GUARDRAILS.ticket,
    schemaVersion: VIRTUAL_MINI_CITY_SCHEMA_VERSION,
    readOnly: true,
    simulationOnly: true,
    OFFLINE_PREFER_LOCAL: true,
    preferredExecution: 'LOCAL',
    safeEnvironments: [...VIRTUAL_MINI_CITY_SAFE_ENVIRONMENTS],
    cloudSandboxAllowed: false,
    productionAllowed: false,
    productionAutoApply: false,
    productionAutoMerge: false,
    productionAutoDeploy: false,
    autonomousProductionDDL: false,
    autonomousProductionDML: false,
    destructiveDbAutoApply: false,
    L4_PRODUCTION_ENABLED: false,
    liveCloudSyncClaimed: false,
    liveCloudSyncFabricationAllowed: false,
    policyGateBypassAllowed: false,
    noDdl: true,
    noDml: true,
    noDeploy: true,
    materializeProductionInfraAllowed: false,
    acceleratorVerifiedAllowed: false,
    aspirationalScaleAsMeasuredAllowed: false,
    atomDbClaimAllowed: false,
    VALUATION_THEATER_ALLOWED: false,
    UNIVERSES_ARE_SIMULATION_LAYERS_ONLY: true,
    virtualMiniCityWire: 'WIRED',
  });
}

/** Accelerators: CPU may be VERIFIED; GPU/NPU/QPU stay UNVERIFIED (WAITING). */
export function virtualMiniCityAcceleratorClaims(): SiliconCapabilityClaim[] {
  assertVirtualMiniCityGuardrails();
  return [
    { backend: 'cpu', status: 'VERIFIED', notes: 'CPU-first LOCAL Virtual Mini City catalog; research only' },
    { backend: 'gpu', status: 'WAITING', notes: 'UNVERIFIED — never fake VERIFIED GPU' },
    { backend: 'npu', status: 'WAITING', notes: 'UNVERIFIED — never fake VERIFIED NPU' },
    { backend: 'qpu', status: 'WAITING', notes: 'UNVERIFIED — never fake VERIFIED QPU' },
  ];
}

export function assertVirtualMiniCityAcceleratorsUnverifiedExceptCpu(
  claims: readonly SiliconCapabilityClaim[],
): void {
  for (const claim of claims) {
    if (claim.backend !== 'cpu' && claim.status === 'VERIFIED') {
      throw new Error(claim.backend + ' must remain UNVERIFIED on 12D-14 Virtual Mini City path');
    }
  }
}

/** Default ADC / city scale claims — aspirational vs measured labeled honestly. */
export function defaultVirtualMiniCityScaleClaims(): ScaleClaim[] {
  assertVirtualMiniCityGuardrails();
  return [
    {
      kind: 'measured',
      metric: 'catalog_server_stubs',
      value: 4,
      unit: 'count',
      notes: 'Measured in this LOCAL SIMULATION catalog fixture only',
    },
    {
      kind: 'measured',
      metric: 'catalog_shard_stubs',
      value: 3,
      unit: 'count',
      notes: 'Measured fixture shard stubs — not production capacity',
    },
    {
      kind: 'aspirational',
      metric: 'atomic_data_cell_addressable_scale',
      value: '1e12+',
      unit: 'cells',
      notes: 'ASPIRATIONAL Atomic Data Cell scale — NOT measured; software analogy only',
    },
    {
      kind: 'aspirational',
      metric: 'neural_brain_federation_span',
      value: 'global',
      unit: 'tier',
      notes: 'ASPIRATIONAL Neural Brain federation — LOCAL stub only; no live cloud',
    },
  ];
}

export function assertScaleClaimsHonest(claims: readonly ScaleClaim[]): void {
  assertVirtualMiniCityGuardrails();
  for (const claim of claims) {
    if (claim.kind !== 'aspirational' && claim.kind !== 'measured') {
      throw new Error('scale claim kind must be aspirational|measured');
    }
    if (claim.kind === 'aspirational') {
      const notes = claim.notes.toLowerCase();
      if (!notes.includes('aspirational')) {
        throw new Error('aspirational scale claim notes must say aspirational');
      }
      if (/\bmeasured\b/i.test(claim.notes) && !/not measured/i.test(claim.notes)) {
        throw new Error('aspirational scale must not be presented as measured');
      }
    }
  }
}

export function createVirtualServerStub(input: {
  serverId: string;
  role: VirtualServerRole;
  linkedNodeId?: string | null;
  region?: string | null;
  heat?: MemoryHeatTier;
}): VirtualServerStub {
  assertVirtualMiniCityGuardrails();
  if (!input.serverId) throw new TypeError('serverId is required');
  return {
    serverId: input.serverId,
    role: input.role,
    region: input.region ?? null,
    offlineCapable: true,
    productionAuthorized: false,
    simulationOnly: true,
    linkedNodeId: input.linkedNodeId ?? null,
    heat: input.heat ?? 'hot',
  };
}

export function createVirtualDbShardStub(input: {
  shardId: string;
  kind: VirtualDbShardKind;
  hostServerId: string;
  tier?: BrainTier;
  engine?: DbEngineKind;
  heat?: MemoryHeatTier;
}): VirtualDbShardStub {
  assertVirtualMiniCityGuardrails();
  if (!input.shardId || !input.hostServerId) {
    throw new TypeError('shardId and hostServerId are required');
  }
  const tier = input.tier ?? 'local_shard';
  const defaultEngine: DbEngineKind =
    input.kind === 'SQLITE'
      ? 'SQLITE'
      : input.kind === 'OBJECT_STORE'
        ? 'OBJECT_STORE'
        : input.kind === 'VECTOR_STUB'
          ? 'VECTOR'
          : 'GRAPH';
  return {
    shardId: input.shardId,
    kind: input.kind,
    hostServerId: input.hostServerId,
    tier,
    engine: input.engine ?? defaultEngine,
    offlineEligible: true,
    ddlApplied: false,
    productionAuthorized: false,
    simulationOnly: true,
    heat: input.heat ?? 'hot',
  };
}

export function createVirtualPathwayStub(input: {
  from: string;
  to: string;
  weight?: number;
  evidenceScore?: number;
  pathwayKind?: VirtualPathwayStub['pathwayKind'];
}): VirtualPathwayStub {
  assertVirtualMiniCityGuardrails();
  if (!input.from || !input.to) throw new TypeError('from and to are required');
  return {
    from: input.from,
    to: input.to,
    weight: input.weight ?? 1,
    evidenceScore: input.evidenceScore ?? 0.8,
    pathwayKind: input.pathwayKind ?? 'catalog',
    simulationOnly: true,
    liveCloudSyncClaimed: false,
  };
}

/** Explicit ban: production DDL from Virtual Mini City catalog. */
export function applyVirtualMiniCityProductionDdl(): never {
  assertVirtualMiniCityGuardrails();
  throw new Error('12D-14 Virtual Mini City forbids production DDL');
}

/** Explicit ban: materialize production infra from catalog stubs. */
export function materializeVirtualMiniCityProductionInfra(): never {
  assertVirtualMiniCityGuardrails();
  throw new Error('12D-14 Virtual Mini City forbids materializing production infra from SIMULATION stubs');
}

/** Explicit ban: Policy Gate bypass. */
export function bypassPolicyGateViaVirtualMiniCity(): never {
  assertVirtualMiniCityGuardrails();
  throw new Error('12D-14 Virtual Mini City NEVER bypasses Policy Gate');
}

/** Explicit ban: re-label aspirational ADC scale as measured. */
export function labelAspirationalScaleAsMeasured(_metric: string): never {
  assertVirtualMiniCityGuardrails();
  throw new Error('12D-14 forbids labeling aspirational Atomic Data Cell scale as measured');
}

/**
 * Build SIMULATION-only Virtual Mini City catalog: servers + DB shards + pathways stubs.
 * LOCAL / OFFLINE_PREFER_LOCAL; no DDL; accelerators UNVERIFIED except CPU.
 */
export function buildVirtualMiniCityCatalog(input?: {
  cityId?: string;
  seed?: string;
  cityNodes?: readonly DatabaseCityNode[];
  scaleClaims?: readonly ScaleClaim[];
}): VirtualMiniCityCatalog {
  assertVirtualMiniCityGuardrails();
  const seed = input?.seed ?? 'xiv-12d14';
  const cityId = input?.cityId ?? seed + ':virtual-mini-city';
  const underlying = input?.cityNodes ?? createDefaultDatabaseCity(seed);
  const device = underlying.find((n) => n.tier === 'device') ?? createCityNode({
    nodeId: seed + ':device',
    tier: 'device',
    engine: 'SQLITE',
    memoryHeat: 'hot',
  });
  const localShard = underlying.find((n) => n.tier === 'local_shard') ?? createCityNode({
    nodeId: seed + ':local_shard',
    tier: 'local_shard',
    engine: 'SQLITE',
    memoryHeat: 'hot',
  });

  const servers: VirtualServerStub[] = [
    createVirtualServerStub({
      serverId: seed + ':srv:pocket',
      role: 'pocket_edge',
      linkedNodeId: device.nodeId,
      heat: 'hot',
    }),
    createVirtualServerStub({
      serverId: seed + ':srv:shard-host',
      role: 'local_shard_host',
      linkedNodeId: localShard.nodeId,
      heat: 'hot',
    }),
    createVirtualServerStub({
      serverId: seed + ':srv:pathway-relay',
      role: 'pathway_relay',
      linkedNodeId: null,
      heat: 'warm',
    }),
    createVirtualServerStub({
      serverId: seed + ':srv:neural-brain-stub',
      role: 'neural_brain_stub',
      linkedNodeId: null,
      heat: 'warm',
    }),
  ];

  const shards: VirtualDbShardStub[] = [
    createVirtualDbShardStub({
      shardId: seed + ':shard:sqlite-hot',
      kind: 'SQLITE',
      hostServerId: servers[1].serverId,
      tier: 'local_shard',
      heat: 'hot',
    }),
    createVirtualDbShardStub({
      shardId: seed + ':shard:object-store',
      kind: 'OBJECT_STORE',
      hostServerId: servers[1].serverId,
      tier: 'local_shard',
      heat: 'warm',
    }),
    createVirtualDbShardStub({
      shardId: seed + ':shard:vector-stub',
      kind: 'VECTOR_STUB',
      hostServerId: servers[3].serverId,
      tier: 'device',
      heat: 'hot',
    }),
  ];

  const pathways: VirtualPathwayStub[] = [
    createVirtualPathwayStub({
      from: servers[0].serverId,
      to: servers[1].serverId,
      pathwayKind: 'sync',
      weight: 1,
      evidenceScore: 0.9,
    }),
    createVirtualPathwayStub({
      from: servers[1].serverId,
      to: servers[2].serverId,
      pathwayKind: 'catalog',
      weight: 1.5,
      evidenceScore: 0.75,
    }),
    createVirtualPathwayStub({
      from: servers[2].serverId,
      to: servers[3].serverId,
      pathwayKind: 'neural_stub',
      weight: 2,
      evidenceScore: 0.7,
    }),
    createVirtualPathwayStub({
      from: shards[0].shardId,
      to: shards[2].shardId,
      pathwayKind: 'query',
      weight: 1.2,
      evidenceScore: 0.8,
    }),
  ];

  const scaleClaims = [...(input?.scaleClaims ?? defaultVirtualMiniCityScaleClaims())];
  assertScaleClaimsHonest(scaleClaims);

  const accelerators = virtualMiniCityAcceleratorClaims();
  assertVirtualMiniCityAcceleratorsUnverifiedExceptCpu(accelerators);

  const ethicsNotice =
    '12D-14 Virtual Mini City is a SIMULATION-only LOCAL / OFFLINE_PREFER_LOCAL catalog of ' +
    'virtual servers + virtual DB shards + pathways stubs toward Virtual City + Neural Brain. ' +
    'No DDL/DML/deploy. productionAuto*/L4/liveCloudSyncClaimed=false. Accelerators UNVERIFIED except CPU. ' +
    'Atomic Data Cell scale labeled aspirational vs measured (honesty only). Policy Gate intact. ' +
    'Universes = SIMULATION layers only.';
  assertEthicsSafeCopy(ethicsNotice, '12d14 virtual mini city ethicsNotice');

  return {
    schemaVersion: VIRTUAL_MINI_CITY_SCHEMA_VERSION,
    cityId,
    simulationOnly: true,
    preferredExecution: 'LOCAL',
    OFFLINE_PREFER_LOCAL: true,
    servers: Object.freeze(servers),
    shards: Object.freeze(shards),
    pathways: Object.freeze(pathways),
    scaleClaims: Object.freeze(scaleClaims),
    underlyingCityNodes: Object.freeze([...underlying]),
    accelerators: Object.freeze(accelerators),
    liveCloudSyncClaimed: false,
    productionAutoApply: false,
    ethicsNotice,
  };
}

/** Lookup helpers — read-only registry views. */
export function listVirtualServers(catalog: VirtualMiniCityCatalog): readonly VirtualServerStub[] {
  assertVirtualMiniCityGuardrails();
  return catalog.servers;
}

export function listVirtualDbShards(catalog: VirtualMiniCityCatalog): readonly VirtualDbShardStub[] {
  assertVirtualMiniCityGuardrails();
  return catalog.shards;
}

export function listVirtualPathways(catalog: VirtualMiniCityCatalog): readonly VirtualPathwayStub[] {
  assertVirtualMiniCityGuardrails();
  return catalog.pathways;
}

export function findVirtualPathway(
  catalog: VirtualMiniCityCatalog,
  from: string,
  to: string,
  minimumEvidence = 0.5,
) {
  assertVirtualMiniCityGuardrails();
  return findPathway(catalog.pathways, from, to, minimumEvidence);
}

export function getScaleClaimsByKind(
  catalog: VirtualMiniCityCatalog,
  kind: ScaleClaimKind,
): ScaleClaim[] {
  assertVirtualMiniCityGuardrails();
  return catalog.scaleClaims.filter((c) => c.kind === kind);
}

/** Evidence helper: content hash over guardrail dump + catalog summary. */
export function evidenceHashVirtualMiniCity(parts: {
  tipSha?: string;
  catalog?: VirtualMiniCityCatalog;
  testsPassed?: readonly string[];
}): string {
  assertVirtualMiniCityGuardrails();
  const catalog = parts.catalog;
  return isomorphicContentHash(
    JSON.stringify({
      schemaVersion: VIRTUAL_MINI_CITY_SCHEMA_VERSION,
      guardrails: dumpVirtualMiniCityGuardrails(),
      tipSha: parts.tipSha ?? null,
      cityId: catalog?.cityId ?? null,
      serverCount: catalog?.servers.length ?? 0,
      shardCount: catalog?.shards.length ?? 0,
      pathwayCount: catalog?.pathways.length ?? 0,
      scaleClaims: catalog?.scaleClaims ?? [],
      testsPassed: parts.testsPassed ?? [],
      liveCloudSyncClaimed: false,
      productionAutoApply: false,
      simulationOnly: true,
    }),
  );
}
