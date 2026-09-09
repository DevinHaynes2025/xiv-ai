/**
 * 62L-ER2 — Public/Open Historical Data Registry denial + honesty tests.
 *
 * Script: npm run test:62ler2
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  CORPUS_INGEST_PRECONDITIONS,
  ER2_AGENT_BOUNDS,
  ER2_DB_CANDIDATES_STATUS,
  ER2_LOCKS,
  ER2_MAY,
  ER2_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HISTORICAL_CORPUS_REGISTRY_FIELDS,
  HISTORICAL_CORPUS_STATES,
  HISTORICAL_DATA_REGISTRY_FLOW,
  HISTORICAL_DATA_TRUTH_BOUNDARY,
  HISTORICAL_RIGHTS_CLASSES,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PUBLIC_OPEN_HISTORICAL_DATA_REGISTRY_CYCLE,
  assertEr2LocksIntact,
  catalogEntryMeansIngest,
  er2SoftWireSnapshot,
  evaluateCorpusIngestPreconditions,
  publicOpenMeansUnrestricted,
  unknownRightsAllowed,
  type Er2Actor,
} from './public-open-historical-data-registry-types.ts';

import {
  attemptAutonomousBulkIngest,
  attemptBypassGuardianRls,
  attemptExpandTenantUniverseAccess,
  attemptIngestEligibility,
  attemptIngestWithoutRightsAndProvenance,
  attemptLiteralResurrectionClaim,
  attemptPersistHiddenChainOfThought,
  attemptRecommendAsAct,
  attemptSilentIngestMissingProvenance,
  attemptUnknownRightsAsAllowed,
  attachProvenanceAndLicense,
  bootstrapPublicOpenHistoricalDataRegistry,
  catalogHistoricalCorpus,
  exampleIngestEligibleCorpus,
  probeGuardianRlsTenantUniverseIsolation,
  quarantineCorpus,
  requireHumanApproval,
  returnEr2EvidenceToHomeBase,
  runPublicOpenHistoricalDataRegistryCycle,
  verifyRightsAndMarkEligible,
} from './public-open-historical-data-registry-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er2Actor = {
  kind: 'historical_data_registry',
  id: 'hdr-1',
  orgId: 'org-er2',
  tenantId: 'ten-er2',
  universeId: 'uni-er2',
  permissions: ['draft'],
};

const human: Er2Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er2',
  tenantId: 'ten-er2',
  universeId: 'uni-er2',
  permissions: ['approve_consequential'],
};

test('SoT label ER2 / #162; GitLab mirror not invented; next ER3; ER layer noted', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER2');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Historical Data Registry/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER3/);
  assert.match(ER_LAYER_TITLE, /Historical Knowledge/);
});

test('honesty locks: L4 false; catalog≠ingest; no avatar synthesis; DB NOT_APPLIED', () => {
  assert.equal(assertEr2LocksIntact(), true);
  assert.equal(ER2_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER2_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER2_LOCKS.CATALOG_ENTRY_EQ_INGEST, false);
  assert.equal(ER2_LOCKS.UNKNOWN_RIGHTS_EQ_ALLOWED, false);
  assert.equal(ER2_LOCKS.SYNTHESIZE_HISTORICAL_AVATARS_IN_ER2, false);
  assert.equal(ER2_LOCKS.CLAIM_LITERAL_RESURRECTION_OR_CONSCIOUSNESS, false);
  assert.equal(ER2_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(catalogEntryMeansIngest(), false);
  assert.equal(unknownRightsAllowed(), false);
  assert.equal(publicOpenMeansUnrestricted(), false);
  assert.equal(ER2_AGENT_BOUNDS.maySynthesizeHistoricalAvatars, false);
  assert.equal(
    HISTORICAL_DATA_TRUTH_BOUNDARY.catalogEntryMeansDocumentedOnly,
    true,
  );
});

test('registry fields + states + rights + preconditions + flow encoded', () => {
  assert.ok(HISTORICAL_CORPUS_REGISTRY_FIELDS.includes('corpusId'));
  assert.ok(HISTORICAL_CORPUS_REGISTRY_FIELDS.includes('provenanceRefs'));
  assert.ok(HISTORICAL_CORPUS_REGISTRY_FIELDS.includes('ingestEligibility'));
  assert.ok(HISTORICAL_CORPUS_STATES.includes('DOCUMENTED'));
  assert.ok(HISTORICAL_CORPUS_STATES.includes('INGEST_ELIGIBLE'));
  assert.ok(HISTORICAL_CORPUS_STATES.includes('QUARANTINED'));
  assert.ok(HISTORICAL_RIGHTS_CLASSES.includes('PUBLIC_DOMAIN'));
  assert.ok(HISTORICAL_RIGHTS_CLASSES.includes('UNKNOWN_RIGHTS'));
  assert.equal(CORPUS_INGEST_PRECONDITIONS.length, 9);
  assert.ok(HISTORICAL_DATA_REGISTRY_FLOW.includes('eligibility_gate'));
  assert.ok(ER2_MAY.includes('quarantine_unknown_rights_or_missing_provenance'));
  assert.ok(ER2_MUST_NOT.includes('treat_catalog_entry_as_ingest_authorization'));
  assert.ok(ER2_MUST_NOT.includes('synthesize_historical_avatars_in_er2'));
});

test('catalog documented; ingest only after provenance+rights; avatar synthesis denied', () => {
  const documented = catalogHistoricalCorpus({
    actor: agent,
    corpusId: 'c1',
    title: 'Example Corpus',
    sourceAuthority: 'Example Archive',
    accessUrlOrLocator: 'https://archive.example/test',
  });
  assert.ok(!('denied' in documented));
  assert.equal(documented.state, 'DOCUMENTED');
  assert.equal(documented.ingestEligibility, 'NOT_ELIGIBLE');
  assert.equal(documented.synthesizesHistoricalAvatar, false);
  assert.equal(
    attemptIngestEligibility({ actor: agent, corpus: documented }).state,
    'DENIED',
  );

  const { eligible } = exampleIngestEligibleCorpus(agent, human);
  assert.equal(eligible.state, 'INGEST_ELIGIBLE');
  const pre = evaluateCorpusIngestPreconditions(eligible);
  assert.equal(pre.ok, true);
  const use = attemptIngestEligibility({ actor: agent, corpus: eligible });
  assert.ok(!('denied' in use));
  assert.equal(use.allowed, true);
  assert.equal(use.synthesizesHistoricalAvatar, false);

  assert.equal(
    attemptIngestEligibility({
      actor: agent,
      corpus: eligible,
      attemptSynthesizeAvatar: true,
    }).state,
    'DENIED',
  );
  assert.equal(attemptLiteralResurrectionClaim().state, 'DENIED');
});

test('unknown rights quarantine; missing provenance blocks; public open ≠ unrestricted', () => {
  const unknown = catalogHistoricalCorpus({
    actor: agent,
    corpusId: 'c-unknown',
    title: 'Mystery',
    sourceAuthority: 'Unknown',
    accessUrlOrLocator: 'https://mystery.invalid',
    rightsClass: 'UNKNOWN_RIGHTS',
  });
  assert.ok(!('denied' in unknown));
  const q = quarantineCorpus({ corpus: unknown, reason: 'UNKNOWN_RIGHTS' });
  assert.equal(q.state, 'QUARANTINED');
  assert.equal(attemptUnknownRightsAsAllowed().state, 'DENIED');

  assert.equal(
    attachProvenanceAndLicense({
      corpus: unknown,
      licenseOrTermsRef: 'terms://x',
      provenanceRefs: [],
      timeCoverage: '1900',
      rightsClass: 'PUBLIC_OPEN',
    }).state,
    'DENIED',
  );
  assert.equal(attemptSilentIngestMissingProvenance().state, 'DENIED');
  assert.equal(publicOpenMeansUnrestricted(), false);

  assert.equal(
    verifyRightsAndMarkEligible({
      corpus: unknown,
      human,
    }).state,
    'DENIED',
  );
});

test('authority denies hold', () => {
  assert.equal(attemptIngestWithoutRightsAndProvenance().state, 'DENIED');
  assert.equal(attemptAutonomousBulkIngest().state, 'DENIED');
  assert.equal(attemptBypassGuardianRls().state, 'DENIED');
  assert.equal(attemptExpandTenantUniverseAccess().state, 'DENIED');
  assert.equal(attemptPersistHiddenChainOfThought().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
});

test('bootstrap + soft-wire + cycle; ER1 PRESENT; EQ14 WAITING_DATA', () => {
  const boot = bootstrapPublicOpenHistoricalDataRegistry(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.registryFields.length, 15);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER3/);
  assert.match(boot.erLayer, /Data Fabric/);

  const soft = er2SoftWireSnapshot(repoRoot);
  assert.equal(soft.er1RealApiConnectionRegistry.present, true);
  assert.equal(soft.eq16SoftwareWormholeRouter.present, true);
  assert.equal(soft.eq14NeuralPathwayArchitectureGraph.present, false);
  assert.match(soft.eq14NeuralPathwayArchitectureGraph.note, /WAITING_DATA/);

  const { eligible } = exampleIngestEligibleCorpus(agent, human);
  const ev = returnEr2EvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    corpus: eligible,
    summary: 'catalog advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.authorityGranted, false);
  assert.equal(ev.synthesizesHistoricalAvatar, false);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runPublicOpenHistoricalDataRegistryCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(
    cycle.hops.length,
    PUBLIC_OPEN_HISTORICAL_DATA_REGISTRY_CYCLE.length,
  );
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of PUBLIC_OPEN_HISTORICAL_DATA_REGISTRY_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const eq14Hop = cycle.hops.find((h) => h.hop === 'eq14_soft_wire');
  assert.ok(eq14Hop);
  assert.equal(eq14Hop.state, 'WAITING_DATA');

  const er1Hop = cycle.hops.find((h) => h.hop === 'er1_soft_wire');
  assert.ok(er1Hop);
  assert.equal(er1Hop.state, 'PASS');

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.ingest.allowed, true);
  assert.equal(cycle.corpus.state, 'INGEST_ELIGIBLE');
});
