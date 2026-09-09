/**
 * 62L-EQ12 — Cross-Architecture Benchmark Matrix denial + honesty tests.
 *
 * Script: npm run test:62leq12
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  BENCHMARK_RESULT_STATES,
  BENCHMARK_ROW_FIELDS,
  COMPARABILITY_KEYS,
  COMPARISON_PATH_CANDIDATES,
  CROSS_ARCHITECTURE_BENCHMARK_MATRIX_CYCLE,
  EQ12_AGENT_BOUNDS,
  EQ12_DB_CANDIDATES_STATUS,
  EQ12_LOCKS,
  EQ12_MAY,
  EQ12_MUST_NOT,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  ROUTE_WIN_EXAMPLES,
  SCHEDULER_FEEDBACK_PATH,
  assertEq12LocksIntact,
  canMarkPass,
  eq12SoftWireSnapshot,
  fastestImpliesAlwaysBest,
  vendorNumbersImpliesXivMeasured,
  type Eq12Actor,
} from './cross-architecture-benchmark-matrix-types.ts';

import {
  areRowsComparable,
  attemptAssumeFastestAlwaysBest,
  attemptAutomaticCloudPurchasing,
  attemptCrossTenantDataMovement,
  attemptEquateVendorWithXivMeasured,
  attemptFirmwareChanges,
  attemptOverclocking,
  attemptPassWithoutActualRun,
  attemptPrivilegeEscalation,
  attemptRecommendAsAct,
  bootstrapCrossArchitectureBenchmarkMatrix,
  emitBenchmarkRow,
  exampleCrossArchitectureRows,
  feedSchedulerMeasuredResult,
  markRowPass,
  normalizeComparison,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnEq12EvidenceToHomeBase,
  runCrossArchitectureBenchmarkMatrixCycle,
} from './cross-architecture-benchmark-matrix-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Eq12Actor = {
  kind: 'benchmark_matrix_runner',
  id: 'bmr-1',
  orgId: 'org-eq12',
  tenantId: 'ten-eq12',
  universeId: 'uni-eq12',
  permissions: ['draft'],
};

const human: Eq12Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eq12',
  tenantId: 'ten-eq12',
  universeId: 'uni-eq12',
  permissions: ['approve_consequential'],
};

const fp = {
  model: 'model-a@1.0',
  precision: 'fp16',
  batch: 1,
  input: 'input-profile-attn-v1',
  runtimeClass: 'onnxruntime',
  testMethod: 'xiv-bench-v0',
};

test('SoT label EQ12 / #161; GitLab mirror not invented; next EQ13', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EQ12');
  assert.equal(GITHUB_SOT_ISSUE, 161);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EQ');
  assert.match(GITHUB_SOT_TITLE, /Cross-Architecture Benchmark Matrix/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EQ13/);
  assert.match(NEXT_PHASE_TITLE, /Architecture Return Receipt/);
});

test('honesty locks: L4 false; fastest≠best; vendor≠XIV; DB NOT_APPLIED', () => {
  assert.equal(assertEq12LocksIntact(), true);
  assert.equal(EQ12_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EQ12_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EQ12_LOCKS.PASS_WITHOUT_ACTUAL_RUN, false);
  assert.equal(EQ12_LOCKS.VENDOR_NUMBERS_EQ_XIV_MEASURED, false);
  assert.equal(EQ12_LOCKS.FASTEST_ALWAYS_BEST, false);
  assert.equal(EQ12_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(EQ12_AGENT_BOUNDS.mayAssumeFastestAlwaysBest, false);
  assert.equal(fastestImpliesAlwaysBest(), false);
  assert.equal(vendorNumbersImpliesXivMeasured(), false);
  assert.equal(ROUTE_WIN_EXAMPLES.fastestIsAlwaysBest, false);
});

test('row fields + paths + comparability keys + result states encoded', () => {
  assert.ok(BENCHMARK_ROW_FIELDS.includes('benchmarkId'));
  assert.ok(BENCHMARK_ROW_FIELDS.includes('energyProxy'));
  assert.ok(BENCHMARK_ROW_FIELDS.includes('environmentVersionFingerprint'));
  assert.ok(COMPARISON_PATH_CANDIDATES.includes('arm_cpu'));
  assert.ok(COMPARISON_PATH_CANDIDATES.includes('nvidia_gpu'));
  assert.ok(COMPARISON_PATH_CANDIDATES.includes('edge_cloud_candidate'));
  assert.deepEqual([...COMPARABILITY_KEYS], [
    'model',
    'precision',
    'batch',
    'input',
    'runtime_class',
    'test_method',
  ]);
  assert.deepEqual([...BENCHMARK_RESULT_STATES], [
    'BASELINE',
    'BEST_LATENCY',
    'BEST_THROUGHPUT',
    'BEST_COST',
    'BEST_ENERGY_PROXY',
    'BEST_LOCALITY',
    'REGRESSED',
    'STALE',
    'NOT_COMPARABLE',
  ]);
  assert.deepEqual([...SCHEDULER_FEEDBACK_PATH], [
    'workload',
    'architecture',
    'device',
    'measured_result',
  ]);
  assert.ok(EQ12_MAY.includes('mark_pass_only_after_actual_run'));
  assert.ok(EQ12_MUST_NOT.includes('assume_fastest_device_is_always_best_route'));
});

test('comparable only when keys match; otherwise NOT_COMPARABLE', () => {
  const rows = exampleCrossArchitectureRows(agent);
  assert.equal(rows.length, 5);
  assert.ok(rows.every((r) => r.actuallyRun));

  assert.equal(
    areRowsComparable(rows[0]!.comparability, rows[1]!.comparability),
    true,
  );
  assert.equal(
    areRowsComparable(fp, { ...fp, precision: 'fp32' }),
    false,
  );

  const ok = normalizeComparison({ comparisonId: 'c1', rows });
  assert.ok(!('denied' in ok));
  assert.equal(ok.comparable, true);
  assert.equal(ok.fastestAlwaysBest, false);
  assert.ok(ok.resultTags.includes('BEST_LATENCY'));

  const bad = emitBenchmarkRow({
    actor: agent,
    benchmarkId: 'b-x',
    workloadId: 'wl-attn-1',
    modelVersion: 'other',
    inputProfile: fp.input,
    architecture: 'intel_gpu_npu',
    device: 'i1',
    runtimeProvider: 'rt',
    precision: 'fp32',
    batchSize: 4,
    environmentVersionFingerprint: 'e',
    comparability: { ...fp, model: 'other', precision: 'fp32', batch: 4 },
    actuallyRun: true,
    latency: 1,
  });
  assert.ok(!('denied' in bad));
  const nc = normalizeComparison({
    comparisonId: 'c2',
    rows: [...rows, bad],
  });
  assert.ok(!('denied' in nc));
  assert.equal(nc.comparable, false);
  assert.ok(nc.resultTags.includes('NOT_COMPARABLE'));
});

test('PASS only after actual run; vendor≠XIV; fastest≠always best', () => {
  assert.equal(attemptPassWithoutActualRun().state, 'DENIED');
  assert.equal(attemptEquateVendorWithXivMeasured().state, 'DENIED');
  assert.equal(attemptAssumeFastestAlwaysBest().state, 'DENIED');
  assert.equal(
    canMarkPass({ actuallyRun: false, measuredMetricsPresent: true }),
    false,
  );

  const rows = exampleCrossArchitectureRows(agent);
  assert.equal(
    markRowPass({
      row: { ...rows[0]!, actuallyRun: false },
    }).state,
    'DENIED',
  );
  const pass = markRowPass({ row: rows[0]! });
  assert.ok(!('denied' in pass));
  assert.equal(pass.row.evidenceState, 'PASS');

  const fb = feedSchedulerMeasuredResult({
    workloadId: 'wl-attn-1',
    architecture: 'nvidia_gpu',
    device: 'nvidia-gpu-1',
    measuredResult: 'BEST_THROUGHPUT',
  });
  assert.ok(!('denied' in fb));
  assert.equal(fb.authorityGranted, false);
  assert.equal(
    feedSchedulerMeasuredResult({
      workloadId: 'w',
      architecture: 'arm_cpu',
      device: 'd',
      measuredResult: 'BEST_LATENCY',
      attemptAssumeFastestAlwaysBest: true,
    }).state,
    'DENIED',
  );
});

test('governance denies overclock / firmware / privilege / cloud buy / cross-tenant', () => {
  assert.equal(attemptOverclocking().state, 'DENIED');
  assert.equal(attemptFirmwareChanges().state, 'DENIED');
  assert.equal(attemptPrivilegeEscalation().state, 'DENIED');
  assert.equal(attemptAutomaticCloudPurchasing().state, 'DENIED');
  assert.equal(attemptCrossTenantDataMovement().state, 'DENIED');
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapCrossArchitectureBenchmarkMatrix(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.rowFields.length, BENCHMARK_ROW_FIELDS.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 161);

  const soft = eq12SoftWireSnapshot(repoRoot);
  assert.equal(soft.eq11DeviceNeutralWorkloadGenome.present, true);
  assert.equal(soft.eq8ArmServerCloudRuntime.present, true);
  assert.equal(soft.eq6ArchitectureCapabilityGraph.present, true);
  assert.equal(soft.ep14AdaptiveBenchmarkLedger.present, true);
  assert.equal(soft.ep12HardwareNeutralScheduler.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  const ev = returnEq12EvidenceToHomeBase({
    evidenceId: 'ev-eq12-1',
    actor: agent,
    summary: 'benchmark matrix advisory',
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

  const cycle = runCrossArchitectureBenchmarkMatrixCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(
    cycle.hops.length,
    CROSS_ARCHITECTURE_BENCHMARK_MATRIX_CYCLE.length,
  );
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of CROSS_ARCHITECTURE_BENCHMARK_MATRIX_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.comparison.comparable, true);
  assert.equal(cycle.comparison.fastestAlwaysBest, false);
});
