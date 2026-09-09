import { ingestLakeSource, listLakeObjects, type KnowledgeLakeObject } from './knowledge-lake';
import { indexLakeObject } from './offline-intelligence-index';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { SEALED_REDACTION } from './ceo-sealed-vault';

export type KnowledgePackSyncRecord = {
  id: string;
  tenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
  lakeObjectId: string;
  state: 'synced' | 'denied' | 'waiting_data';
  createdAt: string;
};

type SyncStore = { syncs: KnowledgePackSyncRecord[] };

function syncPath(root: string) {
  return xivLocalPath(root, 'knowledge-pack-sync.json');
}

export async function syncKnowledgePack(input: {
  tenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
  lakeObjectId: string;
  federated: boolean;
  sealed?: boolean;
  needsExternalFreshness?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.fromUniverseId || !input.toUniverseId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  if (input.sealed) {
    return {
      state: 'denied' as const,
      reason: 'Sealed founder-priority packs cannot sync across Universes or cloud routes.',
      redacted: SEALED_REDACTION,
    };
  }
  if (input.needsExternalFreshness) {
    return { state: 'waiting_data' as const, reason: 'Pack sync will not invent external freshness.' };
  }
  if (!input.federated && input.fromUniverseId !== input.toUniverseId) {
    return { state: 'denied' as const, reason: 'Cross-Universe pack sync requires logical federation.' };
  }
  const source = (await listLakeObjects({ tenantId: input.tenantId, universeId: input.fromUniverseId, root })).find(
    (item) => item.id === input.lakeObjectId,
  );
  if (!source) return { state: 'denied' as const, reason: 'Source knowledge pack/lake object not in scope.' };

  const ingested = await ingestLakeSource({
    tenantId: input.tenantId,
    universeId: input.toUniverseId,
    industry: source.industry,
    era: source.era,
    partition: source.partition,
    sourceUri: `${source.sourceUri}#sync:${input.fromUniverseId}`,
    sourceLanguage: source.sourceLanguage,
    originalText: source.originalText,
    provenanceRefs: [...source.provenanceRefs, `lake:${source.id}`],
    classification: source.classification,
    root,
  });
  await indexLakeObject(ingested.object, root);
  const store = await readJsonFile<SyncStore>(syncPath(root), { syncs: [] });
  const syncs = Array.isArray(store.syncs) ? store.syncs : [];
  const record: KnowledgePackSyncRecord = {
    id: `kps_${ingested.object.id}`,
    tenantId: input.tenantId,
    fromUniverseId: input.fromUniverseId,
    toUniverseId: input.toUniverseId,
    lakeObjectId: ingested.object.id,
    state: 'synced',
    createdAt: new Date().toISOString(),
  };
  syncs.push(record);
  await writeJsonFileAtomic(syncPath(root), { syncs: syncs.slice(-5_000) });
  return { state: 'synced' as const, record, object: ingested.object as KnowledgeLakeObject, duplicate: ingested.duplicate };
}
