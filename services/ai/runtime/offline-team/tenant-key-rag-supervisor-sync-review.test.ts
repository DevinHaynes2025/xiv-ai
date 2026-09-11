import { strict as assert } from 'node:assert';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assessTenantKeyRotation,
  type TenantKeyReceipt,
  type TenantKeyRotationPlan,
  type TenantKeyRotationReceipt,
} from './tenant-key-rotation';
import { summarizeRagRuntime } from './rag-runtime-supervisor';
import {
  buildDeviceSyncReviewConsole,
  createSyncConflictReviewItem,
  finalizeSyncConflictReview,
  recordAgentRecommendation,
  type DeviceVerificationReceipt,
  type SyncAttemptReceipt,
} from './device-sync-review-console';
import {
  appendSyncReviewJournal,
  readSyncReviewJournal,
  restoreLatestSyncReviews,
} from './device-sync-review-disk-store';

const source: TenantKeyReceipt = {
  tenantId: 'tenant-a',
  keyId: 'key-v1',
  version: 1,
  algorithm: 'AES-256-GCM',
  state: 'ACTIVE',
  createdAt: '2026-09-11T00:00:00Z',
  evidenceRefs: ['keygen:v1'],
  scope: 'ORDINARY_KNOWLEDGE',
};
const target: TenantKeyReceipt = {
  tenantId: 'tenant-a',
  keyId: 'key-v2',
  version: 2,
  algorithm: 'AES-256-GCM',
  state: 'STAGED',
  createdAt: '2026-09-11T00:10:00Z',
  evidenceRefs: ['keygen:v2'],
  scope: 'ORDINARY_KNOWLEDGE',
};
const plan: TenantKeyRotationPlan = {
  tenantId: 'tenant-a',
  fromKeyId: 'key-v1',
  fromVersion: 1,
  toKeyId: 'key-v2',
  toVersion: 2,
  scope: 'ORDINARY_KNOWLEDGE',
  requestedAt: '2026-09-11T00:20:00Z',
};
const failedRotation: TenantKeyRotationReceipt = {
  tenantId: 'tenant-a',
  fromKeyId: 'key-v1',
  fromVersion: 1,
  toKeyId: 'key-v2',
  toVersion: 2,
  scope: 'ORDINARY_KNOWLEDGE',
  startedAt: '2026-09-11T00:21:00Z',
  itemsAttempted: 10,
  itemsReencrypted: 9,
  failures: [{ itemId: 'doc-7', reason: 'AUTH_TAG_MISMATCH' }],
  evidenceRefs: ['rotation:run-1'],
};
const blocked = assessTenantKeyRotation(plan, source, target, failedRotation);
assert.equal(blocked.status, 'IN_PROGRESS');
assert.equal(blocked.mayRetireSourceKey, false);

const completeRotation: TenantKeyRotationReceipt = {
  ...failedRotation,
  itemsReencrypted: 10,
  failures: [],
  completedAt: '2026-09-11T00:30:00Z',
  evidenceRefs: ['rotation:run-2'],
};
const withoutHuman = assessTenantKeyRotation(plan, source, target, completeRotation, {
  approverType: 'AGENT',
  approverId: 'agent-key-reviewer',
  approvedAt: '2026-09-11T00:31:00Z',
  evidenceRefs: ['agent:recommendation'],
});
assert.equal(withoutHuman.status, 'COMPLETE');
assert.equal(withoutHuman.mayRetireSourceKey, false);

const withHuman = assessTenantKeyRotation(plan, source, target, completeRotation, {
  approverType: 'HUMAN',
  approverId: 'security-owner',
  approvedAt: '2026-09-11T00:32:00Z',
  evidenceRefs: ['approval:ticket-42'],
});
assert.equal(withHuman.mayRetireSourceKey, true);

const unverified = summarizeRagRuntime([]);
assert.equal(unverified.status, 'UNVERIFIED');
const healthy = summarizeRagRuntime([
  {
    observedAt: '2026-09-11T00:00:00Z', endpoint: 'http://127.0.0.1:43165/health', reachable: true,
    statusCode: 200, latencyMs: 20, queueDepth: 2, capacityUsed: 2, capacityTotal: 10, evidenceRefs: ['probe:1'],
  },
  {
    observedAt: '2026-09-11T00:01:00Z', endpoint: 'http://localhost:43165/health', reachable: true,
    statusCode: 200, latencyMs: 30, queueDepth: 1, capacityUsed: 3, capacityTotal: 10, evidenceRefs: ['probe:2'],
  },
]);
assert.equal(healthy.status, 'HEALTHY');
assert.equal(healthy.uptimeRatio, 1);
const offline = summarizeRagRuntime([
  {
    observedAt: '2026-09-11T00:02:00Z', endpoint: 'http://127.0.0.1:43165/health', reachable: false,
    evidenceRefs: ['probe:3'],
  },
]);
assert.equal(offline.status, 'OFFLINE');

const pending = createSyncConflictReviewItem({
  reviewId: 'review-1', tenantId: 'tenant-a', userId: 'user-1', conflictId: 'conflict-1', deviceId: 'device-1',
  platform: 'windows', classification: 'CONFIDENTIAL', localVersion: 3, remoteVersion: 4,
  createdAt: '2026-09-11T00:40:00Z', sanitizedSummary: 'Both sides changed the same governed record.',
  evidenceRefs: ['conflict:1'],
});
const recommended = recordAgentRecommendation(pending, 'APPROVED_MERGE');
assert.equal(recommended.decision, 'PENDING');
assert.throws(() => finalizeSyncConflictReview(recommended, 'APPROVED_MERGE', {
  reviewerType: 'AGENT', reviewerId: 'agent-1', reviewedAt: '2026-09-11T00:41:00Z', evidenceRefs: ['agent:1'],
}), /HUMAN_REVIEW_REQUIRED/);
const reviewed = finalizeSyncConflictReview(recommended, 'APPROVED_MERGE', {
  reviewerType: 'HUMAN', reviewerId: 'ops-owner', reviewedAt: '2026-09-11T00:42:00Z', evidenceRefs: ['approval:review-1'],
});
assert.equal(reviewed.decision, 'APPROVED_MERGE');

const topSecret = createSyncConflictReviewItem({
  reviewId: 'review-secret', tenantId: 'tenant-a', userId: 'user-1', conflictId: 'conflict-secret', deviceId: 'device-1',
  platform: 'windows', classification: 'TOP_SECRET', localVersion: 1, remoteVersion: 2,
  createdAt: '2026-09-11T00:43:00Z', sanitizedSummary: 'Restricted conflict; payload omitted.', evidenceRefs: ['conflict:secret'],
});
assert.equal(topSecret.decision, 'RESTRICTED_MANUAL');
assert.equal(finalizeSyncConflictReview(topSecret, 'APPROVED_REMOTE', {
  reviewerType: 'HUMAN', reviewerId: 'ops-owner', reviewedAt: '2026-09-11T00:44:00Z', evidenceRefs: ['approval:secret'],
}).decision, 'RESTRICTED_MANUAL');

const devices: DeviceVerificationReceipt[] = [
  { tenantId: 'tenant-a', deviceId: 'device-1', platform: 'windows', status: 'VERIFIED', observedAt: '2026-09-11T00:00:00Z', evidenceRefs: ['device:1'] },
  { tenantId: 'tenant-a', deviceId: 'device-2', platform: 'android', status: 'TESTED', observedAt: '2026-09-11T00:00:00Z', evidenceRefs: ['device:2'] },
];
const attempts: SyncAttemptReceipt[] = [
  { tenantId: 'tenant-a', deviceId: 'device-1', platform: 'windows', observedAt: '2026-09-11T00:50:00Z', result: 'SUCCESS', evidenceRefs: ['sync:1'] },
  { tenantId: 'tenant-a', deviceId: 'device-2', platform: 'android', observedAt: '2026-09-11T00:50:00Z', result: 'SUCCESS', evidenceRefs: ['sync:2'] },
];
const dashboard = buildDeviceSyncReviewConsole(devices, attempts, [reviewed, topSecret], new Date('2026-09-11T01:00:00Z'));
assert.equal(dashboard.universalDeviceSupport, false);
assert.equal(dashboard.metrics.find((m) => m.platform === 'windows')?.syncAttempts, 1);
assert.equal(dashboard.metrics.find((m) => m.platform === 'android')?.syncAttempts, 0);

const root = await mkdtemp(join(tmpdir(), 'xiv-sync-review-'));
try {
  await appendSyncReviewJournal(root, 'tenant-a', pending, '2026-09-11T00:40:01Z');
  await appendSyncReviewJournal(root, 'tenant-a', reviewed, '2026-09-11T00:42:01Z');
  const journal = await readSyncReviewJournal(root, 'tenant-a');
  assert.equal(journal.length, 2);
  assert.equal(journal[1].previousHash, journal[0].recordHash);
  const restored = await restoreLatestSyncReviews(root, 'tenant-a');
  assert.equal(restored.length, 1);
  assert.equal(restored[0].decision, 'APPROVED_MERGE');
} finally {
  await rm(root, { recursive: true, force: true });
}

console.log('12D-65 tenant key/RAG supervisor/device sync review contracts: OK');
