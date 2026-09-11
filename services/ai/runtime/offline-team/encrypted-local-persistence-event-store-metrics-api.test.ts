import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EncryptedLocalEventStore } from './encrypted-local-event-store';
import { JsonlEncryptedEventPersistence } from './local-event-store-disk';
import { OfflineReplayRecovery } from './offline-replay-recovery';
import { ExecutiveMetricsApi } from './executive-metrics-api';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const hash = (value: string) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return `test-${(h >>> 0).toString(16)}`;
};
const crypto = {
  hash,
  seal: (plaintext: string, context: { tenantId: string; streamId: string; keyId: string }) => `sealed:${hash(`${context.tenantId}|${context.streamId}|${context.keyId}|${plaintext}`)}`,
};

const store = new EncryptedLocalEventStore(crypto);
const first = store.append({ eventId: 'e1', tenantId: 'xiv', streamId: 'ops', kind: 'USAGE', occurredAt: '2026-09-11T01:00:00Z', classification: 'INTERNAL', keyId: 'local-k1', payload: { type: 'VIEW', actorHash: 'actor:1' } });
const second = store.append({ eventId: 'e2', tenantId: 'xiv', streamId: 'ops', kind: 'BOOKKEEPING', occurredAt: '2026-09-11T01:01:00Z', classification: 'CONFIDENTIAL', keyId: 'local-k1', payload: { amountCents: 5000, approved: true }, evidenceRefs: ['receipt:invoice-1'] });
store.append({ eventId: 'e3', tenantId: 'xiv', streamId: 'ops', kind: 'LEARNING', occurredAt: '2026-09-11T01:02:00Z', classification: 'TOP_SECRET', keyId: 'local-k2', payload: { lesson: 'restricted local-only material' }, evidenceRefs: ['receipt:lesson-1'] });
assert(store.verifyChain('xiv', 'ops'), 'append-only event chain should verify');
assert(store.readStream('other', 'ops').length === 0, 'cross-tenant stream read must not leak events');

let unverifiedReplicationRejected = false;
try { store.exportForReplication('xiv', { adapterId: 'future-cloud', status: 'TARGET', approved: true }); } catch { unverifiedReplicationRejected = true; }
assert(unverifiedReplicationRejected, 'target-only vendor must not receive replicated events');
const exportable = store.exportForReplication('xiv', { adapterId: 'verified-test', status: 'VERIFIED_PARTNER', approved: true });
assert(exportable.length === 2, 'TOP_SECRET event must remain local-only');
assert(exportable.every(row => row.classification !== 'TOP_SECRET'), 'TOP_SECRET must be excluded from replication');

const root = mkdtempSync(join(tmpdir(), 'xiv-12d61-'));
try {
  const disk = new JsonlEncryptedEventPersistence(root);
  disk.appendEnvelope(first);
  disk.appendEnvelope(second);
  const persisted = disk.readEnvelopes('xiv', 'ops');
  assert(persisted.length === 2, 'encrypted envelopes should persist and reload');
  assert(disk.health('xiv', 'ops').bytes > 0, 'disk persistence should report measurable bytes');
  let traversalRejected = false;
  try { disk.streamPath('../other', 'ops'); } catch { traversalRejected = true; }
  assert(traversalRejected, 'path traversal must be rejected');
} finally {
  rmSync(root, { recursive: true, force: true });
}

const recovery = new OfflineReplayRecovery(store);
const receipt = recovery.inspect({ tenantId: 'xiv', streamId: 'ops', lastAppliedSequence: 1, lastEnvelopeHash: first.envelopeHash, checkpointedAt: '2026-09-11T01:03:00Z' });
assert(receipt.ready, 'matching checkpoint should be replay-ready');
assert(receipt.eventsAvailable === 2, 'recovery should report unapplied durable events');

const api = new ExecutiveMetricsApi(tenantId => ({
  tenantId,
  usage: { views: 11, uniqueUsers: 3, sessions: 4, featureUses: 7 },
  pendingBookkeepingApprovals: 1,
  openTasks: 5,
  blockedTasks: 1,
  unresolvedDissent: 1,
  runtime: { tenantId, ready: true, verifiedStores: 1, verifiedServices: 1, blockers: [] },
  recovery: receipt,
  generatedAt: '2026-09-11T01:04:00Z',
}));
assert(api.handle({ tenantId: 'xiv', method: 'GET', path: '/metrics', scopes: ['xiv.metrics.read'] }).status === 200, 'authorized read-only metrics request should succeed');
assert(api.handle({ tenantId: 'xiv', method: 'POST', path: '/metrics', scopes: ['xiv.metrics.read'] }).status === 405, 'metrics API must reject writes');
assert(api.handle({ tenantId: 'xiv', method: 'GET', path: '/metrics', scopes: [] }).status === 403, 'metrics API must require read scope');

console.log('12D-61 encrypted local persistence/event store/metrics API contracts: OK');
