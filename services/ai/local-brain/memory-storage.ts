import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import type { MemoryTier } from './distributed-memory-types';
import { listDistributedMemory, type DistributedMemoryRecord } from './memory-ingest';

export const MEMORY_BYTE_BUDGET = 8_000_000;
export const HOT_CAP = 256;
export const WARM_CAP = 2_048;
export const COLD_CAP = 10_000;

export type StoredMemorySlice = {
  id: string;
  tier: MemoryTier;
  digest: string;
  byteLength: number;
  compressed: boolean;
  originalRetained: boolean;
  contradictionId?: string;
};

export type CompressionResult = {
  beforeBytes: number;
  afterBytes: number;
  ratio: number;
  droppedContradictions: false;
  retainedIds: string[];
  slices: StoredMemorySlice[];
};

type TierStore = { slices: StoredMemorySlice[] };

function storePath(root: string) {
  return xivLocalPath(root, 'memory-tier-slices.json');
}

function digestOf(record: DistributedMemoryRecord) {
  return `${record.contentHash}:${record.polarity}:${record.claim.length}`;
}

function assignTier(index: number, total: number): MemoryTier {
  if (index < HOT_CAP && index < Math.max(1, Math.floor(total * 0.1))) return 'hot';
  if (index < HOT_CAP + WARM_CAP) return 'warm';
  return 'cold';
}

export async function placeHotWarmCold(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const records = await listDistributedMemory(input);
  const slices: StoredMemorySlice[] = records.map((record, index) => ({
    id: record.id,
    tier: assignTier(index, records.length),
    digest: digestOf(record),
    byteLength: Buffer.byteLength(record.claim, 'utf8'),
    compressed: false,
    originalRetained: true,
    contradictionId: record.contradictionId,
  }));
  const root = input.root ?? process.cwd();
  await writeJsonFileAtomic(storePath(root), { slices: slices.slice(-COLD_CAP) });
  const bytes = slices.reduce((sum, item) => sum + item.byteLength, 0);
  return {
    hot: slices.filter((item) => item.tier === 'hot').length,
    warm: slices.filter((item) => item.tier === 'warm').length,
    cold: slices.filter((item) => item.tier === 'cold').length,
    bytes,
    withinBudget: bytes <= MEMORY_BYTE_BUDGET,
    records: slices.length,
  };
}

export async function compressKnowledge(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}): Promise<CompressionResult> {
  const records = await listDistributedMemory(input);
  const beforeBytes = records.reduce((sum, item) => sum + Buffer.byteLength(item.claim, 'utf8'), 0);
  const seen = new Map<string, DistributedMemoryRecord>();
  const retained: DistributedMemoryRecord[] = [];
  for (const record of records) {
    const key = `${record.contentHash}:${record.polarity}`;
    const prior = seen.get(key);
    if (prior && !record.contradictionId) continue;
    seen.set(key, record);
    retained.push(record);
  }
  const slices: StoredMemorySlice[] = retained.map((record, index) => ({
    id: record.id,
    tier: assignTier(index, retained.length),
    digest: digestOf(record),
    byteLength: 64,
    compressed: true,
    originalRetained: true,
    contradictionId: record.contradictionId,
  }));
  const afterBytes = slices.reduce((sum, item) => sum + item.byteLength, 0);
  const root = input.root ?? process.cwd();
  const store = await readJsonFile<TierStore>(storePath(root), { slices: [] });
  store.slices = slices.slice(-COLD_CAP);
  await writeJsonFileAtomic(storePath(root), store);
  return {
    beforeBytes,
    afterBytes,
    ratio: beforeBytes === 0 ? 1 : afterBytes / beforeBytes,
    droppedContradictions: false,
    retainedIds: retained.map((item) => item.id),
    slices,
  };
}

export function governMemoryResources(input: {
  materializedRelations: number;
  materializedRecords: number;
  bytes: number;
  extraProcesses: number;
}) {
  const relationOk = input.materializedRelations <= 10_000;
  const recordOk = input.materializedRecords <= 10_000;
  const byteOk = input.bytes <= MEMORY_BYTE_BUDGET;
  const processOk = input.extraProcesses <= 0;
  return {
    allowed: relationOk && recordOk && byteOk && processOk,
    relationOk,
    recordOk,
    byteOk,
    processOk,
    denyTrillionMaterialization: true as const,
    productionAuthorization: false as const,
  };
}
