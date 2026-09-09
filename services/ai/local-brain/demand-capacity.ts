import { listNetworkEntities, type NetworkEntity } from './supply-network-twins';
import { evaluateShareRequest } from './sc-sharing-gate';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { SIMULATION_IS_NOT_FACT, SUPPLY_CHAIN_LOCKS } from './supply-chain-types';

export type DemandCapacityMatch = {
  id: string;
  tenantId: string;
  universeId: string;
  demandId: string;
  capacityId: string;
  demandUnits: number;
  capacityAvailable: number;
  coveredUnits: number;
  shortfallUnits: number;
  epistemicClass: 'SIMULATION';
  isVerifiedFact: false;
  purchaseExecuted: false;
  crossEnterprise: false;
  notes: string[];
  createdAt: string;
};

export type MultiEchelonScenario = {
  id: string;
  tenantId: string;
  universeId: string;
  echelons: Array<{ kind: string; label: string; entityId: string }>;
  bottleneck: { kind: string; label: string; reason: string } | null;
  epistemicClass: 'SIMULATION';
  isVerifiedFact: false;
  notes: string[];
  createdAt: string;
};

type Store = { matches: DemandCapacityMatch[]; scenarios: MultiEchelonScenario[] };

function storePath(root: string) {
  return xivLocalPath(root, 'sc-demand-capacity.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { matches: [], scenarios: [] });
  return {
    matches: Array.isArray(parsed.matches) ? parsed.matches : [],
    scenarios: Array.isArray(parsed.scenarios) ? parsed.scenarios : [],
  };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), {
    matches: store.matches.slice(-2_000),
    scenarios: store.scenarios.slice(-2_000),
  });
}

function numericAttr(entity: NetworkEntity, key: string, fallback: number) {
  const value = entity.attributes[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export async function matchDemandToCapacity(input: {
  tenantId: string;
  universeId: string;
  demandId: string;
  capacityId: string;
  counterpartyTenantId?: string;
  counterpartyUniverseId?: string;
  root?: string;
}): Promise<DemandCapacityMatch | { allowed: false; reason: string; purchaseExecuted: false }> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  if (
    input.counterpartyTenantId &&
    input.counterpartyUniverseId &&
    (input.counterpartyTenantId !== input.tenantId || input.counterpartyUniverseId !== input.universeId)
  ) {
    const share = await evaluateShareRequest({
      fromTenantId: input.counterpartyTenantId,
      fromUniverseId: input.counterpartyUniverseId,
      toTenantId: input.tenantId,
      toUniverseId: input.universeId,
      purpose: 'cross-enterprise capacity match',
      fields: ['unused_capacity_detail'],
      root,
    });
    return {
      allowed: false,
      reason: share.reason,
      purchaseExecuted: false,
    };
  }

  const demand = (await listNetworkEntities({ tenantId: input.tenantId, universeId: input.universeId, kind: 'demand', root })).find(
    (entity) => entity.id === input.demandId,
  );
  const capacity = (await listNetworkEntities({ tenantId: input.tenantId, universeId: input.universeId, kind: 'capacity', root })).find(
    (entity) => entity.id === input.capacityId,
  );
  if (!demand || !capacity) {
    return { allowed: false, reason: 'DEMAND_OR_CAPACITY_NOT_IN_UNIVERSE', purchaseExecuted: false };
  }

  const demandUnits = numericAttr(demand, 'units', 0);
  const available = Math.max(0, numericAttr(capacity, 'availableUnits', 0) - numericAttr(capacity, 'committedUnits', 0));
  const coveredUnits = Math.min(demandUnits, available);
  const match: DemandCapacityMatch = {
    id: cortexId('scmatch'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    demandId: demand.id,
    capacityId: capacity.id,
    demandUnits,
    capacityAvailable: available,
    coveredUnits,
    shortfallUnits: Math.max(0, demandUnits - coveredUnits),
    epistemicClass: 'SIMULATION',
    isVerifiedFact: false,
    purchaseExecuted: false,
    crossEnterprise: false,
    notes: [SIMULATION_IS_NOT_FACT, 'Match is a recommendation. No purchase, contract, or trade was executed.'],
    createdAt: new Date().toISOString(),
  };
  const store = await load(root);
  store.matches.push(match);
  await save(root, store);
  return match;
}

export async function runMultiEchelonScenario(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}): Promise<MultiEchelonScenario> {
  const root = input.root ?? process.cwd();
  const entities = await listNetworkEntities({ tenantId: input.tenantId, universeId: input.universeId, root });
  const order = ['supplier', 'plant', 'warehouse', 'carrier', 'shipment'] as const;
  const echelons = order
    .map((kind) => entities.find((entity) => entity.kind === kind))
    .filter((entity): entity is NetworkEntity => Boolean(entity))
    .map((entity) => ({ kind: entity.kind, label: entity.label, entityId: entity.id }));

  const capacity = entities.find((entity) => entity.kind === 'capacity');
  const demand = entities.find((entity) => entity.kind === 'demand');
  const available = capacity ? numericAttr(capacity, 'availableUnits', 0) - numericAttr(capacity, 'committedUnits', 0) : 0;
  const demandUnits = demand ? numericAttr(demand, 'units', 0) : 0;
  const bottleneck =
    demand && capacity && available < demandUnits
      ? { kind: 'capacity', label: capacity.label, reason: `simulated shortfall ${demandUnits - available}` }
      : entities.find((entity) => entity.kind === 'risk')
        ? { kind: 'risk', label: entities.find((entity) => entity.kind === 'risk')!.label, reason: 'simulated risk node present' }
        : null;

  const scenario: MultiEchelonScenario = {
    id: cortexId('scech'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    echelons,
    bottleneck,
    epistemicClass: 'SIMULATION',
    isVerifiedFact: false,
    notes: [SIMULATION_IS_NOT_FACT, `locks.l4=${SUPPLY_CHAIN_LOCKS.l4AutonomyEnabled}`],
    createdAt: new Date().toISOString(),
  };
  const store = await load(root);
  store.scenarios.push(scenario);
  await save(root, store);
  return scenario;
}
