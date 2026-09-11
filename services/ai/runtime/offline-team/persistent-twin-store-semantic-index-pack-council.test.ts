import { strict as assert } from 'node:assert';
import { searchLocalTwinMemory } from './offline-semantic-index';
import { runDocumentationCouncil } from './documentation-council-runner';
import { persistentTwinMemoryPolicy } from './persistent-twin-memory-store';
import { knowledgePackDiskPolicy } from './knowledge-pack-disk-writer';

const records = [{
  tenantId: 't1', userId: 'u1', memoryId: 'm1', text: 'offline supply chain bottleneck analysis',
  classification: 'CONFIDENTIAL' as const, consentRef: 'consent-1', evidenceRefs: ['e1'],
  confidence: 0.9, recallAllowed: true, createdAt: new Date().toISOString(),
}];

assert.equal(searchLocalTwinMemory(records, 'supply chain').length, 1);
assert.equal(persistentTwinMemoryPolicy.silentCentralPoolingAllowed, false);
assert.equal(knowledgePackDiskPolicy.encryptedRequired, true);

const council = runDocumentationCouncil({
  topic: 'offline runbook',
  roles: ['TECHNICAL_WRITER', 'SECURITY'],
  evidenceRefs: ['e1'],
  containsSecrets: false,
  consequential: false,
});
assert.equal(council.status, 'READY_FOR_REVIEW');
assert.equal(council.humanApprovalRequired, true);

console.log('12D-76 persistent twin store/semantic index/knowledge pack/doc council contracts: OK');
