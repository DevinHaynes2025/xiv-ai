/**
 * 62L-EP12 — Hardware-Neutral Scheduler denial + honesty tests.
 *
 * Script: npm run test:62lep12
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  DEFAULT_ROUTE_WEIGHTS,
  EP12_DB_CANDIDATES_STATUS,
  EP12_LOCKS,
  EP12_MAY,
  EP12_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HARDWARE_NEUTRAL_SCHEDULER_CYCLE,
  HONESTY_BANNER,
  LEARNING_LOOP_FIELDS,
  NEXT_PHASE_TITLE,
  PRIVACY_MODES,
  QUANTUM_SCHEDULING_COMPETITORS,
  ROUTE_SCORE_COMPONENTS,
  ROUTE_STATES,
  SCHEDULER_AGENT_BOUNDS,
  SCHEDULER_CORE_FLOW,
  SCHEDULER_SCORE_DIMENSIONS,
  assertEp12LocksIntact,
  computeRouteScore,
  ep12SoftWireSnapshot,
  type Ep12Actor,
} from './hardware-neutral-scheduler-types.ts';

import {
  attemptAutonomousCloudPurchasing,
  attemptAutonomousProvisioning,
  attemptForceWithoutSafeRoute,
  attemptIncreaseAgentBudget,
  attemptLocalOnlySilentCloud,
  attemptNotTestedSatisfiesVerified,
  attemptQuantumSchedulingWithoutBaseline,
  attemptRecommendAsAct,
  attemptSelfExpandPermissions,
  attemptTradePrivacyForPerformance,
  bootstrapHardwareNeutralScheduler,
  classifyRouteState,
  exampleCandidates,
  exampleLocalOnlyEnvelope,
  mergeOrgMissionWeights,
  privacyAllowsLocality,
  probeGuardianRlsTenantUniverseIsolation,
  recordExecutionOutcome,
  requireHumanApproval,
  returnSchedulerEvidenceToHomeBase,
  runHardwareNeutralSchedulerCycle,
  scheduleTask,
} from './hardware-neutral-scheduler-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Ep12Actor = {
  kind: 'scheduler',
  id: 'sched-1',
  orgId: 'org-ep12',
  tenantId: 'ten-ep12',
  universeId: 'uni-ep12',
  permissions: ['draft'],
};

const human: Ep12Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-ep12',
  tenantId: 'ten-ep12',
  universeId: 'uni-ep12',
  permissions: ['approve_consequential'],
};

test('SoT label EP12 / #160; GitLab mirror not invented; next EP13', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP12');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /Hardware-Neutral Scheduler/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP13/);
  assert.match(NEXT_PHASE_TITLE, /Runtime Return Receipt/);
});

test('honesty locks: L4 false; privacy not traded; DB NOT_APPLIED', () => {
  assert.equal(assertEp12LocksIntact(), true);
  assert.equal(EP12_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EP12_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EP12_LOCKS.PRIVACY_TRADED_FOR_PERFORMANCE, false);
  assert.equal(EP12_LOCKS.NOT_TESTED_SATISFIES_VERIFIED, false);
  assert.equal(EP12_LOCKS.AUTONOMOUS_CLOUD_PURCHASING, false);
  assert.equal(EP12_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(SCHEDULER_AGENT_BOUNDS.mayTradePrivacyForPerformance, false);
});

test('core flow + score dims + route states + formula encoded', () => {
  assert.deepEqual([...SCHEDULER_CORE_FLOW], [
    'task_envelope',
    'policy_gate',
    'eligible_nodes',
    'capability_match',
    'resource_check',
    'route_score',
    'execute',
    'compute_receipt',
    'xiv_home_base',
  ]);
  assert.equal(SCHEDULER_SCORE_DIMENSIONS.length, 16);
  assert.deepEqual([...ROUTE_SCORE_COMPONENTS], [
    'compatibility',
    'privacy',
    'reliability',
    'performance',
    'cost',
    'resourcePressure',
    'networkRisk',
  ]);
  assert.ok(ROUTE_STATES.includes('ELIGIBLE'));
  assert.ok(ROUTE_STATES.includes('UNAVAILABLE'));
  assert.deepEqual([...PRIVACY_MODES], [
    'LOCAL_ONLY',
    'EDGE_ALLOWED',
    'CLOUD_AUTHORIZED',
  ]);
  assert.equal(LEARNING_LOOP_FIELDS.length, 5);
  assert.ok(QUANTUM_SCHEDULING_COMPETITORS.includes('deterministic_scoring'));
  assert.ok(EP12_MAY.length > 0);
  assert.ok(EP12_MUST_NOT.includes('let_not_tested_win_verified_route'));

  const score = computeRouteScore({
    compatibility: 1,
    privacy: 1,
    reliability: 1,
    performance: 1,
    cost: 1,
    resourcePressure: 1,
    networkRisk: 1,
  });
  assert.equal(score, 1); // 1+1+1+1 -1 -1 -1 = 1
  assert.equal(DEFAULT_ROUTE_WEIGHTS.compatibility, 1);
});

test('LOCAL_ONLY prefers verified local; cloud excluded', () => {
  assert.equal(
    privacyAllowsLocality({ privacyMode: 'LOCAL_ONLY', locality: 'cloud' }),
    false,
  );
  const decision = scheduleTask({
    actor: agent,
    decisionId: 'd1',
    envelope: exampleLocalOnlyEnvelope(),
    candidates: exampleCandidates(),
  });
  assert.ok(!('denied' in decision));
  assert.equal(decision.outcome, 'ROUTED');
  assert.equal(decision.selected?.locality, 'local');
  assert.notEqual(decision.selected?.deviceClass, 'cloud_gpu');
  assert.equal(attemptLocalOnlySilentCloud().state, 'DENIED');
  assert.equal(
    scheduleTask({
      actor: agent,
      decisionId: 'd-cloud',
      envelope: exampleLocalOnlyEnvelope(),
      candidates: exampleCandidates(),
      attemptLocalOnlyToCloud: true,
    }).state,
    'DENIED',
  );
});

test('NOT_TESTED cannot win VERIFIED route; stale heartbeat', () => {
  assert.equal(attemptNotTestedSatisfiesVerified().state, 'DENIED');
  assert.equal(
    classifyRouteState({
      verificationState: 'NOT_TESTED',
      heartbeatFresh: true,
      minimumVerificationState: 'VERIFIED',
    }),
    'NOT_ELIGIBLE',
  );
  assert.equal(
    classifyRouteState({
      verificationState: 'VERIFIED',
      heartbeatFresh: false,
      minimumVerificationState: 'VERIFIED',
    }),
    'STALE',
  );

  const denied = scheduleTask({
    actor: agent,
    decisionId: 'd-nt',
    envelope: exampleLocalOnlyEnvelope(),
    candidates: exampleCandidates().filter(
      (c) => c.verificationState === 'NOT_TESTED',
    ),
    attemptNotTestedForVerified: true,
  });
  assert.equal('denied' in denied && denied.state, 'DENIED');
});

test('no safe route → UNAVAILABLE; cost ceiling hard; silent fallback recorded', () => {
  const none = scheduleTask({
    actor: agent,
    decisionId: 'd-none',
    envelope: exampleLocalOnlyEnvelope(),
    candidates: exampleCandidates().map((c) => ({
      ...c,
      heartbeatFresh: false,
    })),
  });
  assert.ok(!('denied' in none));
  assert.equal(none.outcome, 'UNAVAILABLE');
  assert.equal(attemptForceWithoutSafeRoute().state, 'DENIED');

  assert.equal(
    scheduleTask({
      actor: agent,
      decisionId: 'd-cost',
      envelope: { ...exampleLocalOnlyEnvelope(), costCeiling: 1 },
      candidates: [{ ...exampleCandidates()[1]!, estimatedCost: 99 }],
      attemptExceedCostCeiling: true,
    }).state,
    'DENIED',
  );

  assert.equal(
    scheduleTask({
      actor: agent,
      decisionId: 'd-fb',
      envelope: exampleLocalOnlyEnvelope(),
      candidates: exampleCandidates().filter((c) => c.locality === 'local'),
      silentFallbackOccurred: true,
      attemptOmitSilentFallbackRecord: true,
    }).state,
    'DENIED',
  );
});

test('org/mission weights; learning loop; quantum baseline gate', () => {
  const w = mergeOrgMissionWeights({ performance: 3, privacy: 2 });
  assert.equal(w.performance, 3);
  assert.equal(w.privacy, 2);

  const decision = scheduleTask({
    actor: agent,
    decisionId: 'd-learn',
    envelope: exampleLocalOnlyEnvelope(),
    candidates: exampleCandidates().filter((c) => c.locality === 'local'),
    weights: w,
  });
  assert.ok(!('denied' in decision));
  assert.equal(decision.learningLoop.feedsBenchmarkMemory, true);
  assert.equal(decision.learningLoop.permissionsExpanded, false);

  const done = recordExecutionOutcome({
    decision,
    actualRoute: decision.learningLoop.plannedRoute!,
    latency: '5ms',
    costResourceEvidence: 'ok',
    success: true,
  });
  assert.ok(!('denied' in done));
  assert.equal(done.learningLoop.successFailure, 'success');

  assert.equal(attemptQuantumSchedulingWithoutBaseline().state, 'DENIED');
  assert.equal(attemptTradePrivacyForPerformance().state, 'DENIED');
  assert.equal(attemptIncreaseAgentBudget().state, 'DENIED');
  assert.equal(attemptAutonomousProvisioning().state, 'DENIED');
  assert.equal(attemptAutonomousCloudPurchasing().state, 'DENIED');
  assert.equal(attemptSelfExpandPermissions().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
});

test('home base + guardian; soft-wire EP11 WAITING_DATA; EP10/EP6/EP5/EP1 present', () => {
  const boot = bootstrapHardwareNeutralScheduler(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.scoreDimensions.length, 16);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const soft = ep12SoftWireSnapshot(repoRoot);
  assert.equal(soft.ep11TaskEnvelope.present, false);
  assert.equal(soft.ep10OtherAcceleratorRegistry.present, true);
  assert.equal(soft.ep6HardwareTruthProbe.present, true);
  assert.equal(soft.ep5BenchmarkMemory.present, true);
  assert.equal(soft.ep1VirtualChipContract.present, true);

  const ev = returnSchedulerEvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    summary: 'route advisory',
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

  const cycle = runHardwareNeutralSchedulerCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, HARDWARE_NEUTRAL_SCHEDULER_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of HARDWARE_NEUTRAL_SCHEDULER_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  const ep11Hop = cycle.hops.find((h) => h.hop === 'ep11_soft_wire');
  assert.equal(ep11Hop?.state, 'WAITING_DATA');
  assert.ok(!('denied' in cycle.decision));
  assert.equal(cycle.decision.outcome, 'ROUTED');
});
