/**
 * 62L-ES27 — Capability Composition Engine (park-and-implement).
 *
 * Layer: 62L-ES Autonomous Research & Productization Factory /
 * Certified Skill Marketplace → Composition.
 *
 * Multiple certified skills compose into larger workflows without losing the
 * permission, evidence, cost, and approval boundaries of the underlying skills.
 *
 * Core flow:
 * User/mission request → capability discovery → skill compatibility check →
 * permission intersection → workflow graph → bounded execution →
 * evidence merge → Home Base
 *
 * Permission rule: composed workflow receives INTERSECTION of allowed
 * permissions, not UNION. Skill A read supplier + Skill B draft contract
 * analysis ≠ contract-signing or payment authority.
 *
 * Soft-wire when PRESENT (existsSync): ES26 Marketplace, ES25 Certification,
 * ES19 Production Boundary, ER16 / Home Base. Presence ≠ VERIFIED.
 * Absent → WAITING_DATA (not FAIL).
 *
 * SoT: 62L-ES family / GitHub SoT unresolved in this environment — no issue
 * number invented. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR / ManagePullRequest.
 * Next (report only): ES28 — Workflow Graph Optimizer.
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
export const GITHUB_SOT_LABEL = '62L-ES27' as const;
export const GITHUB_SOT_FAMILY = '62L-ES' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES27 Capability Composition Engine — permission INTERSECTION; compatibility; PARTIAL/BLOCKED honesty; evidence merge; cost estimate; revocation → REVALIDATION_REQUIRED/BLOCKED; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ES27_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ES_LAYER_TITLE =
  '62L-ES Autonomous Research & Productization Factory / Certified Skill Marketplace → Composition' as const;

export const NEXT_PHASE_TITLE =
  'ES28 — Workflow Graph Optimizer — optimize composed skill graphs for cost, latency, and evidence coverage without expanding permissions or autonomy.' as const;

/**
 * Core composition flow (exact order from user story).
 */
export const CAPABILITY_COMPOSITION_CORE_FLOW = [
  'user_mission_request',
  'capability_discovery',
  'skill_compatibility_check',
  'permission_intersection',
  'workflow_graph',
  'bounded_execution',
  'evidence_merge',
  'home_base',
] as const;

export type CapabilityCompositionCoreFlowHop =
  (typeof CAPABILITY_COMPOSITION_CORE_FLOW)[number];

/**
 * Composition tracking fields (exact set from user story).
 */
export const COMPOSITION_TRACKING_FIELDS = [
  'compositionId',
  'mission',
  'participatingSkills',
  'participatingAgents',
  'tenantUniverse',
  'requiredApisTools',
  'requiredDataClasses',
  'computeRuntimeNeeds',
  'dependencyOrder',
  'costBudget',
  'timeout',
  'approvalCheckpoints',
  'expectedOutputs',
  'evidenceRequirements',
  'fallbackPaths',
  'rollbackRevocationState',
] as const;

export type CompositionTrackingField =
  (typeof COMPOSITION_TRACKING_FIELDS)[number];

/**
 * Composition / skill lifecycle states.
 */
export const COMPOSITION_STATES = [
  'DISCOVERED',
  'COMPATIBILITY_CHECKED',
  'PERMISSIONS_INTERSECTED',
  'GRAPH_BUILT',
  'EXECUTING',
  'PARTIAL',
  'BLOCKED',
  'COMPLETED',
  'REVALIDATION_REQUIRED',
  'REVOKED',
] as const;

export type CompositionState = (typeof COMPOSITION_STATES)[number];

/**
 * Compatibility check dimensions.
 */
export const COMPATIBILITY_CHECKS = [
  'skill_versions_current',
  'data_scopes_compatible',
  'apis_authorized',
  'models_runtimes_available',
  'output_schema_matches_next_input',
  'no_revoked_dependency',
  'cost_resource_ceilings_within_policy',
] as const;

export type CompatibilityCheck = (typeof COMPATIBILITY_CHECKS)[number];

/**
 * Gov contract workflow example stages (proposal candidate only — no bid submit).
 */
export const GOV_CONTRACT_WORKFLOW_STAGES = [
  'opportunity_research',
  'requirement_decomposer',
  'logistics_solution',
  'pricing_scenario',
  'proposal_draft',
  'compliance_review',
] as const;

export type GovContractWorkflowStage =
  (typeof GOV_CONTRACT_WORKFLOW_STAGES)[number];

export const GOV_CONTRACT_EXPECTED_OUTPUTS = [
  'proposal_candidate',
  'evidence',
  'blockers',
  'human_decisions_required',
] as const;

export type GovContractExpectedOutput =
  (typeof GOV_CONTRACT_EXPECTED_OUTPUTS)[number];

/**
 * High-consequence actions that composition must never auto-authorize.
 */
export const FORBIDDEN_COMPOSITION_ACTIONS = [
  'bid_submission',
  'contract_signing',
  'payment_authority',
  'autonomous_cloud_purchasing',
  'budget_expansion',
  'permission_expansion',
  'hidden_tool_chaining',
  'cross_tenant_data_pooling',
  'autonomous_production_changes',
  'fabricate_downstream_results',
] as const;

export type ForbiddenCompositionAction =
  (typeof FORBIDDEN_COMPOSITION_ACTIONS)[number];

export const CAPABILITY_COMPOSITION_TRUTH_BOUNDARY = Object.freeze({
  permissionMode: 'INTERSECTION' as const,
  mayUsePermissionUnion: false as const,
  mayExpandPermissionsBeyondIntersection: false as const,
  maySubmitBids: false as const,
  maySignContracts: false as const,
  mayExercisePaymentAuthority: false as const,
  mayFabricateDownstreamResults: false as const,
  skillFailureYieldsPartialOrBlocked: true as const,
  mustEmitFailureReceiptOnSkillFail: true as const,
  revokedComponentRequiresRevalidationOrBlock: true as const,
  mayAutonomousCloudPurchase: false as const,
  mayExpandBudgetAutonomously: false as const,
  mayHiddenToolChain: false as const,
  mayCrossTenantDataPool: false as const,
  mayAutonomousProductionChange: false as const,
  costEstimateRequiredBeforeLargerWorkflows: true as const,
  evidenceMustPreserveSkillProvenance: true as const,
});

export type SkillPermission =
  | 'read_supplier'
  | 'draft_contract_analysis'
  | 'read_opportunity'
  | 'decompose_requirements'
  | 'draft_logistics'
  | 'draft_pricing_scenario'
  | 'draft_proposal'
  | 'compliance_review'
  | 'contract_signing'
  | 'payment_authority'
  | 'bid_submission'
  | 'cloud_purchase'
  | 'budget_expand';

export type CertifiedSkill = {
  skillId: string;
  name: string;
  version: string;
  versionCurrent: boolean;
  permissions: readonly SkillPermission[];
  dataScopes: readonly string[];
  authorizedApis: readonly string[];
  modelsRuntimes: readonly string[];
  inputSchema: string;
  outputSchema: string;
  revoked: boolean;
  certified: boolean;
  costEstimateUnits: number;
  evidenceRefs: readonly string[];
  testBenchmarkRefs: readonly string[];
};

export type CompositionAgent = {
  agentId: string;
  role: string;
  tenantId: string;
  universeId: string;
};

export type CostEstimate = {
  agentUnits: number;
  modelUnits: number;
  apiUnits: number;
  computeUnits: number;
  storageNetworkUnits: number;
  totalUnits: number;
  withinBudget: boolean;
  autonomousPurchaseAttempted: false;
  budgetExpansionAttempted: false;
};

export type CompatibilityResult = {
  ok: boolean;
  checks: Readonly<Record<CompatibilityCheck, boolean>>;
  blockers: readonly string[];
};

export type SkillEvidenceSlice = {
  skillId: string;
  outputs: readonly string[];
  sourceRefs: readonly string[];
  testBenchmarkRefs: readonly string[];
  uncertainty: string;
  approvalRequirements: readonly string[];
  fabricated: false;
};

export type MergedEvidence = {
  slices: readonly SkillEvidenceSlice[];
  preservesSkillProvenance: true;
  fabricatedDownstream: false;
};

export type FailureReceipt = {
  skillId: string;
  reason: string;
  fallbackAttempted: boolean;
  fabricatedDownstream: false;
};

export type WorkflowComposition = {
  compositionId: string;
  mission: string;
  participatingSkills: readonly CertifiedSkill[];
  participatingAgents: readonly CompositionAgent[];
  tenantId: string;
  universeId: string;
  requiredApisTools: readonly string[];
  requiredDataClasses: readonly string[];
  computeRuntimeNeeds: readonly string[];
  dependencyOrder: readonly string[];
  costBudget: number;
  costEstimate: CostEstimate;
  timeoutMs: number;
  approvalCheckpoints: readonly string[];
  expectedOutputs: readonly string[];
  evidenceRequirements: readonly string[];
  fallbackPaths: readonly string[];
  rollbackRevocationState: 'ACTIVE' | 'REVALIDATION_REQUIRED' | 'BLOCKED' | 'REVOKED';
  intersectedPermissions: readonly SkillPermission[];
  unionWouldHaveIncluded: readonly SkillPermission[];
  permissionMode: 'INTERSECTION';
  state: CompositionState;
  compatibility: CompatibilityResult;
  mergedEvidence: MergedEvidence | null;
  failureReceipt: FailureReceipt | null;
  bidSubmissionAuthorized: false;
  contractSigningAuthorized: false;
  paymentAuthorityAuthorized: false;
  containsHiddenChainOfThought: false;
};

export const CAPABILITY_COMPOSITION_CYCLE = [
  'honesty_locks',
  'capability_composition_bootstrap',
  // A — Structure
  'core_flow_encoded',
  'tracking_fields_encoded',
  'composition_states_encoded',
  'compatibility_checks_encoded',
  'gov_contract_workflow_encoded',
  'forbidden_actions_encoded',
  'truth_boundary_encoded',
  // B — Composition truth
  'permission_intersection_not_union',
  'gov_contract_workflow_no_bid_submit',
  'compatibility_gate',
  'cost_estimate_before_larger_workflow',
  'bounded_execution_partial_on_skill_fail',
  'evidence_merge_preserves_provenance',
  'revocation_propagates_block_or_revalidation',
  // C — Denies
  'deny_permission_union_expansion',
  'deny_bid_submission',
  'deny_contract_signing',
  'deny_payment_authority',
  'deny_fabricate_downstream_results',
  'deny_autonomous_cloud_purchasing',
  'deny_budget_expansion',
  'deny_hidden_tool_chaining',
  'deny_cross_tenant_data_pooling',
  'deny_autonomous_production_changes',
  'deny_hidden_chain_of_thought',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'es_layer_context_documented',
  'es26_marketplace_soft_wire',
  'es25_certification_soft_wire',
  'es19_production_boundary_soft_wire',
  'er16_home_base_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Es27Hop = (typeof CAPABILITY_COMPOSITION_CYCLE)[number];

export type Es27EvidenceState =
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
  | 'BLOCKED'
  | 'REVALIDATION_REQUIRED'
  | 'DEGRADED'
  | 'STALE'
  | 'UNKNOWN';

export type Es27HopRecord = {
  hop: Es27Hop;
  state: Es27EvidenceState;
  summary: string;
  at: string;
};

export type Es27ActorKind =
  | 'capability_composer'
  | 'mission_agent'
  | 'skill_runtime'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Es27Actor = {
  kind: Es27ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ES27_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_COMPOSITION_ENGINE_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,
  AUTO_OPEN_PR: false as const,

  PERMISSION_UNION: false as const,
  PERMISSION_EXPANSION: false as const,
  BID_SUBMISSION: false as const,
  CONTRACT_SIGNING: false as const,
  PAYMENT_AUTHORITY: false as const,
  FABRICATE_DOWNSTREAM_RESULTS: false as const,
  AUTONOMOUS_CLOUD_PURCHASING: false as const,
  BUDGET_EXPANSION: false as const,
  HIDDEN_TOOL_CHAINING: false as const,
  CROSS_TENANT_DATA_POOLING: false as const,
  AUTONOMOUS_PRODUCTION_CHANGES: false as const,
  HIDDEN_CHAIN_OF_THOUGHT: false as const,
  SILENT_SKILL_FAILURE: false as const,

  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
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

export const ES27_AGENT_BOUNDS = Object.freeze({
  mayComposeCertifiedSkillsUnderIntersection: true as const,
  mayRunCompatibilityChecks: true as const,
  mayEstimateCostBeforeLargerWorkflows: true as const,
  mayEmitPartialOrBlockedWithFailureReceipt: true as const,
  mayMergeEvidenceWithSkillProvenance: true as const,
  mayUsePermissionUnion: false as const,
  maySubmitBids: false as const,
  maySignContracts: false as const,
  mayExercisePaymentAuthority: false as const,
  mayFabricateDownstreamResults: false as const,
  mayAutonomousCloudPurchase: false as const,
  mayExpandBudget: false as const,
  mayHiddenToolChain: false as const,
  mayCrossTenantDataPool: false as const,
  mayAutonomousProductionChange: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ES27_MAY = Object.freeze([
  'discover_certified_skills_for_mission',
  'check_skill_compatibility_dimensions',
  'intersect_permissions_across_participating_skills',
  'build_workflow_graph_with_dependency_order',
  'estimate_agent_model_api_compute_storage_network_cost',
  'execute_bounded_composition_with_approval_checkpoints',
  'emit_PARTIAL_or_BLOCKED_with_failure_receipt_on_skill_fail',
  'merge_evidence_preserving_skill_provenance',
  'propagate_revocation_to_REVALIDATION_REQUIRED_or_BLOCKED',
  'return_composition_evidence_to_Home_Base',
] as const);

export const ES27_MUST_NOT = Object.freeze([
  'use_permission_UNION_or_expand_beyond_intersection',
  'submit_bids_sign_contracts_or_exercise_payment_authority',
  'silently_fabricate_downstream_results_after_skill_failure',
  'autonomous_cloud_purchasing_or_budget_expansion',
  'hidden_tool_chaining_or_cross_tenant_data_pooling',
  'autonomous_production_changes_or_high_consequence_actions',
  'package_hidden_chain_of_thought',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
  'enable_L4_autonomy',
] as const);

export function assertEs27LocksIntact(): boolean {
  return (
    ES27_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ES27_LOCKS.PERMISSION_UNION === false &&
    ES27_LOCKS.BID_SUBMISSION === false &&
    ES27_LOCKS.CONTRACT_SIGNING === false &&
    ES27_LOCKS.PAYMENT_AUTHORITY === false &&
    ES27_LOCKS.FABRICATE_DOWNSTREAM_RESULTS === false &&
    ES27_LOCKS.AUTONOMOUS_CLOUD_PURCHASING === false &&
    ES27_LOCKS.BUDGET_EXPANSION === false &&
    ES27_LOCKS.HIDDEN_TOOL_CHAINING === false &&
    ES27_LOCKS.CROSS_TENANT_DATA_POOLING === false &&
    ES27_LOCKS.AUTONOMOUS_PRODUCTION_CHANGES === false &&
    ES27_LOCKS.SILENT_SKILL_FAILURE === false &&
    ES27_LOCKS.TIP_LAND === false &&
    ES27_LOCKS.MANAGE_PULL_REQUEST === false &&
    ES27_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    CAPABILITY_COMPOSITION_TRUTH_BOUNDARY.permissionMode === 'INTERSECTION' &&
    CAPABILITY_COMPOSITION_TRUTH_BOUNDARY.mayUsePermissionUnion === false &&
    CAPABILITY_COMPOSITION_TRUTH_BOUNDARY.mayFabricateDownstreamResults ===
      false
  );
}

export function intersectPermissions(
  skills: readonly CertifiedSkill[],
): SkillPermission[] {
  if (skills.length === 0) return [];
  return skills.reduce<SkillPermission[]>((acc, skill, idx) => {
    if (idx === 0) return [...skill.permissions];
    return acc.filter((p) => skill.permissions.includes(p));
  }, []);
}

export function unionPermissions(
  skills: readonly CertifiedSkill[],
): SkillPermission[] {
  const set = new Set<SkillPermission>();
  for (const skill of skills) {
    for (const p of skill.permissions) set.add(p);
  }
  return [...set];
}

export function permissionModeIsIntersection(): boolean {
  return (
    CAPABILITY_COMPOSITION_TRUTH_BOUNDARY.permissionMode === 'INTERSECTION' &&
    CAPABILITY_COMPOSITION_TRUTH_BOUNDARY.mayUsePermissionUnion === false
  );
}

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Es27SoftWireSnapshot = {
  es26SkillMarketplace: SoftWirePresence;
  es26Report: SoftWirePresence;
  es25SkillCertification: SoftWirePresence;
  es25Report: SoftWirePresence;
  es19ProductionBoundary: SoftWirePresence;
  es19Report: SoftWirePresence;
  er16HomeBase: SoftWirePresence;
  er16HomeBaseReport: SoftWirePresence;
};

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

/** Prefer first PRESENT candidate; else last absent note (WAITING_DATA). */
function softWireFirstPresent(
  candidates: readonly SoftWirePresence[],
): SoftWirePresence {
  for (const c of candidates) {
    if (c.present) return c;
  }
  return candidates[candidates.length - 1]!;
}

/**
 * Soft-wire probes. Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 * Preferred prior tip ES26 Marketplace (when committed); else ES25.
 * Home Base (agent-compute-home-base) often PRESENT on ER34-derived tips.
 */
export function es27SoftWireSnapshot(repoRoot?: string): Es27SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    es26SkillMarketplace: softWireFirstPresent([
      softWireFile(
        './agent-capability-marketplace-types.ts',
        'ES26 Agent Capability Marketplace PRESENT (soft-wire).',
        'ES26 Agent Capability Marketplace absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './skill-marketplace-types.ts',
        'ES26 Skill Marketplace PRESENT (soft-wire).',
        'ES26 Skill Marketplace absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es26Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES26_AGENT_CAPABILITY_MARKETPLACE_REPORT.md',
        'ES26 Agent Capability Marketplace report PRESENT.',
        'ES26 Agent Capability Marketplace report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES26_SKILL_MARKETPLACE_REPORT.md',
        'ES26 Skill Marketplace report PRESENT.',
        'ES26 Skill Marketplace report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es25SkillCertification: softWireFirstPresent([
      softWireFile(
        './skill-certification-types.ts',
        'ES25 Skill Certification PRESENT (soft-wire).',
        'ES25 Skill Certification absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-skill-certification-types.ts',
        'ES25 Agent Skill Certification PRESENT (soft-wire).',
        'ES25 Agent Skill Certification absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './skill-certification-gate-types.ts',
        'ES25 Skill Certification Gate PRESENT (soft-wire).',
        'ES25 Skill Certification Gate absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es25Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES25_SKILL_CERTIFICATION_REPORT.md',
        'ES25 Skill Certification report PRESENT.',
        'ES25 Skill Certification report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES25_AGENT_SKILL_CERTIFICATION_REPORT.md',
        'ES25 Agent Skill Certification report PRESENT.',
        'ES25 Agent Skill Certification report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es19ProductionBoundary: softWireFirstPresent([
      softWireFile(
        './production-boundary-types.ts',
        'ES19 Production Boundary PRESENT (soft-wire).',
        'ES19 Production Boundary absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './post-production-verification-learning-types.ts',
        'ES19/ES20 production verification surface PRESENT (soft-wire).',
        'ES19 Production Boundary absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es19Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES19_PRODUCTION_BOUNDARY_REPORT.md',
        'ES19 Production Boundary report PRESENT.',
        'ES19 Production Boundary report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES20_POST_PRODUCTION_VERIFICATION_LEARNING_REPORT.md',
        'ES20 post-production report PRESENT (ES19 proxy soft-wire).',
        'ES19 Production Boundary report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    er16HomeBase: softWireFirstPresent([
      softWireFile(
        './agent-compute-home-base-types.ts',
        'ER16 / Home Base (agent-compute-home-base) PRESENT (soft-wire).',
        'ER16 / Home Base absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-home-base-types.ts',
        'Home Base contract types PRESENT (soft-wire).',
        'Home Base absent — soft-wire WAITING_DATA.',
      ),
    ]),
    er16HomeBaseReport: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_EM_AGENT_COMPUTE_HOME_BASE_REPORT.md',
        'Home Base report PRESENT.',
        'Home Base report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_EM1_AGENT_HOME_BASE_CONTRACT_REPORT.md',
        'EM1 Home Base contract report PRESENT.',
        'Home Base report absent — soft-wire WAITING_DATA.',
      ),
    ]),
  };
}

export function softWireHopState(present: boolean): Es27EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEs27Agent(actor: Es27Actor): boolean {
  return (
    actor.kind === 'capability_composer' ||
    actor.kind === 'mission_agent' ||
    actor.kind === 'skill_runtime'
  );
}

export function isHumanApprover(actor: Es27Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}
