/**
 * 62L-EO1 — Government Contracts Command Center denial + honesty tests.
 *
 * Script: npm run test:62leo1
 * Covers: discovery≠eligibility; no fabricate cert/clearance/past-perf/quantum;
 * quantum claim ladder; no auto submit/sign/represent; no classified/export bypass;
 * no autonomous purchase/subcontract/dispatch; CFO council denies; L4=false;
 * soft-wire EO#159 + EN#158; Guardian/RLS/tenant/Universe isolation.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EO1_DB_CANDIDATES_STATUS,
  EO1_LOCKS,
  EO1_MAY,
  EO1_MUST_NOT,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOV_CONTRACTS_COMMAND_CENTER_VIEWS,
  GOV_CONTRACTS_COMMAND_CENTER_WORKFLOW,
  GOVERNMENT_CONTRACTS_COMMAND_CENTER_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  QUANTUM_CLAIM_STATES,
  SOFT_WIRE_EN_ISSUE,
  SOFT_WIRE_EO_ISSUE,
  TRACKED_OPPORTUNITY_FIELDS,
  assertEo1LocksIntact,
  eo1SoftWireSnapshot,
} from './government-contracts-command-center-types.ts';
import {
  attemptAutoMakeRepresentation,
  attemptAutoSignCertification,
  attemptAutoSubmitBid,
  attemptClassifiedDataAccess,
  attemptCfoCouncilAutonomy,
  attemptExportControlBypass,
  attemptFabricateCertification,
  attemptFabricateClearance,
  attemptFabricatePastPerformance,
  attemptFabricateQuantumCapability,
  attemptFabricateRegistration,
  bootstrapGovernmentContractsCommandCenter,
  buildCommandCenterViewModels,
  buildComplianceMatrix,
  decomposeRequirements,
  draftCapturePlan,
  draftProposal,
  draftSolutionArchitecture,
  modelLogistics,
  openPricingScenario,
  prepareSubmissionPackage,
  probeGuardianRlsTenantUniverseIsolation,
  recommendBidNoBid,
  recordQuantumAiEvidence,
  recordWinLossLearning,
  registerGovernmentOpportunity,
  requireHumanApproval,
  runGovernmentContractsCommandCenterCycle,
} from './government-contracts-command-center-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const curator = {
  kind: 'capture_owner' as const,
  id: 'cap-1',
  orgId: 'org-eo1',
  tenantId: 'ten-eo1',
  universeId: 'uni-eo1',
  permissions: ['draft_capture_plan', 'recommend_bid_no_bid'],
};

const human = {
  ...curator,
  kind: 'human_approver' as const,
  id: 'human-1',
  permissions: ['approve_consequential', 'authorize_submission'],
};

const cfo = {
  kind: 'cfo_council' as const,
  id: 'cfo-1',
  orgId: 'org-eo1',
  tenantId: 'ten-eo1',
  universeId: 'uni-eo1',
  permissions: ['price_scenario', 'margin_advise'],
};

test('SoT label EO1; soft-wire issue refs #159/#158; GitLab mirror not invented; next EO2', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EO1');
  assert.match(GITHUB_SOT_TITLE, /Government Contracts Command Center/);
  assert.equal(SOFT_WIRE_EO_ISSUE, 159);
  assert.equal(SOFT_WIRE_EN_ISSUE, 158);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EO2/);
  assert.match(NEXT_PHASE_TITLE, /Agency Knowledge Graph/);
});

test('honesty locks: L4 false + DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION; DB NOT_APPLIED', () => {
  assert.equal(assertEo1LocksIntact(), true);
  assert.equal(EO1_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EO1_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EO1_LOCKS.TIP_LAND, false);
  assert.equal(EO1_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.equal(EO1_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EO1_LOCKS.DOCUMENTED_EQ_IMPLEMENTED, false);
  assert.equal(EO1_LOCKS.IMPLEMENTED_EQ_VERIFIED, false);
  assert.equal(EO1_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('tracked fields + workflow + views encoded', () => {
  for (const field of [
    'opportunityId',
    'agencyBureau',
    'solicitationOrNoticeId',
    'contractType',
    'naics',
    'psc',
    'dueDate',
    'estimatedValue',
    'setAsideStatus',
    'missionProblemStatement',
    'logisticsSupplyChainRequirements',
    'digitalProductRequirements',
    'physicalProductRequirements',
    'aiQuantumRequirements',
    'complianceRequirements',
    'requiredCertificationsEvidence',
    'pricingModel',
    'captureOwner',
    'proposalOwner',
    'technicalOwner',
    'cfoAccountantReview',
    'legalComplianceReview',
    'probability',
    'blockers',
    'approvalState',
  ] as const) {
    assert.ok(TRACKED_OPPORTUNITY_FIELDS.includes(field), field);
  }

  assert.deepEqual(
    [...GOV_CONTRACTS_COMMAND_CENTER_WORKFLOW],
    [
      'opportunity',
      'requirement_decomposition',
      'bid_no_bid',
      'capture_plan',
      'solution_architecture',
      'logistics_model',
      'quantum_ai_evidence',
      'pricing',
      'compliance_matrix',
      'proposal',
      'human_approval',
      'submission',
      'performance_control_tower',
    ],
  );

  assert.deepEqual(
    [...GOV_CONTRACTS_COMMAND_CENTER_VIEWS],
    [
      'opportunity_pipeline',
      'agency_intelligence',
      'requirements',
      'logistics_supply_chain',
      'quantum_ai_capability_matrix',
      'proposal_factory',
      'pricing_war_room',
      'compliance_evidence_vault',
      'negotiation_room',
      'contract_performance',
      'win_loss_learning',
    ],
  );

  const views = buildCommandCenterViewModels();
  assert.equal(views.length, GOV_CONTRACTS_COMMAND_CENTER_VIEWS.length);
  assert.ok(views.every((v) => v.cards === false));
});

test('public discovery ≠ eligibility', () => {
  assert.equal(EO1_LOCKS.PUBLIC_DISCOVERY_EQ_ELIGIBILITY, false);

  const denied = registerGovernmentOpportunity({
    opportunityId: 'opp-bad',
    agencyBureau: 'DoD',
    solicitationOrNoticeId: 'N-1',
    contractType: 'FFP',
    missionProblemStatement: 'test',
    actor: curator,
    claimedEligibleFromDiscovery: true,
  });
  assert.equal('denied' in denied && denied.denied, true);

  const opp = registerGovernmentOpportunity({
    opportunityId: 'opp-1',
    agencyBureau: 'GSA',
    solicitationOrNoticeId: 'RFQ-1',
    contractType: 'T&M',
    missionProblemStatement: 'Modernize logistics twin',
    actor: curator,
    naics: '541512',
  });
  assert.ok(!('denied' in opp));
  if (!('denied' in opp)) {
    assert.equal(opp.discoveryState, 'DISCOVERED_NOT_ELIGIBLE');
    assert.equal(opp.eligibilityConfirmed, false);
    assert.equal(opp.orgId, 'org-eo1');
    assert.equal(opp.tenantId, 'ten-eo1');
    assert.equal(opp.universeId, 'uni-eo1');
  }
});

test('fabrication denies: registration/certification/clearance/past performance/quantum', () => {
  assert.equal(attemptFabricateRegistration().state, 'DENIED');
  assert.equal(attemptFabricateCertification().state, 'DENIED');
  assert.equal(attemptFabricateClearance().state, 'DENIED');
  assert.equal(attemptFabricatePastPerformance().state, 'DENIED');
  assert.equal(attemptFabricateQuantumCapability().state, 'DENIED');
  assert.ok(EO1_MUST_NOT.includes('fabricate_certifications'));
  assert.ok(EO1_MUST_NOT.includes('fabricate_quantum_capability'));
});

test('quantum claim ladder: THEORETICAL|SIMULATED|QUANTUM_INSPIRED|PHYSICAL_QPU_VERIFIED; no fabricate', () => {
  assert.deepEqual([...QUANTUM_CLAIM_STATES], [
    'THEORETICAL',
    'SIMULATED',
    'QUANTUM_INSPIRED',
    'PHYSICAL_QPU_VERIFIED',
  ]);

  const theoretical = recordQuantumAiEvidence({
    evidenceId: 'q1',
    opportunityId: 'opp-1',
    claimState: 'THEORETICAL',
    classicalBaselinePresent: true,
    summary: 'theory only',
  });
  assert.ok(!('denied' in theoretical));
  if (!('denied' in theoretical)) {
    assert.equal(theoretical.claimState, 'THEORETICAL');
    assert.equal(theoretical.fabricated, false);
  }

  const simulated = recordQuantumAiEvidence({
    evidenceId: 'q2',
    opportunityId: 'opp-1',
    claimState: 'SIMULATED',
    classicalBaselinePresent: true,
    summary: 'sim',
  });
  assert.ok(!('denied' in simulated));

  const inspired = recordQuantumAiEvidence({
    evidenceId: 'q3',
    opportunityId: 'opp-1',
    claimState: 'QUANTUM_INSPIRED',
    classicalBaselinePresent: true,
    summary: 'inspired',
  });
  assert.ok(!('denied' in inspired));

  const physical = recordQuantumAiEvidence({
    evidenceId: 'q4',
    opportunityId: 'opp-1',
    claimState: 'PHYSICAL_QPU_VERIFIED',
    classicalBaselinePresent: true,
    summary: 'attempt physical',
  });
  assert.equal('denied' in physical && physical.denied, true);

  const fabricate = recordQuantumAiEvidence({
    evidenceId: 'q5',
    opportunityId: 'opp-1',
    claimState: 'THEORETICAL',
    classicalBaselinePresent: false,
    summary: 'fab',
    attemptFabricatePhysicalQpu: true,
  });
  assert.equal('denied' in fabricate && fabricate.denied, true);
});

test('hard autonomy denies: no auto submit/sign/represent + classified/export + logistics', () => {
  assert.equal(EO1_LOCKS.AUTO_SUBMIT_BID, false);
  assert.equal(EO1_LOCKS.AUTO_SIGN_CERTIFICATION, false);
  assert.equal(EO1_LOCKS.AUTO_MAKE_REPRESENTATION, false);
  assert.equal(EO1_LOCKS.CLASSIFIED_DATA_ACCESS, false);
  assert.equal(EO1_LOCKS.EXPORT_CONTROL_BYPASS, false);

  const submit = attemptAutoSubmitBid();
  assert.equal(submit.state, 'DENIED');
  assert.equal(submit.executed, false);
  assert.equal(submit.autoSubmitted, false);

  const sign = attemptAutoSignCertification();
  assert.equal(sign.state, 'DENIED');
  assert.equal(sign.autoSigned, false);

  const rep = attemptAutoMakeRepresentation();
  assert.equal(rep.state, 'DENIED');

  assert.equal(attemptClassifiedDataAccess().state, 'DENIED');
  assert.equal(attemptExportControlBypass().bypassed, false);

  const dispatch = modelLogistics({
    modelId: 'm1',
    opportunityId: 'opp-1',
    supplyChainNotes: ['n'],
    attemptDispatch: true,
  });
  assert.equal('denied' in dispatch && dispatch.denied, true);

  const purchase = modelLogistics({
    modelId: 'm2',
    opportunityId: 'opp-1',
    supplyChainNotes: ['n'],
    attemptPurchase: true,
  });
  assert.equal('denied' in purchase && purchase.denied, true);

  const sub = modelLogistics({
    modelId: 'm3',
    opportunityId: 'opp-1',
    supplyChainNotes: ['n'],
    attemptSubcontractCommit: true,
  });
  assert.equal('denied' in sub && sub.denied, true);

  assert.ok(EO1_MAY.includes('draft_proposal_packages'));
  assert.ok(EO1_MUST_NOT.includes('autonomously_submit_bids'));
  assert.ok(EO1_MUST_NOT.includes('access_classified_data'));
});

test('CFO council denies auto bid / price-commit / spend / sign', () => {
  assert.equal(EO1_LOCKS.CFO_COUNCIL_MAY_AUTO_BID, false);
  assert.equal(EO1_LOCKS.CFO_COUNCIL_MAY_AUTO_PRICE_COMMIT, false);
  assert.equal(EO1_LOCKS.CFO_COUNCIL_MAY_AUTO_SPEND, false);
  assert.equal(EO1_LOCKS.CFO_COUNCIL_MAY_AUTO_SIGN, false);

  for (const action of ['submit_bid', 'authorize_spend', 'sign_certification'] as const) {
    const r = attemptCfoCouncilAutonomy(action);
    assert.equal(r.state, 'DENIED');
    assert.match(r.reason, /CFO_COUNCIL_DENY/);
  }

  const priceBind = openPricingScenario({
    scenarioId: 'p1',
    opportunityId: 'opp-1',
    recommendedPriceUsd: 100,
    attemptBind: true,
    actor: cfo,
  });
  assert.equal('denied' in priceBind && priceBind.denied, true);
  if ('denied' in priceBind) {
    assert.match(priceBind.reason, /CFO_COUNCIL_DENY/);
  }
});

test('proposal draft OK; auto submit/sign/represent/certify DENIED; human gate', () => {
  const draft = draftProposal({
    proposalId: 'pr-1',
    opportunityId: 'opp-1',
    sections: ['technical', 'price'],
  });
  assert.ok(!('denied' in draft));
  if (!('denied' in draft)) {
    assert.equal(draft.drafted, true);
    assert.equal(draft.submitted, false);
  }

  const submitAttempt = draftProposal({
    proposalId: 'pr-2',
    opportunityId: 'opp-1',
    sections: ['technical'],
    attemptSubmit: true,
  });
  assert.equal('denied' in submitAttempt && submitAttempt.denied, true);

  const certify = buildComplianceMatrix({
    matrixId: 'cm-1',
    opportunityId: 'opp-1',
    rows: [{ requirementId: 'r1', proposalSection: 'c', status: 'advisory' }],
    attemptAutoCertify: true,
  });
  assert.equal('denied' in certify && certify.denied, true);

  const gate = requireHumanApproval({
    decisionId: 'g1',
    action: 'submit_bid',
    actor: curator,
  });
  assert.equal(gate.state, 'HUMAN_AUTHORIZED_SUBMISSION_REQUIRED');

  const authorized = requireHumanApproval({
    decisionId: 'g2',
    action: 'submit_bid',
    actor: human,
    humanAuthorizedSubmission: true,
  });
  assert.equal(authorized.state, 'APPROVED_BOUNDED');
  assert.equal(authorized.executed, false);
  assert.equal(authorized.autoSubmitted, false);

  const pkg = prepareSubmissionPackage({
    packageId: 'pkg-1',
    opportunityId: 'opp-1',
    proposalId: 'pr-1',
    actor: human,
    humanAuthorized: true,
  });
  assert.ok(!('denied' in pkg));
  if (!('denied' in pkg)) {
    assert.equal(pkg.prepared, true);
    assert.equal(pkg.submittedByXiv, false);
    assert.equal(pkg.humanAuthorized, true);
  }
});

test('Guardian/RLS/tenant/Universe isolation unchanged', () => {
  assert.equal(EO1_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED, true);
  const iso = probeGuardianRlsTenantUniverseIsolation(curator);
  assert.equal(iso.guardianUnchanged, true);
  assert.equal(iso.rlsUnchanged, true);
  assert.equal(iso.tenantIsolated, true);
  assert.equal(iso.universeIsolated, true);
  assert.equal(iso.tenantId, 'ten-eo1');
  assert.equal(iso.universeId, 'uni-eo1');
});

test('soft-wire #159 EO + #158 EN SAM/FAR; EO present on this tip; EN probe-only', () => {
  const soft = eo1SoftWireSnapshot(repoRoot);
  // Preferred predecessor EO (#159) present on EO-lineage tip
  assert.equal(soft.eo159MissionOsTypes.present, true);
  assert.equal(soft.eo159MissionOsRuntime.present, true);
  assert.equal(soft.eo159Report.present, true);
  // EN (#158) SAM/FAR soft-wire — presence ≠ required; WAITING_DATA when absent
  assert.equal(typeof soft.en158DealOs.present, 'boolean');
  assert.equal(typeof soft.en158DealRuntime.present, 'boolean');
  assert.equal(typeof soft.en158Report.present, 'boolean');
  assert.equal(soft.em157HomeBase.present, true);
  assert.equal(soft.em10UserAccessEconomy.present, true);
});

test('cycle hop inventory + bootstrap + full command-center cycle', () => {
  for (const required of [
    'opportunity_register',
    'public_discovery_neq_eligibility',
    'requirement_decomposition',
    'bid_no_bid_gate',
    'quantum_ai_evidence',
    'views_model_register',
    'eo159_mission_os_soft_wire',
    'en158_sam_far_soft_wire',
    'cfo_council_deny_autonomy',
    'no_fabricate_quantum_capability',
    'no_auto_submit_bid',
    'no_classified_access',
    'no_autonomous_physical_dispatch',
    'guardian_rls_tenant_universe_isolation',
    'l4_autonomy_false',
  ] as const) {
    assert.ok(GOVERNMENT_CONTRACTS_COMMAND_CENTER_CYCLE.includes(required), required);
  }

  // smoke advisory path
  assert.ok(
    !('denied' in
      recommendBidNoBid({
        decisionId: 'b1',
        opportunityId: 'o',
        recommendation: 'NO_BID',
        rationale: 'capacity',
      })),
  );
  assert.ok(decomposeRequirements({
    decompositionId: 'd1',
    opportunityId: 'o',
    requirements: ['r'],
  }).advisoryOnly);
  assert.ok(draftCapturePlan({
    planId: 'c1',
    opportunityId: 'o',
    themes: ['t'],
    discriminators: ['d'],
  }).planOnly);
  assert.ok(draftSolutionArchitecture({
    architectureId: 'a1',
    opportunityId: 'o',
    components: ['x'],
  }).planOnly);
  const win = recordWinLossLearning({
    recordId: 'w1',
    opportunityId: 'o',
    outcome: 'loss',
    lessons: ['pricing'],
  });
  assert.ok(!('denied' in win));
  const winDeny = recordWinLossLearning({
    recordId: 'w2',
    opportunityId: 'o',
    outcome: 'win',
    lessons: ['x'],
    claimGuaranteesFutureWin: true,
  });
  assert.equal('denied' in winDeny && winDeny.denied, true);

  const boot = bootstrapGovernmentContractsCommandCenter(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.sotLabel, '62L-EO1');
  assert.equal(boot.l4AutonomyEnabled, false);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.softWireEnIssue, 158);
  assert.equal(boot.softWireEoIssue, 159);
  assert.ok(boot.hops.length >= 10);
  assert.match(boot.next, /EO2/);

  const cycle = runGovernmentContractsCommandCenterCycle({
    actor: curator,
    opportunityId: 'gov-cc-1',
    agencyBureau: 'NIST',
    solicitationOrNoticeId: 'NOTICE-EO1-1',
    title: 'Quantum-aware logistics advisory RFI',
  });
  assert.equal(cycle.opportunity.discoveryState, 'DISCOVERED_NOT_ELIGIBLE');
  assert.equal(cycle.opportunity.eligibilityConfirmed, false);
  assert.equal(cycle.humanGate.state, 'HUMAN_AUTHORIZED_SUBMISSION_REQUIRED');
  assert.ok(!('denied' in cycle.package));
  if (!('denied' in cycle.package)) {
    assert.equal(cycle.package.submittedByXiv, false);
  }
  assert.ok(!('denied' in cycle.quantum));
  if (!('denied' in cycle.quantum)) {
    assert.equal(cycle.quantum.claimState, 'THEORETICAL');
  }
  assert.equal(cycle.views.length, 11);
  assert.equal(cycle.opportunity.autoSubmitted, false);
  assert.equal(cycle.opportunity.classifiedAccessed, false);
});
