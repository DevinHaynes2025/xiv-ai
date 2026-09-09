/**
 * Phase 2I-D Historical Intelligence unit tests.
 * Deterministic. No network. Not LIVE.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { agentDebuggerCanDeploy } from './diagnostics';
import { forecastRequiresEvidence } from './foresight';
import {
  acceptBusinessEvent,
  correctBusinessEvent,
  createDistressSignal,
  declareBankruptcy,
  detectDuplicateSourceRecord,
  historicalSimilarityIsDestiny,
  ingestPublicObservation,
  learningFromAcceptedEvent,
  ledgerPersistsToHostedDatabase,
  listBusinessEvents,
  normalizeHistoricalRecord,
  resetBusinessEventLedgerForTests,
  resolveEntitiesByNameOnly,
  runBusinessTimeMachine,
  trillionEventCapacityIsLive,
  trillionEventCapacityStatus,
} from './historical';
import { learningMayMutateAgentAuthority } from './learning';
import { publishingWritesEnabled } from './publishing/policy';
import {
  canIngestFromProvider,
  evaluateGlobalBrainIngestion,
  FRED_DESCRIPTOR,
  providerRegistryDefault,
  recordWorldBankValidatedRetrieval,
  registerBusinessDataProvider,
  resetSourceRegistryForTests,
  resetWorldBankAdapterStatusForTests,
  seedDeclaredBusinessDataProviders,
  sourcesUseServiceRole,
  worldBankAdapterCapabilityStatus,
  worldBankGlobalFabricIsProductionLive,
} from './sources';
import { mapWorldBankRecord, isWorldBankDenied, isWorldBankObservation } from './providers/world-bank';
import { evaluateTenantActivation } from './tenant';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

resetSourceRegistryForTests();
resetBusinessEventLedgerForTests();
resetWorldBankAdapterStatusForTests();
seedDeclaredBusinessDataProviders();

test('World Bank adapter discriminates denied results from observations', () => {
  const denied = mapWorldBankRecord({});
  assert.equal(isWorldBankDenied(denied), true);
  const observation = mapWorldBankRecord({
    country: { id: 'US', value: 'United States' },
    indicator: { id: 'NY.GDP.MKTP.CD', value: 'GDP (current US$)' },
    date: '2020',
    value: 1,
  });
  assert.equal(isWorldBankObservation(observation), true);
  if (isWorldBankObservation(observation)) {
    assert.ok(observation.sourceRecordId);
    assert.ok(observation.retrievedAt);
    assert.ok(observation.freshness);
  }
  assert.equal(worldBankAdapterCapabilityStatus(), 'CONFIGURED');
  assert.equal(worldBankGlobalFabricIsProductionLive(), false);
});

test('provider registry defaults deny', () => {
  const def = providerRegistryDefault();
  assert.equal(def.allowIngest, false);
});

test('unconfigured provider cannot ingest', () => {
  const bls = canIngestFromProvider('us_bls');
  assert.equal(bls.allowed, false);
  assert.match(bls.reason, /unconfigured/i);
});

test('unauthorized provider cannot ingest', () => {
  registerBusinessDataProvider({
    ...FRED_DESCRIPTOR,
    providerId: 'us_fred_unauthorized',
    status: 'configured',
    authorization: {
      authorized: false,
      configured: true,
      provenanceEnabled: true,
      classificationKnown: true,
      usageRightsKnown: true,
    },
    license: { licenseType: 'fred', usageRights: 'key required', known: true },
    classification: 'public',
  });
  const denied = canIngestFromProvider('us_fred_unauthorized');
  assert.equal(denied.allowed, false);
  assert.match(denied.reason, /unauthorized/i);
});

test('unknown license rejected', () => {
  registerBusinessDataProvider({
    ...FRED_DESCRIPTOR,
    providerId: 'unknown_license_source',
    status: 'authorized',
    authorization: {
      authorized: true,
      configured: true,
      provenanceEnabled: true,
      classificationKnown: true,
      usageRightsKnown: false,
    },
    license: { licenseType: 'unknown', usageRights: '', known: false },
    classification: 'public',
  });
  const denied = canIngestFromProvider('unknown_license_source');
  assert.equal(denied.allowed, false);
  assert.match(denied.reason, /license/i);
});

test('missing provenance rejected', () => {
  const denied = normalizeHistoricalRecord({
    kind: 'macro',
    sourceId: 'world_bank_open_data',
    publisher: 'World Bank',
    retrievedAt: '2026-09-07T00:00:00.000Z',
    ingestedAt: '2026-09-07T00:00:00.000Z',
    licenseType: 'CC-BY-4.0',
    usageRights: 'attribution required',
  });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('private Company Brain data rejected by Global Brain', () => {
  const decision = evaluateGlobalBrainIngestion({
    category: 'public',
    brainOrigin: 'company',
    provenancePresent: true,
    licenseKnown: true,
  });
  assert.equal(decision.allowed, false);
});

test('personal data rejected by Global Brain unless explicit authorized path', () => {
  const decision = evaluateGlobalBrainIngestion({
    category: 'explicitly_shared',
    brainOrigin: 'personal',
    provenancePresent: true,
    licenseKnown: true,
  });
  assert.equal(decision.allowed, false);
});

test('corrections append rather than silently rewrite events', () => {
  const first = normalizeHistoricalRecord({
    kind: 'gdp',
    sourceId: 'world_bank_open_data',
    sourceRecordId: 'NG:NY.GDP.MKTP.CD:2023',
    publisher: 'World Bank',
    retrievedAt: '2026-09-07T00:00:00.000Z',
    ingestedAt: '2026-09-07T00:00:00.000Z',
    licenseType: 'CC-BY-4.0',
    usageRights: 'attribution required',
    payload: { value: 1 },
  });
  assert.equal('eventId' in first, true);
  if (!('eventId' in first)) return;
  const accepted = acceptBusinessEvent(first, '2026-09-07T00:00:00.000Z');
  assert.equal(accepted.accepted, true);
  if (!accepted.accepted) return;
  const corrected = normalizeHistoricalRecord({
    ...first,
    payload: { value: 2 },
    retrievedAt: '2026-09-07T00:01:00.000Z',
  });
  assert.equal('eventId' in corrected, true);
  if (!('eventId' in corrected)) return;
  const version = correctBusinessEvent(accepted.event.eventId, corrected, '2026-09-07T00:01:00.000Z');
  assert.equal(version.accepted, true);
  if (version.accepted) {
    assert.equal(version.rewritten, false);
    assert.equal(version.event.supersedes, accepted.event.eventId);
  }
  assert.equal(listBusinessEvents().length >= 2, true);
});

test('duplicate source records detected', () => {
  assert.equal(detectDuplicateSourceRecord('world_bank_open_data', 'NG:NY.GDP.MKTP.CD:2023'), true);
  const again = ingestPublicObservation({
    providerId: 'world_bank_open_data',
    kind: 'gdp',
    sourceId: 'world_bank_open_data',
    sourceRecordId: 'NG:NY.GDP.MKTP.CD:2023',
    publisher: 'World Bank',
    retrievedAt: '2026-09-07T00:00:00.000Z',
    licenseType: 'CC-BY-4.0',
    usageRights: 'attribution required',
  });
  assert.equal('duplicate' in again && again.duplicate === true, true);
});

test('entity resolution does not merge solely by similar name', () => {
  const result = resolveEntitiesByNameOnly('Acme Logistics', 'Acme Logistics');
  assert.equal(result.merged, false);
  assert.equal(result.similar, true);
});

test('bankruptcy status requires authoritative evidence', () => {
  const denied = declareBankruptcy({ authoritativeSource: false });
  assert.equal(denied.allowed, false);
  assert.equal(denied.bankrupt, false);
  const distress = createDistressSignal(['ev1']);
  assert.equal('stance' in distress && distress.stance === 'forecast', true);
  if ('bankruptClaim' in distress) assert.equal(distress.bankruptClaim, false);
});

test('historical similarity remains a scenario, not certainty', () => {
  assert.equal(historicalSimilarityIsDestiny(), false);
  const report = runBusinessTimeMachine({
    query: {
      question: 'Compare similar failure patterns',
      window: { start: '2008-01-01', end: '2009-12-31' },
    },
    evidence: [{ evidenceId: 'ev1', summary: 'Public recession series', sourceId: 'world_bank_open_data' }],
  });
  assert.equal('destiny' in report && report.destiny === false, true);
  assert.equal('stance' in report && report.stance === 'hypothesized', true);
});

test('foresight requires evidence/confidence', () => {
  const denied = forecastRequiresEvidence({ evidenceRefs: [] });
  assert.equal(denied.allowed, false);
});

test('learning cannot alter agent authority', () => {
  assert.equal(learningMayMutateAgentAuthority(), false);
  const lesson = learningFromAcceptedEvent({
    eventId: 'evt1',
    sourceId: 'world_bank_open_data',
    summary: 'GDP observation accepted',
  });
  assert.equal('mutatesAuthority' in lesson && lesson.mutatesAuthority === false, true);
});

test('future trillion-event capacity remains DESIGN, not LIVE', () => {
  assert.equal(trillionEventCapacityIsLive(), false);
  assert.equal(trillionEventCapacityStatus().status, 'DESIGNED');
  assert.equal(ledgerPersistsToHostedDatabase(), false);
});

test('service_role is not used; L4 disabled; Guardian deploy denied; unrestricted writes denied', () => {
  assert.equal(sourcesUseServiceRole(), false);
  assert.equal(boundedAutonomyEnabled(), false);
  assert.equal(agentDebuggerCanDeploy(), false);
  assert.equal(publishingWritesEnabled(), false);
  assert.equal(evaluateTenantActivation().tenantPersistence, 'blocked');
  assert.equal(worldBankAdapterCapabilityStatus(), 'CONFIGURED');
  assert.equal(typeof recordWorldBankValidatedRetrieval, 'function');
});

console.log('All Phase 2I-D historical intelligence unit cases passed.');
