/**
 * 62L-ER9 — Public Law & Policy Knowledge Pack denial + honesty tests.
 *
 * Script: npm run test:62ler9
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ER9_AGENT_BOUNDS,
  ER9_DB_CANDIDATES_STATUS,
  ER9_LOCKS,
  ER9_MAY,
  ER9_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOV_CONTRACT_INTEGRATION_FLOW,
  HONESTY_BANNER,
  LEGAL_FRESHNESS_RULE,
  LEGAL_POLICY_BOUNDARY,
  LEGAL_POLICY_CORE_FLOW,
  LEGAL_POLICY_NODE_FIELDS,
  LEGAL_POLICY_PRIORITY_DOMAINS,
  LEGAL_POLICY_STATES,
  NEXT_PHASE_TITLE,
  PUBLIC_LAW_POLICY_KNOWLEDGE_PACK_CYCLE,
  assertEr9LocksIntact,
  er9SoftWireSnapshot,
  freshnessWhenEffectiveVersionUnconfirmed,
  legalStateFromFreshness,
  type Er9Actor,
} from './public-law-policy-knowledge-pack-types.ts';

import {
  advanceGovContractIntegration,
  attemptBindingLegalConclusion,
  attemptCertifyCompliance,
  attemptCrossTenantConfidentialClientMatters,
  attemptLicensedRepresentationWhenNot,
  attemptRecommendAsAct,
  attemptSubmitFilings,
  attemptTreatUnclearAsCurrent,
  attemptUnauthorizedLegalDatabaseScraping,
  bootstrapPublicLawPolicyKnowledgePack,
  buildComplianceMatrix,
  checkEffectiveDateFreshness,
  comparePolicyVersions,
  exampleCurrentOfficialNode,
  flagCounselReview,
  probeGuardianRlsTenantUniverseIsolation,
  registerPolicyNode,
  requireHumanApproval,
  returnEr9EvidenceToHomeBase,
  runPublicLawPolicyKnowledgePackCycle,
  startGovContractIntegration,
} from './public-law-policy-knowledge-pack-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er9Actor = {
  kind: 'public_law_policy_knowledge_pack',
  id: 'plpkp-1',
  orgId: 'org-er9',
  tenantId: 'ten-er9',
  universeId: 'uni-er9',
  permissions: ['draft'],
};

const human: Er9Actor = {
  kind: 'counsel_reviewer',
  id: 'counsel-1',
  orgId: 'org-er9',
  tenantId: 'ten-er9',
  universeId: 'uni-er9',
  permissions: ['approve_consequential', 'counsel_review'],
};

test('SoT label ER9 / #162; Public Law & Policy; next ER10 Geospatial/Mobility', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER9');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Public Law & Policy Knowledge Pack/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER10/);
  assert.match(NEXT_PHASE_TITLE, /Geospatial/);
  assert.match(ER_LAYER_TITLE, /Real API Data Fabric/);
});

test('honesty locks: L4 false; no binding/certify/filings/licensed; DB NOT_APPLIED', () => {
  assert.equal(assertEr9LocksIntact(), true);
  assert.equal(ER9_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER9_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER9_LOCKS.BINDING_LEGAL_CONCLUSIONS, false);
  assert.equal(ER9_LOCKS.CERTIFY_COMPLIANCE, false);
  assert.equal(ER9_LOCKS.SUBMIT_FILINGS, false);
  assert.equal(ER9_LOCKS.REPRESENT_XIV_AS_LICENSED_CERTIFIED_WHEN_NOT, false);
  assert.equal(ER9_LOCKS.UNAUTHORIZED_LEGAL_DATABASE_SCRAPING, false);
  assert.equal(ER9_LOCKS.TREAT_UNCLEAR_FRESHNESS_AS_CURRENT, false);
  assert.equal(ER9_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(
    LEGAL_POLICY_BOUNDARY.mayAutonomouslyMakeBindingLegalConclusions,
    false,
  );
  assert.equal(ER9_AGENT_BOUNDS.mayCertifyCompliance, false);
  assert.equal(LEGAL_FRESHNESS_RULE.mayLabelUnclearAsCurrent, false);
});

test('states + fields + domains + flows + MAY/MUST_NOT encoded', () => {
  assert.deepEqual([...LEGAL_POLICY_STATES], [
    'CURRENT_OFFICIAL',
    'SUPERSEDED',
    'PROPOSED',
    'GUIDANCE',
    'INTERPRETATION',
    'UNKNOWN',
  ]);
  assert.equal(LEGAL_POLICY_NODE_FIELDS.length, 17);
  assert.ok(LEGAL_POLICY_NODE_FIELDS.includes('policyId'));
  assert.ok(LEGAL_POLICY_NODE_FIELDS.includes('supersededBy'));
  assert.ok(LEGAL_POLICY_NODE_FIELDS.includes('freshnessState'));
  assert.equal(LEGAL_POLICY_PRIORITY_DOMAINS.length, 15);
  assert.ok(LEGAL_POLICY_PRIORITY_DOMAINS.includes('far_and_agency_supplements'));
  assert.ok(LEGAL_POLICY_PRIORITY_DOMAINS.includes('ai_governance'));
  assert.ok(
    LEGAL_POLICY_PRIORITY_DOMAINS.includes('government_contracting_compliance'),
  );
  assert.deepEqual([...LEGAL_POLICY_CORE_FLOW], [
    'official_source',
    'parse',
    'effective_date_check',
    'jurisdiction_mapping',
    'applicability',
    'citation',
    'review',
    'knowledge_graph',
  ]);
  assert.deepEqual([...GOV_CONTRACT_INTEGRATION_FLOW], [
    'solicitation',
    'far_agency_rules',
    'compliance_matrix',
    'evidence_vault',
    'proposal',
    'human_review',
  ]);
  assert.ok(ER9_MAY.includes('retrieve_current_official_text'));
  assert.ok(ER9_MAY.includes('build_advisory_compliance_matrices'));
  assert.ok(ER9_MUST_NOT.includes('autonomously_make_binding_legal_conclusions'));
  assert.ok(ER9_MUST_NOT.includes('certify_compliance'));
  assert.ok(ER9_MUST_NOT.includes('submit_filings'));
  assert.ok(
    ER9_MUST_NOT.includes(
      'represent_xiv_as_licensed_or_certified_when_it_is_not',
    ),
  );
});

test('register + freshness: unclear → UNKNOWN/STALE not current; version compare', () => {
  const current = exampleCurrentOfficialNode(agent);
  assert.equal(current.freshnessState, 'CURRENT_OFFICIAL');
  assert.equal(current.freshnessConfirmed, true);
  assert.equal(current.bindingLegalConclusion, false);

  const unclear = registerPolicyNode({
    actor: agent,
    policyId: 'pol-stale-cand',
    jurisdiction: 'US-CA',
    agencyAuthority: 'State agency',
    lawRegulationStandardName: 'Privacy rule candidate',
    citationIdentifier: 'CA-PRIV-X',
    effectiveDate: null,
    revisionVersion: null,
    sourceUrlReference: 'https://example.gov/privacy',
    applicability: 'covered entities',
    affectedIndustries: ['technology'],
    obligations: ['protect_personal_information'],
    exceptionsExemptions: [],
    enforcementAuthority: 'AG',
    confidence: 0.4,
    domain: 'privacy_data_protection',
    freshnessConfirmed: false,
  });
  assert.ok(!('denied' in unclear));
  assert.equal(unclear.freshnessState, 'UNKNOWN');
  assert.notEqual(unclear.freshnessOutcome, 'CURRENT');

  assert.equal(
    freshnessWhenEffectiveVersionUnconfirmed({ knownStale: true }),
    'STALE',
  );
  assert.equal(legalStateFromFreshness('STALE'), 'UNKNOWN');
  assert.equal(legalStateFromFreshness('UNKNOWN'), 'UNKNOWN');

  const treatCurrent = registerPolicyNode({
    actor: agent,
    policyId: 'pol-bad-current',
    jurisdiction: 'US-federal',
    agencyAuthority: 'X',
    lawRegulationStandardName: 'Y',
    citationIdentifier: 'Z',
    effectiveDate: null,
    revisionVersion: null,
    sourceUrlReference: 'https://example.gov/z',
    applicability: 'n/a',
    affectedIndustries: [],
    obligations: [],
    exceptionsExemptions: [],
    enforcementAuthority: 'x',
    confidence: 0.1,
    domain: 'ai_governance',
    freshnessConfirmed: false,
    claimedState: 'CURRENT_OFFICIAL',
  });
  assert.equal('denied' in treatCurrent, true);
  if ('denied' in treatCurrent) {
    assert.ok(
      treatCurrent.state === 'WAITING_DATA' || treatCurrent.state === 'DENIED',
    );
  }

  const freshCheck = checkEffectiveDateFreshness({
    node: unclear,
    confirmedCurrentVersion: false,
    attemptTreatUnclearAsCurrent: true,
  });
  assert.equal(freshCheck.state, 'WAITING_DATA');

  const cmp = comparePolicyVersions({
    actor: agent,
    older: { ...current, revisionVersion: 'v1' },
    newer: {
      ...current,
      policyId: 'pol-v2',
      revisionVersion: 'v2',
      obligations: [...current.obligations, 'new_obligation'],
    },
  });
  assert.ok(!('denied' in cmp));
  assert.equal(cmp.advisoryOnly, true);
  assert.equal(cmp.bindingConclusion, false);
  assert.ok(cmp.differences.length >= 1);
});

test('MUST_NOT locks: binding conclusions, certify, filings, licensed, scraping, cross-tenant', () => {
  assert.equal(attemptBindingLegalConclusion().state, 'DENIED');
  assert.equal(attemptCertifyCompliance().state, 'DENIED');
  assert.equal(attemptSubmitFilings().state, 'DENIED');
  assert.equal(attemptLicensedRepresentationWhenNot().state, 'DENIED');
  assert.equal(attemptUnauthorizedLegalDatabaseScraping().state, 'DENIED');
  assert.equal(attemptCrossTenantConfidentialClientMatters().state, 'DENIED');
  assert.equal(attemptTreatUnclearAsCurrent().state, 'WAITING_DATA');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');

  const scrape = registerPolicyNode({
    actor: agent,
    policyId: 'pol-scrape',
    jurisdiction: 'US',
    agencyAuthority: 'X',
    lawRegulationStandardName: 'Y',
    citationIdentifier: 'Z',
    effectiveDate: '2020-01-01',
    revisionVersion: '1',
    sourceUrlReference: 'https://example.gov',
    applicability: 'n/a',
    affectedIndustries: [],
    obligations: [],
    exceptionsExemptions: [],
    enforcementAuthority: 'x',
    confidence: 0.5,
    domain: 'export_controls',
    freshnessConfirmed: true,
    claimedState: 'GUIDANCE',
    attemptUnauthorizedScraping: true,
  });
  assert.equal('denied' in scrape, true);

  const cross = registerPolicyNode({
    actor: agent,
    policyId: 'pol-cross',
    jurisdiction: 'US',
    agencyAuthority: 'X',
    lawRegulationStandardName: 'Y',
    citationIdentifier: 'Z',
    effectiveDate: '2020-01-01',
    revisionVersion: '1',
    sourceUrlReference: 'https://example.gov',
    applicability: 'n/a',
    affectedIndustries: [],
    obligations: ['o1'],
    exceptionsExemptions: [],
    enforcementAuthority: 'x',
    confidence: 0.5,
    domain: 'labor_employment_rules',
    freshnessConfirmed: true,
    claimedState: 'GUIDANCE',
    attemptCrossTenantClientMatter: true,
    otherTenantId: 'other-tenant',
  });
  assert.equal('denied' in cross, true);
});

test('advisory compliance matrix + counsel flag + gov-contract flow', () => {
  const node = exampleCurrentOfficialNode(agent);
  const matrix = buildComplianceMatrix({
    actor: agent,
    matrixId: 'mtx-er9',
    solicitationId: 'RFQ-1',
    nodes: [node],
  });
  assert.ok(!('denied' in matrix));
  assert.equal(matrix.advisoryOnly, true);
  assert.equal(matrix.certified, false);
  assert.equal(matrix.counselReviewRequired, true);
  assert.ok(matrix.rows.length >= 1);

  assert.equal(
    buildComplianceMatrix({
      actor: agent,
      matrixId: 'mtx-bad',
      nodes: [node],
      attemptCertify: true,
    }).state,
    'DENIED',
  );

  const flag = flagCounselReview({
    actor: agent,
    flagId: 'cr-er9',
    policyId: node.policyId,
    matrixId: matrix.matrixId,
    reason: 'Counsel should review before binding use',
  });
  assert.ok(!('denied' in flag));
  assert.equal(flag.required, true);
  assert.equal(flag.bindingUseBlockedUntilCounsel, true);

  let gov = startGovContractIntegration({
    actor: agent,
    solicitationId: 'RFQ-1',
  });
  assert.ok(!('denied' in gov));
  assert.equal(gov.currentStep, 'solicitation');
  for (const step of [
    'far_agency_rules',
    'compliance_matrix',
    'evidence_vault',
    'proposal',
  ] as const) {
    const next = advanceGovContractIntegration({
      actor: agent,
      record: gov,
      to: step,
      matrixId: matrix.matrixId,
    });
    assert.ok(!('denied' in next));
    gov = next;
  }
  const reviewed = advanceGovContractIntegration({
    actor: human,
    record: gov,
    to: 'human_review',
  });
  assert.ok(!('denied' in reviewed));
  assert.equal(reviewed.humanReviewComplete, true);

  assert.equal(
    advanceGovContractIntegration({
      actor: agent,
      record: reviewed,
      to: 'human_review',
      attemptSubmitFiling: true,
    }).state,
    'DENIED',
  );
});

test('bootstrap + soft-wire + cycle; ER1/ER2 PRESENT; ER8/EQ14 WAITING_DATA ok', () => {
  const boot = bootstrapPublicLawPolicyKnowledgePack(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.legalStates.length, 6);
  assert.equal(boot.domains.length, 15);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER10/);

  const soft = er9SoftWireSnapshot(repoRoot);
  assert.equal(soft.er1RealApiConnectionRegistry.present, true);
  assert.equal(soft.er2ApiTruthStateMachine.present, true);
  assert.equal(soft.eq16SoftwareWormholeRouter.present, true);
  // Absent mid-flight packs → WAITING_DATA (not FAIL). Presence ≠ VERIFIED.
  assert.equal(soft.er8AncientCivilizationsKnowledgePack.present, false);
  assert.equal(soft.eq14NeuralPathwayArchitectureGraph.present, false);

  const node = exampleCurrentOfficialNode(agent);
  const ev = returnEr9EvidenceToHomeBase({
    evidenceId: 'ev-er9',
    actor: agent,
    node,
    summary: 'law/policy advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.advisoryOnly, true);

  const gate = requireHumanApproval({
    approvalId: 'a-er9',
    actor: human,
    action: 'counsel_review_binding_use',
  });
  assert.ok(!('denied' in gate));

  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');

  const cycle = runPublicLawPolicyKnowledgePackCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, PUBLIC_LAW_POLICY_KNOWLEDGE_PACK_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of PUBLIC_LAW_POLICY_KNOWLEDGE_PACK_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const er8Hop = cycle.hops.find((h) => h.hop === 'er8_soft_wire');
  assert.ok(er8Hop);
  assert.equal(er8Hop.state, 'WAITING_DATA');

  const eq14Hop = cycle.hops.find((h) => h.hop === 'eq14_soft_wire');
  assert.ok(eq14Hop);
  assert.equal(eq14Hop.state, 'WAITING_DATA');

  const er1Hop = cycle.hops.find((h) => h.hop === 'er1_soft_wire');
  assert.ok(er1Hop);
  assert.equal(er1Hop.state, 'PASS');

  const er2Hop = cycle.hops.find((h) => h.hop === 'er2_soft_wire');
  assert.ok(er2Hop);
  assert.equal(er2Hop.state, 'PASS');

  // Soft-wires for mid-flight untracked types may be PRESENT (≠ VERIFIED) or WAITING_DATA — never FAIL.
  for (const name of [
    'er3_soft_wire',
    'er4_soft_wire',
    'er5_soft_wire',
    'er6_soft_wire',
    'er7_soft_wire',
    'er8_soft_wire',
    'eq14_soft_wire',
  ] as const) {
    const h = cycle.hops.find((x) => x.hop === name);
    assert.ok(h);
    assert.ok(
      h.state === 'PASS' || h.state === 'WAITING_DATA',
      `${name} unexpected ${h.state}`,
    );
  }

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.matrix.certified, false);
  assert.equal(cycle.node.complianceCertified, false);
});
