/**
 * 62L-ER11 — Public Government Data Pack denial + honesty tests.
 *
 * Script: npm run test:62ler11
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ER11_AGENT_BOUNDS,
  ER11_DB_CANDIDATES_STATUS,
  ER11_LOCKS,
  ER11_MAY,
  ER11_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOV_CONTRACT_USE_CHAIN,
  GOV_DATA_BOUNDARY,
  GOV_DATA_CORE_FLOW,
  GOV_DATA_PRIORITY_CATEGORIES,
  GOV_DATA_TRUTH_STATES,
  GOV_HISTORICAL_BUYING_RULE,
  GOV_LOGISTICS_USES,
  GOV_SOURCE_RECORD_FIELDS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PUBLIC_GOVERNMENT_DATA_PACK_CYCLE,
  assertEr11LocksIntact,
  er11SoftWireSnapshot,
  historicalAwardsGuaranteeFutureBuying,
  mayClaimRealtime,
  type Er11Actor,
} from './public-government-data-pack-types.ts';

import {
  attemptClassifiedOrNonPublicAssumption,
  attemptCrossTenantPrivateContractPooling,
  attemptFabricateAgencyRelationship,
  attemptHistoricalAsFutureBuyingGuarantee,
  attemptRealtimeWithoutVerifiedLiveConnection,
  attemptRecommendAsAct,
  attemptRestrictedPortalBypass,
  attemptUnsupportedEligibilityOrAwardClaim,
  bootstrapPublicGovernmentDataPack,
  buildAdvisoryCaptureAnalysis,
  buildAdvisoryLogisticsAnalysis,
  classifyGovDataTruthState,
  exampleOfficialProcurementSource,
  normalizeDedupeIndexIntoGovKnowledgeGraph,
  probeGuardianRlsTenantUniverseIsolation,
  registerOfficialGovernmentSource,
  requireHumanApproval,
  returnEr11EvidenceToHomeBase,
  runPublicGovernmentDataPackCycle,
} from './public-government-data-pack-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er11Actor = {
  kind: 'gov_data_pack',
  id: 'gdp-1',
  orgId: 'org-er11',
  tenantId: 'ten-er11',
  universeId: 'uni-er11',
  permissions: ['draft'],
};

const human: Er11Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er11',
  tenantId: 'ten-er11',
  universeId: 'uni-er11',
  permissions: ['approve_consequential'],
};

test('SoT label ER11 / #162; Public Government Data Pack; next ER12 Live Data Connector Gate', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER11');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Public Government Data Pack/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER12/);
  assert.match(NEXT_PHASE_TITLE, /Live Data Connector Gate/);
  assert.match(ER_LAYER_TITLE, /Real API Data Fabric/);
});

test('honesty locks: L4 false; historical≠future buying; no classified; DB NOT_APPLIED', () => {
  assert.equal(assertEr11LocksIntact(), true);
  assert.equal(ER11_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER11_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER11_LOCKS.HISTORICAL_AWARDS_AS_GUARANTEED_FUTURE_BUYING, false);
  assert.equal(ER11_LOCKS.CLASSIFIED_OR_NON_PUBLIC_GOV_DATA_ASSUMPTIONS, false);
  assert.equal(ER11_LOCKS.CLAIM_REALTIME_WITHOUT_VERIFIED_LIVE_CONNECTION, false);
  assert.equal(ER11_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(
    GOV_HISTORICAL_BUYING_RULE.historicalAwardsAreGuaranteedFutureBuying,
    false,
  );
  assert.equal(historicalAwardsGuaranteeFutureBuying(), false);
  assert.equal(GOV_DATA_BOUNDARY.mayBypassRestrictedPortals, false);
  assert.equal(ER11_AGENT_BOUNDS.mayClaimRealTimeWithoutVerifiedLiveConnection, false);
});

test('categories + fields + core flow + contract chain + truth states encoded', () => {
  assert.equal(GOV_DATA_PRIORITY_CATEGORIES.length, 14);
  assert.ok(
    GOV_DATA_PRIORITY_CATEGORIES.includes('procurement_opportunities_and_awards'),
  );
  assert.ok(
    GOV_DATA_PRIORITY_CATEGORIES.includes('public_safety_disaster_logistics'),
  );
  assert.equal(GOV_SOURCE_RECORD_FIELDS[0], 'governmentSourceId');
  assert.equal(GOV_SOURCE_RECORD_FIELDS.length, 15);
  assert.deepEqual([...GOV_DATA_CORE_FLOW], [
    'official_source',
    'provenance_rights_gate',
    'normalize',
    'dedupe',
    'index',
    'government_knowledge_graph',
    'agent_analysis',
  ]);
  assert.equal(GOV_CONTRACT_USE_CHAIN.length, 9);
  assert.equal(GOV_CONTRACT_USE_CHAIN[0], 'opportunity_discovery');
  assert.equal(GOV_CONTRACT_USE_CHAIN.at(-1), 'proposal_evidence');
  assert.equal(GOV_LOGISTICS_USES.length, 8);
  assert.deepEqual([...GOV_DATA_TRUTH_STATES], [
    'OFFICIAL_CURRENT',
    'OFFICIAL_HISTORICAL',
    'DELAYED',
    'STALE',
    'INCOMPLETE',
    'UNKNOWN',
  ]);
  assert.ok(
    ER11_MAY.includes(
      'classify_truth_states_never_realtime_without_verified_live_connection',
    ),
  );
  assert.ok(
    ER11_MUST_NOT.includes('treat_historical_awards_as_guaranteed_future_buying'),
  );
});

test('register after rights; normalize/dedupe/index into gov KG', () => {
  assert.equal(
    registerOfficialGovernmentSource({
      actor: agent,
      governmentSourceId: 'x',
      agencyAuthority: 'A',
      datasetApi: 'api',
      jurisdiction: 'US',
      publicationUpdateDate: '2026-01-01',
      geographicScope: 'US',
      timeRange: '2020-2025',
      schema: 'v1',
      accessMethod: 'api',
      licensePublicUseTerms: 'public',
      freshness: 'periodic',
      dataQualityNotes: 'n/a',
      authoritativeSourceLevel: 'PRIMARY_OFFICIAL',
      category: 'census_and_demographics',
      evidenceRefs: ['e1'],
      rightsProvenancePassed: false,
    }).state,
    'DENIED',
  );

  const source = exampleOfficialProcurementSource(agent);
  assert.equal(source.ingestionState, 'APPROVED');
  assert.equal(source.truthState, 'OFFICIAL_HISTORICAL');
  assert.equal(source.liveRealtimeClaimed, false);
  assert.equal(source.classifiedOrNonPublicAssumed, false);

  const indexed = normalizeDedupeIndexIntoGovKnowledgeGraph({
    actor: agent,
    sources: [source, source],
  });
  assert.ok(!('denied' in indexed));
  assert.equal(indexed.indexedCount, 1);
  assert.equal(indexed.dedupedCount, 1);
  assert.equal(indexed.nodes[0]?.indexed, true);
});

test('truth states; no realtime without verified live; advisory capture/logistics', () => {
  assert.equal(
    mayClaimRealtime({
      sourceSupportsRealtime: true,
      liveConnectionVerified: false,
    }),
    false,
  );
  assert.equal(
    mayClaimRealtime({
      sourceSupportsRealtime: true,
      liveConnectionVerified: true,
    }),
    true,
  );
  assert.equal(
    classifyGovDataTruthState({
      isOfficial: true,
      isCurrentPublication: true,
      isHistorical: false,
      delayed: false,
      stale: false,
      incomplete: false,
      sourceSupportsRealtime: true,
      liveConnectionVerified: false,
      attemptClaimRealtime: true,
    }).state,
    'DENIED',
  );
  assert.equal(
    classifyGovDataTruthState({
      isOfficial: true,
      isCurrentPublication: false,
      isHistorical: true,
      delayed: false,
      stale: false,
      incomplete: false,
      sourceSupportsRealtime: false,
      liveConnectionVerified: false,
    }),
    'OFFICIAL_HISTORICAL',
  );

  const source = exampleOfficialProcurementSource(agent);
  const capture = buildAdvisoryCaptureAnalysis({
    actor: agent,
    analysisId: 'c1',
    governmentSourceIds: [source.governmentSourceId],
    summary: 'advisory',
    evidenceRefs: source.evidenceRefs,
  });
  assert.ok(!('denied' in capture));
  assert.equal(capture.advisoryOnly, true);
  assert.equal(capture.historicalAsGuaranteedFutureBuying, false);
  assert.equal(
    buildAdvisoryCaptureAnalysis({
      actor: agent,
      analysisId: 'c-bad',
      governmentSourceIds: [source.governmentSourceId],
      summary: 'bad',
      evidenceRefs: source.evidenceRefs,
      attemptGuaranteeFutureBuying: true,
    }).state,
    'DENIED',
  );

  const logistics = buildAdvisoryLogisticsAnalysis({
    actor: agent,
    analysisId: 'l1',
    uses: ['freight_flows', 'disaster_response_networks'],
    governmentSourceIds: [source.governmentSourceId],
    summary: 'advisory logistics',
    evidenceRefs: source.evidenceRefs,
  });
  assert.ok(!('denied' in logistics));
  assert.equal(logistics.advisoryOnly, true);
});

test('governance denies + guardian isolation hold', () => {
  assert.equal(attemptClassifiedOrNonPublicAssumption().state, 'DENIED');
  assert.equal(attemptRestrictedPortalBypass().state, 'DENIED');
  assert.equal(attemptFabricateAgencyRelationship().state, 'DENIED');
  assert.equal(attemptUnsupportedEligibilityOrAwardClaim().state, 'DENIED');
  assert.equal(attemptCrossTenantPrivateContractPooling().state, 'DENIED');
  assert.equal(attemptHistoricalAsFutureBuyingGuarantee().state, 'DENIED');
  assert.equal(attemptRealtimeWithoutVerifiedLiveConnection().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
});

test('bootstrap + soft-wire + cycle; ER2/ER1 PRESENT; ER10/EQ14 WAITING_DATA ok', () => {
  const boot = bootstrapPublicGovernmentDataPack(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.priorityCategories.length, 14);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER12/);

  const soft = er11SoftWireSnapshot(repoRoot);
  assert.equal(soft.er2ApiTruthStateMachine.present, true);
  assert.equal(soft.er1RealApiConnectionRegistry.present, true);
  assert.equal(soft.eq16SoftwareWormholeRouter.present, true);
  assert.equal(soft.eq14NeuralPathwayArchitectureGraph.present, false);
  assert.equal(soft.er10PublicGeospatialMobilityPack.present, false);
  assert.equal(soft.er9PublicLawPolicyKnowledgePack.present, false);

  const source = exampleOfficialProcurementSource(agent);
  const ev = returnEr11EvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    governmentSourceId: source.governmentSourceId,
    summary: 'gov pack advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.advisoryOnly, true);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runPublicGovernmentDataPackCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, PUBLIC_GOVERNMENT_DATA_PACK_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of PUBLIC_GOVERNMENT_DATA_PACK_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const er10Hop = cycle.hops.find((h) => h.hop === 'er10_soft_wire');
  assert.ok(er10Hop);
  assert.equal(er10Hop.state, 'WAITING_DATA');

  const eq14Hop = cycle.hops.find((h) => h.hop === 'eq14_soft_wire');
  assert.ok(eq14Hop);
  assert.equal(eq14Hop.state, 'WAITING_DATA');

  const er2Hop = cycle.hops.find((h) => h.hop === 'er2_soft_wire');
  assert.ok(er2Hop);
  assert.equal(er2Hop.state, 'PASS');

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.source.governmentSourceId, 'gov-src-sam-awards-1');
});
