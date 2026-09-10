import assert from 'node:assert/strict';
import { EXECUTIVE_ROLES, CABINET_GUARDRAILS, buildExecutivePrompt } from './executive-cabinet-ollama-runner';
import { buildExecutiveDecisionPacket } from './executive-cabinet-council';
import { createApprovedBrainLesson } from './company-brain-writeback';

assert(EXECUTIVE_ROLES.includes('CTO'));
assert(EXECUTIVE_ROLES.includes('CISO'));
assert.equal(CABINET_GUARDRAILS.autonomousProductionMutation, false);
assert.equal(CABINET_GUARDRAILS.autonomousMoneyMovement, false);
assert.match(buildExecutivePrompt('CTO','Review architecture'), /Do not expose secrets/);

const mock = EXECUTIVE_ROLES.slice(0,3).map((role, i) => ({ role, recommendation: i === 2 ? 'I challenge the current plan due to risk.' : 'Proceed with evidence.', risk: 'needs runtime evidence', challenge: 'challenge assumptions', evidenceRefs: ['receipt:1'], hash: String(i) }));
const packet = buildExecutiveDecisionPacket('test objective', mock);
assert.equal(packet.requiresHumanApproval, true);
assert(packet.dissent.length >= 1);

assert.throws(() => createApprovedBrainLesson({tenantId:'xiv',sourcePacketHash:'abc',lesson:'safe',evidenceRefs:['r'],approved:false}), /HUMAN_APPROVAL_REQUIRED/);
const lesson = createApprovedBrainLesson({tenantId:'xiv',sourcePacketHash:'abc',lesson:'Use evidence before scaling.',evidenceRefs:['r'],approved:true});
assert.equal(lesson.cellId.length, 64);
console.log('12D-36 executive cabinet Ollama council contracts: OK');
