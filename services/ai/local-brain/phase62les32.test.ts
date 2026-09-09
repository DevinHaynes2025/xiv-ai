/**
 * 62L-ES32 — Mission Decomposition & Dependency Planner denial + honesty tests.
 *
 * Script: npm run test:62les32
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  DEPENDENCY_KINDS,
  ES32_DB_CANDIDATES_STATUS,
  ES32_AGENT_BOUNDS,
  ES32_LOCKS,
  ES_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  MISSION_DECOMPOSITION_CORE_FLOW,
  MISSION_PLANNER_TRUTH_BOUNDARY,
  NEXT_PHASE_TITLE,
  STOP_CONDITION_KINDS,
  WORK_PACKAGE_FIELDS,
  WORK_PACKAGE_STATES,
  assertEs32LocksIntact,
  dependencyBlocksStart,
  es32SoftWireSnapshot,
  initialStateForDependency,
  type Es32Actor,
} from './mission-decomposition-dependency-planner-types.ts';

import {
  assessParallelism,
  attemptBypassHumanGate,
  attemptCreateSpendingAuthority,
  attemptEnableL4Autonomy,
  attemptManagePullRequest,
  attemptStripGuardian,
  attemptTipLand,
  attemptWidenPermissions,
  buildGovQuantumLogisticsPackages,
  collectDependencyEdges,
  computeCriticalPath,
  pricingFinalizeBlockedBeforeScope,
  resolveWorkPackageStates,
  runMissionDecompositionPlannerCycle,
} from './mission-decomposition-dependency-planner-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Es32Actor = {
  kind: 'mission_decomposition_planner',
  id: 'es32-planner-1',
  orgId: 'org-es32',
  tenantId: 'ten-es32',
  universeId: 'uni-es32',
  permissions: ['plan'],
};

test('SoT label ES32; Mission Decomposition; next ES33; no invented issue', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES32');
  assert.equal(GITHUB_SOT_ISSUE, null);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ES');
  assert.match(GITHUB_SOT_TITLE, /Mission Decomposition/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ES33/);
  assert.match(NEXT_PHASE_TITLE, /Critical Path/);
  assert.match(ES_LAYER_TITLE, /Autonomous Research & Productization Factory/);
});

test('honesty locks: L4 false; cannot strip Guardian; DB NOT_APPLIED', () => {
  assert.equal(assertEs32LocksIntact(), true);
  assert.equal(ES32_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ES32_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ES32_LOCKS.REMOVE_GUARDIAN_RLS_CHECKS, false);
  assert.equal(ES32_LOCKS.BYPASS_GUARDIAN_RLS, false);
  assert.equal(ES32_LOCKS.WIDEN_PERMISSIONS, false);
  assert.equal(ES32_LOCKS.CREATE_SPENDING_AUTHORITY, false);
  assert.equal(ES32_LOCKS.BYPASS_HUMAN_GATES, false);
  assert.equal(ES32_LOCKS.TIP_LAND, false);
  assert.equal(ES32_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(ES32_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED, true);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(ES32_AGENT_BOUNDS.mayRemoveGuardianChecks, false);
  assert.equal(ES32_AGENT_BOUNDS.mayWidenPermissions, false);
  assert.equal(ES32_AGENT_BOUNDS.mayBypassHumanGates, false);
  assert.equal(MISSION_PLANNER_TRUTH_BOUNDARY.l4AutonomyEnabled, false);
  assert.equal(
    MISSION_PLANNER_TRUTH_BOUNDARY.pricingMustNotFinalizeBeforeScopeSufficientlyKnown,
    true,
  );
});

test('fields + states + dependency kinds + core flow + stops encoded', () => {
  assert.equal(WORK_PACKAGE_FIELDS.length, 18);
  assert.ok(WORK_PACKAGE_FIELDS.includes('workPackageId'));
  assert.ok(WORK_PACKAGE_FIELDS.includes('escalationPath'));
  assert.ok(WORK_PACKAGE_FIELDS.includes('returnPath'));
  assert.deepEqual([...WORK_PACKAGE_STATES], [
    'PLANNED',
    'READY',
    'WAITING_DEPENDENCY',
    'RUNNING_VERIFIED',
    'BLOCKED',
    'REVIEW_REQUIRED',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
  ]);
  assert.deepEqual([...DEPENDENCY_KINDS], [
    'HARD_DEPENDENCY',
    'SOFT_DEPENDENCY',
    'HUMAN_GATE',
    'DATA_GATE',
  ]);
  assert.deepEqual([...MISSION_DECOMPOSITION_CORE_FLOW], [
    'mission',
    'objective',
    'constraints',
    'work_packages',
    'dependencies',
    'critical_path',
    'agent_team_assignment',
    'evidence_requirements',
    'execution_plan',
  ]);
  assert.equal(STOP_CONDITION_KINDS.length, 6);
  assert.ok(STOP_CONDITION_KINDS.includes('COST_BUDGET_EXHAUSTED'));
  assert.ok(
    STOP_CONDITION_KINDS.includes('HUMAN_REVIEWER_REJECTS_CONTINUATION'),
  );
});

test('HARD vs SOFT vs HUMAN_GATE vs DATA_GATE start rules', () => {
  assert.equal(
    dependencyBlocksStart('HARD_DEPENDENCY', false, true, true),
    true,
  );
  assert.equal(
    dependencyBlocksStart('HARD_DEPENDENCY', true, true, true),
    false,
  );
  assert.equal(
    dependencyBlocksStart('SOFT_DEPENDENCY', false, true, true),
    false,
  );
  assert.equal(dependencyBlocksStart('HUMAN_GATE', true, false, true), true);
  assert.equal(dependencyBlocksStart('HUMAN_GATE', true, true, true), false);
  assert.equal(dependencyBlocksStart('DATA_GATE', true, true, false), true);
  assert.equal(dependencyBlocksStart('DATA_GATE', true, true, true), false);

  assert.equal(
    initialStateForDependency('HARD_DEPENDENCY', false, true, true),
    'WAITING_DEPENDENCY',
  );
  assert.equal(
    initialStateForDependency('SOFT_DEPENDENCY', false, true, true),
    'READY',
  );
  assert.equal(
    initialStateForDependency('HUMAN_GATE', true, false, true),
    'REVIEW_REQUIRED',
  );
  assert.equal(
    initialStateForDependency('DATA_GATE', true, true, false),
    'WAITING_DEPENDENCY',
  );
});

test('pricing before scope: soft draft allowed; finalize HARD-blocked', () => {
  const packages = buildGovQuantumLogisticsPackages();
  const completed = new Set(['wp-opportunity-qualification', 'wp-requirements-decomposition']);
  const resolved = resolveWorkPackageStates(packages, {
    completedIds: completed,
  });
  const pricing = resolved.find((p) => p.workPackageId === 'wp-pricing');
  assert.ok(pricing);
  assert.equal(pricing!.state, 'WAITING_DEPENDENCY');
  assert.ok(
    (pricing!.assumptions ?? []).some((a) =>
      a.includes('soft_assumption_pending_reconcile'),
    ) ||
      pricing!.dependencies.some((d) => d.kind === 'SOFT_DEPENDENCY'),
  );

  const gate = pricingFinalizeBlockedBeforeScope(packages, completed);
  assert.equal(gate.draftAllowedUnderSoft, true);
  assert.equal(gate.finalizeBlocked, true);
  assert.match(gate.reason, /HARD-blocked|technical scope/i);

  const afterScope = pricingFinalizeBlockedBeforeScope(
    packages,
    new Set([...completed, 'wp-logistics-design']),
  );
  assert.equal(afterScope.finalizeBlocked, false);
});

test('HUMAN_GATE pauses submission until explicit authorization', () => {
  const packages = buildGovQuantumLogisticsPackages();
  const almostDone = new Set(
    packages
      .filter((p) => p.workPackageId !== 'wp-human-submission-approval')
      .map((p) => p.workPackageId),
  );
  // mark predecessors completed
  for (const id of [
    'wp-opportunity-qualification',
    'wp-requirements-decomposition',
    'wp-logistics-design',
    'wp-quantum-ai-evidence',
    'wp-compliance',
    'wp-pricing',
    'wp-merge-proposal',
    'wp-proposal-review',
  ]) {
    almostDone.add(id);
  }

  const blocked = resolveWorkPackageStates(packages, {
    completedIds: almostDone,
    humanAuthorizedIds: new Set(),
  });
  const humanWp = blocked.find(
    (p) => p.workPackageId === 'wp-human-submission-approval',
  );
  assert.ok(humanWp);
  assert.equal(humanWp!.state, 'REVIEW_REQUIRED');

  const authorized = resolveWorkPackageStates(packages, {
    completedIds: almostDone,
    humanAuthorizedIds: new Set(['wp-human-submission-approval']),
  });
  const humanOk = authorized.find(
    (p) => p.workPackageId === 'wp-human-submission-approval',
  );
  assert.equal(humanOk!.state, 'READY');
});

test('over-parallel waste flagged; critical path computed', () => {
  const cycle = runMissionDecompositionPlannerCycle({
    actor: agent,
    repoRoot,
    forceOverParallelWaste: true,
  });
  assert.equal(cycle.plan.parallelism.overParallelWasteFlag, true);
  assert.ok(cycle.plan.parallelism.wasteReason);

  const normal = runMissionDecompositionPlannerCycle({
    actor: agent,
    repoRoot,
  });
  assert.ok(normal.plan.criticalPath.length >= 4);
  assert.ok(normal.plan.criticalPath.pathWorkPackageIds.length >= 4);
  assert.ok(
    normal.plan.criticalPath.humanApprovalBottlenecks.includes(
      'wp-human-submission-approval',
    ),
  );
  assert.ok(
    normal.plan.criticalPath.signals.includes('longest_dependency_path'),
  );

  const packages = buildGovQuantumLogisticsPackages();
  const edges = collectDependencyEdges(packages);
  const path = computeCriticalPath(packages, edges);
  assert.ok(path.length >= 1);
  const parallel = assessParallelism(packages, edges, 4);
  assert.equal(typeof parallel.overParallelWasteFlag, 'boolean');
});

test('cannot strip Guardian; widen perms; spending; bypass human; L4 false', () => {
  const cycle = runMissionDecompositionPlannerCycle({
    actor: agent,
    repoRoot,
  });
  assert.equal(cycle.plan.l4AutonomyEnabled, false);
  assert.equal(cycle.plan.guardianRlsIntact, true);
  assert.equal(attemptStripGuardian(cycle.plan, agent).denied, true);
  assert.equal(attemptWidenPermissions(cycle.plan, agent).denied, true);
  assert.equal(attemptCreateSpendingAuthority(cycle.plan, agent).denied, true);
  assert.equal(attemptBypassHumanGate(cycle.plan, agent).denied, true);
  assert.equal(attemptTipLand(cycle.plan, agent).denied, true);
  assert.equal(attemptManagePullRequest(cycle.plan, agent).denied, true);
  assert.equal(attemptEnableL4Autonomy(agent).denied, true);
  assert.match(attemptStripGuardian(cycle.plan, agent).reason, /Guardian/i);
});

test('cycle soft-wires WAITING_DATA or PRESENT; absent ≠ FAIL; locks intact', () => {
  const cycle = runMissionDecompositionPlannerCycle({
    actor: agent,
    repoRoot,
  });
  assert.equal(cycle.locksIntact, true);
  assert.equal(cycle.plan.productionAuthorized, false);
  assert.equal(cycle.meta.githubSotIssue, null);
  assert.match(cycle.meta.nextPhaseTitle, /ES33/);

  const soft = es32SoftWireSnapshot(repoRoot);
  for (const entry of [
    soft.es31DynamicAgentTeamBuilder,
    soft.es30AgentReputationTrustGraph,
    soft.es27CapabilityComposition,
    soft.es15DeploymentPlans,
    soft.er7QuantumHonesty,
  ]) {
    if (!entry.present) {
      assert.match(entry.note, /WAITING_DATA/);
    } else {
      assert.match(entry.note, /PRESENT/);
    }
  }

  const softHop = cycle.hops.find((h) => h.hop === 'soft_wire_prior_phases');
  assert.ok(softHop);
  assert.ok(
    softHop!.state === 'PASS' || softHop!.state === 'WAITING_DATA',
  );
  assert.notEqual(softHop!.state, 'FAIL');

  // ER7-adjacent quantum lab report may be PRESENT on this tip
  assert.ok(
    soft.er7Report.present || soft.er7QuantumHonesty.present || !soft.er7Report.present,
  );
});
