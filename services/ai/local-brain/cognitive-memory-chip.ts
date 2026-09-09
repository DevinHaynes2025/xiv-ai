import { createHash, randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BD_LOCKS,
  MEMORY_SUBSTRATES,
  type BdActor,
  type MemorySubstrate,
  type SubstrateCapability,
} from './cognitive-memory-types';

export const MEMORY_CHIP_FILE = 'cognitive-memory-chip.json';
export const BRAIN_SNAPSHOT_FILE = 'brain-snapshots.json';

export type ContextAllocation = {
  id: string;
  tenantId: string;
  universeId: string;
  agentId: string;
  modelId: string;
  maxTokens: number;
  usedTokens: number;
  substrate: MemorySubstrate;
  createdAt: string;
  bounded: true;
};

export type CacheEntry = {
  key: string;
  tenantId: string;
  universeId: string;
  valueHash: string;
  hits: number;
  createdAt: string;
  lastHitAt: string;
  intelligent: true;
};

export type BrainSnapshot = {
  id: string;
  tenantId: string;
  universeId: string;
  label: string;
  payloadHash: string;
  allocationIds: string[];
  createdAt: string;
  offlineCapable: true;
  liveProvidersRequired: false;
  productionAuthorization: false;
};

type ChipStore = {
  allocations: ContextAllocation[];
  cache: CacheEntry[];
  snapshots: BrainSnapshot[];
};

const MAX_ALLOC = 2_000;
const MAX_CACHE = 5_000;
const MAX_SNAP = 500;
const DEFAULT_MAX_TOKENS = 8_192;

function chipPath(root: string) {
  return xivLocalPath(root, MEMORY_CHIP_FILE);
}

function snapPath(root: string) {
  return xivLocalPath(root, BRAIN_SNAPSHOT_FILE);
}

async function loadChip(root: string): Promise<ChipStore> {
  const parsed = await readJsonFile<ChipStore>(chipPath(root), {
    allocations: [],
    cache: [],
    snapshots: [],
  });
  return {
    allocations: Array.isArray(parsed.allocations) ? parsed.allocations : [],
    cache: Array.isArray(parsed.cache) ? parsed.cache : [],
    snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : [],
  };
}

async function saveChip(root: string, store: ChipStore) {
  await writeJsonFileAtomic(chipPath(root), {
    allocations: store.allocations.slice(-MAX_ALLOC),
    cache: store.cache.slice(-MAX_CACHE),
    snapshots: store.snapshots.slice(-MAX_SNAP),
  });
  await writeJsonFileAtomic(snapPath(root), { snapshots: store.snapshots.slice(-MAX_SNAP) });
}

export function declareSubstrates(): SubstrateCapability[] {
  return MEMORY_SUBSTRATES.map((substrate) => {
    const future = substrate === 'future_verified_hardware';
    return {
      substrate,
      softwareDefined: true as const,
      customHardwareRequired: false as const,
      verified: !future,
      state: future ? ('NOT_TESTED' as const) : ('AVAILABLE' as const),
      note: future
        ? 'Future verified hardware remains NOT_TESTED until authorized verification evidence exists.'
        : 'Software-defined mapping onto ordinary computer/phone resources; custom silicon not required.',
    };
  });
}

export function allocateBoundedContext(input: {
  tenantId: string;
  universeId: string;
  agentId: string;
  modelId: string;
  requestedTokens: number;
  substrate?: MemorySubstrate;
  now?: number;
}): { accepted: boolean; allocation?: ContextAllocation; reason: string } {
  if (!input.tenantId || !input.universeId) {
    return { accepted: false, reason: 'TENANT_AND_UNIVERSE_REQUIRED' };
  }
  if (!input.agentId || !input.modelId) {
    return { accepted: false, reason: 'AGENT_AND_MODEL_REQUIRED' };
  }
  const maxTokens = Math.max(256, Math.min(input.requestedTokens || DEFAULT_MAX_TOKENS, DEFAULT_MAX_TOKENS));
  const allocation: ContextAllocation = {
    id: `ctx_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    agentId: input.agentId,
    modelId: input.modelId,
    maxTokens,
    usedTokens: 0,
    substrate: input.substrate ?? 'dram',
    createdAt: new Date(input.now ?? Date.now()).toISOString(),
    bounded: true,
  };
  return {
    accepted: true,
    allocation,
    reason: `Bounded context allocated maxTokens=${maxTokens} on ${allocation.substrate}.`,
  };
}

export async function persistAllocation(
  allocation: ContextAllocation,
  root = process.cwd(),
) {
  const store = await loadChip(root);
  store.allocations.push(allocation);
  await saveChip(root, store);
  return allocation;
}

export async function writeAgentModelMemory(input: {
  tenantId: string;
  universeId: string;
  agentId: string;
  modelId: string;
  note: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const alloc = allocateBoundedContext({
    tenantId: input.tenantId,
    universeId: input.universeId,
    agentId: input.agentId,
    modelId: input.modelId,
    requestedTokens: 1024,
  });
  if (!alloc.accepted || !alloc.allocation) return alloc;
  const used = Math.min(alloc.allocation.maxTokens, Math.ceil(input.note.length / 4) || 1);
  const allocation = { ...alloc.allocation, usedTokens: used };
  await persistAllocation(allocation, root);
  return { accepted: true as const, allocation, reason: 'Agent/model memory recorded in bounded chip.' };
}

export async function intelligentCachePut(input: {
  tenantId: string;
  universeId: string;
  key: string;
  value: string;
  root?: string;
  now?: number;
}) {
  if (!input.key.trim()) return { accepted: false as const, reason: 'CACHE_KEY_REQUIRED' };
  const root = input.root ?? process.cwd();
  const store = await loadChip(root);
  const nowIso = new Date(input.now ?? Date.now()).toISOString();
  const valueHash = createHash('sha256').update(input.value).digest('hex');
  const existing = store.cache.find(
    (entry) =>
      entry.key === input.key &&
      entry.tenantId === input.tenantId &&
      entry.universeId === input.universeId,
  );
  if (existing) {
    existing.valueHash = valueHash;
    existing.hits += 1;
    existing.lastHitAt = nowIso;
  } else {
    store.cache.push({
      key: input.key,
      tenantId: input.tenantId,
      universeId: input.universeId,
      valueHash,
      hits: 1,
      createdAt: nowIso,
      lastHitAt: nowIso,
      intelligent: true,
    });
  }
  await saveChip(root, store);
  return { accepted: true as const, valueHash, reason: 'Intelligent cache entry stored (hash only).' };
}

export async function intelligentCacheGet(input: {
  tenantId: string;
  universeId: string;
  key: string;
  root?: string;
  now?: number;
}) {
  const store = await loadChip(input.root ?? process.cwd());
  const entry = store.cache.find(
    (item) =>
      item.key === input.key &&
      item.tenantId === input.tenantId &&
      item.universeId === input.universeId,
  );
  if (!entry) return { hit: false as const, reason: 'CACHE_MISS' };
  entry.hits += 1;
  entry.lastHitAt = new Date(input.now ?? Date.now()).toISOString();
  await saveChip(input.root ?? process.cwd(), store);
  return { hit: true as const, entry, reason: 'CACHE_HIT' };
}

export async function createBrainSnapshot(input: {
  tenantId: string;
  universeId: string;
  label: string;
  payload: string;
  allocationIds?: string[];
  root?: string;
  now?: number;
}) {
  const root = input.root ?? process.cwd();
  const store = await loadChip(root);
  const snapshot: BrainSnapshot = {
    id: `snap_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: input.label,
    payloadHash: createHash('sha256').update(input.payload).digest('hex'),
    allocationIds: input.allocationIds ?? store.allocations
      .filter((a) => a.tenantId === input.tenantId && a.universeId === input.universeId)
      .map((a) => a.id)
      .slice(-50),
    createdAt: new Date(input.now ?? Date.now()).toISOString(),
    offlineCapable: true,
    liveProvidersRequired: false,
    productionAuthorization: false,
  };
  store.snapshots.push(snapshot);
  await saveChip(root, store);
  return snapshot;
}

export async function listBrainSnapshots(root = process.cwd(), tenantId?: string, universeId?: string) {
  const store = await loadChip(root);
  return store.snapshots.filter(
    (snap) =>
      (!tenantId || snap.tenantId === tenantId) &&
      (!universeId || snap.universeId === universeId),
  );
}

export function memoryChipHonesty() {
  return {
    locks: BD_LOCKS,
    customHardwareRequired: false as const,
    consciousnessClaim: false as const,
    sentienceClaim: false as const,
    substrates: declareSubstrates(),
    softwareDefined: true as const,
    portableToOrdinaryComputersAndPhones: true as const,
  };
}
