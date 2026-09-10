import assert from 'node:assert/strict';
import { appendMeetingMessage, createMeetingMessage } from './multi-agent-meeting-bus';
import { buildExecutiveDecisionPacket } from './executive-decision-packet';

const a = createMeetingMessage({ meetingId:'m1', tenantId:'xiv-local', role:'FOUNDER_TWIN', content:'Prioritize bounded evidence-backed progress.', evidenceRefs:['E1'], createdAt:'2026-09-10T00:00:00.000Z' });
const b = createMeetingMessage({ meetingId:'m1', tenantId:'xiv-local', role:'CHALLENGER', content:'Challenge scope and require proof.', evidenceRefs:['E2'], createdAt:'2026-09-10T00:00:01.000Z' });
const messages = appendMeetingMessage(appendMeetingMessage([], a), b);
assert.equal(messages.length, 2);
assert.equal(a.messageHash.length, 64);
assert.throws(() => appendMeetingMessage(messages, createMeetingMessage({ meetingId:'m1', tenantId:'other', role:'CFO', content:'x', evidenceRefs:['E3'], createdAt:'2026-09-10T00:00:02.000Z' })), /MEETING_BOUNDARY_VIOLATION/);
const packet = buildExecutiveDecisionPacket({ messages, recommendation:'Proceed with bounded next story.', supportingRoles:['FOUNDER_TWIN'], dissentingRoles:['CHALLENGER'], unresolvedRisks:['Need local runtime receipt.'] });
assert.equal(packet.requiresHumanApproval, true);
assert.equal(packet.productionExecutionAllowed, false);
assert.deepEqual(packet.evidenceRefs.sort(), ['E1','E2']);
console.log('12D-34 multi-agent meeting bus contracts: OK');
