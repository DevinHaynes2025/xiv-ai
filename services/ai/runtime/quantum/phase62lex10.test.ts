/**
 * 62L-EX10 — Benchmark Comparability Gate tests (18 required cases).
 * Parent: 62L-EX / GitHub #170. L4_AUTONOMY_ENABLED=false.
 */

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  applyLearningFromGate,
  clearContradictionStoreForTests,
  defaultExperimentSide,
  defaultHardware,
  evaluateComparabilityGate,
  EX10_LOCKS,
  listContradictionRecords,
  normalizePair,
  runEx10ComparabilityCycle,
  guardianRlsUnchangedByEx10,
} from './index.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '../../../..');

function identicalPair(overrides?: {
  baseline?: Parameters<typeof defaultExperimentSide>[0];
  candidate?: Parameters<typeof defaultExperimentSide>[0];
}) {
  const baseline = defaultExperimentSide({
    receiptId: 'rcpt-a',
    algorithmId: 'algo-a',
    executionClass: 'CLASSICAL',
    ...overrides?.baseline,
  });
  const candidate = defaultExperimentSide({
    receiptId: 'rcpt-b',
    algorithmId: 'algo-b',
    executionClass: 'CLASSICAL',
    runtimeMs: 90,
    runtimesMs: [88, 90, 92],
    qualityScore: 0.97,
    costValue: 0.015,
    ...overrides?.candidate,
  });
  return { baseline, candidate };
}

test('1) identical problem/input/criteria → COMPARABLE', () => {
  const { baseline, candidate } = identicalPair();
  const gate = evaluateComparabilityGate({
    comparisonId: 'cmp-1',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(gate.state, 'COMPARABLE');
  assert.equal(gate.matchFlags.sameProblemDefinition, true);
  assert.equal(gate.matchFlags.sameInput, true);
  assert.equal(gate.matchFlags.sameSuccessCriteria, true);
  assert.notEqual(gate.state, 'PASS' as string);
});

test('2) different problem size → NOT_COMPARABLE', () => {
  const { baseline, candidate } = identicalPair({
    candidate: { problemSize: 128 },
  });
  const gate = evaluateComparabilityGate({
    comparisonId: 'cmp-2',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(gate.state, 'NOT_COMPARABLE');
  assert.ok(gate.reasons.includes('PROBLEM_SIZE_MISMATCH'));
});

test('3) different objective → NOT_COMPARABLE', () => {
  const { baseline, candidate } = identicalPair({
    candidate: {
      successCriteria: {
        criteriaId: 'crit-1',
        objective: 'maximize_quality',
        qualityTarget: 0.95,
        accuracyTolerance: 0.01,
        mustSatisfyConstraints: true,
        outputObjective: 'feasible_solution',
      },
    },
  });
  const gate = evaluateComparabilityGate({
    comparisonId: 'cmp-3',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(gate.state, 'NOT_COMPARABLE');
  assert.ok(gate.reasons.includes('OBJECTIVE_MISMATCH'));
});

test('4) different quality target → NOT_COMPARABLE', () => {
  const { baseline, candidate } = identicalPair({
    candidate: {
      successCriteria: {
        criteriaId: 'crit-1',
        objective: 'minimize_latency',
        qualityTarget: 0.99,
        accuracyTolerance: 0.01,
        mustSatisfyConstraints: true,
        outputObjective: 'feasible_solution',
      },
    },
  });
  const gate = evaluateComparabilityGate({
    comparisonId: 'cmp-4',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(gate.state, 'NOT_COMPARABLE');
  assert.ok(
    gate.reasons.includes('QUALITY_TARGET_OR_SCHEMA_MISMATCH') ||
      gate.reasons.includes('SUCCESS_CRITERIA_MISMATCH'),
  );
});

test('5) EXECUTION_ONLY vs END_TO_END → NOT_COMPARABLE without normalization', () => {
  const { baseline, candidate } = identicalPair({
    candidate: { timingScope: 'END_TO_END' },
  });
  const gate = evaluateComparabilityGate({
    comparisonId: 'cmp-5',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(gate.state, 'NOT_COMPARABLE');
  assert.ok(
    gate.reasons.includes('TIMING_SCOPE_MISMATCH_WITHOUT_NORMALIZATION'),
  );

  const gated = evaluateComparabilityGate({
    comparisonId: 'cmp-5b',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    timingScopeNormalized: true,
  });
  assert.notEqual(gated.state, 'NOT_COMPARABLE');
  assert.ok(
    gated.state === 'PARTIALLY_COMPARABLE' || gated.state === 'COMPARABLE',
  );
});

test('6) same route repeated → statistical metrics', () => {
  const { baseline, candidate } = identicalPair({
    baseline: { runtimesMs: [100, 102, 98, 101], runCount: 4 },
    candidate: { runtimesMs: [90, 88, 92, 91], runCount: 4 },
  });
  const norm = normalizePair(baseline, candidate);
  assert.equal(norm.baseline.metrics.statistical, true);
  assert.equal(norm.candidate.metrics.statistical, true);
  assert.ok(norm.baseline.metrics.latencyMeanMs !== null);
  assert.ok(norm.baseline.metrics.latencyStdMs !== null);
  assert.ok(norm.notes.some((n) => n.includes('MULTI_RUN_STATISTICAL')));
});

test('7) single-run cannot create high-confidence winner', () => {
  const { baseline, candidate } = identicalPair({
    baseline: { runtimesMs: [100], runtimeMs: 100, runCount: 1 },
    candidate: { runtimesMs: [50], runtimeMs: 50, runCount: 1 },
  });
  const gate = evaluateComparabilityGate({
    comparisonId: 'cmp-7',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(gate.highConfidenceWinner, false);
  assert.ok(
    gate.reasons.includes('SINGLE_RUN_CANNOT_CREATE_HIGH_CONFIDENCE_WINNER'),
  );
  assert.equal(EX10_LOCKS.SINGLE_LUCKY_RUN_HIGH_CONFIDENCE, false);
});

test('8) measured vs unknown cost → not precise cost comparison', () => {
  const { baseline, candidate } = identicalPair({
    baseline: { costMethod: 'MEASURED', costValue: 0.01 },
    candidate: { costMethod: 'UNKNOWN', costValue: null },
  });
  const gate = evaluateComparabilityGate({
    comparisonId: 'cmp-8',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(gate.preciseCostComparison, false);
  assert.ok(gate.reasons.includes('COST_METHODS_NOT_PRECISELY_COMPARABLE'));
  assert.notEqual(gate.state, 'COMPARABLE'); // at least PARTIAL
});

test('9) simulator cannot represent physical-QPU performance', () => {
  const { baseline, candidate } = identicalPair({
    baseline: {
      executionClass: 'SIMULATED_QUANTUM',
      shots: 1024,
      seed: 7,
    },
    candidate: {
      executionClass: 'PHYSICAL_QPU',
      hardware: defaultHardware({
        deviceClass: 'QPU',
        deviceId: 'qpu-1',
        runtimeId: 'qpu-runtime',
        runtimeVersion: '1.0.0',
      }),
      providerId: 'prov-1',
      providerContextEvidence: true,
      queueMs: 10,
      submitMs: 5,
      execMs: 20,
      preProcessMs: 2,
      postProcessMs: 3,
      shots: 1024,
      qpuTimingScopes: ['QPU_EXECUTION_ONLY', 'END_TO_END_HYBRID_RUNTIME'],
    },
  });
  const gate = evaluateComparabilityGate({
    comparisonId: 'cmp-9',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(gate.state, 'NOT_COMPARABLE');
  assert.ok(
    gate.reasons.includes(
      'SIMULATOR_CANNOT_REPRESENT_PHYSICAL_QPU_PERFORMANCE',
    ),
  );
});

test('10) physical QPU comparison needs provider/context evidence', () => {
  const { baseline, candidate } = identicalPair({
    baseline: {
      executionClass: 'PHYSICAL_QPU',
      hardware: defaultHardware({
        deviceClass: 'QPU',
        deviceId: 'qpu-a',
        runtimeVersion: '1.0.0',
      }),
      providerId: null,
      providerContextEvidence: false,
      shots: 100,
    },
    candidate: {
      executionClass: 'PHYSICAL_QPU',
      hardware: defaultHardware({
        deviceClass: 'QPU',
        deviceId: 'qpu-b',
        runtimeVersion: '1.0.0',
      }),
      providerId: null,
      providerContextEvidence: false,
      shots: 100,
    },
  });
  const gate = evaluateComparabilityGate({
    comparisonId: 'cmp-10',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(gate.state, 'NOT_COMPARABLE');
  assert.ok(
    gate.reasons.includes('PHYSICAL_QPU_REQUIRES_PROVIDER_CONTEXT_EVIDENCE'),
  );
});

test('11) stale runtime → STALE_COMPARISON', () => {
  const { baseline, candidate } = identicalPair({
    baseline: { stale: true },
  });
  const gate = evaluateComparabilityGate({
    comparisonId: 'cmp-11',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(gate.state, 'STALE_COMPARISON');
});

test('12) contradiction creates record', () => {
  clearContradictionStoreForTests();
  const cycle = runEx10ComparabilityCycle({
    baseline: {
      executionClass: 'CLASSICAL',
      algorithmId: 'a',
      runtimesMs: [100, 101, 99],
    },
    candidate: {
      executionClass: 'CLASSICAL',
      algorithmId: 'b',
      problemSize: 999,
      runtimesMs: [50, 51, 49],
    },
    priorClaim: 'CANDIDATE_BETTER',
    contradictionId: 'contra-12',
  });
  assert.equal(cycle.gate?.state, 'NOT_COMPARABLE');
  assert.ok(cycle.contradiction);
  assert.equal(cycle.contradiction?.kind, 'WINNER_OR_COMPARABILITY_CONFLICT');
  assert.ok(listContradictionRecords('cmp-ex10-1').length >= 1);
});

test('13) NOT_COMPARABLE does not strengthen neural pathway', () => {
  const { baseline, candidate } = identicalPair({
    candidate: { problemSize: 256 },
  });
  const gate = evaluateComparabilityGate({
    comparisonId: 'cmp-13',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(gate.state, 'NOT_COMPARABLE');
  const learning = applyLearningFromGate(gate);
  assert.equal(learning.strengthen, false);
  assert.equal(learning.strength, 'NONE');
  assert.equal(learning.weightDelta, 0);
  assert.equal(learning.reason, 'NOT_COMPARABLE_NO_WINNER_LEARNING');
  assert.equal(EX10_LOCKS.WINNER_LEARNING_FROM_NOT_COMPARABLE, false);
});

test('14) cross-tenant DENIED', () => {
  const { baseline, candidate } = identicalPair({
    candidate: { tenantId: 'tenant-b' },
  });
  const gate = evaluateComparabilityGate({
    comparisonId: 'cmp-14',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(gate.state, 'DENIED');
  assert.ok(gate.reasons.includes('CROSS_TENANT_DENIED'));
});

test('15) cross-Universe DENIED', () => {
  const { baseline, candidate } = identicalPair({
    candidate: { universeId: 'universe-b' },
  });
  const gate = evaluateComparabilityGate({
    comparisonId: 'cmp-15',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(gate.state, 'DENIED');
  assert.ok(gate.reasons.includes('CROSS_UNIVERSE_DENIED'));
});

test('16) offline missing external → WAITING_DATA', () => {
  const { baseline, candidate } = identicalPair();
  const gate = evaluateComparabilityGate({
    comparisonId: 'cmp-16',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    networkOnline: false,
    externalDataRequired: true,
  });
  assert.equal(gate.state, 'WAITING_DATA');
});

test('17) L4 false', () => {
  assert.equal(EX10_LOCKS.L4_AUTONOMY_ENABLED, false);
  const cycle = runEx10ComparabilityCycle({
    baseline: { executionClass: 'CLASSICAL' },
    candidate: { executionClass: 'CLASSICAL' },
  });
  assert.equal(cycle.l4Enabled, false);
  assert.equal(cycle.locksIntact, true);
});

test('18) Guardian/RLS unchanged', () => {
  assert.equal(guardianRlsUnchangedByEx10(), true);
  assert.equal(EX10_LOCKS.WEAKEN_GUARDIAN_RLS, false);
  assert.equal(EX10_LOCKS.BROADEN_PERMISSIONS, false);
  const guardianPath = join(
    REPO,
    'services/ai/runtime/guardian/validate.ts',
  );
  assert.equal(existsSync(guardianPath), true);
  const cycle = runEx10ComparabilityCycle({
    baseline: { executionClass: 'CLASSICAL' },
    candidate: { executionClass: 'CLASSICAL' },
  });
  assert.equal(cycle.guardianRlsUnchanged, true);
  assert.equal(cycle.learning?.permissionsChanged, false);
  assert.equal(cycle.learning?.guardianChanged, false);
  assert.equal(cycle.learning?.rlsChanged, false);
  assert.equal(cycle.nextPhase, 'EX11 — Quantum Evidence Ledger');
  assert.ok(cycle.softWireSummary.anyVerified === false);
});
