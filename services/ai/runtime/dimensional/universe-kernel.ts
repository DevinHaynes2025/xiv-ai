/**
 * 12D-05 XIV Universe Simulation Kernel
 * Persistent virtual Universes connected to Database City routing.
 * SIMULATION layers only — not literal worlds, portals, or galaxies.
 */
import { isomorphicContentHash } from './datagene';
import type { MemoryHeatTier } from './database-city';
import { createDefaultDatabaseCity, routeCityPath, type DatabaseCityNode } from './database-city';
import type { HistoricalStance } from './historical-bridge';
import { routeDatabaseCity, type DatabaseNode, type HighwayRequest, type HighwayRoute } from '../databasecity';
import {
  UNIVERSE_KERNEL_GUARDRAILS,
  assertUniverseKernelGuardrails,
  isHighAutonomyTarget,
  type BusinessBarMetric,
  type HighAutonomyTarget,
} from './universe-ethics';

export type UniverseId = string;

export type SpatialCoordinate = {
  /** Geographic lon in degrees [-180, 180] — map projection only. */
  lon: number;
  /** Geographic lat in degrees [-90, 90] — map projection only. */
  lat: number;
  /** Optional altitude meters (schema only; not a physical portal). */
  altMeters?: number;
  /** Optional XR-ready local frame (meters) — contracts only, no fake XR render. */
  localXyz?: readonly [number, number, number];
};

export type DigitalCompany = {
  companyId: string;
  name: string;
  sector: string;
  tenantId: string;
  location: SpatialCoordinate;
  memoryHeat: MemoryHeatTier;
};

export type SupplyChainLink = {
  linkId: string;
  fromCompanyId: string;
  toCompanyId: string;
  sku: string;
  leadTimeHours: number;
  reliabilityScore: number;
};

export type EconomicSignal = {
  signalId: string;
  metric: BusinessBarMetric;
  /** Measurable unit value — never a company valuation claim. */
  value: number;
  unit: string;
  stance: HistoricalStance;
};

export type AgentPopulationSpec = {
  populationId: string;
  role: string;
  count: number;
  tenantId: string;
  offlineCapable: boolean;
};

export type WorldStateEntity = {
  entityId: string;
  kind: 'company' | 'agent' | 'facility' | 'route' | 'signal';
  location: SpatialCoordinate;
  memoryHeat: MemoryHeatTier;
  stance: HistoricalStance;
  payloadHash: string;
};

export type UniverseScenarioBranch = {
  branchId: string;
  parentUniverseId: UniverseId;
  stance: HistoricalStance;
  label: string;
  createdAt: string;
};

export type SimulatedUniverse = {
  universeId: UniverseId;
  tenantId: string;
  /** Always simulation — never a literal world claim. */
  layerKind: 'SIMULATION';
  label: string;
  citySeed: string;
  cityNodes: DatabaseCityNode[];
  companies: DigitalCompany[];
  supplyLinks: SupplyChainLink[];
  economicSignals: EconomicSignal[];
  agentPopulations: AgentPopulationSpec[];
  worldState: WorldStateEntity[];
  branches: UniverseScenarioBranch[];
  productionAuthorized: false;
  quantumAdvantageClaimed: false;
  physicalPortal: false;
};

export type UniverseRoutePlan = {
  universeId: UniverseId;
  cityPath: ReturnType<typeof routeCityPath>;
  multiCloudRoute: HighwayRoute | null;
  target: HighAutonomyTarget;
  productionAuthorized: false;
};

export type CreateUniverseInput = {
  universeId: UniverseId;
  tenantId: string;
  label: string;
  citySeed?: string;
  companies?: DigitalCompany[];
  supplyLinks?: SupplyChainLink[];
  economicSignals?: EconomicSignal[];
  agentPopulations?: AgentPopulationSpec[];
  worldState?: WorldStateEntity[];
};

function clampLon(lon: number): number {
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new RangeError('lon must be in [-180, 180]');
  }
  return lon;
}

function clampLat(lat: number): number {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new RangeError('lat must be in [-90, 90]');
  }
  return lat;
}

export function createSpatialCoordinate(input: SpatialCoordinate): SpatialCoordinate {
  const coord: SpatialCoordinate = {
    lon: clampLon(input.lon),
    lat: clampLat(input.lat),
  };
  if (input.altMeters !== undefined) {
    if (!Number.isFinite(input.altMeters)) throw new RangeError('altMeters must be finite');
    coord.altMeters = input.altMeters;
  }
  if (input.localXyz) {
    if (input.localXyz.length !== 3 || input.localXyz.some((n) => !Number.isFinite(n))) {
      throw new RangeError('localXyz must be three finite numbers (XR schema only)');
    }
    coord.localXyz = Object.freeze([...input.localXyz]) as readonly [number, number, number];
  }
  return coord;
}

export function createSimulatedUniverse(input: CreateUniverseInput): SimulatedUniverse {
  assertUniverseKernelGuardrails();
  if (!input.universeId || !input.tenantId || !input.label) {
    throw new TypeError('universeId, tenantId, and label are required');
  }
  const citySeed = input.citySeed ?? 'xiv-universe:' + input.universeId;
  return {
    universeId: input.universeId,
    tenantId: input.tenantId,
    layerKind: 'SIMULATION',
    label: input.label,
    citySeed,
    cityNodes: createDefaultDatabaseCity(citySeed),
    companies: [...(input.companies ?? [])],
    supplyLinks: [...(input.supplyLinks ?? [])],
    economicSignals: [...(input.economicSignals ?? [])],
    agentPopulations: [...(input.agentPopulations ?? [])],
    worldState: [...(input.worldState ?? [])],
    branches: [],
    productionAuthorized: false,
    quantumAdvantageClaimed: false,
    physicalPortal: false,
  };
}

export function addCompany(universe: SimulatedUniverse, company: DigitalCompany): SimulatedUniverse {
  if (company.tenantId !== universe.tenantId) {
    throw new Error('cross-tenant company attach blocked');
  }
  return {
    ...universe,
    companies: [...universe.companies, { ...company, location: createSpatialCoordinate(company.location) }],
  };
}

export function addSupplyLink(universe: SimulatedUniverse, link: SupplyChainLink): SimulatedUniverse {
  const ids = new Set(universe.companies.map((c) => c.companyId));
  if (!ids.has(link.fromCompanyId) || !ids.has(link.toCompanyId)) {
    throw new Error('supply link endpoints must exist in universe companies');
  }
  if (!(link.reliabilityScore >= 0 && link.reliabilityScore <= 1)) {
    throw new RangeError('reliabilityScore must be in [0,1]');
  }
  return { ...universe, supplyLinks: [...universe.supplyLinks, link] };
}

export function addEconomicSignal(universe: SimulatedUniverse, signal: EconomicSignal): SimulatedUniverse {
  if (UNIVERSE_KERNEL_GUARDRAILS.VALUATION_THEATER_ALLOWED) {
    throw new Error('valuation theater must remain false');
  }
  // Reject valuation-theater metric names even if typed loosely at runtime.
  const banned = /valuation|market.?cap|trillion/i;
  if (banned.test(signal.metric) || banned.test(signal.unit)) {
    throw new Error('economic signals limited to business-bar metrics only');
  }
  return { ...universe, economicSignals: [...universe.economicSignals, signal] };
}

export function addAgentPopulation(
  universe: SimulatedUniverse,
  population: AgentPopulationSpec,
): SimulatedUniverse {
  if (population.tenantId !== universe.tenantId) {
    throw new Error('cross-tenant agent population blocked');
  }
  if (!Number.isInteger(population.count) || population.count < 0) {
    throw new RangeError('count must be a non-negative integer');
  }
  return { ...universe, agentPopulations: [...universe.agentPopulations, population] };
}

export function upsertWorldStateEntity(
  universe: SimulatedUniverse,
  entity: Omit<WorldStateEntity, 'payloadHash'> & { payload: unknown },
): SimulatedUniverse {
  const payloadHash = isomorphicContentHash(JSON.stringify(entity.payload));
  const next: WorldStateEntity = {
    entityId: entity.entityId,
    kind: entity.kind,
    location: createSpatialCoordinate(entity.location),
    memoryHeat: entity.memoryHeat,
    stance: entity.stance,
    payloadHash,
  };
  const others = universe.worldState.filter((e) => e.entityId !== next.entityId);
  return { ...universe, worldState: [...others, next] };
}

/**
 * Scenario branching: OBSERVED vs HYPOTHESIS vs SIMULATION labels.
 * Branches are simulation overlays — never literal parallel worlds.
 */
export function branchScenario(
  universe: SimulatedUniverse,
  input: { branchId: string; stance: HistoricalStance; label: string; createdAt?: string },
): { universe: SimulatedUniverse; branch: UniverseScenarioBranch } {
  if (!input.branchId || !input.label) throw new TypeError('branchId and label required');
  const branch: UniverseScenarioBranch = {
    branchId: input.branchId,
    parentUniverseId: universe.universeId,
    stance: input.stance,
    label: input.label,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  return { universe: { ...universe, branches: [...universe.branches, branch] }, branch };
}

/**
 * Connect Database City ladder routing + multi-cloud neural highway to a universe.
 * High-autonomy targets: LOCAL | CLOUD_SANDBOX only.
 */
export function routeUniverseThroughCity(
  universe: SimulatedUniverse,
  multiCloudNodes: readonly DatabaseNode[],
  highwayRequest: HighwayRequest,
  target: HighAutonomyTarget,
): UniverseRoutePlan {
  assertUniverseKernelGuardrails();
  if (!isHighAutonomyTarget(target)) {
    throw new Error('only LOCAL and CLOUD_SANDBOX targets are permitted');
  }
  if (highwayRequest.tenantId !== universe.tenantId) {
    throw new Error('highway request tenant must match universe tenant');
  }
  const cityPath = routeCityPath(universe.cityNodes, 'device', 'company_brain');
  const multiCloudRoute = routeDatabaseCity([...multiCloudNodes], highwayRequest);
  return {
    universeId: universe.universeId,
    cityPath,
    multiCloudRoute,
    target,
    productionAuthorized: false,
  };
}

/** Wire city memory heat into world-state entities (HOT/WARM/COLD/ARCHIVE mapping). */
export function applyMemoryHeatToWorldState(
  universe: SimulatedUniverse,
  entityId: string,
  heat: MemoryHeatTier,
): SimulatedUniverse {
  const worldState = universe.worldState.map((e) =>
    e.entityId === entityId ? { ...e, memoryHeat: heat } : e,
  );
  return { ...universe, worldState };
}

export function universeFingerprint(universe: SimulatedUniverse): string {
  return isomorphicContentHash(
    JSON.stringify({
      universeId: universe.universeId,
      tenantId: universe.tenantId,
      layerKind: universe.layerKind,
      companies: universe.companies.map((c) => c.companyId).sort(),
      links: universe.supplyLinks.map((l) => l.linkId).sort(),
      entities: universe.worldState.map((e) => e.entityId + ':' + e.payloadHash).sort(),
      branches: universe.branches.map((b) => b.branchId).sort(),
    }),
  );
}
