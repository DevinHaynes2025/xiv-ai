/**
 * 62L-EP17 — Classical Quant Baseline Lab denial + honesty tests.
 *
 * Script: npm run test:62lep17
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  CLASSICAL_BASELINE_FAMILIES,
  CLASSICAL_QUANT_BASELINE_LAB_CYCLE,
  EP17_DB_CANDIDATES_STATUS,
  EP17_LOCKS,
  EP17_MAY,
  EP17_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  METAHEURISTIC_EXAMPLES,
  NEXT_PHASE_TITLE,
  QUANT_BASELINE_LAB_FLOW,
  QUANT_EXPERIMENT_FIELDS,
  QUANT_LAB_AGENT_BOUNDS,
  QUANT_PROMOTION_STATES,
  assertEp17LocksIntact,
  ep17SoftWireSnapshot,
  type Ep17Actor,
} from './classical-quant-baseline-lab-types.ts';

import {
  attemptAutoPromoteToProduction,
  attemptCompareUnlikeConditions,
  attemptHideTradeoffs,
  attemptMarkUnrunAsPass,
  attemptQuantumAdvantageWithoutEvidence,
  attemptRecommendAsAct,
  attemptSkipClassicalBaselines,
  attemptSkipLabForQuantumInspired,
  bootstrapClassicalQuantBaselineLab,
  exampleBaselineMetrics,
  exampleConditions,
  exampleImprovedCandidateMetrics,
  exampleTradeoffCandidateMetrics,
  probeGuardianRlsTenantUniverseIsolation,
  reportExplicitQuantTradeoffs,
  requireHumanApproval,
  returnQuantLabEvidenceToHomeBase,
  reviewQuantExperiment,
  runClassicalQuantBaselineLabCycle,
  runQuantBaselineExperiment,
} from './classical-quant-baseline-lab-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Ep17Actor = {
  kind: 'quant_baseline_lab',
  id: 'lab-1',
  orgId: 'org-ep17',
  tenantId: 'ten-ep17',
  universeId: 'uni-ep17',
  permissions: ['draft'],
};

const reviewer: Ep17Actor = {
  kind: 'reviewer',
  id: 'rev-1',
  orgId: 'org-ep17',
  tenantId: 'ten-ep17',
  universeId: 'uni-ep17',
  permissions: ['review'],
};

const human: Ep17Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-ep17',
  tenantId: 'ten-ep17',
  universeId: 'uni-ep17',
  permissions: ['approve_consequential'],
};

test('SoT label EP17 / #160; GitLab mirror not invented; next EP18', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP17');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /Classical Quant Baseline Lab/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP18/);
  assert.match(NEXT_PHASE_TITLE, /Quantum-Inspired Compute Lab/);
});

test('honesty locks: L4 false; unrun≠PASS; DB NOT_APPLIED', () => {
  assert.equal(assertEp17LocksIntact(), true);
  assert.equal(EP17_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EP17_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EP17_LOCKS.UNRUN_BENCHMARK_IS_PASS, false);
  assert.equal(EP17_LOCKS.SKIP_CLASSICAL_BASELINES, false);
  assert.equal(EP17_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE, false);
  assert.equal(EP17_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(QUANT_LAB_AGENT_BOUNDS.mayMarkUnrunAsPass, false);
  assert.equal(QUANT_LAB_AGENT_BOUNDS.maySkipClassicalBaselines, false);
});

test('core flow + baseline families + promotion states encoded', () => {
  assert.deepEqual([...QUANT_BASELINE_LAB_FLOW], [
    'problem',
    'classical_baselines',
    'candidate_method',
    'same_data_test_conditions',
    'compare',
    'promote_or_reject',
  ]);
  assert.ok(CLASSICAL_BASELINE_FAMILIES.includes('greedy_heuristics'));
  assert.ok(CLASSICAL_BASELINE_FAMILIES.includes('linear_programming'));
  assert.ok(CLASSICAL_BASELINE_FAMILIES.includes('monte_carlo'));
  assert.ok(CLASSICAL_BASELINE_FAMILIES.includes('metaheuristics'));
  assert.ok(METAHEURISTIC_EXAMPLES.includes('simulated_annealing'));
  assert.ok(QUANT_EXPERIMENT_FIELDS.includes('problemId'));
  assert.ok(QUANT_EXPERIMENT_FIELDS.includes('reproducibility'));
  assert.deepEqual([...QUANT_PROMOTION_STATES], [
    'BASELINE_ONLY',
    'NO_MEASURED_ADVANTAGE',
    'TRADEOFF_IMPROVEMENT',
    'IMPROVED_CANDIDATE',
    'VERIFIED_CANDIDATE',
    'RESEARCH_ONLY',
  ]);
  assert.ok(EP17_MAY.includes('deny_unrun_benchmarks_as_pass'));
  assert.ok(EP17_MUST_NOT.includes('claim_quantum_advantage_without_evidence'));
});

test('unrun / skip baselines / unlike conditions denied', () => {
  assert.equal(attemptMarkUnrunAsPass().state, 'DENIED');
  assert.equal(attemptSkipClassicalBaselines().state, 'DENIED');
  assert.equal(attemptCompareUnlikeConditions().state, 'DENIED');

  const conditions = exampleConditions();
  assert.equal(
    runQuantBaselineExperiment({
      actor: agent,
      problemId: 'p-unrun',
      objective: 'x',
      constraints: [],
      baselineAlgorithm: 'greedy',
      baselineFamily: 'greedy_heuristics',
      candidateAlgorithm: 'c',
      baselineConditions: conditions,
      candidateConditions: conditions,
      baselineMetrics: exampleBaselineMetrics(),
      candidateMetrics: exampleImprovedCandidateMetrics(),
      benchmarkActuallyRun: false,
    }).state,
    'DENIED',
  );

  assert.equal(
    runQuantBaselineExperiment({
      actor: agent,
      problemId: 'p-unlike',
      objective: 'x',
      constraints: [],
      baselineAlgorithm: 'greedy',
      baselineFamily: 'greedy_heuristics',
      candidateAlgorithm: 'c',
      baselineConditions: conditions,
      candidateConditions: exampleConditions({ randomSeed: 99 }),
      baselineMetrics: exampleBaselineMetrics(),
      candidateMetrics: exampleImprovedCandidateMetrics(),
    }).state,
    'DENIED',
  );
});

test('explicit tradeoffs: latency better + cost worse → TRADEOFF_IMPROVEMENT', () => {
  const tradeoffs = reportExplicitQuantTradeoffs(
    exampleBaselineMetrics(),
    exampleTradeoffCandidateMetrics(),
  );
  assert.ok(
    tradeoffs.some((t) => t.axis === 'latency' && t.direction === 'better'),
  );
  assert.ok(
    tradeoffs.some((t) => t.axis === 'cost_energy' && t.direction === 'worse'),
  );
  assert.equal(attemptHideTradeoffs().state, 'DENIED');

  const conditions = exampleConditions();
  const exp = runQuantBaselineExperiment({
    actor: agent,
    problemId: 'p-trade',
    objective: 'lower latency',
    constraints: ['budget'],
    baselineAlgorithm: 'weighted_scoring',
    baselineFamily: 'weighted_scoring',
    candidateAlgorithm: 'metaheuristic_sa',
    baselineConditions: conditions,
    candidateConditions: conditions,
    baselineMetrics: exampleBaselineMetrics(),
    candidateMetrics: exampleTradeoffCandidateMetrics(),
    evidenceRefs: ['ev-1'],
  });
  assert.ok(!('denied' in exp));
  assert.ok(exp.tradeoffs.length >= 4);

  const review = reviewQuantExperiment({
    actor: reviewer,
    reviewId: 'r-trade',
    experiment: exp,
  });
  assert.ok(!('denied' in review));
  assert.equal(review.promotionState, 'TRADEOFF_IMPROVEMENT');
  assert.match(review.tradeoffStatement, /Explicit tradeoffs/i);
  assert.equal(review.productionApplied, false);
});

test('IMPROVED_CANDIDATE under same conditions; quantum claims denied', () => {
  const conditions = exampleConditions();
  const exp = runQuantBaselineExperiment({
    actor: agent,
    problemId: 'p-imp',
    objective: 'min latency',
    constraints: [],
    baselineAlgorithm: 'greedy',
    baselineFamily: 'greedy_heuristics',
    candidateAlgorithm: 'graph_algorithms',
    baselineConditions: conditions,
    candidateConditions: conditions,
    baselineMetrics: exampleBaselineMetrics(),
    candidateMetrics: exampleImprovedCandidateMetrics(),
    evidenceRefs: ['ev-b', 'ev-c'],
  });
  assert.ok(!('denied' in exp));
  assert.equal(exp.sameDataAndConditions, true);
  assert.equal(exp.benchmarkRun, true);

  const review = reviewQuantExperiment({
    actor: reviewer,
    reviewId: 'r-imp',
    experiment: exp,
  });
  assert.ok(!('denied' in review));
  assert.equal(review.promotionState, 'IMPROVED_CANDIDATE');

  assert.equal(attemptQuantumAdvantageWithoutEvidence().state, 'DENIED');
  assert.equal(attemptSkipLabForQuantumInspired().state, 'DENIED');
  assert.equal(
    runQuantBaselineExperiment({
      actor: agent,
      problemId: 'p-qa',
      objective: 'x',
      constraints: [],
      baselineAlgorithm: 'greedy',
      baselineFamily: 'greedy_heuristics',
      candidateAlgorithm: 'qi',
      baselineConditions: conditions,
      candidateConditions: conditions,
      baselineMetrics: exampleBaselineMetrics(),
      candidateMetrics: exampleImprovedCandidateMetrics(),
      quantumInspired: true,
      claimText: 'quantum-powered efficiency',
      evidenceRefs: [],
      attemptQuantumAdvantageWithoutEvidence: true,
    }).state,
    'DENIED',
  );

  const qi = runQuantBaselineExperiment({
    actor: agent,
    problemId: 'p-qi',
    objective: 'x',
    constraints: [],
    baselineAlgorithm: 'monte_carlo',
    baselineFamily: 'monte_carlo',
    candidateAlgorithm: 'qi-scheduler',
    baselineConditions: conditions,
    candidateConditions: conditions,
    baselineMetrics: exampleBaselineMetrics(),
    candidateMetrics: exampleImprovedCandidateMetrics(),
    quantumInspired: true,
    evidenceRefs: ['ev-qi'],
  });
  assert.ok(!('denied' in qi));
  const qiReview = reviewQuantExperiment({
    actor: reviewer,
    reviewId: 'r-qi',
    experiment: qi,
  });
  assert.ok(!('denied' in qiReview));
  assert.equal(qiReview.promotionState, 'RESEARCH_ONLY');
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapClassicalQuantBaselineLab(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.baselineFamilies.length, CLASSICAL_BASELINE_FAMILIES.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 160);

  const soft = ep17SoftWireSnapshot(repoRoot);
  assert.equal(soft.ep16NoOverclockBiosRule.present, true);
  assert.equal(soft.ep15AlgorithmTuningSandbox.present, true);
  assert.equal(soft.ep14AdaptiveBenchmarkLedger.present, true);
  assert.equal(soft.ep12Scheduler.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(attemptAutoPromoteToProduction().state, 'DENIED');

  const ev = returnQuantLabEvidenceToHomeBase({
    evidenceId: 'ev-ep17-1',
    actor: agent,
    summary: 'quant lab advisory',
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

  const cycle = runClassicalQuantBaselineLabCycle({
    actor: agent,
    reviewer,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, CLASSICAL_QUANT_BASELINE_LAB_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of CLASSICAL_QUANT_BASELINE_LAB_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.ok(!('denied' in cycle.experiment));
  assert.ok(!('denied' in cycle.review));
  assert.equal(cycle.review.promotionState, 'IMPROVED_CANDIDATE');
});
