/**
 * 62L-EP14 — Adaptive Benchmark Ledger denial + honesty tests.
 *
 * Script: npm run test:62lep14
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ADAPTIVE_BENCHMARK_LEDGER_CYCLE,
  BENCHMARK_ENTRY_FIELDS,
  COMPARABILITY_DIMENSIONS,
  COMPARISON_STATES,
  EP14_DB_CANDIDATES_STATUS,
  EP14_LOCKS,
  EP14_MAY,
  EP14_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  LEDGER_AGENT_BOUNDS,
  LEDGER_LIFECYCLE,
  NEURAL_EDGE_SHAPE,
  NEXT_PHASE_TITLE,
  STALENESS_TRIGGERS,
  assertEp14LocksIntact,
  declineStaleSchedulingWeight,
  ep14SoftWireSnapshot,
  type Ep14Actor,
} from './adaptive-benchmark-ledger-types.ts';

import {
  attemptCompareUnlikeTests,
  attemptDeleteOldEvidence,
  attemptIncludeHiddenCot,
  attemptModifyFirmwareOrBios,
  attemptQuantumBetterWithoutData,
  attemptQuantumWithoutClassicalBaseline,
  attemptRecommendAsAct,
  attemptStrengthenWithoutMeasurement,
  bootstrapAdaptiveBenchmarkLedger,
  claimQuantumInspiredBetter,
  classifyAgainstPrior,
  exampleAmdGpuNew,
  exampleAmdGpuPrior,
  markStaleForRetest,
  normalizeReceiptToBenchmark,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnLedgerEvidenceToHomeBase,
  runAdaptiveBenchmarkLedgerCycle,
  strengthenNeuralEdge,
  updateSchedulerMemory,
} from './adaptive-benchmark-ledger-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Ep14Actor = {
  kind: 'benchmark_ledger',
  id: 'ledger-1',
  orgId: 'org-ep14',
  tenantId: 'ten-ep14',
  universeId: 'uni-ep14',
  permissions: ['draft'],
};

const human: Ep14Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-ep14',
  tenantId: 'ten-ep14',
  universeId: 'uni-ep14',
  permissions: ['approve_consequential'],
};

test('SoT label EP14 / #160; GitLab mirror not invented; next EP15', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP14');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /Adaptive Benchmark Ledger/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP15/);
  assert.match(NEXT_PHASE_TITLE, /Algorithm Tuning Sandbox/);
});

test('honesty locks: L4 false; unlike-tests gate; DB NOT_APPLIED', () => {
  assert.equal(assertEp14LocksIntact(), true);
  assert.equal(EP14_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EP14_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EP14_LOCKS.UNLIKE_TESTS_COMPARED_AS_EQUIVALENT, false);
  assert.equal(EP14_LOCKS.DELETE_OLD_EVIDENCE_ON_STALE, false);
  assert.equal(EP14_LOCKS.QUANTUM_WITHOUT_CLASSICAL_BASELINE, false);
  assert.equal(EP14_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(LEDGER_AGENT_BOUNDS.mayCompareUnlikeTests, false);
  assert.equal(LEDGER_AGENT_BOUNDS.mayModifyFirmwareOrBios, false);
});

test('lifecycle + fields + comparison states + staleness encoded', () => {
  assert.deepEqual([...LEDGER_LIFECYCLE], [
    'compute_receipt',
    'normalize',
    'compare_with_prior',
    'classify',
    'update_scheduler_memory',
  ]);
  assert.ok(BENCHMARK_ENTRY_FIELDS.includes('benchmarkId'));
  assert.ok(BENCHMARK_ENTRY_FIELDS.includes('receiptId'));
  assert.ok(BENCHMARK_ENTRY_FIELDS.includes('verificationState'));
  assert.deepEqual([...COMPARISON_STATES], [
    'BASELINE',
    'IMPROVED',
    'REGRESSED',
    'UNCHANGED',
    'STALE',
    'NOT_COMPARABLE',
  ]);
  assert.ok(STALENESS_TRIGGERS.includes('driver_update'));
  assert.ok(STALENESS_TRIGGERS.includes('model_version_change'));
  assert.ok(COMPARABILITY_DIMENSIONS.includes('precision'));
  assert.deepEqual([...NEURAL_EDGE_SHAPE], [
    'workload',
    'device',
    'runtime',
    'measured_outcome',
    'confidence',
  ]);
  assert.ok(EP14_MAY.includes('detect_regressions_and_lower_scheduler_preference'));
  assert.ok(EP14_MUST_NOT.includes('compare_unlike_tests_as_equivalent'));
});

test('AMD GPU Model A 42ms→61ms REGRESSED; scheduler preference lowered', () => {
  const prior = exampleAmdGpuPrior();
  const current = exampleAmdGpuNew(61);
  assert.equal(prior.latency, 42);
  assert.equal(current.latency, 61);

  const cls = classifyAgainstPrior({
    classificationId: 'c1',
    current,
    prior,
  });
  assert.ok(!('denied' in cls));
  assert.equal(cls.state, 'REGRESSED');
  assert.ok(cls.schedulerPreferenceDelta < 0);

  const mem = updateSchedulerMemory({
    updateId: 'u1',
    entry: current,
    classification: cls,
  });
  assert.equal(mem.evidenceDeleted, false);
  assert.ok(mem.newWeight < mem.previousWeight);
});

test('unlike tests → NOT_COMPARABLE; force-equivalent denied', () => {
  const prior = exampleAmdGpuPrior();
  const current = {
    ...exampleAmdGpuNew(40),
    precision: 'int8',
    comparabilityKey: {
      ...exampleAmdGpuNew(40).comparabilityKey,
      precision: 'int8',
    },
  };
  const cls = classifyAgainstPrior({
    classificationId: 'c-unlike',
    current,
    prior,
  });
  assert.ok(!('denied' in cls));
  assert.equal(cls.state, 'NOT_COMPARABLE');
  assert.ok(cls.unlikeDimensions.includes('precision'));

  assert.equal(
    classifyAgainstPrior({
      classificationId: 'c-force',
      current,
      prior,
      attemptCompareUnlike: true,
    }).state,
    'DENIED',
  );
  assert.equal(attemptCompareUnlikeTests().state, 'DENIED');
});

test('staleness declines weight without deleting; unverified denied', () => {
  const prior = exampleAmdGpuPrior();
  const stale = markStaleForRetest({
    entry: prior,
    trigger: 'runtime_provider_update',
  });
  assert.ok(!('denied' in stale));
  assert.equal(stale.state, 'STALE');
  assert.equal(stale.retestCandidate, true);
  assert.equal(stale.evidenceDeleted, false);
  assert.ok(stale.schedulingWeight < prior.schedulingWeight);

  assert.equal(
    markStaleForRetest({
      entry: prior,
      trigger: 'hardware_change',
      attemptDeleteOldEvidence: true,
    }).state,
    'DENIED',
  );
  assert.equal(attemptDeleteOldEvidence().state, 'DENIED');

  const declined = declineStaleSchedulingWeight(1, 0.5);
  assert.equal(declined.deleted, false);
  assert.equal(declined.weight, 0.5);

  assert.equal(
    normalizeReceiptToBenchmark({
      actor: agent,
      benchmarkId: 'bm-uv',
      receiptId: 'r-uv',
      nodeId: 'n1',
      device: 'cpu',
      vendor: 'x',
      runtimeProvider: 'r',
      driverRuntimeVersion: '1',
      modelId: 'm',
      modelVersionHash: 'h',
      precision: 'fp32',
      workload: 'w',
      datasetInputProfile: 'p',
      batchSize: 1,
      latency: 10,
      throughput: 100,
      memoryUsage: '1GB',
      energyProxy: 1,
      costProxy: 1,
      successRate: 1,
      environmentFingerprint: 'e',
      verificationState: 'UNVERIFIED',
    }).state,
    'DENIED',
  );
});

test('quantum-inspired needs classical baseline; better only with data', () => {
  assert.equal(attemptQuantumWithoutClassicalBaseline().state, 'DENIED');
  assert.equal(attemptQuantumBetterWithoutData().state, 'DENIED');

  const classical = exampleAmdGpuPrior();
  assert.equal(
    normalizeReceiptToBenchmark({
      actor: agent,
      benchmarkId: 'bm-q-bad',
      receiptId: 'r-q',
      nodeId: 'nq',
      device: 'qpu_path',
      vendor: 'research',
      runtimeProvider: 'qi',
      driverRuntimeVersion: '0.1',
      modelId: 'ModelA',
      modelVersionHash: 'ma-v1',
      precision: 'fp16',
      workload: 'inference',
      datasetInputProfile: 'batch-profile-1',
      batchSize: 1,
      latency: 20,
      throughput: 50,
      memoryUsage: '1GB',
      energyProxy: 1,
      costProxy: 1,
      successRate: 1,
      environmentFingerprint: 'q',
      verificationState: 'VERIFIED',
      quantumInspired: true,
    }).state,
    'DENIED',
  );

  const quantum = normalizeReceiptToBenchmark({
    actor: agent,
    benchmarkId: 'bm-q-ok',
    receiptId: 'r-q-ok',
    nodeId: 'nq',
    device: 'qpu_path',
    vendor: 'research',
    runtimeProvider: 'qi',
    driverRuntimeVersion: '0.1',
    modelId: 'ModelA',
    modelVersionHash: 'ma-v1',
    precision: 'fp16',
    workload: 'inference',
    datasetInputProfile: 'batch-profile-1',
    batchSize: 1,
    latency: 20,
    throughput: 50,
    memoryUsage: '1GB',
    energyProxy: 1,
    costProxy: 1,
    successRate: 1,
    environmentFingerprint: 'q',
    verificationState: 'VERIFIED',
    quantumInspired: true,
    classicalBaselineBenchmarkId: classical.benchmarkId,
  });
  assert.ok(!('denied' in quantum));
  assert.equal(quantum.quantumInspired, true);

  const better = claimQuantumInspiredBetter({
    quantumEntry: quantum,
    classicalBaseline: classical,
    claimBetter: true,
  });
  assert.ok(!('denied' in better));
  assert.equal(better.betterThanBaseline, true);

  assert.equal(
    claimQuantumInspiredBetter({
      quantumEntry: { ...quantum, latency: 99, throughput: 1 },
      classicalBaseline: classical,
      claimBetter: true,
      attemptWithoutDemonstratingData: true,
    }).state,
    'DENIED',
  );
});

test('bootstrap + soft-wire + cycle; measured edges; guardian unchanged', () => {
  const boot = bootstrapAdaptiveBenchmarkLedger(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.fields.length, BENCHMARK_ENTRY_FIELDS.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 160);

  const soft = ep14SoftWireSnapshot(repoRoot);
  assert.equal(soft.ep13RuntimeReturnReceipt.present, true);
  assert.equal(soft.ep12Scheduler.present, true);
  assert.equal(soft.ep5BenchmarkMemory.present, true);
  assert.equal(soft.ep1VirtualChipContract.present, true);

  const edge = strengthenNeuralEdge({
    entry: exampleAmdGpuPrior(),
    measured: true,
  });
  assert.ok(!('denied' in edge));
  assert.equal(edge.strengthenedByMeasurement, true);
  assert.equal(attemptStrengthenWithoutMeasurement().state, 'DENIED');
  assert.equal(attemptIncludeHiddenCot().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(attemptModifyFirmwareOrBios().state, 'DENIED');

  const ev = returnLedgerEvidenceToHomeBase({
    evidenceId: 'ev-ep14-1',
    actor: agent,
    summary: 'ledger advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.authorityGranted, false);
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runAdaptiveBenchmarkLedgerCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, ADAPTIVE_BENCHMARK_LEDGER_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of ADAPTIVE_BENCHMARK_LEDGER_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.ok(!('denied' in cycle.classification));
  assert.equal(cycle.classification.state, 'REGRESSED');
});
