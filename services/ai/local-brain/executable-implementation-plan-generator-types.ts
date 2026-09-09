/**
 * 62L-ES7 — Executable Implementation Plan Generator (park-and-implement).
 *
 * Layer: 62L-ES Autonomous Research & Productization Factory.
 * Converts every approved prototype into a concrete implementation plan so
 * agents and developers know exactly what files, branches, dependencies,
 * commands, tests, owners, and stop conditions are required.
 *
 * Core flow:
 * Approved prototype → architecture → acceptance tests → file map →
 * branch plan → implementation tasks → verification → review
 *
 * Soft-wire when PRESENT (existsSync): ES6 Acceptance Test Evidence / criteria,
 * ES5 Prototype Architecture Composer, ES4 Prototype Scope Generator.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: 62L-ES family / GitHub SoT unresolved in this environment — no issue
 * number invented. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * Migrations stay MIGRATION_CANDIDATE until separately reviewed/authorized.
 * Commands/tests stay NOT_TESTED until executed. tip-land=NO.
 * This phase GENERATES plans — does not tip-land, merge to main, or auto-open PRs.
 * Next (report only): ES8 — Code Change & Branch Orchestrator.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

/** GitHub SoT not resolved here — do not invent an issue number. */
export const GITHUB_SOT_ISSUE: null = null;
export const GITHUB_SOT_ISSUE_NOTE =
  'GitHub SoT for 62L-ES not resolved in this environment — no issue number invented.' as const;
export const GITHUB_SOT_LABEL = '62L-ES7' as const;
export const GITHUB_SOT_FAMILY = '62L-ES' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES7 Executable Implementation Plan Generator — approved prototype→concrete plan; file/command maps; dependency gate; migration candidate lock; stop conditions; evidence package; NOT_TESTED until run; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ES7_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;
export const ES7_MIGRATION_DEFAULT_STATUS = 'MIGRATION_CANDIDATE' as const;

export const ES_LAYER_TITLE =
  '62L-ES Autonomous Research & Productization Factory' as const;

export const NEXT_PHASE_TITLE =
  'ES8 — Code Change & Branch Orchestrator — execute planned file/branch changes under review gates without tip-land or auto main merge.' as const;

/**
 * Plan tracking fields (exact set from user story).
 */
export const IMPLEMENTATION_PLAN_FIELDS = [
  'implementationId',
  'prototypeId',
  'targetBranch',
  'sourceFilesToCreateOrUpdate',
  'existingModulesToReuse',
  'dependencies',
  'environmentVariables',
  'migrationsIfAny',
  'apiConfigRequirements',
  'testFiles',
  'commands',
  'owners',
  'sequenceDependencies',
  'rollbackPlan',
  'evidenceRequirements',
  'blockers',
] as const;

export type ImplementationPlanField =
  (typeof IMPLEMENTATION_PLAN_FIELDS)[number];

/**
 * Core conversion flow (exact order).
 */
export const EXECUTABLE_IMPLEMENTATION_CORE_FLOW = [
  'approved_prototype',
  'architecture',
  'acceptance_tests',
  'file_map',
  'branch_plan',
  'implementation_tasks',
  'verification',
  'review',
] as const;

export type ExecutableImplementationCoreFlowHop =
  (typeof EXECUTABLE_IMPLEMENTATION_CORE_FLOW)[number];

/**
 * File mapping standard: path → purpose → owner → change type → tests affected.
 */
export const FILE_MAP_ENTRY_FIELDS = [
  'path',
  'purpose',
  'owner',
  'changeType',
  'testsAffected',
] as const;

export type FileMapEntryField = (typeof FILE_MAP_ENTRY_FIELDS)[number];

export const FILE_CHANGE_TYPES = [
  'create',
  'update',
  'reuse',
  'delete_candidate',
] as const;

export type FileChangeType = (typeof FILE_CHANGE_TYPES)[number];

/**
 * Command / test status honesty — unrun ≠ success.
 */
export const COMMAND_TEST_STATUSES = [
  'NOT_TESTED',
  'PASS',
  'FAIL',
  'SKIPPED',
  'BLOCKED',
] as const;

export type CommandTestStatus = (typeof COMMAND_TEST_STATUSES)[number];

/**
 * Branch lifecycle (feature → tests → review → draft MR/PR).
 * Direct production mutation / main merge without authorization is forbidden.
 */
export const BRANCH_LIFECYCLE = [
  'feature_branch',
  'tests',
  'review',
  'draft_mr_pr',
] as const;

export type BranchLifecycleHop = (typeof BRANCH_LIFECYCLE)[number];

/**
 * Dependency gate checklist before adding a new package.
 */
export const DEPENDENCY_GATE_CHECKS = [
  'existing_dep_sufficient',
  'maintained',
  'permissions_network',
  'license',
  'supply_chain_risk',
] as const;

export type DependencyGateCheck = (typeof DEPENDENCY_GATE_CHECKS)[number];

/**
 * Migration honesty — candidates until separately reviewed/authorized.
 */
export const MIGRATION_STATUSES = [
  'NONE',
  'MIGRATION_CANDIDATE',
  'REVIEWED',
  'AUTHORIZED',
  'APPLIED',
] as const;

export type MigrationStatus = (typeof MIGRATION_STATUSES)[number];

/**
 * Stop / escalate conditions.
 */
export const STOP_CONDITIONS = [
  'rights_or_data_unavailable',
  'security_boundary_cannot_be_preserved',
  'dependency_risk_unacceptable',
  'benchmark_contradicts_design',
  'cost_exceeds_budget',
  'simpler_implementation_meets_goal_better',
] as const;

export type StopCondition = (typeof STOP_CONDITIONS)[number];

/**
 * Evidence package required for completion claims.
 */
export const EVIDENCE_PACKAGE_FIELDS = [
  'diff',
  'commandsRun',
  'testResults',
  'runtimeEvidence',
  'knownFailures',
  'rollbackInstructions',
  'reviewStatus',
] as const;

export type EvidencePackageField = (typeof EVIDENCE_PACKAGE_FIELDS)[number];

export type FileMapEntry = {
  path: string;
  purpose: string;
  owner: string;
  changeType: FileChangeType;
  testsAffected: readonly string[];
};

export type CommandMapEntry = {
  command: string;
  purpose: string;
  testStatus: CommandTestStatus;
  executed: boolean;
  resultSummary: string | null;
};

export type DependencyGateResult = {
  packageName: string;
  checks: Record<DependencyGateCheck, boolean | 'UNKNOWN'>;
  approved: boolean;
  reason: string;
};

export type MigrationCandidate = {
  path: string;
  purpose: string;
  status: MigrationStatus;
  guardianRlsWeakened: false;
  authorized: boolean;
};

export type EvidencePackage = {
  diff: string | null;
  commandsRun: readonly string[];
  testResults: readonly CommandMapEntry[];
  runtimeEvidence: readonly string[];
  knownFailures: readonly string[];
  rollbackInstructions: string;
  reviewStatus: 'NOT_REVIEWED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
};

export type ImplementationPlan = {
  implementationId: string;
  prototypeId: string;
  targetBranch: string;
  sourceFilesToCreateOrUpdate: readonly FileMapEntry[];
  existingModulesToReuse: readonly string[];
  dependencies: readonly string[];
  environmentVariables: readonly string[];
  migrationsIfAny: readonly MigrationCandidate[];
  apiConfigRequirements: readonly string[];
  testFiles: readonly string[];
  commands: readonly CommandMapEntry[];
  owners: readonly string[];
  sequenceDependencies: readonly string[];
  rollbackPlan: string;
  evidenceRequirements: readonly EvidencePackageField[];
  blockers: readonly string[];
  stopConditions: readonly StopCondition[];
  branchLifecycle: typeof BRANCH_LIFECYCLE;
  evidencePackage: EvidencePackage;
  planOnly: true;
  productionAuthorized: false;
  tipLandAuthorized: false;
  mainMergeAuthorized: false;
  autoOpenPrAuthorized: false;
  migrationAuthorized: false;
  guardianRlsWeakened: false;
  l4AutonomyEnabled: false;
};

export const EXECUTABLE_IMPLEMENTATION_TRUTH_BOUNDARY = Object.freeze({
  planIsNotExecution: true as const,
  planIsNotProductionAuthorized: true as const,
  unrunCommandIsNotSuccess: true as const,
  unrunTestIsNotSuccess: true as const,
  notTestedUntilExecuted: true as const,
  migrationCandidateIsNotAuthorized: true as const,
  migrationCandidateIsNotApplied: true as const,
  mayWeakenGuardianRlsForPrototype: false as const,
  mayMergeToMainWithoutAuthorization: false as const,
  mayTipLand: false as const,
  mayAutoOpenPrAsFeatureUnderTest: false as const,
  featureBranchThenTestsThenReviewThenDraftMr: true as const,
  dependencyGateRequiredBeforeNewPackage: true as const,
  guardianRlsTenantUniverseIsolationUnchanged: true as const,
  l4AutonomyEnabled: false as const,
});

export const EXECUTABLE_IMPLEMENTATION_PLAN_GENERATOR_CYCLE = [
  'honesty_locks',
  'executable_implementation_plan_generator_bootstrap',
  // A — Structure
  'plan_fields_encoded',
  'core_flow_encoded',
  'file_map_standard_encoded',
  'command_status_encoded',
  'branch_lifecycle_encoded',
  'dependency_gate_encoded',
  'migration_candidate_lock_encoded',
  'stop_conditions_encoded',
  'evidence_package_encoded',
  'truth_boundary_encoded',
  // B — Flow
  'ingest_approved_prototype',
  'attach_architecture',
  'attach_acceptance_tests',
  'build_file_map',
  'build_branch_plan',
  'enumerate_implementation_tasks',
  'define_verification',
  'require_review',
  // C — Honesty gates
  'label_unrun_commands_not_tested',
  'deny_unrun_as_success',
  'lock_migrations_as_candidates',
  'deny_migration_as_authorized',
  'deny_guardian_rls_weaken',
  'deny_main_merge_without_authorization',
  'deny_tip_land',
  'deny_auto_open_pr',
  'dependency_gate_before_new_package',
  'escalate_on_stop_conditions',
  // D — Soft-wires
  'es6_acceptance_tests_soft_wire',
  'es5_architecture_soft_wire',
  'es4_scope_soft_wire',
  'l4_autonomy_false',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Es7Hop =
  (typeof EXECUTABLE_IMPLEMENTATION_PLAN_GENERATOR_CYCLE)[number];

export type Es7EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'DENIED'
  | 'REJECTED'
  | 'BLOCKED'
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
  | 'REGISTERED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'UNVERIFIED'
  | 'PARTIAL'
  | 'UNKNOWN'
  | 'MIGRATION_CANDIDATE'
  | 'ESCALATED';

export type Es7HopRecord = {
  hop: Es7Hop;
  state: Es7EvidenceState;
  summary: string;
  at: string;
};

export type Es7ActorKind =
  | 'implementation_plan_generator'
  | 'prototype_architect'
  | 'acceptance_test_agent'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin'
  | 'plan_owner';

export type Es7Actor = {
  kind: Es7ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ES7_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_IMPLEMENTATION_PLAN_GENERATOR_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,
  AUTO_OPEN_PR: false as const,
  MAIN_MERGE_WITHOUT_AUTHORIZATION: false as const,

  UNRUN_COMMAND_EQ_SUCCESS: false as const,
  UNRUN_TEST_EQ_SUCCESS: false as const,
  NOT_TESTED_EQ_PASS: false as const,
  MIGRATION_CANDIDATE_EQ_AUTHORIZED: false as const,
  MIGRATION_CANDIDATE_EQ_APPLIED: false as const,
  WEAKEN_GUARDIAN_RLS_FOR_PROTOTYPE: false as const,
  SKIP_DEPENDENCY_GATE: false as const,
  PLAN_EQ_EXECUTION: false as const,
  PLAN_EQ_PRODUCTION_AUTHORIZED: false as const,

  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  AUTO_DEPLOY_CHANGES: false as const,
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,

  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const ES7_AGENT_BOUNDS = Object.freeze({
  mayIngestApprovedPrototype: true as const,
  mayGenerateImplementationPlan: true as const,
  mayBuildFileAndCommandMaps: true as const,
  mayRunDependencyGate: true as const,
  mayLabelMigrationsAsCandidates: true as const,
  mayEscalateOnStopConditions: true as const,
  mayMarkUnrunCommandsNotTested: true as const,
  mayTreatUnrunAsSuccess: false as const,
  mayAuthorizeMigration: false as const,
  mayApplyMigration: false as const,
  mayWeakenGuardianRls: false as const,
  mayMergeToMain: false as const,
  mayTipLand: false as const,
  mayAutoOpenPr: false as const,
  maySkipDependencyGate: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ES7_MAY = Object.freeze([
  'ingest_approved_prototype_as_plan_input',
  'walk_core_flow_to_implementation_plan',
  'encode_file_map_path_purpose_owner_change_type_tests',
  'label_commands_not_tested_until_executed',
  'require_dependency_gate_before_new_package',
  'lock_db_changes_as_migration_candidate',
  'escalate_on_stop_conditions',
  'require_evidence_package_for_completion_claims',
  'recommend_plan_actions_without_acting',
] as const);

export const ES7_MUST_NOT = Object.freeze([
  'report_unrun_command_or_test_as_success',
  'treat_migration_candidate_as_authorized_or_applied',
  'weaken_guardian_rls_for_prototype_convenience',
  'merge_to_main_without_explicit_authorization',
  'tip_land_onto_xiv_v2_or_main',
  'auto_open_pr_as_part_of_feature_under_test',
  'skip_dependency_gate_for_new_package',
  'treat_plan_as_execution_or_production_authorization',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'auto_deploy_changes',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Es7SoftWireSnapshot = {
  es6AcceptanceTestEvidence: SoftWirePresence;
  es6AcceptanceCriteria: SoftWirePresence;
  es6Report: SoftWirePresence;
  es5PrototypeArchitectureComposer: SoftWirePresence;
  es5Report: SoftWirePresence;
  es4PrototypeScopeGenerator: SoftWirePresence;
  es4Report: SoftWirePresence;
};

export function assertEs7LocksIntact(): boolean {
  return (
    ES7_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ES7_LOCKS.TIP_LAND === false &&
    ES7_LOCKS.AUTO_OPEN_PR === false &&
    ES7_LOCKS.MAIN_MERGE_WITHOUT_AUTHORIZATION === false &&
    ES7_LOCKS.UNRUN_COMMAND_EQ_SUCCESS === false &&
    ES7_LOCKS.UNRUN_TEST_EQ_SUCCESS === false &&
    ES7_LOCKS.NOT_TESTED_EQ_PASS === false &&
    ES7_LOCKS.MIGRATION_CANDIDATE_EQ_AUTHORIZED === false &&
    ES7_LOCKS.MIGRATION_CANDIDATE_EQ_APPLIED === false &&
    ES7_LOCKS.WEAKEN_GUARDIAN_RLS_FOR_PROTOTYPE === false &&
    ES7_LOCKS.SKIP_DEPENDENCY_GATE === false &&
    ES7_LOCKS.PLAN_EQ_EXECUTION === false &&
    ES7_LOCKS.PLAN_EQ_PRODUCTION_AUTHORIZED === false &&
    ES7_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ES7_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ES7_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ES7_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ES7_LOCKS.RECOMMEND_EQ_ACT === false &&
    ES7_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ES7_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ES7_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ES7_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ES7_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ES7_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ES7_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ES7_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ES7_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ES7_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ES7_LOCKS.FULL_PRODUCTION_IMPLEMENTATION_PLAN_GENERATOR_SHIPPED === false &&
    ES7_LOCKS.MANAGE_PULL_REQUEST === false &&
    EXECUTABLE_IMPLEMENTATION_TRUTH_BOUNDARY.planIsNotExecution === true &&
    EXECUTABLE_IMPLEMENTATION_TRUTH_BOUNDARY.unrunCommandIsNotSuccess ===
      true &&
    EXECUTABLE_IMPLEMENTATION_TRUTH_BOUNDARY.migrationCandidateIsNotAuthorized ===
      true &&
    EXECUTABLE_IMPLEMENTATION_TRUTH_BOUNDARY.mayWeakenGuardianRlsForPrototype ===
      false &&
    EXECUTABLE_IMPLEMENTATION_TRUTH_BOUNDARY.mayMergeToMainWithoutAuthorization ===
      false &&
    EXECUTABLE_IMPLEMENTATION_TRUTH_BOUNDARY.l4AutonomyEnabled === false &&
    EXECUTABLE_IMPLEMENTATION_TRUTH_BOUNDARY.mayTipLand === false
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

function softWireFirstPresent(
  candidates: readonly SoftWirePresence[],
): SoftWirePresence {
  const hit = candidates.find((c) => c.present);
  if (hit) return hit;
  return candidates[0]!;
}

export function es7SoftWireSnapshot(repoRoot?: string): Es7SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    es6AcceptanceTestEvidence: softWireFile(
      './acceptance-test-evidence-types.ts',
      'ES6 Acceptance Test Evidence PRESENT (soft-wire).',
      'ES6 Acceptance Test Evidence absent — soft-wire WAITING_DATA.',
    ),
    es6AcceptanceCriteria: softWireFirstPresent([
      softWireFile(
        './acceptance-criteria-types.ts',
        'ES6 Acceptance Criteria PRESENT (soft-wire).',
        'ES6 Acceptance Criteria absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './acceptance-criteria-generator-types.ts',
        'ES6 Acceptance Criteria generator PRESENT (soft-wire).',
        'ES6 Acceptance Criteria generator absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es6Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES6_ACCEPTANCE_TEST_EVIDENCE_REPORT.md',
        'ES6 Acceptance Test Evidence report PRESENT.',
        'ES6 Acceptance Test Evidence report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES6_ACCEPTANCE_CRITERIA_REPORT.md',
        'ES6 Acceptance Criteria report PRESENT.',
        'ES6 Acceptance Criteria report absent — soft-wire WAITING_DATA.',
      ),
    ]),
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
    es4PrototypeScopeGenerator: softWireFile(
      './prototype-scope-generator-types.ts',
      'ES4 Prototype Scope Generator PRESENT (soft-wire).',
      'ES4 Prototype Scope Generator absent — soft-wire WAITING_DATA.',
    ),
    es4Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES4_PROTOTYPE_SCOPE_GENERATOR_REPORT.md',
      'ES4 report PRESENT.',
      'ES4 report absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireHopState(present: boolean): Es7EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEs7Agent(actor: Es7Actor): boolean {
  return (
    actor.kind === 'implementation_plan_generator' ||
    actor.kind === 'prototype_architect' ||
    actor.kind === 'acceptance_test_agent'
  );
}

export function isHumanApprover(actor: Es7Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin' ||
    actor.kind === 'plan_owner'
  );
}

export function unrunIsNotSuccess(status: CommandTestStatus): boolean {
  return status === 'NOT_TESTED' || status === 'SKIPPED' || status === 'BLOCKED';
}

export function migrationIsAuthorized(status: MigrationStatus): boolean {
  return status === 'AUTHORIZED' || status === 'APPLIED';
}

export function defaultCommandStatus(): CommandTestStatus {
  return 'NOT_TESTED';
}

export function dependencyGateAllowsNewPackage(
  gate: DependencyGateResult,
): boolean {
  return gate.approved === true;
}
