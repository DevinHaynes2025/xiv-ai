/**
 * 62L-ES1 — Research-to-Product Candidate Gate (park-and-implement).
 *
 * Layer: 62L-ES Autonomous Research & Productization Factory.
 * Starts the ES family: convert validated research into product candidates
 * without jumping straight into production.
 *
 * Core flow:
 * Validated Research → Problem Definition → Product Hypothesis → User/Buyer →
 * Value Case → Prototype Scope → Test Plan → Pricing Hypothesis → Risk Review →
 * Candidate
 *
 * Soft-wire when PRESENT (existsSync): ER40 founder brief, ER18 Research Review
 * Board, ER39 revenue evidence, ER7 Historical Science & Engineering Atlas
 * (quantum classification atlas), EQ16 Software Wormhole Router / routing
 * research, EP7 AMD adapter research path (example workload), EM (#157) Home Base.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: 62L-ES family / GitHub SoT unresolved in this environment — no issue
 * number invented. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ES2 — Product Hypothesis Factory.
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
export const GITHUB_SOT_LABEL = '62L-ES1' as const;
export const GITHUB_SOT_FAMILY = '62L-ES' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES1 Research-to-Product Candidate Gate — validated research→candidate; promotion requirements; quantum status freeze; no auto prod/pricing/contracts; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ES1_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ES_LAYER_TITLE =
  '62L-ES Autonomous Research & Productization Factory' as const;

export const NEXT_PHASE_TITLE =
  'ES2 — Product Hypothesis Factory — structured generation and ranking of product hypotheses from gated research candidates without production authority.' as const;

/**
 * Candidate tracking fields (exact set from user story).
 */
export const PRODUCT_CANDIDATE_FIELDS = [
  'candidateId',
  'sourceResearch',
  'problemBeingSolved',
  'targetUserCustomer',
  'industry',
  'valueHypothesis',
  'requiredData',
  'requiredApis',
  'requiredAgents',
  'requiredComputePath',
  'architectureDependencies',
  'securityPrivacyRequirements',
  'classicalBaseline',
  'quantumStatus',
  'prototypeScope',
  'acceptanceCriteria',
  'estimatedCostToBuild',
  'estimatedCostToServe',
  'pricingHypothesis',
  'measurableSuccessMetrics',
  'owner',
  'blockers',
  'evidenceRefs',
] as const;

export type ProductCandidateField =
  (typeof PRODUCT_CANDIDATE_FIELDS)[number];

/**
 * Required candidate lifecycle states.
 */
export const PRODUCT_CANDIDATE_STATES = [
  'RESEARCH_ONLY',
  'PRODUCT_HYPOTHESIS',
  'SANDBOX_CANDIDATE',
  'PROTOTYPE_READY',
  'TESTING',
  'VALIDATED_CANDIDATE',
  'REJECTED',
  'BLOCKED',
] as const;

export type ProductCandidateState =
  (typeof PRODUCT_CANDIDATE_STATES)[number];

/**
 * Core conversion flow (exact order).
 */
export const RESEARCH_TO_PRODUCT_CORE_FLOW = [
  'validated_research',
  'problem_definition',
  'product_hypothesis',
  'user_buyer',
  'value_case',
  'prototype_scope',
  'test_plan',
  'pricing_hypothesis',
  'risk_review',
  'candidate',
] as const;

export type ResearchToProductCoreFlowHop =
  (typeof RESEARCH_TO_PRODUCT_CORE_FLOW)[number];

/**
 * Promotion requirements — all must pass before SANDBOX_CANDIDATE+.
 */
export const PROMOTION_REQUIREMENTS = [
  'clear_user_problem_fit',
  'lawful_data_rights',
  'reproducible_evidence',
  'defined_security_boundaries',
  'measurable_acceptance_criteria',
  'cost_resource_estimate',
  'rollback_stop_conditions',
  'human_ownership',
] as const;

export type PromotionRequirement = (typeof PROMOTION_REQUIREMENTS)[number];

/**
 * Quantum status (exact). Product marketing must not upgrade this state.
 */
export const QUANTUM_PRODUCT_STATUSES = [
  'THEORETICAL',
  'SIMULATED',
  'QUANTUM_INSPIRED',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type QuantumProductStatus =
  (typeof QUANTUM_PRODUCT_STATUSES)[number];

export function quantumProductStatusRank(
  status: QuantumProductStatus,
): number {
  return QUANTUM_PRODUCT_STATUSES.indexOf(status);
}

export type ComputePathKind = 'CPU' | 'GPU' | 'NPU' | 'QPU' | 'HYBRID';

export type RightsState =
  | 'PUBLIC_DOMAIN'
  | 'OPEN_LICENSE'
  | 'LICENSED'
  | 'AUTHORIZED'
  | 'PRIVATE_ORG_TENANT'
  | 'UNCLEAR'
  | 'RESTRICTED'
  | 'REVOKED'
  | 'LEAKED'
  | 'STOLEN';

export const NON_LAWFUL_RIGHTS: readonly RightsState[] = [
  'UNCLEAR',
  'RESTRICTED',
  'REVOKED',
  'LEAKED',
  'STOLEN',
] as const;

export type PromotionChecklist = {
  clearUserProblemFit: boolean;
  lawfulDataRights: boolean;
  reproducibleEvidence: boolean;
  definedSecurityBoundaries: boolean;
  measurableAcceptanceCriteria: boolean;
  costResourceEstimate: boolean;
  rollbackStopConditions: boolean;
  humanOwnership: boolean;
};

export type ProductCandidate = {
  candidateId: string;
  sourceResearch: string;
  problemBeingSolved: string;
  targetUserCustomer: string;
  industry: string;
  valueHypothesis: string;
  requiredData: readonly string[];
  requiredApis: readonly string[];
  requiredAgents: readonly string[];
  requiredComputePath: readonly ComputePathKind[];
  architectureDependencies: readonly string[];
  securityPrivacyRequirements: readonly string[];
  classicalBaseline: string;
  quantumStatus: QuantumProductStatus | null;
  prototypeScope: string;
  acceptanceCriteria: readonly string[];
  estimatedCostToBuild: string;
  estimatedCostToServe: string;
  pricingHypothesis: string;
  measurableSuccessMetrics: readonly string[];
  owner: string;
  blockers: readonly string[];
  evidenceRefs: readonly string[];
  state: ProductCandidateState;
  rightsState: RightsState;
  rollbackStopConditions: readonly string[];
  supportedHardwareMatrix: readonly string[];
  uxScope: string;
  testPlan: readonly string[];
  researchIsNotProduct: true;
  productIsNotProduction: true;
  l4AutonomyEnabled: false;
  productionReleaseAuthorized: false;
  pricingCommitmentAuthorized: false;
  customerLaunchAuthorized: false;
  contractAuthorized: false;
  cloudPurchaseAuthorized: false;
  permissionExpansionAuthorized: false;
  publicClaimAuthorized: false;
};

export const RESEARCH_TO_PRODUCT_TRUTH_BOUNDARY = Object.freeze({
  researchIsNotProduct: true as const,
  productIsNotProduction: true as const,
  candidateIsNotProductionAuthorized: true as const,
  quantumStatusCannotBeUpgradedByMarketing: true as const,
  incompletePromotionDenied: true as const,
  noAutomaticProductionRelease: true as const,
  noAutomaticPricingCommitment: true as const,
  noAutomaticCustomerLaunch: true as const,
  noAutomaticContract: true as const,
  noAutomaticCloudPurchase: true as const,
  noAutomaticPermissionExpansion: true as const,
  noAutomaticPublicClaim: true as const,
  guardianRlsTenantUniverseIsolationUnchanged: true as const,
  l4AutonomyEnabled: false as const,
  mayTipLand: false as const,
});

export const RESEARCH_TO_PRODUCT_CANDIDATE_GATE_CYCLE = [
  'honesty_locks',
  'research_to_product_candidate_gate_bootstrap',
  // A — Structure
  'candidate_fields_encoded',
  'candidate_states_encoded',
  'core_flow_encoded',
  'promotion_requirements_encoded',
  'quantum_statuses_encoded',
  'truth_boundary_encoded',
  // B — Flow / promotion
  'ingest_validated_research',
  'define_problem',
  'form_product_hypothesis',
  'identify_user_buyer',
  'build_value_case',
  'define_prototype_scope',
  'define_test_plan',
  'form_pricing_hypothesis',
  'risk_review',
  'evaluate_promotion_requirements',
  'deny_incomplete_promotion',
  'promote_to_sandbox_candidate',
  'freeze_quantum_status',
  'deny_quantum_status_upgrade',
  // C — Example scenario
  'amd_local_routing_optimizer_scenario',
  // D — Governance denies
  'deny_auto_production_release',
  'deny_auto_pricing_commitment',
  'deny_auto_customer_launch',
  'deny_auto_contract',
  'deny_auto_cloud_purchase',
  'deny_permission_expansion',
  'deny_public_claim',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  'research_neq_product',
  'product_neq_production',
  // E — Autonomy / soft-wires
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  'er40_founder_brief_soft_wire',
  'er39_revenue_evidence_soft_wire',
  'er18_review_board_soft_wire',
  'er7_science_atlas_soft_wire',
  'eq16_wormhole_soft_wire',
  'ep7_amd_adapter_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Es1Hop =
  (typeof RESEARCH_TO_PRODUCT_CANDIDATE_GATE_CYCLE)[number];

export type Es1EvidenceState =
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
  | 'RESEARCH_ONLY'
  | 'PRODUCT_HYPOTHESIS'
  | 'SANDBOX_CANDIDATE'
  | 'PROTOTYPE_READY'
  | 'TESTING'
  | 'VALIDATED_CANDIDATE';

export type Es1HopRecord = {
  hop: Es1Hop;
  state: Es1EvidenceState;
  summary: string;
  at: string;
};

export type Es1ActorKind =
  | 'research_to_product_gate'
  | 'research_agent'
  | 'product_hypothesis_agent'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin'
  | 'candidate_owner';

export type Es1Actor = {
  kind: Es1ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ES1_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_RESEARCH_TO_PRODUCT_GATE_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  AUTOMATIC_PRODUCTION_RELEASE: false as const,
  AUTOMATIC_PRICING_COMMITMENT: false as const,
  AUTOMATIC_CUSTOMER_LAUNCH: false as const,
  AUTOMATIC_CONTRACT: false as const,
  AUTOMATIC_CLOUD_PURCHASE: false as const,
  AUTOMATIC_PERMISSION_EXPANSION: false as const,
  AUTOMATIC_PUBLIC_CLAIM: false as const,

  QUANTUM_STATUS_MARKETING_UPGRADE: false as const,
  INCOMPLETE_PROMOTION_ALLOWED: false as const,
  RESEARCH_EQ_PRODUCT: false as const,
  PRODUCT_EQ_PRODUCTION: false as const,
  CANDIDATE_EQ_PRODUCTION_AUTHORIZED: false as const,

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

export const ES1_AGENT_BOUNDS = Object.freeze({
  mayIngestValidatedResearch: true as const,
  mayDraftProductHypothesis: true as const,
  mayEvaluatePromotionChecklist: true as const,
  mayPromoteToSandboxWhenComplete: true as const,
  mayRetainExactQuantumStatus: true as const,
  mayUpgradeQuantumStatusViaMarketing: false as const,
  mayPromoteIncompleteCandidate: false as const,
  mayAutoReleaseToProduction: false as const,
  mayCommitPricing: false as const,
  mayLaunchCustomer: false as const,
  maySignContract: false as const,
  mayPurchaseCloud: false as const,
  mayExpandPermissions: false as const,
  mayMakePublicClaim: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ES1_MAY = Object.freeze([
  'ingest_validated_research_as_research_only',
  'walk_core_flow_to_product_hypothesis_and_sandbox_candidate',
  'require_all_promotion_requirements_before_sandbox',
  'retain_exact_quantum_status_without_marketing_upgrade',
  'encode_amd_local_routing_optimizer_scenario_as_test_not_marketing',
  'recommend_candidate_actions_without_acting',
] as const);

export const ES1_MUST_NOT = Object.freeze([
  'promote_incomplete_candidate',
  'upgrade_quantum_status_via_product_marketing',
  'treat_research_as_product',
  'treat_product_candidate_as_production',
  'automatic_production_release',
  'automatic_pricing_commitment',
  'automatic_customer_launch',
  'automatic_contract',
  'automatic_cloud_purchase',
  'automatic_permission_expansion',
  'automatic_public_claim',
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

export type Es1SoftWireSnapshot = {
  er40FounderBrief: SoftWirePresence;
  er40Report: SoftWirePresence;
  er39RevenueEvidence: SoftWirePresence;
  er39Report: SoftWirePresence;
  er18ResearchReviewBoard: SoftWirePresence;
  er18Report: SoftWirePresence;
  er7ScienceEngineeringAtlas: SoftWirePresence;
  er7Report: SoftWirePresence;
  eq16SoftwareWormholeRouter: SoftWirePresence;
  eq16Report: SoftWirePresence;
  ep7AmdAdapterResearchPath: SoftWirePresence;
  ep7Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEs1LocksIntact(): boolean {
  return (
    ES1_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ES1_LOCKS.AUTOMATIC_PRODUCTION_RELEASE === false &&
    ES1_LOCKS.AUTOMATIC_PRICING_COMMITMENT === false &&
    ES1_LOCKS.AUTOMATIC_CUSTOMER_LAUNCH === false &&
    ES1_LOCKS.AUTOMATIC_CONTRACT === false &&
    ES1_LOCKS.AUTOMATIC_CLOUD_PURCHASE === false &&
    ES1_LOCKS.AUTOMATIC_PERMISSION_EXPANSION === false &&
    ES1_LOCKS.AUTOMATIC_PUBLIC_CLAIM === false &&
    ES1_LOCKS.QUANTUM_STATUS_MARKETING_UPGRADE === false &&
    ES1_LOCKS.INCOMPLETE_PROMOTION_ALLOWED === false &&
    ES1_LOCKS.RESEARCH_EQ_PRODUCT === false &&
    ES1_LOCKS.PRODUCT_EQ_PRODUCTION === false &&
    ES1_LOCKS.CANDIDATE_EQ_PRODUCTION_AUTHORIZED === false &&
    ES1_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ES1_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ES1_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ES1_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ES1_LOCKS.RECOMMEND_EQ_ACT === false &&
    ES1_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ES1_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ES1_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ES1_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ES1_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ES1_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ES1_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ES1_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ES1_LOCKS.TIP_LAND === false &&
    ES1_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ES1_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ES1_LOCKS.FULL_PRODUCTION_RESEARCH_TO_PRODUCT_GATE_SHIPPED === false &&
    ES1_LOCKS.MANAGE_PULL_REQUEST === false &&
    RESEARCH_TO_PRODUCT_TRUTH_BOUNDARY.researchIsNotProduct === true &&
    RESEARCH_TO_PRODUCT_TRUTH_BOUNDARY.productIsNotProduction === true &&
    RESEARCH_TO_PRODUCT_TRUTH_BOUNDARY.quantumStatusCannotBeUpgradedByMarketing ===
      true &&
    RESEARCH_TO_PRODUCT_TRUTH_BOUNDARY.l4AutonomyEnabled === false &&
    RESEARCH_TO_PRODUCT_TRUTH_BOUNDARY.mayTipLand === false
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

export function es1SoftWireSnapshot(repoRoot?: string): Es1SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er40FounderBrief: softWireFile(
      './er40-founder-brief-types.ts',
      'ER40 founder brief PRESENT (soft-wire).',
      'ER40 founder brief absent — soft-wire WAITING_DATA.',
    ),
    er40Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER40_FOUNDER_BRIEF_REPORT.md',
      'ER40 report PRESENT.',
      'ER40 report absent — soft-wire WAITING_DATA.',
    ),
    er39RevenueEvidence: softWireFile(
      './revenue-evidence-gate-types.ts',
      'ER39 revenue evidence PRESENT (soft-wire).',
      'ER39 revenue evidence absent — soft-wire WAITING_DATA.',
    ),
    er39Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER39_REVENUE_EVIDENCE_REPORT.md',
      'ER39 report PRESENT.',
      'ER39 report absent — soft-wire WAITING_DATA.',
    ),
    er18ResearchReviewBoard: softWireFile(
      './research-review-board-types.ts',
      'ER18 Research Review Board PRESENT (soft-wire).',
      'ER18 Research Review Board absent — soft-wire WAITING_DATA.',
    ),
    er18Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER18_RESEARCH_REVIEW_BOARD_REPORT.md',
      'ER18 report PRESENT.',
      'ER18 report absent — soft-wire WAITING_DATA.',
    ),
    er7ScienceEngineeringAtlas: softWireFile(
      './historical-science-engineering-atlas-types.ts',
      'ER7 Historical Science & Engineering Atlas PRESENT (soft-wire).',
      'ER7 Historical Science & Engineering Atlas absent — soft-wire WAITING_DATA.',
    ),
    er7Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER7_HISTORICAL_SCIENCE_ENGINEERING_ATLAS_REPORT.md',
      'ER7 report PRESENT.',
      'ER7 report absent — soft-wire WAITING_DATA.',
    ),
    eq16SoftwareWormholeRouter: softWireFile(
      './software-wormhole-router-types.ts',
      'EQ16 Software Wormhole Router PRESENT (soft-wire).',
      'EQ16 Software Wormhole Router absent — soft-wire WAITING_DATA.',
    ),
    eq16Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ16_SOFTWARE_WORMHOLE_ROUTER_REPORT.md',
      'EQ16 report PRESENT.',
      'EQ16 report absent — soft-wire WAITING_DATA.',
    ),
    ep7AmdAdapterResearchPath: softWireFile(
      './amd-adapter-research-path-types.ts',
      'EP7 AMD Adapter Research Path PRESENT (soft-wire).',
      'EP7 AMD Adapter Research Path absent — soft-wire WAITING_DATA.',
    ),
    ep7Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP7_AMD_ADAPTER_RESEARCH_PATH_REPORT.md',
      'EP7 report PRESENT.',
      'EP7 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireHopState(present: boolean): Es1EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEs1Agent(actor: Es1Actor): boolean {
  return (
    actor.kind === 'research_to_product_gate' ||
    actor.kind === 'research_agent' ||
    actor.kind === 'product_hypothesis_agent'
  );
}

export function isHumanApprover(actor: Es1Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin' ||
    actor.kind === 'candidate_owner'
  );
}

export function researchIsNotProduct(): boolean {
  return RESEARCH_TO_PRODUCT_TRUTH_BOUNDARY.researchIsNotProduct;
}

export function productIsNotProduction(): boolean {
  return RESEARCH_TO_PRODUCT_TRUTH_BOUNDARY.productIsNotProduction;
}

export function quantumStatusCannotBeUpgradedByMarketing(): boolean {
  return RESEARCH_TO_PRODUCT_TRUTH_BOUNDARY.quantumStatusCannotBeUpgradedByMarketing;
}

export function allPromotionRequirementsMet(
  checklist: PromotionChecklist,
): boolean {
  return (
    checklist.clearUserProblemFit &&
    checklist.lawfulDataRights &&
    checklist.reproducibleEvidence &&
    checklist.definedSecurityBoundaries &&
    checklist.measurableAcceptanceCriteria &&
    checklist.costResourceEstimate &&
    checklist.rollbackStopConditions &&
    checklist.humanOwnership
  );
}

export function missingPromotionRequirements(
  checklist: PromotionChecklist,
): PromotionRequirement[] {
  const missing: PromotionRequirement[] = [];
  if (!checklist.clearUserProblemFit) missing.push('clear_user_problem_fit');
  if (!checklist.lawfulDataRights) missing.push('lawful_data_rights');
  if (!checklist.reproducibleEvidence) missing.push('reproducible_evidence');
  if (!checklist.definedSecurityBoundaries) {
    missing.push('defined_security_boundaries');
  }
  if (!checklist.measurableAcceptanceCriteria) {
    missing.push('measurable_acceptance_criteria');
  }
  if (!checklist.costResourceEstimate) missing.push('cost_resource_estimate');
  if (!checklist.rollbackStopConditions) {
    missing.push('rollback_stop_conditions');
  }
  if (!checklist.humanOwnership) missing.push('human_ownership');
  return missing;
}
