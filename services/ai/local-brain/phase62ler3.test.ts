/**
 * 62L-ER3 — Public Data Source Registry denial + honesty tests.
 *
 * Script: npm run test:62ler3
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  DATA_SOURCE_AGENT_BOUNDS,
  DATA_SOURCE_MUST_NOT,
  DATA_SOURCE_PRIORITY_CATEGORIES,
  DATA_SOURCE_RECORD_FIELDS,
  DATA_SOURCE_STATES,
  ER3_DB_CANDIDATES_STATUS,
  ER3_LOCKS,
  ER3_MAY,
  ER3_MUST_NOT,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE_PROVISIONAL,
  GITHUB_SOT_ISSUE_STATUS,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_NOTE,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HISTORICAL_BRAIN_CHAIN,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  OFFLINE_KNOWLEDGE_PACK_PRECONDITIONS,
  PUBLIC_DATA_SOURCE_CORE_FLOW,
  PUBLIC_DATA_SOURCE_REGISTRY_CYCLE,
  assertEr3LocksIntact,
  er3SoftWireSnapshot,
  type Er3Actor,
} from './public-data-source-registry-types.ts';

import {
  advanceRightsReview,
  attachHistoricalBrainClaim,
  attemptConfidentialCompanyData,
  attemptLeakedDataset,
  attemptOrphanFact,
  attemptPaywallBypass,
  attemptPrivateGpsHistories,
  attemptProviderDataOutsideTerms,
  attemptRecommendAsAct,
  attemptUnknownRightsIntoGlobalBrain,
  bootstrapPublicDataSourceRegistry,
  discoverDataSource,
  fullHistoricalChain,
  fullOfflinePackPreconditions,
  ingestSource,
  markIngestionReady,
  monitorFreshness,
  prepareOfflineKnowledgePack,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnRegistryEvidenceToHomeBase,
  runPublicDataSourceRegistryCycle,
} from './public-data-source-registry-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er3Actor = {
  kind: 'research_agent',
  id: 'res-1',
  orgId: 'org-er3',
  tenantId: 'ten-er3',
  universeId: 'uni-er3',
  permissions: ['draft'],
};

const reviewer: Er3Actor = {
  kind: 'rights_reviewer',
  id: 'rev-1',
  orgId: 'org-er3',
  tenantId: 'ten-er3',
  universeId: 'uni-er3',
  permissions: ['rights_review'],
};

const human: Er3Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er3',
  tenantId: 'ten-er3',
  universeId: 'uni-er3',
  permissions: ['approve_consequential'],
};

test('SoT label ER3 / 62L-ER; issue provisional unresolved; next ER4', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER3');
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.equal(GITHUB_SOT_ISSUE_STATUS, 'UNRESOLVED_IN_ENVIRONMENT');
  assert.equal(GITHUB_SOT_ISSUE_PROVISIONAL, 161);
  assert.match(GITHUB_SOT_NOTE, /no confirmed issue number invented/i);
  assert.match(GITHUB_SOT_TITLE, /Public Data Source Registry/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER4/);
  assert.match(NEXT_PHASE_TITLE, /Rights & Provenance Gate/);
});

test('honesty locks: L4 false; UNKNOWN_RIGHTS quarantined; DB NOT_APPLIED', () => {
  assert.equal(assertEr3LocksIntact(), true);
  assert.equal(ER3_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER3_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER3_LOCKS.UNKNOWN_RIGHTS_INTO_GLOBAL_BRAIN, false);
  assert.equal(ER3_LOCKS.ORPHAN_FACTS_ALLOWED, false);
  assert.equal(ER3_LOCKS.PAYWALL_BYPASS_ALLOWED, false);
  assert.equal(ER3_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(DATA_SOURCE_AGENT_BOUNDS.mayIngestUnknownRights, false);
});

test('core flow + fields + states + categories + historical chain encoded', () => {
  assert.deepEqual([...PUBLIC_DATA_SOURCE_CORE_FLOW], [
    'discover_source',
    'rights_provenance_review',
    'schema_quality_check',
    'approve',
    'ingest_index',
    'cite',
    'monitor_freshness',
  ]);
  assert.equal(DATA_SOURCE_RECORD_FIELDS.length, 21);
  assert.ok(DATA_SOURCE_RECORD_FIELDS.includes('sourceId'));
  assert.ok(DATA_SOURCE_RECORD_FIELDS.includes('licenseRightsState'));
  assert.deepEqual([...DATA_SOURCE_STATES], [
    'DISCOVERED',
    'RIGHTS_REVIEW',
    'APPROVED',
    'INGESTION_READY',
    'INGESTED',
    'STALE',
    'RESTRICTED',
    'DENIED',
  ]);
  assert.equal(DATA_SOURCE_PRIORITY_CATEGORIES.length, 16);
  assert.ok(DATA_SOURCE_PRIORITY_CATEGORIES.includes('semiconductor_history'));
  assert.deepEqual([...HISTORICAL_BRAIN_CHAIN], [
    'source',
    'date',
    'geography',
    'context',
    'claim',
    'confidence',
    'contradiction_state',
  ]);
  assert.equal(OFFLINE_KNOWLEDGE_PACK_PRECONDITIONS.length, 5);
  assert.ok(DATA_SOURCE_MUST_NOT.includes('leaked_datasets'));
  assert.ok(ER3_MAY.length > 0);
  assert.ok(ER3_MUST_NOT.includes('unknown_rights_into_global_brain'));
});

test('UNKNOWN_RIGHTS quarantined; not into global brain', () => {
  const unknown = discoverDataSource({
    actor: agent,
    sourceId: 'u1',
    sourceProvider: 'mirror',
    datasetTitle: 'unclear',
    domain: 'x',
    geography: 'x',
    timeRange: 'x',
    language: 'en',
    accessMethod: 'download',
    apiDownloadEndpoint: 'x',
    licenseRightsState: 'UNKNOWN_RIGHTS',
    updateFrequency: 'x',
    freshness: 'x',
    schemaFormat: 'json',
    estimatedSize: 'x',
    dataQuality: 'x',
    allowedUses: 'x',
    retentionRestrictions: 'x',
    provenance: 'unclear',
    category: 'historical_archives',
  });
  assert.ok(!('denied' in unknown));
  assert.equal(unknown.quarantined, true);
  assert.equal(unknown.ingestionState, 'RIGHTS_REVIEW');
  assert.equal(attemptUnknownRightsIntoGlobalBrain().state, 'DENIED');

  const force = advanceRightsReview({
    record: unknown,
    reviewer,
    attemptApproveUnknownRightsIntoGlobalBrain: true,
  });
  assert.equal('denied' in force && force.state, 'DENIED');
});

test('no orphan facts; historical chain distinguishes from current reality', () => {
  assert.equal(attemptOrphanFact().state, 'DENIED');
  const src = discoverDataSource({
    actor: agent,
    sourceId: 's1',
    sourceProvider: 'gov',
    datasetTitle: 'census',
    domain: 'census',
    geography: 'US',
    timeRange: '2020',
    language: 'en',
    accessMethod: 'api',
    apiDownloadEndpoint: 'https://example.gov',
    licenseRightsState: 'GOVERNMENT_OPEN',
    updateFrequency: 'decennial',
    freshness: 'published',
    schemaFormat: 'csv',
    estimatedSize: '50MB',
    dataQuality: 'good',
    allowedUses: 'research',
    retentionRestrictions: 'public',
    provenance: 'gov-portal',
    category: 'census_demographics',
  });
  assert.ok(!('denied' in src));
  const approved = advanceRightsReview({ record: src, reviewer });
  assert.ok(!('denied' in approved));

  const orphan = attachHistoricalBrainClaim({
    record: approved,
    chain: { claim: 'lonely' },
    attemptOrphanFact: true,
  });
  assert.equal('denied' in orphan && orphan.state, 'DENIED');

  const ok = attachHistoricalBrainClaim({
    record: approved,
    chain: fullHistoricalChain(),
  });
  assert.ok(!('denied' in ok));
  assert.equal(ok.historicalEvidence, true);
  assert.equal(ok.currentReality, false);
  assert.equal(ok.record.historicalChainAttached, true);
});

test('approve → ingestion ready → ingest → stale freshness', () => {
  const src = discoverDataSource({
    actor: agent,
    sourceId: 's2',
    sourceProvider: 'gov',
    datasetTitle: 'trade',
    domain: 'economics',
    geography: 'global',
    timeRange: '2015-2024',
    language: 'en',
    accessMethod: 'api',
    apiDownloadEndpoint: 'https://example.gov/trade',
    licenseRightsState: 'OPEN_LICENSE',
    updateFrequency: 'monthly',
    freshness: 'fresh',
    schemaFormat: 'json',
    estimatedSize: '1GB',
    dataQuality: 'good',
    allowedUses: 'research',
    retentionRestrictions: 'public',
    provenance: 'open-portal',
    category: 'economics_and_trade',
  });
  assert.ok(!('denied' in src));
  const approved = advanceRightsReview({ record: src, reviewer });
  assert.ok(!('denied' in approved));
  const ready = markIngestionReady({ record: approved, qualityPass: true });
  assert.ok(!('denied' in ready));
  assert.equal(ready.ingestionState, 'INGESTION_READY');
  const ingested = ingestSource({ record: ready });
  assert.ok(!('denied' in ingested));
  assert.equal(ingested.ingestionState, 'INGESTED');
  const stale = monitorFreshness({ record: ingested, stale: true });
  assert.equal(stale.ingestionState, 'STALE');
});

test('offline pack requires all preconditions', () => {
  const src = discoverDataSource({
    actor: agent,
    sourceId: 's3',
    sourceProvider: 'gov',
    datasetTitle: 'maps',
    domain: 'geo',
    geography: 'US',
    timeRange: '2024',
    language: 'en',
    accessMethod: 'download',
    apiDownloadEndpoint: 'https://example.gov/maps',
    licenseRightsState: 'PUBLIC_DOMAIN',
    updateFrequency: 'annual',
    freshness: 'fresh',
    schemaFormat: 'geojson',
    estimatedSize: '200MB',
    dataQuality: 'good',
    allowedUses: 'local_research',
    retentionRestrictions: 'public',
    provenance: 'gov',
    category: 'geospatial_maps',
  });
  assert.ok(!('denied' in src));
  const approved = advanceRightsReview({ record: src, reviewer });
  assert.ok(!('denied' in approved));
  const ready = markIngestionReady({ record: approved, qualityPass: true });
  assert.ok(!('denied' in ready));
  const ing = ingestSource({ record: ready });
  assert.ok(!('denied' in ing));

  const bad = prepareOfflineKnowledgePack({
    record: ing,
    preconditions: { version_recorded: true },
    attemptWithoutPreconditions: true,
  });
  assert.equal('denied' in bad && bad.state, 'DENIED');
  const ok = prepareOfflineKnowledgePack({
    record: ing,
    preconditions: fullOfflinePackPreconditions(),
  });
  assert.ok(!('denied' in ok));
  assert.equal(ok.encryptedCandidate, true);
});

test('safety denies: leaked/paywall/GPS/confidential/outside terms', () => {
  assert.equal(attemptLeakedDataset().state, 'DENIED');
  assert.equal(attemptPaywallBypass().state, 'DENIED');
  assert.equal(attemptPrivateGpsHistories().state, 'DENIED');
  assert.equal(attemptConfidentialCompanyData().state, 'DENIED');
  assert.equal(attemptProviderDataOutsideTerms().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');

  const leaked = discoverDataSource({
    actor: agent,
    sourceId: 'bad',
    sourceProvider: 'x',
    datasetTitle: 'x',
    domain: 'x',
    geography: 'x',
    timeRange: 'x',
    language: 'en',
    accessMethod: 'x',
    apiDownloadEndpoint: 'x',
    licenseRightsState: 'PUBLIC_DOMAIN',
    updateFrequency: 'x',
    freshness: 'x',
    schemaFormat: 'x',
    estimatedSize: 'x',
    dataQuality: 'x',
    allowedUses: 'x',
    retentionRestrictions: 'x',
    provenance: 'x',
    category: 'scientific_research',
    attemptLeakedDataset: true,
  });
  assert.equal('denied' in leaked && leaked.state, 'DENIED');

  const confidential = discoverDataSource({
    actor: agent,
    sourceId: 'c1',
    sourceProvider: 'x',
    datasetTitle: 'x',
    domain: 'x',
    geography: 'x',
    timeRange: 'x',
    language: 'en',
    accessMethod: 'x',
    apiDownloadEndpoint: 'x',
    licenseRightsState: 'CONFIDENTIAL',
    updateFrequency: 'x',
    freshness: 'x',
    schemaFormat: 'x',
    estimatedSize: 'x',
    dataQuality: 'x',
    allowedUses: 'x',
    retentionRestrictions: 'x',
    provenance: 'x',
    category: 'public_company_business_history',
  });
  assert.equal('denied' in confidential && confidential.state, 'DENIED');
});

test('home base evidence + guardian; soft-wire EP4/EP5/EP10; cycle complete', () => {
  const boot = bootstrapPublicDataSourceRegistry(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.fields.length, 21);
  assert.equal(boot.categories.length, 16);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issueStatus, 'UNRESOLVED_IN_ENVIRONMENT');

  const soft = er3SoftWireSnapshot(repoRoot);
  assert.equal(soft.ep4IpFirewall.present, true);
  assert.equal(soft.ep5BenchmarkMemory.present, true);
  assert.equal(soft.ep10OtherAcceleratorRegistry.present, true);

  const ev = returnRegistryEvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    summary: 'registry advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.authorityGranted, false);
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runPublicDataSourceRegistryCycle({
    actor: agent,
    reviewer,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, PUBLIC_DATA_SOURCE_REGISTRY_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of PUBLIC_DATA_SOURCE_REGISTRY_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.ok(!('denied' in cycle.discovered));
  assert.ok(!('denied' in cycle.unknownRights));
  assert.equal(cycle.unknownRights.quarantined, true);
});
