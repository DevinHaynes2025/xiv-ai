/**
 * 62L-EP5 — Public Benchmark Memory denial + honesty tests.
 *
 * Script: npm run test:62lep5
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  BENCHMARK_AGENT_QUESTIONS,
  BENCHMARK_EVIDENCE_CLASSES,
  BENCHMARK_MEMORY_AGENT_BOUNDS,
  BENCHMARK_NORMALIZATION_DIMENSIONS,
  BENCHMARK_RECORD_FIELDS,
  BENCHMARK_REGRESSION_OUTCOMES,
  COMPARABILITY_STATES,
  EP5_DB_CANDIDATES_STATUS,
  EP5_LOCKS,
  EP5_MAY,
  EP5_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PUBLIC_BENCHMARK_MEMORY_CYCLE,
  SCHEDULER_PREFERENCE_ORDER,
  assertEp5LocksIntact,
  ep5SoftWireSnapshot,
  schedulerPreferenceRank,
  type Ep5Actor,
} from './public-benchmark-memory-types.ts';

import {
  answerBenchmarkQuestion,
  attemptAgentAutoAuthority,
  attemptCopyConfidentialCustomerResults,
  attemptCopyPrivateBenchmarkDbAcrossTenants,
  attemptEquatePublishedWithXivVerification,
  attemptJustifyFirmwareModificationViaBenchmark,
  attemptJustifyOverclockViaBenchmark,
  attemptJustifyThermalBypassViaBenchmark,
  attemptJustifyUnsafeHardwareTuningViaBenchmark,
  attemptNaiveComparisonAsComparable,
  attemptTreatStaleAsPermanentlyTrusted,
  bootstrapPublicBenchmarkMemory,
  evaluateComparability,
  evaluateRegression,
  fullNormalization,
  pairPublishedAndLocalMeasured,
  preferSchedulerEvidence,
  probeGuardianRlsTenantUniverseIsolation,
  registerBenchmarkRecord,
  requireHumanApproval,
  returnAgentEvidenceToHomeBase,
  runPublicBenchmarkMemoryCycle,
} from './public-benchmark-memory-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Ep5Actor = {
  kind: 'benchmark_agent',
  id: 'bm-agent-1',
  orgId: 'org-ep5',
  tenantId: 'ten-ep5',
  universeId: 'uni-ep5',
  permissions: ['draft'],
};

const human: Ep5Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-ep5',
  tenantId: 'ten-ep5',
  universeId: 'uni-ep5',
  permissions: ['approve_consequential'],
};

test('SoT label EP5 / #160; GitLab mirror not invented; next EP6', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP5');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /Public Benchmark Memory/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP6/);
  assert.match(NEXT_PHASE_TITLE, /Local Hardware Truth Probe/);
});

test('honesty locks: L4 false; Published ≠ XIV; DB NOT_APPLIED', () => {
  assert.equal(assertEp5LocksIntact(), true);
  assert.equal(EP5_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EP5_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EP5_LOCKS.PUBLISHED_EQ_XIV_VERIFICATION, false);
  assert.equal(EP5_LOCKS.VENDOR_PUBLISHED_EQ_XIV_LOCAL_MEASURED, false);
  assert.equal(EP5_LOCKS.STALE_EQ_PERMANENTLY_TRUSTED, false);
  assert.equal(EP5_LOCKS.BENCHMARK_JUSTIFIES_OVERCLOCKING, false);
  assert.equal(EP5_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('evidence classes + record fields + normalization + regression encoded', () => {
  assert.equal(BENCHMARK_EVIDENCE_CLASSES.length, 7);
  assert.ok(BENCHMARK_EVIDENCE_CLASSES.includes('VENDOR_PUBLISHED'));
  assert.ok(BENCHMARK_EVIDENCE_CLASSES.includes('XIV_LOCAL_MEASURED'));
  assert.ok(BENCHMARK_EVIDENCE_CLASSES.includes('SIMULATED'));

  assert.equal(BENCHMARK_RECORD_FIELDS.length, 23);
  assert.ok(BENCHMARK_RECORD_FIELDS.includes('benchmarkId'));
  assert.ok(BENCHMARK_RECORD_FIELDS.includes('evidenceClass'));

  assert.equal(BENCHMARK_NORMALIZATION_DIMENSIONS.length, 9);
  assert.deepEqual([...COMPARABILITY_STATES], [
    'COMPARABLE',
    'NOT_COMPARABLE',
    'PARTIALLY_COMPARABLE',
  ]);
  assert.deepEqual([...BENCHMARK_REGRESSION_OUTCOMES], [
    'PASS',
    'REGRESSED',
    'IMPROVED',
    'STALE',
  ]);
  assert.ok(SCHEDULER_PREFERENCE_ORDER[0]?.includes('xiv_local_measured'));
  assert.equal(BENCHMARK_AGENT_QUESTIONS.length, 6);
  assert.ok(EP5_MAY.length > 0);
  assert.ok(EP5_MUST_NOT.includes('equate_published_with_xiv_verification'));
  assert.equal(BENCHMARK_MEMORY_AGENT_BOUNDS.automaticAuthority, false);
});

test('Published ≠ XIV: distinct VENDOR_PUBLISHED vs XIV_LOCAL_MEASURED records', () => {
  const published = registerBenchmarkRecord({
    actor: agent,
    benchmarkId: 'pub-1',
    vendor: 'NVIDIA',
    deviceChip: 'gpu-a',
    deviceType: 'GPU',
    architectureGeneration: 'gen',
    runtimeProvider: 'cuda',
    driverRuntimeVersion: '550',
    modelWorkload: 'wl',
    precision: 'fp16',
    batchSize: '1',
    datasetInput: 'ds',
    latency: '1ms',
    throughput: '100',
    memoryUsage: '1GB',
    benchmarkMethodology: 'vendor',
    source: 'vendor',
    sourceDate: '2026-01-01',
    rightsLicenseState: 'VENDOR_PUBLIC_DOCUMENTATION',
    environment: 'lab',
    reproducibilityNotes: 'claim',
    confidence: 'med',
    evidenceClass: 'VENDOR_PUBLISHED',
    normalization: fullNormalization(),
  });
  const local = registerBenchmarkRecord({
    actor: agent,
    benchmarkId: 'xiv-1',
    vendor: 'NVIDIA',
    deviceChip: 'gpu-a',
    deviceType: 'GPU',
    architectureGeneration: 'gen',
    runtimeProvider: 'cuda',
    driverRuntimeVersion: '550',
    modelWorkload: 'wl',
    precision: 'fp16',
    batchSize: '1',
    datasetInput: 'ds',
    latency: '2ms',
    throughput: '80',
    memoryUsage: '1GB',
    benchmarkMethodology: 'xiv local',
    source: 'xiv-local',
    sourceDate: '2026-09-09',
    rightsLicenseState: 'USER_AUTHORIZED',
    environment: 'xiv-local',
    reproducibilityNotes: 'measured',
    confidence: 'high',
    evidenceClass: 'XIV_LOCAL_MEASURED',
    normalization: fullNormalization(),
  });
  assert.ok(!('denied' in published));
  assert.ok(!('denied' in local));
  const pair = pairPublishedAndLocalMeasured({
    published,
    local,
  });
  assert.equal(pair.distinctRecords, true);
  assert.equal(pair.publishedNeqXivVerification, true);
  assert.equal(attemptEquatePublishedWithXivVerification().state, 'DENIED');
});

test('naive comparison → NOT_COMPARABLE; full norm → COMPARABLE', () => {
  assert.equal(evaluateComparability({}), 'NOT_COMPARABLE');
  assert.equal(evaluateComparability(fullNormalization()), 'COMPARABLE');
  assert.equal(attemptNaiveComparisonAsComparable().state, 'DENIED');
});

test('scheduler prefers recent comparable XIV_LOCAL_MEASURED', () => {
  assert.equal(
    schedulerPreferenceRank('XIV_LOCAL_MEASURED', {
      recent: true,
      comparable: true,
    }),
    0,
  );
  assert.ok(
    schedulerPreferenceRank('VENDOR_PUBLISHED', {
      recent: true,
      comparable: true,
    }) >
      schedulerPreferenceRank('XIV_LOCAL_MEASURED', {
        recent: true,
        comparable: true,
      }),
  );
  const pref = preferSchedulerEvidence([
    { evidenceClass: 'VENDOR_PUBLISHED', recent: true, comparable: true },
    { evidenceClass: 'XIV_LOCAL_MEASURED', recent: true, comparable: true },
  ]);
  assert.equal(pref.prefersRecentLocalMeasured, true);
  assert.equal(pref.preferred?.evidenceClass, 'XIV_LOCAL_MEASURED');
});

test('regression outcomes: PASS / REGRESSED / IMPROVED / STALE decay', () => {
  assert.equal(
    evaluateRegression({
      previousBenchmarkId: 'b1',
      previousLatency: 10,
      retestLatency: 10.2,
    }).outcome,
    'PASS',
  );
  assert.equal(
    evaluateRegression({
      previousBenchmarkId: 'b1',
      previousLatency: 10,
      retestLatency: 12,
    }).outcome,
    'REGRESSED',
  );
  assert.equal(
    evaluateRegression({
      previousBenchmarkId: 'b1',
      previousLatency: 10,
      retestLatency: 8,
    }).outcome,
    'IMPROVED',
  );
  const stale = evaluateRegression({
    previousBenchmarkId: 'b1',
    previousLatency: 10,
    retestLatency: 10,
    stale: true,
  });
  assert.equal(stale.outcome, 'STALE');
  assert.equal(stale.neuralDecay, true);
  assert.equal(stale.trust, 'DECAYING');
  assert.equal(attemptTreatStaleAsPermanentlyTrusted().state, 'DENIED');
});

test('IP/safety denies: private DB, confidential, overclock/thermal/firmware/unsafe', () => {
  assert.equal(attemptCopyPrivateBenchmarkDbAcrossTenants().state, 'DENIED');
  assert.equal(attemptCopyConfidentialCustomerResults().state, 'DENIED');
  assert.equal(attemptJustifyOverclockViaBenchmark().state, 'DENIED');
  assert.equal(attemptJustifyThermalBypassViaBenchmark().state, 'DENIED');
  assert.equal(attemptJustifyFirmwareModificationViaBenchmark().state, 'DENIED');
  assert.equal(attemptJustifyUnsafeHardwareTuningViaBenchmark().state, 'DENIED');
  assert.equal(attemptAgentAutoAuthority().state, 'DENIED');

  const blocked = registerBenchmarkRecord({
    actor: agent,
    benchmarkId: 'bad-1',
    vendor: 'X',
    deviceChip: 'c',
    deviceType: 'CPU',
    architectureGeneration: 'g',
    runtimeProvider: 'r',
    driverRuntimeVersion: '1',
    modelWorkload: 'w',
    precision: 'fp32',
    batchSize: '1',
    datasetInput: 'd',
    latency: '1',
    throughput: '1',
    memoryUsage: '1',
    benchmarkMethodology: 'm',
    source: 's',
    sourceDate: '2026-01-01',
    rightsLicenseState: 'UNKNOWN',
    environment: 'e',
    reproducibilityNotes: 'n',
    confidence: 'low',
    evidenceClass: 'UNKNOWN',
    normalization: {},
    attemptJustifyOverclock: true,
  });
  assert.equal('denied' in blocked && blocked.state, 'DENIED');
});

test('agent advisory answers; recommend ≠ act; home base evidence return', () => {
  const ok = answerBenchmarkQuestion({
    questionKey: 'is_gpu_actually_faster_than_cpu_here',
    actor: agent,
  });
  assert.ok(!('denied' in ok));
  assert.equal(ok.advisory, true);
  assert.equal(ok.authorityGranted, false);

  const act = answerBenchmarkQuestion({
    questionKey: 'which_runtime_regressed',
    actor: agent,
    attemptAct: true,
  });
  assert.equal('denied' in act && act.state, 'DENIED');

  const ev = returnAgentEvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    summary: 'benchmark advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.authorityGranted, false);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
});

test('soft-wire EP4/EP2/EP1 present; cycle hops complete', () => {
  const boot = bootstrapPublicBenchmarkMemory(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.evidenceClasses.length, 7);
  assert.equal(boot.recordFields.length, 23);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const soft = ep5SoftWireSnapshot(repoRoot);
  assert.equal(soft.ep4IpFirewall.present, true);
  assert.equal(soft.ep2CapabilityGraph.present, true);
  assert.equal(soft.ep1VirtualChipContract.present, true);

  const cycle = runPublicBenchmarkMemoryCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, PUBLIC_BENCHMARK_MEMORY_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of PUBLIC_BENCHMARK_MEMORY_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const failHops = cycle.hops.filter(
    (h) => h.state === 'FAIL' || h.state === 'DENIED',
  );
  // denial hops intentionally record DENIED as success of the deny gate
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.ok(failHops.every((h) => h.state === 'DENIED' || h.state === 'PASS'));
  assert.ok(!('denied' in cycle.published));
  assert.ok(!('denied' in cycle.localMeasured));
  assert.equal(cycle.published.evidenceClass, 'VENDOR_PUBLISHED');
  assert.equal(cycle.localMeasured.evidenceClass, 'XIV_LOCAL_MEASURED');
});
