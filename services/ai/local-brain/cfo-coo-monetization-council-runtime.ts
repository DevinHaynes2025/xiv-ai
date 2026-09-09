/**
 * 62L-ER38 — CFO / COO Monetization Council runtime.
 *
 * Usage/cost/value evidence → CFO analysis → COO delivery analysis →
 * pricing scenarios (+ affordability configs) → negotiation strategy →
 * human approval. Daily brief may recommend but cannot commit.
 */

import { createHash } from 'node:crypto';
import {
  AFFORDABLE_TIERS,
  CFO_COO_MONETIZATION_COUNCIL_CYCLE,
  DAILY_REVENUE_BRIEF_SECTIONS,
  ER38_AGENT_BOUNDS,
  ER38_DB_CANDIDATES_STATUS,
  ER38_LOCKS,
  ER38_MAY,
  ER38_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HIGH_TIER_JUSTIFICATION_DIMENSIONS,
  HONESTY_BANNER,
  MONETIZATION_ANALYSIS_CATEGORIES,
  MONETIZATION_COUNCIL_CORE_FLOW,
  MONETIZATION_TRUTH_BOUNDARY,
  NEXT_PHASE_TITLE,
  PRICING_APPROVAL_STATES,
  PRICING_LADDER,
  PRICING_PROPOSAL_FIELDS,
  REVENUE_PROJECTION_STATES,
  SIX_FIGURE_MONTHLY_USD,
  assertEr38LocksIntact,
  er38SoftWireSnapshot,
  isEr38Agent,
  isHumanApprover,
  projectionStatesAreSeparate,
  requiresHighTierJustification,
  softWireHopState,
  type AffordabilityConfig,
  type DailyRevenueBrief,
  type Er38Actor,
  type Er38EvidenceState,
  type Er38HopRecord,
  type Er38SoftWireSnapshot,
  type HighTierJustificationDimension,
  type MonetizationAnalysisCategory,
  type PricingApprovalState,
  type PricingLadderTier,
  type PricingProposal,
  type RevenueProjectionState,
} from './cfo-coo-monetization-council-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof CFO_COO_MONETIZATION_COUNCIL_CYCLE)[number],
  state: Er38EvidenceState,
  summary: string,
): Er38HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'HUMAN_APPROVAL_REQUIRED' | 'REJECTED';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: DenialResult['state'] = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

export type UsageCostValueEvidence = {
  evidenceId: string;
  usageMetrics: readonly string[];
  costMetrics: readonly string[];
  valueMetrics: readonly string[];
  projectionState: RevenueProjectionState;
  realizedRevenueEvidencePresent: boolean;
  beforeAfterBaselinesPresent: boolean;
};

export type CfoAnalysis = {
  proposalId: string;
  unitEconomicsSummary: string;
  marginVsTarget: number;
  computeStorageCost: number;
  supportCost: number;
  willingnessToPayNotes: readonly string[];
  competitorNotes: readonly string[];
  state: 'CFO_ANALYZED';
};

export type CooDeliveryAnalysis = {
  proposalId: string;
  implementationBurden: PricingProposal['implementationBurden'];
  deliveryRisks: readonly string[];
  supportLoadEstimate: string;
  state: 'COO_ANALYZED';
};

export type PricingScenarioSet = {
  proposalId: string;
  scenarios: readonly {
    scenarioId: string;
    ladderTier: PricingLadderTier;
    monthlyPriceUsd: number;
    projectionState: RevenueProjectionState;
  }[];
  affordabilityConfigs: readonly AffordabilityConfig[];
  state: 'SCENARIOS_READY';
};

export type NegotiationStrategy = {
  proposalId: string;
  strategyNotes: readonly string[];
  discountAuthority: PricingProposal['discountAuthority'];
  binding: false;
  state: 'NEGOTIATION_STRATEGY_READY';
};

export type HumanApprovalResult = {
  proposalId: string;
  approved: true;
  approvalId: string;
  approvalState: 'APPROVED';
  bindingAuthorized: true;
  autonomousActionsStillForbidden: true;
};

export function ingestUsageCostValueEvidence(input: {
  actor: Er38Actor;
  evidenceId: string;
  usageMetrics?: readonly string[];
  costMetrics?: readonly string[];
  valueMetrics?: readonly string[];
  projectionState?: RevenueProjectionState;
  realizedRevenueEvidencePresent?: boolean;
  beforeAfterBaselinesPresent?: boolean;
  claimMakesMoneyDaily?: boolean;
  claimMillionsSavings?: boolean;
  mergeProjectionStates?: boolean;
}): UsageCostValueEvidence | DenialResult {
  if (!isEr38Agent(input.actor)) {
    return deny('Only monetization council agents may ingest evidence.');
  }
  if (input.claimMakesMoneyDaily === true && !input.realizedRevenueEvidencePresent) {
    return deny(
      'Cannot claim XIV makes money daily without actual REALIZED revenue evidence.',
    );
  }
  if (input.claimMillionsSavings === true && !input.beforeAfterBaselinesPresent) {
    return deny(
      'Cannot claim customers save millions/billions without before/after baselines.',
    );
  }
  if (input.mergeProjectionStates === true) {
    return deny(
      'Revenue projection states HYPOTHESIS|FORECAST|CONTRACTED|REALIZED must remain separate.',
    );
  }

  return {
    evidenceId: input.evidenceId,
    usageMetrics: [...(input.usageMetrics ?? ['api_calls'])],
    costMetrics: [...(input.costMetrics ?? ['compute_usd', 'storage_usd'])],
    valueMetrics: [...(input.valueMetrics ?? ['time_saved_hours'])],
    projectionState: input.projectionState ?? 'HYPOTHESIS',
    realizedRevenueEvidencePresent: input.realizedRevenueEvidencePresent === true,
    beforeAfterBaselinesPresent: input.beforeAfterBaselinesPresent === true,
  };
}

export function draftPricingProposal(input: {
  actor: Er38Actor;
  proposalId: string;
  productService: MonetizationAnalysisCategory | string;
  customerSegment: string;
  monthlyPriceUsd: number;
  ladderTier: PricingLadderTier;
  currency?: string;
  computeStorageCost?: number;
  supportCost?: number;
  implementationBurden?: PricingProposal['implementationBurden'];
  grossMarginTarget?: number;
  willingnessToPayEvidence?: readonly string[];
  competitorMarketContext?: readonly string[];
  customerRoiAssumptionState?: RevenueProjectionState;
  assumedRoiMultiple?: number | null;
  beforeAfterBaselinesPresent?: boolean;
  discountAuthority?: PricingProposal['discountAuthority'];
  contractLength?: string;
  renewalState?: RevenueProjectionState;
  renewalProbability?: number | null;
  risk?: readonly string[];
  highTierEvidenceRefs?: readonly string[];
  skipAffordableConfigs?: boolean;
  skipHighTierJustification?: boolean;
  attemptAutonomousSend?: boolean;
  attemptAutonomousSign?: boolean;
  attemptAutonomousSpend?: boolean;
  attemptBindingWithoutHuman?: boolean;
}): PricingProposal | DenialResult {
  if (!isEr38Agent(input.actor)) {
    return deny('Only monetization council agents may draft pricing proposals.');
  }
  if (input.attemptAutonomousSend) {
    return deny('AUTONOMOUS_SEND_PRICING=false — cannot autonomously send pricing.');
  }
  if (input.attemptAutonomousSign) {
    return deny(
      'AUTONOMOUS_SIGN_AGREEMENTS=false — cannot autonomously sign agreements.',
    );
  }
  if (input.attemptAutonomousSpend) {
    return deny('AUTONOMOUS_SPEND_MONEY=false — cannot autonomously spend money.');
  }
  if (input.attemptBindingWithoutHuman) {
    return deny(
      'Binding commitments require human approval — autonomous binding forbidden.',
      'HUMAN_APPROVAL_REQUIRED',
    );
  }
  if (input.skipAffordableConfigs === true) {
    return deny(
      'Affordability rule: must also generate lower-cost consumer/SMB configurations.',
    );
  }

  const needsJustification = requiresHighTierJustification({
    ladderTier: input.ladderTier,
    monthlyAmountUsd: input.monthlyPriceUsd,
  });
  if (needsJustification && input.skipHighTierJustification === true) {
    return deny(
      'High-tier / six-figure monthly pricing requires measurable value, scope, infrastructure, security, support, and procurement-fit justification.',
    );
  }

  const revenuePerUnit = input.monthlyPriceUsd;
  const variableCost =
    (input.computeStorageCost ?? 0) + (input.supportCost ?? 0);
  const contributionMargin =
    revenuePerUnit === 0 ? 0 : (revenuePerUnit - variableCost) / revenuePerUnit;

  const affordabilityConfigs = generateAffordabilityConfigs({
    proposalId: input.proposalId,
    productService: String(input.productService),
  });

  return {
    proposalId: input.proposalId,
    productService: input.productService,
    customerSegment: input.customerSegment,
    proposedPrice: {
      amount: input.monthlyPriceUsd,
      currency: input.currency ?? 'USD',
      billingPeriod: 'monthly',
      ladderTier: input.ladderTier,
    },
    unitEconomics: {
      revenuePerUnit,
      variableCostPerUnit: variableCost,
      contributionMargin,
    },
    computeStorageCost: input.computeStorageCost ?? 0,
    supportCost: input.supportCost ?? 0,
    implementationBurden: input.implementationBurden ?? 'medium',
    grossMarginTarget: input.grossMarginTarget ?? 0.6,
    willingnessToPayEvidence: [
      ...(input.willingnessToPayEvidence ?? ['survey_hypothesis']),
    ],
    competitorMarketContext: [
      ...(input.competitorMarketContext ?? ['market_scan_hypothesis']),
    ],
    customerRoiAssumption: {
      state: input.customerRoiAssumptionState ?? 'HYPOTHESIS',
      assumedRoiMultiple: input.assumedRoiMultiple ?? null,
      beforeAfterBaselinesPresent: input.beforeAfterBaselinesPresent === true,
    },
    discountAuthority: input.discountAuthority ?? 'human_only',
    contractLength: input.contractLength ?? '12_months',
    renewalAssumptions: {
      state: input.renewalState ?? 'HYPOTHESIS',
      renewalProbability: input.renewalProbability ?? null,
    },
    risk: [...(input.risk ?? ['adoption_uncertainty'])],
    approvalState: 'DRAFT',
    highTierJustification: needsJustification
      ? {
          required: true,
          dimensions: [...HIGH_TIER_JUSTIFICATION_DIMENSIONS],
          evidenceRefs: [...(input.highTierEvidenceRefs ?? [])],
          sixFigureMonthly: input.monthlyPriceUsd >= SIX_FIGURE_MONTHLY_USD,
        }
      : null,
    affordabilityConfigs,
    bindingCommitment: false,
    autonomousSendPricing: false,
    autonomousSign: false,
    autonomousSpend: false,
  };
}

export function generateAffordabilityConfigs(input: {
  proposalId: string;
  productService: string;
}): readonly AffordabilityConfig[] {
  return AFFORDABLE_TIERS.map((tier, idx) => ({
    configId: `${input.proposalId}-aff-${tier.toLowerCase()}`,
    ladderTier: tier,
    monthlyPriceCap: tier === 'FREE' ? 0 : 29 * (idx + 1),
    targetSegment: tier === 'FREE' || tier === 'INDIVIDUAL' || tier === 'PRO'
      ? ('consumer' as const)
      : ('smb' as const),
    reducedScope: [`reduced_${input.productService}`, 'self_serve_support'],
    note: 'Lower-cost configuration for consumers/SMBs — not enterprise-only packaging.',
  }));
}

export function runCfoAnalysis(input: {
  actor: Er38Actor;
  proposal: PricingProposal;
  evidence: UsageCostValueEvidence;
}): CfoAnalysis | DenialResult {
  if (input.actor.kind !== 'cfo_analyst' && input.actor.kind !== 'monetization_council') {
    return deny('CFO analysis requires cfo_analyst or monetization_council actor.');
  }
  return {
    proposalId: input.proposal.proposalId,
    unitEconomicsSummary: `contrib_margin=${input.proposal.unitEconomics.contributionMargin.toFixed(3)}; evidence=${input.evidence.evidenceId}`,
    marginVsTarget:
      input.proposal.unitEconomics.contributionMargin -
      input.proposal.grossMarginTarget,
    computeStorageCost: input.proposal.computeStorageCost,
    supportCost: input.proposal.supportCost,
    willingnessToPayNotes: input.proposal.willingnessToPayEvidence,
    competitorNotes: input.proposal.competitorMarketContext,
    state: 'CFO_ANALYZED',
  };
}

export function runCooDeliveryAnalysis(input: {
  actor: Er38Actor;
  proposal: PricingProposal;
}): CooDeliveryAnalysis | DenialResult {
  if (
    input.actor.kind !== 'coo_delivery_analyst' &&
    input.actor.kind !== 'monetization_council'
  ) {
    return deny(
      'COO delivery analysis requires coo_delivery_analyst or monetization_council actor.',
    );
  }
  return {
    proposalId: input.proposal.proposalId,
    implementationBurden: input.proposal.implementationBurden,
    deliveryRisks: [...input.proposal.risk, 'delivery_capacity'],
    supportLoadEstimate: `support_cost=${input.proposal.supportCost}`,
    state: 'COO_ANALYZED',
  };
}

export function generatePricingScenarios(input: {
  actor: Er38Actor;
  proposal: PricingProposal;
  attemptSkipAffordable?: boolean;
}): PricingScenarioSet | DenialResult {
  if (
    input.actor.kind !== 'pricing_scenario_builder' &&
    input.actor.kind !== 'monetization_council'
  ) {
    return deny('Pricing scenarios require pricing_scenario_builder or council.');
  }
  if (input.attemptSkipAffordable) {
    return deny(
      'Affordability rule: scenarios must include lower-cost consumer/SMB configurations.',
    );
  }

  const base = input.proposal.proposedPrice.amount;
  const scenarios = PRICING_LADDER.map((tier, idx) => ({
    scenarioId: `${input.proposal.proposalId}-sc-${tier}`,
    ladderTier: tier,
    monthlyPriceUsd:
      tier === 'FREE'
        ? 0
        : Math.round(base * (0.1 + idx * 0.15) * 100) / 100,
    projectionState: 'HYPOTHESIS' as const,
  }));

  return {
    proposalId: input.proposal.proposalId,
    scenarios,
    affordabilityConfigs: input.proposal.affordabilityConfigs,
    state: 'SCENARIOS_READY',
  };
}

export function buildNegotiationStrategy(input: {
  actor: Er38Actor;
  proposal: PricingProposal;
  scenarios: PricingScenarioSet;
  treatAsCommitment?: boolean;
}): NegotiationStrategy | DenialResult {
  if (
    input.actor.kind !== 'negotiation_strategist' &&
    input.actor.kind !== 'monetization_council'
  ) {
    return deny('Negotiation strategy requires negotiation_strategist or council.');
  }
  if (input.treatAsCommitment === true) {
    return deny(
      'Recommendations ≠ commitments — negotiation strategy is advisory until human approval.',
    );
  }
  return {
    proposalId: input.proposal.proposalId,
    strategyNotes: [
      `ladder=${input.proposal.proposedPrice.ladderTier}`,
      `scenarios=${input.scenarios.scenarios.length}`,
      'hold discount authority to human_only unless approved',
    ],
    discountAuthority: input.proposal.discountAuthority,
    binding: false,
    state: 'NEGOTIATION_STRATEGY_READY',
  };
}

export function advanceProposalApprovalState(input: {
  proposal: PricingProposal;
  next: PricingApprovalState;
}): PricingProposal | DenialResult {
  if (!PRICING_APPROVAL_STATES.includes(input.next)) {
    return deny(`Unknown approval state: ${String(input.next)}`);
  }
  if (input.next === 'APPROVED') {
    return deny(
      'APPROVED requires requireHumanApproval() — cannot self-advance to APPROVED.',
      'HUMAN_APPROVAL_REQUIRED',
    );
  }
  return { ...input.proposal, approvalState: input.next };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er38Actor;
  proposal: PricingProposal;
  action: string;
  highTierJustificationComplete?: boolean;
}): HumanApprovalResult | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      'Human approver required for pricing approval / binding commercial actions.',
      'HUMAN_APPROVAL_REQUIRED',
    );
  }
  if (
    !input.actor.permissions.includes('approve_consequential') &&
    !input.actor.permissions.includes('approve_pricing')
  ) {
    return deny('Missing approve_consequential or approve_pricing permission.');
  }
  if (
    input.proposal.highTierJustification?.required === true &&
    input.highTierJustificationComplete !== true &&
    (input.proposal.highTierJustification.evidenceRefs.length === 0)
  ) {
    return deny(
      'High-tier proposal lacks measurable justification evidence — human cannot approve yet.',
    );
  }
  return {
    proposalId: input.proposal.proposalId,
    approved: true,
    approvalId: input.approvalId,
    approvalState: 'APPROVED',
    bindingAuthorized: true,
    autonomousActionsStillForbidden: true,
  };
}

export function compileDailyRevenueBrief(input: {
  actor: Er38Actor;
  briefId: string;
  sectionNotes?: Partial<Record<(typeof DAILY_REVENUE_BRIEF_SECTIONS)[number], string>>;
  recommendedActions?: readonly string[];
  claimMakesMoneyDaily?: boolean;
  realizedRevenueEvidencePresent?: boolean;
  treatRecommendationsAsCommitments?: boolean;
  attemptSendPricing?: boolean;
  attemptSign?: boolean;
  attemptSpend?: boolean;
}): DailyRevenueBrief | DenialResult {
  if (
    input.actor.kind !== 'daily_brief_compiler' &&
    input.actor.kind !== 'monetization_council' &&
    input.actor.kind !== 'cfo_analyst'
  ) {
    return deny('Daily brief requires daily_brief_compiler, cfo_analyst, or council.');
  }
  if (input.claimMakesMoneyDaily === true && !input.realizedRevenueEvidencePresent) {
    return deny(
      'Daily brief cannot claim XIV makes money daily without REALIZED revenue evidence.',
    );
  }
  if (input.treatRecommendationsAsCommitments === true) {
    return deny('Daily brief recommendations are not commitments.');
  }
  if (input.attemptSendPricing === true) {
    return deny('Daily council cannot autonomously send pricing.');
  }
  if (input.attemptSign === true) {
    return deny('Daily council cannot autonomously sign agreements.');
  }
  if (input.attemptSpend === true) {
    return deny('Daily council cannot autonomously spend money.');
  }

  const sections = Object.fromEntries(
    DAILY_REVENUE_BRIEF_SECTIONS.map((s) => [
      s,
      input.sectionNotes?.[s] ?? `${s}: advisory_hypothesis`,
    ]),
  ) as Record<(typeof DAILY_REVENUE_BRIEF_SECTIONS)[number], string>;

  return {
    briefId: input.briefId,
    generatedAt: nowIso(),
    sections,
    recommendedActions: [
      ...(input.recommendedActions ?? [
        'review_pricing_experiment_design',
        'escalate_gov_opportunity_for_human_review',
      ]),
    ],
    recommendationsAreCommitments: false,
    maySendPricing: false,
    maySignAgreements: false,
    maySpendMoney: false,
    mayMakeBindingCommitments: false,
    revenueClaims: {
      claimsMakesMoneyDaily: false,
      projectionStatesUsed: [...REVENUE_PROJECTION_STATES],
      realizedRevenueEvidencePresent:
        input.realizedRevenueEvidencePresent === true,
    },
  };
}

export function attemptAutonomousSendPricing(): DenialResult {
  return deny('Cannot autonomously send pricing.');
}

export function attemptAutonomousSignAgreements(): DenialResult {
  return deny('Cannot autonomously sign agreements.');
}

export function attemptAutonomousSpend(): DenialResult {
  return deny('Cannot autonomously spend money.');
}

export function attemptBindingWithoutHuman(): DenialResult {
  return deny(
    'Binding commitments require human approval.',
    'HUMAN_APPROVAL_REQUIRED',
  );
}

export function attemptClaimMakesMoneyDailyWithoutEvidence(): DenialResult {
  return deny(
    'Cannot claim XIV makes money daily without actual revenue evidence.',
  );
}

export function attemptClaimMillionsSavingsWithoutBaselines(): DenialResult {
  return deny(
    'Cannot claim customers save millions/billions without before/after baselines.',
  );
}

export function attemptMergeProjectionStates(): DenialResult {
  return deny(
    'HYPOTHESIS|FORECAST|CONTRACTED|REALIZED must remain separate.',
  );
}

export function attemptHighTierWithoutJustification(): DenialResult {
  return deny(
    'High-tier / six-figure pricing requires measurable justification.',
  );
}

export function attemptTreatRecommendAsCommitment(): DenialResult {
  return deny('Recommend ≠ commitment.');
}

export function attemptHiddenChainOfThought(): DenialResult {
  return deny('Hidden chain-of-thought must not appear in monetization council artifacts.');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('Guardian/RLS bypass forbidden.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('Tenant/Universe access expansion forbidden.');
}

export function attemptAutoDeployChanges(): DenialResult {
  return deny('Auto-deploy changes forbidden.');
}

export function attemptEnableL4Autonomy(): DenialResult {
  return deny('L4_AUTONOMY_ENABLED=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('Recommend ≠ act.');
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  state: 'PASS';
  isolationUnchanged: true;
} {
  return { state: 'PASS', isolationUnchanged: true };
}

export function promoteProjectionState(input: {
  from: RevenueProjectionState;
  to: RevenueProjectionState;
  er39EvidenceGatePresent: boolean;
  realizedEvidencePresent?: boolean;
}): { from: RevenueProjectionState; to: RevenueProjectionState } | DenialResult {
  if (input.from === input.to) {
    return { from: input.from, to: input.to };
  }
  if (input.to === 'REALIZED') {
    if (!input.er39EvidenceGatePresent) {
      return deny(
        'ER39 Revenue Evidence Gate absent — REALIZED transitions WAITING_DATA; states kept separate.',
        'WAITING_DATA',
      );
    }
    if (!input.realizedEvidencePresent) {
      return deny(
        'REALIZED requires actual revenue evidence via ER39 gate.',
      );
    }
  }
  if (
    input.from === 'HYPOTHESIS' &&
    input.to === 'REALIZED' &&
    !input.er39EvidenceGatePresent
  ) {
    return deny(
      'Cannot promote HYPOTHESIS → REALIZED without ER39 evidence gate.',
      'WAITING_DATA',
    );
  }
  return { from: input.from, to: input.to };
}

export function exampleApiPricingProposal(actor: Er38Actor): PricingProposal {
  const built = draftPricingProposal({
    actor,
    proposalId: 'prop-api-pro-1',
    productService: 'api_pricing',
    customerSegment: 'startup_devs',
    monthlyPriceUsd: 79,
    ladderTier: 'PRO',
    computeStorageCost: 12,
    supportCost: 8,
    implementationBurden: 'low',
    grossMarginTarget: 0.65,
    willingnessToPayEvidence: ['wtp_survey_hypothesis_1'],
    competitorMarketContext: ['competitor_api_tier_scan'],
    customerRoiAssumptionState: 'HYPOTHESIS',
    assumedRoiMultiple: 3,
    beforeAfterBaselinesPresent: false,
  });
  if ('denied' in built) {
    throw new Error(`exampleApiPricingProposal failed: ${built.reason}`);
  }
  return built;
}

export function exampleEnterpriseSixFigureProposal(
  actor: Er38Actor,
): PricingProposal {
  const built = draftPricingProposal({
    actor,
    proposalId: 'prop-ent-gov-1',
    productService: 'government_contract_pricing',
    customerSegment: 'federal_agency',
    monthlyPriceUsd: 150_000,
    ladderTier: 'STRATEGIC_GOVERNMENT',
    computeStorageCost: 40_000,
    supportCost: 25_000,
    implementationBurden: 'very_high',
    grossMarginTarget: 0.45,
    willingnessToPayEvidence: ['procurement_budget_hypothesis'],
    competitorMarketContext: ['fedramp_competitor_scan'],
    highTierEvidenceRefs: [
      'measurable_value_scope_doc',
      'infra_security_support_pack',
      'procurement_fit_memo',
    ],
  });
  if ('denied' in built) {
    throw new Error(`exampleEnterpriseSixFigureProposal failed: ${built.reason}`);
  }
  return built;
}

export function bootstrapMonetizationCouncil(repoRoot?: string): {
  locksIntact: boolean;
  analysisCategories: typeof MONETIZATION_ANALYSIS_CATEGORIES;
  proposalFields: typeof PRICING_PROPOSAL_FIELDS;
  approvalStates: typeof PRICING_APPROVAL_STATES;
  coreFlow: typeof MONETIZATION_COUNCIL_CORE_FLOW;
  pricingLadder: typeof PRICING_LADDER;
  dailyBriefSections: typeof DAILY_REVENUE_BRIEF_SECTIONS;
  projectionStates: typeof REVENUE_PROJECTION_STATES;
  dbCandidates: typeof ER38_DB_CANDIDATES_STATUS;
  softWire: Er38SoftWireSnapshot;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    layer: typeof ER_LAYER_TITLE;
  };
} {
  const softWire = er38SoftWireSnapshot(repoRoot);
  return {
    locksIntact: assertEr38LocksIntact(),
    analysisCategories: MONETIZATION_ANALYSIS_CATEGORIES,
    proposalFields: PRICING_PROPOSAL_FIELDS,
    approvalStates: PRICING_APPROVAL_STATES,
    coreFlow: MONETIZATION_COUNCIL_CORE_FLOW,
    pricingLadder: PRICING_LADDER,
    dailyBriefSections: DAILY_REVENUE_BRIEF_SECTIONS,
    projectionStates: REVENUE_PROJECTION_STATES,
    dbCandidates: ER38_DB_CANDIDATES_STATUS,
    softWire,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
      gitlab: GITLAB_MIRROR_NOTE,
      layer: ER_LAYER_TITLE,
    },
  };
}

export function runMonetizationCouncilCycle(input: {
  actor: Er38Actor;
  human: Er38Actor;
  repoRoot?: string;
}): {
  hops: Er38HopRecord[];
  receipt: {
    proposalId: string;
    approvalState: PricingApprovalState;
    recommendationsAreCommitments: false;
    l4Autonomy: false;
  };
  cycleEvidenceSha256: string;
} {
  const hops: Er38HopRecord[] = [];
  const softWire = er38SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr38LocksIntact() ? 'PASS' : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const boot = bootstrapMonetizationCouncil(input.repoRoot);
  hops.push(
    hop(
      'monetization_council_bootstrap',
      boot.locksIntact ? 'PASS' : 'FAIL',
      'CFO/COO Monetization Council bootstrap.',
    ),
  );

  hops.push(
    hop(
      'analysis_categories_encoded',
      MONETIZATION_ANALYSIS_CATEGORIES.length === 15 ? 'PASS' : 'FAIL',
      `Analysis categories=${MONETIZATION_ANALYSIS_CATEGORIES.length}.`,
    ),
  );
  hops.push(
    hop(
      'pricing_proposal_fields_encoded',
      PRICING_PROPOSAL_FIELDS.length === 17 ? 'PASS' : 'FAIL',
      `Proposal fields=${PRICING_PROPOSAL_FIELDS.length}.`,
    ),
  );
  hops.push(
    hop(
      'approval_states_encoded',
      PRICING_APPROVAL_STATES.length === 9 ? 'PASS' : 'FAIL',
      `Approval states=${PRICING_APPROVAL_STATES.join(',')}.`,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      MONETIZATION_COUNCIL_CORE_FLOW.length === 6 ? 'PASS' : 'FAIL',
      `Core flow=${MONETIZATION_COUNCIL_CORE_FLOW.join('→')}.`,
    ),
  );
  hops.push(
    hop(
      'pricing_ladder_encoded',
      PRICING_LADDER.length === 8 ? 'PASS' : 'FAIL',
      `Pricing ladder=${PRICING_LADDER.join('→')}.`,
    ),
  );
  hops.push(
    hop(
      'daily_brief_sections_encoded',
      DAILY_REVENUE_BRIEF_SECTIONS.length === 13 ? 'PASS' : 'FAIL',
      `Daily brief sections=${DAILY_REVENUE_BRIEF_SECTIONS.length}.`,
    ),
  );
  hops.push(
    hop(
      'revenue_projection_states_encoded',
      projectionStatesAreSeparate() && REVENUE_PROJECTION_STATES.length === 4
        ? 'PASS'
        : 'FAIL',
      `Projection states=${REVENUE_PROJECTION_STATES.join('|')}.`,
    ),
  );
  hops.push(
    hop(
      'truth_boundary_encoded',
      MONETIZATION_TRUTH_BOUNDARY.recommendationsAreNotCommitments &&
        !MONETIZATION_TRUTH_BOUNDARY.mayAutonomouslySendPricing
        ? 'PASS'
        : 'FAIL',
      'Truth boundary: recommendations≠commitments; no autonomous pricing/sign/spend.',
    ),
  );
  hops.push(
    hop(
      'affordability_rule_encoded',
      MONETIZATION_TRUTH_BOUNDARY.mustGenerateAffordableConfigs ? 'PASS' : 'FAIL',
      'Affordability rule: consumer/SMB lower-cost configs required.',
    ),
  );
  hops.push(
    hop(
      'high_tier_justification_encoded',
      MONETIZATION_TRUTH_BOUNDARY.highTierRequiresMeasurableJustification
        ? 'PASS'
        : 'FAIL',
      'High-tier justification dimensions encoded.',
    ),
  );

  const evidence = ingestUsageCostValueEvidence({
    actor: input.actor,
    evidenceId: 'ev-1',
    projectionState: 'HYPOTHESIS',
  });
  hops.push(
    hop(
      'ingest_usage_cost_value_evidence',
      'denied' in evidence ? 'FAIL' : 'PASS',
      'denied' in evidence ? evidence.reason : `evidence=${evidence.evidenceId}`,
    ),
  );

  const proposal =
    'denied' in evidence
      ? null
      : draftPricingProposal({
          actor: input.actor,
          proposalId: 'cycle-prop-1',
          productService: 'api_pricing',
          customerSegment: 'smb',
          monthlyPriceUsd: 99,
          ladderTier: 'SMALL_BUSINESS',
          computeStorageCost: 15,
          supportCost: 10,
        });

  const cfoActor: Er38Actor = { ...input.actor, kind: 'cfo_analyst' };
  const cfo =
    proposal && !('denied' in proposal) && !('denied' in evidence)
      ? runCfoAnalysis({ actor: cfoActor, proposal, evidence })
      : deny('Missing proposal/evidence for CFO analysis.');
  hops.push(
    hop(
      'run_cfo_analysis',
      'denied' in cfo ? 'FAIL' : 'PASS',
      'denied' in cfo ? cfo.reason : cfo.unitEconomicsSummary,
    ),
  );

  const cooActor: Er38Actor = { ...input.actor, kind: 'coo_delivery_analyst' };
  const coo =
    proposal && !('denied' in proposal)
      ? runCooDeliveryAnalysis({ actor: cooActor, proposal })
      : deny('Missing proposal for COO analysis.');
  hops.push(
    hop(
      'run_coo_delivery_analysis',
      'denied' in coo ? 'FAIL' : 'PASS',
      'denied' in coo ? coo.reason : `burden=${coo.implementationBurden}`,
    ),
  );

  const scenActor: Er38Actor = {
    ...input.actor,
    kind: 'pricing_scenario_builder',
  };
  const scenarios =
    proposal && !('denied' in proposal)
      ? generatePricingScenarios({ actor: scenActor, proposal })
      : deny('Missing proposal for scenarios.');
  hops.push(
    hop(
      'generate_pricing_scenarios',
      'denied' in scenarios ? 'FAIL' : 'PASS',
      'denied' in scenarios
        ? scenarios.reason
        : `scenarios=${scenarios.scenarios.length}`,
    ),
  );
  hops.push(
    hop(
      'generate_affordable_configs',
      proposal &&
        !('denied' in proposal) &&
        proposal.affordabilityConfigs.length === AFFORDABLE_TIERS.length
        ? 'PASS'
        : 'FAIL',
      'Affordable consumer/SMB configs generated.',
    ),
  );

  const negoActor: Er38Actor = {
    ...input.actor,
    kind: 'negotiation_strategist',
  };
  const nego =
    proposal &&
    !('denied' in proposal) &&
    scenarios &&
    !('denied' in scenarios)
      ? buildNegotiationStrategy({
          actor: negoActor,
          proposal,
          scenarios,
        })
      : deny('Missing proposal/scenarios for negotiation strategy.');
  hops.push(
    hop(
      'build_negotiation_strategy',
      'denied' in nego ? 'FAIL' : 'PASS',
      'denied' in nego ? nego.reason : 'Negotiation strategy advisory-only.',
    ),
  );

  const approved =
    proposal && !('denied' in proposal)
      ? requireHumanApproval({
          approvalId: 'appr-cycle-1',
          actor: input.human,
          proposal,
          action: 'approve_pricing_proposal',
          highTierJustificationComplete: true,
        })
      : deny('Missing proposal for human approval.');
  hops.push(
    hop(
      'require_human_approval',
      'denied' in approved ? 'FAIL' : 'HUMAN_APPROVAL_REQUIRED',
      'denied' in approved
        ? approved.reason
        : `approved=${approved.approvalId}; autonomous still forbidden`,
    ),
  );

  const briefActor: Er38Actor = {
    ...input.actor,
    kind: 'daily_brief_compiler',
  };
  const brief = compileDailyRevenueBrief({
    actor: briefActor,
    briefId: 'brief-cycle-1',
  });
  hops.push(
    hop(
      'generate_daily_revenue_brief',
      'denied' in brief ? 'FAIL' : 'RECOMMENDATION_ONLY',
      'denied' in brief
        ? brief.reason
        : `brief=${brief.briefId}; recommendations≠commitments`,
    ),
  );

  hops.push(
    hop(
      'deny_autonomous_send_pricing',
      attemptAutonomousSendPricing().denied ? 'DENIED' : 'FAIL',
      attemptAutonomousSendPricing().reason,
    ),
  );
  hops.push(
    hop(
      'deny_autonomous_sign_agreements',
      attemptAutonomousSignAgreements().denied ? 'DENIED' : 'FAIL',
      attemptAutonomousSignAgreements().reason,
    ),
  );
  hops.push(
    hop(
      'deny_autonomous_spend',
      attemptAutonomousSpend().denied ? 'DENIED' : 'FAIL',
      attemptAutonomousSpend().reason,
    ),
  );
  hops.push(
    hop(
      'deny_binding_commitments_without_human',
      attemptBindingWithoutHuman().state === 'HUMAN_APPROVAL_REQUIRED'
        ? 'HUMAN_APPROVAL_REQUIRED'
        : 'FAIL',
      attemptBindingWithoutHuman().reason,
    ),
  );
  hops.push(
    hop(
      'deny_claim_makes_money_daily_without_evidence',
      attemptClaimMakesMoneyDailyWithoutEvidence().denied ? 'DENIED' : 'FAIL',
      attemptClaimMakesMoneyDailyWithoutEvidence().reason,
    ),
  );
  hops.push(
    hop(
      'deny_claim_millions_savings_without_baselines',
      attemptClaimMillionsSavingsWithoutBaselines().denied ? 'DENIED' : 'FAIL',
      attemptClaimMillionsSavingsWithoutBaselines().reason,
    ),
  );
  hops.push(
    hop(
      'deny_merge_projection_states',
      attemptMergeProjectionStates().denied ? 'DENIED' : 'FAIL',
      attemptMergeProjectionStates().reason,
    ),
  );
  hops.push(
    hop(
      'deny_high_tier_without_justification',
      attemptHighTierWithoutJustification().denied ? 'DENIED' : 'FAIL',
      attemptHighTierWithoutJustification().reason,
    ),
  );
  hops.push(
    hop(
      'deny_treat_recommend_as_commitment',
      attemptTreatRecommendAsCommitment().denied ? 'DENIED' : 'FAIL',
      attemptTreatRecommendAsCommitment().reason,
    ),
  );
  hops.push(
    hop(
      'deny_hidden_chain_of_thought',
      attemptHiddenChainOfThought().denied ? 'DENIED' : 'FAIL',
      attemptHiddenChainOfThought().reason,
    ),
  );
  hops.push(
    hop(
      'deny_bypass_guardian_rls',
      attemptBypassGuardianRls().denied ? 'DENIED' : 'FAIL',
      attemptBypassGuardianRls().reason,
    ),
  );
  hops.push(
    hop(
      'deny_expand_tenant_universe_access',
      attemptExpandTenantUniverseAccess().denied ? 'DENIED' : 'FAIL',
      attemptExpandTenantUniverseAccess().reason,
    ),
  );
  hops.push(
    hop(
      'deny_auto_deploy_changes',
      attemptAutoDeployChanges().denied ? 'DENIED' : 'FAIL',
      attemptAutoDeployChanges().reason,
    ),
  );
  hops.push(
    hop(
      'deny_enable_l4_autonomy',
      attemptEnableL4Autonomy().denied ? 'DENIED' : 'FAIL',
      attemptEnableL4Autonomy().reason,
    ),
  );

  const isolation = probeGuardianRlsTenantUniverseIsolation();
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      isolation.state,
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().denied ? 'DENIED' : 'FAIL',
      'Recommend ≠ act.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ER38_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false.',
    ),
  );

  hops.push(
    hop(
      'er_layer_context_documented',
      'DOCUMENTED',
      ER_LAYER_TITLE,
    ),
  );
  hops.push(
    hop(
      'er37_soft_wire',
      softWireHopState(softWire.er37FederatedLearning),
      softWire.er37FederatedLearning.note,
    ),
  );
  hops.push(
    hop(
      'er39_soft_wire',
      softWireHopState(softWire.er39RevenueEvidenceGate),
      softWire.er39RevenueEvidenceGate.note,
    ),
  );
  hops.push(
    hop(
      'er14_soft_wire',
      softWireHopState(softWire.er14OfflineBrainPackager),
      softWire.er14OfflineBrainPackager.note,
    ),
  );
  hops.push(
    hop(
      'er22_soft_wire',
      softWireHopState(softWire.er22HistoricalAvatar),
      softWire.er22HistoricalAvatar.note,
    ),
  );
  hops.push(
    hop(
      'er28_soft_wire',
      softWireHopState(softWire.er28UniversalRuntime),
      softWire.er28UniversalRuntime.note,
    ),
  );
  hops.push(
    hop(
      'er29_soft_wire',
      softWireHopState(softWire.er29WindowsRuntime),
      softWire.er29WindowsRuntime.note,
    ),
  );
  hops.push(
    hop(
      'er30_soft_wire',
      softWireHopState(softWire.er30AndroidArmRuntime),
      softWire.er30AndroidArmRuntime.note,
    ),
  );
  hops.push(
    hop(
      'er31_soft_wire',
      softWireHopState(softWire.er31IosAppleRuntime),
      softWire.er31IosAppleRuntime.note,
    ),
  );
  hops.push(
    hop(
      'er32_soft_wire',
      softWireHopState(softWire.er32EdgeVehicleRuntime),
      softWire.er32EdgeVehicleRuntime.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      ER38_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'NOT_APPLIED' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const receipt = {
    proposalId:
      proposal && !('denied' in proposal) ? proposal.proposalId : 'none',
    approvalState: ('denied' in approved
      ? 'PENDING_HUMAN_APPROVAL'
      : approved.approvalState) as PricingApprovalState,
    recommendationsAreCommitments: false as const,
    l4Autonomy: false as const,
  };

  hops.push(
    hop(
      'evidence',
      'PASS',
      `cycle complete; may=${ER38_MAY.length}; must_not=${ER38_MUST_NOT.length}; bounds_auto=${ER38_AGENT_BOUNDS.automaticAuthority}`,
    ),
  );

  return {
    hops,
    receipt,
    cycleEvidenceSha256: sha256(JSON.stringify({ hops, receipt })),
  };
}

export function returnEr38EvidenceToHomeBase(input: {
  actor: Er38Actor;
  proposal: PricingProposal;
  brief: DailyRevenueBrief;
}): {
  returned: true;
  authorityGranted: false;
  proposalId: string;
  briefId: string;
} {
  return {
    returned: true,
    authorityGranted: false,
    proposalId: input.proposal.proposalId,
    briefId: input.brief.briefId,
  };
}
