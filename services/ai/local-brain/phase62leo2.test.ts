/**
 * 62L-EO2 — Government Agency Knowledge Graph denial + honesty tests.
 *
 * Script: npm run test:62leo2
 * Covers: provenance, inference labels, historical≠preference, contractor≠partnership,
 * classified excluded, no lobbying/influence/bribery/manipulation, L4=false,
 * soft-wire EO1/#159/#158 probes.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AGENCY_KNOWLEDGE_GRAPH_MODEL,
  EO2_DB_CANDIDATES_STATUS,
  EO2_LOCKS,
  EO2_MAY,
  EO2_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOVERNMENT_AGENCY_KNOWLEDGE_GRAPH_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  NODE_RETAINED_FIELDS,
  RELATIONSHIP_INFERENCE_LABELS,
  XIV_CAPABILITY_ALIGNMENT_TAGS,
  assertEo2LocksIntact,
  eo2SoftWireSnapshot,
} from './government-agency-knowledge-graph-types.ts';
import {
  attemptForbiddenInfluence,
  bootstrapGovernmentAgencyKnowledgeGraph,
  connectAwardsToCaptureHypotheses,
  findAgenciesAlignedWithXivCapabilities,
  identifyRepeatedProcurementPatterns,
  recordLeadershipChange,
  registerAgencyNode,
  registerBureauProgramMission,
  registerGraphEdge,
  registerOpportunityOrAward,
  registerProcurementVehicle,
  registerVendorRequirementOutcome,
  requireAuthorizedPublicLicensedData,
  runAgencyKnowledgeGraphDemoCycle,
  surfaceCommonRequirementLanguage,
  surfaceComplianceGapHypotheses,
  tailorProposalEvidenceToAgencyMission,
} from './government-agency-knowledge-graph-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const analyst = {
  kind: 'agency_research_analyst' as const,
  id: 'ar-1',
  orgId: 'org-eo2',
  tenantId: 'ten-eo2',
  universeId: 'uni-eo2',
  permissions: ['register_public_agency_graph_nodes', 'label_relationship_inference'],
};

const publicProv = {
  sourceUrlOrReference: 'https://example.gov/agency',
  sourceDate: '2026-09-01',
  freshness: 'current' as const,
  confidence: 0.9,
  evidenceClass: 'official_public' as const,
};

test('SoT is GitHub #159 EO family; GitLab mirror not invented; next is EO3', () => {
  assert.equal(GITHUB_SOT_ISSUE, 159);
  assert.match(GITHUB_SOT_TITLE, /Government Agency Knowledge Graph/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EO3/);
  assert.match(NEXT_PHASE_TITLE, /Quantum Mission Opportunity Watch/);
});

test('honesty locks: L4 false + DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION; DB NOT_APPLIED', () => {
  assert.equal(assertEo2LocksIntact(), true);
  assert.equal(EO2_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EO2_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EO2_LOCKS.TIP_LAND, false);
  assert.equal(EO2_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.equal(EO2_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EO2_LOCKS.DOCUMENTED_EQ_IMPLEMENTED, false);
  assert.equal(EO2_LOCKS.IMPLEMENTED_EQ_VERIFIED, false);
  assert.equal(EO2_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('graph model Agency→…→Outcome + retained fields + inference labels', () => {
  assert.deepEqual([...AGENCY_KNOWLEDGE_GRAPH_MODEL], [
    'agency',
    'bureau',
    'program',
    'mission',
    'procurement_vehicle',
    'opportunity',
    'award_history',
    'vendor_prime_sub',
    'requirement',
    'outcome',
  ]);
  assert.deepEqual([...RELATIONSHIP_INFERENCE_LABELS], [
    'PUBLIC_EVIDENCE',
    'HYPOTHESIS',
    'UNKNOWN',
  ]);
  assert.ok(NODE_RETAINED_FIELDS.includes('officialName'));
  assert.ok(NODE_RETAINED_FIELDS.includes('sourceUrlOrReference'));
  assert.ok(NODE_RETAINED_FIELDS.includes('evidenceClass'));
  assert.ok(XIV_CAPABILITY_ALIGNMENT_TAGS.includes('quantum'));
  assert.ok(XIV_CAPABILITY_ALIGNMENT_TAGS.includes('logistics'));
});

test('cycle covers graph + provenance + inference + integrity + soft-wire hops', () => {
  for (const required of [
    'graph_model_encoded',
    'node_retained_fields',
    'provenance_required',
    'relationship_inference_labels',
    'find_agencies_aligned_capabilities',
    'historical_award_neq_future_preference',
    'public_contractor_neq_xiv_partnership',
    'classified_procurement_excluded',
    'no_automated_lobbying',
    'no_improper_influence',
    'no_bribery',
    'no_procurement_manipulation',
    'eo1_command_center_soft_wire',
    'eo_159_mission_os_soft_wire',
    'en_158_deal_os_soft_wire',
  ] as const) {
    assert.ok(GOVERNMENT_AGENCY_KNOWLEDGE_GRAPH_CYCLE.includes(required), required);
  }
});

test('A: register agency/bureau/vehicle with provenance; missing provenance DENIED', () => {
  const noSrc = registerAgencyNode({
    nodeId: 'a0',
    officialName: 'X',
    provenance: { ...publicProv, sourceUrlOrReference: '  ' },
  });
  assert.equal('denied' in noSrc && noSrc.denied, true);

  const agency = registerAgencyNode({
    nodeId: 'a1',
    officialName: 'Agency Alpha',
    provenance: publicProv,
    missionAndPublicPriorities: ['modernization'],
    capabilityAlignmentTags: ['modernization', 'ai'],
  });
  assert.ok(!('denied' in agency));
  if (!('denied' in agency)) {
    assert.equal(agency.kind, 'agency');
    assert.equal(agency.leadershipChangeIsPermanent, false);
    assert.equal(agency.provenance.evidenceClass, 'official_public');
  }

  const bureau = registerBureauProgramMission({
    nodeId: 'b1',
    kind: 'bureau',
    officialName: 'Bureau Beta',
    agencyBureauHierarchy: ['Agency Alpha', 'Bureau Beta'],
    provenance: publicProv,
    programNames: ['Prog-1'],
  });
  assert.ok(!('denied' in bureau));

  const vehicle = registerProcurementVehicle({
    nodeId: 'v1',
    officialName: 'IDIQ-1',
    agencyBureauHierarchy: ['Agency Alpha'],
    provenance: publicProv,
    naicsPscAssociations: ['541512'],
    setAsidePatterns: ['sdvosb'],
  });
  assert.ok(!('denied' in vehicle));
});

test('B/C: inference labels required; PUBLIC_EVIDENCE | HYPOTHESIS | UNKNOWN', () => {
  const omit = registerGraphEdge({
    edgeId: 'e0',
    fromNodeId: 'a1',
    toNodeId: 'b1',
    relation: 'contains',
    provenance: publicProv,
    omitInferenceLabel: true,
  });
  assert.equal('denied' in omit && omit.denied, true);
  assert.match(('reason' in omit && omit.reason) || '', /INFERENCE_WITHOUT_LABEL/);

  const hypAsPublic = registerGraphEdge({
    edgeId: 'e1',
    fromNodeId: 'a1',
    toNodeId: 'b1',
    relation: 'maybe_related',
    inferenceLabel: 'HYPOTHESIS',
    provenance: publicProv,
    claimHypothesisAsPublicEvidence: true,
  });
  assert.equal('denied' in hypAsPublic && hypAsPublic.denied, true);

  const ok = registerGraphEdge({
    edgeId: 'e2',
    fromNodeId: 'a1',
    toNodeId: 'b1',
    relation: 'contains_bureau',
    inferenceLabel: 'PUBLIC_EVIDENCE',
    provenance: publicProv,
  });
  assert.ok(!('denied' in ok));
  if (!('denied' in ok)) {
    assert.equal(ok.state, 'PUBLIC_EVIDENCE');
  }

  const unknown = registerGraphEdge({
    edgeId: 'e3',
    fromNodeId: 'a1',
    toNodeId: 'x1',
    relation: 'unclear',
    inferenceLabel: 'UNKNOWN',
    provenance: publicProv,
  });
  assert.ok(!('denied' in unknown));
  if (!('denied' in unknown)) {
    assert.equal(unknown.state, 'UNKNOWN');
  }
});

test('rules: historical award ≠ future preference; contractor ≠ XIV partnership', () => {
  const histPref = registerOpportunityOrAward({
    nodeId: 'aw1',
    kind: 'award_history',
    officialName: 'Award 1',
    agencyBureauHierarchy: ['Agency Alpha'],
    provenance: {
      ...publicProv,
      evidenceClass: 'historical_award_public',
    },
    publicAwardHistory: ['award-1'],
    claimFuturePreferenceFromHistory: true,
  });
  assert.equal('denied' in histPref && histPref.denied, true);
  assert.match(
    ('reason' in histPref && histPref.reason) || '',
    /HISTORICAL_AWARD_NEQ_FUTURE_PREFERENCE/,
  );

  const award = registerOpportunityOrAward({
    nodeId: 'aw2',
    kind: 'award_history',
    officialName: 'Award 2',
    agencyBureauHierarchy: ['Agency Alpha'],
    provenance: {
      ...publicProv,
      evidenceClass: 'historical_award_public',
    },
    publicAwardHistory: ['award-2'],
  });
  assert.ok(!('denied' in award));

  const partnerClaim = registerVendorRequirementOutcome({
    nodeId: 'vn1',
    kind: 'vendor_prime_sub',
    officialName: 'Incumbent Co',
    agencyBureauHierarchy: ['Agency Alpha'],
    provenance: publicProv,
    incumbentContractorContext: ['public award'],
    claimXivPartnershipFromPublicContractor: true,
  });
  assert.equal('denied' in partnerClaim && partnerClaim.denied, true);
  assert.match(
    ('reason' in partnerClaim && partnerClaim.reason) || '',
    /PUBLIC_CONTRACTOR_NEQ_XIV_PARTNERSHIP/,
  );

  const capturePref = connectAwardsToCaptureHypotheses({
    awardNodeId: 'aw2',
    opportunityHypothesis: 'possible recompete',
    claimFuturePreference: true,
  });
  assert.equal('denied' in capturePref && capturePref.denied, true);

  const capture = connectAwardsToCaptureHypotheses({
    awardNodeId: 'aw2',
    opportunityHypothesis: 'possible recompete — HYPOTHESIS',
  });
  assert.ok(!('denied' in capture));
  if (!('denied' in capture)) {
    assert.equal(capture.inferenceLabel, 'HYPOTHESIS');
    assert.equal(capture.historicalAwardEqualsFuturePreference, false);
  }
});

test('rules: priorities need current public evidence; leadership ≠ permanent; classified excluded', () => {
  const noEv = registerAgencyNode({
    nodeId: 'a2',
    officialName: 'Agency',
    provenance: publicProv,
    missionAndPublicPriorities: ['secret priority'],
    claimPrioritiesWithoutPublicEvidence: true,
  });
  assert.equal('denied' in noEv && noEv.denied, true);

  const badClass = registerAgencyNode({
    nodeId: 'a3',
    officialName: 'Agency',
    provenance: { ...publicProv, evidenceClass: 'hypothesis_labeled' },
    missionAndPublicPriorities: ['priority'],
  });
  assert.equal('denied' in badClass && badClass.denied, true);

  const permanent = recordLeadershipChange({
    nodeId: 'a1',
    timestamp: '2026-01-15T00:00:00Z',
    claimPermanent: true,
  });
  assert.equal('denied' in permanent && permanent.denied, true);

  const leadership = recordLeadershipChange({
    nodeId: 'a1',
    timestamp: '2026-01-15T00:00:00Z',
  });
  assert.ok(!('denied' in leadership));
  if (!('denied' in leadership)) {
    assert.equal(leadership.leadershipChangeIsPermanent, false);
  }

  const classified = registerProcurementVehicle({
    nodeId: 'cv1',
    officialName: 'Classified vehicle',
    agencyBureauHierarchy: ['Agency'],
    provenance: { ...publicProv, evidenceClass: 'classified_excluded' },
  });
  assert.equal('denied' in classified && classified.denied, true);
  assert.equal('state' in classified && classified.state, 'EXCLUDED');

  const classifiedFlag = registerProcurementVehicle({
    nodeId: 'cv2',
    officialName: 'Sensitive',
    agencyBureauHierarchy: ['Agency'],
    provenance: publicProv,
    classifiedWithoutAuthorization: true,
  });
  assert.equal('denied' in classifiedFlag && classifiedFlag.denied, true);
});

test('integrity denies: lobbying / improper influence / bribery / procurement manipulation', () => {
  for (const action of [
    'automated_lobbying',
    'improper_influence',
    'bribery',
    'procurement_manipulation',
    'auto_contact_agency_officials',
    'auto_submit_bid',
  ] as const) {
    const r = attemptForbiddenInfluence(action);
    assert.equal(r.denied, true);
    assert.equal(r.state, 'DENIED');
  }

  assert.equal(EO2_LOCKS.AUTOMATED_LOBBYING, false);
  assert.equal(EO2_LOCKS.IMPROPER_INFLUENCE, false);
  assert.equal(EO2_LOCKS.BRIBERY, false);
  assert.equal(EO2_LOCKS.PROCUREMENT_MANIPULATION, false);

  const unauth = requireAuthorizedPublicLicensedData({ dataClass: 'unauthorized' });
  assert.equal(unauth !== true && unauth.denied, true);
});

test('core uses: alignment, patterns, requirements, compliance gaps, mission-tailored evidence', () => {
  const agency = registerAgencyNode({
    nodeId: 'a4',
    officialName: 'Logistics Agency',
    provenance: publicProv,
    missionAndPublicPriorities: ['logistics modernization', 'simulation training'],
    capabilityAlignmentTags: ['logistics', 'simulation', 'ai'],
  });
  assert.ok(!('denied' in agency));

  const v1 = registerProcurementVehicle({
    nodeId: 'pv1',
    officialName: 'GWAC-X',
    agencyBureauHierarchy: ['Logistics Agency'],
    provenance: publicProv,
    procurementVehicles: ['GWAC-X'],
    setAsidePatterns: ['small_business'],
  });
  const v2 = registerProcurementVehicle({
    nodeId: 'pv2',
    officialName: 'GWAC-X recompete',
    agencyBureauHierarchy: ['Logistics Agency'],
    provenance: publicProv,
    procurementVehicles: ['GWAC-X'],
    setAsidePatterns: ['small_business'],
  });
  assert.ok(!('denied' in v1) && !('denied' in v2));

  if (!('denied' in agency) && !('denied' in v1) && !('denied' in v2)) {
    const hits = findAgenciesAlignedWithXivCapabilities({
      nodes: [agency],
      tags: ['logistics', 'quantum'],
    });
    assert.equal(hits.length, 1);
    assert.ok(hits[0].matchedTags.includes('logistics'));
    assert.equal(hits[0].binding, false);

    const patterns = identifyRepeatedProcurementPatterns({ nodes: [v1, v2] });
    assert.ok(patterns.some((p) => p.vehicleOrSetAside === 'GWAC-X'));
    assert.ok(patterns.every((p) => p.predictsFuturePreference === false));

    const req = surfaceCommonRequirementLanguage({
      requirementNodes: [
        {
          ...agency,
          nodeId: 'req-1',
          kind: 'requirement',
          officialName: 'shall provide digital twin simulation',
        },
      ],
    });
    assert.equal(req.isLegalAdvice, false);
    assert.ok(req.phrases.includes('shall provide digital twin simulation'));

    const gaps = surfaceComplianceGapHypotheses({
      agencyNodeId: agency.nodeId,
      gaps: ['possible Section 508 mapping gap'],
    });
    assert.equal(gaps[0].inferenceLabel, 'HYPOTHESIS');

    const generic = tailorProposalEvidenceToAgencyMission({
      packageId: 'p0',
      agencyNode: agency,
      evidenceRefs: ['e1'],
      useGenericSalesLanguage: true,
    });
    assert.equal('denied' in generic && generic.denied, true);

    const tailored = tailorProposalEvidenceToAgencyMission({
      packageId: 'p1',
      agencyNode: agency,
      evidenceRefs: ['mission-page', 'budget-excerpt'],
    });
    assert.ok(!('denied' in tailored));
    if (!('denied' in tailored)) {
      assert.equal(tailored.genericSalesLanguage, false);
      assert.equal(tailored.submitted, false);
      assert.ok(tailored.missionThemes.includes('logistics modernization'));
    }
  }

  assert.ok(EO2_MAY.includes('find_agencies_aligned_with_xiv_capabilities'));
  assert.ok(EO2_MUST_NOT.includes('automated_lobbying'));
});

test('soft-wire EO1/#159/#158 probes + bootstrap + demo cycle', () => {
  const soft = eo2SoftWireSnapshot(repoRoot);
  // EN #158 should be present on this EN-based tip
  assert.equal(soft.en158DealOs.present, true);
  assert.equal(soft.en158DealRuntime.present, true);
  assert.equal(soft.en158Report.present, true);
  // EO1 / #159 may be absent — presence boolean only
  assert.equal(typeof soft.eo1CommandCenter.present, 'boolean');
  assert.equal(typeof soft.eo159MissionOsTypes.present, 'boolean');
  assert.equal(typeof soft.eo159MissionOsRuntime.present, 'boolean');
  assert.equal(typeof soft.eo159Report.present, 'boolean');

  const boot = bootstrapGovernmentAgencyKnowledgeGraph(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.sotIssue, 159);
  assert.equal(boot.l4AutonomyEnabled, false);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.ok(boot.hops.length >= 10);
  assert.match(boot.next, /EO3/);

  const cycle = runAgencyKnowledgeGraphDemoCycle({ actor: analyst });
  assert.ok(!('denied' in cycle.agency));
  assert.ok(!('denied' in cycle.edge));
  if (!('denied' in cycle.edge)) {
    assert.equal(cycle.edge.inferenceLabel, 'PUBLIC_EVIDENCE');
  }
  assert.ok(cycle.alignments.length >= 1);
  assert.equal(cycle.lobbyDeny.denied, true);
  if (!('denied' in cycle.captureLink)) {
    assert.equal(cycle.captureLink.inferenceLabel, 'HYPOTHESIS');
  }
  if (!('denied' in cycle.tailored)) {
    assert.equal(cycle.tailored.genericSalesLanguage, false);
  }
});
