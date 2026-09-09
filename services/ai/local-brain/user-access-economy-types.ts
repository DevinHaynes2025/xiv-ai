/**
 * 62L-EM10 — User Access Economy types
 *
 * Tiered access model: Free → Individual Pro → Entrepreneur/SMB →
 * Growth/Mid-Market → Enterprise → Strategic/Sovereign.
 *
 * Core rule: Price follows measurable value and cost-to-serve, not prestige alone.
 * Soft-wire #157 affordability / CFO council when present.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * L4_AUTONOMY_ENABLED=false — recommend ≠ charge/sign; cannot bind XIV legally.
 * No tip-land / PR / ManagePullRequest / fake savings / privacy weakened by tier.
 */

export const EM10_HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const EM10_CORE_RULE =
  'Price should follow measurable value and cost-to-serve, not prestige alone.' as const;

export const EM10_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  MANAGE_PULL_REQUEST: false as const,
  /** Pricing engine may recommend; cannot bind XIV legally. */
  PRICING_ENGINE_CAN_BIND_LEGALLY: false as const,
  RECOMMEND_EQ_CHARGE: false as const,
  RECOMMEND_EQ_SIGN: false as const,
  AUTO_BILLING: false as const,
  AUTO_SIGN_CONTRACT: false as const,
  FAKE_SAVINGS_CLAIMS: false as const,
  /** Higher-paying tiers must not weaken privacy or tenant isolation. */
  TIER_MAY_WEAKEN_PRIVACY: false as const,
  TIER_MAY_WEAKEN_TENANT_ISOLATION: false as const,
  FABRICATED_CUSTOMER_ROI: false as const,
  AMBITION_EQ_VALUATION: false as const,
  HUMAN_APPROVAL_REQUIRED_FOR_CUSTOM_TERMS: true as const,
  HUMAN_APPROVAL_REQUIRED_FOR_CONTRACTS: true as const,
  HUMAN_APPROVAL_REQUIRED_FOR_DISCOUNTS_CREDITS_EXCLUSIVITY: true as const,
});

export const NEXT_PHASE_EM11 =
  'EM11 — Pricing Catalog Contract — formally define every service, quota, overage, support level, privacy option, and cost basis used by CFO/accountant pricing agents.' as const;

export const ENTERPRISE_HIGH_PRICE_USD_PER_MONTH = 300_000 as const;

/** Access economy tiers (encoded). */
export const ACCESS_ECONOMY_TIER_IDS = [
  'free',
  'individual_pro',
  'entrepreneur_smb',
  'growth_midmarket',
  'enterprise',
  'strategic_sovereign',
] as const;

export type AccessEconomyTierId = (typeof ACCESS_ECONOMY_TIER_IDS)[number];

export type SupportLevel =
  | 'community'
  | 'standard_email'
  | 'business_priority'
  | 'dedicated_csm'
  | 'premium_sla'
  | 'sovereign_dedicated';

export type OveragePolicy =
  | 'hard_cap_deny'
  | 'soft_throttle_recommend_upgrade'
  | 'metered_recommend_only'
  | 'negotiated_custom';

export type DataLocalityOption =
  | 'public_community'
  | 'personal_private'
  | 'tenant_isolated'
  | 'region_pinned'
  | 'dedicated_environment'
  | 'sovereign_airgap_candidate';

/**
 * Required plan fields (EM10 contract).
 * localOfflineFeatures encodes local/offlineFeatures from the user story.
 */
export type AccessEconomyPlan = {
  planId: AccessEconomyTierId;
  monthlyPrice: number;
  includedUsers: number;
  includedAgents: number;
  computeQuota: {
    cpuUnitHours: number;
    gpuUnitHours: number;
    inferenceTokens: number;
  };
  storageQuota: {
    gb: number;
    privateKnowledgeGb: number;
  };
  localOfflineFeatures: readonly string[];
  connectors: readonly string[];
  supportLevel: SupportLevel;
  securityFeatures: readonly string[];
  dataLocalityOptions: readonly DataLocalityOption[];
  overagePolicy: OveragePolicy;
  sla: {
    availabilityTarget: number | null;
    responseTimeHours: number | null;
    negotiated: boolean;
  };
  upgradePath: AccessEconomyTierId | null;
  /** Non-empty capability labels — Free must remain meaningful. */
  capabilities: readonly string[];
  /** Minimum privacy / isolation floor — never weakened by cheaper tiers relative to paid. */
  privacyIsolationFloor: {
    tenantIsolationRequired: true;
    crossTenantDataLeakAllowed: false;
    privacyWeakenedByCheaperTier: false;
  };
  /** Advisory cost-to-serve baseline used by value/cost gates (not a live bill). */
  costToServeBaselineUsd: number;
};

export type ValueCostEvidence = {
  costToServeUsd: number;
  measurableCustomerValueUsd: number;
  /** Optional customer budget for affordability soft-wire. */
  customerBudgetUsd?: number;
  evidenceNotes: readonly string[];
  /** Must be measured/estimated facts — never fabricated ROI claims. */
  fabricatedRoiClaim: false;
};

export type PricingRecommendationOutcome =
  | {
      status: 'RECOMMENDATION_ONLY';
      planId: AccessEconomyTierId;
      monthlyPrice: number;
      charged: false;
      signed: false;
      legallyBinding: false;
      humanApprovalRequired: boolean;
      reasons: string[];
    }
  | {
      status: 'RECOMMENDATION_BLOCKED';
      planId: AccessEconomyTierId;
      monthlyPrice: number;
      charged: false;
      signed: false;
      legallyBinding: false;
      blockCode:
        | 'VALUE_COST_UNJUSTIFIED'
        | 'AFFORDABILITY_DENIED'
        | 'FAKE_SAVINGS_DENIED'
        | 'AUTO_CHARGE_DENIED'
        | 'AUTO_SIGN_DENIED'
        | 'LEGAL_BIND_DENIED'
        | 'PRIVACY_WEAKEN_DENIED'
        | 'CUSTOM_TERMS_NEED_HUMAN';
      reasons: string[];
    };

export type CustomTermsKind =
  | 'contract'
  | 'discount'
  | 'credit'
  | 'exclusivity'
  | 'custom_sla'
  | 'custom_data_locality'
  | 'negotiated_usage';

export type CustomTermsRequest = {
  planId: AccessEconomyTierId;
  kind: CustomTermsKind;
  summary: string;
  humanApproved: boolean;
  attemptAutoBind?: boolean;
};

export type CustomTermsResult =
  | {
      status: 'HUMAN_APPROVAL_REQUIRED';
      approved: false;
      legallyBinding: false;
      charged: false;
      signed: false;
      reasons: string[];
    }
  | {
      status: 'HUMAN_APPROVED_ADVISORY';
      approved: true;
      legallyBinding: false;
      charged: false;
      signed: false;
      reasons: string[];
    }
  | {
      status: 'DENIED';
      approved: false;
      legallyBinding: false;
      charged: false;
      signed: false;
      reasons: string[];
    };

/**
 * Pricing experiment metrics schema — track only; no fabricated ROI values.
 * realizedCustomerRoi is a metric slot (nullable), never invented.
 */
export type PricingExperimentMetricsSchema = {
  experimentId: string;
  tracked: {
    conversion: number | null;
    retention: number | null;
    grossMargin: number | null;
    supportLoad: number | null;
    computeCostUsd: number | null;
    storageCostUsd: number | null;
    /** Metric schema slot only — must remain null unless measured evidence supplied. */
    realizedCustomerRoi: number | null;
  };
  fabricatedRoiForbidden: true;
  autoPriceForbidden: true;
  state: 'SCHEMA_ONLY' | 'INSTRUMENTED_WAITING_DATA';
};

export type IsolationInvariantCheck = {
  planId: AccessEconomyTierId;
  comparedToPlanId: AccessEconomyTierId;
  privacyWeakened: false;
  tenantIsolationWeakened: false;
  ok: boolean;
  reasons: string[];
};

export function assertEm10LocksIntact(): boolean {
  return (
    EM10_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EM10_LOCKS.TIP_LAND === false &&
    EM10_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EM10_LOCKS.MANAGE_PULL_REQUEST === false &&
    EM10_LOCKS.PRICING_ENGINE_CAN_BIND_LEGALLY === false &&
    EM10_LOCKS.RECOMMEND_EQ_CHARGE === false &&
    EM10_LOCKS.RECOMMEND_EQ_SIGN === false &&
    EM10_LOCKS.AUTO_BILLING === false &&
    EM10_LOCKS.AUTO_SIGN_CONTRACT === false &&
    EM10_LOCKS.FAKE_SAVINGS_CLAIMS === false &&
    EM10_LOCKS.TIER_MAY_WEAKEN_PRIVACY === false &&
    EM10_LOCKS.TIER_MAY_WEAKEN_TENANT_ISOLATION === false &&
    EM10_LOCKS.FABRICATED_CUSTOMER_ROI === false &&
    EM10_LOCKS.AMBITION_EQ_VALUATION === false &&
    EM10_LOCKS.HUMAN_APPROVAL_REQUIRED_FOR_CUSTOM_TERMS === true &&
    EM10_LOCKS.HUMAN_APPROVAL_REQUIRED_FOR_CONTRACTS === true &&
    EM10_LOCKS.HUMAN_APPROVAL_REQUIRED_FOR_DISCOUNTS_CREDITS_EXCLUSIVITY === true
  );
}
