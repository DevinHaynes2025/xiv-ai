import { strict as assert } from 'node:assert';
import { canLearnLocally, canSyncSignal } from './consumer-first-universe-profile';
import { readyForApproval } from './technical-writing-guild';
import { createAtomicKnowledgeCell, canEnterTrustedBrain } from './atomic-knowledge-cell';
import { canPromote } from './offline-intelligence-refinement';
import { canUseTool } from './open-source-knowledge-mesh';
import { isSourceBacked } from './humanity-knowledge-genome';

assert.equal(canLearnLocally({ userId:'u', tenantId:'t', modes:['CONSUMER'], localLearningEnabled:true, permissions:{search:'LOCAL_ONLY'}, memoryNamespace:'u:local', consentVersion:'v1' }), true);
assert.equal(canSyncSignal({ userId:'u', tenantId:'t', modes:['CONSUMER'], localLearningEnabled:true, permissions:{search:'LOCAL_ONLY'}, memoryNamespace:'u:local', consentVersion:'v1' }, 'search'), false);
assert.equal(readyForApproval({ id:'d', kind:'RUNBOOK', audience:'DEVELOPER', sourceRefs:['r1'], ownerRole:'TECHNICAL_WRITER', status:'REVIEW' }), true);
const cell = createAtomicKnowledgeCell({ id:'c', tenantId:'t', content:'x', sourceRefs:['r1'], trust:'APPROVED', classification:'INTERNAL', confidence:0.9, createdAt:new Date().toISOString() });
assert.equal(canEnterTrustedBrain(cell), true);
assert.equal(canPromote({ id:'r', tenantId:'t', stage:'APPROVE', sourceRefs:['r1'], evaluationScore:0.9, humanApproved:true, changesModelWeights:false, changesProductionCode:false }), true);
assert.equal(canUseTool({ name:'tool', license:'MIT', state:'APPROVED', securityReviewed:true, allowedOffline:true, sourceRefs:['repo'] }), true);
assert.equal(isSourceBacked({ id:'h', domain:'HISTORY', subject:'x', sourceRefs:['source'], confidence:0.9, classification:'PUBLIC', claimType:'DOCUMENTED' }), true);
console.log('12D-73 consumer OS/writing/offline intelligence contracts: OK');
