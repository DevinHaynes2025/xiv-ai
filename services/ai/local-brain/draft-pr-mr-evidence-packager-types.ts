/**
 * 62L-ES10 — Draft PR/MR Evidence Packager (park-and-implement).
 *
 * Layer: 62L-ES Autonomous Research & Productization Factory.
 * Convert every completed branch change into a review-ready draft PR/MR
 * package so humans can see exactly what changed, what was tested, what
 * remains unverified, and how to roll it back before any merge.
 *
 * Core flow:
 * Branch changes → ES9 review → evidence collection → draft PR/MR description →
 * human review
 *
 * Soft-wire when PRESENT (existsSync): ES9 Automated Code Review / regression
 * gate, ES8 Code Change & Branch Orchestrator, ES6 Acceptance Test Evidence,
 * ES7 Executable Implementation Plan (optional), ES5 Prototype Architecture
 * Composer (optional). Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: 62L-ES family / GitHub SoT unresolved in this environment — no issue
 * number invented. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * May prepare draft review artifacts; cannot merge main, deploy prod, apply
 * prod migrations, expand permissions, provision paid infra, or publish
 * externally. Human-authorized only.
 * Hard truth: never claim "All tests pass" unless every claimed test executed
 * successfully. Prefer per-check honesty.
 * Next (report only): ES11 — Human Review & Promotion Gate.
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
export const GITHUB_SOT_LABEL = '62L-ES10' as const;
export const GITHUB_SOT_FAMILY = '62L-ES' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES10 Draft PR/MR Evidence Packager — branch changes→ES9 review→evidence→draft package→human review; hard-truth verification; merge-boundary locks; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ES10_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ES_LAYER_TITLE =
  '62L-ES Autonomous Research & Productization Factory' as const;

export const NEXT_PHASE_TITLE =
  'ES11 — Human Review & Promotion Gate — human-authorized review and promotion of draft PR/MR packages without auto-merge or production authority.' as const;

/**
 * Draft review package tracking fields (exact set from user story).
 */
export const DRAFT_REVIEW_PACKAGE_FIELDS = [
  'reviewPackageId',
  'repository',
  'sourceBranch',
  'targetBranch',
  'implementationId',
  'prototypeId',
  'summaryOfChanges',
  'filesChanged',
  'architectureImpact',
  'securityImpact',
  'dataPrivacyImpact',
  'dependencyChanges',
  'migrationsProposed',
  'commandsActuallyRun',
  'testResults',
  'benchmarkRuntimeEvidence',
  'regressions',
  'unrunTests',
  'blockers',
  'knownLimitations',
  'rollbackProcedure',
  'reviewersRequired',
  'humanDecisionsRequired',
] as const;

export type DraftReviewPackageField =
  (typeof DRAFT_REVIEW_PACKAGE_FIELDS)[number];

/**
 * Required draft markdown sections (exact).
 */
export const REQUIRED_DRAFT_SECTIONS = [
  'What changed',
  'Why',
  'Security & permissions',
  'Verification actually performed',
  'Not verified',
  'Performance evidence',
  'Data/rights impact',
  'Rollback',
] as const;

export type RequiredDraftSection = (typeof REQUIRED_DRAFT_SECTIONS)[number];

/**
 * Core packaging flow (exact order).
 */
export const DRAFT_PR_MR_CORE_FLOW = [
  'branch_changes',
  'es9_review',
  'evidence_collection',
  'draft_pr_mr_description',
  'human_review',
] as const;

export type DraftPrMrCoreFlowHop = (typeof DRAFT_PR_MR_CORE_FLOW)[number];

/**
 * Per-check verification outcomes — hard truth rule.
 */
export const VERIFICATION_CHECK_STATES = [
  'PASS',
  'FAIL',
  'NOT_TESTED',
  'WAITING_NODE',
  'WAITING_DATA',
  'UNAVAILABLE',
  'BLOCKED',
] as const;

export type VerificationCheckState =
  (typeof VERIFICATION_CHECK_STATES)[number];

export const UNVERIFIED_CHECK_STATES: readonly VerificationCheckState[] = [
  'NOT_TESTED',
  'WAITING_NODE',
  'WAITING_DATA',
  'UNAVAILABLE',
  'BLOCKED',
  'FAIL',
] as const;

export type VerificationCheck = {
  name: string;
  state: VerificationCheckState;
  command?: string;
  summary?: string;
  executed: boolean;
};

export type FileChangeEntry = {
  path: string;
  changeType: 'added' | 'modified' | 'deleted' | 'renamed';
  notes?: string;
};

export type DependencyChange = {
  name: string;
  from?: string;
  to?: string;
  kind: 'added' | 'removed' | 'updated' | 'unchanged';
};

export type MigrationProposal = {
  id: string;
  description: string;
  status: 'MIGRATION_CANDIDATE' | 'NOT_APPLIED' | 'HUMAN_REVIEW_REQUIRED';
  productionApplyAuthorized: false;
};

export type CommandRunRecord = {
  command: string;
  executed: boolean;
  exitCode?: number;
  summary?: string;
};

export type BenchmarkEvidence = {
  name: string;
  measured: boolean;
  value?: string;
  unit?: string;
  note?: string;
};

export type DraftReviewPackage = {
  reviewPackageId: string;
  repository: string;
  sourceBranch: string;
  targetBranch: string;
  implementationId: string;
  prototypeId: string;
  summaryOfChanges: string;
  why: string;
  filesChanged: readonly FileChangeEntry[];
  architectureImpact: string;
  securityImpact: string;
  dataPrivacyImpact: string;
  dependencyChanges: readonly DependencyChange[];
  migrationsProposed: readonly MigrationProposal[];
  commandsActuallyRun: readonly CommandRunRecord[];
  testResults: readonly VerificationCheck[];
  benchmarkRuntimeEvidence: readonly BenchmarkEvidence[];
  regressions: readonly string[];
  unrunTests: readonly string[];
  blockers: readonly string[];
  knownLimitations: readonly string[];
  rollbackProcedure: string;
  reviewersRequired: readonly string[];
  humanDecisionsRequired: readonly string[];
  securityPermissionsNotes: string;
  dataRightsImpact: string;
  packageState: 'DRAFT' | 'READY_FOR_HUMAN_REVIEW' | 'BLOCKED' | 'DENIED';
  l4AutonomyEnabled: false;
  mergeAuthorized: false;
  deployAuthorized: false;
  productionMigrationAuthorized: false;
  permissionExpansionAuthorized: false;
  paidInfraProvisionAuthorized: false;
  externalPublishAuthorized: false;
  allTestsPassClaim: boolean;
  tipLand: false;
  managePullRequest: false;
};

export const DRAFT_PR_MR_EVIDENCE_PACKAGER_CYCLE = [
  'honesty_locks',
  'draft_pr_mr_evidence_packager_bootstrap',
  // A — Structure
  'package_fields_encoded',
  'required_draft_sections_encoded',
  'core_flow_encoded',
  'verification_states_encoded',
  'truth_boundary_encoded',
  // B — Packaging flow
  'collect_branch_changes',
  'attach_es9_review',
  'collect_evidence',
  'build_draft_sections',
  'apply_hard_truth_rule',
  'list_not_verified',
  'deny_false_all_tests_pass',
  'encode_rollback',
  'require_human_reviewers',
  // C — Merge boundary denies
  'deny_merge_main',
  'deny_deploy_prod',
  'deny_apply_prod_migrations',
  'deny_expand_permissions',
  'deny_provision_paid_infra',
  'deny_publish_externally',
  'deny_tip_land',
  'deny_manage_pull_request',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  // D — Autonomy / soft-wires
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  'es9_automated_code_review_soft_wire',
  'es8_code_branch_orchestrator_soft_wire',
  'es7_implementation_plan_soft_wire',
  'es6_acceptance_evidence_soft_wire',
  'es5_prototype_architecture_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Es10Hop =
  (typeof DRAFT_PR_MR_EVIDENCE_PACKAGER_CYCLE)[number];

export type Es10EvidenceState =
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
  | 'WAITING_NODE'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'UNVERIFIED'
  | 'PARTIAL'
  | 'UNKNOWN'
  | 'DRAFT'
  | 'READY_FOR_HUMAN_REVIEW';

export type Es10HopRecord = {
  hop: Es10Hop;
  state: Es10EvidenceState;
  summary: string;
  at: string;
};

export type Es10ActorKind =
  | 'draft_pr_mr_evidence_packager'
  | 'code_review_agent'
  | 'branch_orchestrator'
  | 'acceptance_evidence_agent'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin'
  | 'review_package_owner';

export type Es10Actor = {
  kind: Es10ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ES10_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_DRAFT_PR_MR_PACKAGER_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  MERGE_MAIN: false as const,
  DEPLOY_PROD: false as const,
  APPLY_PROD_MIGRATIONS: false as const,
  EXPAND_PERMISSIONS: false as const,
  PROVISION_PAID_INFRA: false as const,
  PUBLISH_EXTERNALLY: false as const,
  OPEN_REMOTE_PR_MR: false as const,

  FALSE_ALL_TESTS_PASS_CLAIM: false as const,
  CLAIM_UNRUN_AS_PASS: false as const,
  OMIT_NOT_VERIFIED_SECTION: false as const,

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

export const ES10_AGENT_BOUNDS = Object.freeze({
  mayCollectBranchChanges: true as const,
  mayAttachEs9ReviewWhenPresent: true as const,
  mayCollectEvidence: true as const,
  mayBuildDraftPrMrPackage: true as const,
  mayGenerateDraftMarkdown: true as const,
  mayEncodeRollbackProcedure: true as const,
  mayListNotVerifiedHonestly: true as const,
  mayClaimAllTestsPassWhenAnyUnrun: false as const,
  mayMergeMain: false as const,
  mayDeployProd: false as const,
  mayApplyProdMigrations: false as const,
  mayExpandPermissions: false as const,
  mayProvisionPaidInfra: false as const,
  mayPublishExternally: false as const,
  mayOpenRemotePrMr: false as const,
  mayTipLand: false as const,
  mayManagePullRequest: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ES10_MAY = Object.freeze([
  'collect_branch_change_evidence_into_draft_package',
  'attach_es9_review_when_soft_wired',
  'generate_required_draft_markdown_sections',
  'list_unrun_and_blocked_checks_in_not_verified',
  'encode_rollback_and_human_decisions',
  'recommend_human_review_without_merging',
] as const);

export const ES10_MUST_NOT = Object.freeze([
  'claim_all_tests_pass_when_any_check_unrun_or_failed',
  'omit_not_verified_section',
  'merge_to_main',
  'deploy_to_production',
  'apply_production_migrations',
  'expand_permissions',
  'provision_paid_infrastructure',
  'publish_externally',
  'open_remote_pr_or_mr_without_founder_ask',
  'tip_land',
  'manage_pull_request',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'auto_deploy_changes',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export const DRAFT_PR_MR_TRUTH_BOUNDARY = Object.freeze({
  documentedNeqImplemented: true as const,
  implementedNeqVerified: true as const,
  verifiedNeqProductionAuthorized: true as const,
  draftPackageIsNotMerge: true as const,
  draftPackageIsNotDeploy: true as const,
  hardTruthAllTestsPassRequiresEveryCheckExecutedPass: true as const,
  unrunMustAppearInNotVerified: true as const,
  l4AutonomyEnabled: false as const,
  mayTipLand: false as const,
  mayManagePullRequest: false as const,
  mayOpenRemotePrMr: false as const,
});

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Es10SoftWireSnapshot = {
  es9AutomatedCodeReview: SoftWirePresence;
  es9Report: SoftWirePresence;
  es8CodeBranchOrchestrator: SoftWirePresence;
  es8Report: SoftWirePresence;
  es7ImplementationPlan: SoftWirePresence;
  es7Report: SoftWirePresence;
  es6AcceptanceTestEvidence: SoftWirePresence;
  es6Report: SoftWirePresence;
  es5PrototypeArchitectureComposer: SoftWirePresence;
  es5Report: SoftWirePresence;
};

export function assertEs10LocksIntact(): boolean {
  return (
    ES10_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ES10_LOCKS.MERGE_MAIN === false &&
    ES10_LOCKS.DEPLOY_PROD === false &&
    ES10_LOCKS.APPLY_PROD_MIGRATIONS === false &&
    ES10_LOCKS.EXPAND_PERMISSIONS === false &&
    ES10_LOCKS.PROVISION_PAID_INFRA === false &&
    ES10_LOCKS.PUBLISH_EXTERNALLY === false &&
    ES10_LOCKS.OPEN_REMOTE_PR_MR === false &&
    ES10_LOCKS.FALSE_ALL_TESTS_PASS_CLAIM === false &&
    ES10_LOCKS.CLAIM_UNRUN_AS_PASS === false &&
    ES10_LOCKS.OMIT_NOT_VERIFIED_SECTION === false &&
    ES10_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ES10_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ES10_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ES10_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ES10_LOCKS.RECOMMEND_EQ_ACT === false &&
    ES10_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ES10_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ES10_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ES10_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ES10_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ES10_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ES10_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ES10_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ES10_LOCKS.TIP_LAND === false &&
    ES10_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ES10_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ES10_LOCKS.FULL_PRODUCTION_DRAFT_PR_MR_PACKAGER_SHIPPED === false &&
    ES10_LOCKS.MANAGE_PULL_REQUEST === false &&
    DRAFT_PR_MR_TRUTH_BOUNDARY.draftPackageIsNotMerge === true &&
    DRAFT_PR_MR_TRUTH_BOUNDARY.draftPackageIsNotDeploy === true &&
    DRAFT_PR_MR_TRUTH_BOUNDARY.hardTruthAllTestsPassRequiresEveryCheckExecutedPass ===
      true &&
    DRAFT_PR_MR_TRUTH_BOUNDARY.unrunMustAppearInNotVerified === true &&
    DRAFT_PR_MR_TRUTH_BOUNDARY.l4AutonomyEnabled === false &&
    DRAFT_PR_MR_TRUTH_BOUNDARY.mayTipLand === false &&
    DRAFT_PR_MR_TRUTH_BOUNDARY.mayManagePullRequest === false &&
    DRAFT_PR_MR_TRUTH_BOUNDARY.mayOpenRemotePrMr === false
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
  for (const c of candidates) {
    if (c.present) return c;
  }
  return candidates[candidates.length - 1]!;
}

export function es10SoftWireSnapshot(repoRoot?: string): Es10SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    es9AutomatedCodeReview: softWireFirstPresent([
      softWireFile(
        './automated-code-review-types.ts',
        'ES9 Automated Code Review PRESENT (soft-wire).',
        'ES9 Automated Code Review absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './code-review-regression-gate-types.ts',
        'ES9 Code Review Regression Gate PRESENT (soft-wire).',
        'ES9 Code Review Regression Gate absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './automated-code-review-regression-gate-types.ts',
        'ES9 Automated Code Review Regression Gate PRESENT (soft-wire).',
        'ES9 Automated Code Review Regression Gate absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es9Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES9_AUTOMATED_CODE_REVIEW_REPORT.md',
        'ES9 Automated Code Review report PRESENT.',
        'ES9 Automated Code Review report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES9_CODE_REVIEW_REGRESSION_GATE_REPORT.md',
        'ES9 Code Review Regression Gate report PRESENT.',
        'ES9 Code Review Regression Gate report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es8CodeBranchOrchestrator: softWireFirstPresent([
      softWireFile(
        './code-change-branch-orchestrator-types.ts',
        'ES8 Code Change & Branch Orchestrator PRESENT (soft-wire).',
        'ES8 Code Change & Branch Orchestrator absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './code-branch-orchestrator-types.ts',
        'ES8 Code Branch Orchestrator PRESENT (soft-wire).',
        'ES8 Code Branch Orchestrator absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es8Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES8_CODE_CHANGE_BRANCH_ORCHESTRATOR_REPORT.md',
        'ES8 Code Change & Branch Orchestrator report PRESENT.',
        'ES8 Code Change & Branch Orchestrator report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES8_CODE_BRANCH_ORCHESTRATOR_REPORT.md',
        'ES8 Code Branch Orchestrator report PRESENT.',
        'ES8 Code Branch Orchestrator report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es7ImplementationPlan: softWireFile(
      './executable-implementation-plan-generator-types.ts',
      'ES7 Executable Implementation Plan Generator PRESENT (soft-wire).',
      'ES7 Executable Implementation Plan Generator absent — soft-wire WAITING_DATA.',
    ),
    es7Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES7_EXECUTABLE_IMPLEMENTATION_PLAN_GENERATOR_REPORT.md',
        'ES7 Executable Implementation Plan Generator report PRESENT.',
        'ES7 Executable Implementation Plan Generator report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES7_EXECUTABLE_IMPLEMENTATION_PLAN_REPORT.md',
        'ES7 report PRESENT.',
        'ES7 report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es6AcceptanceTestEvidence: softWireFirstPresent([
      softWireFile(
        './acceptance-test-evidence-types.ts',
        'ES6 Acceptance Test Evidence PRESENT (soft-wire).',
        'ES6 Acceptance Test Evidence absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './acceptance-criteria-test-evidence-types.ts',
        'ES6 Acceptance Criteria & Test Evidence PRESENT (soft-wire).',
        'ES6 Acceptance Criteria & Test Evidence absent — soft-wire WAITING_DATA.',
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
        'docs/operations/62L_ES6_ACCEPTANCE_CRITERIA_TEST_EVIDENCE_REPORT.md',
        'ES6 Acceptance Criteria & Test Evidence report PRESENT.',
        'ES6 Acceptance Criteria & Test Evidence report absent — soft-wire WAITING_DATA.',
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
  };
}

export function softWireHopState(present: boolean): Es10EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEs10Agent(actor: Es10Actor): boolean {
  return (
    actor.kind === 'draft_pr_mr_evidence_packager' ||
    actor.kind === 'code_review_agent' ||
    actor.kind === 'branch_orchestrator' ||
    actor.kind === 'acceptance_evidence_agent'
  );
}

export function isHumanApprover(actor: Es10Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin' ||
    actor.kind === 'review_package_owner'
  );
}

/**
 * Hard truth: "All tests pass" only when every check executed and PASSed.
 */
export function canClaimAllTestsPass(
  checks: readonly VerificationCheck[],
): boolean {
  if (checks.length === 0) return false;
  return checks.every((c) => c.executed && c.state === 'PASS');
}

export function listNotVerified(
  checks: readonly VerificationCheck[],
): VerificationCheck[] {
  return checks.filter(
    (c) =>
      !c.executed ||
      UNVERIFIED_CHECK_STATES.includes(c.state) ||
      c.state !== 'PASS',
  );
}

export function listUnrunTests(
  checks: readonly VerificationCheck[],
): string[] {
  return checks
    .filter(
      (c) =>
        !c.executed ||
        c.state === 'NOT_TESTED' ||
        c.state === 'WAITING_NODE' ||
        c.state === 'WAITING_DATA' ||
        c.state === 'UNAVAILABLE' ||
        c.state === 'BLOCKED',
    )
    .map((c) => c.name);
}
