/**
 * 62L-ER38 — CFO / COO Monetization Council (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * Governed CFO/COO monetization council so XIV can continuously model how to
 * turn APIs, data services, offline brain packs, agent teams, device runtimes,
 * government solutions, and enterprise capabilities into sustainable revenue.
 *
 * Core flow:
 * Usage/cost/value evidence → CFO analysis → COO delivery analysis →
 * pricing scenarios → negotiation strategy → human approval
 *
 * Soft-wire when PRESENT: ER37 federated learning, ER39 revenue evidence gate,
 * ER14 offline packs, ER22 avatars, ER28–32 runtimes as product categories.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Recommendations ≠ commitments.
 * No autonomous pricing send / signing / spend / binding commitments.
 * Revenue projection states kept separate (HYPOTHESIS|FORECAST|CONTRACTED|REALIZED).
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER39 — Revenue Evidence Gate.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER38' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER38 CFO / COO Monetization Council — governed pricing proposals; human approval required; recommendations≠commitments; revenue states separate; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER38_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER39 — Revenue Evidence Gate — gate revenue claims and projection state transitions on actual evidence before REALIZED or “makes money daily” assertions.' as const;

/**
 * Product / monetization analysis categories the council reviews.
 */
export const MONETIZATION_ANALYSIS_CATEGORIES = [
  'subscription_pricing',
  'usage_based_pricing',
  'api_pricing',
  'compute_storage_pricing',
  'premium_data_services',
  'offline_brain_packs',
  'enterprise_knowledge_systems',
  'government_contract_pricing',
  'professional_services',
  'agent_team_packages',
  'device_runtime_licensing',
  'historical_avatar_products',
  'support_sla_tiers',
  'strategic_partnerships',
  'oem_licensing_opportunities',
] as const;

export type MonetizationAnalysisCategory =
  (typeof MONETIZATION_ANALYSIS_CATEGORIES)[number];

/**
 * Soft-wired product category keys (presence drives AVAILABLE vs WAITING_DATA).
 */
export const PRODUCT_CATEGORY_SOFT_WIRES = [
  'offline_brain_packs',
  'historical_avatar_products',
  'universal_runtime_licensing',
  'windows_runtime_licensing',
  'android_arm_runtime_licensing',
  'ios_apple_runtime_licensing',
  'edge_vehicle_runtime_licensing',
] as const;

export type ProductCategorySoftWire =
  (typeof PRODUCT_CATEGORY_SOFT_WIRES)[number];

/**
 * Required pricing proposal tracking fields.
 */
export const PRICING_PROPOSAL_FIELDS = [
  'proposalId',
  'productService',
  'customerSegment',
  'proposedPrice',
  'unitEconomics',
  'computeStorageCost',
  'supportCost',
  'implementationBurden',
  'grossMarginTarget',
  'willingnessToPayEvidence',
  'competitorMarketContext',
  'customerRoiAssumption',
  'discountAuthority',
  'contractLength',
  'renewalAssumptions',
  'risk',
  'approvalState',
] as const;

export type PricingProposalField = (typeof PRICING_PROPOSAL_FIELDS)[number];

/**
 * Pricing proposal approval lifecycle (human gate before binding actions).
 */
export const PRICING_APPROVAL_STATES = [
  'DRAFT',
  'CFO_ANALYZED',
  'COO_ANALYZED',
  'SCENARIOS_READY',
  'NEGOTIATION_STRATEGY_READY',
  'PENDING_HUMAN_APPROVAL',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
] as const;

export type PricingApprovalState = (typeof PRICING_APPROVAL_STATES)[number];

/**
 * Core monetization council flow hops.
 */
export const MONETIZATION_COUNCIL_CORE_FLOW = [
  'usage_cost_value_evidence',
  'cfo_analysis',
  'coo_delivery_analysis',
  'pricing_scenarios',
  'negotiation_strategy',
  'human_approval',
] as const;

export type MonetizationCouncilFlowHop =
  (typeof MONETIZATION_COUNCIL_CORE_FLOW)[number];

/**
 * Pricing ladder (low → high). Very high tiers require measurable justification.
 */
export const PRICING_LADDER = [
  'FREE',
  'INDIVIDUAL',
  'PRO',
  'ENTREPRENEUR',
  'SMALL_BUSINESS',
  'GROWTH',
  'ENTERPRISE',
  'STRATEGIC_GOVERNMENT',
] as const;

export type PricingLadderTier = (typeof PRICING_LADDER)[number];

/** Tiers treated as very high (six-figure monthly possible) — need justification. */
export const HIGH_PRICING_TIERS = [
  'ENTERPRISE',
  'STRATEGIC_GOVERNMENT',
] as const;

export type HighPricingTier = (typeof HIGH_PRICING_TIERS)[number];

/** Consumer / SMB affordability tiers (must also generate lower-cost configs). */
export const AFFORDABLE_TIERS = [
  'FREE',
  'INDIVIDUAL',
  'PRO',
  'ENTREPRENEUR',
  'SMALL_BUSINESS',
] as const;

export type AffordableTier = (typeof AFFORDABLE_TIERS)[number];

/**
 * Daily revenue council brief sections (recommendations only).
 */
export const DAILY_REVENUE_BRIEF_SECTIONS = [
  'pipeline_value',
  'probability_weighted_revenue',
  'renewals',
  'expansion',
  'high_margin_services',
  'low_margin_problem_accounts',
  'government_opportunities',
  'api_usage_trends',
  'compute_storage_costs',
  'pricing_experiments',
  'packaging_changes',
  'partnership_opportunities',
  'productized_consulting_services',
] as const;

export type DailyRevenueBriefSection =
  (typeof DAILY_REVENUE_BRIEF_SECTIONS)[number];

/**
 * Revenue projection truth states — must stay separate.
 */
export const REVENUE_PROJECTION_STATES = [
  'HYPOTHESIS',
  'FORECAST',
  'CONTRACTED',
  'REALIZED',
] as const;

export type RevenueProjectionState =
  (typeof REVENUE_PROJECTION_STATES)[number];

/**
 * High-tier justification dimensions for six-figure / strategic pricing.
 */
export const HIGH_TIER_JUSTIFICATION_DIMENSIONS = [
  'measurable_value',
  'scope',
  'infrastructure',
  'security',
  'support',
  'procurement_fit',
] as const;

export type HighTierJustificationDimension =
  (typeof HIGH_TIER_JUSTIFICATION_DIMENSIONS)[number];

export const MONETIZATION_TRUTH_BOUNDARY = Object.freeze({
  mayClaimMakesMoneyDailyWithoutRevenueEvidence: false as const,
  mayClaimCustomerSavesMillionsWithoutBaselines: false as const,
  mayMergeProjectionStates: false as const,
  hypothesisDistinctFromForecast: true as const,
  forecastDistinctFromContracted: true as const,
  contractedDistinctFromRealized: true as const,
  recommendationsAreNotCommitments: true as const,
  mayAutonomouslySendPricing: false as const,
  mayAutonomouslySignAgreements: false as const,
  mayAutonomouslySpendMoney: false as const,
  mayMakeBindingCommitments: false as const,
  highTierRequiresMeasurableJustification: true as const,
  mustGenerateAffordableConfigs: true as const,
  humanApprovalRequiredBeforeBinding: true as const,
});

export type PricingProposal = {
  proposalId: string;
  productService: MonetizationAnalysisCategory | string;
  customerSegment: string;
  proposedPrice: {
    amount: number;
    currency: string;
    billingPeriod: 'monthly' | 'annual' | 'one_time' | 'usage';
    ladderTier: PricingLadderTier;
  };
  unitEconomics: {
    revenuePerUnit: number;
    variableCostPerUnit: number;
    contributionMargin: number;
  };
  computeStorageCost: number;
  supportCost: number;
  implementationBurden: 'low' | 'medium' | 'high' | 'very_high';
  grossMarginTarget: number;
  willingnessToPayEvidence: readonly string[];
  competitorMarketContext: readonly string[];
  customerRoiAssumption: {
    state: RevenueProjectionState;
    assumedRoiMultiple: number | null;
    beforeAfterBaselinesPresent: boolean;
  };
  discountAuthority: 'none' | 'limited' | 'human_only';
  contractLength: string;
  renewalAssumptions: {
    state: RevenueProjectionState;
    renewalProbability: number | null;
  };
  risk: readonly string[];
  approvalState: PricingApprovalState;
  highTierJustification: {
    required: boolean;
    dimensions: readonly HighTierJustificationDimension[];
    evidenceRefs: readonly string[];
    sixFigureMonthly: boolean;
  } | null;
  affordabilityConfigs: readonly AffordabilityConfig[];
  bindingCommitment: false;
  autonomousSendPricing: false;
  autonomousSign: false;
  autonomousSpend: false;
};

export type AffordabilityConfig = {
  configId: string;
  ladderTier: AffordableTier;
  monthlyPriceCap: number;
  targetSegment: 'consumer' | 'smb';
  reducedScope: readonly string[];
  note: string;
};

export type DailyRevenueBrief = {
  briefId: string;
  generatedAt: string;
  sections: Record<DailyRevenueBriefSection, string>;
  recommendedActions: readonly string[];
  recommendationsAreCommitments: false;
  maySendPricing: false;
  maySignAgreements: false;
  maySpendMoney: false;
  mayMakeBindingCommitments: false;
  revenueClaims: {
    claimsMakesMoneyDaily: false;
    projectionStatesUsed: readonly RevenueProjectionState[];
    realizedRevenueEvidencePresent: boolean;
  };
};

export const CFO_COO_MONETIZATION_COUNCIL_CYCLE = [
  'honesty_locks',
  'monetization_council_bootstrap',
  // A — Structure
  'analysis_categories_encoded',
  'pricing_proposal_fields_encoded',
  'approval_states_encoded',
  'core_flow_encoded',
  'pricing_ladder_encoded',
  'daily_brief_sections_encoded',
  'revenue_projection_states_encoded',
  'truth_boundary_encoded',
  'affordability_rule_encoded',
  'high_tier_justification_encoded',
  // B — Flow
  'ingest_usage_cost_value_evidence',
  'run_cfo_analysis',
  'run_coo_delivery_analysis',
  'generate_pricing_scenarios',
  'generate_affordable_configs',
  'build_negotiation_strategy',
  'require_human_approval',
  'generate_daily_revenue_brief',
  // C — Denies
  'deny_autonomous_send_pricing',
  'deny_autonomous_sign_agreements',
  'deny_autonomous_spend',
  'deny_binding_commitments_without_human',
  'deny_claim_makes_money_daily_without_evidence',
  'deny_claim_millions_savings_without_baselines',
  'deny_merge_projection_states',
  'deny_high_tier_without_justification',
  'deny_treat_recommend_as_commitment',
  'deny_hidden_chain_of_thought',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  'deny_auto_deploy_changes',
  'deny_enable_l4_autonomy',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'er_layer_context_documented',
  'er37_soft_wire',
  'er39_soft_wire',
  'er14_soft_wire',
  'er22_soft_wire',
  'er28_soft_wire',
  'er29_soft_wire',
  'er30_soft_wire',
  'er31_soft_wire',
  'er32_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Er38Hop = (typeof CFO_COO_MONETIZATION_COUNCIL_CYCLE)[number];

export type Er38EvidenceState =
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
  | 'HYPOTHESIS'
  | 'FORECAST'
  | 'CONTRACTED'
  | 'REALIZED';

export type Er38HopRecord = {
  hop: Er38Hop;
  state: Er38EvidenceState;
  summary: string;
  at: string;
};

export type Er38ActorKind =
  | 'cfo_analyst'
  | 'coo_delivery_analyst'
  | 'monetization_council'
  | 'pricing_scenario_builder'
  | 'negotiation_strategist'
  | 'daily_brief_compiler'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er38Actor = {
  kind: Er38ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER38_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_MONETIZATION_COUNCIL_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  AUTONOMOUS_SEND_PRICING: false as const,
  AUTONOMOUS_SIGN_AGREEMENTS: false as const,
  AUTONOMOUS_SPEND_MONEY: false as const,
  AUTONOMOUS_BINDING_COMMITMENTS: false as const,
  RECOMMEND_EQ_COMMITMENT: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,

  CLAIM_MAKES_MONEY_DAILY_WITHOUT_EVIDENCE: false as const,
  CLAIM_MILLIONS_SAVINGS_WITHOUT_BASELINES: false as const,
  MERGE_REVENUE_PROJECTION_STATES: false as const,
  PROMOTE_HYPOTHESIS_TO_REALIZED_WITHOUT_GATE: false as const,
  HIGH_TIER_WITHOUT_JUSTIFICATION: false as const,
  SKIP_AFFORDABLE_CONFIGS: false as const,

  HIDDEN_CHAIN_OF_THOUGHT: false as const,
  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  AUTO_DEPLOY_CHANGES: false as const,
  AGENT_AUTO_AUTHORITY: false as const,
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,

  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_BINDING: true as const,
});

export const ER38_AGENT_BOUNDS = Object.freeze({
  mayAnalyzeUsageCostValueEvidence: true as const,
  mayRunCfoAnalysis: true as const,
  mayRunCooDeliveryAnalysis: true as const,
  mayGeneratePricingScenarios: true as const,
  mayGenerateAffordableConfigs: true as const,
  mayBuildNegotiationStrategy: true as const,
  mayCompileDailyRevenueBrief: true as const,
  mayRecommendActions: true as const,
  mayAutonomouslySendPricing: false as const,
  mayAutonomouslySignAgreements: false as const,
  mayAutonomouslySpendMoney: false as const,
  mayMakeBindingCommitments: false as const,
  mayClaimMakesMoneyDailyWithoutEvidence: false as const,
  mayClaimMillionsSavingsWithoutBaselines: false as const,
  mayMergeProjectionStates: false as const,
  mayApproveOwnPricingProposal: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ER38_MAY = Object.freeze([
  'ingest_usage_cost_value_evidence_for_pricing_models',
  'run_cfo_unit_economics_and_margin_analysis',
  'run_coo_delivery_implementation_burden_analysis',
  'generate_pricing_scenarios_across_ladder_tiers',
  'generate_lower_cost_affordability_configs_for_consumers_and_smbs',
  'require_high_tier_justification_for_enterprise_strategic_six_figure',
  'build_negotiation_strategy_recommendations',
  'compile_daily_revenue_council_brief_with_recommendations_only',
  'keep_HYPOTHESIS_FORECAST_CONTRACTED_REALIZED_states_separate',
  'require_human_approval_before_any_binding_pricing_or_commercial_action',
] as const);

export const ER38_MUST_NOT = Object.freeze([
  'autonomously_send_pricing_to_customers',
  'autonomously_sign_agreements',
  'autonomously_spend_money',
  'make_binding_commitments_without_human_approval',
  'treat_recommendations_as_commitments',
  'claim_XIV_makes_money_daily_without_actual_revenue_evidence',
  'claim_customers_save_millions_or_billions_without_before_after_baselines',
  'merge_or_collapse_HYPOTHESIS_FORECAST_CONTRACTED_REALIZED_states',
  'promote_HYPOTHESIS_to_REALIZED_without_ER39_evidence_gate',
  'approve_high_tier_six_figure_pricing_without_measurable_justification',
  'skip_affordable_consumer_smb_configurations',
  'store_hidden_chain_of_thought',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'auto_deploy_changes',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
  'enable_l4_autonomy',
] as const);

/** Six-figure monthly threshold (USD) requiring high-tier justification. */
export const SIX_FIGURE_MONTHLY_USD = 100_000 as const;

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er38SoftWireSnapshot = {
  er37FederatedLearning: SoftWirePresence;
  er37Report: SoftWirePresence;
  er39RevenueEvidenceGate: SoftWirePresence;
  er39Report: SoftWirePresence;
  er14OfflineBrainPackager: SoftWirePresence;
  er14Report: SoftWirePresence;
  er22HistoricalAvatar: SoftWirePresence;
  er22Report: SoftWirePresence;
  er28UniversalRuntime: SoftWirePresence;
  er28Report: SoftWirePresence;
  er29WindowsRuntime: SoftWirePresence;
  er29Report: SoftWirePresence;
  er30AndroidArmRuntime: SoftWirePresence;
  er30Report: SoftWirePresence;
  er31IosAppleRuntime: SoftWirePresence;
  er31Report: SoftWirePresence;
  er32EdgeVehicleRuntime: SoftWirePresence;
  er32Report: SoftWirePresence;
};

export function assertEr38LocksIntact(): boolean {
  return (
    ER38_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER38_LOCKS.AUTONOMOUS_SEND_PRICING === false &&
    ER38_LOCKS.AUTONOMOUS_SIGN_AGREEMENTS === false &&
    ER38_LOCKS.AUTONOMOUS_SPEND_MONEY === false &&
    ER38_LOCKS.AUTONOMOUS_BINDING_COMMITMENTS === false &&
    ER38_LOCKS.RECOMMEND_EQ_COMMITMENT === false &&
    ER38_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER38_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER38_LOCKS.CLAIM_MAKES_MONEY_DAILY_WITHOUT_EVIDENCE === false &&
    ER38_LOCKS.CLAIM_MILLIONS_SAVINGS_WITHOUT_BASELINES === false &&
    ER38_LOCKS.MERGE_REVENUE_PROJECTION_STATES === false &&
    ER38_LOCKS.PROMOTE_HYPOTHESIS_TO_REALIZED_WITHOUT_GATE === false &&
    ER38_LOCKS.HIGH_TIER_WITHOUT_JUSTIFICATION === false &&
    ER38_LOCKS.SKIP_AFFORDABLE_CONFIGS === false &&
    ER38_LOCKS.HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER38_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER38_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER38_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER38_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER38_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER38_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER38_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER38_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER38_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER38_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER38_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER38_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_BINDING === true &&
    ER38_LOCKS.TIP_LAND === false &&
    ER38_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER38_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER38_LOCKS.FULL_PRODUCTION_MONETIZATION_COUNCIL_SHIPPED === false &&
    ER38_LOCKS.MANAGE_PULL_REQUEST === false &&
    MONETIZATION_TRUTH_BOUNDARY.mayClaimMakesMoneyDailyWithoutRevenueEvidence ===
      false &&
    MONETIZATION_TRUTH_BOUNDARY.mayClaimCustomerSavesMillionsWithoutBaselines ===
      false &&
    MONETIZATION_TRUTH_BOUNDARY.mayMergeProjectionStates === false &&
    MONETIZATION_TRUTH_BOUNDARY.recommendationsAreNotCommitments === true &&
    MONETIZATION_TRUTH_BOUNDARY.mayAutonomouslySendPricing === false &&
    MONETIZATION_TRUTH_BOUNDARY.mayAutonomouslySignAgreements === false &&
    MONETIZATION_TRUTH_BOUNDARY.mayAutonomouslySpendMoney === false &&
    MONETIZATION_TRUTH_BOUNDARY.mayMakeBindingCommitments === false &&
    MONETIZATION_TRUTH_BOUNDARY.highTierRequiresMeasurableJustification ===
      true &&
    MONETIZATION_TRUTH_BOUNDARY.mustGenerateAffordableConfigs === true &&
    MONETIZATION_TRUTH_BOUNDARY.humanApprovalRequiredBeforeBinding === true &&
    ER38_AGENT_BOUNDS.mayAutonomouslySendPricing === false &&
    ER38_AGENT_BOUNDS.mayMakeBindingCommitments === false &&
    ER38_AGENT_BOUNDS.automaticAuthority === false
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

export function er38SoftWireSnapshot(repoRoot?: string): Er38SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er37FederatedLearning: softWireFile(
      './federated-learning-research-candidate-types.ts',
      'ER37 Federated Learning Research Candidate PRESENT (soft-wire).',
      'ER37 Federated Learning Research Candidate absent — soft-wire WAITING_DATA.',
    ),
    er37Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER37_FEDERATED_LEARNING_RESEARCH_CANDIDATE_REPORT.md',
      'ER37 report PRESENT (soft-wire).',
      'ER37 report absent — soft-wire WAITING_DATA.',
    ),
    er39RevenueEvidenceGate: softWireFile(
      './revenue-evidence-gate-types.ts',
      'ER39 Revenue Evidence Gate PRESENT (soft-wire).',
      'ER39 Revenue Evidence Gate absent — soft-wire WAITING_DATA.',
    ),
    er39Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER39_REVENUE_EVIDENCE_GATE_REPORT.md',
      'ER39 report PRESENT (soft-wire).',
      'ER39 report absent — soft-wire WAITING_DATA.',
    ),
    er14OfflineBrainPackager: softWireFile(
      './offline-brain-packager-types.ts',
      'ER14 Offline Brain Packager PRESENT (product category soft-wire).',
      'ER14 Offline Brain Packager absent — soft-wire WAITING_DATA.',
    ),
    er14Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER14_OFFLINE_BRAIN_PACKAGER_REPORT.md',
      'ER14 report PRESENT (soft-wire).',
      'ER14 report absent — soft-wire WAITING_DATA.',
    ),
    er22HistoricalAvatar: softWireFile(
      './historical-avatar-contract-types.ts',
      'ER22 Historical Avatar Contract PRESENT (product category soft-wire).',
      'ER22 Historical Avatar Contract absent — soft-wire WAITING_DATA.',
    ),
    er22Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER22_HISTORICAL_AVATAR_CONTRACT_REPORT.md',
      'ER22 report PRESENT (soft-wire).',
      'ER22 report absent — soft-wire WAITING_DATA.',
    ),
    er28UniversalRuntime: softWireFile(
      './universal-runtime-package-contract-types.ts',
      'ER28 Universal Runtime Package Contract PRESENT (product category soft-wire).',
      'ER28 Universal Runtime Package Contract absent — soft-wire WAITING_DATA.',
    ),
    er28Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER28_UNIVERSAL_RUNTIME_PACKAGE_CONTRACT_REPORT.md',
      'ER28 report PRESENT (soft-wire).',
      'ER28 report absent — soft-wire WAITING_DATA.',
    ),
    er29WindowsRuntime: softWireFile(
      './windows-runtime-package-candidate-types.ts',
      'ER29 Windows Runtime Package Candidate PRESENT (product category soft-wire).',
      'ER29 Windows Runtime Package Candidate absent — soft-wire WAITING_DATA.',
    ),
    er29Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER29_WINDOWS_RUNTIME_PACKAGE_CANDIDATE_REPORT.md',
      'ER29 report PRESENT (soft-wire).',
      'ER29 report absent — soft-wire WAITING_DATA.',
    ),
    er30AndroidArmRuntime: softWireFile(
      './android-arm-runtime-package-types.ts',
      'ER30 Android/ARM Runtime Package PRESENT (product category soft-wire).',
      'ER30 Android/ARM Runtime Package absent — soft-wire WAITING_DATA.',
    ),
    er30Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER30_ANDROID_ARM_RUNTIME_PACKAGE_CANDIDATE_REPORT.md',
      'ER30 report PRESENT (soft-wire).',
      'ER30 report absent — soft-wire WAITING_DATA.',
    ),
    er31IosAppleRuntime: softWireFile(
      './ios-apple-runtime-research-candidate-types.ts',
      'ER31 iOS/Apple Runtime Research Candidate PRESENT (product category soft-wire).',
      'ER31 iOS/Apple Runtime Research Candidate absent — soft-wire WAITING_DATA.',
    ),
    er31Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER31_IOS_APPLE_RUNTIME_RESEARCH_CANDIDATE_REPORT.md',
      'ER31 report PRESENT (soft-wire).',
      'ER31 report absent — soft-wire WAITING_DATA.',
    ),
    er32EdgeVehicleRuntime: softWireFile(
      './edge-vehicle-runtime-candidate-types.ts',
      'ER32 Edge/Vehicle Runtime Candidate PRESENT (product category soft-wire).',
      'ER32 Edge/Vehicle Runtime Candidate absent — soft-wire WAITING_DATA.',
    ),
    er32Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER32_EDGE_VEHICLE_RUNTIME_CANDIDATE_REPORT.md',
      'ER32 report PRESENT (soft-wire).',
      'ER32 report absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireHopState(
  presence: SoftWirePresence,
): 'PASS' | 'WAITING_DATA' {
  return presence.present ? 'PASS' : 'WAITING_DATA';
}

export function isEr38Agent(actor: Er38Actor): boolean {
  return (
    actor.kind === 'cfo_analyst' ||
    actor.kind === 'coo_delivery_analyst' ||
    actor.kind === 'monetization_council' ||
    actor.kind === 'pricing_scenario_builder' ||
    actor.kind === 'negotiation_strategist' ||
    actor.kind === 'daily_brief_compiler' ||
    actor.kind === 'proposal' ||
    actor.kind === 'home_base'
  );
}

export function isHumanApprover(actor: Er38Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin' ||
    actor.permissions.includes('approve_consequential') ||
    actor.permissions.includes('approve_pricing')
  );
}

export function isHighPricingTier(tier: PricingLadderTier): boolean {
  return (HIGH_PRICING_TIERS as readonly string[]).includes(tier);
}

export function requiresHighTierJustification(input: {
  ladderTier: PricingLadderTier;
  monthlyAmountUsd: number;
}): boolean {
  return (
    isHighPricingTier(input.ladderTier) ||
    input.monthlyAmountUsd >= SIX_FIGURE_MONTHLY_USD
  );
}

export function projectionStatesAreSeparate(): boolean {
  return (
    MONETIZATION_TRUTH_BOUNDARY.mayMergeProjectionStates === false &&
    MONETIZATION_TRUTH_BOUNDARY.hypothesisDistinctFromForecast === true &&
    MONETIZATION_TRUTH_BOUNDARY.forecastDistinctFromContracted === true &&
    MONETIZATION_TRUTH_BOUNDARY.contractedDistinctFromRealized === true
  );
}

export function mayClaimMakesMoneyDaily(hasRealizedEvidence: boolean): boolean {
  if (!hasRealizedEvidence) return false;
  return MONETIZATION_TRUTH_BOUNDARY.mayClaimMakesMoneyDailyWithoutRevenueEvidence
    ? true
    : hasRealizedEvidence;
}
