/**
 * 62L-ES28 — Workflow Graph Optimizer denial + honesty tests.
 *
 * Script: npm run test:62les28
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ES28_AGENT_BOUNDS,
  ES28_DB_CANDIDATES_STATUS,
  ES28_LOCKS,
  ES28_MAY,
  ES28_MUST_NOT,
  ES_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  MANDATORY_PRESERVED_CHECKS,
  NEXT_PHASE_TITLE,
  OPTIMIZATION_EVALUATE_DIMENSIONS,
  OPTIMIZATION_RESULT_STATES,
  OPTIMIZATION_TRACKING_FIELDS,
  WORKFLOW_GRAPH_OPTIMIZER_CORE_FLOW,
  WORKFLOW_GRAPH_OPTIMIZER_CYCLE,
  WORKFLOW_GRAPH_OPTIMIZER_TRUTH_BOUNDARY,
  assertEs28LocksIntact,
  es28SoftWireSnapshot,
  missingMandatoryChecks,
  type Es28Actor,
  type WorkflowGraph,
} from './workflow-graph-optimizer-types.ts';

import {
  attemptBudgetIncrease,
  attemptPermissionExpansion,
  attemptPromoteWithoutSandbox,
  attemptQuantumWithoutClassicalBaseline,
  attemptRecommendAsAct,
  attemptReviewBypass,
  attemptSelfDeployToProduction,
  attemptStripApprovalGates,
  attemptStripEvidenceProvenanceChecks,
  attemptStripGuardianPolicyChecks,
  attemptStripHumanAuthorization,
  attemptStripSecurityReview,
  attemptStripTenantUniverseChecks,
  bootstrapWorkflowGraphOptimizer,
  classifyResult,
  evaluatorReview,
  exampleDuplicateResearchWorkflow,
  measureWorkflowMetrics,
  probeGuardianRlsTenantUniverseIsolation,
  proposeOptimizationCandidate,
  requireHumanApproval,
  returnOptimizationEvidenceToHomeBase,
  runSandboxComparison,
  runWorkflowGraphOptimizerCycle,
} from './workflow-graph-optimizer-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Es28Actor = {
  kind: 'workflow_graph_optimizer',
  id: 'wgo-1',
  orgId: 'org-es28',
  tenantId: 'ten-es28',
  universeId: 'uni-es28',
  permissions: ['draft'],
};

const evaluator: Es28Actor = {
  kind: 'evaluator',
  id: 'eval-1',
  orgId: 'org-es28',
  tenantId: 'ten-es28',
  universeId: 'uni-es28',
  permissions: ['review'],
};

const human: Es28Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-es28',
  tenantId: 'ten-es28',
  universeId: 'uni-es28',
  permissions: ['approve_consequential'],
};

test('SoT label ES28; Workflow Graph Optimizer; next ES29 Multi-Agent Reliability', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES28');
  assert.equal(GITHUB_SOT_ISSUE, null);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ES');
  assert.match(GITHUB_SOT_TITLE, /Workflow Graph Optimizer/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ES29/);
  assert.match(NEXT_PHASE_TITLE, /Multi-Agent Reliability/);
  assert.match(ES_LAYER_TITLE, /Graph Optimization/);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('honesty locks: L4 false; mandatory checks preserved; no self-deploy; DB NOT_APPLIED', () => {
  assert.equal(assertEs28LocksIntact(), true);
  assert.equal(ES28_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ES28_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ES28_LOCKS.STRIP_GUARDIAN_POLICY_CHECKS, false);
  assert.equal(ES28_LOCKS.STRIP_APPROVAL_GATES, false);
  assert.equal(ES28_LOCKS.PROMOTE_WITHOUT_SANDBOX, false);
  assert.equal(ES28_LOCKS.SELF_DEPLOY_TO_PRODUCTION, false);
  assert.equal(ES28_LOCKS.PERMISSION_EXPANSION, false);
  assert.equal(ES28_LOCKS.BUDGET_INCREASE, false);
  assert.equal(ES28_LOCKS.REVIEW_BYPASS, false);
  assert.equal(ES28_LOCKS.QUANTUM_WITHOUT_CLASSICAL_BASELINE, false);
  assert.equal(ES28_LOCKS.TIP_LAND, false);
  assert.equal(ES28_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(ES28_AGENT_BOUNDS.automaticAuthority, false);
  assert.equal(ES28_AGENT_BOUNDS.mayStripApprovalGates, false);
  assert.equal(
    WORKFLOW_GRAPH_OPTIMIZER_TRUTH_BOUNDARY.sandboxRequiredBeforePromote,
    true,
  );
  assert.equal(
    WORKFLOW_GRAPH_OPTIMIZER_TRUTH_BOUNDARY.quantumMustBeatOrJustifyClassicalBaseline,
    true,
  );
  assert.ok(ES28_MAY.length > 0);
  assert.ok(ES28_MUST_NOT.includes('strip_guardian_policy_checks'));
  assert.equal(OPTIMIZATION_RESULT_STATES.length, 8);
  assert.equal(MANDATORY_PRESERVED_CHECKS.length, 6);
  assert.equal(OPTIMIZATION_EVALUATE_DIMENSIONS.length, 14);
  assert.equal(OPTIMIZATION_TRACKING_FIELDS.length, 15);
  assert.equal(WORKFLOW_GRAPH_OPTIMIZER_CORE_FLOW[0], 'existing_workflow');
  assert.equal(
    WORKFLOW_GRAPH_OPTIMIZER_CORE_FLOW.at(-1),
    'improved_workflow_candidate',
  );
  assert.ok(WORKFLOW_GRAPH_OPTIMIZER_CYCLE.length >= 30);
});

test('cannot strip Guardian/approvals/tenant/evidence/security/human auth', () => {
  assert.equal(attemptStripGuardianPolicyChecks().state, 'DENIED');
  assert.equal(attemptStripApprovalGates().state, 'DENIED');
  assert.equal(attemptStripTenantUniverseChecks().state, 'DENIED');
  assert.equal(attemptStripEvidenceProvenanceChecks().state, 'DENIED');
  assert.equal(attemptStripSecurityReview().state, 'DENIED');
  assert.equal(attemptStripHumanAuthorization().state, 'DENIED');

  const baseline = exampleDuplicateResearchWorkflow();
  for (const flag of [
    'attemptStripGuardian',
    'attemptStripApprovals',
    'attemptStripTenantUniverse',
    'attemptStripEvidence',
    'attemptStripSecurity',
    'attemptStripHumanAuth',
  ] as const) {
    const denied = proposeOptimizationCandidate({
      actor: agent,
      baseline,
      candidateVersion: 'bad',
      [flag]: true,
    });
    assert.equal(denied.state, 'DENIED');
  }
});

test('sandbox required before promote; REGRESSED when safety/correctness drop', () => {
  assert.equal(attemptPromoteWithoutSandbox().state, 'SANDBOX_REQUIRED');

  const baseline = exampleDuplicateResearchWorkflow();
  const candidate = proposeOptimizationCandidate({
    actor: agent,
    baseline,
    candidateVersion: 'wf-v2',
    shareDuplicateResearch: true,
    parallelizeIndependentAnalysis: true,
  });
  assert.ok(!('denied' in candidate));

  const noSandbox = evaluatorReview({
    actor: evaluator,
    optimizationId: 'opt-1',
    compositionId: baseline.compositionId,
    baseline,
    candidate,
    sandbox: null,
    expectedBenefit: 'dedupe',
    attemptPromoteWithoutSandbox: true,
  });
  assert.equal(noSandbox.state, 'SANDBOX_REQUIRED');

  const sandboxOk = runSandboxComparison({
    actor: agent,
    optimizationId: 'opt-2',
    comparisonId: 'cmp-2',
    baseline,
    candidate,
  });
  assert.ok(!('denied' in sandboxOk));

  const sandboxBad = runSandboxComparison({
    actor: agent,
    optimizationId: 'opt-3',
    comparisonId: 'cmp-3',
    baseline,
    candidate,
    correctnessAtLeastBaseline: false,
    safetyAtLeastBaseline: false,
  });
  assert.ok(!('denied' in sandboxBad));
  assert.equal(sandboxBad.resultHint, 'REGRESSED');

  const regressed = evaluatorReview({
    actor: evaluator,
    optimizationId: 'opt-3',
    compositionId: baseline.compositionId,
    baseline,
    candidate,
    sandbox: sandboxBad,
    expectedBenefit: 'unsafe',
    classicalBaselineCompared: true,
  });
  assert.ok(!('denied' in regressed));
  assert.equal(regressed.resultState, 'REGRESSED');
  assert.equal(regressed.regressionState, 'confirmed');
});

test('quantum-inspired needs classical graph/OR baseline; L4 false', () => {
  assert.equal(attemptQuantumWithoutClassicalBaseline().state, 'DENIED');
  assert.equal(ES28_LOCKS.L4_AUTONOMY_ENABLED, false);

  const baseline = exampleDuplicateResearchWorkflow();
  const candidate = proposeOptimizationCandidate({
    actor: agent,
    baseline,
    candidateVersion: 'wf-qi',
    shareDuplicateResearch: true,
  });
  assert.ok(!('denied' in candidate));
  const sandbox = runSandboxComparison({
    actor: agent,
    optimizationId: 'opt-qi',
    comparisonId: 'cmp-qi',
    baseline,
    candidate,
  });
  assert.ok(!('denied' in sandbox));

  const denied = evaluatorReview({
    actor: evaluator,
    optimizationId: 'opt-qi',
    compositionId: baseline.compositionId,
    baseline,
    candidate,
    sandbox,
    expectedBenefit: 'qi schedule',
    quantumLabel: 'QUANTUM_INSPIRED',
    classicalBaselineCompared: false,
  });
  assert.equal(denied.state, 'DENIED');

  const ok = evaluatorReview({
    actor: evaluator,
    optimizationId: 'opt-qi-2',
    compositionId: baseline.compositionId,
    baseline,
    candidate,
    sandbox,
    expectedBenefit: 'qi vs classical OR',
    quantumLabel: 'QUANTUM_INSPIRED',
    classicalBaselineCompared: true,
  });
  assert.ok(!('denied' in ok));
  assert.equal(ok.l4AutonomyEnabled, false);
  assert.equal(ok.productionDeployed, false);
  assert.equal(ok.quantumLabel, 'QUANTUM_INSPIRED');
  assert.equal(ok.classicalBaselineCompared, true);
});

test('shared retrieval + parallel analysis preserves mandatory checks; improves latency/cost', () => {
  const baseline = exampleDuplicateResearchWorkflow();
  assert.equal(missingMandatoryChecks(baseline).length, 0);

  const baselineMetrics = measureWorkflowMetrics(baseline);
  const candidate = proposeOptimizationCandidate({
    actor: agent,
    baseline,
    candidateVersion: 'wf-v2-shared-parallel',
    shareDuplicateResearch: true,
    parallelizeIndependentAnalysis: true,
    removeWastedCacheMisses: true,
  });
  assert.ok(!('denied' in candidate));
  assert.equal(missingMandatoryChecks(candidate).length, 0);
  assert.ok(candidate.nodes.some((n) => n.id === 'shared-retrieval'));
  assert.ok(candidate.nodes.every((n) => !n.kind.startsWith('x')));
  for (const id of baseline.mandatoryCheckIds) {
    assert.ok(candidate.nodes.some((n) => n.id === id));
  }
  assert.deepEqual(
    [...candidate.approvalCheckpointIds],
    [...baseline.approvalCheckpointIds],
  );

  const candidateMetrics = measureWorkflowMetrics(candidate);
  assert.ok(candidateMetrics.totalCost < baselineMetrics.totalCost);
  assert.ok(
    candidateMetrics.duplicateResearchCount <
      baselineMetrics.duplicateResearchCount,
  );

  const sandbox = runSandboxComparison({
    actor: agent,
    optimizationId: 'opt-demo',
    comparisonId: 'cmp-demo',
    baseline,
    candidate,
  });
  assert.ok(!('denied' in sandbox));
  assert.ok(sandbox.correctnessAtLeastBaseline);
  assert.ok(sandbox.safetyAtLeastBaseline);

  const run = evaluatorReview({
    actor: evaluator,
    optimizationId: 'opt-demo',
    compositionId: baseline.compositionId,
    baseline,
    candidate,
    sandbox,
    expectedBenefit: 'shared retrieval + parallel domain analysis',
    testRefs: ['phase62les28.test.ts'],
    classicalBaselineCompared: true,
  });
  assert.ok(!('denied' in run));
  assert.ok(
    [
      'LOWER_LATENCY',
      'LOWER_COST',
      'BETTER_MULTI_OBJECTIVE_TRADEOFF',
      'BETTER_RELIABILITY',
      'BETTER_EVIDENCE',
      'NO_ADVANTAGE',
    ].includes(run.resultState),
  );
  assert.notEqual(run.resultState, 'REGRESSED');
  assert.equal(run.mandatoryChecksPreserved, true);
  assert.equal(run.permissionsExpanded, false);
  assert.equal(run.budgetIncreased, false);
  assert.equal(run.reviewBypassed, false);

  const home = returnOptimizationEvidenceToHomeBase({ run });
  assert.equal(home.productionAuthorized, false);
  assert.equal(requireHumanApproval(human), true);
  assert.equal(requireHumanApproval(agent).state, 'DENIED');
});

test('governance denies + soft-wires WAITING_DATA ok; cycle bootstrap', () => {
  assert.equal(attemptSelfDeployToProduction().state, 'DENIED');
  assert.equal(attemptPermissionExpansion().state, 'DENIED');
  assert.equal(attemptBudgetIncrease().state, 'DENIED');
  assert.equal(attemptReviewBypass().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.deepEqual(probeGuardianRlsTenantUniverseIsolation(), {
    unchanged: true,
    bypassDenied: true,
  });

  const soft = es28SoftWireSnapshot(repoRoot);
  // Presence ≠ VERIFIED; absent → WAITING_DATA (not FAIL)
  for (const p of [
    soft.es27CapabilityComposition,
    soft.es26Marketplace,
    soft.es23Experiments,
    soft.es9RegressionGate,
    soft.er7HistoricalAtlas,
    soft.ep18QuantumInspiredLab,
  ]) {
    assert.equal(typeof p.present, 'boolean');
    assert.ok(p.pathChecked.length > 0);
    assert.ok(p.note.length > 0);
  }

  const boot = bootstrapWorkflowGraphOptimizer(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.l4AutonomyEnabled, false);
  assert.equal(boot.tipLand, false);
  assert.equal(boot.managePullRequest, false);
  assert.equal(boot.dbCandidatesStatus, 'NOT_APPLIED');
  const waitingOrPass = boot.hops.filter((h) =>
    h.hop.endsWith('_soft_wire'),
  );
  for (const h of waitingOrPass) {
    assert.ok(h.state === 'PASS' || h.state === 'WAITING_DATA');
    assert.notEqual(h.state, 'FAIL');
  }

  const cycle = runWorkflowGraphOptimizerCycle({ repoRoot, actor: agent });
  assert.ok(cycle.run.sandboxCompared);
  assert.equal(cycle.run.l4AutonomyEnabled, false);

  // classifyResult sanity
  const base = measureWorkflowMetrics(exampleDuplicateResearchWorkflow());
  assert.equal(
    classifyResult(base, {
      ...base,
      totalLatencyMs: base.totalLatencyMs * 2,
      totalCost: base.totalCost * 2,
      reliability: base.reliability - 0.1,
      evidenceQuality: base.evidenceQuality - 0.1,
    }),
    'REGRESSED',
  );

  void (null as unknown as WorkflowGraph);
});
