import { strict as assert } from 'node:assert';
import { canEnterPrivateTimeline, canLeaveDevice } from './consumer-twin-memory-timeline';
import { searchPrivateMemory } from './local-private-rag';
import { buildKnowledgePack } from './encrypted-knowledge-pack-builder';
import { evaluateDocCouncil } from './documentation-agent-council';

const event = {
  id: 'm1', tenantId: 't1', userId: 'u1', occurredAt: '2026-09-11T00:00:00Z',
  source: 'USER_NOTE' as const, classification: 'CONFIDENTIAL' as const, consentRef: 'consent-1',
  summary: 'prefers offline private planning', evidenceRefs: ['e1'], confidence: 0.9, approvedForRecall: true,
};
assert.equal(canEnterPrivateTimeline(event), true);
assert.equal(canLeaveDevice(event, false), false);
assert.equal(searchPrivateMemory({ tenantId: 't1', userId: 'u1', text: 'offline planning', maxResults: 5, allowTopSecret: false }, [event]).length, 1);
const pack = buildKnowledgePack('p1', 't1', [{ id: 'i1', tenantId: 't1', classification: 'CONFIDENTIAL', content: 'approved knowledge', evidenceRefs: ['e1'], approved: true }]);
assert.equal(pack.itemCount, 1);
const council = evaluateDocCouncil({ members: [
  { agentId: 'a1', role: 'TECHNICAL_WRITER', evidenceRefs: ['e1'], recommendation: 'publish draft', confidence: 0.9 },
  { agentId: 'a2', role: 'SECURITY', evidenceRefs: ['e2'], recommendation: 'publish after review', confidence: 0.9 },
], publishApprovedByHuman: true, containsSecrets: false, consequentialPolicyChange: false });
assert.equal(council.publishAllowed, true);
console.log('12D-75 consumer twin memory/RAG/knowledge pack/doc council contracts: OK');
