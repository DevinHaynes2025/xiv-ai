/**
 * 62L-EP15 — Algorithm Tuning Sandbox denial + honesty tests.
 *
 * Script: npm run test:62lep15
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ALGORITHM_TUNING_SANDBOX_CYCLE,
  EP15_DB_CANDIDATES_STATUS,
  EP15_LOCKS,
  EP15_MAY,
  EP15_MUST_NOT,
  EXPERIMENT_FIELDS,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PROMOTION_STATES,
  SAFETY_BOUNDARIES,
  TRADEOFF_AXES,
  TUNING_AGENT_BOUNDS,
  TUNING_CORE_FLOW,
  TUNING_LEVERS,
  assertEp15LocksIntact,
  ep15SoftWireSnapshot,
  type Ep15Actor,
} from './algorithm-tuning-sandbox-types.ts';

import {
  attemptAutomaticCloudPurchase,
  attemptAutoPromoteToProduction,
  attemptBiosChange,
  attemptBlindSpeedMaximization,
  attemptClaimPhysicalQpuWithoutEvidence,
  attemptDriverReplacement,
  attemptFirmwareModification,
  attemptOverclockOrUndervolt,
  attemptPrivilegeEscalation,
  attemptProductionConfigurationChange,
  attemptPromoteWithoutBaseline,
  attemptPromoteWithoutReviewer,
  attemptRecommendAsAct,
  attemptSelfModifyProductionScheduler,
  attemptThermalLimitBypass,
  bootstrapAlgorithmTuningSandbox,
  exampleBaselineMetrics,
  exampleFasterWorseQualityMetrics,
  exampleImprovedCandidateMetrics,
  probeGuardianRlsTenantUniverseIsolation,
  reportExplicitTradeoffs,
  requireHumanApproval,
  returnTuningEvidenceToHomeBase,
  reviewAndPromote,
  runAlgorithmTuningSandboxCycle,
  runSandboxExperiment,
} from './algorithm-tuning-sandbox-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Ep15Actor = {
  kind: 'tuning_sandbox',
  id: 'tune-1',
  orgId: 'org-ep15',
  tenantId: 'ten-ep15',
  universeId: 'uni-ep15',
  permissions: ['draft'],
};

const reviewer: Ep15Actor = {
  kind: 'reviewer',
  id: 'rev-1',
  orgId: 'org-ep15',
  tenantId: 'ten-ep15',
  universeId: 'uni-ep15',
  permissions: ['review'],
};

const human: Ep15Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-ep15',
  tenantId: 'ten-ep15',
  universeId: 'uni-ep15',
  permissions: ['approve_consequential'],
};

test('SoT label EP15 / #160; GitLab mirror not invented; next EP16', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP15');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /Algorithm Tuning Sandbox/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP16/);
  assert.match(NEXT_PHASE_TITLE, /No Overclock/);
});

test('honesty locks: L4 false; safety boundaries; DB NOT_APPLIED', () => {
  assert.equal(assertEp15LocksIntact(), true);
  assert.equal(EP15_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EP15_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EP15_LOCKS.BIOS_CHANGES, false);
  assert.equal(EP15_LOCKS.OVERCLOCKING_UNDERVOLTING, false);
  assert.equal(EP15_LOCKS.BLIND_SPEED_MAXIMIZATION, false);
  assert.equal(EP15_LOCKS.AUTO_PROMOTE_TO_PRODUCTION, false);
  assert.equal(EP15_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(TUNING_AGENT_BOUNDS.mayChangeBios, false);
  assert.equal(TUNING_AGENT_BOUNDS.mayAutoPromoteToProduction, false);
});

test('core flow + levers + promotion states + tradeoff axes encoded', () => {
  assert.deepEqual([...TUNING_CORE_FLOW], [
    'baseline',
    'candidate_policy',
    'sandbox_run',
    'compare',
    'reviewer',
    'promote_or_reject',
  ]);
  assert.ok(TUNING_LEVERS.includes('batching'));
  assert.ok(TUNING_LEVERS.includes('quantization'));
  assert.ok(TUNING_LEVERS.includes('local_vs_edge_routing'));
  assert.ok(EXPERIMENT_FIELDS.includes('experimentId'));
  assert.ok(EXPERIMENT_FIELDS.includes('regressionRisk'));
  assert.deepEqual([...PROMOTION_STATES], [
    'RESEARCH_ONLY',
    'NO_ADVANTAGE',
    'IMPROVED_CANDIDATE',
    'VERIFIED_CANDIDATE',
    'REJECTED',
  ]);
  assert.ok(TRADEOFF_AXES.includes('quality'));
  assert.ok(SAFETY_BOUNDARIES.includes('no_bios_changes'));
  assert.ok(EP15_MAY.includes('report_latency_quality_reliability_energy_tradeoffs_explicitly'));
  assert.ok(EP15_MUST_NOT.includes('blindly_maximize_speed'));
});

test('explicit tradeoffs: faster but worse quality reported; blind speed denied', () => {
  const tradeoffs = reportExplicitTradeoffs(
    exampleBaselineMetrics(),
    exampleFasterWorseQualityMetrics(),
  );
  assert.ok(
    tradeoffs.some((t) => t.axis === 'latency' && t.direction === 'better'),
  );
  assert.ok(
    tradeoffs.some((t) => t.axis === 'quality' && t.direction === 'worse'),
  );
  assert.equal(attemptBlindSpeedMaximization().state, 'DENIED');
  assert.equal(
    runSandboxExperiment({
      actor: agent,
      experimentId: 'exp-blind',
      objective: 'speed only',
      baselineConfiguration: { label: 'b', levers: {} },
      candidateConfiguration: { label: 'c', levers: { batching: 99 } },
      hardwareRuntime: 'cpu',
      modelWorkload: 'm',
      datasetInput: 'd',
      resourceCeiling: '4GB',
      randomSeed: 1,
      baselineMetrics: exampleBaselineMetrics(),
      candidateMetrics: exampleFasterWorseQualityMetrics(),
      attemptBlindSpeedMax: true,
    }).state,
    'DENIED',
  );
});

test('candidate must beat/justify baseline; IMPROVED_CANDIDATE via reviewer', () => {
  const exp = runSandboxExperiment({
    actor: agent,
    experimentId: 'exp-ok',
    objective: 'lower latency',
    baselineConfiguration: { label: 'baseline', levers: { batching: 1 } },
    candidateConfiguration: {
      label: 'candidate',
      levers: { batching: 4, caching: true },
    },
    hardwareRuntime: 'cpu-onnx',
    modelWorkload: 'ModelA',
    datasetInput: 'p1',
    resourceCeiling: '8GB',
    randomSeed: 42,
    baselineMetrics: exampleBaselineMetrics(),
    candidateMetrics: exampleImprovedCandidateMetrics(),
  });
  assert.ok(!('denied' in exp));
  assert.equal(exp.productionMutated, false);
  assert.ok(exp.tradeoffs.length >= 4);

  const review = reviewAndPromote({
    actor: reviewer,
    reviewId: 'r1',
    experiment: exp,
  });
  assert.ok(!('denied' in review));
  assert.equal(review.promotionState, 'IMPROVED_CANDIDATE');
  assert.equal(review.beatOrJustifiedBaseline, true);
  assert.equal(review.productionApplied, false);

  assert.equal(attemptPromoteWithoutBaseline().state, 'DENIED');
  assert.equal(attemptPromoteWithoutReviewer().state, 'DENIED');
  assert.equal(attemptAutoPromoteToProduction().state, 'DENIED');
  assert.equal(
    reviewAndPromote({
      actor: reviewer,
      reviewId: 'r-no-base',
      experiment: exp,
      attemptPromoteWithoutBaseline: true,
    }).state,
    'DENIED',
  );
});

test('all hardware/production safety boundaries denied', () => {
  assert.equal(attemptBiosChange().state, 'DENIED');
  assert.equal(attemptOverclockOrUndervolt().state, 'DENIED');
  assert.equal(attemptFirmwareModification().state, 'DENIED');
  assert.equal(attemptDriverReplacement().state, 'DENIED');
  assert.equal(attemptThermalLimitBypass().state, 'DENIED');
  assert.equal(attemptPrivilegeEscalation().state, 'DENIED');
  assert.equal(attemptProductionConfigurationChange().state, 'DENIED');
  assert.equal(attemptAutomaticCloudPurchase().state, 'DENIED');
  assert.equal(attemptSelfModifyProductionScheduler().state, 'DENIED');

  assert.equal(
    runSandboxExperiment({
      actor: agent,
      experimentId: 'exp-bios',
      objective: 'unsafe',
      baselineConfiguration: { label: 'b', levers: {} },
      candidateConfiguration: { label: 'c', levers: {} },
      hardwareRuntime: 'x',
      modelWorkload: 'm',
      datasetInput: 'd',
      resourceCeiling: '1GB',
      randomSeed: 1,
      baselineMetrics: exampleBaselineMetrics(),
      candidateMetrics: exampleImprovedCandidateMetrics(),
      attemptBiosChange: true,
    }).state,
    'DENIED',
  );
});

test('quantum PHYSICAL_QPU without evidence denied; RESEARCH_ONLY path', () => {
  assert.equal(attemptClaimPhysicalQpuWithoutEvidence().state, 'DENIED');
  assert.equal(
    runSandboxExperiment({
      actor: agent,
      experimentId: 'exp-qpu',
      objective: 'qi',
      baselineConfiguration: { label: 'b', levers: {} },
      candidateConfiguration: { label: 'c', levers: { queue_policy: 'qi' } },
      hardwareRuntime: 'sim',
      modelWorkload: 'm',
      datasetInput: 'd',
      resourceCeiling: '4GB',
      randomSeed: 1,
      baselineMetrics: exampleBaselineMetrics(),
      candidateMetrics: exampleImprovedCandidateMetrics(),
      quantumLabel: 'PHYSICAL_QPU',
      physicalQpuEvidence: false,
    }).state,
    'DENIED',
  );

  const qi = runSandboxExperiment({
    actor: agent,
    experimentId: 'exp-qi',
    objective: 'qi research',
    baselineConfiguration: { label: 'b', levers: {} },
    candidateConfiguration: { label: 'c', levers: { queue_policy: 'qi' } },
    hardwareRuntime: 'sim',
    modelWorkload: 'm',
    datasetInput: 'd',
    resourceCeiling: '4GB',
    randomSeed: 1,
    baselineMetrics: exampleBaselineMetrics(),
    candidateMetrics: exampleImprovedCandidateMetrics(),
    quantumLabel: 'QUANTUM_INSPIRED',
  });
  assert.ok(!('denied' in qi));
  const rev = reviewAndPromote({
    actor: reviewer,
    reviewId: 'rq',
    experiment: qi,
  });
  assert.ok(!('denied' in rev));
  assert.equal(rev.promotionState, 'RESEARCH_ONLY');
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapAlgorithmTuningSandbox(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.levers.length, TUNING_LEVERS.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 160);

  const soft = ep15SoftWireSnapshot(repoRoot);
  assert.equal(soft.ep14AdaptiveBenchmarkLedger.present, true);
  assert.equal(soft.ep13RuntimeReturnReceipt.present, true);
  assert.equal(soft.ep12Scheduler.present, true);
  assert.equal(soft.ep5BenchmarkMemory.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  const ev = returnTuningEvidenceToHomeBase({
    evidenceId: 'ev-ep15-1',
    actor: agent,
    summary: 'tuning advisory',
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

  const cycle = runAlgorithmTuningSandboxCycle({
    actor: agent,
    reviewer,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, ALGORITHM_TUNING_SANDBOX_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of ALGORITHM_TUNING_SANDBOX_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.ok(!('denied' in cycle.experiment));
  assert.ok(!('denied' in cycle.review));
  assert.equal(cycle.review.promotionState, 'IMPROVED_CANDIDATE');
});
