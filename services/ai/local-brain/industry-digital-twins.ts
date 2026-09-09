import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { CAUSAL_WORLD_LOCKS, DIGITAL_TWIN_KINDS, type DigitalTwinKind } from './causal-world-types';

export type TwinVariable = {
  name: string;
  value: number;
  unit: string;
  epistemicClass: 'SIMULATION';
};

export type IndustryDigitalTwin = {
  id: string;
  tenantId: string;
  universeId: string;
  kind: DigitalTwinKind;
  label: string;
  variables: TwinVariable[];
  isReality: false;
  physicalControl: false;
  productionAuthorization: false;
  epistemicClass: 'SIMULATION';
  notes: string[];
  createdAt: string;
  updatedAt: string;
};

type Store = { twins: IndustryDigitalTwin[] };

const DEFAULT_VARS: Record<DigitalTwinKind, TwinVariable[]> = {
  business: [
    { name: 'revenueIndex', value: 1, unit: 'index', epistemicClass: 'SIMULATION' },
    { name: 'opexIndex', value: 1, unit: 'index', epistemicClass: 'SIMULATION' },
  ],
  supply_chain: [
    { name: 'leadTimeDays', value: 14, unit: 'days', epistemicClass: 'SIMULATION' },
    { name: 'fillRate', value: 0.92, unit: 'ratio', epistemicClass: 'SIMULATION' },
  ],
  manufacturing: [
    { name: 'throughput', value: 100, unit: 'units/day', epistemicClass: 'SIMULATION' },
    { name: 'yieldRate', value: 0.97, unit: 'ratio', epistemicClass: 'SIMULATION' },
  ],
  cloud_compute: [
    { name: 'utilization', value: 0.55, unit: 'ratio', epistemicClass: 'SIMULATION' },
    { name: 'p95LatencyMs', value: 180, unit: 'ms', epistemicClass: 'SIMULATION' },
  ],
  infrastructure: [
    { name: 'capacityIndex', value: 1, unit: 'index', epistemicClass: 'SIMULATION' },
    { name: 'incidentRate', value: 0.02, unit: 'events/day', epistemicClass: 'SIMULATION' },
  ],
  market_economic: [
    { name: 'demandIndex', value: 1, unit: 'index', epistemicClass: 'SIMULATION' },
    { name: 'priceIndex', value: 1, unit: 'index', epistemicClass: 'SIMULATION' },
  ],
  technology_adoption: [
    { name: 'adoptionShare', value: 0.12, unit: 'ratio', epistemicClass: 'SIMULATION' },
    { name: 'switchingCost', value: 0.4, unit: 'index', epistemicClass: 'SIMULATION' },
  ],
};

function storePath(root: string) {
  return xivLocalPath(root, 'industry-digital-twins.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { twins: [] });
  return { twins: Array.isArray(parsed.twins) ? parsed.twins : [] };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), { twins: store.twins.slice(-2_000) });
}

export function allTwinKinds(): DigitalTwinKind[] {
  return [...DIGITAL_TWIN_KINDS];
}

export async function upsertIndustryTwin(input: {
  tenantId: string;
  universeId: string;
  kind: DigitalTwinKind;
  label: string;
  variables?: Array<{ name: string; value: number; unit: string }>;
  root?: string;
}): Promise<IndustryDigitalTwin> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!DIGITAL_TWIN_KINDS.includes(input.kind)) throw new Error('UNKNOWN_DIGITAL_TWIN_KIND');
  if (!input.label.trim()) throw new Error('TWIN_LABEL_REQUIRED');
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const existing = store.twins.find(
    (twin) =>
      twin.tenantId === input.tenantId &&
      twin.universeId === input.universeId &&
      twin.kind === input.kind &&
      twin.label === input.label.trim(),
  );
  const variables: TwinVariable[] = (input.variables ?? DEFAULT_VARS[input.kind]).map((variable) => ({
    name: variable.name,
    value: variable.value,
    unit: variable.unit,
    epistemicClass: 'SIMULATION',
  }));
  const now = new Date().toISOString();
  if (existing) {
    existing.variables = variables;
    existing.updatedAt = now;
    existing.isReality = false;
    existing.physicalControl = false;
    existing.epistemicClass = 'SIMULATION';
    await save(root, store);
    return existing;
  }
  const twin: IndustryDigitalTwin = {
    id: cortexId('twin'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    label: input.label.trim(),
    variables,
    isReality: false,
    physicalControl: false,
    productionAuthorization: false,
    epistemicClass: 'SIMULATION',
    notes: [
      'Digital twin output is a simulation, not a verified fact and not physical control.',
      `kind=${input.kind}; physicalControl=false; isReality=false`,
    ],
    createdAt: now,
    updatedAt: now,
  };
  store.twins.push(twin);
  await save(root, store);
  return twin;
}

export async function getIndustryTwin(id: string, tenantId: string, universeId: string, root?: string) {
  const store = await load(root ?? process.cwd());
  return store.twins.find((twin) => twin.id === id && twin.tenantId === tenantId && twin.universeId === universeId) ?? null;
}

export async function listIndustryTwins(input: { tenantId: string; universeId: string; root?: string }) {
  const store = await load(input.root ?? process.cwd());
  return store.twins.filter((twin) => twin.tenantId === input.tenantId && twin.universeId === input.universeId);
}

export async function snapshotTwinVariables(twin: IndustryDigitalTwin): Promise<Record<string, number>> {
  return Object.fromEntries(twin.variables.map((variable) => [variable.name, variable.value]));
}

export function twinHonesty(twin: IndustryDigitalTwin) {
  return {
    isReality: twin.isReality,
    physicalControl: twin.physicalControl,
    epistemicClass: twin.epistemicClass,
    locks: CAUSAL_WORLD_LOCKS,
  };
}
