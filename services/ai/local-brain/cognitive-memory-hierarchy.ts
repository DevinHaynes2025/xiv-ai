import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BC_LOCKS,
  COGNITIVE_MEMORY_KINDS,
  MEMORY_HIERARCHY_LAYERS,
  type CognitiveMemoryKind,
  type MemoryHierarchyLayer,
  type MemoryTemperature,
} from './quantum-agentic-types';

export const DRAM_CAPACITY = 64;
export const NAND_CAPACITY = 256;
export const PRESSURE_HIGH_WATERMARK = 0.85;
export const PRESSURE_TARGET = 0.6;

export type CognitiveMemoryRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  kind: CognitiveMemoryKind;
  layer: MemoryHierarchyLayer;
  temperature: MemoryTemperature;
  label: string;
  summary: string;
  bytesEstimate: number;
  compressed: boolean;
  consolidatedFrom?: string[];
  sealed: boolean;
  claimState: 'hypothesis' | 'simulation' | 'verified_local' | 'contradiction';
  evidenceRefs: string[];
  pathwayStrength: number;
  createdAt: string;
  updatedAt: string;
  productionAuthorization: false;
  correlationIsCausation: false;
};

type HierarchyStore = {
  version: 1;
  dramIds: string[];
  nandIds: string[];
  records: CognitiveMemoryRecord[];
  checkpoints: Array<{ id: string; at: string; hop: string; recordIds: string[] }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'cognitive-memory-hierarchy.json');
}

async function load(root: string): Promise<HierarchyStore> {
  const parsed = await readJsonFile<HierarchyStore>(storePath(root), {
    version: 1,
    dramIds: [],
    nandIds: [],
    records: [],
    checkpoints: [],
  });
  return {
    version: 1,
    dramIds: Array.isArray(parsed.dramIds) ? parsed.dramIds : [],
    nandIds: Array.isArray(parsed.nandIds) ? parsed.nandIds : [],
    records: Array.isArray(parsed.records) ? parsed.records : [],
    checkpoints: Array.isArray(parsed.checkpoints) ? parsed.checkpoints : [],
  };
}

async function save(root: string, store: HierarchyStore) {
  await writeJsonFileAtomic(storePath(root), store);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function defaultTemperature(layer: MemoryHierarchyLayer): MemoryTemperature {
  if (layer === 'dram_working' || layer === 'hot_storage' || layer === 'agent_memory') return 'hot';
  if (layer === 'nand_ssd_persistent' || layer === 'warm_storage' || layer === 'neural_pathways') return 'warm';
  return 'cold';
}

export function listMemoryHierarchyLayers() {
  return [...MEMORY_HIERARCHY_LAYERS];
}

export function listCognitiveMemoryKinds() {
  return [...COGNITIVE_MEMORY_KINDS];
}

export async function writeCognitiveMemory(input: {
  tenantId: string;
  universeId: string;
  kind: CognitiveMemoryKind;
  label: string;
  summary: string;
  layer?: MemoryHierarchyLayer;
  sealed?: boolean;
  evidenceRefs?: string[];
  claimState?: CognitiveMemoryRecord['claimState'];
  bytesEstimate?: number;
  root?: string;
}): Promise<CognitiveMemoryRecord> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.label.trim() || !input.summary.trim()) throw new Error('MEMORY_CONTENT_REQUIRED');
  if (BC_LOCKS.CONSCIOUSNESS_CLAIMED || BC_LOCKS.SENTIENCE_CLAIMED) {
    throw new Error('INVARIANT_BROKEN_NO_CONSCIOUSNESS_CLAIMS');
  }
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const now = new Date().toISOString();
  const layer = input.layer ?? 'dram_working';
  const record: CognitiveMemoryRecord = {
    id: `cmem_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    layer,
    temperature: defaultTemperature(layer),
    label: input.label.trim(),
    summary: input.summary.trim(),
    bytesEstimate: Math.max(1, input.bytesEstimate ?? input.summary.length + input.label.length),
    compressed: false,
    sealed: input.sealed === true,
    claimState: input.claimState ?? 'hypothesis',
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    pathwayStrength: 0.35,
    createdAt: now,
    updatedAt: now,
    productionAuthorization: false,
    correlationIsCausation: false,
  };
  store.records.push(record);
  if (layer === 'dram_working') {
    store.dramIds.push(record.id);
    if (store.dramIds.length > DRAM_CAPACITY) {
      const spilled = store.dramIds.shift()!;
      const spilledRec = store.records.find((r) => r.id === spilled);
      if (spilledRec && spilledRec.tenantId === input.tenantId) {
        spilledRec.layer = 'nand_ssd_persistent';
        spilledRec.temperature = 'warm';
        spilledRec.updatedAt = now;
        store.nandIds.push(spilled);
      }
    }
  } else if (layer === 'nand_ssd_persistent') {
    store.nandIds.push(record.id);
    if (store.nandIds.length > NAND_CAPACITY) {
      const coldId = store.nandIds.shift()!;
      const coldRec = store.records.find((r) => r.id === coldId);
      if (coldRec) {
        coldRec.layer = 'cold_storage';
        coldRec.temperature = 'cold';
        coldRec.updatedAt = now;
      }
    }
  }
  await save(root, store);
  return record;
}

export async function recallCognitiveMemory(input: {
  tenantId: string;
  universeId: string;
  kind?: CognitiveMemoryKind;
  layer?: MemoryHierarchyLayer;
  temperature?: MemoryTemperature;
  query?: string;
  includeSealed?: boolean;
  root?: string;
}): Promise<CognitiveMemoryRecord[]> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const store = await load(input.root ?? process.cwd());
  const needle = input.query?.trim().toLowerCase() ?? '';
  return store.records.filter((rec) => {
    if (rec.tenantId !== input.tenantId || rec.universeId !== input.universeId) return false;
    if (rec.sealed && input.includeSealed !== true) return false;
    if (input.kind && rec.kind !== input.kind) return false;
    if (input.layer && rec.layer !== input.layer) return false;
    if (input.temperature && rec.temperature !== input.temperature) return false;
    if (!needle) return true;
    return `${rec.label} ${rec.summary} ${rec.kind}`.toLowerCase().includes(needle);
  });
}

export async function promoteMemoryTier(input: {
  id: string;
  tenantId: string;
  universeId: string;
  temperature: MemoryTemperature;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const rec = store.records.find(
    (r) => r.id === input.id && r.tenantId === input.tenantId && r.universeId === input.universeId,
  );
  if (!rec) return { promoted: false as const, reason: 'MEMORY_NOT_FOUND' };
  rec.temperature = input.temperature;
  if (input.temperature === 'hot') rec.layer = 'hot_storage';
  else if (input.temperature === 'warm') rec.layer = 'warm_storage';
  else rec.layer = 'cold_storage';
  rec.updatedAt = new Date().toISOString();
  await save(root, store);
  return { promoted: true as const, record: rec };
}

export async function measureMemoryPressure(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const store = await load(input.root ?? process.cwd());
  const scoped = store.records.filter(
    (r) => r.tenantId === input.tenantId && r.universeId === input.universeId,
  );
  const dramScoped = store.dramIds.filter((id) => scoped.some((r) => r.id === id));
  const ratio = dramScoped.length / DRAM_CAPACITY;
  return {
    dramUsed: dramScoped.length,
    dramCapacity: DRAM_CAPACITY,
    pressure: clamp01(ratio),
    high: ratio >= PRESSURE_HIGH_WATERMARK,
    nandUsed: store.nandIds.filter((id) => scoped.some((r) => r.id === id)).length,
    nandCapacity: NAND_CAPACITY,
    totalRecords: scoped.length,
  };
}

export async function manageMemoryPressure(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const before = await measureMemoryPressure({ ...input, root });
  if (!before.high) {
    return { acted: false as const, before, after: before, spilled: [] as string[] };
  }
  const store = await load(root);
  const spilled: string[] = [];
  const now = new Date().toISOString();
  while (
    store.dramIds.filter((id) =>
      store.records.some((r) => r.id === id && r.tenantId === input.tenantId && r.universeId === input.universeId),
    ).length /
      DRAM_CAPACITY >
      PRESSURE_TARGET
  ) {
    const next = store.dramIds.find((id) =>
      store.records.some((r) => r.id === id && r.tenantId === input.tenantId && r.universeId === input.universeId),
    );
    if (!next) break;
    store.dramIds = store.dramIds.filter((id) => id !== next);
    const rec = store.records.find((r) => r.id === next)!;
    rec.layer = 'nand_ssd_persistent';
    rec.temperature = 'warm';
    rec.updatedAt = now;
    store.nandIds.push(next);
    spilled.push(next);
  }
  await save(root, store);
  const after = await measureMemoryPressure({ ...input, root });
  return { acted: true as const, before, after, spilled };
}

export async function compressAndConsolidate(input: {
  tenantId: string;
  universeId: string;
  kind: CognitiveMemoryKind;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const candidates = store.records.filter(
    (r) =>
      r.tenantId === input.tenantId &&
      r.universeId === input.universeId &&
      r.kind === input.kind &&
      !r.compressed &&
      !r.sealed,
  );
  if (candidates.length < 2) {
    return {
      consolidated: false as const,
      reason: 'Need at least two uncompressed records of the same kind.',
      record: null as CognitiveMemoryRecord | null,
    };
  }
  const now = new Date().toISOString();
  const sources = candidates.slice(0, 4);
  const bytes = Math.max(1, Math.floor(sources.reduce((sum, r) => sum + r.bytesEstimate, 0) * 0.45));
  const consolidated: CognitiveMemoryRecord = {
    id: `cmem_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    layer: 'databases_knowledge_warehouse',
    temperature: 'warm',
    label: `consolidated:${input.kind}`,
    summary: sources.map((r) => r.summary).join(' | ').slice(0, 500),
    bytesEstimate: bytes,
    compressed: true,
    consolidatedFrom: sources.map((r) => r.id),
    sealed: false,
    claimState: 'hypothesis',
    evidenceRefs: sources.flatMap((r) => r.evidenceRefs),
    pathwayStrength: clamp01(sources.reduce((s, r) => s + r.pathwayStrength, 0) / sources.length),
    createdAt: now,
    updatedAt: now,
    productionAuthorization: false,
    correlationIsCausation: false,
  };
  for (const src of sources) {
    src.layer = 'cold_storage';
    src.temperature = 'cold';
    src.compressed = true;
    src.updatedAt = now;
  }
  store.records.push(consolidated);
  await save(root, store);
  return { consolidated: true as const, reason: 'Compressed and consolidated into warehouse tier.', record: consolidated };
}

export async function checkpointMemoryHierarchy(input: {
  tenantId: string;
  universeId: string;
  hop: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const ids = store.records
    .filter((r) => r.tenantId === input.tenantId && r.universeId === input.universeId)
    .map((r) => r.id);
  const entry = { id: `mcp_${randomUUID()}`, at: new Date().toISOString(), hop: input.hop, recordIds: ids };
  store.checkpoints.push(entry);
  if (store.checkpoints.length > 500) store.checkpoints = store.checkpoints.slice(-500);
  await save(root, store);
  return entry;
}

export async function recoverFromCheckpoint(input: {
  tenantId: string;
  universeId: string;
  checkpointId: string;
  root?: string;
}) {
  const store = await load(input.root ?? process.cwd());
  const cp = store.checkpoints.find((c) => c.id === input.checkpointId);
  if (!cp) return { recovered: false as const, reason: 'CHECKPOINT_NOT_FOUND', records: [] as CognitiveMemoryRecord[] };
  const records = store.records.filter(
    (r) =>
      r.tenantId === input.tenantId &&
      r.universeId === input.universeId &&
      cp.recordIds.includes(r.id),
  );
  return { recovered: true as const, reason: 'Recovered record set from checkpoint (local only).', records, checkpoint: cp };
}

export async function placeInWarehouse(input: {
  id: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const rec = store.records.find(
    (r) => r.id === input.id && r.tenantId === input.tenantId && r.universeId === input.universeId,
  );
  if (!rec) return { placed: false as const, reason: 'MEMORY_NOT_FOUND' };
  rec.layer = 'databases_knowledge_warehouse';
  rec.temperature = 'warm';
  rec.updatedAt = new Date().toISOString();
  await save(root, store);
  return { placed: true as const, record: rec };
}

export async function attachAgentMemory(input: {
  id: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const rec = store.records.find(
    (r) => r.id === input.id && r.tenantId === input.tenantId && r.universeId === input.universeId,
  );
  if (!rec) return { attached: false as const, reason: 'MEMORY_NOT_FOUND' };
  rec.layer = 'agent_memory';
  rec.temperature = 'hot';
  rec.updatedAt = new Date().toISOString();
  await save(root, store);
  return { attached: true as const, record: rec };
}

export async function strengthenNeuralPathway(input: {
  id: string;
  tenantId: string;
  universeId: string;
  delta: number;
  evidenceRefs: string[];
  root?: string;
}) {
  if (input.evidenceRefs.length === 0) {
    return { strengthened: false as const, reason: 'Evidence refs required; agent agreement alone is not evidence.' };
  }
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const rec = store.records.find(
    (r) => r.id === input.id && r.tenantId === input.tenantId && r.universeId === input.universeId,
  );
  if (!rec) return { strengthened: false as const, reason: 'MEMORY_NOT_FOUND' };
  rec.pathwayStrength = clamp01(rec.pathwayStrength + input.delta);
  rec.layer = 'neural_pathways';
  rec.evidenceRefs = [...new Set([...rec.evidenceRefs, ...input.evidenceRefs])];
  rec.updatedAt = new Date().toISOString();
  await save(root, store);
  return { strengthened: true as const, record: rec };
}
