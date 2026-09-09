/**
 * 62L-ES8 — Code Change & Branch Orchestrator (park-and-implement).
 *
 * Layer: 62L-ES Research-to-Product → Executable Software path.
 *
 * Core flow: Approved Implementation Plan → feature branch → file changes →
 * local/static tests → evidence bundle → review → draft PR/MR (prepare only).
 *
 * Soft-wire when PRESENT: ES7 Executable Implementation Plan, ES6 Acceptance
 * Criteria / Test Evidence, ES5 Prototype Architecture Composer.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * No tip-land, no auto-merge to main, no auto-open PR for park work.
 * Next (report only): ES9 — Automated Code Review & Regression Gate.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_LABEL = '62L-ES8' as const;
export const GITHUB_SOT_FAMILY = '62L-ES' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES8 Code Change & Branch Orchestrator — branch-scoped changes; test-before-review; draft PR prepare-only; no main merge / tip-land / prod' as const;
export const GITHUB_SOT_ISSUE_NOTE =
  'GitHub SoT issue: not cited in ES8 task brief; gh issues inaccessible in this environment — no issue number invented.' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ES8_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ES_LAYER_TITLE =
  '62L-ES Research-to-Product → Executable Software (prototype → plan → branch-scoped change → review gate)' as const;

export const NEXT_PHASE_TITLE =
  'ES9 — Automated Code Review & Regression Gate — review + regression evidence before human merge authority.' as const;

/**
 * Required orchestration states.
 */
export const CHANGE_ORCHESTRATOR_STATES = [
  'PLANNED',
  'BRANCH_CREATED',
  'CHANGES_IN_PROGRESS',
  'TESTING',
  'REVIEW_REQUIRED',
  'DRAFT_PR_READY',
  'BLOCKED',
  'REJECTED',
] as const;

export type ChangeOrchestratorState =
  (typeof CHANGE_ORCHESTRATOR_STATES)[number];

/**
 * Per-test honesty states — unrun remains NOT_TESTED (never silent PASS).
 */
export const TEST_RESULT_STATES = [
  'PASS',
  'FAIL',
  'NOT_TESTED',
  'SKIPPED',
  'ERROR',
] as const;

export type TestResultState = (typeof TEST_RESULT_STATES)[number];

/**
 * Ordered test-before-review gate.
 */
export const TEST_BEFORE_REVIEW_GATE = [
  'typecheck',
  'unit_tests',
  'security_policy_tests',
  'integration_tests',
  'runtime_tests',
] as const;

export type TestGateStep = (typeof TEST_BEFORE_REVIEW_GATE)[number];

/**
 * PR/MR lifecycle states the orchestrator may *model* (prepare draft only).
 * Actual PR creation for park-and-implement work remains founder-authorized.
 */
export const PR_MR_STATES = [
  'NONE',
  'DRAFT_PREPARED',
  'DRAFT_OPEN',
  'READY_FOR_REVIEW',
  'MERGED',
  'CLOSED',
  'BLOCKED',
] as const;

export type PrMrState = (typeof PR_MR_STATES)[number];

/**
 * Actions the orchestrator MAY perform (bounded).
 */
export const ES8_MAY = Object.freeze([
  'create_update_bounded_source_files',
  'add_unit_tests',
  'extend_existing_services',
  'update_docs',
  'prepare_config_examples',
  'create_candidate_adapters',
  'fix_compile_test_failures',
  'create_dedicated_feature_branch',
  'run_local_static_tests',
  'build_evidence_bundle',
  'prepare_draft_pr_mr_state',
  'summarize_diff_intelligence',
  'identify_rollback_instructions',
] as const);

/**
 * Actions the orchestrator MUST NOT perform.
 */
export const ES8_MUST_NOT = Object.freeze([
  'disable_guardian',
  'weaken_rls',
  'remove_approval_gates',
  'grant_self_new_scopes',
  'add_secrets_to_source',
  'modify_production_dbs',
  'provision_paid_cloud_resources_automatically',
  'direct_main_changes',
  'automatic_merge_to_main',
  'production_deployment',
  'treat_not_tested_as_pass',
  'skip_test_gate_into_draft_pr_ready',
  'tip_land_onto_xiv_v2_or_main',
  'auto_open_pr_without_founder_ask',
  'enable_l4_autonomy',
] as const);

export const DENIED_CHANGE_CLASSES = [
  'disable_guardian',
  'weaken_rls',
  'remove_approval_gates',
  'grant_self_new_scopes',
  'add_secrets_to_source',
  'modify_production_dbs',
  'provision_paid_cloud_resources',
  'direct_main_edit',
  'auto_merge_main',
  'production_deploy',
] as const;

export type DeniedChangeClass = (typeof DENIED_CHANGE_CLASSES)[number];

export const CHANGE_ORCHESTRATOR_CYCLE = [
  'locks_asserted',
  'soft_wire_es7_plan',
  'soft_wire_es6_acceptance_evidence',
  'soft_wire_es5_architecture_composer',
  'plan_accepted_check',
  'branch_create_non_main',
  'apply_bounded_changes',
  'deny_unsafe_changes',
  'run_test_before_review_gate',
  'not_tested_honesty',
  'diff_intelligence',
  'rollback_instructions',
  'evidence_bundle',
  'review_required',
  'draft_pr_ready_only_after_gate',
  'human_authority_boundaries',
  'l4_autonomy_false',
  'no_tip_land_no_auto_merge',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Es8Hop = (typeof CHANGE_ORCHESTRATOR_CYCLE)[number];

export type Es8EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'DENIED'
  | 'REJECTED'
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'PLAN_ONLY'
  | 'BOUNDED'
  | 'NOT_APPLIED'
  | 'NOT_TESTED'
  | 'NOT_AVAILABLE'
  | 'NOT_VERIFIED'
  | 'WAITING_DATA'
  | 'ADVISORY_ONLY'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'UNVERIFIED'
  | 'PARTIAL'
  | 'BLOCKED'
  | 'UNKNOWN';

export type Es8HopRecord = {
  hop: Es8Hop;
  state: Es8EvidenceState;
  summary: string;
  at: string;
};

export type Es8ActorKind =
  | 'code_change_orchestrator'
  | 'implementation_agent'
  | 'reviewer'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Es8Actor = {
  kind: Es8ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export type TestCommandResult = {
  step: TestGateStep;
  command: string;
  state: TestResultState;
  exitCode: number | null;
  summary: string;
};

export type DiffIntelligence = {
  whatChanged: string;
  why: string;
  securityImpact: string;
  dataImpact: string;
  runtimeImpact: string;
  newDependencies: readonly string[];
  knownLimitations: readonly string[];
  unverifiedAssumptions: readonly string[];
};

export type RollbackInstructions = {
  lastKnownSafeState: string;
  revertMethod: string;
  commands: readonly string[];
  notes: string;
};

export type EvidenceBundle = {
  changeRunId: string;
  implementationId: string;
  filesChanged: readonly string[];
  commandsRun: readonly string[];
  testResults: readonly TestCommandResult[];
  securityChecks: readonly string[];
  diffIntelligence: DiffIntelligence;
  rollback: RollbackInstructions;
  softWireNotes: readonly string[];
  honestyBanner: typeof HONESTY_BANNER;
  createdAt: string;
};

/**
 * Full orchestration run record.
 */
export type ChangeOrchestrationRun = {
  changeRunId: string;
  implementationId: string;
  repository: string;
  sourceBranch: string;
  baseBranch: string;
  featureBranch: string;
  state: ChangeOrchestratorState;
  filesChanged: readonly string[];
  dependenciesChanged: readonly string[];
  migrationCandidates: readonly string[];
  testsRequired: readonly TestGateStep[];
  commandsRun: readonly string[];
  testResults: readonly TestCommandResult[];
  securityChecks: readonly string[];
  rollbackInstructions: RollbackInstructions | null;
  reviewer: string | null;
  prMrState: PrMrState;
  blockers: readonly string[];
  diffIntelligence: DiffIntelligence | null;
  evidenceBundle: EvidenceBundle | null;
  approvedPlanPresent: boolean;
  tipLandAttempted: false;
  autoMergeMainAttempted: false;
  productionDeployAttempted: false;
  l4AutonomyEnabled: false;
  createdAt: string;
  updatedAt: string;
};

export const ES8_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  PRODUCTION_DEPLOYMENT: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  MANAGE_PULL_REQUEST: false as const,
  AUTO_OPEN_PR: false as const,
  DIRECT_MAIN_CHANGES: false as const,
  AUTOMATIC_MERGE_TO_MAIN: false as const,

  DISABLE_GUARDIAN: false as const,
  WEAKEN_RLS: false as const,
  REMOVE_APPROVAL_GATES: false as const,
  GRANT_SELF_NEW_SCOPES: false as const,
  ADD_SECRETS_TO_SOURCE: false as const,
  MODIFY_PRODUCTION_DBS: false as const,
  PROVISION_PAID_CLOUD_AUTOMATICALLY: false as const,

  TREAT_NOT_TESTED_AS_PASS: false as const,
  SKIP_TEST_GATE_FOR_DRAFT_PR: false as const,

  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_MERGE_PROD_DB_SCOPES: true as const,

  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  RECOMMEND_EQ_MERGE: false as const,
});

export const ES8_AGENT_BOUNDS = Object.freeze({
  mayCreateFeatureBranch: true as const,
  mayApplyBoundedSourceChanges: true as const,
  mayRunLocalTests: true as const,
  mayPrepareDraftPrState: true as const,
  mayMergeToMain: false as const,
  mayTipLand: false as const,
  mayAutoOpenPr: false as const,
  mayDisableGuardian: false as const,
  mayWeakenRls: false as const,
  mayRemoveApprovalGates: false as const,
  mayGrantSelfNewScopes: false as const,
  mayAddSecretsToSource: false as const,
  mayModifyProductionDbs: false as const,
  mayProvisionPaidCloudAutomatically: false as const,
  mayTreatNotTestedAsPass: false as const,
  maySkipTestGateForDraftPr: false as const,
  mayDeployProduction: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY = Object.freeze({
  draftPrReadyRequiresTestGate: true as const,
  unrunTestsRemainNotTested: true as const,
  notTestedIsNotPass: true as const,
  mainMergeDenied: true as const,
  tipLandDenied: true as const,
  autoOpenPrDeniedForParkWork: true as const,
  productionDeployDenied: true as const,
  guardianDisableDenied: true as const,
  rlsWeakenDenied: true as const,
  humanAuthorizesMergeProdDbScopesExternal: true as const,
  presenceNotVerified: true as const,
  absentIsWaitingDataNotFail: true as const,
});

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Es8SoftWireSnapshot = {
  es7ExecutableImplementationPlan: SoftWirePresence;
  es7Report: SoftWirePresence;
  es6AcceptanceTestEvidence: SoftWirePresence;
  es6Report: SoftWirePresence;
  es5PrototypeArchitectureComposer: SoftWirePresence;
  es5Report: SoftWirePresence;
};

export function assertEs8LocksIntact(): boolean {
  return (
    ES8_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ES8_LOCKS.TIP_LAND === false &&
    ES8_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ES8_LOCKS.PRODUCTION_DEPLOYMENT === false &&
    ES8_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ES8_LOCKS.MANAGE_PULL_REQUEST === false &&
    ES8_LOCKS.AUTO_OPEN_PR === false &&
    ES8_LOCKS.DIRECT_MAIN_CHANGES === false &&
    ES8_LOCKS.AUTOMATIC_MERGE_TO_MAIN === false &&
    ES8_LOCKS.DISABLE_GUARDIAN === false &&
    ES8_LOCKS.WEAKEN_RLS === false &&
    ES8_LOCKS.REMOVE_APPROVAL_GATES === false &&
    ES8_LOCKS.GRANT_SELF_NEW_SCOPES === false &&
    ES8_LOCKS.ADD_SECRETS_TO_SOURCE === false &&
    ES8_LOCKS.MODIFY_PRODUCTION_DBS === false &&
    ES8_LOCKS.PROVISION_PAID_CLOUD_AUTOMATICALLY === false &&
    ES8_LOCKS.TREAT_NOT_TESTED_AS_PASS === false &&
    ES8_LOCKS.SKIP_TEST_GATE_FOR_DRAFT_PR === false &&
    ES8_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ES8_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ES8_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ES8_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ES8_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_MERGE_PROD_DB_SCOPES === true &&
    ES8_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ES8_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ES8_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ES8_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ES8_LOCKS.RECOMMEND_EQ_ACT === false &&
    ES8_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ES8_LOCKS.RECOMMEND_EQ_MERGE === false &&
    ES8_AGENT_BOUNDS.mayMergeToMain === false &&
    ES8_AGENT_BOUNDS.mayTipLand === false &&
    ES8_AGENT_BOUNDS.mayAutoOpenPr === false &&
    ES8_AGENT_BOUNDS.mayDisableGuardian === false &&
    ES8_AGENT_BOUNDS.mayWeakenRls === false &&
    ES8_AGENT_BOUNDS.mayTreatNotTestedAsPass === false &&
    ES8_AGENT_BOUNDS.maySkipTestGateForDraftPr === false &&
    ES8_AGENT_BOUNDS.automaticAuthority === false &&
    CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY.draftPrReadyRequiresTestGate === true &&
    CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY.notTestedIsNotPass === true &&
    CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY.mainMergeDenied === true &&
    CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY.guardianDisableDenied === true &&
    CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY.rlsWeakenDenied === true
  );
}

function softWireFile(
  relFromLocalBrain: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(
    dirname(fileURLToPath(import.meta.url)),
    relFromLocalBrain,
  );
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

function softWireRepoRelative(
  repoRoot: string,
  rel: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(repoRoot, rel);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

export function es8SoftWireSnapshot(repoRoot?: string): Es8SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    es7ExecutableImplementationPlan: softWireFile(
      './executable-implementation-plan-types.ts',
      'ES7 Executable Implementation Plan PRESENT (soft-wire).',
      'ES7 Executable Implementation Plan absent — soft-wire WAITING_DATA.',
    ),
    es7Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES7_EXECUTABLE_IMPLEMENTATION_PLAN_REPORT.md',
      'ES7 report PRESENT.',
      'ES7 report absent — soft-wire WAITING_DATA.',
    ),
    es6AcceptanceTestEvidence: softWireFile(
      './acceptance-criteria-test-evidence-types.ts',
      'ES6 Acceptance Criteria / Test Evidence PRESENT (soft-wire).',
      'ES6 Acceptance Criteria / Test Evidence absent — soft-wire WAITING_DATA.',
    ),
    es6Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES6_ACCEPTANCE_CRITERIA_TEST_EVIDENCE_REPORT.md',
      'ES6 report PRESENT.',
      'ES6 report absent — soft-wire WAITING_DATA.',
    ),
    es5PrototypeArchitectureComposer: softWireFile(
      './prototype-architecture-composer-types.ts',
      'ES5 Prototype Architecture Composer PRESENT (soft-wire).',
      'ES5 Prototype Architecture Composer absent — soft-wire WAITING_DATA.',
    ),
    es5Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES5_PROTOTYPE_ARCHITECTURE_COMPOSER_REPORT.md',
      'ES5 report PRESENT.',
      'ES5 report absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireHopState(present: boolean): Es8EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEs8Agent(actor: Es8Actor): boolean {
  return (
    actor.kind === 'code_change_orchestrator' ||
    actor.kind === 'implementation_agent' ||
    actor.kind === 'home_base'
  );
}

export function isHumanApprover(actor: Es8Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin' ||
    actor.kind === 'reviewer'
  );
}

/**
 * Test gate completeness: every required step must be PASS (not NOT_TESTED).
 */
export function testGateSatisfied(
  results: readonly TestCommandResult[],
  required: readonly TestGateStep[] = TEST_BEFORE_REVIEW_GATE,
): boolean {
  for (const step of required) {
    const hit = results.find((r) => r.step === step);
    if (!hit) return false;
    if (hit.state === 'NOT_TESTED' || hit.state === 'SKIPPED') return false;
    if (hit.state !== 'PASS') return false;
  }
  return true;
}

export function notTestedMeansPass(): boolean {
  return ES8_LOCKS.TREAT_NOT_TESTED_AS_PASS;
}

export function mainMergeAllowed(): boolean {
  return !CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY.mainMergeDenied;
}

export function draftPrReadyAllowedWithoutGate(): boolean {
  return ES8_LOCKS.SKIP_TEST_GATE_FOR_DRAFT_PR;
}
