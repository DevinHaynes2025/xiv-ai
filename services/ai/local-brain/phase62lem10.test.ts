/**
 * 62L-EM10 — User Access Economy acceptance + denial tests.
 *
 * These tests MUST execute via `npm run test:62lem10`. Do not mark PASS without running.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCESS_ECONOMY_TIER_IDS,
  EM10_CORE_RULE,
  EM10_HONESTY_BANNER,
  EM10_LOCKS,
  ENTERPRISE_HIGH_PRICE_USD_PER_MONTH,
  NEXT_PHASE_EM11,
  assertAllTiersIsolationIntact,
  assertEm10LocksIntact,
  assertIsolationInvariant,
  createPricingExperimentMetrics,
  denyFakeSavingsClaim,
  em10HonestySnapshot,
  em10SoftWire,
  freeTierHasMeaningfulUtility,
  getAccessEconomyPlan,
  listAccessEconomyPlans,
  recommendAccessPlan,
  rejectFabricatedExperimentRoi,
  requestCustomTerms,
  type ValueCostEvidence,
} from './user-access-economy';

function evidence(overrides: Partial<ValueCostEvidence> = {}): ValueCostEvidence {
  return {
    costToServeUsd: 50,
    measurableCustomerValueUsd: 200,
    customerBudgetUsd: 10_000,
    evidenceNotes: ['measured cost-to-serve and value estimate from advisory ledger'],
    fabricatedRoiClaim: false,
    ...overrides,
  };
}

test('EM10 honesty banner, core rule, L4 off, next EM11 recorded', () => {
  assert.match(EM10_HONESTY_BANNER, /DOCUMENTED/);
  assert.match(EM10_CORE_RULE, /cost-to-serve/);
  assert.equal(assertEm10LocksIntact(), true);
  assert.equal(EM10_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EM10_LOCKS.TIP_LAND, false);
  assert.equal(EM10_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EM10_LOCKS.PRICING_ENGINE_CAN_BIND_LEGALLY, false);
  assert.equal(EM10_LOCKS.RECOMMEND_EQ_CHARGE, false);
  assert.equal(EM10_LOCKS.RECOMMEND_EQ_SIGN, false);
  assert.equal(EM10_LOCKS.FAKE_SAVINGS_CLAIMS, false);
  assert.equal(EM10_LOCKS.TIER_MAY_WEAKEN_PRIVACY, false);
  assert.equal(EM10_LOCKS.AMBITION_EQ_VALUATION, false);
  assert.match(NEXT_PHASE_EM11, /EM11/);
  const snap = em10HonestySnapshot();
  assert.equal(snap.l4AutonomyEnabled, false);
  assert.equal(snap.locksIntact, true);
});

test('soft-wire EM9 optional, EM1 optional, #157 affordability/ambition present on this base', () => {
  const wire = em10SoftWire();
  assert.equal(typeof wire.em9MarketSimulator.present, 'boolean');
  assert.equal(typeof wire.em1HomeBase.present, 'boolean');
  // Base is #157 home-base tip — affordability runtime + ambition types should be present.
  assert.equal(wire.em157AffordabilityGuard.present, true);
  assert.equal(wire.em157AmbitionTracker.present, true);
  assert.equal(wire.em157HomeBaseModule.present, true);
  assert.equal(wire.el9ResourceGovernor.present, true);
  assert.equal(wire.l4AutonomyEnabled, false);
  assert.match(wire.note, /Presence soft-wire/);
});

test('catalog encodes all six tiers with required plan fields', () => {
  const plans = listAccessEconomyPlans();
  assert.equal(plans.length, 6);
  assert.deepEqual(
    plans.map((p) => p.planId),
    [...ACCESS_ECONOMY_TIER_IDS],
  );
  for (const plan of plans) {
    assert.ok(typeof plan.planId === 'string');
    assert.ok(typeof plan.monthlyPrice === 'number');
    assert.ok(typeof plan.includedUsers === 'number');
    assert.ok(typeof plan.includedAgents === 'number');
    assert.ok(typeof plan.computeQuota.cpuUnitHours === 'number');
    assert.ok(typeof plan.storageQuota.gb === 'number');
    assert.ok(Array.isArray(plan.localOfflineFeatures));
    assert.ok(Array.isArray(plan.connectors));
    assert.ok(typeof plan.supportLevel === 'string');
    assert.ok(Array.isArray(plan.securityFeatures));
    assert.ok(Array.isArray(plan.dataLocalityOptions));
    assert.ok(typeof plan.overagePolicy === 'string');
    assert.ok('availabilityTarget' in plan.sla);
    assert.ok('upgradePath' in plan);
    assert.ok(plan.capabilities.length > 0);
    assert.equal(plan.privacyIsolationFloor.tenantIsolationRequired, true);
    assert.equal(plan.privacyIsolationFloor.crossTenantDataLeakAllowed, false);
  }
  assert.equal(getAccessEconomyPlan('enterprise').monthlyPrice, ENTERPRISE_HIGH_PRICE_USD_PER_MONTH);
});

test('Free users still get meaningful utility (non-empty capability set)', () => {
  assert.equal(freeTierHasMeaningfulUtility(), true);
  const free = getAccessEconomyPlan('free');
  assert.ok(free.capabilities.includes('basic_xiv_search'));
  assert.ok(free.capabilities.includes('limited_personal_agent'));
  assert.ok(free.capabilities.includes('public_community_knowledge'));
  assert.ok(free.localOfflineFeatures.length >= 2);
});

test('DENY fake savings claims', () => {
  const fake = denyFakeSavingsClaim({
    claimText: 'Organizations already save trillions with XIV',
  });
  assert.equal(fake.allowed, false);

  const guaranteed = denyFakeSavingsClaim({
    claimText: 'Guaranteed ROI in 30 days',
  });
  assert.equal(guaranteed.allowed, false);

  const noEvidence = denyFakeSavingsClaim({
    claimText: 'Customers will see savings this quarter',
    measuredSavingsUsd: null,
  });
  assert.equal(noEvidence.allowed, false);

  const ok = denyFakeSavingsClaim({
    claimText: 'Advisory pricing recommendation for review',
  });
  assert.equal(ok.allowed, true);
});

test('recommend ≠ charge/sign; pricing engine cannot bind legally', () => {
  const charge = recommendAccessPlan({
    planId: 'individual_pro',
    evidence: evidence({ costToServeUsd: 10, measurableCustomerValueUsd: 100 }),
    attemptCharge: true,
  });
  assert.equal(charge.status, 'RECOMMENDATION_BLOCKED');
  if (charge.status === 'RECOMMENDATION_BLOCKED') {
    assert.equal(charge.blockCode, 'AUTO_CHARGE_DENIED');
    assert.equal(charge.charged, false);
    assert.equal(charge.legallyBinding, false);
  }

  const sign = recommendAccessPlan({
    planId: 'individual_pro',
    evidence: evidence({ costToServeUsd: 10, measurableCustomerValueUsd: 100 }),
    attemptSign: true,
  });
  assert.equal(sign.status, 'RECOMMENDATION_BLOCKED');
  if (sign.status === 'RECOMMENDATION_BLOCKED') {
    assert.equal(sign.blockCode, 'AUTO_SIGN_DENIED');
  }

  const bind = recommendAccessPlan({
    planId: 'individual_pro',
    evidence: evidence({ costToServeUsd: 10, measurableCustomerValueUsd: 100 }),
    attemptLegalBind: true,
  });
  assert.equal(bind.status, 'RECOMMENDATION_BLOCKED');
  if (bind.status === 'RECOMMENDATION_BLOCKED') {
    assert.equal(bind.blockCode, 'LEGAL_BIND_DENIED');
  }

  const ok = recommendAccessPlan({
    planId: 'individual_pro',
    evidence: evidence({ costToServeUsd: 10, measurableCustomerValueUsd: 100 }),
  });
  assert.equal(ok.status, 'RECOMMENDATION_ONLY');
  if (ok.status === 'RECOMMENDATION_ONLY') {
    assert.equal(ok.charged, false);
    assert.equal(ok.signed, false);
    assert.equal(ok.legallyBinding, false);
  }
});

test('enterprise $300k/mo without proportional value → RECOMMENDATION_BLOCKED', () => {
  const blocked = recommendAccessPlan({
    planId: 'enterprise',
    evidence: evidence({
      costToServeUsd: 10,
      measurableCustomerValueUsd: 20,
      customerBudgetUsd: 1_000_000,
      evidenceNotes: ['thin evidence'],
    }),
  });
  assert.equal(blocked.status, 'RECOMMENDATION_BLOCKED');
  if (blocked.status === 'RECOMMENDATION_BLOCKED') {
    assert.equal(blocked.blockCode, 'VALUE_COST_UNJUSTIFIED');
  }

  const justified = recommendAccessPlan({
    planId: 'enterprise',
    evidence: evidence({
      costToServeUsd: 150_000,
      measurableCustomerValueUsd: 500_000,
      customerBudgetUsd: 600_000,
      evidenceNotes: [
        'dedicated environment cost model',
        'measured customer workflow value band',
      ],
    }),
  });
  assert.equal(justified.status, 'RECOMMENDATION_ONLY');
  if (justified.status === 'RECOMMENDATION_ONLY') {
    assert.equal(justified.humanApprovalRequired, true);
    assert.equal(justified.legallyBinding, false);
  }
});

test('affordability soft-wire: over-budget / below cost-to-serve blocked', () => {
  const overBudget = recommendAccessPlan({
    planId: 'growth_midmarket',
    evidence: evidence({
      costToServeUsd: 100,
      measurableCustomerValueUsd: 5_000,
      customerBudgetUsd: 100,
    }),
  });
  assert.equal(overBudget.status, 'RECOMMENDATION_BLOCKED');
  if (overBudget.status === 'RECOMMENDATION_BLOCKED') {
    assert.equal(overBudget.blockCode, 'AFFORDABILITY_DENIED');
  }

  const belowCost = recommendAccessPlan({
    planId: 'individual_pro',
    evidence: evidence({
      costToServeUsd: 100,
      measurableCustomerValueUsd: 200,
      customerBudgetUsd: 1_000,
    }),
  });
  assert.equal(belowCost.status, 'RECOMMENDATION_BLOCKED');
  if (belowCost.status === 'RECOMMENDATION_BLOCKED') {
    assert.equal(belowCost.blockCode, 'AFFORDABILITY_DENIED');
  }
});

test('fake savings claim on recommend path blocked', () => {
  const blocked = recommendAccessPlan({
    planId: 'entrepreneur_smb',
    evidence: evidence({ costToServeUsd: 50, measurableCustomerValueUsd: 500 }),
    savingsClaimText: 'Guaranteed ROI — will save $1M automatically',
  });
  assert.equal(blocked.status, 'RECOMMENDATION_BLOCKED');
  if (blocked.status === 'RECOMMENDATION_BLOCKED') {
    assert.equal(blocked.blockCode, 'FAKE_SAVINGS_DENIED');
  }
});

test('custom terms / discounts / credits / exclusivity require human approval; cannot auto-bind', () => {
  for (const kind of ['contract', 'discount', 'credit', 'exclusivity', 'custom_sla'] as const) {
    const pending = requestCustomTerms({
      planId: 'enterprise',
      kind,
      summary: `${kind} terms draft`,
      humanApproved: false,
    });
    assert.equal(pending.status, 'HUMAN_APPROVAL_REQUIRED');
    assert.equal(pending.legallyBinding, false);
  }

  const auto = requestCustomTerms({
    planId: 'enterprise',
    kind: 'contract',
    summary: 'try auto bind',
    humanApproved: true,
    attemptAutoBind: true,
  });
  assert.equal(auto.status, 'DENIED');
  assert.equal(auto.legallyBinding, false);

  const approved = requestCustomTerms({
    planId: 'strategic_sovereign',
    kind: 'negotiated_usage',
    summary: 'human-reviewed usage band',
    humanApproved: true,
  });
  assert.equal(approved.status, 'HUMAN_APPROVED_ADVISORY');
  if (approved.status === 'HUMAN_APPROVED_ADVISORY') {
    assert.equal(approved.approved, true);
    assert.equal(approved.legallyBinding, false);
    assert.equal(approved.charged, false);
    assert.equal(approved.signed, false);
  }
});

test('pricing experiment metrics schema tracks required fields; no fabricated ROI', () => {
  const schema = createPricingExperimentMetrics({ experimentId: 'exp-em10-1' });
  assert.equal(schema.fabricatedRoiForbidden, true);
  assert.equal(schema.autoPriceForbidden, true);
  assert.equal(schema.tracked.conversion, null);
  assert.equal(schema.tracked.retention, null);
  assert.equal(schema.tracked.grossMargin, null);
  assert.equal(schema.tracked.supportLoad, null);
  assert.equal(schema.tracked.computeCostUsd, null);
  assert.equal(schema.tracked.storageCostUsd, null);
  assert.equal(schema.tracked.realizedCustomerRoi, null);

  const instrumented = createPricingExperimentMetrics({
    experimentId: 'exp-em10-2',
    measured: {
      conversion: 0.12,
      retention: 0.8,
      grossMargin: 0.55,
      supportLoad: 3.2,
      computeCostUsd: 40,
      storageCostUsd: 5,
    },
  });
  assert.equal(instrumented.state, 'INSTRUMENTED_WAITING_DATA');
  assert.equal(instrumented.tracked.realizedCustomerRoi, null);

  const rejected = rejectFabricatedExperimentRoi(instrumented, 9_999_999);
  assert.equal(rejected.ok, false);
  assert.equal(rejected.schema.tracked.realizedCustomerRoi, null);
});

test('isolation invariant: tiers cannot weaken privacy or tenant isolation', () => {
  const all = assertAllTiersIsolationIntact();
  assert.equal(all.ok, true);
  const pair = assertIsolationInvariant('free', 'enterprise');
  assert.equal(pair.ok, true);
  assert.equal(pair.privacyWeakened, false);
  assert.equal(pair.tenantIsolationWeakened, false);
  for (const plan of listAccessEconomyPlans()) {
    assert.ok(plan.securityFeatures.includes('baseline_tenant_isolation'));
  }
});

test('upgrade paths form a chain Free → … → Strategic', () => {
  assert.equal(getAccessEconomyPlan('free').upgradePath, 'individual_pro');
  assert.equal(getAccessEconomyPlan('individual_pro').upgradePath, 'entrepreneur_smb');
  assert.equal(getAccessEconomyPlan('entrepreneur_smb').upgradePath, 'growth_midmarket');
  assert.equal(getAccessEconomyPlan('growth_midmarket').upgradePath, 'enterprise');
  assert.equal(getAccessEconomyPlan('enterprise').upgradePath, 'strategic_sovereign');
  assert.equal(getAccessEconomyPlan('strategic_sovereign').upgradePath, null);
});
