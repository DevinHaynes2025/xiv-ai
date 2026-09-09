import { createHash } from 'node:crypto';

import { SEALED_REDACTION } from './ceo-sealed-vault';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { listDistributedMemory, type DistributedMemoryRecord } from './memory-ingest';
import { listCompiledHighways } from './neural-highway-compiler';

export type MemoryPack = {
  id: string;
  deviceId: string;
  tenantId: string;
  universeId: string;
  lamport: number;
  records: Array<Pick<DistributedMemoryRecord, 'id' | 'contentHash' | 'claim' | 'polarity' | 'contradictionId' | 'integrity' | 'poisonState' | 'validFrom' | 'sourceRefs'>>;
  highwayIds: string[];
  sealedReplicated: false;
  offline: true;
  createdAt: string;
};

type PackStore = { packs: MemoryPack[] };

function storePath(root: string) {
  return xivLocalPath(root, 'offline-memory-packs.json');
}

function packHash(pack: MemoryPack) {
  return createHash('sha256')
    .update(pack.records.map((item) => item.contentHash).sort().join('|'))
    .digest('hex');
}

async function load(root: string): Promise<PackStore> {
  const parsed = await readJsonFile<PackStore>(storePath(root), { packs: [] });
  return { packs: Array.isArray(parsed.packs) ? parsed.packs : [] };
}

export async function exportOfflineMemoryPack(input: {
  tenantId: string;
  universeId: string;
  deviceId: string;
  lamport?: number;
  includeSealed?: boolean;
  root?: string;
}) {
  if (input.includeSealed) {
    return {
      exported: false as const,
      sealedReplicated: false as const,
      redacted: SEALED_REDACTION,
      reason: 'CEO-sealed memory is non-replicating and is excluded from offline packs.',
    };
  }
  const records = (await listDistributedMemory(input)).filter(
    (item) => !item.founderRestricted && item.poisonState === 'clean',
  );
  const highways = await listCompiledHighways(input);
  const pack: MemoryPack = {
    id: `pack_${input.deviceId}_${Date.now().toString(36)}`,
    deviceId: input.deviceId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    lamport: input.lamport ?? 1,
    records: records.map((item) => ({
      id: item.id,
      contentHash: item.contentHash,
      claim: item.claim,
      polarity: item.polarity,
      contradictionId: item.contradictionId,
      integrity: item.integrity,
      poisonState: item.poisonState,
      validFrom: item.validFrom,
      sourceRefs: item.sourceRefs,
    })),
    highwayIds: highways.map((item) => item.id),
    sealedReplicated: false,
    offline: true,
    createdAt: new Date().toISOString(),
  };
  const root = input.root ?? process.cwd();
  const store = await load(root);
  store.packs.push(pack);
  await writeJsonFileAtomic(storePath(root), { packs: store.packs.slice(-500) });
  return { exported: true as const, pack, digest: packHash(pack), sealedReplicated: false as const };
}

export async function reconcileMemoryPacks(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const store = await load(input.root ?? process.cwd());
  const packs = store.packs.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
  const byHash = new Map<string, MemoryPack['records'][number]>();
  const contradictions = new Set<string>();
  for (const pack of packs.sort((a, b) => a.lamport - b.lamport)) {
    for (const record of pack.records) {
      const prior = byHash.get(record.contentHash);
      if (!prior) {
        byHash.set(record.contentHash, record);
      } else if (prior.polarity !== record.polarity && record.contradictionId) {
        contradictions.add(record.contradictionId);
      }
      if (record.contradictionId) contradictions.add(record.contradictionId);
    }
  }
  return {
    devices: packs.map((item) => item.deviceId),
    mergedRecords: [...byHash.values()].length,
    contradictionIdsRetained: [...contradictions],
    lastWriteDoesNotDropConflicts: true as const,
    sealedReplicated: false as const,
  };
}
