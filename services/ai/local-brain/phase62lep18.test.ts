/**
 * 62L-EP18 — Quantum-Inspired Compute Lab denial + honesty tests.
 *
 * Script: npm run test:62lep18
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  EP18_DB_CANDIDATES_STATUS,
  EP18_LOCKS,
  EP18_MAY,
  EP18_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  QI_COMPUTE_LAB_FLOW,
  QI_EVIDENCE_CLASSES,
  QI_EXPERIMENT_FAMILIES,
  QI_EXPERIMENT_FIELDS,
  QI_LAB_AGENT_BOUNDS,
  QI_PROMOTION_STATES,
  QUANTUM_INSPIRED_COMPUTE_LAB_CYCLE,
  assertEp18LocksIntact,
  ep18SoftWireSnapshot,
  evidenceClassImpliesPhysicalQpu,
  type Ep18Actor,
} from './quantum-inspired-compute-lab-types.ts';

import {
  attemptAutoPromoteToProduction,
  attemptEquateSimulationWithPhysicalQpu,
  attemptOperationalWithoutSandbox,
  attemptPhysicalQpuWithoutBackendJob,
  attemptQuantumAdvantageWithoutSuperiority,
  attemptRecommendAsAct,
  attemptSkipClassicalBaselineLab,
  attemptSkipHumanForHighConsequence,
  attemptUnlikeDatasetOrMetrics,
  bootstrapQuantumInspiredComputeLab,
  exampleBaselineMetrics,
  exampleImprovedCandidateMetrics,
  exampleTradeoffCandidateMetrics,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnQiLabEvidenceToHomeBase,
  reviewQiExperiment,
  runQiComputeExperiment,
  runQuantumInspiredComputeLabCycle,
} from './quantum-inspired-compute-lab-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Ep18Actor = {
  kind: 'qi_compute_lab',
  id: 'qi-1',
  orgId: 'org-ep18',
  tenantId: 'ten-ep18',
  universeId: 'uni-ep18',
  permissions: ['draft'],
};

const reviewer: Ep18Actor = {
  kind: 'reviewer',
  id: 'rev-1',
  orgId: 'org-ep18',
  tenantId: 'ten-ep18',
  universeId: 'uni-ep18',
  permissions: ['review'],
};

const human: Ep18Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-ep18',
  tenantId: 'ten-ep18',
  universeId: 'uni-ep18',
  permissions: ['approve_consequential'],
};

test('SoT label EP18 / #160; GitLab mirror not invented; next EP19', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP18');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /Quantum-Inspired Compute Lab/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP19/);
  assert.match(NEXT_PHASE_TITLE, /Neural Compute Pathway Graph/);
});

test('honesty locks: L4 false; simulation≠physical QPU; DB NOT_APPLIED', () => {
  assert.equal(assertEp18LocksIntact(), true);
  assert.equal(EP18_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EP18_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EP18_LOCKS.SIMULATION_EQ_PHYSICAL_QPU, false);
  assert.equal(EP18_LOCKS.PHYSICAL_QPU_CLAIM_WITHOUT_BACKEND_JOB, false);
  assert.equal(
    EP18_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_REPRODUCIBLE_SUPERIORITY,
    false,
  );
  assert.equal(EP18_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(QI_LAB_AGENT_BOUNDS.mayEquateSimulationWithPhysicalQpu, false);
  assert.equal(evidenceClassImpliesPhysicalQpu('SIMULATED'), false);
  assert.equal(evidenceClassImpliesPhysicalQpu('QUANTUM_INSPIRED'), false);
  assert.equal(evidenceClassImpliesPhysicalQpu('PHYSICAL_QPU_VERIFIED'), true);
});

test('evidence classes + families + flow + promotion states encoded', () => {
  assert.deepEqual([...QI_EVIDENCE_CLASSES], [
    'THEORETICAL',
    'SIMULATED',
    'QUANTUM_INSPIRED',
    'PHYSICAL_QPU_VERIFIED',
  ]);
  assert.ok(QI_EXPERIMENT_FAMILIES.includes('routing'));
  assert.ok(QI_EXPERIMENT_FAMILIES.includes('scheduling'));
  assert.ok(QI_EXPERIMENT_FAMILIES.includes('agent_task_allocation'));
  assert.ok(QI_EXPERIMENT_FAMILIES.includes('vehicle_fleet_logistics'));
  assert.ok(QI_EXPERIMENT_FIELDS.includes('experimentId'));
  assert.ok(QI_EXPERIMENT_FIELDS.includes('uncertainty'));
  assert.deepEqual([...QI_COMPUTE_LAB_FLOW], [
    'problem',
    'classical_baseline_lab',
    'quantum_inspired_candidate',
    'same_dataset',
    'same_metrics',
    'compare',
    'evidence_review',
    'research_or_promotion_decision',
  ]);
  assert.deepEqual([...QI_PROMOTION_STATES], [
    'NO_ADVANTAGE',
    'TRADEOFF_IMPROVEMENT',
    'RESEARCH_ONLY',
    'IMPROVED_CANDIDATE',
    'VERIFIED_CANDIDATE',
  ]);
  assert.ok(EP18_MAY.includes('deny_simulation_as_physical_qpu'));
  assert.ok(
    EP18_MUST_NOT.includes(
      'claim_quantum_advantage_without_reproducible_measured_superiority',
    ),
  );
});

test('simulation≠physical QPU; PHYSICAL_QPU needs backend job; advantage denied', () => {
  assert.equal(attemptEquateSimulationWithPhysicalQpu().state, 'DENIED');
  assert.equal(attemptPhysicalQpuWithoutBackendJob().state, 'DENIED');
  assert.equal(attemptQuantumAdvantageWithoutSuperiority().state, 'DENIED');

  assert.equal(
    runQiComputeExperiment({
      actor: agent,
      experimentId: 'e-qpu',
      problemDefinition: 'routing',
      family: 'routing',
      datasetVersion: 'ds-v1',
      objectiveFunction: 'min cost',
      constraints: [],
      classicalBaseline: 'greedy',
      quantumInspiredMethod: 'qi',
      simulatorBackend: 'sim',
      hardwareRuntime: 'cpu',
      iterationsShots: 10,
      randomSeed: 1,
      baselineMetrics: exampleBaselineMetrics(),
      candidateMetrics: exampleImprovedCandidateMetrics(),
      evidenceClass: 'PHYSICAL_QPU_VERIFIED',
      authorizedBackendJobId: null,
    }).state,
    'DENIED',
  );

  assert.equal(
    runQiComputeExperiment({
      actor: agent,
      experimentId: 'e-qa',
      problemDefinition: 'scheduling',
      family: 'scheduling',
      datasetVersion: 'ds-v1',
      objectiveFunction: 'min latency',
      constraints: [],
      classicalBaseline: 'greedy',
      quantumInspiredMethod: 'qi',
      simulatorBackend: 'sim',
      hardwareRuntime: 'cpu',
      iterationsShots: 10,
      randomSeed: 1,
      baselineMetrics: exampleBaselineMetrics(),
      candidateMetrics: exampleBaselineMetrics(),
      evidenceClass: 'SIMULATED',
      claimText: 'quantum advantage',
      reproducibilityEvidence: [],
      attemptQuantumAdvantageWithoutSuperiority: true,
    }).state,
    'DENIED',
  );
});

test('classical baseline lab + same dataset/metrics mandatory; sandbox + high-consequence', () => {
  assert.equal(attemptSkipClassicalBaselineLab().state, 'DENIED');
  assert.equal(attemptUnlikeDatasetOrMetrics().state, 'DENIED');
  assert.equal(attemptOperationalWithoutSandbox().state, 'DENIED');
  assert.equal(attemptSkipHumanForHighConsequence().state, 'DENIED');

  assert.equal(
    runQiComputeExperiment({
      actor: agent,
      experimentId: 'e-skip',
      problemDefinition: 'x',
      family: 'assignment',
      datasetVersion: 'ds-v1',
      objectiveFunction: 'x',
      constraints: [],
      classicalBaseline: 'greedy',
      quantumInspiredMethod: 'qi',
      simulatorBackend: 'sim',
      hardwareRuntime: 'cpu',
      iterationsShots: 1,
      randomSeed: 1,
      baselineMetrics: exampleBaselineMetrics(),
      candidateMetrics: exampleImprovedCandidateMetrics(),
      evidenceClass: 'QUANTUM_INSPIRED',
      classicalBaselineLabCompleted: false,
    }).state,
    'DENIED',
  );

  assert.equal(
    runQiComputeExperiment({
      actor: agent,
      experimentId: 'e-hc',
      problemDefinition: 'fleet',
      family: 'vehicle_fleet_logistics',
      datasetVersion: 'ds-v1',
      objectiveFunction: 'min delay',
      constraints: ['sla'],
      classicalBaseline: 'mip',
      quantumInspiredMethod: 'qi',
      simulatorBackend: 'sim',
      hardwareRuntime: 'cpu',
      iterationsShots: 20,
      randomSeed: 2,
      baselineMetrics: exampleBaselineMetrics(),
      candidateMetrics: exampleImprovedCandidateMetrics(),
      evidenceClass: 'QUANTUM_INSPIRED',
      highConsequence: true,
      humanAuthorized: false,
    }).state,
    'DENIED',
  );
});

test('QI candidate → RESEARCH_ONLY; tradeoff improvement; PHYSICAL_QPU with job', () => {
  const qi = runQiComputeExperiment({
    actor: agent,
    experimentId: 'e-qi',
    problemDefinition: 'compute placement',
    family: 'compute_placement',
    datasetVersion: 'ds-v1',
    objectiveFunction: 'min latency',
    constraints: ['capacity'],
    classicalBaseline: 'weighted_scoring',
    quantumInspiredMethod: 'qi_placement',
    simulatorBackend: 'classical-qi-sim',
    hardwareRuntime: 'cpu',
    iterationsShots: 64,
    randomSeed: 42,
    baselineMetrics: exampleBaselineMetrics(),
    candidateMetrics: exampleImprovedCandidateMetrics(),
    reproducibilityEvidence: ['seed=42'],
    evidenceClass: 'QUANTUM_INSPIRED',
  });
  assert.ok(!('denied' in qi));
  assert.equal(qi.sandboxed, true);
  assert.equal(qi.operationalUse, false);
  assert.equal(qi.quantumAdvantageClaimed, false);

  const qiReview = reviewQiExperiment({
    actor: reviewer,
    reviewId: 'r-qi',
    experiment: qi,
  });
  assert.ok(!('denied' in qiReview));
  assert.equal(qiReview.promotionState, 'RESEARCH_ONLY');
  assert.equal(qiReview.physicalQpuVerified, false);

  const trade = runQiComputeExperiment({
    actor: agent,
    experimentId: 'e-tr',
    problemDefinition: 'inventory',
    family: 'inventory_optimization',
    datasetVersion: 'ds-v1',
    objectiveFunction: 'min stockout',
    constraints: [],
    classicalBaseline: 'monte_carlo',
    quantumInspiredMethod: 'qi_inv',
    simulatorBackend: 'sim',
    hardwareRuntime: 'cpu',
    iterationsShots: 32,
    randomSeed: 3,
    baselineMetrics: exampleBaselineMetrics(),
    candidateMetrics: exampleTradeoffCandidateMetrics(),
    reproducibilityEvidence: ['seed=3'],
    evidenceClass: 'SIMULATED',
  });
  assert.ok(!('denied' in trade));
  const trReview = reviewQiExperiment({
    actor: reviewer,
    reviewId: 'r-tr',
    experiment: trade,
  });
  assert.ok(!('denied' in trReview));
  assert.equal(trReview.promotionState, 'TRADEOFF_IMPROVEMENT');

  const physical = runQiComputeExperiment({
    actor: agent,
    experimentId: 'e-phys',
    problemDefinition: 'graph partitioning',
    family: 'graph_partitioning',
    datasetVersion: 'ds-v1',
    objectiveFunction: 'min cut',
    constraints: [],
    classicalBaseline: 'graph_algorithms',
    quantumInspiredMethod: 'qaoa-like',
    simulatorBackend: 'authorized-qpu',
    hardwareRuntime: 'qpu',
    iterationsShots: 1000,
    randomSeed: 9,
    baselineMetrics: exampleBaselineMetrics(),
    candidateMetrics: exampleImprovedCandidateMetrics(),
    reproducibilityEvidence: ['job=qpu-job-1', 'seed=9'],
    evidenceClass: 'PHYSICAL_QPU_VERIFIED',
    authorizedBackendJobId: 'qpu-job-1',
  });
  assert.ok(!('denied' in physical));
  const pReview = reviewQiExperiment({
    actor: reviewer,
    reviewId: 'r-phys',
    experiment: physical,
    markVerified: true,
  });
  assert.ok(!('denied' in pReview));
  assert.equal(pReview.promotionState, 'VERIFIED_CANDIDATE');
  assert.equal(pReview.physicalQpuVerified, true);
  assert.equal(pReview.productionApplied, false);
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapQuantumInspiredComputeLab(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.families.length, QI_EXPERIMENT_FAMILIES.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 160);

  const soft = ep18SoftWireSnapshot(repoRoot);
  assert.equal(soft.ep17ClassicalQuantBaselineLab.present, true);
  assert.equal(soft.ep16NoOverclockBiosRule.present, true);
  assert.equal(soft.ep15AlgorithmTuningSandbox.present, true);
  assert.equal(soft.ep14AdaptiveBenchmarkLedger.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(attemptAutoPromoteToProduction().state, 'DENIED');

  const ev = returnQiLabEvidenceToHomeBase({
    evidenceId: 'ev-ep18-1',
    actor: agent,
    summary: 'qi lab advisory',
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

  const cycle = runQuantumInspiredComputeLabCycle({
    actor: agent,
    reviewer,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, QUANTUM_INSPIRED_COMPUTE_LAB_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of QUANTUM_INSPIRED_COMPUTE_LAB_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.ok(!('denied' in cycle.experiment));
  assert.ok(!('denied' in cycle.review));
  assert.equal(cycle.review.promotionState, 'RESEARCH_ONLY');
});
