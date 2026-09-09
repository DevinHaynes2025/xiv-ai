/**
 * 62L-EO3 — Quantum Mission Opportunity Watch denial + honesty tests.
 *
 * Script: npm run test:62leo3
 * Covers: no auto-capability-upgrade from solicitation + L4 false +
 * no fabricate certs/clearances/PP/QPU + no autonomous bid + human bid/no-bid
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CAPABILITY_MATCH_LABELS,
  EO3_DB_CANDIDATES_STATUS,
  EO3_LOCKS,
  EO3_MAY,
  EO3_MUST_NOT,
  EO3_POLICY_FRAMING,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  NOTICE_INSTRUMENT_TYPES,
  OPPORTUNITY_CLASSIFICATION_DOMAINS,
  QUANTUM_MISSION_OPPORTUNITY_WATCH_CYCLE,
  QUANTUM_MISSION_WATCH_FLOW,
  QUANTUM_TRUTH_STATES,
  assertEo3LocksIntact,
  eo3SoftWireSnapshot,
  isCapabilityUpgrade,
  isQuantumTruthUpgrade,
} from './quantum-mission-opportunity-watch-types.ts';
import {
  assignHumanOwner,
  attemptAutoSubmitBid,
  attemptCapabilityUpgradeFromSolicitation,
  bootstrapQuantumMissionOpportunityWatch,
  classifyOpportunity,
  computeStrategicScore,
  distinguishNoticeType,
  ingestOfficialOpportunity,
  matchCapabilityToEvidence,
  requireHumanBidNoBid,
  routeToEoCommandCenter,
  runQuantumMissionWatchCycle,
  surfaceReadinessGaps,
} from './quantum-mission-opportunity-watch-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

test('SoT soft-wires #159 EO umbrella; GitLab mirror not invented; next is EO4', () => {
  assert.equal(GITHUB_SOT_ISSUE, 159);
  assert.match(GITHUB_SOT_TITLE, /EO3 Quantum Mission Opportunity Watch/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EO4/);
  assert.match(NEXT_PHASE_TITLE, /Capability Matrix/);
});

test('honesty locks: L4 false + DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION; DB NOT_APPLIED', () => {
  assert.equal(assertEo3LocksIntact(), true);
  assert.equal(EO3_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EO3_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EO3_LOCKS.TIP_LAND, false);
  assert.equal(EO3_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.equal(EO3_LOCKS.DOCUMENTED_EQ_IMPLEMENTED, false);
  assert.equal(EO3_LOCKS.IMPLEMENTED_EQ_VERIFIED, false);
  assert.equal(EO3_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('hard rule: solicitation must NEVER upgrade capability or quantum truth', () => {
  assert.equal(EO3_LOCKS.AUTO_CAPABILITY_UPGRADE_FROM_SOLICITATION, false);
  assert.equal(EO3_LOCKS.SOLICITATION_ASK_EQ_CAPABILITY_VERIFIED, false);
  assert.equal(EO3_LOCKS.SOLICITATION_ASK_EQ_PHYSICAL_QPU_VERIFIED, false);

  assert.equal(isCapabilityUpgrade('NOT_AVAILABLE', 'VERIFIED'), true);
  assert.equal(isCapabilityUpgrade('CANDIDATE', 'SUPPORTED'), true);
  assert.equal(isCapabilityUpgrade('VERIFIED', 'CANDIDATE'), false);
  assert.equal(isQuantumTruthUpgrade('THEORETICAL', 'PHYSICAL_QPU_VERIFIED'), true);
  assert.equal(isQuantumTruthUpgrade('SIMULATED', 'QUANTUM_INSPIRED'), false);

  const denial = attemptCapabilityUpgradeFromSolicitation({
    current: 'CANDIDATE',
    solicited: 'VERIFIED',
    currentQuantum: 'SIMULATED',
    solicitedQuantum: 'PHYSICAL_QPU_VERIFIED',
  });
  assert.equal(denial.state, 'DENIED');
  assert.equal(denial.upgraded, false);
  assert.equal(denial.autoCapabilityUpgraded, false);
  assert.equal(denial.locks.AUTO_CAPABILITY_UPGRADE_FROM_SOLICITATION, false);
  assert.match(denial.reason, /NO_AUTO_CAPABILITY_UPGRADE_FROM_SOLICITATION/);

  const base = ingestOfficialOpportunity({
    watchId: 'w-upgrade',
    source: 'SAM.gov',
    sourceAuthority: 'official',
    agency: 'DOE',
    program: 'ASCR Quantum',
    noticeSolicitationId: 'DOE-Q-001',
    publicationDate: '2026-09-01',
    contractResearchType: 'baa',
    xivCapabilityMatch: 'CANDIDATE',
    quantumTruthState: 'SIMULATED',
  });
  assert.ok(!('denied' in base));
  if (!('denied' in base)) {
    const upgraded = matchCapabilityToEvidence({
      record: base,
      evidenceBackedLabel: 'CANDIDATE',
      quantumTruthState: 'SIMULATED',
      solicitationRequestedCapability: 'VERIFIED',
      solicitationRequestedQuantumTruth: 'PHYSICAL_QPU_VERIFIED',
      attemptUpgradeFromSolicitation: true,
    });
    assert.equal('denied' in upgraded && upgraded.denied, true);
    assert.match(
      ('reason' in upgraded && upgraded.reason) || '',
      /NO_AUTO_CAPABILITY_UPGRADE_FROM_SOLICITATION/,
    );

    // Evidence-backed match keeps CANDIDATE / SIMULATED — no upgrade applied.
    const kept = matchCapabilityToEvidence({
      record: base,
      evidenceBackedLabel: 'CANDIDATE',
      quantumTruthState: 'SIMULATED',
      solicitationRequestedCapability: 'VERIFIED',
      solicitationRequestedQuantumTruth: 'PHYSICAL_QPU_VERIFIED',
    });
    assert.ok(!('denied' in kept));
    if (!('denied' in kept)) {
      assert.equal(kept.xivCapabilityMatch, 'CANDIDATE');
      assert.equal(kept.quantumTruthState, 'SIMULATED');
      assert.equal(kept.autoCapabilityUpgraded, false);
    }
  }

  assert.ok(EO3_MUST_NOT.includes('upgrade_capability_because_solicitation_asks'));
});

test('autonomy denies: no auto bid / external commitment; L4 false; may/must-not inventory', () => {
  assert.equal(EO3_LOCKS.AUTO_SUBMIT_BID, false);
  assert.equal(EO3_LOCKS.AUTONOMOUS_BID_SUBMISSION, false);
  assert.equal(EO3_LOCKS.AUTONOMOUS_EXTERNAL_COMMITMENT, false);

  const submit = attemptAutoSubmitBid();
  assert.equal(submit.state, 'DENIED');
  assert.equal(submit.executed, false);
  assert.equal(submit.autoSubmitted, false);

  assert.ok(EO3_MAY.includes('ingest_official_authorized_opportunities'));
  assert.ok(EO3_MAY.includes('route_to_eo_command_center'));
  assert.ok(EO3_MUST_NOT.includes('autonomously_submit_bids'));
  assert.ok(EO3_MUST_NOT.includes('fabricate_certifications_clearances_past_performance_qpu'));
});

test('cycle covers watch flow + no-auto-upgrade hop', () => {
  for (const required of [
    'official_source_ingest',
    'preserve_publication_date_and_solicitation_id',
    'classify_mission_domain',
    'distinguish_notice_types',
    'capability_match_labels',
    'quantum_truth_states',
    'no_auto_capability_upgrade_from_solicitation',
    'readiness_gaps',
    'no_eligibility_claim_without_entity_evidence',
    'no_fabricated_certifications_clearances_pp_qpu',
    'strategic_score',
    'eo1_command_center_soft_wire',
    'eo2_agency_graph_soft_wire',
    'eo159_umbrella_soft_wire',
    'human_bid_no_bid_gate',
    'no_autonomous_bid',
    'watch_flow_encoded',
  ] as const) {
    assert.ok(QUANTUM_MISSION_OPPORTUNITY_WATCH_CYCLE.includes(required), required);
  }
  assert.deepEqual(
    [...QUANTUM_MISSION_WATCH_FLOW],
    [
      'official_opportunity_source',
      'classify',
      'capability_match',
      'readiness_gaps',
      'strategic_score',
      'eo_command_center',
      'human_bid_no_bid',
    ],
  );
  assert.equal(CAPABILITY_MATCH_LABELS.length, 4);
  assert.equal(QUANTUM_TRUTH_STATES[0], 'PHYSICAL_QPU_VERIFIED');
  assert.ok(OPPORTUNITY_CLASSIFICATION_DOMAINS.includes('quantum_computing_simulation'));
  assert.ok(OPPORTUNITY_CLASSIFICATION_DOMAINS.includes('logistics_modernization'));
  assert.ok(NOTICE_INSTRUMENT_TYPES.includes('sbir_sttr'));
  assert.ok(NOTICE_INSTRUMENT_TYPES.includes('baa'));
});

test('A: official ingest preserves publication date + solicitation ID; unofficial ≠ official', () => {
  const fakeOfficial = ingestOfficialOpportunity({
    watchId: 'w0',
    source: '',
    sourceAuthority: 'official',
    agency: 'NASA',
    program: 'QIS',
    noticeSolicitationId: 'NASA-1',
    publicationDate: '2026-09-01',
    contractResearchType: 'rfi',
    xivCapabilityMatch: 'NOT_AVAILABLE',
    quantumTruthState: 'THEORETICAL',
    claimOfficialWithoutAuthority: true,
  });
  assert.equal('denied' in fakeOfficial && fakeOfficial.denied, true);

  const missingId = ingestOfficialOpportunity({
    watchId: 'w1',
    source: 'grants.gov',
    sourceAuthority: 'authorized',
    agency: 'NSF',
    program: 'QLCI',
    noticeSolicitationId: '  ',
    publicationDate: '2026-09-01',
    contractResearchType: 'grant',
    xivCapabilityMatch: 'CANDIDATE',
    quantumTruthState: 'QUANTUM_INSPIRED',
  });
  assert.equal('denied' in missingId && missingId.denied, true);

  const ok = ingestOfficialOpportunity({
    watchId: 'w2',
    source: 'SAM.gov',
    sourceAuthority: 'official',
    agency: 'DOD',
    program: 'DIU Quantum',
    noticeSolicitationId: 'DOD-Q-42',
    publicationDate: '2026-08-15',
    deadline: '2026-10-01',
    contractResearchType: 'rfi',
    estimatedValuePublished: 2_500_000,
    estimatedValueCurrency: 'USD',
    xivCapabilityMatch: 'SUPPORTED',
    quantumTruthState: 'SIMULATED',
    aiQuantumRelevance: 'quantum networking research',
    logisticsRelevance: 'low',
  });
  assert.ok(!('denied' in ok));
  if (!('denied' in ok)) {
    assert.equal(ok.noticeSolicitationId, 'DOD-Q-42');
    assert.equal(ok.publicationDate, '2026-08-15');
    assert.equal(ok.eligibilityClaimed, false);
    assert.equal(ok.autoCapabilityUpgraded, false);
    assert.equal(ok.autoBidSubmitted, false);
    assert.equal(ok.fabricatedQpuAccess, false);
  }
});

test('B: classify domains + distinguish notice types (not collapsed)', () => {
  const base = ingestOfficialOpportunity({
    watchId: 'w-class',
    source: 'SAM.gov',
    sourceAuthority: 'official',
    agency: 'DOC',
    program: 'CHIPS',
    noticeSolicitationId: 'CHIPS-77',
    publicationDate: '2026-07-01',
    contractResearchType: 'research_program',
    xivCapabilityMatch: 'CANDIDATE',
    quantumTruthState: 'THEORETICAL',
  });
  assert.ok(!('denied' in base));
  if (!('denied' in base)) {
    const empty = classifyOpportunity({ record: base, missionAreas: [] });
    assert.equal('denied' in empty && empty.denied, true);

    const classified = classifyOpportunity({
      record: base,
      missionAreas: ['semiconductor_chip_research', 'hpc_accelerated_computing'],
    });
    assert.ok(!('denied' in classified));
    if (!('denied' in classified)) {
      assert.equal(classified.missionArea, 'semiconductor_chip_research');
      assert.equal(classified.missionAreas.length, 2);
      assert.equal(classified.flowPosition, 'classify');
    }
  }

  const notice = distinguishNoticeType('sbir_sttr');
  assert.equal(notice.distinguished, true);
  assert.equal(notice.collapsed, false);
  assert.equal(notice.type, 'sbir_sttr');
  assert.match(EO3_POLICY_FRAMING.noticeTypes, /SBIR\/STTR/);
});

test('D: readiness gaps — no eligibility claim / no fabricate certs·clearances·PP·QPU', () => {
  const base = ingestOfficialOpportunity({
    watchId: 'w-gap',
    source: 'SAM.gov',
    sourceAuthority: 'official',
    agency: 'DHS',
    program: 'S&T',
    noticeSolicitationId: 'DHS-1',
    publicationDate: '2026-06-01',
    contractResearchType: 'contract',
    xivCapabilityMatch: 'NOT_AVAILABLE',
    quantumTruthState: 'THEORETICAL',
  });
  assert.ok(!('denied' in base));
  if (!('denied' in base)) {
    const elig = surfaceReadinessGaps({
      record: base,
      evidenceGaps: [],
      attemptEligibilityClaimWithoutEvidence: true,
    });
    assert.equal('denied' in elig && elig.denied, true);

    const cert = surfaceReadinessGaps({
      record: base,
      evidenceGaps: [],
      attemptFabricateCertifications: true,
    });
    assert.equal('denied' in cert && cert.denied, true);

    const clr = surfaceReadinessGaps({
      record: base,
      evidenceGaps: [],
      attemptFabricateClearances: true,
    });
    assert.equal('denied' in clr && clr.denied, true);

    const pp = surfaceReadinessGaps({
      record: base,
      evidenceGaps: [],
      attemptFabricatePastPerformance: true,
    });
    assert.equal('denied' in pp && pp.denied, true);

    const qpu = surfaceReadinessGaps({
      record: base,
      evidenceGaps: [],
      attemptFabricateQpuAccess: true,
    });
    assert.equal('denied' in qpu && qpu.denied, true);

    const ok = surfaceReadinessGaps({
      record: base,
      evidenceGaps: ['no_facility_clearance_evidence', 'no_physical_qpu_access_evidence'],
    });
    assert.ok(!('denied' in ok));
    if (!('denied' in ok)) {
      assert.equal(ok.eligibilityClaimed, false);
      assert.equal(ok.fabricatedCertifications, false);
      assert.equal(ok.fabricatedQpuAccess, false);
      assert.equal(ok.evidenceGaps.length, 2);
    }
  }
});

test('E: strategic score advisory — score ≠ commit', () => {
  const base = ingestOfficialOpportunity({
    watchId: 'w-score',
    source: 'grants.gov',
    sourceAuthority: 'authorized',
    agency: 'NSF',
    program: 'CISE',
    noticeSolicitationId: 'NSF-22',
    publicationDate: '2026-05-01',
    contractResearchType: 'grant',
    xivCapabilityMatch: 'SUPPORTED',
    quantumTruthState: 'QUANTUM_INSPIRED',
  });
  assert.ok(!('denied' in base));
  if (!('denied' in base)) {
    const commit = computeStrategicScore({
      record: base,
      score: 80,
      capturePriority: 'P1',
      attemptCommitFromScore: true,
    });
    assert.equal('denied' in commit && commit.denied, true);

    const scored = computeStrategicScore({
      record: base,
      score: 72,
      capturePriority: 'P1',
    });
    assert.ok(!('denied' in scored));
    if (!('denied' in scored)) {
      assert.equal(scored.strategicScore, 72);
      assert.equal(scored.capturePriority, 'P1');
      assert.equal(scored.flowPosition, 'strategic_score');
    }
  }
});

test('F: EO1/EO2/#159 soft-wire + human bid/no-bid; EN soft-wire present; full cycle', () => {
  const soft = eo3SoftWireSnapshot(repoRoot);
  // EO1/EO2 may be WAITING_DATA on this EN-lineage base — presence check only
  assert.equal(typeof soft.eo1CommandCenter.present, 'boolean');
  assert.equal(typeof soft.eo2AgencyGraph.present, 'boolean');
  assert.equal(typeof soft.eoUmbrellaReport.present, 'boolean');
  assert.equal(soft.enDealContractOs.present, true);
  assert.equal(soft.enDealContractReport.present, true);

  const cycle = runQuantumMissionWatchCycle({
    watchId: 'eo3-cycle-1',
    source: 'SAM.gov',
    sourceAuthority: 'official',
    agency: 'DOE',
    program: 'NQI',
    noticeSolicitationId: 'DOE-NQI-9',
    publicationDate: '2026-09-01',
    deadline: '2026-11-15',
    contractResearchType: 'baa',
    missionAreas: ['quantum_computing_simulation', 'quantum_networking'],
    xivCapabilityMatch: 'CANDIDATE',
    quantumTruthState: 'SIMULATED',
    evidenceGaps: ['no_physical_qpu_access_evidence', 'eligibility_unverified'],
    score: 61,
    capturePriority: 'P2',
    humanOwner: 'gov-contracts-lead',
    recommendation: 'WATCH',
    solicitationRequestedCapability: 'VERIFIED',
    solicitationRequestedQuantumTruth: 'PHYSICAL_QPU_VERIFIED',
    repoRoot,
  });

  assert.equal(cycle.record.xivCapabilityMatch, 'CANDIDATE');
  assert.equal(cycle.record.quantumTruthState, 'SIMULATED');
  assert.equal(cycle.record.autoCapabilityUpgraded, false);
  assert.equal(cycle.record.noticeSolicitationId, 'DOE-NQI-9');
  assert.equal(cycle.record.humanOwner, 'gov-contracts-lead');
  assert.equal(cycle.record.flowPosition, 'eo_command_center');
  assert.equal(cycle.route.executed, false);
  assert.equal(cycle.route.autoBidSubmitted, false);
  assert.ok(cycle.route.state === 'ROUTED' || cycle.route.state === 'WAITING_DATA');

  assert.equal(cycle.humanGate.state, 'HUMAN_BID_NO_BID_REQUIRED');
  assert.equal(cycle.humanGate.binding, false);
  assert.equal(cycle.humanGate.autoSubmitted, false);
  assert.equal(cycle.upgradeDenial.state, 'DENIED');
  assert.equal(cycle.autoBidDenial.state, 'DENIED');

  const autoBid = requireHumanBidNoBid({
    decisionId: 'd-auto',
    record: cycle.record,
    recommendation: 'BID',
    attemptAutonomousBid: true,
  });
  assert.equal(autoBid.state, 'DENIED');

  const ext = requireHumanBidNoBid({
    decisionId: 'd-ext',
    record: cycle.record,
    recommendation: 'BID',
    attemptExternalCommitment: true,
  });
  assert.equal(ext.state, 'DENIED');

  const owned = assignHumanOwner({
    record: cycle.record,
    humanOwner: 'capture-owner-2',
  });
  assert.ok(!('denied' in owned));
  if (!('denied' in owned)) {
    assert.equal(owned.humanOwner, 'capture-owner-2');
  }

  const { route } = routeToEoCommandCenter({ record: cycle.record, repoRoot });
  assert.equal(route.routed, true);
  assert.equal(route.executed, false);

  const boot = bootstrapQuantumMissionOpportunityWatch(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.sotIssue, 159);
  assert.equal(boot.l4AutonomyEnabled, false);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.ok(boot.hops.length >= 10);
  assert.match(boot.nextPhase, /EO4/);
});
