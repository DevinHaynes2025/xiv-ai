import { upsertIndustryTwin, listIndustryTwins, type IndustryDigitalTwin } from './industry-digital-twins';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import {
  NETWORK_ENTITY_KINDS,
  SIMULATION_IS_NOT_FACT,
  SUPPLY_CHAIN_LOCKS,
  type EpistemicClass,
  type NetworkEntityKind,
} from './supply-chain-types';
import type { DigitalTwinKind } from './causal-world-types';

export type NetworkEntity = {
  id: string;
  tenantId: string;
  universeId: string;
  kind: NetworkEntityKind;
  label: string;
  twinId: string;
  twinKind: DigitalTwinKind;
  attributes: Record<string, number | string>;
  epistemicClass: EpistemicClass;
  isReality: false;
  physicalControl: false;
  partnershipClaimed: false;
  productionAuthorization: false;
  notes: string[];
  createdAt: string;
  updatedAt: string;
};

type Store = { entities: NetworkEntity[] };

const KIND_TO_TWIN: Record<NetworkEntityKind, DigitalTwinKind> = {
  supplier: 'supply_chain',
  carrier: 'supply_chain',
  warehouse: 'supply_chain',
  plant: 'manufacturing',
  inventory: 'supply_chain',
  order: 'business',
  shipment: 'supply_chain',
  demand: 'market_economic',
  capacity: 'manufacturing',
  exception: 'supply_chain',
  lead_time: 'supply_chain',
  service_level: 'supply_chain',
  risk: 'supply_chain',
};

const KIND_VARS: Record<NetworkEntityKind, Array<{ name: string; value: number; unit: string }>> = {
  supplier: [
    { name: 'leadTimeDays', value: 14, unit: 'days' },
    { name: 'fillRate', value: 0.92, unit: 'ratio' },
  ],
  carrier: [
    { name: 'transitDays', value: 5, unit: 'days' },
    { name: 'onTimeRatio', value: 0.9, unit: 'ratio' },
  ],
  warehouse: [
    { name: 'utilization', value: 0.7, unit: 'ratio' },
    { name: 'pickRate', value: 120, unit: 'lines/hour' },
  ],
  plant: [
    { name: 'throughput', value: 100, unit: 'units/day' },
    { name: 'yieldRate', value: 0.97, unit: 'ratio' },
  ],
  inventory: [
    { name: 'onHand', value: 250, unit: 'units' },
    { name: 'safetyStock', value: 40, unit: 'units' },
  ],
  order: [
    { name: 'quantity', value: 80, unit: 'units' },
    { name: 'priority', value: 1, unit: 'index' },
  ],
  shipment: [
    { name: 'units', value: 80, unit: 'units' },
    { name: 'etaDays', value: 6, unit: 'days' },
  ],
  demand: [
    { name: 'demandIndex', value: 1, unit: 'index' },
    { name: 'units', value: 90, unit: 'units' },
  ],
  capacity: [
    { name: 'availableUnits', value: 110, unit: 'units' },
    { name: 'committedUnits', value: 40, unit: 'units' },
  ],
  exception: [
    { name: 'severity', value: 0.4, unit: 'index' },
    { name: 'openDays', value: 2, unit: 'days' },
  ],
  lead_time: [
    { name: 'leadTimeDays', value: 12, unit: 'days' },
    { name: 'varianceDays', value: 3, unit: 'days' },
  ],
  service_level: [
    { name: 'fillRate', value: 0.95, unit: 'ratio' },
    { name: 'otif', value: 0.88, unit: 'ratio' },
  ],
  risk: [
    { name: 'riskIndex', value: 0.3, unit: 'index' },
    { name: 'disruptionProbability', value: 0.08, unit: 'ratio' },
  ],
};

function storePath(root: string) {
  return xivLocalPath(root, 'supply-network-twins.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { entities: [] });
  return { entities: Array.isArray(parsed.entities) ? parsed.entities : [] };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), { entities: store.entities.slice(-4_000) });
}

function scopeKey(tenantId: string, universeId: string, kind: NetworkEntityKind, label: string) {
  return `${tenantId}::${universeId}::${kind}::${label.trim()}`;
}

export function allNetworkEntityKinds(): NetworkEntityKind[] {
  return [...NETWORK_ENTITY_KINDS];
}

export async function upsertNetworkEntity(input: {
  tenantId: string;
  universeId: string;
  kind: NetworkEntityKind;
  label: string;
  attributes?: Record<string, number | string>;
  epistemicClass?: EpistemicClass;
  root?: string;
}): Promise<NetworkEntity> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!NETWORK_ENTITY_KINDS.includes(input.kind)) throw new Error('UNKNOWN_NETWORK_ENTITY_KIND');
  if (!input.label.trim()) throw new Error('NETWORK_ENTITY_LABEL_REQUIRED');
  const root = input.root ?? process.cwd();
  const twinKind = KIND_TO_TWIN[input.kind];
  const twin = await upsertIndustryTwin({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: twinKind,
    label: `${input.kind}:${input.label.trim()}`,
    variables: KIND_VARS[input.kind],
    root,
  });
  const store = await load(root);
  const existing = store.entities.find(
    (entity) => scopeKey(entity.tenantId, entity.universeId, entity.kind, entity.label) === scopeKey(input.tenantId, input.universeId, input.kind, input.label),
  );
  const epistemicClass: EpistemicClass = input.epistemicClass ?? 'SIMULATION';
  if (epistemicClass === 'VERIFIED_FACT') {
    throw new Error('NETWORK_TWIN_CANNOT_SELF_CERTIFY_AS_FACT');
  }
  const now = new Date().toISOString();
  if (existing) {
    existing.attributes = { ...(input.attributes ?? existing.attributes) };
    existing.twinId = twin.id;
    existing.updatedAt = now;
    existing.epistemicClass = epistemicClass;
    existing.isReality = false;
    existing.physicalControl = false;
    existing.partnershipClaimed = false;
    await save(root, store);
    return existing;
  }
  const entity: NetworkEntity = {
    id: cortexId('scnode'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    label: input.label.trim(),
    twinId: twin.id,
    twinKind,
    attributes: input.attributes ?? {},
    epistemicClass,
    isReality: false,
    physicalControl: false,
    partnershipClaimed: false,
    productionAuthorization: false,
    notes: [SIMULATION_IS_NOT_FACT, `kind=${input.kind}; twinKind=${twinKind}; partnershipClaimed=false`],
    createdAt: now,
    updatedAt: now,
  };
  store.entities.push(entity);
  await save(root, store);
  return entity;
}

export async function listNetworkEntities(input: {
  tenantId: string;
  universeId: string;
  kind?: NetworkEntityKind;
  root?: string;
}): Promise<NetworkEntity[]> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const store = await load(input.root ?? process.cwd());
  return store.entities.filter(
    (entity) =>
      entity.tenantId === input.tenantId &&
      entity.universeId === input.universeId &&
      (!input.kind || entity.kind === input.kind),
  );
}

export async function getNetworkEntity(input: {
  id: string;
  tenantId: string;
  universeId: string;
  root?: string;
}): Promise<NetworkEntity | null> {
  const store = await load(input.root ?? process.cwd());
  return (
    store.entities.find(
      (entity) => entity.id === input.id && entity.tenantId === input.tenantId && entity.universeId === input.universeId,
    ) ?? null
  );
}

export type CrossUniverseRead = {
  allowed: false;
  reason: 'UNIVERSE_ISOLATION';
  leaked: false;
  rawDbMerge: false;
};

export async function readNetworkEntityAcrossUniverses(input: {
  id: string;
  fromTenantId: string;
  fromUniverseId: string;
  targetTenantId: string;
  targetUniverseId: string;
  root?: string;
}): Promise<NetworkEntity | CrossUniverseRead> {
  if (input.fromTenantId === input.targetTenantId && input.fromUniverseId === input.targetUniverseId) {
    return (await getNetworkEntity({
      id: input.id,
      tenantId: input.fromTenantId,
      universeId: input.fromUniverseId,
      root: input.root,
    })) as NetworkEntity;
  }
  return {
    allowed: false,
    reason: 'UNIVERSE_ISOLATION',
    leaked: false,
    rawDbMerge: false,
  };
}

export function entityHonesty(entity: NetworkEntity) {
  return {
    isReality: entity.isReality,
    physicalControl: entity.physicalControl,
    epistemicClass: entity.epistemicClass,
    partnershipClaimed: entity.partnershipClaimed,
    locks: SUPPLY_CHAIN_LOCKS,
  };
}

export async function linkedIndustryTwins(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}): Promise<IndustryDigitalTwin[]> {
  return listIndustryTwins({ tenantId: input.tenantId, universeId: input.universeId, root: input.root });
}
