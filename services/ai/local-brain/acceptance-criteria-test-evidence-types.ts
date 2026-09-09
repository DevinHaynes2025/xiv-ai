/**
 * 62L-ES6 — Acceptance Criteria & Test Evidence Generator (park-and-implement).
 *
 * Layer: 62L-ES Autonomous Research & Productization Factory.
 * Converts every prototype architecture into explicit acceptance criteria and
 * test evidence requirements so “done” means measured, reproducible, and safe—
 * not just implemented.
 *
 * Soft-wire when PRESENT (existsSync): ES5 Prototype Architecture Composer,
 * ES4 Prototype Scope Generator, ES3 Opportunity Scoring Engine, ES2 Product
 * Hypothesis Factory, ES1 Research-to-Product Candidate Gate, ER34 Capability
 * Manifest honesty, ER2 API Truth State Machine.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: 62L-ES family / GitHub SoT unresolved in this environment — no issue
 * number invented. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ES7 — Executable Implementation Plan Generator.
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
export const GITHUB_SOT_LABEL = '62L-ES6' as const;
export const GITHUB_SOT_FAMILY = '62L-ES' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES6 Acceptance Criteria & Test Evidence Generator — architecture→acceptance suite; evidence rule; ownership; regression; draft≠release; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ES6_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ES_LAYER_TITLE =
  '62L-ES Autonomous Research & Productization Factory' as const;

export const NEXT_PHASE_TITLE =
  'ES7 — Executable Implementation Plan Generator — turn accepted prototype architectures and evidence suites into bounded, human-reviewed implementation plans without production authority.' as const;

/**
 * Test requirement domains (exact set from user story).
 */
export const TEST_REQUIREMENT_DOMAINS = [
  'functional_behavior',
  'agent_behavior',
  'permissions_auth',
  'guardian_rls',
  'tenant_universe_isolation',
  'api_connectivity',
  'data_rights_provenance',
  'model_runtime_behavior',
  'cpu_gpu_npu_routing',
  'offline_online_sync',
  'performance',
  'reliability',
  'rollback_recovery',
  'cost_resource_ceilings',
  'accessibility_ux',
] as const;

export type TestRequirementDomain =
  (typeof TEST_REQUIREMENT_DOMAINS)[number];

/**
 * Each test tracks these evidence fields.
 */
export const TEST_EVIDENCE_FIELDS = [
  'testId',
  'requirementId',
  'owner',
  'environment',
  'preconditions',
  'exactInput',
  'expectedOutput',
  'measurableThreshold',
  'commandOrProcedure',
  'evidenceArtifact',
  'timestamp',
  'result',
  'failureClass',
  'retestState',
] as const;

export type TestEvidenceField = (typeof TEST_EVIDENCE_FIELDS)[number];

/**
 * Required result states.
 */
export const TEST_RESULT_STATES = [
  'PASS',
  'FAIL',
  'PARTIAL',
  'NOT_TESTED',
  'BLOCKED',
  'REGRESSED',
  'STALE',
] as const;

export type TestResultState = (typeof TEST_RESULT_STATES)[number];

/**
 * One accountable owner per test / requirement area.
 */
export const TEST_OWNERS = [
  'Engineering',
  'Security',
  'Data',
  'AI/Model',
  'Product',
  'QA',
  'Operations',
] as const;

export type TestOwner = (typeof TEST_OWNERS)[number];

export const RETEST_STATES = [
  'NOT_REQUIRED',
  'PENDING_RETEST',
  'RETEST_IN_PROGRESS',
  'RETEST_PASSED',
  'RETEST_FAILED',
] as const;

export type RetestState = (typeof RETEST_STATES)[number];

export const FAILURE_CLASSES = [
  'functional',
  'security',
  'isolation',
  'performance',
  'reliability',
  'evidence_missing',
  'mislabel',
  'governance',
  'resource_ceiling',
  'other',
] as const;

export type FailureClass = (typeof FAILURE_CLASSES)[number];

/**
 * Evidence rule truth boundary.
 */
export const ACCEPTANCE_EVIDENCE_TRUTH_BOUNDARY = Object.freeze({
  documentedNeqImplemented: true as const,
  implementedNeqVerified: true as const,
  verifiedNeqProductionAuthorized: true as const,
  unrunTestCannotBecomePass: true as const,
  gpuClaimRequiresPassTimestampDeviceRuntimeEvidence: true as const,
  npuFallbackCannotBeMislabeledAsNpu: true as const,
  secretsMustNotAppearInLogs: true as const,
  staleHeartbeatPreventsRunningVerified: true as const,
  resourceLimitsRejectOversizedWorkloads: true as const,
  tenantDataCannotCrossUniverseBoundaries: true as const,
  draftTestsDoNotAuthorizeProductionRelease: true as const,
  draftTestsDoNotAuthorizeMainMerge: true as const,
  draftTestsDoNotAuthorizeDbMigration: true as const,
  draftTestsDoNotAuthorizePermissionExpansion: true as const,
  draftTestsDoNotAuthorizeCustomerCommitment: true as const,
  promotedFeaturesKeepCriticalTestsAsRegression: true as const,
  breakMovesVerifiedToRegressedUntilRetest: true as const,
  highImpactReleaseGatesRemainHumanReviewed: true as const,
});

export type AcceptanceCriterion = {
  requirementId: string;
  domain: TestRequirementDomain;
  title: string;
  measurableThreshold: string;
  owner: TestOwner;
  architectureRef: string;
  criticalForRegression: boolean;
};

export type TestEvidenceRecord = {
  testId: string;
  requirementId: string;
  owner: TestOwner;
  environment: string;
  preconditions: string;
  exactInput: string;
  expectedOutput: string;
  measurableThreshold: string;
  commandOrProcedure: string;
  evidenceArtifact: string | null;
  timestamp: string | null;
  result: TestResultState;
  failureClass: FailureClass | null;
  retestState: RetestState;
  deviceRuntime?: string | null;
  domain: TestRequirementDomain;
  criticalForRegression: boolean;
  previouslyVerified: boolean;
};

export type PrototypeArchitectureInput = {
  architectureId: string;
  title: string;
  prototypeKind: string;
  capabilities: readonly string[];
  domains: readonly TestRequirementDomain[];
  ownerDefaults?: Partial<Record<TestRequirementDomain, TestOwner>>;
};

export type AcceptanceSuite = {
  suiteId: string;
  architectureId: string;
  title: string;
  criteria: readonly AcceptanceCriterion[];
  tests: readonly TestEvidenceRecord[];
  generatedAt: string;
  draftOnly: true;
  productionAuthorized: false;
};

export const ACCEPTANCE_TEST_EVIDENCE_CYCLE = [
  'bootstrap',
  'locks_intact',
  'generate_suite_from_architecture',
  'encode_amd_local_inference_scenario',
  'deny_unrun_as_pass',
  'deny_gpu_claim_without_evidence',
  'deny_npu_fallback_mislabeled',
  'deny_secrets_in_logs',
  'stale_heartbeat_blocks_running_verified',
  'resource_limits_reject_oversized',
  'deny_cross_universe_tenant_data',
  'regression_verified_to_regressed_on_break',
  'deny_draft_tests_as_release_auth',
  'l4_autonomy_false',
  'guardian_rls_tenant_universe_isolation',
  'es5_soft_wire',
  'es4_soft_wire',
  'es3_soft_wire',
  'es2_soft_wire',
  'es1_soft_wire',
  'er34_soft_wire',
  'er2_soft_wire',
  'next_phase_documented',
] as const;

export type Es6Hop = (typeof ACCEPTANCE_TEST_EVIDENCE_CYCLE)[number];

export type Es6EvidenceState =
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
  | 'REGISTERED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'UNVERIFIED'
  | 'PARTIAL'
  | 'DEGRADED'
  | 'STALE'
  | 'UNKNOWN'
  | 'REGRESSED'
  | 'BLOCKED';

export type Es6HopRecord = {
  hop: Es6Hop;
  state: Es6EvidenceState;
  summary: string;
  at: string;
};

export type Es6ActorKind =
  | 'acceptance_criteria_generator'
  | 'qa_agent'
  | 'test_executor'
  | 'architecture_composer'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Es6Actor = {
  kind: Es6ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ES6_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_ACCEPTANCE_SUITE_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  UNRUN_TEST_AS_PASS: false as const,
  GPU_CLAIM_WITHOUT_EVIDENCE: false as const,
  NPU_FALLBACK_MISLABEL_AS_NPU: false as const,
  SECRETS_IN_LOGS: false as const,
  STALE_HEARTBEAT_AS_RUNNING_VERIFIED: false as const,
  OVERSIZED_WORKLOAD_WITHOUT_LIMIT: false as const,
  CROSS_UNIVERSE_TENANT_DATA: false as const,
  DRAFT_TESTS_AUTHORIZE_PRODUCTION_RELEASE: false as const,
  DRAFT_TESTS_AUTHORIZE_MAIN_MERGE: false as const,
  DRAFT_TESTS_AUTHORIZE_DB_MIGRATION: false as const,
  DRAFT_TESTS_AUTHORIZE_PERMISSION_EXPANSION: false as const,
  DRAFT_TESTS_AUTHORIZE_CUSTOMER_COMMITMENT: false as const,
  SKIP_REGRESSION_ON_PROMOTED_FEATURE_BREAK: false as const,

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

export const ES6_AGENT_BOUNDS = Object.freeze({
  mayGenerateAcceptanceSuiteFromArchitecture: true as const,
  mayPrepareAndExecuteBoundedTests: true as const,
  mayRecordEvidenceWithTimestamp: true as const,
  mayMarkRegressedOnBreak: true as const,
  mayTreatUnrunAsPass: false as const,
  mayClaimGpuWithoutEvidence: false as const,
  mayAuthorizeProductionFromDraftTests: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
  highImpactReleaseGatesRemainHumanReviewed: true as const,
});

export const ES6_MAY = Object.freeze([
  'generate_acceptance_criteria_and_test_evidence_from_prototype_architecture',
  'track_testId_requirement_owner_environment_preconditions_input_output_threshold_command_evidence_timestamp_result_failure_retest',
  'encode_result_states_PASS_FAIL_PARTIAL_NOT_TESTED_BLOCKED_REGRESSED_STALE',
  'assign_one_accountable_owner_per_test_area',
  'keep_critical_acceptance_tests_as_regression_for_promoted_features',
  'agents_prepare_execute_bounded_tests_only',
] as const);

export const ES6_MUST_NOT = Object.freeze([
  'mark_unrun_test_as_PASS',
  'claim_GPU_support_works_without_PASS_timestamp_device_runtime_evidence',
  'mislable_CPU_or_NPU_fallback_as_NPU_success',
  'log_secrets',
  'treat_stale_heartbeat_as_RUNNING_VERIFIED',
  'allow_oversized_workloads_past_resource_ceilings',
  'allow_tenant_data_to_cross_Universe_boundaries',
  'authorize_production_release_main_merge_db_migration_permission_expansion_or_customer_commitment_from_draft_tests_alone',
  'skip_REGRESSED_when_promoted_feature_breaks',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'grant_agents_automatic_authority_over_high_impact_release_gates',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Es6SoftWireSnapshot = {
  es5PrototypeArchitectureComposer: SoftWirePresence;
  es5Report: SoftWirePresence;
  es4PrototypeScopeGenerator: SoftWirePresence;
  es4Report: SoftWirePresence;
  es3OpportunityScoringEngine: SoftWirePresence;
  es3Report: SoftWirePresence;
  es2ProductHypothesisFactory: SoftWirePresence;
  es2Report: SoftWirePresence;
  es1ResearchToProductCandidateGate: SoftWirePresence;
  es1Report: SoftWirePresence;
  er34CapabilityManifest: SoftWirePresence;
  er34Report: SoftWirePresence;
  er2ApiTruthStateMachine: SoftWirePresence;
  er2Report: SoftWirePresence;
};

export function assertEs6LocksIntact(): boolean {
  return (
    ES6_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ES6_LOCKS.UNRUN_TEST_AS_PASS === false &&
    ES6_LOCKS.GPU_CLAIM_WITHOUT_EVIDENCE === false &&
    ES6_LOCKS.NPU_FALLBACK_MISLABEL_AS_NPU === false &&
    ES6_LOCKS.SECRETS_IN_LOGS === false &&
    ES6_LOCKS.STALE_HEARTBEAT_AS_RUNNING_VERIFIED === false &&
    ES6_LOCKS.OVERSIZED_WORKLOAD_WITHOUT_LIMIT === false &&
    ES6_LOCKS.CROSS_UNIVERSE_TENANT_DATA === false &&
    ES6_LOCKS.DRAFT_TESTS_AUTHORIZE_PRODUCTION_RELEASE === false &&
    ES6_LOCKS.DRAFT_TESTS_AUTHORIZE_MAIN_MERGE === false &&
    ES6_LOCKS.DRAFT_TESTS_AUTHORIZE_DB_MIGRATION === false &&
    ES6_LOCKS.DRAFT_TESTS_AUTHORIZE_PERMISSION_EXPANSION === false &&
    ES6_LOCKS.DRAFT_TESTS_AUTHORIZE_CUSTOMER_COMMITMENT === false &&
    ES6_LOCKS.SKIP_REGRESSION_ON_PROMOTED_FEATURE_BREAK === false &&
    ES6_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ES6_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ES6_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ES6_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ES6_LOCKS.RECOMMEND_EQ_ACT === false &&
    ES6_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ES6_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ES6_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ES6_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ES6_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ES6_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ES6_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ES6_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ES6_LOCKS.TIP_LAND === false &&
    ES6_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ES6_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ES6_LOCKS.FULL_PRODUCTION_ACCEPTANCE_SUITE_SHIPPED === false &&
    ES6_LOCKS.MANAGE_PULL_REQUEST === false &&
    ACCEPTANCE_EVIDENCE_TRUTH_BOUNDARY.unrunTestCannotBecomePass === true &&
    ACCEPTANCE_EVIDENCE_TRUTH_BOUNDARY.gpuClaimRequiresPassTimestampDeviceRuntimeEvidence ===
      true &&
    ACCEPTANCE_EVIDENCE_TRUTH_BOUNDARY.draftTestsDoNotAuthorizeProductionRelease ===
      true &&
    ACCEPTANCE_EVIDENCE_TRUTH_BOUNDARY.breakMovesVerifiedToRegressedUntilRetest ===
      true &&
    ES6_AGENT_BOUNDS.mayTreatUnrunAsPass === false &&
    ES6_AGENT_BOUNDS.mayClaimGpuWithoutEvidence === false &&
    ES6_AGENT_BOUNDS.mayAuthorizeProductionFromDraftTests === false &&
    ES6_AGENT_BOUNDS.automaticAuthority === false &&
    ES6_AGENT_BOUNDS.highImpactReleaseGatesRemainHumanReviewed === true
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

export function es6SoftWireSnapshot(repoRoot?: string): Es6SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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
    es3OpportunityScoringEngine: softWireFile(
      './opportunity-scoring-engine-types.ts',
      'ES3 Opportunity Scoring Engine PRESENT (soft-wire).',
      'ES3 Opportunity Scoring Engine absent — soft-wire WAITING_DATA.',
    ),
    es3Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES3_OPPORTUNITY_SCORING_ENGINE_REPORT.md',
      'ES3 report PRESENT.',
      'ES3 report absent — soft-wire WAITING_DATA.',
    ),
    es2ProductHypothesisFactory: softWireFile(
      './product-hypothesis-factory-types.ts',
      'ES2 Product Hypothesis Factory PRESENT (soft-wire).',
      'ES2 Product Hypothesis Factory absent — soft-wire WAITING_DATA.',
    ),
    es2Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES2_PRODUCT_HYPOTHESIS_FACTORY_REPORT.md',
      'ES2 report PRESENT.',
      'ES2 report absent — soft-wire WAITING_DATA.',
    ),
    es1ResearchToProductCandidateGate: softWireFile(
      './research-to-product-candidate-gate-types.ts',
      'ES1 Research-to-Product Candidate Gate PRESENT (soft-wire).',
      'ES1 Research-to-Product Candidate Gate absent — soft-wire WAITING_DATA.',
    ),
    es1Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES1_RESEARCH_TO_PRODUCT_CANDIDATE_GATE_REPORT.md',
      'ES1 report PRESENT.',
      'ES1 report absent — soft-wire WAITING_DATA.',
    ),
    er34CapabilityManifest: softWireFile(
      './capability-manifest-types.ts',
      'ER34 Capability Manifest PRESENT (soft-wire).',
      'ER34 Capability Manifest absent — soft-wire WAITING_DATA.',
    ),
    er34Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER34_CAPABILITY_MANIFEST_REPORT.md',
      'ER34 report PRESENT.',
      'ER34 report absent — soft-wire WAITING_DATA.',
    ),
    er2ApiTruthStateMachine: softWireFile(
      './api-truth-state-machine-types.ts',
      'ER2 API Truth State Machine PRESENT (soft-wire).',
      'ER2 API Truth State Machine absent — soft-wire WAITING_DATA.',
    ),
    er2Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER2_API_TRUTH_STATE_MACHINE_REPORT.md',
      'ER2 report PRESENT.',
      'ER2 report absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireHopState(present: boolean): Es6EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEs6Agent(actor: Es6Actor): boolean {
  return (
    actor.kind === 'acceptance_criteria_generator' ||
    actor.kind === 'qa_agent' ||
    actor.kind === 'test_executor' ||
    actor.kind === 'architecture_composer'
  );
}

export function isHumanApprover(actor: Es6Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function unrunMayBecomePass(): boolean {
  return !ACCEPTANCE_EVIDENCE_TRUTH_BOUNDARY.unrunTestCannotBecomePass;
}

export function gpuClaimAllowedWithoutEvidence(): boolean {
  return !ACCEPTANCE_EVIDENCE_TRUTH_BOUNDARY.gpuClaimRequiresPassTimestampDeviceRuntimeEvidence;
}

export function draftTestsAuthorizeProduction(): boolean {
  return !ACCEPTANCE_EVIDENCE_TRUTH_BOUNDARY.draftTestsDoNotAuthorizeProductionRelease;
}

/**
 * Evidence rule: PASS requires timestamp + evidence artifact (+ device/runtime
 * when claiming hardware-path success such as GPU).
 */
export function canRecordPass(input: {
  ran: boolean;
  timestamp: string | null | undefined;
  evidenceArtifact: string | null | undefined;
  claimsGpu?: boolean;
  deviceRuntime?: string | null | undefined;
}): boolean {
  if (!input.ran) return false;
  if (!input.timestamp) return false;
  if (!input.evidenceArtifact) return false;
  if (input.claimsGpu === true && !input.deviceRuntime) return false;
  return true;
}

export function defaultOwnerForDomain(domain: TestRequirementDomain): TestOwner {
  switch (domain) {
    case 'permissions_auth':
    case 'guardian_rls':
      return 'Security';
    case 'tenant_universe_isolation':
    case 'data_rights_provenance':
      return 'Data';
    case 'model_runtime_behavior':
    case 'cpu_gpu_npu_routing':
      return 'AI/Model';
    case 'accessibility_ux':
      return 'Product';
    case 'performance':
    case 'reliability':
    case 'rollback_recovery':
    case 'cost_resource_ceilings':
    case 'offline_online_sync':
      return 'Operations';
    case 'functional_behavior':
    case 'agent_behavior':
    case 'api_connectivity':
      return 'Engineering';
    default:
      return 'QA';
  }
}
