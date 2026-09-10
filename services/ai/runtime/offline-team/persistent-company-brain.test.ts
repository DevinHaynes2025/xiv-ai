import assert from 'node:assert/strict';
import { PersistentCompanyBrain } from './persistent-company-brain';
import { ingestMeeting } from './meeting-ingestion';
import { searchCompanyBrain } from './company-brain-search';

const brain = new PersistentCompanyBrain();
const first = ingestMeeting(brain, {
  tenantId: 'xiv-ai', meetingId: 'm-001', text: 'CTO recommends local-first Ollama execution with evidence.',
  confidentiality: 'INTERNAL', evidenceRefs: ['receipt:ollama-local'], approvedForLearning: true,
});
const second = ingestMeeting(brain, {
  tenantId: 'xiv-ai', meetingId: 'm-001', text: 'CTO recommends local-first Ollama execution with evidence.',
  confidentiality: 'INTERNAL', evidenceRefs: ['receipt:ollama-local'], approvedForLearning: true,
});
assert.equal(first.duplicate, false);
assert.equal(second.duplicate, true);

const secret = ingestMeeting(brain, {
  tenantId: 'xiv-ai', meetingId: 'm-secret', text: 'sealed secret reference only',
  confidentiality: 'TOP_SECRET', evidenceRefs: ['vault:sealed-001'], approvedForLearning: false,
});
assert.equal(secret.record.searchable, false);
assert.equal(searchCompanyBrain(brain, 'xiv-ai', 'secret').length, 0);
assert.equal(searchCompanyBrain(brain, 'xiv-ai', 'Ollama evidence').length, 1);
assert.equal(searchCompanyBrain(brain, 'other-tenant', 'Ollama').length, 0);

console.log('12D-38 persistent company brain/meeting ingestion contracts: OK');
