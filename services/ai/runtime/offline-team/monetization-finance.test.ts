import assert from 'node:assert/strict';
import { buildDefaultPricingCatalog, quotePlan } from './monetization';
import { rankFinanceRecommendations, summarizeFinanceCouncil } from './finance-council';
import { simulateRevenue } from './revenue-scenarios';
import { buildMonetizationEvidenceReport } from './monetization-evidence';

const plans = buildDefaultPricingCatalog();
assert.equal(plans.length >= 4, true);
assert.equal(quotePlan(plans[1], { seats: 12, pluginAddOns: 12, customWorkUsd: 100 }), 489);

const ranked = rankFinanceRecommendations([
  { recommendationId: 'a', role: 'CFO', title: 'Annual contracts', rationale: 'Improve cash predictability', estimatedMonthlyImpactUsd: 10000, confidence: 0.8, evidenceRefs: ['scenario:annual-contracts'], requiresHumanApproval: true },
  { recommendationId: 'b', role: 'PRICING_ANALYST', title: 'Unsupported idea', rationale: 'No evidence', estimatedMonthlyImpactUsd: 999999, confidence: 1, evidenceRefs: [], requiresHumanApproval: true },
]);
assert.equal(ranked.length, 1);
assert.equal(summarizeFinanceCouncil(ranked).executionAuthorized, false);

const scenario = simulateRevenue({
  name: 'base', customers: 100, averageMonthlyRevenuePerCustomerUsd: 299,
  monthlyChurnRate: 0.05, grossMargin: 0.8, monthlyFixedCostUsd: 10000,
  monthlyVariableCostPerCustomerUsd: 20,
});
assert.equal(scenario.scenarioOnly, true);
assert.equal(scenario.annualizedRevenueUsd > 0, true);

const report = buildMonetizationEvidenceReport({
  generatedAt: '2026-09-10T00:00:00.000Z', activeOffers: 4, signedContracts: 0,
  payingCustomers: 0, monthlyRecurringRevenueUsd: 0, evidenceRefs: [],
});
assert.equal(report.annualRecurringRevenueUsd, 0);
assert.equal(report.scenarioRevenueExcluded, true);

console.log('12D-30 monetization/finance intelligence contracts: OK');
