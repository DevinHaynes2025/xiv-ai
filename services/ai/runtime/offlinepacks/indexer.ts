/**
 * 62L-EX14 — Local indexes + embedding truth + software wormholes + knowledge tree.
 * Indexes never bypass auth/rights/tenant/Universe.
 */

import {
  createId,
  nowIso,
  sha256,
  type EmbeddingTruth,
  type KnowledgeNode,
  type LocalIndexEntry,
  type NormalizedRecord,
  type OfflineResearchPack,
  type SoftwareWormhole,
} from './types.ts';
import { tokenize } from './pack-builder.ts';

export type IndexStore = {
  indexes: Map<string, LocalIndexEntry[]>;
  wormholes: Map<string, SoftwareWormhole>;
  trees: Map<string, KnowledgeNode[]>;
  audit: string[];
};

export function createIndexStore(): IndexStore {
  return {
    indexes: new Map(),
    wormholes: new Map(),
    trees: new Map(),
    audit: [],
  };
}

export function recordEmbeddingTruth(input: {
  model: string;
  version: string;
  runtime: string;
  deviceRequested: string;
  deviceActual: string;
  dimension: number;
  sourceHash: string;
  packVersion: string;
}): EmbeddingTruth {
  return {
    ...input,
    fallbackUsed: input.deviceRequested !== input.deviceActual,
  };
}

export function buildLocalIndex(input: {
  store: IndexStore;
  pack: OfflineResearchPack;
  records: readonly NormalizedRecord[];
  rightsManifestId: string;
  embedding?: EmbeddingTruth;
}): LocalIndexEntry[] {
  const entries: LocalIndexEntry[] = input.records.map((r) => ({
    indexId: createId('idx'),
    recordId: r.recordId,
    tokens: tokenize(`${r.title} ${r.body}`),
    embedding: input.embedding,
    rightsManifestId: input.rightsManifestId,
    tenantId: r.tenantId,
    universeId: r.universeId,
    revoked: false,
  }));
  input.store.indexes.set(input.pack.packId, entries);
  input.store.audit.push(`AUDIT: indexed pack ${input.pack.packId} count=${entries.length}`);

  const wormhole: SoftwareWormhole = {
    wormholeId: createId('wh'),
    kind: 'INDEX',
    packId: input.pack.packId,
    bypassesAuth: false,
    bypassesRights: false,
    bypassesTenant: false,
    bypassesUniverse: false,
  };
  input.store.wormholes.set(input.pack.packId, wormhole);

  const rootId = createId('node');
  const branchId = createId('node');
  const tree: KnowledgeNode[] = [
    {
      nodeId: rootId,
      kind: 'ROOT',
      label: input.pack.packType,
      parentId: null,
      recordIds: [],
      packId: input.pack.packId,
    },
    {
      nodeId: branchId,
      kind: 'BRANCH',
      label: input.pack.title,
      parentId: rootId,
      recordIds: [],
      packId: input.pack.packId,
    },
    ...input.records.map((r) => ({
      nodeId: createId('node'),
      kind: 'LEAF' as const,
      label: r.title,
      parentId: branchId,
      recordIds: [r.recordId],
      packId: input.pack.packId,
    })),
  ];
  input.store.trees.set(input.pack.packId, tree);
  return entries;
}

export function excludeRevokedFromIndex(
  store: IndexStore,
  packId: string,
  revokedSourceIds: readonly string[],
  records: readonly NormalizedRecord[],
): LocalIndexEntry[] {
  const current = store.indexes.get(packId) ?? [];
  const revokedRecordIds = new Set(
    records
      .filter((r) => r.sourceRefs.some((s) => revokedSourceIds.includes(s)))
      .map((r) => r.recordId),
  );
  const next = current.map((e) =>
    revokedRecordIds.has(e.recordId) ? { ...e, revoked: true } : e,
  );
  store.indexes.set(packId, next);
  store.audit.push(
    `AUDIT: revocation-first exclude sources=${revokedSourceIds.join(',')} @ ${nowIso()}`,
  );
  return next.filter((e) => !e.revoked);
}

export function wormholeIntegrity(wh: SoftwareWormhole): boolean {
  return (
    wh.bypassesAuth === false &&
    wh.bypassesRights === false &&
    wh.bypassesTenant === false &&
    wh.bypassesUniverse === false
  );
}

export function embeddingSourceHash(body: string): string {
  return sha256(body);
}
