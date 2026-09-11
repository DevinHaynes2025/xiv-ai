import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FilesystemKnowledgeSnapshotStore, PersistentOfflineKnowledgeIndex } from './persistent-offline-knowledge-index';
import { EmbeddingAdapterRegistry } from './embedding-adapter-registry';
import { DeviceSyncConflictJournal } from './device-sync-conflict-journal';
import { FilesystemDeviceSyncJournalStore } from './device-sync-conflict-disk-store';

const now = '2026-09-11T04:00:00.000Z';
const tenantId = 'tenant-alpha';
const approved = {
  knowledgeId: 'k1', tenantId, title: 'Warehouse bottleneck case',
  content: 'Queue growth at receiving caused downstream picking delays.',
  sourceRef: 'case-study:warehouse-001', evidenceRefs: ['evidence:warehouse-001'],
  classification: 'INTERNAL' as const, approved: true, approvedBy: 'reviewer-1', approvedAt: '2026-09-11T03:50:00.000Z',
};

const root = await mkdtemp(join(tmpdir(), 'xiv-12d63-'));
try {
  const index = new PersistentOfflineKnowledgeIndex();
  index.index(approved);
  assert.equal(index.count(tenantId), 1);
  assert.equal(index.query(tenantId, 'receiving delays').length, 1);
  assert.throws(() => index.index({ ...approved, knowledgeId: 'secret', classification: 'TOP_SECRET' }), /TOP_SECRET/);
  assert.throws(() => index.index({ ...approved, knowledgeId: 'unapproved', approved: false }), /approval receipt/);

  const snapshot = index.createSnapshot(tenantId, now);
  const store = new FilesystemKnowledgeSnapshotStore(join(root, 'knowledge'));
  const path = await store.write(snapshot);
  const loaded = await store.read(tenantId);
  const restarted = new PersistentOfflineKnowledgeIndex();
  const restore = restarted.restoreSnapshot(loaded);
  assert.equal(restore.integrityVerified, true);
  assert.equal(restore.restoredRecords, 1);
  assert.equal(restarted.query(tenantId, 'warehouse picking').length, 1);

  const tampered = JSON.parse(await readFile(path, 'utf8'));
  tampered.records[0].content = 'tampered content';
  await writeFile(path, JSON.stringify(tampered), 'utf8');
  await assert.rejects(() => store.read(tenantId), /integrity verification failed/);

  const adapters = new EmbeddingAdapterRegistry();
  adapters.register({ adapterId: 'candidate', engineName: 'local-engine', modelName: 'candidate-model', state: 'TESTED', execution: 'LOCAL', dimensions: 384, evidenceRefs: ['test:adapter-candidate'] });
  assert.equal(adapters.resolve('INTERNAL', 'candidate', now).strategy, 'LEXICAL_FALLBACK');
  adapters.register({ adapterId: 'verified-local', engineName: 'local-engine', modelName: 'verified-model', state: 'VERIFIED', execution: 'LOCAL', dimensions: 768, verifiedAt: '2026-09-11T03:00:00.000Z', expiresAt: '2026-09-12T03:00:00.000Z', evidenceRefs: ['receipt:embedding-1'] });
  assert.equal(adapters.resolve('INTERNAL', 'verified-local', now).strategy, 'VERIFIED_LOCAL_EMBEDDING');
  assert.equal(adapters.resolve('TOP_SECRET', 'verified-local', now).strategy, 'BLOCKED_TOP_SECRET');
  assert.equal(adapters.measuredVerifiedLocalCount(now), 1);

  const journal = new DeviceSyncConflictJournal();
  journal.append({ eventId: 'attempt-1', tenantId, userId: 'u1', deviceId: 'd1', platform: 'WINDOWS', itemId: 'task-1', action: 'SYNC_ATTEMPT', classification: 'INTERNAL', baseVersion: 1, localVersion: 2, remoteVersion: 1, createdAt: now, evidenceRefs: ['receipt:device-1'] });
  const localOnly = journal.evaluateAndRecord({ eventId: 'reconcile-local', tenantId, userId: 'u1', deviceId: 'd1', platform: 'WINDOWS', itemId: 'task-1', classification: 'INTERNAL', baseVersion: 1, localVersion: 2, remoteVersion: 1, localHash: 'local-v2', remoteHash: 'base-v1', createdAt: now, evidenceRefs: ['receipt:device-1'] });
  assert.equal(localOnly.state, 'PUSH_LOCAL_PENDING');
  assert.equal(localOnly.preserveLocalOfflineEdit, true);

  const conflict = journal.evaluateAndRecord({ eventId: 'reconcile-conflict', tenantId, userId: 'u1', deviceId: 'd1', platform: 'WINDOWS', itemId: 'task-2', classification: 'INTERNAL', baseVersion: 2, localVersion: 3, remoteVersion: 4, localHash: 'local-v3', remoteHash: 'remote-v4', createdAt: now, evidenceRefs: ['receipt:device-1'] });
  assert.equal(conflict.state, 'CONFLICT_PRESERVE_BOTH');
  assert.equal(conflict.requiresHumanReview, true);
  assert.equal(conflict.preserveLocalOfflineEdit, true);

  const identical = journal.evaluateAndRecord({ eventId: 'reconcile-identical', tenantId, userId: 'u1', deviceId: 'd1', platform: 'WINDOWS', itemId: 'task-3', classification: 'INTERNAL', baseVersion: 1, localVersion: 2, remoteVersion: 2, localHash: 'same-v2', remoteHash: 'same-v2', createdAt: now, evidenceRefs: ['receipt:device-1'] });
  assert.equal(identical.state, 'RECONCILED_IDENTICAL');
  journal.append({ eventId: 'success-1', tenantId, userId: 'u1', deviceId: 'd1', platform: 'WINDOWS', itemId: 'task-1', action: 'SYNC_SUCCESS', classification: 'INTERNAL', baseVersion: 1, localVersion: 2, remoteVersion: 2, createdAt: now, evidenceRefs: ['receipt:device-1'] });
  assert.equal(journal.verifyIntegrity(), true);
  assert.throws(() => journal.append({ eventId: 'other-tenant', tenantId: 'tenant-beta', userId: 'u2', deviceId: 'd2', platform: 'WINDOWS', itemId: 'task-x', action: 'SYNC_ATTEMPT', classification: 'INTERNAL', baseVersion: 0, localVersion: 1, remoteVersion: 0, createdAt: now, evidenceRefs: ['receipt:device-2'] }), /tenant scoped/);

  const syncStore = new FilesystemDeviceSyncJournalStore(join(root, 'sync'));
  for (const event of journal.list(tenantId)) await syncStore.append(event);
  const diskReload = await syncStore.load(tenantId);
  assert.equal(diskReload.receipt.integrityVerified, true);
  assert.equal(diskReload.receipt.restoredEvents, journal.list(tenantId).length);
  assert.equal(diskReload.journal.verifyIntegrity(), true);

  const metrics = diskReload.journal.buildPlatformMetrics('WINDOWS', now);
  assert.equal(metrics.attempts, 1);
  assert.equal(metrics.successes, 1);
  assert.equal(metrics.conflicts, 1);
  assert.equal(metrics.platformSupportClaim, 'NOT_INFERRED_FROM_SYNC_STATS');

  assert.throws(() => journal.append({ eventId: 'secret-sync', tenantId, userId: 'u1', deviceId: 'd1', platform: 'WINDOWS', itemId: 'secret', action: 'SYNC_ATTEMPT', classification: 'TOP_SECRET', baseVersion: 0, localVersion: 1, remoteVersion: 0, createdAt: now, evidenceRefs: ['receipt:device-1'] }), /TOP_SECRET/);
  console.log('12D-63 persistent RAG/embedding/sync conflict contracts: OK');
} finally {
  await rm(root, { recursive: true, force: true });
}
