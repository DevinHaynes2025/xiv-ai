/**
 * 62L-ES-HC2 (#164) — Chip Bottleneck Analyzer denial + honesty tests.
 *
 * HC Superbrain track — distinct from productization ES2 / test:62les2.
 * Script: npm run test:62leshc2
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ANALYSIS_FIELDS,
  ANALYZER_CORE_FLOW,
  BOTTLENECK_ANALYZER_BOUNDS,
  BOTTLENECK_STATES,
  CANDIDATE_FIXES,
  CHIP_BOTTLENECK_ANALYZER_CYCLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HC2_DB_CANDIDATES_STATUS,
  HC2_LOCKS,
  HC2_MAY,
  HC2_MUST_NOT,
  HONESTY_BANNER,
  INSPECTION_DIMENSIONS,
  NEXT_PHASE_TITLE,
  SAFETY_BOUNDARIES,
  SUPPORTED_VENDORS,
  TRACK_DISTINCTNESS_NOTE,
  assertHc2LocksIntact,
  canClaimImproved,
  hc2SoftWireSnapshot,
  softWireHopState,
  type Hc2Actor,
} from './chip-bottleneck-analyzer-types.ts';

import {
  analyzeWorkload,
  attachBaselineAndBenchmark,
  attemptAgentAutoAuthority,
  attemptBlindGpuMoveWhenTransferBound,
  attemptBiosFirmware,
  attemptDriverReplacement,
  attemptImprovementWithoutBenchmark,
  attemptOverclocking,
  attemptPrivilegeEscalation,
  attemptRecommendAsAct,
  attemptSiliconModifyClaim,
  attemptThermalLimitBypass,
  attemptVoltageChange,
  bootstrapChipBottleneckAnalyzer,
  classifyBottleneck,
  probeGuardianRlsTenantUniverseIsolation,
  recordBaseline,
  requireHumanApproval,
  returnEvidenceToHomeBase,
  runChipBottleneckAnalyzerCycle,
  runSandboxBenchmark,
  transferBoundExampleMetrics,
} from './chip-bottleneck-analyzer-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Hc2Actor = {
  kind: 'bottleneck_analyzer',
  id: 'cba-1',
  orgId: 'org-hc2',
  tenantId: 'ten-hc2',
  universeId: 'uni-hc2',
  permissions: ['draft'],
};

const human: Hc2Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-hc2',
  tenantId: 'ten-hc2',
  universeId: 'uni-hc2',
  permissions: ['approve_consequential'],
};

test('SoT label ES-HC2 / #164; distinct from productization ES2; next ES3 path graph', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES-HC2');
  assert.equal(GITHUB_SOT_ISSUE, 164);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ES-HC');
  assert.match(GITHUB_SOT_TITLE, /Chip Bottleneck Analyzer/);
  assert.match(TRACK_DISTINCTNESS_NOTE, /distinct from productization ES2/i);
  assert.match(TRACK_DISTINCTNESS_NOTE, /test:62les2/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ES3/);
  assert.match(NEXT_PHASE_TITLE, /Cross-Vendor Chip Path Graph/);
});

test('honesty locks: L4 false; silicon-modify false; DB NOT_APPLIED', () => {
  assert.equal(assertHc2LocksIntact(), true);
  assert.equal(HC2_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(HC2_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(HC2_LOCKS.MAY_PHYSICALLY_MODIFY_SILICON, false);
  assert.equal(HC2_LOCKS.IMPROVEMENT_WITHOUT_BENCHMARK, false);
  assert.equal(HC2_LOCKS.UNTESTED_EQ_IMPROVED, false);
  assert.equal(HC2_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(BOTTLENECK_ANALYZER_BOUNDS.mayPhysicallyModifySilicon, false);
  assert.equal(BOTTLENECK_ANALYZER_BOUNDS.mayClaimImprovedWithoutBenchmark, false);
  assert.equal(
    canClaimImproved({
      baselineRecorded: false,
      candidateBenchmarked: false,
      improvedMeasured: true,
    }),
    false,
  );
});

test('dimensions + states + flow + fields + fixes + vendors + safety encoded', () => {
  assert.equal(INSPECTION_DIMENSIONS.length, 18);
  assert.ok(INSPECTION_DIMENSIONS.includes('cpu_gpu_npu_transfer_overhead'));
  assert.deepEqual([...BOTTLENECK_STATES], [
    'COMPUTE_BOUND',
    'MEMORY_BOUND',
    'I_O_BOUND',
    'NETWORK_BOUND',
    'RUNTIME_BOUND',
    'MODEL_COMPATIBILITY_BOUND',
    'QUEUE_BOUND',
    'THERMAL_RESOURCE_BOUND',
    'DATA_TRANSFER_BOUND',
    'UNKNOWN',
  ]);
  assert.deepEqual([...ANALYZER_CORE_FLOW], [
    'workload',
    'hardware_runtime_evidence',
    'bottleneck_classification',
    'baseline',
    'candidate_fixes',
    'sandbox_benchmark',
    'recommendation',
    'xiv_home_base',
  ]);
  assert.equal(ANALYSIS_FIELDS.length, 14);
  assert.ok(ANALYSIS_FIELDS.includes('suspected_bottleneck'));
  assert.ok(CANDIDATE_FIXES.includes('quantization'));
  assert.ok(CANDIDATE_FIXES.includes('cpu_gpu_npu_reassignment'));
  assert.ok(SUPPORTED_VENDORS.includes('AMD'));
  assert.ok(SUPPORTED_VENDORS.includes('NVIDIA'));
  assert.ok(SUPPORTED_VENDORS.includes('Apple'));
  assert.ok(SAFETY_BOUNDARIES.includes('no_physical_silicon_modification'));
  assert.ok(HC2_MAY.includes('classify_bottleneck_states_from_evidence'));
  assert.ok(HC2_MUST_NOT.includes('physically_modify_silicon'));
  assert.ok(CHIP_BOTTLENECK_ANALYZER_CYCLE.includes('transfer_bound_example_encoded'));
});

test('transfer-bound example: low GPU util + high CPU + high transfer → DATA_TRANSFER_BOUND', () => {
  const metrics = transferBoundExampleMetrics();
  assert.ok(metrics.gpuUtilizationPct < 40);
  assert.ok(metrics.cpuUtilizationPct > 70);
  assert.ok(metrics.transferOverheadMs > 50);

  const classified = classifyBottleneck(metrics);
  assert.equal(classified.state, 'DATA_TRANSFER_BOUND');

  const analysis = analyzeWorkload({
    actor: agent,
    analysisId: 'an-transfer-1',
    workloadId: 'wl-slow-infer',
    nodeDevice: 'asus-local-1',
    architecture: 'x86_64',
    vendor: 'AMD',
    modelRuntime: 'onnx-directml',
    metrics,
    evidenceRefs: ['ev-cpu-preprocess', 'ev-transfer-overhead'],
    attemptBlindGpuMove: true,
  });
  assert.equal('denied' in analysis, true);
  if ('denied' in analysis) {
    assert.equal(analysis.state, 'DENIED');
    assert.match(analysis.reason, /DATA_TRANSFER_BOUND|transfer/i);
  }

  const ok = analyzeWorkload({
    actor: agent,
    analysisId: 'an-transfer-2',
    workloadId: 'wl-slow-infer',
    nodeDevice: 'asus-local-1',
    architecture: 'x86_64',
    vendor: 'NVIDIA',
    modelRuntime: 'onnx-cuda',
    metrics,
    evidenceRefs: ['ev-cpu-preprocess', 'ev-transfer-overhead'],
  });
  assert.equal('denied' in ok, false);
  if (!('denied' in ok)) {
    assert.equal(ok.finalClassification, 'DATA_TRANSFER_BOUND');
    assert.equal(ok.improvementClaim, 'NOT_TESTED');
    assert.equal(ok.siliconModifyClaimed, false);
    assert.ok(ok.candidateOptimizations.length > 0);
    assert.ok(
      ok.candidateOptimizations.some((c) => c.fix === 'memory_layout'),
    );
  }

  assert.equal(attemptBlindGpuMoveWhenTransferBound().state, 'DENIED');
});

test('silicon-modify claim denied; hardware-internal denies', () => {
  assert.equal(attemptSiliconModifyClaim('physically modify silicon').state, 'DENIED');
  const denied = analyzeWorkload({
    actor: agent,
    analysisId: 'an-silicon',
    workloadId: 'wl-x',
    nodeDevice: 'node-1',
    architecture: 'x86_64',
    vendor: 'Intel',
    modelRuntime: 'openvino',
    metrics: transferBoundExampleMetrics(),
    evidenceRefs: ['ev-1'],
    attemptSiliconModify: true,
  });
  assert.equal('denied' in denied, true);
  assert.equal(attemptOverclocking().state, 'DENIED');
  assert.equal(attemptBiosFirmware().state, 'DENIED');
  assert.equal(attemptVoltageChange().state, 'DENIED');
  assert.equal(attemptThermalLimitBypass().state, 'DENIED');
  assert.equal(attemptDriverReplacement().state, 'DENIED');
  assert.equal(attemptPrivilegeEscalation().state, 'DENIED');
});

test('improvement without benchmark denied; NOT_TESTED honesty; IMPROVED only after baseline vs candidate', () => {
  assert.equal(attemptImprovementWithoutBenchmark().state, 'DENIED');

  const baseline = recordBaseline({ latencyMs: 100, throughputOps: 10 });
  const untested = runSandboxBenchmark({
    baseline,
    candidateLatencyMs: 50,
    evidenceRefs: [],
  });
  assert.equal('denied' in untested, false);
  if (!('denied' in untested)) {
    assert.equal(untested.state, 'NOT_TESTED');
    assert.equal(untested.improvementClaim, 'NOT_TESTED');
  }

  const claimDenied = runSandboxBenchmark({
    baseline,
    candidateLatencyMs: 50,
    evidenceRefs: ['bench-1'],
    claimImprovedWithoutEvidence: true,
  });
  assert.equal('denied' in claimDenied, true);

  const improved = runSandboxBenchmark({
    baseline,
    candidateLatencyMs: 70,
    evidenceRefs: ['bench-baseline', 'bench-candidate'],
  });
  assert.equal('denied' in improved, false);
  if (!('denied' in improved)) {
    assert.equal(improved.state, 'IMPROVED');
    assert.equal(improved.improvementClaim, 'IMPROVED');
  }

  const analysis = analyzeWorkload({
    actor: agent,
    analysisId: 'an-bench',
    workloadId: 'wl-bench',
    nodeDevice: 'node-2',
    architecture: 'arm64',
    vendor: 'Apple',
    modelRuntime: 'coreml',
    metrics: transferBoundExampleMetrics(),
    evidenceRefs: ['ev-a'],
  });
  assert.equal('denied' in analysis, false);
  if (!('denied' in analysis)) {
    assert.equal(analysis.improvementClaim, 'NOT_TESTED');
    const withBench = attachBaselineAndBenchmark({
      analysis,
      baseline,
      candidateLatencyMs: 70,
      benchmarkEvidenceRefs: ['bench-baseline', 'bench-candidate'],
    });
    assert.equal('denied' in withBench, false);
    if (!('denied' in withBench)) {
      assert.equal(withBench.improvementClaim, 'IMPROVED');
      assert.equal(withBench.actualBenchmarkResults?.state, 'IMPROVED');
      const home = returnEvidenceToHomeBase({ analysis: withBench, actor: agent });
      assert.equal(home.returned, true);
      assert.equal(home.homeBasePath, 'xiv_home_base');
      assert.equal(home.finalClassification, 'DATA_TRANSFER_BOUND');
    }
  }
});

test('L4 false; recommend≠act; soft-wires WAITING_DATA or PASS; cycle runs', () => {
  assert.equal(HC2_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(attemptAgentAutoAuthority().state, 'DENIED');
  assert.equal(requireHumanApproval(human), true);
  assert.equal(probeGuardianRlsTenantUniverseIsolation(agent).intact, true);

  const boot = bootstrapChipBottleneckAnalyzer(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.l4, false);

  const sw = hc2SoftWireSnapshot(repoRoot);
  // Presence ≠ VERIFIED; absent → WAITING_DATA (not FAIL)
  assert.equal(softWireHopState(sw.hc1HybridComputeHomeBase.present), sw.hc1HybridComputeHomeBase.present ? 'PASS' : 'WAITING_DATA');
  assert.equal(softWireHopState(sw.er34CapabilityManifest.present), sw.er34CapabilityManifest.present ? 'PASS' : 'WAITING_DATA');
  assert.equal(softWireHopState(sw.er29WindowsRuntimePackage.present), sw.er29WindowsRuntimePackage.present ? 'PASS' : 'WAITING_DATA');
  assert.equal(softWireHopState(sw.er30AndroidArmRuntimePackage.present), sw.er30AndroidArmRuntimePackage.present ? 'PASS' : 'WAITING_DATA');
  assert.equal(softWireHopState(sw.er31AppleDeviceRuntimePackage.present), sw.er31AppleDeviceRuntimePackage.present ? 'PASS' : 'WAITING_DATA');
  assert.equal(softWireHopState(sw.er32ServerEdgeRuntimePackage.present), sw.er32ServerEdgeRuntimePackage.present ? 'PASS' : 'WAITING_DATA');
  // On this tip ER34 + ER30 + EM157 expected PRESENT; HC1 module may be WAITING_DATA
  assert.equal(sw.er34CapabilityManifest.present, true);
  assert.equal(sw.er30AndroidArmRuntimePackage.present, true);
  assert.equal(sw.em157HomeBase.present, true);

  const cycle = runChipBottleneckAnalyzerCycle(repoRoot);
  assert.equal(cycle.locksIntact, true);
  assert.equal(cycle.hops.length, CHIP_BOTTLENECK_ANALYZER_CYCLE.length);
  const transferHop = cycle.hops.find((h) => h.hop === 'transfer_bound_example_encoded');
  assert.ok(transferHop);
  assert.equal(transferHop?.state, 'PASS');
  const hc1Hop = cycle.hops.find((h) => h.hop === 'hc1_soft_wire');
  assert.ok(hc1Hop);
  assert.ok(hc1Hop?.state === 'PASS' || hc1Hop?.state === 'WAITING_DATA');
  assert.notEqual(hc1Hop?.state, 'FAIL');
  const l4Hop = cycle.hops.find((h) => h.hop === 'l4_autonomy_false');
  assert.equal(l4Hop?.state, 'PASS');
});
