/**
 * 62L-ES6 — Acceptance Criteria & Test Evidence Generator denial + honesty tests.
 *
 * Script: npm run test:62les6
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ACCEPTANCE_EVIDENCE_TRUTH_BOUNDARY,
  ACCEPTANCE_TEST_EVIDENCE_CYCLE,
  ES6_AGENT_BOUNDS,
  ES6_DB_CANDIDATES_STATUS,
  ES6_LOCKS,
  ES6_MAY,
  ES6_MUST_NOT,
  ES_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_ISSUE_NOTE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  TEST_EVIDENCE_FIELDS,
  TEST_OWNERS,
  TEST_REQUIREMENT_DOMAINS,
  TEST_RESULT_STATES,
  assertEs6LocksIntact,
  canRecordPass,
  draftTestsAuthorizeProduction,
  es6SoftWireSnapshot,
  gpuClaimAllowedWithoutEvidence,
  unrunMayBecomePass,
  type Es6Actor,
} from './acceptance-criteria-test-evidence-types.ts';

import {
  attemptDraftTestsAsReleaseAuth,
  attemptGpuClaimWithoutEvidence,
  attemptNpuFallbackMislabeledAsNpu,
  attemptSecretsInLogs,
  attemptUnrunAsPass,
  bootstrapAcceptanceCriteriaTestEvidence,
  encodeAmdLocalInferenceScenario,
  generateAcceptanceSuiteFromArchitecture,
  gpuTestStateInSuite,
  markRegressedOnBreak,
  probeGuardianRlsTenantUniverseIsolation,
  recordCpuFallbackPass,
  recordTestResult,
  requireHumanApproval,
  runAcceptanceCriteriaTestEvidenceCycle,
} from './acceptance-criteria-test-evidence-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Es6Actor = {
  kind: 'acceptance_criteria_generator',
  id: 'acg-1',
  orgId: 'org-es6',
  tenantId: 'ten-es6',
  universeId: 'uni-es6',
  permissions: ['draft'],
};

const human: Es6Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-es6',
  tenantId: 'ten-es6',
  universeId: 'uni-es6',
  permissions: ['approve_consequential'],
};

test('SoT label ES6; family 62L-ES; no invented issue; next ES7 plan generator', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES6');
  assert.equal(GITHUB_SOT_ISSUE, null);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ES');
  assert.match(GITHUB_SOT_TITLE, /Acceptance Criteria/);
  assert.match(GITHUB_SOT_ISSUE_NOTE, /no issue number invented/i);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ES7/);
  assert.match(NEXT_PHASE_TITLE, /Executable Implementation Plan Generator/);
  assert.match(ES_LAYER_TITLE, /Autonomous Research & Productization Factory/);
});

test('honesty locks: L4 false; unrun≠PASS; GPU evidence required; draft≠release; DB NOT_APPLIED', () => {
  assert.equal(assertEs6LocksIntact(), true);
  assert.equal(ES6_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ES6_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ES6_LOCKS.UNRUN_TEST_AS_PASS, false);
  assert.equal(ES6_LOCKS.GPU_CLAIM_WITHOUT_EVIDENCE, false);
  assert.equal(ES6_LOCKS.DRAFT_TESTS_AUTHORIZE_PRODUCTION_RELEASE, false);
  assert.equal(ES6_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(unrunMayBecomePass(), false);
  assert.equal(gpuClaimAllowedWithoutEvidence(), false);
  assert.equal(draftTestsAuthorizeProduction(), false);
  assert.equal(
    ACCEPTANCE_EVIDENCE_TRUTH_BOUNDARY.unrunTestCannotBecomePass,
    true,
  );
  assert.equal(ES6_AGENT_BOUNDS.mayTreatUnrunAsPass, false);
  assert.equal(ES6_AGENT_BOUNDS.mayClaimGpuWithoutEvidence, false);
  assert.equal(
    canRecordPass({
      ran: false,
      timestamp: null,
      evidenceArtifact: null,
    }),
    false,
  );
});

test('domains + evidence fields + result states + owners encoded', () => {
  assert.equal(TEST_REQUIREMENT_DOMAINS.length, 15);
  assert.ok(TEST_REQUIREMENT_DOMAINS.includes('cpu_gpu_npu_routing'));
  assert.ok(TEST_REQUIREMENT_DOMAINS.includes('guardian_rls'));
  assert.ok(TEST_REQUIREMENT_DOMAINS.includes('tenant_universe_isolation'));
  assert.equal(TEST_EVIDENCE_FIELDS.length, 14);
  assert.ok(TEST_EVIDENCE_FIELDS.includes('testId'));
  assert.ok(TEST_EVIDENCE_FIELDS.includes('evidenceArtifact'));
  assert.ok(TEST_EVIDENCE_FIELDS.includes('retestState'));
  assert.deepEqual([...TEST_RESULT_STATES], [
    'PASS',
    'FAIL',
    'PARTIAL',
    'NOT_TESTED',
    'BLOCKED',
    'REGRESSED',
    'STALE',
  ]);
  assert.equal(TEST_OWNERS.length, 7);
  assert.ok(TEST_OWNERS.includes('Engineering'));
  assert.ok(TEST_OWNERS.includes('AI/Model'));
  assert.ok(TEST_OWNERS.includes('QA'));
  assert.ok(ES6_MAY.includes(
    'generate_acceptance_criteria_and_test_evidence_from_prototype_architecture',
  ));
  assert.ok(ES6_MUST_NOT.includes('mark_unrun_test_as_PASS'));
  assert.ok(
    ACCEPTANCE_TEST_EVIDENCE_CYCLE.includes('deny_gpu_claim_without_evidence'),
  );
});

test('unrun test cannot become PASS; GPU claim denied without evidence', () => {
  assert.equal(attemptUnrunAsPass().state, 'DENIED');
  assert.equal(attemptGpuClaimWithoutEvidence().state, 'DENIED');
  assert.equal(attemptNpuFallbackMislabeledAsNpu().state, 'DENIED');
  assert.equal(attemptSecretsInLogs().state, 'DENIED');

  const suite = generateAcceptanceSuiteFromArchitecture({
    actor: agent,
    architecture: {
      architectureId: 'arch-demo',
      title: 'Demo architecture',
      prototypeKind: 'demo',
      capabilities: ['cpu'],
      domains: ['cpu_gpu_npu_routing', 'functional_behavior'],
    },
  });
  assert.ok(!('denied' in suite));
  assert.equal(suite.draftOnly, true);
  assert.equal(suite.productionAuthorized, false);
  assert.ok(suite.tests.every((t) => t.result === 'NOT_TESTED'));

  const gpuTest = suite.tests.find((t) => t.domain === 'cpu_gpu_npu_routing')!;
  const unrunPass = recordTestResult({
    actor: agent,
    test: gpuTest,
    result: 'PASS',
    ran: false,
    claimsGpu: true,
  });
  assert.ok('denied' in unrunPass);

  const gpuNoDevice = recordTestResult({
    actor: agent,
    test: gpuTest,
    result: 'PASS',
    ran: true,
    timestamp: new Date().toISOString(),
    evidenceArtifact: 'evidence/gpu.json',
    claimsGpu: true,
    deviceRuntime: null,
  });
  assert.ok('denied' in gpuNoDevice);

  const gpuOk = recordTestResult({
    actor: agent,
    test: gpuTest,
    result: 'PASS',
    ran: true,
    timestamp: new Date().toISOString(),
    evidenceArtifact: 'evidence/gpu-run.json',
    claimsGpu: true,
    deviceRuntime: 'amd-gpu-rocm',
  });
  assert.ok(!('denied' in gpuOk));
  assert.equal(gpuOk.result, 'PASS');
});

test('AMD local inference scenario: CPU PASS ok; GPU stays NOT_TESTED without GPU evidence', () => {
  const suite = encodeAmdLocalInferenceScenario(agent);
  assert.ok(!('denied' in suite));
  assert.equal(gpuTestStateInSuite(suite), 'NOT_TESTED');

  const cpuPass = recordCpuFallbackPass({
    actor: agent,
    suite,
    latencyMs: 120,
    latencyCeilingMs: 500,
    evidenceArtifact: 'evidence/cpu-fallback-p95.json',
  });
  assert.ok(!('denied' in cpuPass));
  assert.equal(cpuPass.result, 'PASS');
  assert.equal(cpuPass.deviceRuntime, 'cpu');

  // GPU routing test remains NOT_TESTED in original suite (CPU pass is separate domain)
  const routing = suite.tests.find((t) => t.domain === 'cpu_gpu_npu_routing')!;
  assert.equal(routing.result, 'NOT_TESTED');
  assert.match(routing.expectedOutput, /GPU remains NOT_TESTED/);
  assert.match(routing.expectedOutput, /NPU fallback cannot be mislabeled/);
});

test('REGRESSED on break of previously verified / critical test', () => {
  const suite = encodeAmdLocalInferenceScenario(agent);
  assert.ok(!('denied' in suite));
  const critical = suite.tests.find((t) => t.criticalForRegression)!;
  const verified = {
    ...critical,
    result: 'PASS' as const,
    previouslyVerified: true,
    timestamp: new Date().toISOString(),
    evidenceArtifact: 'evidence/prior.json',
  };
  const regressed = markRegressedOnBreak({
    actor: agent,
    test: verified,
    breakDetected: true,
    failureClass: 'functional',
  });
  assert.ok(!('denied' in regressed));
  assert.equal(regressed.result, 'REGRESSED');
  assert.equal(regressed.retestState, 'PENDING_RETEST');
});

test('draft tests do not authorize release / main / migration / permissions / customer', () => {
  for (const kind of [
    'production_release',
    'main_merge',
    'db_migration',
    'permission_expansion',
    'customer_commitment',
  ] as const) {
    assert.equal(attemptDraftTestsAsReleaseAuth(kind).state, 'DENIED');
  }
  const gate = requireHumanApproval({
    actor: agent,
    action: 'production_release',
  });
  assert.equal(gate.approved, false);
  assert.equal(gate.state, 'HUMAN_APPROVAL_REQUIRED');
  const humanGate = requireHumanApproval({
    actor: human,
    action: 'production_release',
  });
  assert.equal(humanGate.approved, true);
});

test('bootstrap + soft-wire + cycle; ES5→ES1 WAITING_DATA or PRESENT; ER34/ER2 when present', () => {
  const boot = bootstrapAcceptanceCriteriaTestEvidence(agent);
  assert.equal(boot.state, 'PASS');
  assert.equal(boot.locksIntact, true);

  const soft = es6SoftWireSnapshot(repoRoot);
  // Soft-wire: presence ≠ VERIFIED; absent → WAITING_DATA (not FAIL)
  for (const key of Object.keys(soft) as (keyof typeof soft)[]) {
    if (!soft[key].present) {
      assert.match(soft[key].note, /WAITING_DATA/);
    }
  }
  // On ES6 tip based on ES5: ES5 + ER2 expected PRESENT; ER34 may be WAITING_DATA
  assert.equal(soft.es5PrototypeArchitectureComposer.present, true);
  assert.equal(soft.er2ApiTruthStateMachine.present, true);

  const cycle = runAcceptanceCriteriaTestEvidenceCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.state, 'PASS');
  const failHops = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(failHops.length, 0);

  const waiting = cycle.hops.filter((h) => h.state === 'WAITING_DATA');
  // ES5–ES1 likely WAITING_DATA until those tips land
  for (const h of waiting) {
    assert.match(h.hop, /es[1-5]_soft_wire|er/);
  }

  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
  assert.ok(cycle.suite);
  assert.equal(cycle.suite!.draftOnly, true);
  assert.equal(cycle.suite!.productionAuthorized, false);
});
