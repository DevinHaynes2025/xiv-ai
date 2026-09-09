/**
 * 62L-EM10 — User Access Economy runtime
 *
 * Encodes tiered plans, value/cost gates, custom-terms human approval,
 * experiment metrics schema, and privacy/isolation invariant.
 *
 * Soft-wires #157 affordability when present (dynamic import optional path
 * checked via soft-wire snapshot; local gate always authoritative).
 *
 * recommend ≠ charge/sign. Pricing engine cannot bind XIV legally.
 */

import {
  ACCESS_ECONOMY_TIER_IDS,
  EM10_CORE_RULE,
  EM10_HONESTY_BANNER,
  EM10_LOCKS,
  ENTERPRISE_HIGH_PRICE_USD_PER_MONTH,
  NEXT_PHASE_EM11,
  assertEm10LocksIntact,
  type AccessEconomyPlan,
  type AccessEconomyTierId,
  type CustomTermsRequest,
  type CustomTermsResult,
  type IsolationInvariantCheck,
  type PricingExperimentMetricsSchema,
  type PricingRecommendationOutcome,
  type ValueCostEvidence,
} from './user-access-economy-types';
import { em10SoftWireSnapshot, type Em10SoftWireSnapshot } from './user-access-economy-soft-wire';

const PRIVACY_FLOOR = Object.freeze({
  tenantIsolationRequired: true as const,
  crossTenantDataLeakAllowed: false as const,
  privacyWeakenedByCheaperTier: false as const,
});

/** Canonical access economy catalog — advisory list prices, not live billing. */
export const ACCESS_ECONOMY_CATALOG: readonly AccessEconomyPlan[] = Object.freeze([
  Object.freeze({
    planId: 'free' as const,
    monthlyPrice: 0,
    includedUsers: 1,
    includedAgents: 1,
    computeQuota: Object.freeze({ cpuUnitHours: 8, gpuUnitHours: 0, inferenceTokens: 50_000 }),
    storageQuota: Object.freeze({ gb: 1, privateKnowledgeGb: 0.25 }),
    localOfflineFeatures: Object.freeze([
      'basic_xiv_search',
      'limited_personal_agent',
      'small_local_usage',
    ]),
    connectors: Object.freeze([] as string[]),
    supportLevel: 'community' as const,
    securityFeatures: Object.freeze([
      'baseline_tenant_isolation',
      'personal_scope_default',
    ]),
    dataLocalityOptions: Object.freeze([
      'public_community' as const,
      'personal_private' as const,
    ]),
    overagePolicy: 'hard_cap_deny' as const,
    sla: Object.freeze({
      availabilityTarget: null,
      responseTimeHours: null,
      negotiated: false,
    }),
    upgradePath: 'individual_pro' as const,
    capabilities: Object.freeze([
      'basic_xiv_search',
      'limited_personal_agent',
      'public_community_knowledge',
      'small_local_usage',
    ]),
    privacyIsolationFloor: PRIVACY_FLOOR,
    costToServeBaselineUsd: 2,
  }),
  Object.freeze({
    planId: 'individual_pro' as const,
    monthlyPrice: 29,
    includedUsers: 1,
    includedAgents: 3,
    computeQuota: Object.freeze({ cpuUnitHours: 40, gpuUnitHours: 2, inferenceTokens: 500_000 }),
    storageQuota: Object.freeze({ gb: 25, privateKnowledgeGb: 10 }),
    localOfflineFeatures: Object.freeze([
      'stronger_personal_agents',
      'expanded_local_offline_intelligence',
      'expanded_search',
      'private_knowledge_tools',
    ]),
    connectors: Object.freeze(['personal_calendar_candidate', 'personal_notes_candidate']),
    supportLevel: 'standard_email' as const,
    securityFeatures: Object.freeze([
      'baseline_tenant_isolation',
      'private_knowledge_vault_label',
      'personal_scope_default',
    ]),
    dataLocalityOptions: Object.freeze([
      'public_community' as const,
      'personal_private' as const,
      'tenant_isolated' as const,
    ]),
    overagePolicy: 'soft_throttle_recommend_upgrade' as const,
    sla: Object.freeze({
      availabilityTarget: 0.99,
      responseTimeHours: 48,
      negotiated: false,
    }),
    upgradePath: 'entrepreneur_smb' as const,
    capabilities: Object.freeze([
      'stronger_personal_agents',
      'more_local_offline_intelligence',
      'expanded_search',
      'private_knowledge_tools',
    ]),
    privacyIsolationFloor: PRIVACY_FLOOR,
    costToServeBaselineUsd: 12,
  }),
  Object.freeze({
    planId: 'entrepreneur_smb' as const,
    monthlyPrice: 149,
    includedUsers: 10,
    includedAgents: 15,
    computeQuota: Object.freeze({ cpuUnitHours: 200, gpuUnitHours: 20, inferenceTokens: 2_000_000 }),
    storageQuota: Object.freeze({ gb: 200, privateKnowledgeGb: 50 }),
    localOfflineFeatures: Object.freeze([
      'business_universe',
      'operational_agents',
      'lightweight_integrations',
      'analytics',
      'simulations',
      'team_collaboration',
    ]),
    connectors: Object.freeze([
      'crm_lightweight_candidate',
      'accounting_export_candidate',
      'team_collab_candidate',
    ]),
    supportLevel: 'business_priority' as const,
    securityFeatures: Object.freeze([
      'baseline_tenant_isolation',
      'org_rls_label',
      'role_based_access_label',
    ]),
    dataLocalityOptions: Object.freeze([
      'tenant_isolated' as const,
      'region_pinned' as const,
      'personal_private' as const,
    ]),
    overagePolicy: 'metered_recommend_only' as const,
    sla: Object.freeze({
      availabilityTarget: 0.995,
      responseTimeHours: 24,
      negotiated: false,
    }),
    upgradePath: 'growth_midmarket' as const,
    capabilities: Object.freeze([
      'business_universe',
      'operational_agents',
      'lightweight_integrations',
      'analytics',
      'simulations',
      'team_collaboration',
    ]),
    privacyIsolationFloor: PRIVACY_FLOOR,
    costToServeBaselineUsd: 60,
  }),
  Object.freeze({
    planId: 'growth_midmarket' as const,
    monthlyPrice: 999,
    includedUsers: 50,
    includedAgents: 75,
    computeQuota: Object.freeze({ cpuUnitHours: 1_000, gpuUnitHours: 150, inferenceTokens: 15_000_000 }),
    storageQuota: Object.freeze({ gb: 2_000, privateKnowledgeGb: 500 }),
    localOfflineFeatures: Object.freeze([
      'larger_agent_teams',
      'advanced_workflows',
      'connectors',
      'governance',
      'higher_compute_storage_limits',
    ]),
    connectors: Object.freeze([
      'erp_candidate',
      'identity_sso_candidate',
      'data_warehouse_candidate',
      'workflow_automation_candidate',
    ]),
    supportLevel: 'dedicated_csm' as const,
    securityFeatures: Object.freeze([
      'baseline_tenant_isolation',
      'org_rls_label',
      'governance_controls_label',
      'audit_log_label',
    ]),
    dataLocalityOptions: Object.freeze([
      'tenant_isolated' as const,
      'region_pinned' as const,
      'dedicated_environment' as const,
    ]),
    overagePolicy: 'metered_recommend_only' as const,
    sla: Object.freeze({
      availabilityTarget: 0.999,
      responseTimeHours: 8,
      negotiated: false,
    }),
    upgradePath: 'enterprise' as const,
    capabilities: Object.freeze([
      'larger_agent_teams',
      'higher_compute_storage_limits',
      'advanced_workflows',
      'connectors',
      'governance',
      'priority_support',
    ]),
    privacyIsolationFloor: PRIVACY_FLOOR,
    costToServeBaselineUsd: 350,
  }),
  Object.freeze({
    planId: 'enterprise' as const,
    monthlyPrice: ENTERPRISE_HIGH_PRICE_USD_PER_MONTH,
    includedUsers: 500,
    includedAgents: 500,
    computeQuota: Object.freeze({ cpuUnitHours: 20_000, gpuUnitHours: 5_000, inferenceTokens: 200_000_000 }),
    storageQuota: Object.freeze({ gb: 50_000, privateKnowledgeGb: 10_000 }),
    localOfflineFeatures: Object.freeze([
      'custom_data_isolation',
      'dedicated_environments',
      'premium_integrations',
      'security_controls',
      'negotiated_usage',
    ]),
    connectors: Object.freeze([
      'premium_integration_catalog_candidate',
      'private_link_candidate',
      'siem_export_candidate',
      'scim_provisioning_candidate',
    ]),
    supportLevel: 'premium_sla' as const,
    securityFeatures: Object.freeze([
      'baseline_tenant_isolation',
      'custom_data_isolation',
      'dedicated_environment_controls',
      'security_review_label',
      'sla_backed_support_label',
    ]),
    dataLocalityOptions: Object.freeze([
      'tenant_isolated' as const,
      'region_pinned' as const,
      'dedicated_environment' as const,
      'sovereign_airgap_candidate' as const,
    ]),
    overagePolicy: 'negotiated_custom' as const,
    sla: Object.freeze({
      availabilityTarget: 0.9995,
      responseTimeHours: 1,
      negotiated: true,
    }),
    upgradePath: 'strategic_sovereign' as const,
    capabilities: Object.freeze([
      'custom_data_isolation',
      'dedicated_environments',
      'premium_integrations',
      'slas',
      'security_controls',
      'negotiated_usage',
    ]),
    privacyIsolationFloor: PRIVACY_FLOOR,
    costToServeBaselineUsd: 120_000,
  }),
  Object.freeze({
    planId: 'strategic_sovereign' as const,
    monthlyPrice: 1_000_000,
    includedUsers: 5_000,
    includedAgents: 5_000,
    computeQuota: Object.freeze({
      cpuUnitHours: 200_000,
      gpuUnitHours: 50_000,
      inferenceTokens: 2_000_000_000,
    }),
    storageQuota: Object.freeze({ gb: 500_000, privateKnowledgeGb: 100_000 }),
    localOfflineFeatures: Object.freeze([
      'very_large_custom_deployments',
      'specialized_infrastructure',
      'compliance_programs',
      'long_term_contract_candidates',
    ]),
    connectors: Object.freeze([
      'sovereign_integration_mesh_candidate',
      'airgap_sync_candidate',
      'custom_compliance_connector_candidate',
    ]),
    supportLevel: 'sovereign_dedicated' as const,
    securityFeatures: Object.freeze([
      'baseline_tenant_isolation',
      'sovereign_controls_label',
      'compliance_program_label',
      'dedicated_security_ops_label',
    ]),
    dataLocalityOptions: Object.freeze([
      'dedicated_environment' as const,
      'sovereign_airgap_candidate' as const,
      'region_pinned' as const,
      'tenant_isolated' as const,
    ]),
    overagePolicy: 'negotiated_custom' as const,
    sla: Object.freeze({
      availabilityTarget: 0.9999,
      responseTimeHours: 0.5,
      negotiated: true,
    }),
    upgradePath: null,
    capabilities: Object.freeze([
      'very_large_custom_deployments',
      'specialized_infrastructure',
      'dedicated_support',
      'compliance',
      'long_term_contracts_where_value_justifies',
    ]),
    privacyIsolationFloor: PRIVACY_FLOOR,
    costToServeBaselineUsd: 400_000,
  }),
]);

export function listAccessEconomyPlans(): readonly AccessEconomyPlan[] {
  return ACCESS_ECONOMY_CATALOG;
}

export function getAccessEconomyPlan(planId: AccessEconomyTierId): AccessEconomyPlan {
  const plan = ACCESS_ECONOMY_CATALOG.find((p) => p.planId === planId);
  if (!plan) throw new Error(`UNKNOWN_ACCESS_ECONOMY_PLAN:${planId}`);
  return plan;
}

/** Free tier must retain a non-empty meaningful capability set. */
export function freeTierHasMeaningfulUtility(plan = getAccessEconomyPlan('free')): boolean {
  return (
    plan.planId === 'free' &&
    plan.monthlyPrice === 0 &&
    plan.capabilities.length >= 3 &&
    plan.localOfflineFeatures.length >= 2 &&
    plan.capabilities.includes('basic_xiv_search') &&
    plan.capabilities.includes('limited_personal_agent')
  );
}

/**
 * Reject marketing copy that invents savings / ROI.
 * Savings claims require measured evidence; fabricated language is denied.
 */
export function denyFakeSavingsClaim(input: {
  claimText: string;
  measuredSavingsUsd?: number | null;
}): { allowed: false; reasons: string[] } | { allowed: true; reasons: string[] } {
  const lower = input.claimText.toLowerCase();
  const fakePatterns = [
    /save trillions/i,
    /guaranteed\s+roi/i,
    /will\s+save\s+\$?\d/i,
    /organizations?\s+already\s+save/i,
    /instant\s+roi/i,
    /100%\s+savings/i,
  ];
  if (fakePatterns.some((re) => re.test(input.claimText))) {
    return {
      allowed: false,
      reasons: [
        'Fake savings / guaranteed ROI claim DENIED (EM10_LOCKS.FAKE_SAVINGS_CLAIMS=false).',
        `Claim excerpt: ${input.claimText.slice(0, 120)}`,
      ],
    };
  }
  if (
    (/save|savings|roi/i.test(lower) &&
      (input.measuredSavingsUsd === undefined ||
        input.measuredSavingsUsd === null ||
        Number.isNaN(input.measuredSavingsUsd)))
  ) {
    return {
      allowed: false,
      reasons: [
        'Savings/ROI language without measured evidence DENIED — no fabricated customer ROI.',
      ],
    };
  }
  return {
    allowed: true,
    reasons: ['No fake savings pattern detected; any numeric savings must remain evidence-backed.'],
  };
}

function highPriceRequiresProportionalValue(
  plan: AccessEconomyPlan,
  evidence: ValueCostEvidence,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const highTier =
    plan.planId === 'enterprise' ||
    plan.planId === 'strategic_sovereign' ||
    plan.monthlyPrice >= ENTERPRISE_HIGH_PRICE_USD_PER_MONTH;

  if (!highTier) {
    return { ok: true, reasons: ['Standard tier — proportional value check soft.'] };
  }

  if (evidence.fabricatedRoiClaim !== false) {
    reasons.push('Fabricated ROI claim forbidden.');
    return { ok: false, reasons };
  }
  if (!(evidence.costToServeUsd > 0)) {
    reasons.push('High enterprise pricing requires positive cost-to-serve evidence.');
    return { ok: false, reasons };
  }
  if (!(evidence.measurableCustomerValueUsd > evidence.costToServeUsd)) {
    reasons.push(
      'Measurable customer value must exceed cost-to-serve for high enterprise / sovereign pricing.',
    );
    return { ok: false, reasons };
  }
  if (!(plan.monthlyPrice <= evidence.measurableCustomerValueUsd)) {
    reasons.push(
      `List price $${plan.monthlyPrice}/mo exceeds measurable customer value $${evidence.measurableCustomerValueUsd} — RECOMMENDATION_BLOCKED.`,
    );
    return { ok: false, reasons };
  }
  // Cost-to-serve should be in a plausible band relative to price (prestige-only markup denied).
  if (plan.monthlyPrice > evidence.costToServeUsd * 5 && evidence.measurableCustomerValueUsd < plan.monthlyPrice) {
    reasons.push('Prestige markup without proportional value DENIED.');
    return { ok: false, reasons };
  }
  if (!evidence.evidenceNotes.length) {
    reasons.push('Value/cost justification requires non-empty evidence notes.');
    return { ok: false, reasons };
  }
  return {
    ok: true,
    reasons: [
      `High-tier price justified by cost-to-serve $${evidence.costToServeUsd} and measurable value $${evidence.measurableCustomerValueUsd}.`,
    ],
  };
}

/**
 * Pricing recommendation gate.
 * May recommend; never charge/sign/bind legally.
 * Soft-wires #157 affordability semantics locally (budget + cost-to-serve).
 */
export function recommendAccessPlan(input: {
  planId: AccessEconomyTierId;
  evidence: ValueCostEvidence;
  attemptCharge?: boolean;
  attemptSign?: boolean;
  attemptLegalBind?: boolean;
  savingsClaimText?: string;
}): PricingRecommendationOutcome {
  const plan = getAccessEconomyPlan(input.planId);

  if (input.attemptCharge || EM10_LOCKS.RECOMMEND_EQ_CHARGE) {
    return {
      status: 'RECOMMENDATION_BLOCKED',
      planId: plan.planId,
      monthlyPrice: plan.monthlyPrice,
      charged: false,
      signed: false,
      legallyBinding: false,
      blockCode: 'AUTO_CHARGE_DENIED',
      reasons: ['recommend ≠ charge; AUTO_BILLING=false; pricing engine cannot charge.'],
    };
  }
  if (input.attemptSign || EM10_LOCKS.RECOMMEND_EQ_SIGN) {
    return {
      status: 'RECOMMENDATION_BLOCKED',
      planId: plan.planId,
      monthlyPrice: plan.monthlyPrice,
      charged: false,
      signed: false,
      legallyBinding: false,
      blockCode: 'AUTO_SIGN_DENIED',
      reasons: ['recommend ≠ sign; AUTO_SIGN_CONTRACT=false.'],
    };
  }
  if (input.attemptLegalBind || EM10_LOCKS.PRICING_ENGINE_CAN_BIND_LEGALLY) {
    return {
      status: 'RECOMMENDATION_BLOCKED',
      planId: plan.planId,
      monthlyPrice: plan.monthlyPrice,
      charged: false,
      signed: false,
      legallyBinding: false,
      blockCode: 'LEGAL_BIND_DENIED',
      reasons: ['Pricing engine may recommend; cannot bind XIV legally.'],
    };
  }

  if (input.savingsClaimText) {
    const savings = denyFakeSavingsClaim({
      claimText: input.savingsClaimText,
      measuredSavingsUsd: null,
    });
    if (!savings.allowed) {
      return {
        status: 'RECOMMENDATION_BLOCKED',
        planId: plan.planId,
        monthlyPrice: plan.monthlyPrice,
        charged: false,
        signed: false,
        legallyBinding: false,
        blockCode: 'FAKE_SAVINGS_DENIED',
        reasons: savings.reasons,
      };
    }
  }

  // Soft-wire #157 affordability semantics: budget + cost-to-serve guards.
  const budget = input.evidence.customerBudgetUsd;
  if (budget !== undefined && plan.monthlyPrice > budget) {
    return {
      status: 'RECOMMENDATION_BLOCKED',
      planId: plan.planId,
      monthlyPrice: plan.monthlyPrice,
      charged: false,
      signed: false,
      legallyBinding: false,
      blockCode: 'AFFORDABILITY_DENIED',
      reasons: [
        'Proposed price exceeds customer budget — affordability guard (#157 soft-wire semantics) blocks recommendation.',
      ],
    };
  }
  if (
    plan.monthlyPrice > 0 &&
    input.evidence.costToServeUsd > 0 &&
    plan.monthlyPrice < input.evidence.costToServeUsd
  ) {
    return {
      status: 'RECOMMENDATION_BLOCKED',
      planId: plan.planId,
      monthlyPrice: plan.monthlyPrice,
      charged: false,
      signed: false,
      legallyBinding: false,
      blockCode: 'AFFORDABILITY_DENIED',
      reasons: [
        'Proposed price below cost-to-serve — affordability/margin guard blocks recommendation.',
      ],
    };
  }

  const justified = highPriceRequiresProportionalValue(plan, input.evidence);
  if (!justified.ok) {
    return {
      status: 'RECOMMENDATION_BLOCKED',
      planId: plan.planId,
      monthlyPrice: plan.monthlyPrice,
      charged: false,
      signed: false,
      legallyBinding: false,
      blockCode: 'VALUE_COST_UNJUSTIFIED',
      reasons: justified.reasons,
    };
  }

  const humanApprovalRequired =
    plan.sla.negotiated ||
    plan.planId === 'enterprise' ||
    plan.planId === 'strategic_sovereign' ||
    plan.overagePolicy === 'negotiated_custom';

  return {
    status: 'RECOMMENDATION_ONLY',
    planId: plan.planId,
    monthlyPrice: plan.monthlyPrice,
    charged: false,
    signed: false,
    legallyBinding: false,
    humanApprovalRequired,
    reasons: [
      EM10_CORE_RULE,
      ...justified.reasons,
      'Recommendation only — human decision required before any charge/sign/legal bind.',
    ],
  };
}

/** Contracts, discounts, credits, exclusivity, custom terms → human approval. */
export function requestCustomTerms(input: CustomTermsRequest): CustomTermsResult {
  if (input.attemptAutoBind) {
    return {
      status: 'DENIED',
      approved: false,
      legallyBinding: false,
      charged: false,
      signed: false,
      reasons: [
        'Custom terms cannot auto-bind XIV. PRICING_ENGINE_CAN_BIND_LEGALLY=false; human approval required.',
      ],
    };
  }
  if (!input.humanApproved) {
    return {
      status: 'HUMAN_APPROVAL_REQUIRED',
      approved: false,
      legallyBinding: false,
      charged: false,
      signed: false,
      reasons: [
        `Custom terms kind=${input.kind} requires human approval (contracts/discounts/credits/exclusivity/custom).`,
      ],
    };
  }
  return {
    status: 'HUMAN_APPROVED_ADVISORY',
    approved: true,
    legallyBinding: false,
    charged: false,
    signed: false,
    reasons: [
      'Human approval recorded as advisory only — still not a legal bind / charge / sign from the pricing engine.',
      input.summary,
    ],
  };
}

/**
 * Experiment metrics schema. realizedCustomerRoi stays null unless measured.
 * No fabricated ROI.
 */
export function createPricingExperimentMetrics(input: {
  experimentId: string;
  measured?: Partial<PricingExperimentMetricsSchema['tracked']>;
}): PricingExperimentMetricsSchema {
  const measured = input.measured ?? {};
  return {
    experimentId: input.experimentId,
    tracked: {
      conversion: measured.conversion ?? null,
      retention: measured.retention ?? null,
      grossMargin: measured.grossMargin ?? null,
      supportLoad: measured.supportLoad ?? null,
      computeCostUsd: measured.computeCostUsd ?? null,
      storageCostUsd: measured.storageCostUsd ?? null,
      realizedCustomerRoi: measured.realizedCustomerRoi ?? null,
    },
    fabricatedRoiForbidden: true,
    autoPriceForbidden: true,
    state: Object.values(measured).some((v) => v !== undefined && v !== null)
      ? 'INSTRUMENTED_WAITING_DATA'
      : 'SCHEMA_ONLY',
  };
}

/** Attempt to invent ROI → denied schema mutation. */
export function rejectFabricatedExperimentRoi(
  schema: PricingExperimentMetricsSchema,
  fabricatedRoi: number,
): { ok: false; schema: PricingExperimentMetricsSchema; reason: string } {
  return {
    ok: false,
    schema: {
      ...schema,
      tracked: { ...schema.tracked, realizedCustomerRoi: null },
    },
    reason: `Fabricated ROI ${fabricatedRoi} rejected — realizedCustomerRoi remains null without measured evidence (EM10_LOCKS.FABRICATED_CUSTOMER_ROI=false).`,
  };
}

/**
 * Isolation invariant: no tier may weaken privacy or tenant isolation vs another.
 * All plans share the same privacyIsolationFloor.
 */
export function assertIsolationInvariant(
  planId: AccessEconomyTierId,
  comparedToPlanId: AccessEconomyTierId,
): IsolationInvariantCheck {
  const a = getAccessEconomyPlan(planId);
  const b = getAccessEconomyPlan(comparedToPlanId);
  const reasons: string[] = [];

  if (a.privacyIsolationFloor.crossTenantDataLeakAllowed !== false) {
    reasons.push(`${planId} allows cross-tenant leak — DENIED.`);
  }
  if (b.privacyIsolationFloor.crossTenantDataLeakAllowed !== false) {
    reasons.push(`${comparedToPlanId} allows cross-tenant leak — DENIED.`);
  }
  if (a.privacyIsolationFloor.tenantIsolationRequired !== true) {
    reasons.push(`${planId} missing tenant isolation requirement.`);
  }
  if (b.privacyIsolationFloor.tenantIsolationRequired !== true) {
    reasons.push(`${comparedToPlanId} missing tenant isolation requirement.`);
  }
  if (EM10_LOCKS.TIER_MAY_WEAKEN_PRIVACY) {
    reasons.push('TIER_MAY_WEAKEN_PRIVACY lock must remain false.');
  }
  if (EM10_LOCKS.TIER_MAY_WEAKEN_TENANT_ISOLATION) {
    reasons.push('TIER_MAY_WEAKEN_TENANT_ISOLATION lock must remain false.');
  }

  // Security floor: every plan must include baseline_tenant_isolation.
  if (!a.securityFeatures.includes('baseline_tenant_isolation')) {
    reasons.push(`${planId} missing baseline_tenant_isolation.`);
  }
  if (!b.securityFeatures.includes('baseline_tenant_isolation')) {
    reasons.push(`${comparedToPlanId} missing baseline_tenant_isolation.`);
  }

  const ok = reasons.length === 0;
  return {
    planId,
    comparedToPlanId,
    privacyWeakened: false,
    tenantIsolationWeakened: false,
    ok,
    reasons: ok
      ? [
          'Isolation invariant holds — tiers cannot weaken privacy or tenant isolation; floor identical across catalog.',
        ]
      : reasons,
  };
}

export function assertAllTiersIsolationIntact(): {
  ok: boolean;
  checks: IsolationInvariantCheck[];
} {
  const checks: IsolationInvariantCheck[] = [];
  for (const a of ACCESS_ECONOMY_TIER_IDS) {
    for (const b of ACCESS_ECONOMY_TIER_IDS) {
      checks.push(assertIsolationInvariant(a, b));
    }
  }
  return { ok: checks.every((c) => c.ok), checks };
}

export function em10HonestySnapshot() {
  return {
    banner: EM10_HONESTY_BANNER,
    coreRule: EM10_CORE_RULE,
    l4AutonomyEnabled: EM10_LOCKS.L4_AUTONOMY_ENABLED,
    pricingEngineCanBindLegally: EM10_LOCKS.PRICING_ENGINE_CAN_BIND_LEGALLY,
    recommendEqCharge: EM10_LOCKS.RECOMMEND_EQ_CHARGE,
    recommendEqSign: EM10_LOCKS.RECOMMEND_EQ_SIGN,
    fakeSavingsClaims: EM10_LOCKS.FAKE_SAVINGS_CLAIMS,
    ambitionEqValuation: EM10_LOCKS.AMBITION_EQ_VALUATION,
    nextPhase: NEXT_PHASE_EM11,
    locksIntact: assertEm10LocksIntact(),
  };
}

export function em10SoftWire(): Em10SoftWireSnapshot {
  return em10SoftWireSnapshot();
}

export {
  EM10_CORE_RULE,
  EM10_HONESTY_BANNER,
  EM10_LOCKS,
  ENTERPRISE_HIGH_PRICE_USD_PER_MONTH,
  NEXT_PHASE_EM11,
  ACCESS_ECONOMY_TIER_IDS,
  assertEm10LocksIntact,
};

export type {
  AccessEconomyPlan,
  AccessEconomyTierId,
  CustomTermsRequest,
  CustomTermsResult,
  IsolationInvariantCheck,
  PricingExperimentMetricsSchema,
  PricingRecommendationOutcome,
  ValueCostEvidence,
  Em10SoftWireSnapshot,
};
