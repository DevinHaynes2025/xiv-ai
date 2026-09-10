import assert from 'node:assert/strict';
import { createWorkforceAgent, createCampusSpace } from './ai-workforce-campus';
import { createDevOpsAssignment } from './devops-team';
import { assessAgentReadiness } from './ai-hr';
import { validateStudySource } from './study-curriculum';
import { createAgentMeeting } from './agent-campus-meetings';
import { evaluateMentalGym } from './innovation-mental-gym';

const devops = createWorkforceAgent({ agentId: 'devops-01', tenantId: 'xiv-local', department: 'DEVOPS', role: 'Build Engineer', skills: ['ci'], evidenceRefs: ['ROLE_DEFINED'] });
assert.equal(devops.state, 'READY');

const assignment = createDevOpsAssignment({ assignmentId: 'a1', tenantId: 'xiv-local', role: 'BUILD_ENGINEER', objective: 'Validate local build', environment: 'LOCAL', evidenceRefs: [] });
assert.equal(assignment.state, 'READY');
assert.equal(assignment.productionMutationAllowed, false);

const hr = assessAgentReadiness({ agentId: 'ai-eng-01', tenantId: 'xiv-local', role: 'LLM Engineer', skills: ['ollama'], trainingCompleted: ['evidence-101'], performanceEvidence: ['TEST:PASS'] });
assert.equal(hr.status, 'READY');

assert.equal(validateStudySource({ sourceId: 'src1', title: 'Authorized case study', sourceType: 'CASE_STUDY', provenanceRef: 'doc:1', licensedOrAuthorized: true }), true);
const space = createCampusSpace({ spaceId: 'gym', kind: 'MENTAL_GYM', purpose: 'Reasoning practice', tenantId: 'xiv-local' });
assert.equal(space.simulationOnly, true);
const meeting = createAgentMeeting({ meetingId: 'm1', tenantId: 'xiv-local', kind: 'THINK_TANK', participantAgentIds: ['devops-01', 'ai-eng-01'], agenda: ['challenge assumptions'], evidenceRefs: ['MEETING:PLANNED'] });
assert.equal(meeting.productionAuthority, false);
const gym = evaluateMentalGym({ exercise: { exerciseId: 'e1', skill: 'EVIDENCE', prompt: 'Separate claims from evidence', rubric: ['evidence'], maxScore: 10 }, agentId: 'ai-eng-01', score: 8, evidenceRefs: ['EVAL:1'] });
assert.equal(gym.passed, true);

console.log('12D-33 AI workforce and learning campus contracts: OK');
