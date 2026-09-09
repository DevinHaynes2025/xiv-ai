/**
 * 62L-EX14 — Offline Quantum Research Pack barrel.
 * Soft-wires existing knowledge / Agent Mesh / feedback / evidence — not a second system.
 */

export * from './types.ts';
export * from './source-manifest.ts';
export * from './pack-builder.ts';
export * from './indexer.ts';
export * from './query.ts';
export * from './retention.ts';
export * from './sync.ts';

import { auditEx14SoftWires, summarizeSoftWires, type SoftWireSnapshot } from './types.ts';
import {
  createProvenance,
  createRightsManifest,
  createSourceManifest,
  gateSource,
} from './source-manifest.ts';
import {
  buildOfflinePack,
  createPackBuildStore,
  type PackBuildStore,
} from './pack-builder.ts';
import {
  buildLocalIndex,
  createIndexStore,
  recordEmbeddingTruth,
  type IndexStore,
} from './indexer.ts';
import { createSyncStore, type SyncStore } from './sync.ts';
import type { ContentClass, PackType } from './types.ts';

export type OfflinePackRuntime = {
  buildStore: PackBuildStore;
  indexStore: IndexStore;
  syncStore: SyncStore;
  softWires: SoftWireSnapshot;
};

/** Bootstrap governed offline pack runtime (local-first). */
export function bootstrapOfflinePackRuntime(): OfflinePackRuntime {
  const softWires = auditEx14SoftWires();
  // Soft-integrate feedback/lifecycle if EX13 modules appear — never block forever.
  void summarizeSoftWires(softWires);
  return {
    buildStore: createPackBuildStore(),
    indexStore: createIndexStore(),
    syncStore: createSyncStore(),
    softWires,
  };
}

/** Convenience: build a measured public QUANTUM_RESEARCH pack end-to-end. */
export function buildPublicQuantumResearchPack(input: {
  runtime: OfflinePackRuntime;
  tenantId: string;
  universeId: string;
  title: string;
  body: string;
  packType?: PackType;
  contentClass?: ContentClass;
}):
  | { ok: true; packId: string; packVersion: string; actualBytes: number }
  | { ok: false; reason: string } {
  const rights = createRightsManifest({
    sourceClass: 'PUBLIC_OPEN',
    licenseId: 'CC-BY-4.0',
    rightsHolder: 'public',
    tenantPrivate: false,
  });
  const provenance = createProvenance({
    sourceId: 'pending',
    sourceTitle: input.title,
    version: '1',
    bodyForHash: input.body,
  });
  const gated = gateSource({
    sourceClass: 'PUBLIC_OPEN',
    title: input.title,
    version: '1',
    contentClasses: [input.contentClass ?? 'QUANTUM_RESEARCH_HISTORICAL'],
    tenantId: null,
    universeId: null,
    rights,
    provenance,
    body: input.body,
  });
  if (!gated.ok) return { ok: false, reason: gated.reason };

  const manifest = createSourceManifest({
    packType: input.packType ?? 'QUANTUM_RESEARCH',
    tenantId: input.tenantId,
    universeId: input.universeId,
    entries: [gated.entry],
  });

  const built = buildOfflinePack({
    store: input.runtime.buildStore,
    packType: input.packType ?? 'QUANTUM_RESEARCH',
    tenantId: input.tenantId,
    universeId: input.universeId,
    title: input.title,
    description: 'Governed offline quantum research pack',
    sourceManifest: manifest,
    rights,
    documents: [
      {
        title: input.title,
        body: input.body,
        sourceId: gated.entry.sourceId,
        contentClass: input.contentClass ?? 'QUANTUM_RESEARCH_HISTORICAL',
        claimFactState: 'CLAIM_REPORTED',
        historicalCase: {
          caseId: 'case_historical_qi_1',
          timePeriod: '1980-2000',
          sources: [gated.entry.sourceId],
          facts: ['Public historical notes on quantum-inspired algorithms.'],
          interpretations: ['Useful as research context only.'],
          knownUncertainty: ['Does not prove physical QPU advantage.'],
          lessons: ['Keep historical ≠ physical QPU evidence.'],
          impliesPhysicalQpuEvidence: false,
        },
      },
    ],
  });
  if (!built.ok) return { ok: false, reason: built.reason };

  const embedding = recordEmbeddingTruth({
    model: 'local-hash-embed',
    version: '0.0.1',
    runtime: 'node-local',
    deviceRequested: 'cpu',
    deviceActual: 'cpu',
    dimension: 64,
    sourceHash: gated.provenance.hash ?? 'none',
    packVersion: built.pack.packVersion,
  });
  buildLocalIndex({
    store: input.runtime.indexStore,
    pack: built.pack,
    records: built.records,
    rightsManifestId: rights.rightsManifestId,
    embedding,
  });

  return {
    ok: true,
    packId: built.pack.packId,
    packVersion: built.pack.packVersion,
    actualBytes: built.pack.actualBytes ?? 0,
  };
}
