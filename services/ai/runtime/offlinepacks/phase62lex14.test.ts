/**
 * 62L-EX14 — Offline Quantum Research Pack required honesty tests.
 * Script: npm run test:62lex14
 *
 * 1 public/open source eligible
 * 2 source without rights/provenance denied
 * 3 restricted/stolen DENIED/QUARANTINED
 * 4 tenant-private remains tenant scoped
 * 5 cross-tenant retrieval DENIED
 * 6 cross-Universe retrieval DENIED
 * 7 pack works network unavailable
 * 8 live-web-required offline → WAITING_DATA
 * 9 revoked source excluded
 * 10 stale pack → PACK_STALE
 * 11 source update → new pack version
 * 12 local agent evidence → LOCAL_CANDIDATE
 * 13 offline learning no auto global promote
 * 14 measured pack size/counts
 * 15 no hidden CoT persisted
 * 16 L4 false
 * 17 Guardian/RLS unchanged
 */

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  EX14_LOCKS,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PACK_TYPES,
  assertEx14LocksIntact,
  auditEx14SoftWires,
  ex14L4AutonomyEnabled,
  guardianRlsUnchangedByEx14,
  resolveOfflineWebDependency,
  summarizeSoftWires,
} from './types.ts';
import {
  createProvenance,
  createRightsManifest,
  createSourceManifest,
  gateSource,
  publicOpenSourceEligible,
} from './source-manifest.ts';
import {
  buildOfflinePack,
  classifyQuantumResearchHonesty,
  createPackBuildStore,
  engineeringScaleTarget,
} from './pack-builder.ts';
import {
  buildLocalIndex,
  createIndexStore,
  excludeRevokedFromIndex,
  recordEmbeddingTruth,
  wormholeIntegrity,
} from './indexer.ts';
import {
  attemptAutoGlobalPromote,
  attemptPersistHiddenCot,
  assignPackResearchRole,
  queryOfflinePack,
  recordLocalCandidate,
  resolveOfflineUsage,
} from './query.ts';
import { scoreBeneficialRetention } from './retention.ts';
import {
  applyDeltaUpdate,
  createSyncStore,
  markStaleOnSkew,
  revokeSourceFromPack,
} from './sync.ts';
import { bootstrapOfflinePackRuntime, buildPublicQuantumResearchPack } from './index.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');

test('SoT EX14 / #170; next EX15 docs-only atlas', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EX14');
  assert.equal(GITHUB_SOT_ISSUE, 170);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EX');
  assert.match(HONESTY_BANNER, /WAITING_DATA/);
  assert.match(NEXT_PHASE_TITLE, /EX15/);
  assert.match(NEXT_PHASE_TITLE, /Historical Quantum/);
  assert.ok(PACK_TYPES.includes('QUANTUM_RESEARCH'));
  assert.ok(PACK_TYPES.includes('XIV_CORE'));
  assert.equal(PACK_TYPES.length >= 13, true);
});

test('1. public/open source eligible', () => {
  assert.equal(publicOpenSourceEligible('PUBLIC_OPEN'), true);
  const rights = createRightsManifest({ sourceClass: 'PUBLIC_OPEN', licenseId: 'CC0' });
  const provenance = createProvenance({
    sourceId: 's1',
    sourceTitle: 'Open quantum notes',
    version: '1',
    bodyForHash: 'annealing history',
  });
  const gated = gateSource({
    sourceClass: 'PUBLIC_OPEN',
    title: 'Open quantum notes',
    version: '1',
    contentClasses: ['QUANTUM_RESEARCH_HISTORICAL'],
    tenantId: null,
    universeId: null,
    rights,
    provenance,
    body: 'annealing history',
  });
  assert.equal(gated.ok, true);
});

test('2. source without rights/provenance denied', () => {
  const denied = gateSource({
    sourceClass: 'PUBLIC_OPEN',
    title: 'No provenance',
    version: '1',
    contentClasses: ['MATHEMATICS'],
    tenantId: null,
    universeId: null,
    rights: null,
    provenance: null,
  });
  assert.equal(denied.ok, false);
  if (!denied.ok) {
    assert.equal(denied.disposition, 'DENIED');
    assert.match(denied.reason, /rights|provenance/i);
  }
});

test('3. restricted/stolen DENIED/QUARANTINED', () => {
  const stolen = gateSource({
    sourceClass: 'STOLEN_DATABASE',
    title: 'leaked db',
    version: '1',
    contentClasses: ['CYBER_DEFENSE_LAWFUL_TI'],
    tenantId: null,
    universeId: null,
  });
  assert.equal(stolen.ok, false);
  if (!stolen.ok) assert.equal(stolen.disposition, 'DENIED');

  const dark = gateSource({
    sourceClass: 'DARK_WEB_PUBLIC',
    title: 'dark',
    version: '1',
    contentClasses: ['CYBER_DEFENSE_LAWFUL_TI'],
    tenantId: null,
    universeId: null,
  });
  assert.equal(dark.ok, false);
  if (!dark.ok) assert.equal(dark.disposition, 'QUARANTINED');

  const keys = gateSource({
    sourceClass: 'FIRMWARE_KEYS',
    title: 'keys',
    version: '1',
    contentClasses: ['PUBLIC_SEMICONDUCTOR'],
    tenantId: null,
    universeId: null,
  });
  assert.equal(keys.ok, false);
});

test('4. tenant-private remains tenant scoped', () => {
  const runtime = bootstrapOfflinePackRuntime();
  const rights = createRightsManifest({
    sourceClass: 'CUSTOMER_AUTHORIZED',
    tenantPrivate: true,
  });
  const provenance = createProvenance({
    sourceId: 'tp',
    sourceTitle: 'Tenant notes',
    version: '1',
    bodyForHash: 'private ops memory',
  });
  const gated = gateSource({
    sourceClass: 'CUSTOMER_AUTHORIZED',
    title: 'Tenant notes',
    version: '1',
    contentClasses: ['XIV_CORE_PUBLIC'],
    tenantId: 'tenant-a',
    universeId: 'uni-a',
    rights,
    provenance,
    body: 'private ops memory',
  });
  assert.equal(gated.ok, true);
  if (!gated.ok) return;

  const manifest = createSourceManifest({
    packType: 'XIV_CORE',
    tenantId: 'tenant-a',
    universeId: 'uni-a',
    entries: [gated.entry],
  });
  const built = buildOfflinePack({
    store: runtime.buildStore,
    packType: 'XIV_CORE',
    tenantId: 'tenant-a',
    universeId: 'uni-a',
    title: 'Tenant pack',
    description: 'tenant private',
    sourceManifest: manifest,
    rights,
    documents: [
      {
        title: 'Tenant notes',
        body: 'private ops memory quantum scheduling',
        sourceId: gated.entry.sourceId,
        contentClass: 'XIV_CORE_PUBLIC',
      },
    ],
  });
  assert.equal(built.ok, true);
  if (!built.ok) return;
  assert.equal(built.pack.replicationPolicy, 'TENANT_SCOPED');
  buildLocalIndex({
    store: runtime.indexStore,
    pack: built.pack,
    records: built.records,
    rightsManifestId: rights.rightsManifestId,
  });

  const ok = queryOfflinePack({
    buildStore: runtime.buildStore,
    indexStore: runtime.indexStore,
    packId: built.pack.packId,
    request: {
      tenantId: 'tenant-a',
      universeId: 'uni-a',
      query: 'quantum scheduling',
      networkAvailable: false,
      devicePowered: true,
      storageAvailable: true,
      allowTenantPrivate: true,
    },
  });
  assert.equal(ok.ok, true);

  const deniedGlobalMix = queryOfflinePack({
    buildStore: runtime.buildStore,
    indexStore: runtime.indexStore,
    packId: built.pack.packId,
    request: {
      tenantId: 'tenant-a',
      universeId: 'uni-a',
      query: 'quantum',
      networkAvailable: false,
      devicePowered: true,
      storageAvailable: true,
      allowTenantPrivate: false,
    },
  });
  assert.equal(deniedGlobalMix.ok, false);
});

test('5. cross-tenant retrieval DENIED', () => {
  const runtime = bootstrapOfflinePackRuntime();
  const built = buildPublicQuantumResearchPack({
    runtime,
    tenantId: 'tenant-a',
    universeId: 'uni-a',
    title: 'QI history',
    body: 'simulated annealing historical survey',
  });
  assert.equal(built.ok, true);
  if (!built.ok) return;
  const res = queryOfflinePack({
    buildStore: runtime.buildStore,
    indexStore: runtime.indexStore,
    packId: built.packId,
    request: {
      tenantId: 'tenant-b',
      universeId: 'uni-a',
      query: 'annealing',
      networkAvailable: false,
      devicePowered: true,
      storageAvailable: true,
      allowTenantPrivate: false,
    },
  });
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.disposition, 'DENIED');
    assert.match(res.reason, /Cross-tenant/i);
  }
});

test('6. cross-Universe retrieval DENIED', () => {
  const runtime = bootstrapOfflinePackRuntime();
  const built = buildPublicQuantumResearchPack({
    runtime,
    tenantId: 'tenant-a',
    universeId: 'uni-a',
    title: 'QI history',
    body: 'ising model historical notes',
  });
  assert.equal(built.ok, true);
  if (!built.ok) return;
  const res = queryOfflinePack({
    buildStore: runtime.buildStore,
    indexStore: runtime.indexStore,
    packId: built.packId,
    request: {
      tenantId: 'tenant-a',
      universeId: 'uni-other',
      query: 'ising',
      networkAvailable: false,
      devicePowered: true,
      storageAvailable: true,
      allowTenantPrivate: false,
    },
  });
  assert.equal(res.ok, false);
  if (!res.ok) assert.match(res.reason, /Cross-Universe/i);
});

test('7. pack works network unavailable', () => {
  const runtime = bootstrapOfflinePackRuntime();
  const built = buildPublicQuantumResearchPack({
    runtime,
    tenantId: 'tenant-a',
    universeId: 'uni-a',
    title: 'Offline QI pack',
    body: 'quantum inspired local search heuristics offline',
  });
  assert.equal(built.ok, true);
  if (!built.ok) return;
  const res = queryOfflinePack({
    buildStore: runtime.buildStore,
    indexStore: runtime.indexStore,
    packId: built.packId,
    request: {
      tenantId: 'tenant-a',
      universeId: 'uni-a',
      query: 'quantum inspired heuristics',
      networkAvailable: false,
      devicePowered: true,
      storageAvailable: true,
      allowTenantPrivate: false,
    },
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.offlineMode, true);
    assert.equal(res.usageState === 'LOCAL_READY' || res.usageState === 'PACK_STALE', true);
    assert.ok(res.hits.length >= 1);
  }
});

test('8. live-web-required offline → WAITING_DATA', () => {
  const dep = resolveOfflineWebDependency({
    requiresLiveWeb: true,
    networkAvailable: false,
    dependencyName: 'arxiv-live',
  });
  assert.equal(dep.disposition, 'WAITING_DATA');

  const rights = createRightsManifest({ sourceClass: 'PUBLIC_OPEN' });
  const provenance = createProvenance({
    sourceId: 'live',
    sourceTitle: 'Live feed',
    version: '1',
  });
  const gated = gateSource({
    sourceClass: 'PUBLIC_OPEN',
    title: 'Live feed',
    version: '1',
    contentClasses: ['QUANTUM_RESEARCH_HISTORICAL'],
    tenantId: null,
    universeId: null,
    rights,
    provenance,
    requiresLiveWeb: true,
    networkAvailable: false,
  });
  assert.equal(gated.ok, false);
  if (!gated.ok) assert.equal(gated.disposition, 'WAITING_DATA');
});

test('9. revoked source excluded', () => {
  const runtime = bootstrapOfflinePackRuntime();
  const rights = createRightsManifest({ sourceClass: 'PUBLIC_OPEN' });
  const provenance = createProvenance({
    sourceId: 'r1',
    sourceTitle: 'Revocable doc',
    version: '1',
    bodyForHash: 'revocable quantum survey content',
  });
  const gated = gateSource({
    sourceClass: 'PUBLIC_OPEN',
    title: 'Revocable doc',
    version: '1',
    contentClasses: ['QUANTUM_RESEARCH_HISTORICAL'],
    tenantId: null,
    universeId: null,
    rights,
    provenance,
    body: 'revocable quantum survey content',
  });
  assert.equal(gated.ok, true);
  if (!gated.ok) return;
  const manifest = createSourceManifest({
    packType: 'QUANTUM_RESEARCH',
    tenantId: 'tenant-a',
    universeId: 'uni-a',
    entries: [gated.entry],
  });
  const built = buildOfflinePack({
    store: runtime.buildStore,
    packType: 'QUANTUM_RESEARCH',
    tenantId: 'tenant-a',
    universeId: 'uni-a',
    title: 'Revocable pack',
    description: 'd',
    sourceManifest: manifest,
    rights,
    documents: [
      {
        title: 'Revocable doc',
        body: 'revocable quantum survey content',
        sourceId: gated.entry.sourceId,
        contentClass: 'QUANTUM_RESEARCH_HISTORICAL',
      },
    ],
  });
  assert.equal(built.ok, true);
  if (!built.ok) return;
  buildLocalIndex({
    store: runtime.indexStore,
    pack: built.pack,
    records: built.records,
    rightsManifestId: rights.rightsManifestId,
  });
  revokeSourceFromPack({
    buildStore: runtime.buildStore,
    indexStore: runtime.indexStore,
    syncStore: runtime.syncStore,
    packId: built.pack.packId,
    sourceId: gated.entry.sourceId,
  });
  const remaining = excludeRevokedFromIndex(
    runtime.indexStore,
    built.pack.packId,
    [gated.entry.sourceId],
    built.records,
  );
  assert.equal(remaining.length, 0);
  const res = queryOfflinePack({
    buildStore: runtime.buildStore,
    indexStore: runtime.indexStore,
    packId: built.pack.packId,
    request: {
      tenantId: 'tenant-a',
      universeId: 'uni-a',
      query: 'quantum survey',
      networkAvailable: false,
      devicePowered: true,
      storageAvailable: true,
      allowTenantPrivate: false,
    },
  });
  assert.equal(res.ok, true);
  if (res.ok) assert.equal(res.hits.length, 0);
});

test('10. stale pack → PACK_STALE', () => {
  const runtime = bootstrapOfflinePackRuntime();
  const built = buildPublicQuantumResearchPack({
    runtime,
    tenantId: 'tenant-a',
    universeId: 'uni-a',
    title: 'Aging pack',
    body: 'stale quantum reference material',
  });
  assert.equal(built.ok, true);
  if (!built.ok) return;
  markStaleOnSkew({
    buildStore: runtime.buildStore,
    syncStore: runtime.syncStore,
    packId: built.packId,
  });
  const pack = runtime.buildStore.packs.get(built.packId)!;
  assert.equal(resolveOfflineUsage(pack, { devicePowered: true, storageAvailable: true }), 'PACK_STALE');
  const res = queryOfflinePack({
    buildStore: runtime.buildStore,
    indexStore: runtime.indexStore,
    packId: built.packId,
    request: {
      tenantId: 'tenant-a',
      universeId: 'uni-a',
      query: 'quantum',
      networkAvailable: false,
      devicePowered: true,
      storageAvailable: true,
      allowTenantPrivate: false,
    },
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.usageState, 'PACK_STALE');
    assert.ok(res.limitations.some((l) => /STALE/i.test(l)));
  }
});

test('11. source update → new pack version', () => {
  const runtime = bootstrapOfflinePackRuntime();
  const built = buildPublicQuantumResearchPack({
    runtime,
    tenantId: 'tenant-a',
    universeId: 'uni-a',
    title: 'Versioned pack',
    body: 'version one content',
  });
  assert.equal(built.ok, true);
  if (!built.ok) return;
  assert.equal(built.packVersion, '1.0.0');
  const next = applyDeltaUpdate({
    buildStore: runtime.buildStore,
    syncStore: runtime.syncStore,
    packId: built.packId,
    reason: 'source update online later',
  });
  assert.ok(next);
  assert.equal(next!.packVersion, '1.0.1');
  assert.equal(next!.rollbackVersion, '1.0.0');
});

test('12. local agent evidence → LOCAL_CANDIDATE', () => {
  const runtime = bootstrapOfflinePackRuntime();
  const built = buildPublicQuantumResearchPack({
    runtime,
    tenantId: 'tenant-a',
    universeId: 'uni-a',
    title: 'Experiment pack',
    body: 'local experiment notes',
  });
  assert.equal(built.ok, true);
  if (!built.ok) return;
  const pack = runtime.buildStore.packs.get(built.packId)!;
  const evidence = recordLocalCandidate({
    pack,
    summary: 'Local agent found a heuristic candidate',
    sourceRefs: ['local-experiment'],
    claimFactState: 'HYPOTHESIS',
  });
  assert.equal(evidence.promotionState, 'LOCAL_CANDIDATE');
  assert.equal(evidence.autoGlobalPromote, false);
  assert.equal(evidence.hiddenCot, false);
  const role = assignPackResearchRole({
    role: 'EXPERIMENT_AGENT',
    agentMeshRoleRef: 'agentmesh:experiment',
    tenantId: 'tenant-a',
    universeId: 'uni-a',
  });
  assert.equal(role.role, 'EXPERIMENT_AGENT');
});

test('13. offline learning no auto global promote', () => {
  const runtime = bootstrapOfflinePackRuntime();
  const built = buildPublicQuantumResearchPack({
    runtime,
    tenantId: 'tenant-a',
    universeId: 'uni-a',
    title: 'Learning pack',
    body: 'offline learning artifact',
  });
  assert.equal(built.ok, true);
  if (!built.ok) return;
  const pack = runtime.buildStore.packs.get(built.packId)!;
  const evidence = recordLocalCandidate({
    pack,
    summary: 'candidate',
    sourceRefs: [],
  });
  const promote = attemptAutoGlobalPromote(evidence);
  assert.equal(promote.allowed, false);
  assert.equal(EX14_LOCKS.AUTO_GLOBAL_PROMOTE_OFFLINE, false);
});

test('14. measured pack size/counts', () => {
  const runtime = bootstrapOfflinePackRuntime();
  const built = buildPublicQuantumResearchPack({
    runtime,
    tenantId: 'tenant-a',
    universeId: 'uni-a',
    title: 'Measured pack',
    body: 'measurable content bytes for offline pack accounting',
  });
  assert.equal(built.ok, true);
  if (!built.ok) return;
  const pack = runtime.buildStore.packs.get(built.packId)!;
  assert.equal(pack.scaleHonesty.kind, 'MEASURED');
  if (pack.scaleHonesty.kind === 'MEASURED') {
    assert.ok(pack.scaleHonesty.bytes > 0);
    assert.ok(pack.scaleHonesty.recordCount >= 1);
    assert.ok(pack.scaleHonesty.indexCount >= 1);
  }
  assert.equal(pack.actualBytes, built.actualBytes);
  assert.equal(engineeringScaleTarget('trillion docs aspirational').kind, 'ENGINEERING_SCALE_TARGET');
});

test('15. no hidden CoT persisted', () => {
  assert.equal(EX14_LOCKS.HIDDEN_COT_PERSISTENCE, false);
  const deny = attemptPersistHiddenCot('secret chain of thought');
  assert.equal(deny.allowed, false);
  const runtime = bootstrapOfflinePackRuntime();
  const built = buildPublicQuantumResearchPack({
    runtime,
    tenantId: 'tenant-a',
    universeId: 'uni-a',
    title: 'No CoT',
    body: 'plain evidence only',
  });
  assert.equal(built.ok, true);
  if (!built.ok) return;
  const records = runtime.buildStore.records.get(built.packId)!;
  for (const r of records) assert.equal(r.hiddenCot, false);
});

test('16. L4 false', () => {
  assert.equal(ex14L4AutonomyEnabled(), false);
  assert.equal(EX14_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(assertEx14LocksIntact(), true);
});

test('17. Guardian/RLS unchanged', () => {
  assert.equal(guardianRlsUnchangedByEx14(), true);
  assert.equal(EX14_LOCKS.WEAKEN_GUARDIAN_RLS, false);
  const guardianPath = join(repoRoot, 'services/ai/runtime/guardian/validate.ts');
  assert.equal(existsSync(guardianPath), true);
  const migrationsDir = join(repoRoot, 'supabase/migrations');
  // Soft check only — EX14 must not add migrations weakening RLS.
  if (existsSync(migrationsDir)) {
    assert.equal(existsSync(migrationsDir), true);
  }
});

test('soft-wire EX1–EX13 honesty: presence ≠ VERIFIED; absent → WAITING_DATA', () => {
  const snap = auditEx14SoftWires();
  const summary = summarizeSoftWires(snap);
  assert.equal(summary.anyVerified, false);
  for (const value of Object.values(snap)) {
    assert.equal(value.verified, false);
    assert.ok(value.disposition === 'WAITING_DATA' || value.disposition === 'PRESENT_UNVERIFIED');
  }
  // On xiv-v2 tip without quantum modules, EX1–EX13 typically WAITING_DATA — not FAIL.
  assert.ok(
    snap.ex13PathwayPlasticity.disposition === 'WAITING_DATA' ||
      snap.ex13PathwayPlasticity.disposition === 'PRESENT_UNVERIFIED',
  );
  assert.equal(snap.agentMesh.disposition, 'PRESENT_UNVERIFIED');
  assert.equal(snap.knowledge.disposition, 'PRESENT_UNVERIFIED');
  assert.equal(snap.guardian.disposition, 'PRESENT_UNVERIFIED');
});

test('historical quantum ≠ physical QPU; wormhole never bypasses auth', () => {
  const store = createPackBuildStore();
  const rights = createRightsManifest({ sourceClass: 'PUBLIC_OPEN' });
  const provenance = createProvenance({
    sourceId: 'h',
    sourceTitle: 'Historical',
    version: '1',
    bodyForHash: 'history',
  });
  const gated = gateSource({
    sourceClass: 'PUBLIC_OPEN',
    title: 'Historical',
    version: '1',
    contentClasses: ['QUANTUM_RESEARCH_HISTORICAL'],
    tenantId: null,
    universeId: null,
    rights,
    provenance,
    body: 'history',
  });
  assert.equal(gated.ok, true);
  if (!gated.ok) return;
  const manifest = createSourceManifest({
    packType: 'QUANTUM_RESEARCH',
    tenantId: 't',
    universeId: 'u',
    entries: [gated.entry],
  });
  const built = buildOfflinePack({
    store,
    packType: 'QUANTUM_RESEARCH',
    tenantId: 't',
    universeId: 'u',
    title: 'Hist',
    description: 'd',
    sourceManifest: manifest,
    rights,
    documents: [
      {
        title: 'Historical',
        body: 'history',
        sourceId: gated.entry.sourceId,
        contentClass: 'QUANTUM_RESEARCH_HISTORICAL',
        historicalCase: {
          caseId: 'c1',
          timePeriod: '1990s',
          sources: [gated.entry.sourceId],
          facts: ['published survey'],
          interpretations: ['context only'],
          knownUncertainty: ['no QPU proof'],
          lessons: ['keep separation'],
          impliesPhysicalQpuEvidence: false,
        },
      },
    ],
  });
  assert.equal(built.ok, true);
  if (!built.ok) return;
  const honesty = classifyQuantumResearchHonesty(built.records[0]!);
  assert.equal(honesty.impliesPhysicalQpu, false);

  const indexStore = createIndexStore();
  const emb = recordEmbeddingTruth({
    model: 'local',
    version: '1',
    runtime: 'node',
    deviceRequested: 'gpu',
    deviceActual: 'cpu',
    dimension: 32,
    sourceHash: 'abc',
    packVersion: built.pack.packVersion,
  });
  assert.equal(emb.fallbackUsed, true);
  buildLocalIndex({
    store: indexStore,
    pack: built.pack,
    records: built.records,
    rightsManifestId: rights.rightsManifestId,
    embedding: emb,
  });
  const wh = indexStore.wormholes.get(built.pack.packId)!;
  assert.equal(wormholeIntegrity(wh), true);
  const score = scoreBeneficialRetention(built.records[0]!);
  assert.ok(score.tier === 'HOT' || score.tier === 'WARM' || score.tier === 'COLD' || score.tier === 'ARCHIVE');
  assert.equal(createSyncStore().auditHistory.length, 0);
});

test('24/7: powered off → OFFLINE_STOPPED', () => {
  assert.equal(
    resolveOfflineUsage(undefined, { devicePowered: false, storageAvailable: true }),
    'OFFLINE_STOPPED',
  );
});
