/**
 * 62L-ES1 — Research-to-Product Candidate Gate denial + honesty tests.
 *
 * Script: npm run test:62les1
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ES1_AGENT_BOUNDS,
  ES1_DB_CANDIDATES_STATUS,
  ES1_LOCKS,
  ES1_MAY,
  ES1_MUST_NOT,
  ES_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_ISSUE_NOTE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PRODUCT_CANDIDATE_FIELDS,
  PRODUCT_CANDIDATE_STATES,
  PROMOTION_REQUIREMENTS,
  QUANTUM_PRODUCT_STATUSES,
  RESEARCH_TO_PRODUCT_CANDIDATE_GATE_CYCLE,
  RESEARCH_TO_PRODUCT_CORE_FLOW,
  RESEARCH_TO_PRODUCT_TRUTH_BOUNDARY,
  assertEs1LocksIntact,
  es1SoftWireSnapshot,
  productIsNotProduction,
  quantumStatusCannotBeUpgradedByMarketing,
  researchIsNotProduct,
  type Es1Actor,
} from './research-to-product-candidate-gate-types.ts';

import {
  attemptAutoCloudPurchase,
  attemptAutoContract,
  attemptAutoCustomerLaunch,
  attemptAutoPricingCommitment,
  attemptAutoProductionRelease,
  attemptPublicClaim,
  attemptQuantumStatusUpgrade,
  attemptRecommendAsAct,
  attachRiskAndOwnership,
  bootstrapResearchToProductCandidateGate,
  buildValueCase,
  checklistFromCandidate,
  defineProblem,
  definePrototypeScope,
  defineTestPlan,
  exampleAmdLocalRoutingOptimizerCandidate,
  formPricingHypothesis,
  formProductHypothesis,
  identifyUserBuyer,
  ingestValidatedResearch,
  probeGuardianRlsTenantUniverseIsolation,
  promoteToSandboxCandidate,
  requireHumanApproval,
  returnEvidenceToHomeBase,
  runResearchToProductCandidateGateCycle,
} from './research-to-product-candidate-gate-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Es1Actor = {
  kind: 'research_to_product_gate',
  id: 'es1-gate-1',
  orgId: 'org-es1',
  tenantId: 'ten-es1',
  universeId: 'uni-es1',
  permissions: ['draft'],
};

const human: Es1Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-es1',
  tenantId: 'ten-es1',
  universeId: 'uni-es1',
  permissions: ['approve_consequential'],
};

test('SoT label ES1 / 62L-ES; no invented issue; next ES2 Product Hypothesis Factory', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES1');
  assert.equal(GITHUB_SOT_FAMILY, '62L-ES');
  assert.equal(GITHUB_SOT_ISSUE, null);
  assert.match(GITHUB_SOT_ISSUE_NOTE, /no issue number invented/i);
  assert.match(GITHUB_SOT_TITLE, /Research-to-Product Candidate Gate/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ES2/);
  assert.match(NEXT_PHASE_TITLE, /Product Hypothesis Factory/);
  assert.match(ES_LAYER_TITLE, /Autonomous Research & Productization Factory/);
});

test('honesty locks: L4 false; research≠product≠production; quantum freeze; no auto prod/pricing', () => {
  assert.equal(assertEs1LocksIntact(), true);
  assert.equal(ES1_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ES1_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ES1_LOCKS.AUTOMATIC_PRODUCTION_RELEASE, false);
  assert.equal(ES1_LOCKS.AUTOMATIC_PRICING_COMMITMENT, false);
  assert.equal(ES1_LOCKS.AUTOMATIC_CUSTOMER_LAUNCH, false);
  assert.equal(ES1_LOCKS.AUTOMATIC_CONTRACT, false);
  assert.equal(ES1_LOCKS.AUTOMATIC_CLOUD_PURCHASE, false);
  assert.equal(ES1_LOCKS.QUANTUM_STATUS_MARKETING_UPGRADE, false);
  assert.equal(ES1_LOCKS.INCOMPLETE_PROMOTION_ALLOWED, false);
  assert.equal(ES1_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(researchIsNotProduct(), true);
  assert.equal(productIsNotProduction(), true);
  assert.equal(quantumStatusCannotBeUpgradedByMarketing(), true);
  assert.equal(ES1_AGENT_BOUNDS.mayAutoReleaseToProduction, false);
  assert.equal(ES1_AGENT_BOUNDS.mayRecommendOnly, true);
  assert.ok(ES1_MAY.length >= 5);
  assert.ok(ES1_MUST_NOT.includes('promote_incomplete_candidate'));
  assert.ok(ES1_MUST_NOT.includes('upgrade_quantum_status_via_product_marketing'));
  assert.equal(
    RESEARCH_TO_PRODUCT_TRUTH_BOUNDARY.noAutomaticProductionRelease,
    true,
  );
});

test('fields + states + core flow + promotion requirements + quantum statuses encoded', () => {
  assert.equal(PRODUCT_CANDIDATE_FIELDS.length, 23);
  assert.ok(PRODUCT_CANDIDATE_FIELDS.includes('candidateId'));
  assert.ok(PRODUCT_CANDIDATE_FIELDS.includes('quantumStatus'));
  assert.ok(PRODUCT_CANDIDATE_FIELDS.includes('pricingHypothesis'));
  assert.deepEqual([...PRODUCT_CANDIDATE_STATES], [
    'RESEARCH_ONLY',
    'PRODUCT_HYPOTHESIS',
    'SANDBOX_CANDIDATE',
    'PROTOTYPE_READY',
    'TESTING',
    'VALIDATED_CANDIDATE',
    'REJECTED',
    'BLOCKED',
  ]);
  assert.equal(RESEARCH_TO_PRODUCT_CORE_FLOW[0], 'validated_research');
  assert.equal(RESEARCH_TO_PRODUCT_CORE_FLOW.at(-1), 'candidate');
  assert.equal(PROMOTION_REQUIREMENTS.length, 8);
  assert.ok(PROMOTION_REQUIREMENTS.includes('clear_user_problem_fit'));
  assert.ok(PROMOTION_REQUIREMENTS.includes('human_ownership'));
  assert.deepEqual([...QUANTUM_PRODUCT_STATUSES], [
    'THEORETICAL',
    'SIMULATED',
    'QUANTUM_INSPIRED',
    'PHYSICAL_QPU_VERIFIED',
  ]);
  assert.ok(RESEARCH_TO_PRODUCT_CANDIDATE_GATE_CYCLE.includes('deny_incomplete_promotion'));
  assert.ok(RESEARCH_TO_PRODUCT_CANDIDATE_GATE_CYCLE.includes('deny_quantum_status_upgrade'));
  assert.ok(RESEARCH_TO_PRODUCT_CANDIDATE_GATE_CYCLE.includes('l4_autonomy_false'));
});

test('incomplete promotion denied; complete promotion → SANDBOX_CANDIDATE', () => {
  let cand = ingestValidatedResearch({
    actor: agent,
    candidateId: 'c-incomplete',
    sourceResearch: 'finding',
    quantumStatus: 'THEORETICAL',
  });
  assert.ok(!('denied' in cand));
  if ('denied' in cand) return;
  assert.equal(cand.state, 'RESEARCH_ONLY');

  const incomplete = promoteToSandboxCandidate({ candidate: cand });
  assert.equal('denied' in incomplete, true);
  if ('denied' in incomplete) {
    assert.equal(incomplete.state, 'DENIED');
    assert.match(incomplete.reason, /Incomplete promotion denied/);
    assert.ok((incomplete.missingRequirements?.length ?? 0) > 0);
  }

  const forced = promoteToSandboxCandidate({
    candidate: cand,
    forceIncomplete: true,
  });
  assert.equal('denied' in forced, true);

  cand = defineProblem(cand, 'Optimize local routing for workload X') as typeof cand;
  assert.ok(!('denied' in cand));
  cand = formProductHypothesis({
    candidate: cand,
    valueHypothesis: 'Local optimizer reduces cost for workload X',
    industry: 'local_compute',
  }) as typeof cand;
  assert.ok(!('denied' in cand));
  assert.equal(cand.state, 'PRODUCT_HYPOTHESIS');
  cand = identifyUserBuyer({
    candidate: cand,
    targetUserCustomer: 'XIV local operators',
  }) as typeof cand;
  cand = buildValueCase({
    candidate: cand,
    measurableSuccessMetrics: ['p95_latency'],
  }) as typeof cand;
  cand = definePrototypeScope({
    candidate: cand,
    prototypeScope: 'sandbox optimizer',
    acceptanceCriteria: ['bench_pass'],
    requiredComputePath: ['CPU', 'GPU'],
    securityPrivacyRequirements: ['tenant_isolation'],
    classicalBaseline: 'cpu-only',
  }) as typeof cand;
  cand = defineTestPlan({
    candidate: cand,
    testPlan: ['benchmark', 'repeatability'],
  }) as typeof cand;
  cand = formPricingHypothesis({
    candidate: cand,
    pricingHypothesis: 'add-on hypothesis',
    estimatedCostToBuild: 'est-build',
    estimatedCostToServe: 'est-serve',
  }) as typeof cand;
  cand = attachRiskAndOwnership({
    candidate: cand,
    owner: 'human-owner-1',
    rollbackStopConditions: ['stop_on_regression'],
  }) as typeof cand;
  cand = {
    ...cand,
    evidenceRefs: ['ev://1'],
  };

  const checklist = checklistFromCandidate(cand);
  assert.equal(checklist.clearUserProblemFit, true);
  assert.equal(checklist.humanOwnership, true);

  const promoted = promoteToSandboxCandidate({ candidate: cand });
  assert.ok(!('denied' in promoted));
  if ('denied' in promoted) return;
  assert.equal(promoted.state, 'SANDBOX_CANDIDATE');
  assert.equal(promoted.productionReleaseAuthorized, false);
  assert.equal(promoted.productIsNotProduction, true);
});

test('quantum status freeze — marketing cannot upgrade SIMULATED → PHYSICAL_QPU_VERIFIED', () => {
  const cand = ingestValidatedResearch({
    actor: agent,
    candidateId: 'c-q',
    sourceResearch: 'QI routing research',
    quantumStatus: 'SIMULATED',
    evidenceRefs: ['ev://qi'],
  });
  assert.ok(!('denied' in cand));
  if ('denied' in cand) return;

  const upgraded = attemptQuantumStatusUpgrade({
    candidate: cand,
    claimedStatus: 'PHYSICAL_QPU_VERIFIED',
    viaMarketing: true,
  });
  assert.equal('denied' in upgraded, true);
  if ('denied' in upgraded) {
    assert.match(upgraded.reason, /Quantum status freeze/);
    assert.match(upgraded.reason, /SIMULATED/);
  }

  const same = attemptQuantumStatusUpgrade({
    candidate: cand,
    claimedStatus: 'SIMULATED',
  });
  assert.ok(!('denied' in same));
  if (!('denied' in same)) {
    assert.equal(same.quantumStatus, 'SIMULATED');
  }

  const downgrade = attemptQuantumStatusUpgrade({
    candidate: cand,
    claimedStatus: 'THEORETICAL',
  });
  assert.ok(!('denied' in downgrade));
});

test('research≠product≠production; governance denies; L4 false; AMD scenario', () => {
  const example = exampleAmdLocalRoutingOptimizerCandidate();
  assert.equal(example.researchIsNotProduct, true);
  assert.equal(example.productIsNotProduction, true);
  assert.equal(example.productionReleaseAuthorized, false);
  assert.equal(example.pricingCommitmentAuthorized, false);
  assert.equal(example.state, 'PRODUCT_HYPOTHESIS');
  assert.match(example.sourceResearch, /AMD local routing/);
  assert.match(example.prototypeScope, /Sandbox/);
  assert.ok(example.testPlan.includes('benchmark'));
  assert.ok(example.testPlan.includes('repeatability'));
  assert.ok(
    example.blockers.some((b) => b.includes('supported_hardware_matrix')),
  );

  assert.equal(attemptAutoProductionRelease(example).denied, true);
  assert.equal(attemptAutoPricingCommitment(example).denied, true);
  assert.equal(attemptAutoCustomerLaunch(example).denied, true);
  assert.equal(attemptAutoContract(example).denied, true);
  assert.equal(attemptAutoCloudPurchase(example).denied, true);
  assert.equal(
    attemptPublicClaim({
      candidate: example,
      claim: 'XIV Local Compute Optimizer ships to customers today',
    }).denied,
    true,
  );
  assert.equal(attemptRecommendAsAct().denied, true);
  assert.equal(ES1_LOCKS.L4_AUTONOMY_ENABLED, false);

  const iso = probeGuardianRlsTenantUniverseIsolation({
    actor: agent,
    candidateTenantId: 'ten-es1',
    candidateUniverseId: 'uni-es1',
  });
  assert.equal(iso.isolated, true);
  assert.equal(iso.sameTenant, true);
  assert.equal(iso.l4, false);

  const deniedHuman = requireHumanApproval({
    actor: agent,
    action: 'production_release',
  });
  assert.equal(deniedHuman.approved, false);
  const okHuman = requireHumanApproval({
    actor: human,
    action: 'sandbox_review',
  });
  assert.equal(okHuman.approved, true);

  const receipt = returnEvidenceToHomeBase({
    candidate: example,
    summary: 'scenario evidence',
  });
  assert.equal(receipt.productionAuthorized, false);
});

test('bootstrap + soft-wire + cycle; absent soft-wires WAITING_DATA (not FAIL); presence ≠ VERIFIED', () => {
  const boot = bootstrapResearchToProductCandidateGate(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, null);

  const soft = es1SoftWireSnapshot(repoRoot);
  // On xiv-v2 tip, prior ER/EQ park modules are typically absent → WAITING_DATA.
  for (const [label, probe] of [
    ['ER40', soft.er40FounderBrief],
    ['ER39', soft.er39RevenueEvidence],
    ['ER18', soft.er18ResearchReviewBoard],
    ['ER7', soft.er7ScienceEngineeringAtlas],
    ['EQ16', soft.eq16SoftwareWormholeRouter],
    ['EP7', soft.ep7AmdAdapterResearchPath],
    ['EM157', soft.em157HomeBase],
  ] as const) {
    if (!probe.present) {
      assert.match(probe.note, /WAITING_DATA/, `${label} absent note`);
    } else {
      assert.match(probe.note, /PRESENT/, `${label} present note`);
    }
  }

  const cycle = runResearchToProductCandidateGateCycle({
    actor: agent,
    repoRoot,
  });
  assert.ok(cycle.hops.length >= 30);
  assert.equal(cycle.incompleteDenied.denied, true);
  assert.ok(!('denied' in cycle.promoted));
  if (!('denied' in cycle.promoted)) {
    assert.equal(cycle.promoted.state, 'SANDBOX_CANDIDATE');
  }

  for (const hopName of [
    'er40_founder_brief_soft_wire',
    'er39_revenue_evidence_soft_wire',
    'er18_review_board_soft_wire',
    'er7_science_atlas_soft_wire',
    'eq16_wormhole_soft_wire',
    'ep7_amd_adapter_soft_wire',
    'em157_soft_wire',
  ] as const) {
    const h = cycle.hops.find((x) => x.hop === hopName);
    assert.ok(h, hopName);
    assert.ok(
      h.state === 'PASS' || h.state === 'WAITING_DATA',
      `${hopName} must be PASS or WAITING_DATA, got ${h.state}`,
    );
    assert.notEqual(h.state, 'FAIL');
  }

  const qDeny = cycle.hops.find((h) => h.hop === 'deny_quantum_status_upgrade');
  assert.ok(qDeny);
  assert.equal(qDeny.state, 'DENIED');

  const l4 = cycle.hops.find((h) => h.hop === 'l4_autonomy_false');
  assert.ok(l4);
  assert.equal(l4.state, 'PASS');

  const researchNeq = cycle.hops.find((h) => h.hop === 'research_neq_product');
  assert.ok(researchNeq);
  assert.equal(researchNeq.state, 'PASS');
});
