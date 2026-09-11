import { OfflineRagRetrievalIndex } from './offline-rag-retrieval-index';
import { LearningPromotionLedger } from './learning-promotion-ledger';
import { DeviceSyncGateway } from './device-sync-gateway';
import { buildOfflineLearningDeviceSyncReceipt } from './offline-learning-device-sync-receipt';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const index = new OfflineRagRetrievalIndex();
const citation = index.index({
  knowledgeId: 'case-1',
  tenantId: 'xiv',
  title: 'Offline queue recovery',
  content: 'Durable append-only queues recover by replaying events after a verified checkpoint.',
  sourceRef: 'library://cases/offline-queue-recovery',
  evidenceRefs: ['receipt:case-1-source'],
  classification: 'INTERNAL',
  approved: true,
  approvedBy: 'reviewer:ops',
  approvedAt: '2026-09-11T03:00:00Z',
});
assert(citation.sourceRef.startsWith('library://'), 'indexed knowledge should preserve provenance');
assert(index.count('xiv') === 1, 'tenant should report measured indexed knowledge count');
assert(index.count('other') === 0, 'index must isolate tenants');
const hits = index.query('xiv', 'recover queue replay checkpoint');
assert(hits.length === 1, 'offline RAG should retrieve matching approved knowledge');
assert(hits[0].citation.evidenceRefs.length > 0 && hits[0].citation.sourceHash.length === 64, 'retrieval hit must contain evidence-backed citation');

let topSecretIndexRejected = false;
try {
  index.index({
    knowledgeId: 'secret-1', tenantId: 'xiv', title: 'Restricted', content: 'local restricted material', sourceRef: 'vault://restricted', evidenceRefs: ['receipt:secret'], classification: 'TOP_SECRET', approved: true, approvedBy: 'security', approvedAt: '2026-09-11T03:01:00Z',
  });
} catch { topSecretIndexRejected = true; }
assert(topSecretIndexRejected, 'TOP_SECRET must stay out of ordinary retrieval index');

const learning = new LearningPromotionLedger();
learning.stage({
  candidateId: 'lesson-1', tenantId: 'xiv', agentId: 'agent:devops', lesson: 'Replay after a verified checkpoint minimizes duplicate work.', classification: 'INTERNAL', citationRefs: [citation.sourceRef], evidenceRefs: ['receipt:study-session-1'], createdAt: '2026-09-11T03:02:00Z',
});
learning.evaluate('lesson-1', { evaluationId: 'eval-1', score: 0.91, evaluatorRole: 'review-council', evidenceRefs: ['receipt:quiz-1'], evaluatedAt: '2026-09-11T03:03:00Z' });
const companyDecision = learning.promote('lesson-1', 'COMPANY_TRUSTED', { approvedBy: 'human:owner', approvedAt: '2026-09-11T03:04:00Z' });
assert(companyDecision.status === 'PROMOTED', 'high-scoring evidence-backed lesson with human approval should promote');
assert(companyDecision.modelWeightsMutated === false, 'offline learning promotion must not imply weight mutation');

learning.stage({
  candidateId: 'lesson-secret', tenantId: 'xiv', agentId: 'agent:security', lesson: 'restricted local lesson', classification: 'TOP_SECRET', citationRefs: ['vault://restricted'], evidenceRefs: ['receipt:restricted-study'], createdAt: '2026-09-11T03:05:00Z',
});
learning.evaluate('lesson-secret', { evaluationId: 'eval-secret', score: 0.99, evaluatorRole: 'security-review', evidenceRefs: ['receipt:security-eval'], evaluatedAt: '2026-09-11T03:06:00Z' });
const secretCompanyDecision = learning.promote('lesson-secret', 'COMPANY_TRUSTED', { approvedBy: 'human:owner', approvedAt: '2026-09-11T03:07:00Z' });
assert(secretCompanyDecision.status === 'REJECTED', 'TOP_SECRET must not enter ordinary company trusted memory');

const gateway = new DeviceSyncGateway();
const deviceReceipt = {
  receiptId: 'device-receipt-1',
  tenantId: 'xiv',
  userId: 'user-1',
  deviceId: 'windows-dev-1',
  platform: 'WINDOWS' as const,
  state: 'VERIFIED' as const,
  adapterVersion: '12d62-test',
  allowedKinds: ['TASK', 'APP_SETTINGS', 'LEARNING_RECEIPT'] as const,
  verifiedAt: '2026-09-11T03:08:00Z',
  expiresAt: '2027-09-11T03:08:00Z',
  evidenceRefs: ['receipt:device-test-suite'],
};
const manifest = gateway.prepare(deviceReceipt, [
  { itemId: 'sync-1', tenantId: 'xiv', userId: 'user-1', kind: 'TASK', classification: 'INTERNAL', version: 1, contentHash: 'hash-1', payloadRef: 'local://task/1', evidenceRefs: ['receipt:task-1'] },
  { itemId: 'sync-secret', tenantId: 'xiv', userId: 'user-1', kind: 'LEARNING_RECEIPT', classification: 'TOP_SECRET', version: 1, contentHash: 'hash-2', payloadRef: 'vault://lesson/secret', evidenceRefs: ['receipt:secret-local-only'] },
  { itemId: 'sync-other-user', tenantId: 'xiv', userId: 'user-2', kind: 'TASK', classification: 'INTERNAL', version: 1, contentHash: 'hash-3', payloadRef: 'local://task/other', evidenceRefs: ['receipt:task-other'] },
], '2026-09-11T03:09:00Z');
assert(manifest.items.length === 1, 'only authorized non-secret same-user item should prepare for sync');
assert(manifest.rejected.length === 2, 'TOP_SECRET and cross-user items should be rejected');

let targetDeviceRejected = false;
try {
  gateway.prepare({ ...deviceReceipt, receiptId: 'target-only', state: 'TARGET' }, [], '2026-09-11T03:09:00Z');
} catch { targetDeviceRejected = true; }
assert(targetDeviceRejected, 'TARGET device must not be treated as verified support');

const receipt = buildOfflineLearningDeviceSyncReceipt({
  tenantId: 'xiv',
  generatedAt: '2026-09-11T03:10:00Z',
  indexedKnowledgeCount: index.count('xiv'),
  promotedLearningCount: learning.snapshot('xiv').filter(item => item.status === 'PROMOTED').length,
  rejectedLearningCount: learning.snapshot('xiv').filter(item => item.status === 'REJECTED').length,
  verifiedDeviceCount: 1,
  preparedSyncItemCount: manifest.items.length,
  rejectedSyncItemCount: manifest.rejected.length,
  topSecretRejectedFromOrdinaryIndex: topSecretIndexRejected,
  topSecretRejectedFromClientSync: manifest.rejected.some(item => item.itemId === 'sync-secret'),
  citationsPresentForRetrieval: hits.every(hit => hit.citation.sourceRef.length > 0 && hit.citation.evidenceRefs.length > 0),
});
assert(receipt.status === 'HEALTHY', 'receipt should be healthy only when policy gates are measured');
assert(receipt.claims.universalDeviceSupportVerified === false, 'one device receipt must not imply universal support');

console.log('12D-62 offline RAG/learning evaluation/device sync contracts: OK');
