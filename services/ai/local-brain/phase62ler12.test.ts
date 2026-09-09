/**
 * 62L-ER12 — Live Data Connector Gate denial + honesty tests.
 *
 * Script: npm run test:62ler12
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ER12_AGENT_BOUNDS,
  ER12_DB_CANDIDATES_STATUS,
  ER12_LOCKS,
  ER12_MAY,
  ER12_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  LIVE_CONNECTOR_BOUNDARY,
  LIVE_CONNECTOR_CHECK_FIELDS,
  LIVE_CONNECTOR_WORKFLOW,
  LIVE_DATA_CONNECTOR_GATE_CYCLE,
  LIVE_DATA_STATES,
  LIVE_FALLBACK_TYPES,
  LIVE_FEED_DOMAINS,
  LIVE_GATE_DECISIONS,
  NEXT_PHASE_TITLE,
  VOLATILE_DECAY_RULE,
  assertEr12LocksIntact,
  computeLiveFreshness,
  er12SoftWireSnapshot,
  mayDescribeAsRealtime,
  type Er12Actor,
} from './live-data-connector-gate-types.ts';

import {
  attemptCredentialSharing,
  attemptCrossTenantDataLeakage,
  attemptDescribeAsRealtimeWithoutLiveVerified,
  attemptPermanentizeVolatileWithoutTimestamp,
  attemptRecommendAsAct,
  attemptScopeExpansion,
  attemptSilentStaleAsLive,
  attemptUnauthorizedScrapingFallback,
  bootstrapLiveDataConnectorGate,
  createLiveConnectorCheck,
  decayVolatileObservation,
  evaluateLiveDataRequest,
  exampleLiveVerifiedConnector,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnEr12EvidenceToHomeBase,
  runLiveDataConnectorGateCycle,
} from './live-data-connector-gate-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er12Actor = {
  kind: 'live_data_connector_gate',
  id: 'ldcg-1',
  orgId: 'org-er12',
  tenantId: 'ten-er12',
  universeId: 'uni-er12',
  permissions: ['draft'],
};

const human: Er12Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er12',
  tenantId: 'ten-er12',
  universeId: 'uni-er12',
  permissions: ['approve_consequential'],
};

test('SoT label ER12 / #162; Live Data Connector Gate; next ER13 Online Brain Index', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER12');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Live Data Connector Gate/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER13/);
  assert.match(NEXT_PHASE_TITLE, /Online Brain Index/);
  assert.match(ER_LAYER_TITLE, /Real API Data Fabric/);
});

test('honesty locks: L4 false; no silent stale-as-live; no scraping; DB NOT_APPLIED', () => {
  assert.equal(assertEr12LocksIntact(), true);
  assert.equal(ER12_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER12_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER12_LOCKS.SILENT_STALE_AS_LIVE, false);
  assert.equal(ER12_LOCKS.UNAUTHORIZED_SCRAPING_FALLBACK, false);
  assert.equal(ER12_LOCKS.FALLBACK_WITHOUT_DISCLOSURE, false);
  assert.equal(ER12_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(
    LIVE_CONNECTOR_BOUNDARY.realtimeIsEvidenceStateNotMarketingLabel,
    true,
  );
  assert.equal(ER12_AGENT_BOUNDS.maySilentlySubstituteStaleAsLive, false);
  assert.equal(
    VOLATILE_DECAY_RULE.mayBecomePermanentHistoricalTruthWithoutTimestamp,
    false,
  );
});

test('states + check fields + workflow + feed domains + decisions encoded', () => {
  assert.deepEqual([...LIVE_DATA_STATES], [
    'LIVE_VERIFIED',
    'NEAR_REAL_TIME',
    'DELAYED',
    'HISTORICAL',
    'STALE',
    'SIMULATED',
    'WAITING_DATA',
    'UNAVAILABLE',
    'UNKNOWN',
  ]);
  assert.equal(LIVE_CONNECTOR_CHECK_FIELDS.length, 15);
  assert.ok(LIVE_CONNECTOR_CHECK_FIELDS.includes('connectionId'));
  assert.ok(LIVE_CONNECTOR_CHECK_FIELDS.includes('providerTimestamp'));
  assert.ok(LIVE_CONNECTOR_CHECK_FIELDS.includes('dataFreshness'));
  assert.equal(LIVE_CONNECTOR_WORKFLOW.length, 8);
  assert.deepEqual([...LIVE_GATE_DECISIONS], [
    'ALLOW',
    'WAIT',
    'FALLBACK',
    'DENY',
  ]);
  assert.deepEqual([...LIVE_FALLBACK_TYPES], ['HISTORICAL', 'SIMULATED']);
  assert.equal(LIVE_FEED_DOMAINS.length, 10);
  assert.ok(LIVE_FEED_DOMAINS.includes('weather'));
  assert.ok(LIVE_FEED_DOMAINS.includes('public_mobility'));
  assert.ok(ER12_MAY.includes('allow_only_when_live_verified_and_fresh'));
  assert.ok(
    ER12_MUST_NOT.includes('silently_substitute_stale_or_historical_as_live'),
  );
});

test('freshness: 1m expected + 25m age → STALE; LIVE_VERIFIED allows realtime label', () => {
  const now = Date.parse('2026-09-09T21:00:00.000Z');
  assert.equal(
    computeLiveFreshness({
      lastSuccessfulResponse: new Date(now - 30_000).toISOString(),
      expectedRefreshIntervalMs: 60_000,
      nowMs: now,
    }),
    'LIVE_VERIFIED',
  );
  assert.equal(
    computeLiveFreshness({
      lastSuccessfulResponse: new Date(now - 25 * 60_000).toISOString(),
      expectedRefreshIntervalMs: 60_000,
      nowMs: now,
    }),
    'STALE',
  );
  assert.equal(mayDescribeAsRealtime('LIVE_VERIFIED'), true);
  assert.equal(mayDescribeAsRealtime('STALE'), false);
  assert.equal(attemptDescribeAsRealtimeWithoutLiveVerified().state, 'DENIED');

  const { fresh, stale } = exampleLiveVerifiedConnector(agent, now);
  assert.equal(fresh.dataFreshness, 'LIVE_VERIFIED');
  assert.equal(stale.dataFreshness, 'STALE');
});

test('workflow ALLOW/WAIT/FALLBACK/DENY; fallback discloses liveUnavailable', () => {
  const now = Date.parse('2026-09-09T21:00:00.000Z');
  const { fresh, stale } = exampleLiveVerifiedConnector(agent, now);

  const allow = evaluateLiveDataRequest({
    actor: agent,
    connector: fresh,
    requiredScopes: ['read:live_forecast'],
    nowMs: now,
  });
  assert.ok(!('denied' in allow));
  assert.equal(allow.decision, 'ALLOW');
  assert.equal(allow.liveDataState, 'LIVE_VERIFIED');
  assert.equal(allow.mayDescribeAsRealtime, true);
  assert.equal(allow.liveUnavailable, false);
  assert.equal(allow.returnedStaleAsLive, false);

  const wait = evaluateLiveDataRequest({
    actor: agent,
    connector: createLiveConnectorCheck({
      actor: agent,
      connectionId: 'c-near',
      provider: 'P',
      feedDomain: 'weather',
      scopes: ['read:live_forecast'],
      lastSuccessfulResponse: new Date(now - 90_000).toISOString(),
      expectedRefreshIntervalMs: 60_000,
      nowMs: now,
    }),
    requiredScopes: ['read:live_forecast'],
    nowMs: now,
  });
  assert.ok(!('denied' in wait));
  assert.equal(wait.decision, 'WAIT');
  assert.equal(wait.liveUnavailable, true);
  assert.equal(wait.mayDescribeAsRealtime, false);

  const fallback = evaluateLiveDataRequest({
    actor: agent,
    connector: stale,
    requiredScopes: ['read:live_forecast'],
    taskPermitsHistoricalFallback: true,
    preferredFallbackType: 'HISTORICAL',
    nowMs: now,
  });
  assert.ok(!('denied' in fallback));
  assert.equal(fallback.decision, 'FALLBACK');
  assert.equal(fallback.liveUnavailable, true);
  assert.equal(fallback.fallbackType, 'HISTORICAL');
  assert.equal(fallback.disclosure.liveUnavailable, true);
  assert.equal(fallback.disclosure.fallbackType, 'HISTORICAL');
  assert.equal(fallback.mayDescribeAsRealtime, false);

  const denyNoFallback = evaluateLiveDataRequest({
    actor: agent,
    connector: stale,
    requiredScopes: ['read:live_forecast'],
    nowMs: now,
  });
  assert.equal(denyNoFallback.state, 'WAITING_DATA');
  assert.equal(denyNoFallback.decision, 'WAIT');

  assert.equal(
    evaluateLiveDataRequest({
      actor: agent,
      connector: stale,
      requiredScopes: ['read:live_forecast'],
      attemptSilentStaleAsLive: true,
      nowMs: now,
    }).state,
    'DENIED',
  );
  assert.equal(attemptSilentStaleAsLive().state, 'DENIED');
});

test('security denies: scraping, scope, credentials, cross-tenant; volatile decay', () => {
  const now = Date.parse('2026-09-09T21:00:00.000Z');
  const { fresh } = exampleLiveVerifiedConnector(agent, now);

  assert.equal(attemptUnauthorizedScrapingFallback().state, 'DENIED');
  assert.equal(attemptScopeExpansion().state, 'DENIED');
  assert.equal(attemptCredentialSharing().state, 'DENIED');
  assert.equal(attemptCrossTenantDataLeakage().state, 'DENIED');
  assert.equal(attemptPermanentizeVolatileWithoutTimestamp().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');

  assert.equal(
    evaluateLiveDataRequest({
      actor: agent,
      connector: fresh,
      requiredScopes: ['read:live_forecast', 'admin:expand'],
      nowMs: now,
    }).state,
    'DENIED',
  );

  const otherTenant: Er12Actor = {
    ...agent,
    tenantId: 'ten-other',
  };
  assert.equal(
    evaluateLiveDataRequest({
      actor: otherTenant,
      connector: fresh,
      requiredScopes: ['read:live_forecast'],
      nowMs: now,
    }).state,
    'DENIED',
  );

  const decay = decayVolatileObservation({
    observation: {
      observationId: 'obs-1',
      connectionId: fresh.connectionId,
      feedDomain: 'public_mobility',
      valueSummary: 'congestion_high',
      providerTimestamp: new Date(now - 20 * 60_000).toISOString(),
      xivReceiptTimestamp: new Date(now - 20 * 60_000).toISOString(),
      context: 'segment=42',
      halfLifeMs: 5 * 60_000,
    },
    nowMs: now,
  });
  assert.ok(!('denied' in decay));
  assert.equal(decay.decayed, true);
  assert.equal(decay.retainedAsPermanentHistoricalTruth, false);

  assert.equal(
    decayVolatileObservation({
      observation: {
        observationId: 'obs-bad',
        connectionId: fresh.connectionId,
        feedDomain: 'public_mobility',
        valueSummary: 'congestion_high',
        providerTimestamp: new Date(now).toISOString(),
        xivReceiptTimestamp: new Date(now).toISOString(),
        context: 'segment=42',
        halfLifeMs: 5 * 60_000,
      },
      attemptPermanentizeWithoutTimestamp: true,
      nowMs: now,
    }).state,
    'DENIED',
  );
});

test('bootstrap + soft-wire + cycle; ER2/ER1 PRESENT; ER11–ER3/EQ14 WAITING_DATA', () => {
  const boot = bootstrapLiveDataConnectorGate(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.liveStates.length, 9);
  assert.equal(boot.checkFields.length, 15);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER13/);

  const soft = er12SoftWireSnapshot(repoRoot);
  assert.equal(soft.er2ApiTruthStateMachine.present, true);
  assert.equal(soft.er1RealApiConnectionRegistry.present, true);
  assert.equal(soft.eq16SoftwareWormholeRouter.present, true);
  assert.equal(soft.er11PublicGovernmentDataPack.present, false);
  assert.equal(soft.er3PublicDataSourceRegistry.present, false);
  assert.equal(soft.eq14NeuralPathwayArchitectureGraph.present, false);

  const { fresh } = exampleLiveVerifiedConnector(agent);
  const ev = returnEr12EvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    connector: fresh,
    summary: 'live gate advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.secretValuePresentInLogs, false);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runLiveDataConnectorGateCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, LIVE_DATA_CONNECTOR_GATE_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of LIVE_DATA_CONNECTOR_GATE_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const er2Hop = cycle.hops.find((h) => h.hop === 'er2_soft_wire');
  assert.ok(er2Hop);
  assert.equal(er2Hop.state, 'PASS');

  const er1Hop = cycle.hops.find((h) => h.hop === 'er1_soft_wire');
  assert.ok(er1Hop);
  assert.equal(er1Hop.state, 'PASS');

  const er11Hop = cycle.hops.find((h) => h.hop === 'er11_soft_wire');
  assert.ok(er11Hop);
  assert.equal(er11Hop.state, 'WAITING_DATA');

  const eq14Hop = cycle.hops.find((h) => h.hop === 'eq14_soft_wire');
  assert.ok(eq14Hop);
  assert.equal(eq14Hop.state, 'WAITING_DATA');

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.freshConnector.dataFreshness, 'LIVE_VERIFIED');
});
