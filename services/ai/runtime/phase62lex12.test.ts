/**
 * 62L-EX12 — Quantum Pathway Graph required honesty tests.
 * Script: npm run test:62lex12
 * Deterministic. No network. No real QPU.
 * Do not report unrun tests as PASS. L4 remains false.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EX12_LOCKS,
  applyEx12NeuralPathwayLesson,
  assertEx12LocksIntact,
  assertSimulatorTruthLabel,
  attemptPromoteLocalEdgeGlobally,
  auditEx12SoftWires,
  authorizeSoftwareWormhole,
  classifySimulatorPath,
  consciousnessClaimedAsVerified,
  createEdgeDraft,
  createExplicitFallbackEdge,
  createLocalOfflineEdge,
  createNode,
  createPathwayGraph,
  edgeSatisfiesVerifiedRoute,
  evidenceMayStrengthenVerifiedRoute,
  excludeExpiredOrRevokedEvidence,
  ex12L4AutonomyEnabled,
  getEdge,
  guardianRlsUnchangedByEx12,
  hypothesisSatisfiesVerifiedRoute,
  isBiologicalConsciousnessGraph,
  localEdgeStartsAsCandidate,
  queryPathwayEdge,
  recordContradictionEdge,
  recordFailedOnEdge,
  replaceEdge,
  reportGraphScale,
  seedCanonicalSkeleton,
  strengthenEdgeWeight,
  superintelligenceClaimedAsVerified,
  upsertEdge,
  upsertNode,
  weakenEdgeForStaleRuntime,
  type AccessQuery,
  type PathwayGraph,
} from './quantum/index.ts';

const NOW = '2026-09-09T22:50:00.000Z';
const FUTURE = '2026-12-31T00:00:00.000Z';
const PAST = '2026-01-01T00:00:00.000Z';
const HERE = dirname(fileURLToPath(import.meta.url));
const GUARDIAN_DIR = join(HERE, 'guardian');

function hashGuardianTree(dir: string): string {
  const hash = createHash('sha256');
  const walk = (p: string) => {
    for (const name of readdirSync(p).sort()) {
      const full = join(p, name);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else {
        hash.update(full);
        hash.update(readFileSync(full));
      }
    }
  };
  walk(dir);
  return hash.digest('hex');
}

const GUARDIAN_HASH_BEFORE = hashGuardianTree(GUARDIAN_DIR);

function scopeQuery(overrides: Partial<AccessQuery> = {}): AccessQuery {
  return {
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    guardianActive: true,
    runtimeAuthorized: true,
    ...overrides,
  };
}

function baseGraph(): { graph: PathwayGraph; query: AccessQuery } {
  const query = scopeQuery();
  const graph = createPathwayGraph(
    { tenantId: query.tenantId, universeId: query.universeId },
    NOW,
  );
  return { graph, query };
}

function seedTwoDevices(graph: PathwayGraph, query: AccessQuery) {
  const a = upsertNode(
    graph,
    createNode({
      nodeId: 'dev-sim',
      nodeType: 'SIMULATOR',
      label: 'Local simulator',
      tenantId: graph.tenantId,
      universeId: graph.universeId,
      quantumTruthLabel: 'SIMULATED_QUANTUM',
      nowIso: NOW,
    }),
    query,
  );
  assert.ok(!('denied' in a));
  const b = upsertNode(
    graph,
    createNode({
      nodeId: 'dev-cpu',
      nodeType: 'CPU',
      label: 'CPU fallback',
      tenantId: graph.tenantId,
      universeId: graph.universeId,
      quantumTruthLabel: 'CLASSICAL',
      nowIso: NOW,
    }),
    query,
  );
  assert.ok(!('denied' in b));
  const c = upsertNode(
    graph,
    createNode({
      nodeId: 'dev-gpu',
      nodeType: 'GPU',
      label: 'GPU fallback',
      tenantId: graph.tenantId,
      universeId: graph.universeId,
      quantumTruthLabel: 'CLASSICAL',
      nowIso: NOW,
    }),
    query,
  );
  assert.ok(!('denied' in c));
  const d = upsertNode(
    graph,
    createNode({
      nodeId: 'dev-npu',
      nodeType: 'NPU',
      label: 'NPU fallback',
      tenantId: graph.tenantId,
      universeId: graph.universeId,
      quantumTruthLabel: 'CLASSICAL',
      nowIso: NOW,
    }),
    query,
  );
  assert.ok(!('denied' in d));
}

// --- 1. hypothesis edge cannot satisfy VERIFIED route ---
{
  assert.equal(hypothesisSatisfiesVerifiedRoute('HYPOTHESIS'), false);
  const { graph, query } = baseGraph();
  seedTwoDevices(graph, query);
  const edge = upsertEdge(
    graph,
    createEdgeDraft({
      edgeId: 'e-hyp',
      source: 'dev-sim',
      target: 'dev-cpu',
      edgeType: 'RUNS_ON',
      tenantId: graph.tenantId,
      universeId: graph.universeId,
      evidenceState: 'HYPOTHESIS',
      quantumTruthLabel: 'SIMULATED_QUANTUM',
      nowIso: NOW,
    }),
    query,
  );
  assert.ok(!('denied' in edge));
  assert.equal(edgeSatisfiesVerifiedRoute(edge, NOW), false);
  console.log('PASS: 1 hypothesis edge cannot satisfy VERIFIED route');
}

// --- 2. verified reproducible evidence may strengthen route ---
{
  const { graph, query } = baseGraph();
  seedTwoDevices(graph, query);
  const edge = upsertEdge(
    graph,
    createEdgeDraft({
      edgeId: 'e-str',
      source: 'dev-sim',
      target: 'dev-cpu',
      edgeType: 'SUPPORTED_BY_EVIDENCE',
      tenantId: graph.tenantId,
      universeId: graph.universeId,
      evidenceState: 'MEASURED',
      quantumTruthLabel: 'CLASSICAL',
      nowIso: NOW,
      weight: 0.5,
    }),
    query,
  );
  assert.ok(!('denied' in edge));
  const gate = evidenceMayStrengthenVerifiedRoute(
    {
      evidenceId: 'ev-1',
      evidenceState: 'REPRODUCIBLE',
      reproducible: true,
      expiresAt: FUTURE,
      revoked: false,
      fresh: true,
    },
    NOW,
  );
  assert.equal(gate.ok, true);
  const strengthened = strengthenEdgeWeight(
    edge,
    {
      evidenceId: 'ev-1',
      evidenceState: 'REPRODUCIBLE',
      reproducible: true,
      expiresAt: FUTURE,
      revoked: false,
      fresh: true,
    },
    NOW,
  );
  assert.equal(strengthened.ok, true);
  if (strengthened.ok) {
    assert.ok(strengthened.edge.weight > edge.weight);
    replaceEdge(graph, strengthened.edge, query);
  }
  console.log('PASS: 2 verified reproducible evidence may strengthen route');
}

// --- 3. failed experiment creates FAILED_ON edge ---
{
  const { graph, query } = baseGraph();
  seedTwoDevices(graph, query);
  const failed = recordFailedOnEdge(
    graph,
    {
      edgeId: 'e-fail',
      source: 'dev-sim',
      target: 'dev-cpu',
      nowIso: NOW,
      evidenceRefs: ['exp-fail-1'],
      quantumTruthLabel: 'SIMULATED_QUANTUM',
    },
    query,
  );
  assert.ok(!('denied' in failed));
  assert.equal(failed.edgeType, 'FAILED_ON');
  assert.equal(getEdge(graph, 'e-fail')?.edgeType, 'FAILED_ON');
  console.log('PASS: 3 failed experiment creates FAILED_ON edge');
}

// --- 4. contradiction preserved ---
{
  const { graph, query } = baseGraph();
  seedTwoDevices(graph, query);
  const c = recordContradictionEdge(
    graph,
    {
      edgeId: 'e-contra',
      source: 'dev-sim',
      target: 'dev-cpu',
      nowIso: NOW,
      evidenceRefs: ['ev-a', 'ev-b'],
    },
    query,
  );
  assert.ok(!('denied' in c));
  assert.equal(c.edgeType, 'CONTRADICTS');
  assert.equal(c.evidenceState, 'CONTRADICTED');
  assert.ok(getEdge(graph, 'e-contra'));
  console.log('PASS: 4 contradiction preserved');
}

// --- 5. stale runtime weakens pathway ---
{
  const { graph, query } = baseGraph();
  seedTwoDevices(graph, query);
  const edge = upsertEdge(
    graph,
    createEdgeDraft({
      edgeId: 'e-stale',
      source: 'dev-sim',
      target: 'dev-cpu',
      edgeType: 'RUNS_ON',
      tenantId: graph.tenantId,
      universeId: graph.universeId,
      evidenceState: 'VERIFIED',
      quantumTruthLabel: 'CLASSICAL',
      nowIso: NOW,
      weight: 0.9,
    }),
    query,
  );
  assert.ok(!('denied' in edge));
  const weakened = weakenEdgeForStaleRuntime(edge, NOW);
  assert.ok(weakened.weight < edge.weight);
  assert.equal(weakened.freshnessState, 'STALE');
  assert.equal(weakened.preferred, false);
  console.log('PASS: 5 stale runtime weakens pathway');
}

// --- 6. rejected evidence cannot strengthen pathway ---
{
  const gate = evidenceMayStrengthenVerifiedRoute(
    {
      evidenceId: 'ev-rej',
      evidenceState: 'REJECTED',
      reproducible: true,
      expiresAt: FUTURE,
      revoked: false,
      fresh: true,
    },
    NOW,
  );
  assert.equal(gate.ok, false);
  assert.match(gate.reason, /REJECTED/);
  console.log('PASS: 6 rejected evidence cannot strengthen pathway');
}

// --- 7. simulator path remains SIMULATED_QUANTUM ---
{
  const label = classifySimulatorPath();
  assert.equal(label, 'SIMULATED_QUANTUM');
  assert.equal(assertSimulatorTruthLabel(label), true);
  assert.equal(assertSimulatorTruthLabel('PHYSICAL_QPU_VERIFIED'), false);
  console.log('PASS: 7 simulator path remains SIMULATED_QUANTUM');
}

// --- 8. CPU/GPU/NPU fallback remains explicit ---
{
  const { graph, query } = baseGraph();
  seedTwoDevices(graph, query);
  const cpu = createExplicitFallbackEdge(
    graph,
    { edgeId: 'e-fb-cpu', fromDevice: 'dev-sim', toDevice: 'dev-cpu', fallbackKind: 'CPU', nowIso: NOW },
    query,
  );
  const gpu = createExplicitFallbackEdge(
    graph,
    { edgeId: 'e-fb-gpu', fromDevice: 'dev-sim', toDevice: 'dev-gpu', fallbackKind: 'GPU', nowIso: NOW },
    query,
  );
  const npu = createExplicitFallbackEdge(
    graph,
    { edgeId: 'e-fb-npu', fromDevice: 'dev-sim', toDevice: 'dev-npu', fallbackKind: 'NPU', nowIso: NOW },
    query,
  );
  assert.ok(!('denied' in cpu) && !('denied' in gpu) && !('denied' in npu));
  assert.equal(cpu.edgeType, 'FALLBACK_TO');
  assert.equal(cpu.quantumTruthLabel, 'CLASSICAL');
  assert.match(cpu.weightReason, /CPU/);
  assert.match(gpu.weightReason, /GPU/);
  assert.match(npu.weightReason, /NPU/);
  console.log('PASS: 8 CPU/GPU/NPU fallback remains explicit');
}

// --- 9. pathway preference cannot change permissions ---
{
  const denied = applyEx12NeuralPathwayLesson({
    pathwayEdgeId: 'e-pref',
    rankingDelta: 0.1,
    confidenceDelta: 0.05,
    retestRecommended: true,
    mayChangePermissions: true,
  });
  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, 'PATHWAY_PREFERENCE_CANNOT_CHANGE_PERMISSIONS');
  const ok = applyEx12NeuralPathwayLesson({
    pathwayEdgeId: 'e-pref',
    rankingDelta: 0.1,
    confidenceDelta: 0.05,
    retestRecommended: true,
  });
  assert.equal(ok.allowed, true);
  assert.equal(ok.lesson?.permissionsChanged, false);
  console.log('PASS: 9 pathway preference cannot change permissions');
}

// --- 10. local offline edge starts LOCAL_CANDIDATE ---
{
  const { graph, query } = baseGraph();
  seedTwoDevices(graph, query);
  const local = createLocalOfflineEdge(
    graph,
    {
      edgeId: 'e-local',
      source: 'dev-sim',
      target: 'dev-cpu',
      edgeType: 'CANDIDATE_ALGORITHM',
      quantumTruthLabel: 'QUANTUM_INSPIRED',
      nowIso: NOW,
    },
    query,
  );
  assert.ok(!('denied' in local));
  assert.equal(local.localPromotion, 'LOCAL_CANDIDATE');
  assert.equal(localEdgeStartsAsCandidate(local), true);
  console.log('PASS: 10 local offline edge starts LOCAL_CANDIDATE');
}

// --- 11. local edge does not auto-promote globally ---
{
  const { graph, query } = baseGraph();
  seedTwoDevices(graph, query);
  const local = createLocalOfflineEdge(
    graph,
    {
      edgeId: 'e-local-2',
      source: 'dev-sim',
      target: 'dev-cpu',
      edgeType: 'CANDIDATE_ALGORITHM',
      quantumTruthLabel: 'CLASSICAL',
      nowIso: NOW,
    },
    query,
  );
  assert.ok(!('denied' in local));
  const auto = attemptPromoteLocalEdgeGlobally(graph, 'e-local-2', query, {
    nowIso: NOW,
    humanApproved: false,
    autoPromote: true,
  });
  assert.equal(auto.ok, false);
  if (!auto.ok) assert.equal(auto.reason, 'LOCAL_EDGE_NO_AUTO_GLOBAL_PROMOTE');
  assert.equal(EX12_LOCKS.AUTO_PROMOTE_LOCAL_GLOBAL, false);
  console.log('PASS: 11 local edge does not auto-promote globally');
}

// --- 12. cross-tenant DENIED ---
{
  const { graph, query } = baseGraph();
  seedTwoDevices(graph, query);
  const denied = upsertEdge(
    graph,
    createEdgeDraft({
      edgeId: 'e-xt',
      source: 'dev-sim',
      target: 'dev-cpu',
      edgeType: 'RUNS_ON',
      tenantId: 'other-tenant',
      universeId: graph.universeId,
      quantumTruthLabel: 'CLASSICAL',
      nowIso: NOW,
    }),
    query,
  );
  assert.ok('denied' in denied);
  assert.equal(denied.reason, 'CROSS_TENANT_DENIED');
  const qDenied = queryPathwayEdge(graph, 'missing', {
    tenantId: 'other-tenant',
    universeId: graph.universeId,
  });
  assert.ok('denied' in qDenied);
  assert.equal(qDenied.reason, 'CROSS_TENANT_DENIED');
  console.log('PASS: 12 cross-tenant DENIED');
}

// --- 13. cross-Universe DENIED ---
{
  const { graph, query } = baseGraph();
  seedTwoDevices(graph, query);
  const denied = upsertEdge(
    graph,
    createEdgeDraft({
      edgeId: 'e-xu',
      source: 'dev-sim',
      target: 'dev-cpu',
      edgeType: 'RUNS_ON',
      tenantId: graph.tenantId,
      universeId: 'other-universe',
      quantumTruthLabel: 'CLASSICAL',
      nowIso: NOW,
    }),
    query,
  );
  assert.ok('denied' in denied);
  assert.equal(denied.reason, 'CROSS_UNIVERSE_DENIED');
  console.log('PASS: 13 cross-Universe DENIED');
}

// --- 14. expired/revoked evidence excluded ---
{
  const { graph, query } = baseGraph();
  seedTwoDevices(graph, query);
  const expired = upsertEdge(
    graph,
    createEdgeDraft({
      edgeId: 'e-exp',
      source: 'dev-sim',
      target: 'dev-cpu',
      edgeType: 'SUPPORTED_BY_EVIDENCE',
      tenantId: graph.tenantId,
      universeId: graph.universeId,
      evidenceState: 'VERIFIED',
      quantumTruthLabel: 'CLASSICAL',
      nowIso: NOW,
      expiresAt: PAST,
      evidenceRefs: ['ev-old'],
    }),
    query,
  );
  assert.ok(!('denied' in expired));
  const ex = excludeExpiredOrRevokedEvidence(expired, NOW);
  assert.equal(ex.included, false);
  assert.equal(ex.reason, 'EXPIRED_EVIDENCE_EXCLUDED');

  const revoked = upsertEdge(
    graph,
    createEdgeDraft({
      edgeId: 'e-rev',
      source: 'dev-sim',
      target: 'dev-cpu',
      edgeType: 'SUPPORTED_BY_EVIDENCE',
      tenantId: graph.tenantId,
      universeId: graph.universeId,
      evidenceState: 'REVOKED',
      quantumTruthLabel: 'CLASSICAL',
      nowIso: NOW,
      revoked: true,
      evidenceRefs: ['ev-rev'],
    }),
    query,
  );
  assert.ok(!('denied' in revoked));
  const rv = excludeExpiredOrRevokedEvidence(revoked, NOW);
  assert.equal(rv.included, false);
  assert.equal(rv.reason, 'REVOKED_EVIDENCE_EXCLUDED');
  console.log('PASS: 14 expired/revoked evidence excluded');
}

// --- 15. pathway query returns evidence refs ---
{
  const { graph, query } = baseGraph();
  seedTwoDevices(graph, query);
  const edge = upsertEdge(
    graph,
    createEdgeDraft({
      edgeId: 'e-q',
      source: 'dev-sim',
      target: 'dev-cpu',
      edgeType: 'SUPPORTED_BY_EVIDENCE',
      tenantId: graph.tenantId,
      universeId: graph.universeId,
      evidenceState: 'SUPPORTED',
      quantumTruthLabel: 'CLASSICAL',
      nowIso: NOW,
      evidenceRefs: ['ev-q-1', 'ev-q-2'],
      benchmarkRefs: ['bench-1'],
    }),
    query,
  );
  assert.ok(!('denied' in edge));
  const result = queryPathwayEdge(graph, 'e-q', query);
  assert.ok(result.ok === true);
  if (result.ok) {
    assert.deepEqual([...result.evidenceRefs], ['ev-q-1', 'ev-q-2']);
    assert.deepEqual([...result.explain.evidenceRefs], ['ev-q-1', 'ev-q-2']);
    assert.equal(result.explain.preferredMeansPermission, false);
  }
  console.log('PASS: 15 pathway query returns evidence refs');
}

// --- 16. graph scale reports measured counts only ---
{
  const { graph, query } = baseGraph();
  const seeded = seedCanonicalSkeleton(graph, query, NOW);
  assert.ok(!('denied' in seeded));
  const scale = reportGraphScale(graph);
  assert.equal(scale.nodeCount, graph.nodes.size);
  assert.equal(scale.edgeCount, graph.edges.size);
  assert.equal(scale.measuredOnly, true);
  assert.equal(scale.fabricatedScaleClaim, false);
  assert.ok(['LAB', 'LOCAL', 'DISTRIBUTED', 'ENTERPRISE', 'ENGINEERING_SCALE_TARGET'].includes(scale.scaleBand));
  assert.ok(scale.nodeCount < 1_000_000);
  console.log('PASS: 16 graph scale reports measured counts only');
}

// --- 17. L4 false ---
{
  assert.equal(ex12L4AutonomyEnabled(), false);
  assert.equal(EX12_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(assertEx12LocksIntact(), true);
  assert.equal(isBiologicalConsciousnessGraph(), false);
  assert.equal(consciousnessClaimedAsVerified(), false);
  assert.equal(superintelligenceClaimedAsVerified(), false);
  const soft = auditEx12SoftWires();
  assert.equal(soft.guardian.verified, false);
  assert.ok(
    soft.ex11EvidenceLedger.disposition === 'WAITING_DATA' ||
      soft.ex11EvidenceLedger.disposition === 'PRESENT_UNVERIFIED',
  );
  const wormhole = authorizeSoftwareWormhole({
    identityOk: true,
    tenantOk: true,
    universeOk: true,
    guardianOk: true,
    privacyOk: true,
    dataClassOk: true,
    runtimeOk: true,
  });
  assert.equal(wormhole.allowed, true);
  const wormholeDenied = authorizeSoftwareWormhole({
    identityOk: true,
    tenantOk: true,
    universeOk: true,
    guardianOk: false,
    privacyOk: true,
    dataClassOk: true,
    runtimeOk: true,
  });
  assert.equal(wormholeDenied.allowed, false);
  console.log('PASS: 17 L4 false');
}

// --- 18. Guardian/RLS unchanged ---
{
  assert.equal(guardianRlsUnchangedByEx12(), true);
  assert.equal(EX12_LOCKS.WEAKEN_GUARDIAN_RLS, false);
  assert.equal(existsSync(GUARDIAN_DIR), true);
  const after = hashGuardianTree(GUARDIAN_DIR);
  assert.equal(after, GUARDIAN_HASH_BEFORE);
  const lesson = applyEx12NeuralPathwayLesson({
    pathwayEdgeId: 'e-g',
    rankingDelta: 0.01,
    confidenceDelta: 0.01,
    retestRecommended: false,
    mayChangeGuardian: true,
    mayChangeRls: true,
  });
  assert.equal(lesson.allowed, false);
  console.log('PASS: 18 Guardian/RLS unchanged');
}

console.log('\n62L-EX12 quantum pathway graph tests: ALL PASS');
