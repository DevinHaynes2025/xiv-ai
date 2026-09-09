/**
 * 62L-ES7 — Executable Implementation Plan Generator denial + honesty tests.
 *
 * Script: npm run test:62les7
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  BRANCH_LIFECYCLE,
  DEPENDENCY_GATE_CHECKS,
  ES7_AGENT_BOUNDS,
  ES7_DB_CANDIDATES_STATUS,
  ES7_LOCKS,
  ES7_MAY,
  ES7_MIGRATION_DEFAULT_STATUS,
  ES7_MUST_NOT,
  ES_LAYER_TITLE,
  EVIDENCE_PACKAGE_FIELDS,
  EXECUTABLE_IMPLEMENTATION_CORE_FLOW,
  EXECUTABLE_IMPLEMENTATION_PLAN_GENERATOR_CYCLE,
  EXECUTABLE_IMPLEMENTATION_TRUTH_BOUNDARY,
  FILE_MAP_ENTRY_FIELDS,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_ISSUE_NOTE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  IMPLEMENTATION_PLAN_FIELDS,
  NEXT_PHASE_TITLE,
  STOP_CONDITIONS,
  assertEs7LocksIntact,
  defaultCommandStatus,
  es7SoftWireSnapshot,
  migrationIsAuthorized,
  softWireHopState,
  unrunIsNotSuccess,
  type Es7Actor,
} from './executable-implementation-plan-generator-types.ts';

import {
  attemptAutoOpenPr,
  attemptGuardianRlsWeaken,
  attemptMainMerge,
  attemptMigrationAsAuthorized,
  attemptRecommendAsAct,
  attemptTipLand,
  attemptUnrunAsSuccess,
  attachNewDependency,
  bootstrapExecutableImplementationPlanGenerator,
  escalateStopCondition,
  evaluateDependencyGate,
  exampleWorkloadRouterPlan,
  generateImplementationPlan,
  probeGuardianRlsTenantUniverseIsolation,
  recordCommandExecution,
  requireHumanApproval,
  runExecutableImplementationPlanGeneratorCycle,
} from './executable-implementation-plan-generator-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Es7Actor = {
  kind: 'implementation_plan_generator',
  id: 'ipg-1',
  orgId: 'org-es7',
  tenantId: 'ten-es7',
  universeId: 'uni-es7',
  permissions: ['draft'],
};

const human: Es7Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-es7',
  tenantId: 'ten-es7',
  universeId: 'uni-es7',
  permissions: ['approve_consequential'],
};

test('SoT label ES7; no invented issue; next ES8 code change orchestrator', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES7');
  assert.equal(GITHUB_SOT_ISSUE, null);
  assert.match(GITHUB_SOT_ISSUE_NOTE, /no issue number invented/i);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ES');
  assert.match(GITHUB_SOT_TITLE, /Executable Implementation Plan Generator/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ES8/);
  assert.match(NEXT_PHASE_TITLE, /Code Change & Branch Orchestrator/);
  assert.match(ES_LAYER_TITLE, /Productization Factory/);
});

test('honesty locks: L4 false; unrun≠success; migration≠authorized; no tip-land', () => {
  assert.equal(assertEs7LocksIntact(), true);
  assert.equal(ES7_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ES7_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ES7_MIGRATION_DEFAULT_STATUS, 'MIGRATION_CANDIDATE');
  assert.equal(ES7_LOCKS.UNRUN_COMMAND_EQ_SUCCESS, false);
  assert.equal(ES7_LOCKS.UNRUN_TEST_EQ_SUCCESS, false);
  assert.equal(ES7_LOCKS.NOT_TESTED_EQ_PASS, false);
  assert.equal(ES7_LOCKS.MIGRATION_CANDIDATE_EQ_AUTHORIZED, false);
  assert.equal(ES7_LOCKS.WEAKEN_GUARDIAN_RLS_FOR_PROTOTYPE, false);
  assert.equal(ES7_LOCKS.MAIN_MERGE_WITHOUT_AUTHORIZATION, false);
  assert.equal(ES7_LOCKS.TIP_LAND, false);
  assert.equal(ES7_LOCKS.AUTO_OPEN_PR, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(
    EXECUTABLE_IMPLEMENTATION_TRUTH_BOUNDARY.unrunCommandIsNotSuccess,
    true,
  );
  assert.equal(
    EXECUTABLE_IMPLEMENTATION_TRUTH_BOUNDARY.migrationCandidateIsNotAuthorized,
    true,
  );
  assert.equal(
    EXECUTABLE_IMPLEMENTATION_TRUTH_BOUNDARY.mayWeakenGuardianRlsForPrototype,
    false,
  );
  assert.equal(ES7_AGENT_BOUNDS.mayTreatUnrunAsSuccess, false);
  assert.equal(unrunIsNotSuccess('NOT_TESTED'), true);
  assert.equal(migrationIsAuthorized('MIGRATION_CANDIDATE'), false);
  assert.equal(defaultCommandStatus(), 'NOT_TESTED');
});

test('plan fields + core flow + file/command/branch/dep/migration/stop/evidence encoded', () => {
  assert.equal(IMPLEMENTATION_PLAN_FIELDS.length, 16);
  assert.ok(IMPLEMENTATION_PLAN_FIELDS.includes('implementationId'));
  assert.ok(IMPLEMENTATION_PLAN_FIELDS.includes('prototypeId'));
  assert.ok(IMPLEMENTATION_PLAN_FIELDS.includes('blockers'));
  assert.deepEqual([...EXECUTABLE_IMPLEMENTATION_CORE_FLOW], [
    'approved_prototype',
    'architecture',
    'acceptance_tests',
    'file_map',
    'branch_plan',
    'implementation_tasks',
    'verification',
    'review',
  ]);
  assert.deepEqual([...FILE_MAP_ENTRY_FIELDS], [
    'path',
    'purpose',
    'owner',
    'changeType',
    'testsAffected',
  ]);
  assert.deepEqual([...BRANCH_LIFECYCLE], [
    'feature_branch',
    'tests',
    'review',
    'draft_mr_pr',
  ]);
  assert.equal(DEPENDENCY_GATE_CHECKS.length, 5);
  assert.equal(STOP_CONDITIONS.length, 6);
  assert.equal(EVIDENCE_PACKAGE_FIELDS.length, 7);
  assert.ok(ES7_MAY.includes('label_commands_not_tested_until_executed'));
  assert.ok(ES7_MUST_NOT.includes('report_unrun_command_or_test_as_success'));
  assert.ok(
    EXECUTABLE_IMPLEMENTATION_PLAN_GENERATOR_CYCLE.includes(
      'deny_guardian_rls_weaken',
    ),
  );
});

test('unrun≠success; migration≠authorized; Guardian weaken denied; no main merge; L4 false', () => {
  assert.equal(attemptUnrunAsSuccess().state, 'DENIED');
  assert.equal(attemptMigrationAsAuthorized().state, 'DENIED');
  assert.equal(attemptGuardianRlsWeaken().state, 'DENIED');
  assert.equal(attemptMainMerge().state, 'DENIED');
  assert.equal(attemptTipLand().state, 'DENIED');
  assert.equal(attemptAutoOpenPr().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(ES7_LOCKS.L4_AUTONOMY_ENABLED, false);

  const deniedUnrun = generateImplementationPlan({
    actor: agent,
    prototypeId: 'proto-bad-unrun',
    fileMap: [
      {
        path: 'services/ai/local-runtime/workload-router.ts',
        purpose: 'add verified-device routing',
        owner: 'AI Runtime',
        changeType: 'update',
        testsAffected: ['workload-router.test.ts'],
      },
    ],
    owners: ['AI Runtime'],
    rollbackPlan: 'revert branch',
    treatUnrunAsSuccess: true,
  });
  assert.ok('denied' in deniedUnrun);

  const deniedMig = generateImplementationPlan({
    actor: agent,
    prototypeId: 'proto-bad-mig',
    fileMap: [
      {
        path: 'services/ai/local-runtime/workload-router.ts',
        purpose: 'add verified-device routing',
        owner: 'AI Runtime',
        changeType: 'update',
        testsAffected: ['workload-router.test.ts'],
      },
    ],
    owners: ['AI Runtime'],
    rollbackPlan: 'revert branch',
    authorizeMigration: true,
  });
  assert.ok('denied' in deniedMig);

  const deniedGuardian = generateImplementationPlan({
    actor: agent,
    prototypeId: 'proto-bad-guardian',
    fileMap: [
      {
        path: 'services/ai/local-runtime/workload-router.ts',
        purpose: 'add verified-device routing',
        owner: 'AI Runtime',
        changeType: 'update',
        testsAffected: ['workload-router.test.ts'],
      },
    ],
    owners: ['AI Runtime'],
    rollbackPlan: 'revert branch',
    weakenGuardianRls: true,
  });
  assert.ok('denied' in deniedGuardian);

  const deniedMain = generateImplementationPlan({
    actor: agent,
    prototypeId: 'proto-bad-main',
    fileMap: [
      {
        path: 'services/ai/local-runtime/workload-router.ts',
        purpose: 'add verified-device routing',
        owner: 'AI Runtime',
        changeType: 'update',
        testsAffected: ['workload-router.test.ts'],
      },
    ],
    owners: ['AI Runtime'],
    rollbackPlan: 'revert branch',
    mergeToMain: true,
  });
  assert.ok('denied' in deniedMain);

  const deniedTip = generateImplementationPlan({
    actor: agent,
    prototypeId: 'proto-bad-tip',
    fileMap: [
      {
        path: 'services/ai/local-runtime/workload-router.ts',
        purpose: 'add verified-device routing',
        owner: 'AI Runtime',
        changeType: 'update',
        testsAffected: ['workload-router.test.ts'],
      },
    ],
    owners: ['AI Runtime'],
    rollbackPlan: 'revert branch',
    tipLand: true,
  });
  assert.ok('denied' in deniedTip);

  const deniedTargetMain = generateImplementationPlan({
    actor: agent,
    prototypeId: 'proto-target-main',
    fileMap: [
      {
        path: 'services/ai/local-runtime/workload-router.ts',
        purpose: 'add verified-device routing',
        owner: 'AI Runtime',
        changeType: 'update',
        testsAffected: ['workload-router.test.ts'],
      },
    ],
    owners: ['AI Runtime'],
    rollbackPlan: 'revert branch',
    targetBranch: 'main',
  });
  assert.ok('denied' in deniedTargetMain);
});

test('example file map + NOT_TESTED commands + migration candidate + dependency gate', () => {
  const plan = exampleWorkloadRouterPlan(agent);
  assert.equal(plan.planOnly, true);
  assert.equal(plan.productionAuthorized, false);
  assert.equal(plan.l4AutonomyEnabled, false);
  assert.equal(plan.migrationAuthorized, false);
  assert.equal(plan.guardianRlsWeakened, false);
  assert.equal(plan.mainMergeAuthorized, false);
  assert.equal(plan.autoOpenPrAuthorized, false);

  const entry = plan.sourceFilesToCreateOrUpdate[0]!;
  assert.equal(
    entry.path,
    'services/ai/local-runtime/workload-router.ts',
  );
  assert.equal(entry.purpose, 'add verified-device routing');
  assert.equal(entry.owner, 'AI Runtime');
  assert.equal(entry.changeType, 'update');
  assert.deepEqual([...entry.testsAffected], ['workload-router.test.ts']);

  assert.ok(plan.commands.length >= 1);
  assert.equal(plan.commands[0]!.executed, false);
  assert.equal(plan.commands[0]!.testStatus, 'NOT_TESTED');

  assert.ok(plan.migrationsIfAny.length >= 1);
  assert.equal(plan.migrationsIfAny[0]!.status, 'MIGRATION_CANDIDATE');
  assert.equal(plan.migrationsIfAny[0]!.authorized, false);

  const badPass = generateImplementationPlan({
    actor: agent,
    prototypeId: 'proto-fake-pass',
    fileMap: [entry],
    owners: ['AI Runtime'],
    rollbackPlan: 'revert',
    commands: [
      {
        command: 'npm test',
        purpose: 'fake',
        testStatus: 'PASS',
        executed: false,
        resultSummary: 'lied',
      },
    ],
  });
  assert.ok('denied' in badPass);

  const gateDeny = evaluateDependencyGate({
    packageName: 'sketchy-pkg',
    existingDepSufficient: false,
    maintained: false,
    permissionsNetworkOk: true,
    licenseOk: true,
    supplyChainRiskAcceptable: true,
  });
  assert.ok(!('denied' in gateDeny));
  assert.equal(gateDeny.approved, false);

  const skip = evaluateDependencyGate({
    packageName: 'sketchy-pkg',
    existingDepSufficient: false,
    maintained: true,
    permissionsNetworkOk: true,
    licenseOk: true,
    supplyChainRiskAcceptable: true,
    skipGate: true,
  });
  assert.ok('denied' in skip);

  const gateOk = evaluateDependencyGate({
    packageName: 'well-maintained-pkg',
    existingDepSufficient: false,
    maintained: true,
    permissionsNetworkOk: true,
    licenseOk: true,
    supplyChainRiskAcceptable: true,
  });
  assert.ok(!('denied' in gateOk));
  assert.equal(gateOk.approved, true);
  const attached = attachNewDependency({ plan, gate: gateOk });
  assert.ok(!('denied' in attached));
  assert.ok(attached.dependencies.includes('well-maintained-pkg'));

  const recorded = recordCommandExecution({
    plan,
    command: plan.commands[0]!.command,
    testStatus: 'PASS',
    resultSummary: 'executed in unit harness — illustrative only',
  });
  assert.ok(!('denied' in recorded));
  assert.equal(recorded.commands[0]!.executed, true);
  assert.equal(recorded.commands[0]!.testStatus, 'PASS');

  const escalated = escalateStopCondition({
    condition: 'cost_exceeds_budget',
    detail: 'estimate exceeds approved envelope',
  });
  assert.equal(escalated.state, 'ESCALATED');
});

test('soft-wire ES6/ES5/ES4: presence≠VERIFIED; absent→WAITING_DATA; cycle + human gate', () => {
  const snap = es7SoftWireSnapshot(repoRoot);
  assert.equal(
    softWireHopState(snap.es6AcceptanceTestEvidence.present),
    snap.es6AcceptanceTestEvidence.present ? 'PASS' : 'WAITING_DATA',
  );
  assert.equal(
    softWireHopState(snap.es5PrototypeArchitectureComposer.present),
    snap.es5PrototypeArchitectureComposer.present ? 'PASS' : 'WAITING_DATA',
  );
  assert.equal(
    softWireHopState(snap.es4PrototypeScopeGenerator.present),
    snap.es4PrototypeScopeGenerator.present ? 'PASS' : 'WAITING_DATA',
  );

  // Prior ES tips may be absent in this environment — must not FAIL soft-wire.
  if (!snap.es6AcceptanceTestEvidence.present) {
    assert.equal(
      softWireHopState(false),
      'WAITING_DATA',
    );
  }

  const boot = bootstrapExecutableImplementationPlanGenerator({
    actor: agent,
    repoRoot,
  });
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.sot.issue, null);

  const cycle = runExecutableImplementationPlanGeneratorCycle({
    actor: agent,
    repoRoot,
  });
  assert.ok(cycle.hops.length >= 20);
  assert.equal(cycle.dbCandidates, 'NOT_APPLIED');
  assert.equal(cycle.plan.planOnly, true);

  const es6Hop = cycle.hops.find((h) => h.hop === 'es6_acceptance_tests_soft_wire');
  const es5Hop = cycle.hops.find((h) => h.hop === 'es5_architecture_soft_wire');
  const es4Hop = cycle.hops.find((h) => h.hop === 'es4_scope_soft_wire');
  assert.ok(es6Hop);
  assert.ok(es5Hop);
  assert.ok(es4Hop);
  assert.ok(
    es6Hop!.state === 'PASS' || es6Hop!.state === 'WAITING_DATA',
  );
  assert.notEqual(es6Hop!.state, 'FAIL');
  assert.notEqual(es5Hop!.state, 'FAIL');
  assert.notEqual(es4Hop!.state, 'FAIL');

  const isolation = probeGuardianRlsTenantUniverseIsolation();
  assert.equal(isolation.unchanged, true);
  assert.equal(isolation.l4, false);

  const blocked = requireHumanApproval({
    actor: agent,
    action: 'open_draft_mr',
  });
  assert.ok('denied' in blocked);

  const approved = requireHumanApproval({
    actor: human,
    action: 'open_draft_mr',
  });
  assert.ok(!('denied' in approved));
  assert.equal(approved.approved, true);
});
