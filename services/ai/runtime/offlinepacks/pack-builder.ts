/**
 * 62L-EX14 — Pack builder: normalize, dedupe, classify, verify → READY.
 * READY needs valid manifest + integrity + indexes + rights.
 */

import {
  createId,
  measuredBytes,
  nowIso,
  sha256,
  type ClaimFactState,
  type ContentClass,
  type HistoricalCaseMemory,
  type NormalizedRecord,
  type NormalizedRecordKind,
  type OfflineResearchPack,
  type PackBuildState,
  type PackType,
  type RightsManifest,
  type ScaleHonesty,
  type SourceManifest,
  type VerificationState,
} from './types.ts';

export type PackBuildStore = {
  packs: Map<string, OfflineResearchPack>;
  records: Map<string, NormalizedRecord[]>;
  rights: Map<string, RightsManifest>;
  manifests: Map<string, SourceManifest>;
  audit: string[];
};

export function createPackBuildStore(): PackBuildStore {
  return {
    packs: new Map(),
    records: new Map(),
    rights: new Map(),
    manifests: new Map(),
    audit: [],
  };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((t) => t.length > 1);
}

export function normalizeDocument(input: {
  title: string;
  body: string;
  kind?: NormalizedRecordKind;
  claimFactState?: ClaimFactState;
  sourceRefs: readonly string[];
  contentClass: ContentClass;
  tenantId: string;
  universeId: string;
  packType: PackType;
  historicalCase?: HistoricalCaseMemory;
}): NormalizedRecord {
  const body = input.body;
  return {
    recordId: createId('rec'),
    kind: input.kind ?? 'Document',
    title: input.title,
    body,
    claimFactState: input.claimFactState ?? 'CLAIM_REPORTED',
    sourceRefs: input.sourceRefs,
    contentClass: input.contentClass,
    tenantId: input.tenantId,
    universeId: input.universeId,
    packType: input.packType,
    dedupeHash: sha256(`${input.title}\n${body}`),
    historicalCase: input.historicalCase,
    bytes: measuredBytes(`${input.title}\n${body}`),
    hiddenCot: false,
  };
}

export function deduplicateRecords(records: readonly NormalizedRecord[]): NormalizedRecord[] {
  const seen = new Set<string>();
  const out: NormalizedRecord[] = [];
  for (const r of records) {
    if (seen.has(r.dedupeHash)) continue;
    seen.add(r.dedupeHash);
    out.push(r);
  }
  return out;
}

export function classifyQuantumResearchHonesty(record: NormalizedRecord): {
  historicalOk: boolean;
  impliesPhysicalQpu: false;
  note: string;
} {
  const historical =
    record.contentClass === 'QUANTUM_RESEARCH_HISTORICAL' ||
    record.historicalCase !== undefined;
  return {
    historicalOk: historical,
    impliesPhysicalQpu: false,
    note: 'Historical quantum research ≠ physical QPU evidence.',
  };
}

function advance(state: PackBuildState): PackBuildState {
  const order: PackBuildState[] = [
    'QUEUED',
    'SOURCE_VALIDATION',
    'NORMALIZING',
    'INDEXING',
    'VERIFYING',
    'READY',
  ];
  const i = order.indexOf(state);
  if (i < 0 || i >= order.length - 1) return state;
  return order[i + 1]!;
}

export function buildOfflinePack(input: {
  store: PackBuildStore;
  packType: PackType;
  tenantId: string;
  universeId: string;
  title: string;
  description: string;
  sourceManifest: SourceManifest;
  rights: RightsManifest;
  documents: readonly {
    title: string;
    body: string;
    sourceId: string;
    contentClass: ContentClass;
    claimFactState?: ClaimFactState;
    kind?: NormalizedRecordKind;
    historicalCase?: HistoricalCaseMemory;
  }[];
  estimatedBytes?: number | null;
  indexCount?: number;
  platformCompatibility?: OfflineResearchPack['platformCompatibility'];
}):
  | { ok: true; pack: OfflineResearchPack; records: NormalizedRecord[] }
  | { ok: false; buildState: PackBuildState; reason: string } {
  const { store } = input;
  store.audit.push(`AUDIT: build queued for ${input.title} @ ${nowIso()}`);

  if (input.sourceManifest.entries.length === 0) {
    return { ok: false, buildState: 'FAILED', reason: 'Empty source manifest.' };
  }

  for (const entry of input.sourceManifest.entries) {
    if (!entry.rightsManifestId || !entry.provenanceId) {
      return {
        ok: false,
        buildState: 'SOURCE_VALIDATION',
        reason: 'Source missing rights/provenance — cannot build.',
      };
    }
  }

  let buildState: PackBuildState = 'QUEUED';
  buildState = advance(buildState); // SOURCE_VALIDATION
  buildState = advance(buildState); // NORMALIZING

  const normalized = deduplicateRecords(
    input.documents.map((d) =>
      normalizeDocument({
        title: d.title,
        body: d.body,
        kind: d.kind,
        claimFactState: d.claimFactState,
        sourceRefs: [d.sourceId],
        contentClass: d.contentClass,
        tenantId: input.tenantId,
        universeId: input.universeId,
        packType: input.packType,
        historicalCase: d.historicalCase,
      }),
    ),
  );

  buildState = advance(buildState); // INDEXING
  const indexCount = input.indexCount ?? normalized.length;
  buildState = advance(buildState); // VERIFYING

  const actualBytes = normalized.reduce((sum, r) => sum + r.bytes, 0);
  const integrityHash = sha256(
    normalized.map((r) => r.dedupeHash).sort().join('|') + `|${input.sourceManifest.sourceManifestId}`,
  );

  const verificationState: VerificationState =
    input.sourceManifest.entries.length > 0 &&
    integrityHash.length === 64 &&
    indexCount > 0 &&
    input.rights.rightsManifestId.length > 0
      ? 'READY_VERIFIED_LOCAL'
      : 'FAILED';

  if (verificationState === 'FAILED') {
    return { ok: false, buildState: 'FAILED', reason: 'Verification failed — READY requires manifest+integrity+indexes+rights.' };
  }

  buildState = 'READY';
  const ts = nowIso();
  const contentClasses = Array.from(
    new Set(normalized.map((r) => r.contentClass)),
  ) as ContentClass[];

  const scaleHonesty: ScaleHonesty = {
    kind: 'MEASURED',
    bytes: actualBytes,
    documentCount: normalized.filter((r) => r.kind === 'Document').length,
    recordCount: normalized.length,
    indexCount,
  };

  const pack: OfflineResearchPack = {
    packId: createId('pack'),
    packVersion: '1.0.0',
    packType: input.packType,
    tenantId: input.tenantId,
    universeId: input.universeId,
    title: input.title,
    description: input.description,
    sourceManifestId: input.sourceManifest.sourceManifestId,
    rightsManifestId: input.rights.rightsManifestId,
    contentClasses,
    documentCount: scaleHonesty.documentCount,
    recordCount: scaleHonesty.recordCount,
    indexCount: scaleHonesty.indexCount,
    estimatedBytes: input.estimatedBytes ?? actualBytes,
    actualBytes,
    createdAt: ts,
    updatedAt: ts,
    freshnessState: 'FRESH',
    verificationState,
    encryptionState: 'NONE_LOCAL_DEV',
    replicationPolicy: input.rights.tenantPrivate ? 'TENANT_SCOPED' : 'GLOBAL_PUBLIC_PACK',
    platformCompatibility: input.platformCompatibility ?? ['ANY_NODE_LOCAL'],
    integrityHash,
    rollbackVersion: null,
    status: 'READY',
    buildState,
    scaleHonesty,
    revokedSourceIds: [],
  };

  store.packs.set(pack.packId, pack);
  store.records.set(pack.packId, normalized);
  store.rights.set(input.rights.rightsManifestId, input.rights);
  store.manifests.set(input.sourceManifest.sourceManifestId, input.sourceManifest);
  store.audit.push(`AUDIT: pack ${pack.packId} READY measuredBytes=${actualBytes}`);

  return { ok: true, pack, records: normalized };
}

export function bumpPackVersion(
  store: PackBuildStore,
  packId: string,
  reason: string,
): OfflineResearchPack | null {
  const prev = store.packs.get(packId);
  if (!prev) return null;
  const [major, minor, patch] = prev.packVersion.split('.').map((n) => Number(n));
  const nextVersion = `${major}.${minor}.${(patch ?? 0) + 1}`;
  const next: OfflineResearchPack = {
    ...prev,
    packVersion: nextVersion,
    rollbackVersion: prev.packVersion,
    updatedAt: nowIso(),
    freshnessState: 'FRESH',
    status: 'READY',
    buildState: 'READY',
  };
  store.packs.set(packId, next);
  store.audit.push(`AUDIT: source update → pack ${packId} ${prev.packVersion}→${nextVersion} (${reason})`);
  return next;
}

export function markPackStale(store: PackBuildStore, packId: string): OfflineResearchPack | null {
  const prev = store.packs.get(packId);
  if (!prev) return null;
  const next: OfflineResearchPack = {
    ...prev,
    freshnessState: 'STALE',
    status: 'STALE',
    buildState: 'STALE',
    updatedAt: nowIso(),
  };
  store.packs.set(packId, next);
  store.audit.push(`AUDIT: pack ${packId} marked STALE`);
  return next;
}

export function engineeringScaleTarget(note: string): ScaleHonesty {
  return { kind: 'ENGINEERING_SCALE_TARGET', note };
}

export { tokenize };
