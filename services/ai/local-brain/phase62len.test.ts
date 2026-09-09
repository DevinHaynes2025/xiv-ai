/**
 * 62L-EN GitHub #158 — Deal & Contract Intelligence OS denial + honesty tests.
 *
 * Script: npm run test:62len
 * Covers: no-auto-submit/sign/certify/accept + L4 false + lesson≠guarantee
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEAL_CONTRACT_INTELLIGENCE_OS_CYCLE,
  DEAL_TEAM_ROSTER,
  EN_DB_CANDIDATES_STATUS,
  EN_LOCKS,
  EN_MAY,
  EN_MUST_NOT,
  EN_POLICY_FRAMING,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOVERNMENT_CONTRACT_FLOW,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  assertEnLocksIntact,
  enSoftWireSnapshot,
} from './deal-contract-intelligence-os-types.ts';
import {
  adviseTeamingSubcontracting,
  analyzeFarRequirements,
  attemptAgentAct,
  attemptAutoAcceptContract,
  attemptAutoMakeRepresentation,
  attemptAutoSignCertification,
  attemptAutoSubmitBid,
  attemptSelfExpandAuthority,
  bootstrapDealContractIntelligenceOs,
  buildComplianceMatrix,
  buildDealTeamRoster,
  draftCapturePlan,
  draftNegotiationPlan,
  draftProposal,
  openPricingScenario,
  prepareSubmissionPackage,
  probeFarResearchAdapter,
  probeLegalShieldPartner,
  probeSamGovAdapter,
  recommendBidNoBid,
  recordWinLossLearning,
  registerDealHomeObject,
  registerNegotiationLesson,
  requireHumanDealApproval,
  runGovernmentContractCycle,
  writebackNeuralLessonPathway,
} from './deal-contract-intelligence-os-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const curator = {
  kind: 'capture_planning' as const,
  id: 'cap-1',
  orgId: 'org-en',
  tenantId: 'ten-en',
  universeId: 'uni-en',
  permissions: ['draft_capture_plan', 'recommend_bid_no_bid'],
};

const human = {
  ...curator,
  kind: 'human_approver' as const,
  id: 'human-1',
  permissions: ['approve_consequential', 'authorize_submission'],
};

test('SoT is GitHub #158; GitLab mirror not invented', () => {
  assert.equal(GITHUB_SOT_ISSUE, 158);
  assert.match(GITHUB_SOT_TITLE, /Deal & Contract Intelligence OS/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EN1/);
});

test('honesty locks: L4 false + DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION; DB NOT_APPLIED', () => {
  assert.equal(assertEnLocksIntact(), true);
  assert.equal(EN_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EN_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EN_LOCKS.TIP_LAND, false);
  assert.equal(EN_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.equal(EN_LOCKS.DOCUMENTED_EQ_IMPLEMENTED, false);
  assert.equal(EN_LOCKS.IMPLEMENTED_EQ_VERIFIED, false);
  assert.equal(EN_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('hard autonomy denies: no auto submit/sign/certify/accept + may/must-not inventory', () => {
  assert.equal(EN_LOCKS.AUTO_SUBMIT_BID, false);
  assert.equal(EN_LOCKS.AUTO_SIGN_CERTIFICATION, false);
  assert.equal(EN_LOCKS.AUTO_MAKE_REPRESENTATION, false);
  assert.equal(EN_LOCKS.AUTO_ACCEPT_CONTRACT, false);

  const submit = attemptAutoSubmitBid();
  assert.equal(submit.state, 'DENIED');
  assert.equal(submit.executed, false);
  assert.equal(submit.autoSubmitted, false);
  assert.match(submit.reason, /NO_AUTO_SUBMIT/);

  const sign = attemptAutoSignCertification();
  assert.equal(sign.state, 'DENIED');
  assert.equal(sign.autoSigned, false);
  assert.equal(sign.autoCertified, false);

  const rep = attemptAutoMakeRepresentation();
  assert.equal(rep.state, 'DENIED');

  const accept = attemptAutoAcceptContract();
  assert.equal(accept.state, 'DENIED');
  assert.equal(accept.autoAccepted, false);

  assert.ok(EN_MAY.includes('discover_opportunities'));
  assert.ok(EN_MAY.includes('prepare_submission_packages'));
  assert.ok(EN_MUST_NOT.includes('autonomously_submit_bids'));
  assert.ok(EN_MUST_NOT.includes('accept_contracts'));
});

test('cycle covers A–H + gov flow encoded', () => {
  for (const required of [
    'deal_home_object_register',
    'deal_team_roster',
    'historical_negotiation_lesson',
    'lesson_neq_guarantee',
    'sam_gov_adapter_probe',
    'far_research_adapter_probe',
    'proposal_war_room',
    'bid_no_bid_gate',
    'teaming_subcontracting_advise',
    'win_loss_learning_writeback',
    'human_approval_required',
    'no_auto_submit',
    'no_auto_sign',
    'no_auto_certify',
    'no_auto_accept',
    'em_home_base_return_receipt_soft_wire',
    'gov_contract_flow_encoded',
  ] as const) {
    assert.ok(DEAL_CONTRACT_INTELLIGENCE_OS_CYCLE.includes(required), required);
  }
  assert.deepEqual(
    [...GOVERNMENT_CONTRACT_FLOW],
    [
      'sam_gov_opportunity',
      'qualification',
      'eligibility_readiness_check',
      'bid_no_bid',
      'capture_plan',
      'compliance_matrix',
      'pricing',
      'proposal',
      'negotiation_strategy',
      'human_approval',
      'human_authorized_submission',
      'award_performance_tracking',
      'win_loss_learning',
    ],
  );
});

test('A: deal home objects register for commercial + government', () => {
  const commercial = registerDealHomeObject({
    opportunityId: 'opp-c1',
    kind: 'commercial',
    title: 'Commercial license',
    actor: curator,
  });
  assert.equal(commercial.status, 'REGISTERED');
  assert.equal(commercial.autoSubmitted, false);
  assert.equal(commercial.autoAccepted, false);

  const gov = registerDealHomeObject({
    opportunityId: 'opp-g1',
    kind: 'government',
    title: 'Gov RFP',
    actor: curator,
  });
  assert.equal(gov.flowPosition, 'sam_gov_opportunity');
});

test('B: roster recommend≠act; agents cannot self-expand authority', () => {
  const roster = buildDealTeamRoster();
  assert.equal(roster.length, DEAL_TEAM_ROSTER.length);
  assert.ok(roster.every((m) => m.recommendOnly === true && m.mayActAutonomously === false));

  const expand = attemptSelfExpandAuthority({
    actor: curator,
    requestedPermissions: ['authorize_submission'],
  });
  assert.equal(expand.status, 'denied');

  const act = attemptAgentAct({
    actor: curator,
    action: 'submit_bid',
    attemptExecute: true,
  });
  assert.equal(act.status, 'denied');
  assert.equal(act.executed, false);
});

test('C: historical negotiation memory — lesson≠guarantee; no hidden CoT; provenance required', () => {
  const noProv = registerNegotiationLesson({
    lessonId: 'l0',
    title: 'x',
    domain: 'pricing',
    provenance: '  ',
    structuredEvidence: ['e1'],
    lessonSummary: 'y',
  });
  assert.equal('denied' in noProv && noProv.denied, true);

  const guarantee = registerNegotiationLesson({
    lessonId: 'l1',
    title: 'Case',
    domain: 'government',
    provenance: 'lawful teaching case id=demo',
    structuredEvidence: ['structured-evidence-1'],
    lessonSummary: 'lesson',
    claimGuaranteeWorksToday: true,
  });
  assert.equal('denied' in guarantee && guarantee.denied, true);
  assert.match(('reason' in guarantee && guarantee.reason) || '', /LESSON_NEQ_GUARANTEE/);

  const cot = registerNegotiationLesson({
    lessonId: 'l2',
    title: 'Case',
    domain: 'concession',
    provenance: 'lawful archive',
    structuredEvidence: ['e1'],
    lessonSummary: 'lesson',
    attemptHiddenCotStorage: true,
  });
  assert.equal('denied' in cot && cot.denied, true);

  const ok = registerNegotiationLesson({
    lessonId: 'l3',
    title: 'BATNA lesson',
    domain: 'batna',
    provenance: 'lawful historical negotiation case with citation',
    structuredEvidence: ['walk-away-discipline', 'give-get-pair'],
    lessonSummary: 'Structured lesson only',
  });
  assert.ok(!('denied' in ok));
  if (!('denied' in ok)) {
    assert.equal(ok.provesStrategyWorksToday, false);
    assert.equal(ok.hiddenChainOfThoughtStored, false);
    assert.equal(ok.strengthensAuthorityAutomatically, false);
    const pathway = writebackNeuralLessonPathway({ pathwayId: 'np-1', lesson: ok });
    assert.equal(pathway.isGuarantee, false);
    assert.equal(pathway.strengthensAuthorityAutomatically, false);
  }
});

test('D: SAM/FAR unconfigured → UNAVAILABLE; not legal advice; LegalShield UNAVAILABLE', () => {
  const sam = probeSamGovAdapter();
  assert.ok(!('denied' in sam));
  if (!('denied' in sam)) {
    assert.equal(sam.state, 'UNAVAILABLE');
    assert.equal(sam.configured, false);
    assert.equal(sam.liveConnected, false);
  }

  const fakeSam = probeSamGovAdapter({ claimConfiguredWithoutCredentials: true });
  assert.equal('denied' in fakeSam && fakeSam.denied, true);

  const far = probeFarResearchAdapter();
  assert.ok(!('denied' in far));
  if (!('denied' in far)) {
    assert.equal(far.state, 'UNAVAILABLE');
    assert.equal(far.isLegalAdvice, false);
  }

  const legalClaim = probeFarResearchAdapter({ claimLegalAdviceAuthority: true });
  assert.equal('denied' in legalClaim && legalClaim.denied, true);

  const legalShield = probeLegalShieldPartner();
  assert.equal(legalShield.status, 'UNAVAILABLE');
  assert.equal(legalShield.authorized, false);
  assert.equal(EN_LOCKS.BUSINESS_LAW_EQ_ATTORNEY, false);
  assert.match(EN_POLICY_FRAMING.publicTrust, /best value/);

  const analysis = analyzeFarRequirements({
    requirementIds: ['FAR-15'],
    notes: 'advisory research',
  });
  assert.equal(analysis.isLegalAdvice, false);
  assert.equal(analysis.binding, false);
});

test('E: proposal & pricing war room — recommend ≠ bind; no auto-submit draft', () => {
  const bind = openPricingScenario({
    scenarioId: 'p1',
    opportunityId: 'opp-1',
    recommendedPriceUsd: 100,
    marginEstimate: 0.3,
    attemptBind: true,
  });
  assert.equal('denied' in bind && bind.denied, true);

  const price = openPricingScenario({
    scenarioId: 'p2',
    opportunityId: 'opp-1',
    recommendedPriceUsd: 100,
    marginEstimate: 0.3,
  });
  assert.ok(!('denied' in price));
  if (!('denied' in price)) {
    assert.equal(price.binding, false);
    assert.equal(price.autoApplied, false);
    assert.equal(price.state, 'RECOMMENDATION_ONLY');
  }

  const autoProp = draftProposal({
    proposalId: 'pr1',
    opportunityId: 'opp-1',
    sections: ['tech'],
    attemptAutoSubmit: true,
  });
  assert.equal('denied' in autoProp && autoProp.denied, true);

  const batna = draftNegotiationPlan({
    planId: 'n1',
    opportunityId: 'opp-1',
    batna: 'walk',
    walkAway: 50,
    target: 100,
    attemptBatnaAutoCommit: true,
  });
  assert.equal('denied' in batna && batna.denied, true);
});

test('F: bid/no-bid + capture + compliance (no auto-certify)', () => {
  const bnb = recommendBidNoBid({
    decisionId: 'd1',
    opportunityId: 'opp-1',
    recommendation: 'BID',
    rationale: 'fit',
  });
  assert.ok(!('denied' in bnb));
  if (!('denied' in bnb)) {
    assert.equal(bnb.binding, false);
    assert.equal(bnb.autoSubmitted, false);
  }

  const capture = draftCapturePlan({
    planId: 'c1',
    opportunityId: 'opp-1',
    themes: ['best_value'],
    discriminators: ['integrity'],
  });
  assert.equal(capture.autoExecuted, false);

  const certify = buildComplianceMatrix({
    matrixId: 'm1',
    opportunityId: 'opp-1',
    rows: [{ requirementId: 'r1', proposalSection: 's1', status: 'mapped' }],
    attemptAutoCertify: true,
  });
  assert.equal('denied' in certify && certify.denied, true);

  const matrix = buildComplianceMatrix({
    matrixId: 'm2',
    opportunityId: 'opp-1',
    rows: [{ requirementId: 'r1', proposalSection: 's1', status: 'advisory' }],
  });
  assert.ok(!('denied' in matrix));
  if (!('denied' in matrix)) {
    assert.equal(matrix.certified, false);
    assert.equal(matrix.isLegalAdvice, false);
  }
});

test('G: teaming advisory + win/loss learning ≠ future-win guarantee', () => {
  const teamAuto = adviseTeamingSubcontracting({
    adviceId: 't1',
    opportunityId: 'opp-1',
    partners: ['partner-a'],
    subcontractScopes: ['cyber'],
    attemptAutoExecuteAgreement: true,
  });
  assert.equal('denied' in teamAuto && teamAuto.denied, true);

  const team = adviseTeamingSubcontracting({
    adviceId: 't2',
    opportunityId: 'opp-1',
    partners: ['partner-a'],
    subcontractScopes: ['cyber'],
  });
  assert.ok(!('denied' in team));
  if (!('denied' in team)) {
    assert.equal(team.bindingAgreement, false);
  }

  const winGuarantee = recordWinLossLearning({
    recordId: 'w1',
    opportunityId: 'opp-1',
    outcome: 'win',
    lessons: ['evidence clarity'],
    claimGuaranteesFutureWin: true,
  });
  assert.equal('denied' in winGuarantee && winGuarantee.denied, true);

  const win = recordWinLossLearning({
    recordId: 'w2',
    opportunityId: 'opp-1',
    outcome: 'loss',
    lessons: ['pricing posture'],
  });
  assert.ok(!('denied' in win));
  if (!('denied' in win)) {
    assert.equal(win.provesFutureWin, false);
  }
});

test('H: human approval → human-authorized submission; EM soft-wire present; DR/DS probe', () => {
  const soft = enSoftWireSnapshot(repoRoot);
  assert.equal(soft.em157HomeBaseTypes.present, true);
  assert.equal(soft.em157HomeBaseRuntime.present, true);
  assert.equal(soft.em157HomeBaseReport.present, true);
  assert.equal(soft.em157PricingCouncilSurface.present, true);
  // DR/DS may be absent on EM-lineage branch — presence check only
  assert.equal(typeof soft.drNegotiationHonesty.present, 'boolean');
  assert.equal(typeof soft.dsDealSimulationHonesty.present, 'boolean');

  const auto = requireHumanDealApproval({
    decisionId: 'h1',
    action: 'submit_bid',
    actor: curator,
    attemptAutonomousExecute: true,
  });
  assert.equal(auto.state, 'DENIED');

  const gate = requireHumanDealApproval({
    decisionId: 'h2',
    action: 'submit_bid',
    actor: curator,
  });
  assert.equal(gate.state, 'HUMAN_AUTHORIZED_SUBMISSION_REQUIRED');
  assert.equal(gate.executed, false);

  const authorized = requireHumanDealApproval({
    decisionId: 'h3',
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
    humanAuthorized: true,
    actor: human,
  });
  assert.equal(pkg.prepared, true);
  assert.equal(pkg.submittedByXiv, false);
  assert.equal(pkg.humanAuthorized, true);

  const boot = bootstrapDealContractIntelligenceOs(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.sotIssue, 158);
  assert.equal(boot.l4AutonomyEnabled, false);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.ok(boot.hops.length >= 10);

  const cycle = runGovernmentContractCycle({
    actor: curator,
    opportunityId: 'gov-cycle-1',
    title: 'Sample FAR-framed opportunity',
  });
  assert.equal(cycle.deal.kind, 'government');
  assert.equal(cycle.humanGate.state, 'HUMAN_AUTHORIZED_SUBMISSION_REQUIRED');
  assert.equal(cycle.package.submittedByXiv, false);
  assert.ok(!('denied' in cycle.sam));
  if (!('denied' in cycle.sam)) {
    assert.equal(cycle.sam.state, 'UNAVAILABLE');
  }
});
