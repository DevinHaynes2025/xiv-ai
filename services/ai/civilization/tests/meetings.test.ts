import assert from 'node:assert/strict';
import { test } from 'node:test';

import { assessEvidence, evidenceRef, HUMAN_JUDGMENT_REQUIRED } from '../human-bridge';
import { codeOf, twoUniverseWorld, type TwoUniverseWorld } from './harness';

function openRoom(world: TwoUniverseWorld) {
  const meeting = world.xiv.openMeeting(world.alphaFounder, {
    title: 'Port closure response',
    agenda: [{ title: 'Situation', detail: 'Berth closure' }],
    securityClassification: 'confidential',
  });

  world.xiv.joinMeeting(world.alphaFounder, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: world.alphaCoordinator.id,
    participantRole: 'chair',
  });
  world.xiv.joinMeeting(world.alphaFounder, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: world.alphaSpecialist.id,
    participantRole: 'contributor',
  });
  world.xiv.joinMeeting(world.alphaFounder, {
    meetingId: meeting.id,
    participantKind: 'human',
    userId: world.alphaFounder.userId,
    participantRole: 'human_executive',
  });

  return meeting;
}

test('a meeting keeps its deliberation inside its own universe', () => {
  const world = twoUniverseWorld();
  const meeting = openRoom(world);

  assert.equal(world.xiv.listMeetings(world.betaFounder).length, 0);
  assert.equal(world.xiv.readConversation(world.betaFounder, meeting.id).length, 0);
  assert.equal(
    codeOf(() => world.xiv.summarizeDeliberation(world.betaFounder, meeting.id)),
    'tenancy_cross_universe_blocked',
  );
});

test('only a joined participant can contribute or vote', () => {
  const world = twoUniverseWorld();
  const meeting = openRoom(world);

  const stranger = world.xiv.registerAgent(world.alphaFounder, {
    agentKey: 'stranger',
    displayName: 'Stranger',
    profession: 'finance',
    modelRuntime: 'test-runtime',
    humanSupervisorId: world.alphaFounder.userId,
  });

  assert.equal(
    codeOf(() =>
      world.xiv.contribute(world.alphaFounder, {
        meetingId: meeting.id,
        kind: 'proposal',
        fromAgentId: stranger.id,
        statement: 'let me in',
        reasoning: 'not a participant',
      }),
    ),
    'meeting_participant_unknown',
  );

  assert.equal(
    codeOf(() =>
      world.xiv.recordVote(world.alphaFounder, {
        meetingId: meeting.id,
        agentId: stranger.id,
        vote: 'recommend',
        rationale: 'not a participant',
      }),
    ),
    'meeting_participant_unknown',
  );
});

test('a human can enter the reasoning rather than only receive the answer', () => {
  const world = twoUniverseWorld();
  const meeting = openRoom(world);

  world.xiv.contribute(world.alphaFounder, {
    meetingId: meeting.id,
    kind: 'evidence',
    fromUserId: world.alphaFounder.userId,
    statement: 'The closure notice came from the carrier directly',
    reasoning: 'Recorded as a human fact so agents do not treat it as an inference.',
    evidence: [evidenceRef({ label: 'carrier notice', claimKind: 'human_fact', confidence: 0.95 })],
  });

  world.xiv.contribute(world.alphaFounder, {
    meetingId: meeting.id,
    kind: 'proposal',
    fromAgentId: world.alphaSpecialist.id,
    statement: 'Reallocate 15 percent of volume',
    reasoning: 'Two suppliers are already qualified.',
    evidence: [evidenceRef({ label: 'qualified suppliers', claimKind: 'agent_inference', confidence: 0.7 })],
    confidence: 0.7,
  });

  const conversation = world.xiv.readConversation(world.alphaFounder, meeting.id);
  assert.equal(conversation.length, 2);
  assert.equal(conversation[0].senderUserId, world.alphaFounder.userId);
  assert.equal(conversation[0].evidence[0].claimKind, 'human_fact');
  assert.equal(conversation[1].senderAgentId, world.alphaSpecialist.id);
  assert.equal(conversation[1].evidence[0].claimKind, 'agent_inference');
  assert.ok(conversation.every((message) => message.reasoningArtifact.length > 0));
});

test('an objection sends the room to a human even when the votes would pass', () => {
  const world = twoUniverseWorld();
  const meeting = openRoom(world);

  world.xiv.contribute(world.alphaFounder, {
    meetingId: meeting.id,
    kind: 'evidence',
    fromUserId: world.alphaFounder.userId,
    statement: 'Carrier notice',
    reasoning: 'Direct from the carrier.',
    evidence: [evidenceRef({ label: 'carrier notice', claimKind: 'human_fact', confidence: 0.95 })],
  });

  world.xiv.contribute(world.alphaFounder, {
    meetingId: meeting.id,
    kind: 'objection',
    fromAgentId: world.alphaSpecialist.id,
    statement: 'Cost exposure rests on a forecast',
    reasoning: 'A prediction cannot carry a spending decision on its own.',
    evidence: [evidenceRef({ label: 'Q4 forecast', claimKind: 'prediction', confidence: 0.48 })],
    confidence: 0.48,
  });

  world.xiv.recordVote(world.alphaFounder, {
    meetingId: meeting.id,
    agentId: world.alphaCoordinator.id,
    vote: 'recommend',
    rationale: 'Reversible.',
  });
  world.xiv.recordVote(world.alphaFounder, {
    meetingId: meeting.id,
    agentId: world.alphaSpecialist.id,
    vote: 'object',
    rationale: 'Forecast risk.',
  });

  const deliberation = world.xiv.summarizeDeliberation(world.alphaFounder, meeting.id);
  assert.equal(deliberation.recommendCount, 1);
  assert.equal(deliberation.objectCount, 1);
  assert.deepEqual(deliberation.unresolvedDisagreements, ['Cost exposure rests on a forecast']);
  assert.equal(deliberation.humanJudgmentRequired, true);
});

test('an agent says the evidence is insufficient rather than guessing', () => {
  const assessment = assessEvidence([
    evidenceRef({ label: 'Q4 forecast', claimKind: 'prediction', confidence: 0.48 }),
    evidenceRef({ label: 'a hunch', claimKind: 'agent_inference', confidence: 0.4 }),
    evidenceRef({ label: 'unlabelled input', claimKind: 'unknown', confidence: 0.9 }),
  ]);

  assert.equal(assessment.sufficient, false);
  assert.equal(assessment.humanJudgmentRequired, true);
  assert.equal(assessment.statement, HUMAN_JUDGMENT_REQUIRED);
  assert.equal(assessment.groundingClaims, 0);
  assert.deepEqual(assessment.unknownClaims, ['unlabelled input']);
});

test('grounded evidence with high confidence does not need a human to unblock it', () => {
  const assessment = assessEvidence([
    evidenceRef({ label: 'carrier notice', claimKind: 'human_fact', confidence: 0.95 }),
    evidenceRef({ label: 'met office bulletin', claimKind: 'external_source', confidence: 0.8 }),
  ]);

  assert.equal(assessment.sufficient, true);
  assert.equal(assessment.humanJudgmentRequired, false);
  assert.ok(assessment.weightedConfidence > 0.6);
});

test('the seven claim kinds are all distinguished', () => {
  const assessment = assessEvidence([
    evidenceRef({ label: 'a', claimKind: 'human_fact', confidence: 1 }),
    evidenceRef({ label: 'b', claimKind: 'human_opinion', confidence: 1 }),
    evidenceRef({ label: 'c', claimKind: 'agent_inference', confidence: 1 }),
    evidenceRef({ label: 'd', claimKind: 'historical_evidence', confidence: 1 }),
    evidenceRef({ label: 'e', claimKind: 'external_source', confidence: 1 }),
    evidenceRef({ label: 'f', claimKind: 'prediction', confidence: 1 }),
    evidenceRef({ label: 'g', claimKind: 'unknown', confidence: 1 }),
  ]);

  assert.deepEqual(assessment.claimBreakdown, {
    human_fact: 1,
    human_opinion: 1,
    agent_inference: 1,
    historical_evidence: 1,
    external_source: 1,
    prediction: 1,
    unknown: 1,
  });
});

test('a decision needs an attributable human participant', () => {
  const world = twoUniverseWorld();
  const meeting = openRoom(world);

  assert.equal(
    codeOf(() =>
      world.xiv.decideMeeting(world.alphaMember, {
        meetingId: meeting.id,
        decision: 'approve',
        rationale: 'not in the room',
      }),
    ),
    'meeting_requires_human_decider',
  );

  const decided = world.xiv.decideMeeting(world.alphaFounder, {
    meetingId: meeting.id,
    decision: 'Approve partial reallocation',
    rationale: 'Reversible and bounded.',
  });

  assert.equal(decided.status, 'decided');
  assert.equal(decided.decisionBy, world.alphaFounder.userId);
  assert.ok(decided.decidedAt);

  const record = world.xiv
    .auditTrail(world.alphaFounder)
    .find((event) => event.eventKind === 'meeting_decided');
  assert.ok(record, 'the human decision must exist as a governance record');
  assert.equal(record?.actorUserId, world.alphaFounder.userId);
  assert.equal(record?.decision, 'Approve partial reallocation');
});

test('a meeting that requires a human cannot be archived without one', () => {
  const world = twoUniverseWorld();
  const meeting = openRoom(world);

  assert.equal(
    codeOf(() => world.xiv.archiveMeeting(world.alphaFounder, { meetingId: meeting.id, summary: 'closing early' })),
    'meeting_decision_not_reached',
  );

  world.xiv.decideMeeting(world.alphaFounder, {
    meetingId: meeting.id,
    decision: 'Approve',
    rationale: 'Bounded.',
  });
  const archived = world.xiv.archiveMeeting(world.alphaFounder, {
    meetingId: meeting.id,
    summary: 'Approved with one unresolved objection.',
  });

  assert.equal(archived.status, 'archived');
  assert.ok(archived.archivedAt);
});

test('unresolved disagreements survive into the archived record', () => {
  const world = twoUniverseWorld();
  const meeting = openRoom(world);

  world.xiv.contribute(world.alphaFounder, {
    meetingId: meeting.id,
    kind: 'objection',
    fromAgentId: world.alphaSpecialist.id,
    statement: 'Carrier dependency is not measured',
    reasoning: 'No measurement exists yet.',
    evidence: [evidenceRef({ label: 'no measurement', claimKind: 'unknown', confidence: 0.1 })],
  });

  world.xiv.decideMeeting(world.alphaFounder, {
    meetingId: meeting.id,
    decision: 'Approve and open a separate review',
    rationale: 'The objection becomes its own review.',
  });
  const archived = world.xiv.archiveMeeting(world.alphaFounder, {
    meetingId: meeting.id,
    summary: 'Approved with the dependency review outstanding.',
  });

  assert.deepEqual(archived.unresolvedDisagreements, ['Carrier dependency is not measured']);
});
