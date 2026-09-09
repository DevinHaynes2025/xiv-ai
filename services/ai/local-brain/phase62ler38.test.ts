/**
 * 62L-ER38 — CFO / COO Monetization Council denial + honesty tests.
 *
 * Script: npm run test:62ler38
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

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
  GITHUB_SOT_FAMILY,
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
  projectionStatesAreSeparate,
  requiresHighTierJustification,
  type Er38Actor,
} from './cfo-coo-monetization-council-types.ts';

import {
  advanceProposalApprovalState,
  attemptAutonomousSendPricing,
  attemptAutonomousSignAgreements,
  attemptAutonomousSpend,
  attemptBindingWithoutHuman,
  attemptClaimMakesMoneyDailyWithoutEvidence,
  attemptClaimMillionsSavingsWithoutBaselines,
  attemptEnableL4Autonomy,
  attemptHighTierWithoutJustification,
  attemptMergeProjectionStates,
  attemptTreatRecommendAsCommitment,
  bootstrapMonetizationCouncil,
  buildNegotiationStrategy,
  compileDailyRevenueBrief,
  draftPricingProposal,
  exampleApiPricingProposal,
  exampleEnterpriseSixFigureProposal,
  generatePricingScenarios,
  ingestUsageCostValueEvidence,
  probeGuardianRlsTenantUniverseIsolation,
  promoteProjectionState,
  requireHumanApproval,
  returnEr38EvidenceToHomeBase,
  runCfoAnalysis,
  runCooDeliveryAnalysis,
  runMonetizationCouncilCycle,
} from './cfo-coo-monetization-council-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er38Actor = {
  kind: 'monetization_council',
  id: 'mc-1',
  orgId: 'org-er38',
  tenantId: 'ten-er38',
  universeId: 'uni-er38',
  permissions: ['draft', 'analyze'],
};

const human: Er38Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er38',
  tenantId: 'ten-er38',
  universeId: 'uni-er38',
  permissions: ['approve_consequential', 'approve_pricing'],
};

test('SoT label ER38 / #162; CFO/COO Monetization Council; next ER39 Revenue Evidence Gate', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER38');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /CFO \/ COO Monetization Council/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER39/);
  assert.match(NEXT_PHASE_TITLE, /Revenue Evidence Gate/);
  assert.match(ER_LAYER_TITLE, /Real API Data Fabric/);
});

test('honesty locks: L4 false; no autonomous pricing/sign/spend; projection states separate', () => {
  assert.equal(assertEr38LocksIntact(), true);
  assert.equal(ER38_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER38_LOCKS.AUTONOMOUS_SEND_PRICING, false);
  assert.equal(ER38_LOCKS.AUTONOMOUS_SIGN_AGREEMENTS, false);
  assert.equal(ER38_LOCKS.AUTONOMOUS_SPEND_MONEY, false);
  assert.equal(ER38_LOCKS.AUTONOMOUS_BINDING_COMMITMENTS, false);
  assert.equal(ER38_LOCKS.CLAIM_MAKES_MONEY_DAILY_WITHOUT_EVIDENCE, false);
  assert.equal(ER38_LOCKS.MERGE_REVENUE_PROJECTION_STATES, false);
  assert.equal(ER38_LOCKS.TIP_LAND, false);
  assert.equal(ER38_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(ER38_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(projectionStatesAreSeparate(), true);
  assert.equal(
    MONETIZATION_TRUTH_BOUNDARY.recommendationsAreNotCommitments,
    true,
  );
  assert.equal(ER38_AGENT_BOUNDS.automaticAuthority, false);
  assert.equal(attemptEnableL4Autonomy().denied, true);
  assert.equal(attemptAutonomousSendPricing().state, 'DENIED');
  assert.equal(attemptAutonomousSignAgreements().state, 'DENIED');
  assert.equal(attemptAutonomousSpend().state, 'DENIED');
  assert.equal(attemptBindingWithoutHuman().state, 'HUMAN_APPROVAL_REQUIRED');
});

test('structure: categories, proposal fields, ladder, brief, projection states', () => {
  assert.equal(MONETIZATION_ANALYSIS_CATEGORIES.length, 15);
  assert.ok(MONETIZATION_ANALYSIS_CATEGORIES.includes('api_pricing'));
  assert.ok(MONETIZATION_ANALYSIS_CATEGORIES.includes('offline_brain_packs'));
  assert.ok(
    MONETIZATION_ANALYSIS_CATEGORIES.includes('historical_avatar_products'),
  );
  assert.equal(PRICING_PROPOSAL_FIELDS.length, 17);
  assert.ok(PRICING_PROPOSAL_FIELDS.includes('proposalId'));
  assert.ok(PRICING_PROPOSAL_FIELDS.includes('approvalState'));
  assert.deepEqual([...PRICING_LADDER], [
    'FREE',
    'INDIVIDUAL',
    'PRO',
    'ENTREPRENEUR',
    'SMALL_BUSINESS',
    'GROWTH',
    'ENTERPRISE',
    'STRATEGIC_GOVERNMENT',
  ]);
  assert.equal(DAILY_REVENUE_BRIEF_SECTIONS.length, 13);
  assert.deepEqual([...REVENUE_PROJECTION_STATES], [
    'HYPOTHESIS',
    'FORECAST',
    'CONTRACTED',
    'REALIZED',
  ]);
  assert.equal(MONETIZATION_COUNCIL_CORE_FLOW.length, 6);
  assert.equal(PRICING_APPROVAL_STATES.length, 9);
  assert.equal(HIGH_TIER_JUSTIFICATION_DIMENSIONS.length, 6);
  assert.equal(AFFORDABLE_TIERS.length, 5);
  assert.ok(CFO_COO_MONETIZATION_COUNCIL_CYCLE.includes('er37_soft_wire'));
  assert.ok(CFO_COO_MONETIZATION_COUNCIL_CYCLE.includes('er39_soft_wire'));
  assert.ok(ER38_MAY.length > 0);
  assert.ok(ER38_MUST_NOT.includes('autonomously_send_pricing_to_customers'));
});

test('core flow + affordability + high-tier justification + human approval', () => {
  const evidence = ingestUsageCostValueEvidence({
    actor: agent,
    evidenceId: 'ev-test-1',
    projectionState: 'HYPOTHESIS',
  });
  assert.ok(!('denied' in evidence));

  const proposal = exampleApiPricingProposal(agent);
  assert.equal(proposal.approvalState, 'DRAFT');
  assert.equal(proposal.bindingCommitment, false);
  assert.equal(proposal.affordabilityConfigs.length, AFFORDABLE_TIERS.length);
  assert.ok(proposal.affordabilityConfigs.some((c) => c.ladderTier === 'FREE'));

  const cfo = runCfoAnalysis({
    actor: { ...agent, kind: 'cfo_analyst' },
    proposal,
    evidence,
  });
  assert.ok(!('denied' in cfo));
  assert.equal(cfo.state, 'CFO_ANALYZED');

  const coo = runCooDeliveryAnalysis({
    actor: { ...agent, kind: 'coo_delivery_analyst' },
    proposal,
  });
  assert.ok(!('denied' in coo));
  assert.equal(coo.state, 'COO_ANALYZED');

  const scenarios = generatePricingScenarios({
    actor: { ...agent, kind: 'pricing_scenario_builder' },
    proposal,
  });
  assert.ok(!('denied' in scenarios));
  assert.equal(scenarios.scenarios.length, PRICING_LADDER.length);

  assert.equal(
    generatePricingScenarios({
      actor: { ...agent, kind: 'pricing_scenario_builder' },
      proposal,
      attemptSkipAffordable: true,
    }).state,
    'DENIED',
  );

  const nego = buildNegotiationStrategy({
    actor: { ...agent, kind: 'negotiation_strategist' },
    proposal,
    scenarios,
  });
  assert.ok(!('denied' in nego));
  assert.equal(nego.binding, false);

  assert.equal(
    buildNegotiationStrategy({
      actor: { ...agent, kind: 'negotiation_strategist' },
      proposal,
      scenarios,
      treatAsCommitment: true,
    }).state,
    'DENIED',
  );

  assert.equal(
    advanceProposalApprovalState({ proposal, next: 'APPROVED' }).state,
    'HUMAN_APPROVAL_REQUIRED',
  );

  const approved = requireHumanApproval({
    approvalId: 'appr-1',
    actor: human,
    proposal,
    action: 'approve_pricing',
    highTierJustificationComplete: true,
  });
  assert.ok(!('denied' in approved));
  assert.equal(approved.autonomousActionsStillForbidden, true);

  assert.equal(
    requiresHighTierJustification({
      ladderTier: 'STRATEGIC_GOVERNMENT',
      monthlyAmountUsd: SIX_FIGURE_MONTHLY_USD,
    }),
    true,
  );

  assert.equal(
    draftPricingProposal({
      actor: agent,
      proposalId: 'bad-high',
      productService: 'enterprise_knowledge_systems',
      customerSegment: 'enterprise',
      monthlyPriceUsd: 120_000,
      ladderTier: 'ENTERPRISE',
      skipHighTierJustification: true,
    }).state,
    'DENIED',
  );

  const ent = exampleEnterpriseSixFigureProposal(agent);
  assert.equal(ent.highTierJustification?.required, true);
  assert.equal(ent.highTierJustification?.sixFigureMonthly, true);
  assert.ok(ent.affordabilityConfigs.length > 0);
});

test('truth boundary: no makes-money-daily / millions without evidence; ER39 WAITING_DATA', () => {
  assert.equal(attemptClaimMakesMoneyDailyWithoutEvidence().state, 'DENIED');
  assert.equal(attemptClaimMillionsSavingsWithoutBaselines().state, 'DENIED');
  assert.equal(attemptMergeProjectionStates().state, 'DENIED');
  assert.equal(attemptHighTierWithoutJustification().state, 'DENIED');
  assert.equal(attemptTreatRecommendAsCommitment().state, 'DENIED');

  assert.equal(
    ingestUsageCostValueEvidence({
      actor: agent,
      evidenceId: 'ev-bad',
      claimMakesMoneyDaily: true,
      realizedRevenueEvidencePresent: false,
    }).state,
    'DENIED',
  );

  assert.equal(
    ingestUsageCostValueEvidence({
      actor: agent,
      evidenceId: 'ev-bad2',
      claimMillionsSavings: true,
      beforeAfterBaselinesPresent: false,
    }).state,
    'DENIED',
  );

  const brief = compileDailyRevenueBrief({
    actor: { ...agent, kind: 'daily_brief_compiler' },
    briefId: 'brief-1',
  });
  assert.ok(!('denied' in brief));
  assert.equal(brief.recommendationsAreCommitments, false);
  assert.equal(brief.maySendPricing, false);
  assert.equal(brief.revenueClaims.claimsMakesMoneyDaily, false);

  assert.equal(
    compileDailyRevenueBrief({
      actor: { ...agent, kind: 'daily_brief_compiler' },
      briefId: 'brief-bad',
      claimMakesMoneyDaily: true,
      realizedRevenueEvidencePresent: false,
    }).state,
    'DENIED',
  );

  const soft = er38SoftWireSnapshot(repoRoot);
  assert.equal(soft.er39RevenueEvidenceGate.present, false);
  assert.equal(
    promoteProjectionState({
      from: 'HYPOTHESIS',
      to: 'REALIZED',
      er39EvidenceGatePresent: soft.er39RevenueEvidenceGate.present,
    }).state,
    'WAITING_DATA',
  );
});

test('soft-wires: ER37+ER14 PRESENT; ER39/ER22/ER28–32 WAITING_DATA; cycle PASS', () => {
  const soft = er38SoftWireSnapshot(repoRoot);
  assert.equal(soft.er37FederatedLearning.present, true);
  assert.equal(soft.er37Report.present, true);
  assert.equal(soft.er14OfflineBrainPackager.present, true);
  assert.equal(soft.er14Report.present, true);
  assert.equal(soft.er39RevenueEvidenceGate.present, false);
  assert.equal(soft.er22HistoricalAvatar.present, false);
  assert.equal(soft.er28UniversalRuntime.present, false);
  assert.equal(soft.er29WindowsRuntime.present, false);
  assert.equal(soft.er30AndroidArmRuntime.present, false);
  assert.equal(soft.er31IosAppleRuntime.present, false);
  assert.equal(soft.er32EdgeVehicleRuntime.present, false);

  const boot = bootstrapMonetizationCouncil(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const cycle = runMonetizationCouncilCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.ok(cycle.hops.length >= CFO_COO_MONETIZATION_COUNCIL_CYCLE.length);
  assert.equal(cycle.receipt.l4Autonomy, false);
  assert.equal(cycle.receipt.recommendationsAreCommitments, false);

  const er37Hop = cycle.hops.find((h) => h.hop === 'er37_soft_wire');
  const er39Hop = cycle.hops.find((h) => h.hop === 'er39_soft_wire');
  const er14Hop = cycle.hops.find((h) => h.hop === 'er14_soft_wire');
  assert.equal(er37Hop?.state, 'PASS');
  assert.equal(er39Hop?.state, 'WAITING_DATA');
  assert.equal(er14Hop?.state, 'PASS');

  const failHops = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(failHops.length, 0, JSON.stringify(failHops));

  assert.equal(probeGuardianRlsTenantUniverseIsolation().isolationUnchanged, true);

  const proposal = exampleApiPricingProposal(agent);
  const brief = compileDailyRevenueBrief({
    actor: { ...agent, kind: 'daily_brief_compiler' },
    briefId: 'brief-home',
  });
  assert.ok(!('denied' in brief));
  const home = returnEr38EvidenceToHomeBase({
    actor: agent,
    proposal,
    brief,
  });
  assert.equal(home.authorityGranted, false);
});
