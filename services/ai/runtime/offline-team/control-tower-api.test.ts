import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  buildSnapshotServer, SNAPSHOT_API_POLICY, SNAPSHOT_API_GUARDRAILS, SNAPSHOT_API_ROUTES,
  type QueueSummaryView, type StorageFeedView,
} from './control-tower-api';
import { CONTROL_TOWER_GUARDRAILS } from './control-tower-evidence';

const TENANT = 'tenant-a';
const RECEIPT = 'operator:auth:12d-115:surface-review';

const queueSummary = (over: Partial<QueueSummaryView> = {}): QueueSummaryView => ({
  kind: 'QUEUE_SUMMARY',
  tenantId: TENANT,
  generatedAtMs: 1_700_000_000_000,
  states: { READY: 3, LEASED: 1, AWAITING_REVIEW: 1, DONE: 4, FAILED: 1 },
  realUserStories: 9,
  capacityFixtures: 1,
  ...over,
});
const controlTowerPacket = () => ({
  kind: 'CONTROL_TOWER_EVIDENCE' as const,
  tenantId: TENANT,
  generatedAtMs: 1_700_000_000_000,
  pathway: { packetsConsidered: 0, uniqueStories: 0, eligibleNow: 0, blocked: 0, topBlockReasons: [], humanActionsRequired: [] },
  devices: {
    assessmentsConsidered: 0,
    byState: { ENROLLED_NOT_ACTIVE: 0, ELIGIBLE_FOR_LOCAL_TASKS: 0, PAUSED: 0, REVOKED: 0, EXPIRED: 0, UNVERIFIED_COMPATIBILITY: 0 },
    observedLocalWorkers: 0,
    workersStartedByThisSurface: 0,
  },
  evidenceRefs: [],
  guardrails: CONTROL_TOWER_GUARDRAILS,
});
const storageFeed = (over: Partial<StorageFeedView> = {}): StorageFeedView => ({
  kind: 'STORAGE_FEED_SNAPSHOT',
  tenantId: TENANT,
  generatedAtMs: 1_700_000_000_000,
  artifactsByTier: { LOCAL: 12, OFFLINE_CARRIER: 0, CLOUD: 2 },
  exportableOffLocalPlane: 2,
  ...over,
});

const makeProviders = (over: Record<string, unknown> = {}) => ({
  queueSummary: () => queueSummary(),
  controlTowerPacket: () => controlTowerPacket(),
  storageFeedSnapshot: () => storageFeed(),
  ...over,
});
const build = (over: Record<string, unknown> = {}) => buildSnapshotServer({
  tenantId: TENANT,
  operatorAuthorizationRef: RECEIPT,
  providers: makeProviders(),
  clock: () => 1_700_000_005_000,
  ...over,
});
const get = (server: ReturnType<typeof build>, path: string, remoteAddress = '127.0.0.1') =>
  server.handle({ method: 'GET', path, remoteAddress });

const HONEST_FLAGS: Readonly<Record<string, unknown>> = {
  humanDecision: 'REQUIRED',
  liveAgentCount: null,
  modelCalls: 0,
  remoteCalls: 0,
  realEntitiesCreated: 0,
  agentsStarted: 0,
  learningPromoted: false,
  generatedByModel: false,
};
const assertHonestFlags = (body: Record<string, unknown>) => {
  for (const [flag, value] of Object.entries(HONEST_FLAGS)) assert.deepEqual(body[flag], value);
  assert.equal(body.liveAgentCount, null);
};

test('construction requires an explicit operator authorization receipt ref', () => {
  const attempt = (over: unknown) => () => build({ operatorAuthorizationRef: over } as never);
  assert.throws(attempt(''), /operator authorization receipt ref required/);
  assert.throws(attempt('   '), /operator authorization receipt ref required/);
  assert.throws(attempt('short'), /receipt ref must be/);
  assert.throws(attempt('x'.repeat(SNAPSHOT_API_POLICY.maxOperatorRefChars + 1)), /receipt ref must be/);
  assert.throws(attempt('none'), /not a bypass placeholder/);
  assert.throws(attempt('operator auth with spaces'), /must not contain whitespace/);
  assert.throws(() => buildSnapshotServer({ tenantId: TENANT, operatorAuthorizationRef: RECEIPT } as never), /read-only snapshot providers required/);
  assert.throws(() => build({ tenantId: 'tenant id!' }), /tenant identity required/);
  assert.throws(() => build({ providers: { queueSummary: () => queueSummary() } as never }), /exactly the three read-only providers/);
  assert.throws(() => build({ providers: { ...makeProviders(), queueSummary: 'not-a-function' } as never }), /must be a read-only function/);
  const server = build();
  assert.equal(server.hasOperatorAuthorization, true);
  assert.equal(server.operatorAuthorizationReceiptRef, RECEIPT);
});

test('loopback-only: a non-loopback or missing remote address is refused before any provider is consulted', () => {
  let providerCalls = 0;
  const server = build({ providers: makeProviders({ queueSummary: () => { providerCalls += 1; return queueSummary(); } }) });
  for (const remote of ['192.168.1.5', '10.0.0.2', '::ffff:192.168.1.5', '0.0.0.0', '']) {
    const res = server.handle({ method: 'GET', path: '/control-tower/queue-summary', remoteAddress: remote });
    assert.equal(res.status, 403);
    assert.equal((res.body.error as Record<string, unknown>).code, 'loopback_only');
    assert.equal(res.body.liveAgentCount, null);
    assert.equal(res.body.humanDecision, 'REQUIRED');
  }
  assert.equal(providerCalls, 0);
  assert.equal(server.handle({ method: 'GET', path: '/control-tower/queue-summary', remoteAddress: undefined as never }).status, 403);
  for (const remote of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) {
    assert.equal(get(server, '/control-tower/queue-summary', remote).status, 200);
  }
});

test('the surface is off by default and can never mount itself', () => {
  assert.equal(Object.isFrozen(SNAPSHOT_API_POLICY), true);
  assert.equal(Object.isFrozen(SNAPSHOT_API_GUARDRAILS), true);
  assert.equal(SNAPSHOT_API_POLICY.autoMounted, false);
  assert.equal(SNAPSHOT_API_POLICY.mountedByDefault, false);
  assert.equal(SNAPSHOT_API_POLICY.writeRoutes, 0);
  const server = build();
  assert.equal(server.mounted, false);
  assert.equal(server.canMount, false);
  assert.equal(server.externalInterfaceBound, false);
  assert.equal(server.bindHost, '127.0.0.1');
  assert.equal(SNAPSHOT_API_GUARDRAILS.canMountItself, false);
  assert.equal(SNAPSHOT_API_GUARDRAILS.autoMounted, false);
  assert.throws(() => { (SNAPSHOT_API_GUARDRAILS as Record<string, unknown>).readOnly = false; }, TypeError);
});

test('the queue-summary route passes realUserStories through and serves only provider-derived JSON', () => {
  const server = build();
  const res = get(server, '/control-tower/queue-summary');
  assert.equal(res.status, 200);
  const q = res.body.data as Record<string, unknown>;
  assert.equal((q.states as Record<string, number>).READY, 3);
  assert.equal(q.realUserStories, 9);
  assert.equal(q.capacityFixtures, 1);
  assert.equal(res.body.realUserStories, 9);
  assert.equal(res.body.kind, 'CONTROL_TOWER_SNAPSHOT_RESPONSE');
  assert.equal(res.body.tenantId, TENANT);
  assert.equal(res.body.generatedAtMs, 1_700_000_005_000);
  assertHonestFlags(res.body);
});

test('evidence, storage-feed, and aggregate routes serve provider JSON with honest flags in every payload', () => {
  const server = build();
  for (const path of SNAPSHOT_API_ROUTES) {
    const res = get(server, path);
    assert.equal(res.status, 200);
    assert.equal(res.body.kind, 'CONTROL_TOWER_SNAPSHOT_RESPONSE');
    assert.equal((res.body.guardrails as Record<string, unknown>).loopbackOnly, true);
    assertHonestFlags(res.body);
  }
  const aggregate = get(server, '/control-tower/snapshot').body.data as Record<string, unknown>;
  assert.equal((aggregate.controlTower as Record<string, unknown>).kind, 'CONTROL_TOWER_EVIDENCE');
  assert.equal((aggregate.storageFeed as Record<string, unknown>).kind, 'STORAGE_FEED_SNAPSHOT');
  assert.equal((aggregate.queue as Record<string, unknown>).kind, 'QUEUE_SUMMARY');
});

test('the route contract is GET-only and 404s everything it does not declare', () => {
  const server = build();
  const post = server.handle({ method: 'POST', path: '/control-tower/queue-summary', remoteAddress: '127.0.0.1' });
  assert.equal(post.status, 405);
  assert.equal((post.body.error as Record<string, unknown>).code, 'method_not_allowed');
  assert.equal(post.body.humanDecision, 'REQUIRED');
  const missing = get(server, '/control-tower/write-queue');
  assert.equal(missing.status, 404);
  assert.equal((missing.body.error as Record<string, unknown>).code, 'not_found');
  assert.equal(get(server, '/control-tower/queue-summary/extra').status, 404);
  const malformed = server.handle(undefined as never);
  assert.equal(malformed.status, 400);
});

test('bounded providers: oversized, inconsistent, cross-tenant, and field-inventing results fail closed', () => {
  const attempt = (provider: Record<string, unknown>, path = '/control-tower/queue-summary') =>
    get(build({ providers: makeProviders(provider) }), path);
  assert.equal(attempt({ queueSummary: () => queueSummary({ states: { READY: SNAPSHOT_API_POLICY.maxQueueRowsInView + 1, LEASED: 0, AWAITING_REVIEW: 0, DONE: 0, FAILED: 0 } }) }).status, 503);
  assert.equal(attempt({ queueSummary: () => queueSummary({ realUserStories: 100 }) }).status, 503);
  assert.equal(attempt({ queueSummary: () => queueSummary({ tenantId: 'tenant-b' }) }).status, 503);
  assert.equal(attempt({ queueSummary: () => ({ ...queueSummary(), liveAgentCount: 5 }) }).status, 503);
  assert.equal(attempt({ queueSummary: () => queueSummary({ realUserStories: -1 }) }).status, 503);
  assert.equal(attempt({ controlTowerPacket: () => ({ ...controlTowerPacket(), guardrails: { ...CONTROL_TOWER_GUARDRAILS, humanDecision: 'AUTOMATIC' } }) }, '/control-tower/evidence').status, 503);
  assert.equal(attempt({ storageFeedSnapshot: () => storageFeed({ exportableOffLocalPlane: 3 }) }, '/control-tower/storage-feed').status, 503);
  assert.equal(attempt({ storageFeedSnapshot: () => storageFeed({ artifactsByTier: { LOCAL: SNAPSHOT_API_POLICY.maxArtifactsInView + 1, OFFLINE_CARRIER: 0, CLOUD: 0 } }) }, '/control-tower/storage-feed').status, 503);
});

test('regression (independent review): a fabricated control-tower packet is never served — exact-shape and consistency', () => {
  const attempt = (provider: Record<string, unknown>, path = '/control-tower/evidence') =>
    get(build({ providers: makeProviders(provider) }), path);
  // The exact live probe from the independent review: invented flags rode through as 200.
  const fabricated = {
    ...controlTowerPacket(),
    liveAgentCount: 5,
    realUserStories: 999,
    observedLocalWorkers: 4,
  };
  assert.equal(attempt({ controlTowerPacket: () => fabricated }).status, 503);
  assert.equal(attempt({ controlTowerPacket: () => fabricated }, '/control-tower/snapshot').status, 503);
  // Missing or renamed fields are equally refused.
  const { evidenceRefs: _dropped, ...missingField } = controlTowerPacket();
  assert.equal(attempt({ controlTowerPacket: () => missingField }).status, 503);
  assert.equal(attempt({ controlTowerPacket: () => ({ ...controlTowerPacket(), extra: true }) }).status, 503);
  // Internal inconsistencies the builder cannot produce.
  assert.equal(attempt({ controlTowerPacket: () => ({ ...controlTowerPacket(), pathway: { ...controlTowerPacket().pathway, eligibleNow: 2, blocked: 1, packetsConsidered: 2 } }) }).status, 503);
  assert.equal(attempt({ controlTowerPacket: () => ({ ...controlTowerPacket(), devices: { ...controlTowerPacket().devices, workersStartedByThisSurface: 1 } }) }).status, 503);
  assert.equal(attempt({ controlTowerPacket: () => ({ ...controlTowerPacket(), devices: { ...controlTowerPacket().devices, byState: { ...controlTowerPacket().devices.byState, PAUSED: 3 } } }) }).status, 503);
  assert.equal(attempt({ controlTowerPacket: () => ({ ...controlTowerPacket(), devices: { ...controlTowerPacket().devices, observedLocalWorkers: 1 } }) }).status, 503);
  assert.equal(attempt({ controlTowerPacket: () => ({ ...controlTowerPacket(), evidenceRefs: Array.from({ length: 9 }, (_, i) => `ref-${i}`) }) }).status, 503);
  // A well-formed packet still serves on both routes.
  assert.equal(attempt({ controlTowerPacket: () => controlTowerPacket() }).status, 200);
  assert.equal(attempt({ controlTowerPacket: () => controlTowerPacket() }, '/control-tower/snapshot').status, 200);
});

test('fail-closed on provider throw or malformed results, and error payloads keep the honest flags', () => {
  const attempt = (provider: Record<string, unknown>) => get(build({ providers: makeProviders(provider) }), '/control-tower/queue-summary');
  for (const broken of [
    { queueSummary: () => { throw new Error('disk offline'); } },
    { queueSummary: () => null },
    { queueSummary: () => 'summary' },
    { queueSummary: () => ({}) },
  ]) {
    const res = attempt(broken);
    assert.equal(res.status, 503);
    assert.equal((res.body.error as Record<string, unknown>).code, 'provider_invalid');
    assert.equal((res.body.error as Record<string, unknown>).message, 'snapshot provider failed validation; nothing was served');
    assert.equal(res.body.realUserStories, null);
    assertHonestFlags(res.body);
  }
  const okElsewhere = get(build({ providers: makeProviders({ queueSummary: () => { throw new Error('x'); } }) }), '/control-tower/evidence');
  assert.equal(okElsewhere.status, 200);
});