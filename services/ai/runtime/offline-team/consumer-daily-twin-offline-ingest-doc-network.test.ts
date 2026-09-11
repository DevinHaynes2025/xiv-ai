import assert from 'node:assert/strict';
import { canEnterDailyLearningMemory, canSyncDailySignal } from './consumer-daily-twin-loop';
import { decideKnowledgeIngest } from './offline-knowledge-pack-ingestion';
import { canPublishDocumentation } from './technical-documentation-factory';
import { decideNetworkCollaboration } from './safe-network-collaboration';
import { isJournalEventUsable } from './consumer-activity-journal';
import { decideLearningWriteback } from './evaluated-learning-writeback';

const approvedSignal = { id:'s1', tenantId:'t1', userId:'u1', source:'USER_INPUT' as const, consentRef:'consent-1', classification:'CONFIDENTIAL' as const, contentHash:'abc', capturedAt:new Date().toISOString(), status:'APPROVED' as const };
assert.equal(canEnterDailyLearningMemory(approvedSignal), true);
assert.equal(canSyncDailySignal({ ...approvedSignal, classification:'TOP_SECRET' }), false);
assert.equal(decideKnowledgeIngest({ id:'k1', tenantId:'t1', sourceKind:'GITHUB_REPO', sourceRef:'repo', licenseRef:'MIT', contentHash:'hash', classification:'PUBLIC', provenanceComplete:true }), 'ACCEPT_LOCAL');
assert.equal(canPublishDocumentation({ id:'d1', tenantId:'t1', kind:'RUNBOOK', sourceRefs:['s'], evidenceRefs:['e'], classification:'INTERNAL', status:'APPROVED', humanApprovalRef:'h1' }), true);
assert.equal(decideNetworkCollaboration({ tenantId:'t1', peerKind:'APPROVED_LLM_API', dataClass:'TOP_SECRET', purpose:'test', minimized:true, consentRef:'c', approvalRef:'a' }), 'DENY');
assert.equal(isJournalEventUsable({ id:'e1', tenantId:'t1', userId:'u1', eventType:'LEARN', contentHash:'h', evidenceRefs:[], classification:'INTERNAL', consentRef:'c', occurredAt:new Date().toISOString() }), true);
assert.equal(decideLearningWriteback({ id:'l1', tenantId:'t1', contentHash:'h', evidenceRefs:['e'], evaluationScore:0.9, approved:true, classification:'PUBLIC', minimizedForSharing:true }), 'SHARE_MINIMIZED');
console.log('12D-74 consumer daily twin/offline ingest/doc network contracts: OK');
