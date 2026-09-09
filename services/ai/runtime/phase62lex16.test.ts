/**
 * 62L-EX16 — Quantum Algorithm Translation Layer required honesty tests.
 * Script: npm run test:62lex16
 * Deterministic. No network. No real QPU.
 * Do not report unrun tests as PASS. L4 remains false.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  EX16_LOCKS,
  EX16_COMPILER_VERSION,
  EX16_SCHEMA_VERSION,
  assertEx16LocksIntact,
  assertProblemIrAccess,
  auditEx16SoftWires,
  bindProviderAdapter,
  buildCrossChipCapabilityGraph,
  buildXivCircuitIR,
  buildXivTranslationDna,
  canEnterExecutionRouter,
  checkWormholeFreshness,
  circuitImpliesPhysicalQpu,
  cpuGpuNpuShareWorkloadIr,
  createXivProblemIR,
  emitTranslationReceipt,
  explainNeuralPathway,
  ex16L4AutonomyEnabled,
  generateAlgorithmCandidates,
  guardianRlsUnchangedByEx16,
  hasAutoPreferred,
  historicalAtlasResearchStatus,
  invalidateStalePreference,
  learningChangesAuthority,
  openTranslationWormhole,
  quboRemainsQuantumInspired,
  recordAlgorithmBridge,
  reduceFullWorkloadToEdgeProfile,
  runCompilerPipeline,
  summarizeSoftWires,
  translateAlgorithm,
  validateProblemIR,
  vendorAdaptersShareWorkloadIr,
  applyTranslationFeedback,
  type XivProblemIR,
} from './quantum/index.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const GUARDIAN_DIR = join(HERE, 'guardian');
const NOW = '2026-09-09T23:00:00.000Z';

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

function validProblemInput(overrides: Record<string, unknown> = {}) {
  return {
    missionId: 'mission-ex16',
    taskId: 'task-ex16',
    problemId: 'prob-routing-1',
    problemClass: 'GRAPH_ROUTE',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    objective: {
      id: 'obj1',
      sense: 'MINIMIZE' as const,
      expression: 'sum(edge_cost)',
      weight: 1,
    },
    variables: [
      { id: 'v0', kind: 'VARIABLE' as const, label: 'x0' },
      { id: 'v1', kind: 'VARIABLE' as const, label: 'x1' },
    ],
    constraints: [
      {
        id: 'c1',
        expression: 'x0 + x1 <= 1',
        mapped: true,
        sense: 'LE' as const,
      },
    ],
    dimensions: { n: 4, m: 2, k: 1 },
    representationTargets: ['CLASSICAL_GRAPH' as const, 'QUBO_INSPIRED' as const],
    preferredExecutionClasses: ['CLASSICAL' as const, 'QUANTUM_INSPIRED' as const],
    createdAt: NOW,
    ...overrides,
  };
}

function mustCreateIR(overrides: Record<string, unknown> = {}): XivProblemIR {
  const ir = createXivProblemIR(validProblemInput(overrides));
  if ('denied' in ir) throw new Error(`unexpected deny: ${ir.reason}`);
  return ir;
}

test('1. valid problem → valid canonical IR', () => {
  const ir = mustCreateIR();
  assert.equal(ir.status, 'VALID');
  assert.equal(ir.schemaVersion, EX16_SCHEMA_VERSION);
  assert.ok(ir.irId.startsWith('pir_'));
  assert.equal(ir.objective.expression, 'sum(edge_cost)');
  assert.equal(ir.constraints[0]?.mapped, true);
  const v = validateProblemIR(ir);
  assert.equal(v.ok, true);
  assert.equal(v.status, 'VALID');
});

test('2. invalid dimensions → denied', () => {
  const bad = createXivProblemIR(validProblemInput({ dimensions: { n: 0, m: 1, k: 1 } }));
  assert.equal('denied' in bad, true);
  if ('denied' in bad) {
    assert.match(bad.reason, /invalid dimensions/);
  }
});

test('3. missing constraint mapping → rejected', () => {
  const bad = createXivProblemIR(
    validProblemInput({
      constraints: [
        { id: 'c_unmapped', expression: 'x0=1', mapped: false, sense: 'EQ' },
      ],
    }),
  );
  assert.equal('denied' in bad, true);
  if ('denied' in bad) {
    assert.match(bad.reason, /missing constraint mapping/);
  }
});

test('4. lossless preserves objective', () => {
  const ir = mustCreateIR();
  const t = translateAlgorithm({
    problem: ir,
    target: 'CLASSICAL_GRAPH',
    compilerVersion: EX16_COMPILER_VERSION,
    createdAt: NOW,
  });
  assert.equal(t.lossyState, 'LOSSLESS');
  assert.equal(t.objectivePreserved, true);
  assert.equal(t.semanticEquivalence, 'SEMANTICALLY_EQUIVALENT');
});

test('5. lossy records approximation', () => {
  const ir = mustCreateIR();
  const t = translateAlgorithm({
    problem: ir,
    target: 'CLASSICAL_GRAPH',
    lossy: true,
    approximateObjective: 'sum(edge_cost)_approx',
    compilerVersion: EX16_COMPILER_VERSION,
    createdAt: NOW,
  });
  assert.ok(t.lossyState === 'LOSSY' || t.lossyState === 'EQUIVALENT_WITH_TOLERANCE');
  assert.equal(t.objectivePreserved, false);
  assert.ok(t.approximationNotes.some((n) => /approximation recorded/.test(n)));
});

test('6. QUBO remains QUANTUM_INSPIRED candidate', () => {
  const ir = mustCreateIR();
  const t = translateAlgorithm({
    problem: ir,
    target: 'QUBO_INSPIRED',
    compilerVersion: EX16_COMPILER_VERSION,
    createdAt: NOW,
  });
  assert.equal(quboRemainsQuantumInspired(t), true);
  assert.equal(t.physicalQpuVerified, false);
  assert.ok(t.quboMatrix);
});

test('7. circuit IR ≠ physical-QPU execution', () => {
  const ir = mustCreateIR();
  const circuit = buildXivCircuitIR({ problem: ir, qubitCount: 4 });
  assert.equal(circuit.impliesPhysicalQpuExecution, false);
  assert.equal(circuit.physicalQpuVerified, false);
  assert.equal(circuit.providerNeutral, true);
  assert.equal(circuit.embedsCredentials, false);
  assert.equal(circuitImpliesPhysicalQpu(circuit), false);
  const t = translateAlgorithm({
    problem: ir,
    target: 'QUANTUM_CIRCUIT_IR',
    compilerVersion: EX16_COMPILER_VERSION,
    createdAt: NOW,
  });
  assert.equal(t.physicalQpuVerified, false);
  assert.ok(t.circuit);
});

test('8. identical cached translation must pass freshness', () => {
  const ir = mustCreateIR();
  const t = translateAlgorithm({
    problem: ir,
    target: 'LINEAR_PROGRAM',
    compilerVersion: EX16_COMPILER_VERSION,
    createdAt: NOW,
  });
  const wh = openTranslationWormhole(t);
  const fresh = checkWormholeFreshness({
    wormhole: wh,
    translation: t,
    nowIso: NOW,
  });
  assert.equal(fresh.fresh, true);
});

test('9. stale compiler version invalidates old preference', () => {
  const ir = mustCreateIR();
  const result = invalidateStalePreference({
    problem: ir,
    translationCompilerVersion: 'ex16-compiler-0.9.0',
    translationSchemaVersion: EX16_SCHEMA_VERSION,
  });
  assert.equal(result.stale, true);
  if (result.stale) {
    assert.equal(result.preference, 'INVALIDATED');
    assert.equal(result.problem.status, 'STALE');
  }
  const t = translateAlgorithm({
    problem: ir,
    target: 'CLASSICAL_GRAPH',
    compilerVersion: 'ex16-compiler-0.9.0',
    createdAt: NOW,
  });
  const wh = openTranslationWormhole(t);
  const fresh = checkWormholeFreshness({
    wormhole: wh,
    translation: t,
    nowIso: NOW,
    currentCompilerVersion: EX16_COMPILER_VERSION,
  });
  assert.equal(fresh.fresh, false);
  if (!fresh.fresh) assert.equal(fresh.reason, 'STALE_COMPILER');
});

test('10. CPU/GPU/NPU paths use same workload IR', () => {
  const ir = mustCreateIR();
  const shared = cpuGpuNpuShareWorkloadIr(ir);
  assert.equal(shared.sharedIrId, ir.irId);
  assert.ok(shared.paths.every((p) => p.irId === ir.irId));
  const graph = buildCrossChipCapabilityGraph(ir);
  assert.equal(graph.hardCodedGpuNpuBetter, false);
  assert.equal(graph.workloadIrId, ir.irId);
  const vendors = vendorAdaptersShareWorkloadIr(ir);
  assert.equal(vendors.sharedIrId, ir.irId);
  assert.ok(vendors.bindings.length >= 3);
  const edge = reduceFullWorkloadToEdgeProfile(ir);
  assert.equal(edge.mode, 'EDGE_PROFILE');
  assert.equal(edge.from, 'FULL_WORKLOAD');
  assert.ok(edge.reductions.length > 0);
});

test('11. provider adapter cannot broaden permissions', () => {
  const ir = mustCreateIR();
  const t = translateAlgorithm({
    problem: ir,
    target: 'CLASSICAL_GRAPH',
    compilerVersion: EX16_COMPILER_VERSION,
    createdAt: NOW,
  });
  const denied = bindProviderAdapter({
    kind: 'NVIDIA_COMPUTE',
    problem: ir,
    translation: t,
    actor: { tenantId: ir.tenantId, universeId: ir.universeId },
    grantedPermissions: ['translate'],
    requestedPermissions: ['translate', 'admin'],
    offline: false,
  });
  assert.equal('denied' in denied, true);
  if ('denied' in denied) {
    assert.match(denied.reason, /cannot broaden permissions/);
  }
  const ok = bindProviderAdapter({
    kind: 'LOCAL_CLASSICAL',
    problem: ir,
    translation: t,
    actor: { tenantId: ir.tenantId, universeId: ir.universeId },
    grantedPermissions: ['translate'],
    offline: true,
  });
  assert.equal('denied' in ok, false);
  if (!('denied' in ok)) {
    assert.equal(ok.adapter.ownsMissionAuthority, false);
    assert.equal(ok.adapter.canBroadenPermissions, false);
  }
});

test('12. invalid translation cannot enter execution router', () => {
  const ir = mustCreateIR();
  const compiled = runCompilerPipeline({
    problem: { ...ir, status: 'INVALID', constraints: [] },
    target: 'CLASSICAL_GRAPH',
  });
  // Force invalid via unmapped path: create validation fail
  const badIr = {
    ...ir,
    constraints: [{ id: 'x', expression: 'bad', mapped: false, sense: 'EQ' as const }],
  };
  const v = validateProblemIR(badIr);
  assert.equal(v.ok, false);
  assert.equal(v.status, 'TRANSLATION_FAILED');
  assert.equal(canEnterExecutionRouter(v), false);
  assert.equal(EX16_LOCKS.INVALID_TRANSLATION_ENTERS_ROUTER, false);
  const t = translateAlgorithm({
    problem: badIr,
    target: 'CLASSICAL_GRAPH',
    compilerVersion: EX16_COMPILER_VERSION,
  });
  assert.equal(t.status, 'TRANSLATION_FAILED');
  assert.equal(compiled.mayEnterExecutionRouter || canEnterExecutionRouter(v), false);
});

test('13. cross-tenant IR DENIED', () => {
  const ir = mustCreateIR();
  const denied = assertProblemIrAccess(ir, {
    tenantId: 'tenant-b',
    universeId: ir.universeId,
  });
  assert.ok(denied);
  assert.match(denied!.reason, /cross-tenant/);
});

test('14. cross-Universe IR DENIED', () => {
  const ir = mustCreateIR();
  const denied = assertProblemIrAccess(ir, {
    tenantId: ir.tenantId,
    universeId: 'universe-b',
  });
  assert.ok(denied);
  assert.match(denied!.reason, /cross-Universe/);
});

test('15. offline translation without provider', () => {
  const ir = mustCreateIR({ offlineCapable: true, localOnly: true });
  const compiled = runCompilerPipeline({
    problem: ir,
    target: 'CLASSICAL_GRAPH',
  });
  assert.equal(compiled.ok, true);
  assert.ok(compiled.translation);
  const receipt = emitTranslationReceipt({
    problem: ir,
    translation: compiled.translation!,
    compiler: compiled,
    offline: true,
    createdAt: NOW,
  });
  assert.equal(receipt.offline, true);
  assert.equal(receipt.physicalQpuVerified, false);
  const waiting = bindProviderAdapter({
    kind: 'PHYSICAL_QPU_PROVIDER',
    problem: ir,
    translation: compiled.translation!,
    actor: { tenantId: ir.tenantId, universeId: ir.universeId },
    grantedPermissions: ['translate'],
    offline: true,
  });
  assert.equal('denied' in waiting, false);
  if (!('denied' in waiting)) {
    assert.equal(waiting.status, 'WAITING_PROVIDER');
  }
});

test('16. learning cannot change authority', () => {
  const ir = mustCreateIR();
  const t = translateAlgorithm({
    problem: ir,
    target: 'CLASSICAL_GRAPH',
    compilerVersion: EX16_COMPILER_VERSION,
    createdAt: NOW,
  });
  const fb = applyTranslationFeedback({ translation: t, metricDelta: 1 });
  assert.equal(fb.outcome, 'STRENGTHENED');
  assert.equal(fb.authorityChanged, false);
  assert.equal(fb.permissionsChanged, false);
  const reg = applyTranslationFeedback({ translation: t, metricDelta: -1 });
  assert.equal(reg.outcome, 'REGRESSED');
  assert.equal(learningChangesAuthority(), false);
  const path = explainNeuralPathway(t.translationId);
  assert.equal(path.explainable, true);
  assert.equal(path.authorityChanged, false);
  const batch = generateAlgorithmCandidates({ problem: ir, maxParallel: 4 });
  assert.equal(hasAutoPreferred(batch), false);
  assert.ok(batch.candidates.every((c) => c.preferred === false));
  assert.ok(batch.candidates.some((c) => c.classicalFirstClass));
  const dna = buildXivTranslationDna();
  assert.equal(dna.owner, 'XIV');
  assert.equal(dna.proprietaryCompilerInternalsExposed, false);
  const receipt = emitTranslationReceipt({
    problem: ir,
    translation: t,
    offline: true,
    createdAt: NOW,
  });
  const bridge = recordAlgorithmBridge({
    from: 'CLASSICAL_GRAPH',
    to: 'QUBO_INSPIRED',
    translation: t,
    receipt,
  });
  assert.equal(bridge.status, 'RECORDED');
  assert.ok(bridge.provenance.length > 0);
});

test('17. L4 false', () => {
  assert.equal(ex16L4AutonomyEnabled(), false);
  assert.equal(EX16_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(assertEx16LocksIntact(), true);
});

test('18. Guardian/RLS unchanged', () => {
  assert.equal(guardianRlsUnchangedByEx16(), true);
  assert.equal(EX16_LOCKS.WEAKEN_GUARDIAN_RLS, false);
  const after = hashGuardianTree(GUARDIAN_DIR);
  assert.equal(after, GUARDIAN_HASH_BEFORE);
});

test('soft-wire: EX1–EX15 presence ≠ VERIFIED; historical → CANDIDATE', () => {
  const snap = auditEx16SoftWires();
  const summary = summarizeSoftWires(snap);
  assert.equal(summary.anyVerified, false);
  for (const key of summary.presentUnverified) {
    const hop = snap[key as keyof typeof snap];
    assert.equal(hop.verified, false);
    assert.equal(hop.disposition, 'PRESENT_UNVERIFIED');
  }
  for (const key of summary.waitingData) {
    const hop = snap[key as keyof typeof snap];
    assert.equal(hop.disposition, 'WAITING_DATA');
  }
  const hist = historicalAtlasResearchStatus(snap);
  assert.ok(hist === 'CANDIDATE' || hist === 'WAITING_DATA');
  assert.equal(summary.historicalAtlasAsCandidateOnly, true);
  // Material semantic change → SEMANTICALLY_DIFFERENT
  const ir = mustCreateIR();
  const diff = translateAlgorithm({
    problem: ir,
    target: 'CLASSICAL_GRAPH',
    materialChange: true,
    approximateObjective: 'totally_different_obj',
    compilerVersion: EX16_COMPILER_VERSION,
  });
  assert.equal(diff.semanticEquivalence, 'SEMANTICALLY_DIFFERENT');
});
