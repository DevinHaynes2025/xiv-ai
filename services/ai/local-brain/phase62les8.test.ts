/**
 * 62L-ES8 — Code Change & Branch Orchestrator denial + honesty tests.
 *
 * Script: npm run test:62les8
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  CHANGE_ORCHESTRATOR_CYCLE,
  CHANGE_ORCHESTRATOR_STATES,
  CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY,
  DENIED_CHANGE_CLASSES,
  ES8_AGENT_BOUNDS,
  ES8_DB_CANDIDATES_STATUS,
  ES8_LOCKS,
  ES8_MAY,
  ES8_MUST_NOT,
  ES_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE_NOTE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PR_MR_STATES,
  TEST_BEFORE_REVIEW_GATE,
  TEST_RESULT_STATES,
  assertEs8LocksIntact,
  draftPrReadyAllowedWithoutGate,
  es8SoftWireSnapshot,
  mainMergeAllowed,
  notTestedMeansPass,
  softWireHopState,
  testGateSatisfied,
  type Es8Actor,
} from './code-change-branch-orchestrator-types.ts';

import {
  applyBoundedChanges,
  attemptEnableL4,
  attemptMergeToMain,
  attemptProductionDeploy,
  attemptTipLand,
  attemptTreatNotTestedAsPass,
  createFeatureBranch,
  markDraftPrReady,
  planChangeRun,
  probeGuardianRlsDenies,
  probeMainMergeDenied,
  recordTestResult,
  requireHumanApproval,
  runCodeChangeOrchestratorCycle,
} from './code-change-branch-orchestrator-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Es8Actor = {
  kind: 'code_change_orchestrator',
  id: 'cco-1',
  orgId: 'org-es8',
  tenantId: 'ten-es8',
  universeId: 'uni-es8',
  permissions: ['orchestrate'],
};

const human: Es8Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-es8',
  tenantId: 'ten-es8',
  universeId: 'uni-es8',
  permissions: ['approve_consequential'],
};

test('SoT label ES8 / family 62L-ES; next ES9 review gate; no invented issue #', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES8');
  assert.equal(GITHUB_SOT_FAMILY, '62L-ES');
  assert.match(GITHUB_SOT_TITLE, /Code Change & Branch Orchestrator/);
  assert.match(GITHUB_SOT_ISSUE_NOTE, /no issue number invented/i);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ES9/);
  assert.match(NEXT_PHASE_TITLE, /Automated Code Review/);
  assert.match(ES_LAYER_TITLE, /62L-ES/);
});

test('honesty locks: L4 false; main-merge denied; Guardian/RLS weaken denied; NOT_TESTED≠PASS', () => {
  assert.equal(assertEs8LocksIntact(), true);
  assert.equal(ES8_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ES8_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ES8_LOCKS.AUTOMATIC_MERGE_TO_MAIN, false);
  assert.equal(ES8_LOCKS.DIRECT_MAIN_CHANGES, false);
  assert.equal(ES8_LOCKS.DISABLE_GUARDIAN, false);
  assert.equal(ES8_LOCKS.WEAKEN_RLS, false);
  assert.equal(ES8_LOCKS.TREAT_NOT_TESTED_AS_PASS, false);
  assert.equal(ES8_LOCKS.SKIP_TEST_GATE_FOR_DRAFT_PR, false);
  assert.equal(ES8_LOCKS.TIP_LAND, false);
  assert.equal(ES8_LOCKS.AUTO_OPEN_PR, false);
  assert.equal(ES8_LOCKS.PRODUCTION_DEPLOYMENT, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(mainMergeAllowed(), false);
  assert.equal(notTestedMeansPass(), false);
  assert.equal(draftPrReadyAllowedWithoutGate(), false);
  assert.equal(CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY.mainMergeDenied, true);
  assert.equal(CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY.guardianDisableDenied, true);
  assert.equal(CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY.rlsWeakenDenied, true);
  assert.equal(CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY.notTestedIsNotPass, true);
  assert.equal(CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY.draftPrReadyRequiresTestGate, true);
  assert.equal(ES8_AGENT_BOUNDS.mayMergeToMain, false);
  assert.equal(ES8_AGENT_BOUNDS.automaticAuthority, false);
  assert.equal(attemptEnableL4().state, 'DENIED');
  assert.equal(attemptTreatNotTestedAsPass().state, 'DENIED');
  assert.equal(attemptProductionDeploy().state, 'DENIED');
});

test('states + test gate + may/must-not + cycle encoded', () => {
  assert.deepEqual([...CHANGE_ORCHESTRATOR_STATES], [
    'PLANNED',
    'BRANCH_CREATED',
    'CHANGES_IN_PROGRESS',
    'TESTING',
    'REVIEW_REQUIRED',
    'DRAFT_PR_READY',
    'BLOCKED',
    'REJECTED',
  ]);
  assert.deepEqual([...TEST_BEFORE_REVIEW_GATE], [
    'typecheck',
    'unit_tests',
    'security_policy_tests',
    'integration_tests',
    'runtime_tests',
  ]);
  assert.ok(TEST_RESULT_STATES.includes('NOT_TESTED'));
  assert.ok(TEST_RESULT_STATES.includes('PASS'));
  assert.ok(PR_MR_STATES.includes('DRAFT_PREPARED'));
  assert.ok(ES8_MAY.includes('create_dedicated_feature_branch'));
  assert.ok(ES8_MAY.includes('prepare_draft_pr_mr_state'));
  assert.ok(ES8_MUST_NOT.includes('disable_guardian'));
  assert.ok(ES8_MUST_NOT.includes('weaken_rls'));
  assert.ok(ES8_MUST_NOT.includes('automatic_merge_to_main'));
  assert.ok(ES8_MUST_NOT.includes('treat_not_tested_as_pass'));
  assert.ok(DENIED_CHANGE_CLASSES.includes('disable_guardian'));
  assert.ok(CHANGE_ORCHESTRATOR_CYCLE.includes('draft_pr_ready_only_after_gate'));
  assert.ok(CHANGE_ORCHESTRATOR_CYCLE.includes('l4_autonomy_false'));
});

test('main-merge denied; tip-land denied; Guardian/RLS weaken denied', () => {
  assert.equal(probeMainMergeDenied(agent).state, 'DENIED');
  const planned = planChangeRun({
    actor: agent,
    implementationId: 'impl-merge',
    repository: 'DevinHaynes2025/xiv-ai',
    baseBranch: 'xiv-v2',
    featureBranch: 'cursor/es8-probe-4059',
  });
  assert.ok(!('denied' in planned));
  assert.equal(attemptMergeToMain({ actor: agent, run: planned }).state, 'DENIED');
  assert.equal(attemptTipLand({ actor: agent, run: planned }).state, 'DENIED');

  const probes = probeGuardianRlsDenies();
  assert.equal(probes.guardian.state, 'DENIED');
  assert.equal(probes.rls.state, 'DENIED');

  const branched = createFeatureBranch({ actor: agent, run: planned });
  assert.ok(!('denied' in branched));
  assert.equal(branched.state, 'BRANCH_CREATED');

  assert.equal(
    applyBoundedChanges({
      actor: agent,
      run: branched,
      filesChanged: ['services/ai/local-brain/x.ts'],
      disableGuardian: true,
    }).state,
    'DENIED',
  );
  assert.equal(
    applyBoundedChanges({
      actor: agent,
      run: branched,
      filesChanged: ['services/ai/local-brain/x.ts'],
      weakenRls: true,
    }).state,
    'DENIED',
  );
  assert.equal(
    applyBoundedChanges({
      actor: agent,
      run: branched,
      filesChanged: ['services/ai/local-brain/x.ts'],
      editMainDirectly: true,
    }).state,
    'DENIED',
  );
  assert.equal(
    applyBoundedChanges({
      actor: agent,
      run: branched,
      filesChanged: ['.env.production'],
    }).state,
    'DENIED',
  );

  const humanGate = requireHumanApproval({
    actor: agent,
    action: 'merge_to_main',
  });
  assert.ok('denied' in humanGate || humanGate.state === 'HUMAN_APPROVAL_REQUIRED');
  void human;
});

test('unrun ≠ PASS; DRAFT_PR_READY requires test gate', () => {
  const planned = planChangeRun({
    actor: agent,
    implementationId: 'impl-gate',
    repository: 'DevinHaynes2025/xiv-ai',
    baseBranch: 'xiv-v2',
    featureBranch: 'cursor/es8-gate-4059',
  });
  assert.ok(!('denied' in planned));
  let run = createFeatureBranch({ actor: agent, run: planned });
  assert.ok(!('denied' in run));
  const changed = applyBoundedChanges({
    actor: agent,
    run,
    filesChanged: ['services/ai/local-brain/feature.ts'],
  });
  assert.ok(!('denied' in changed));
  run = changed;

  const notTested = recordTestResult({
    actor: agent,
    run,
    step: 'typecheck',
    command: 'npm run typecheck',
    state: 'NOT_TESTED',
  });
  assert.ok(!('denied' in notTested));
  assert.equal(notTested.testResults[0]?.state, 'NOT_TESTED');
  assert.equal(testGateSatisfied(notTested.testResults), false);

  assert.equal(
    recordTestResult({
      actor: agent,
      run,
      step: 'unit_tests',
      command: 'npm test',
      state: 'PASS',
      claimNotTestedAsPass: true,
    }).state,
    'DENIED',
  );

  // Incomplete gate → DRAFT_PR_READY denied
  const incompleteCycle = runCodeChangeOrchestratorCycle({
    actor: agent,
    implementationId: 'impl-incomplete',
    repoRoot,
    leaveRuntimeNotTested: true,
  });
  assert.equal(incompleteCycle.ok, false);
  assert.ok(incompleteCycle.run);
  assert.notEqual(incompleteCycle.run.state, 'DRAFT_PR_READY');
  const draftDenied = markDraftPrReady({
    actor: agent,
    run: {
      ...incompleteCycle.run,
      state: 'REVIEW_REQUIRED',
    },
  });
  assert.ok('denied' in draftDenied);

  // Full gate → DRAFT_PR_READY (prepare only)
  const full = runCodeChangeOrchestratorCycle({
    actor: agent,
    implementationId: 'impl-full',
    repoRoot,
  });
  assert.equal(full.ok, true);
  assert.ok(full.run);
  assert.equal(full.run.state, 'DRAFT_PR_READY');
  assert.equal(full.run.prMrState, 'DRAFT_PREPARED');
  assert.equal(full.l4, false);
  assert.equal(full.run.l4AutonomyEnabled, false);
  assert.equal(full.run.tipLandAttempted, false);
  assert.equal(full.run.autoMergeMainAttempted, false);

  assert.equal(
    markDraftPrReady({
      actor: agent,
      run: full.run,
      skipTestGate: true,
    }).state,
    'DENIED',
  );
  assert.equal(
    markDraftPrReady({
      actor: agent,
      run: full.run,
      actuallyOpenPr: true,
    }).state,
    'DENIED',
  );
});

test('soft-wire ES7/ES6/ES5: presence≠VERIFIED; absent→WAITING_DATA not FAIL', () => {
  const snap = es8SoftWireSnapshot(repoRoot);
  assert.equal(
    softWireHopState(snap.es7ExecutableImplementationPlan.present),
    snap.es7ExecutableImplementationPlan.present ? 'PASS' : 'WAITING_DATA',
  );
  assert.equal(
    softWireHopState(snap.es6AcceptanceTestEvidence.present),
    snap.es6AcceptanceTestEvidence.present ? 'PASS' : 'WAITING_DATA',
  );
  assert.equal(
    softWireHopState(snap.es5PrototypeArchitectureComposer.present),
    snap.es5PrototypeArchitectureComposer.present ? 'PASS' : 'WAITING_DATA',
  );
  // Absent must never be treated as FAIL by softWireHopState
  assert.notEqual(softWireHopState(false), 'FAIL');
  assert.equal(softWireHopState(false), 'WAITING_DATA');

  const cycle = runCodeChangeOrchestratorCycle({
    actor: agent,
    implementationId: 'impl-softwire',
    repoRoot,
  });
  const softHops = cycle.hops.filter((h) => h.hop.startsWith('soft_wire_'));
  assert.equal(softHops.length, 3);
  for (const h of softHops) {
    assert.ok(h.state === 'PASS' || h.state === 'WAITING_DATA');
    assert.notEqual(h.state, 'FAIL');
  }
  assert.equal(CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY.presenceNotVerified, true);
  assert.equal(CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY.absentIsWaitingDataNotFail, true);
});
