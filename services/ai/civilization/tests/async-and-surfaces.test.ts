import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createMeetingsApi, MEETING_ROUTES, type ApiRequest } from '../api';
import { formatBrief } from '../overnight';
import { codeOf } from './harness';
import { boardroomWorld, loadEvidence, seatAll, type BoardroomWorld } from './meeting-harness';

const NIGHT = { start: '2026-09-08T20:00:00.000Z', end: '2026-09-09T07:00:00.000Z' };

function runNightShift(world: BoardroomWorld) {
  const meeting = world.xiv.openOvernightMeeting(world.founder, {
    title: 'Overnight supplier watch',
    agenda: [{ title: 'Watch', detail: 'Monitor the inbound delay while the executive is away.' }],
    triggerKind: 'anomaly_detected',
    triggerDetail: 'Inbound delay exceeded the six-hour threshold.',
    window: NIGHT,
  });

  seatAll(world, meeting);
  const evidence = loadEvidence(world, meeting);

  const proposal = world.xiv.proposeOption(world.founder, {
    meetingId: meeting.id,
    optionKey: 'B',
    title: 'Dual-source through Supplier B',
    agentId: world.coordinator.id,
    xarpRole: 'synthesizer',
    claim: 'Resilience is worth the cost exposure.',
    evidenceIds: [evidence.resilience.id, evidence.cost.id],
    source: 'Overnight deliberation',
    confidence: 0.8,
    counterargument: 'Finance disputes affordability.',
    risk: 'Locks in a higher unit cost.',
    recommendation: 'Dual-source with a two-quarter review gate.',
  });

  world.xiv.synthesize(world.founder, { meetingId: meeting.id });
  world.xiv.advanceStage(world.founder, { meetingId: meeting.id, stage: 'consensus_or_disagreement' });

  const decision = world.xiv.decide(world.founder, {
    meetingId: meeting.id,
    decisionKind: 'postponed',
    rationale: 'Holding for the executive at 07:00.',
  });

  const action = world.xiv.queueAction(world.founder, {
    meetingId: meeting.id,
    decisionId: decision.id,
    action: 'Open a dual-source purchase order with Supplier B.',
    authorizationBasis: 'Overnight recommendation awaiting the executive.',
    // Even asked for explicitly, this does not survive an asynchronous room.
    requiresHumanApproval: false,
    rollbackPlan: 'Cancel before the first release.',
  });

  return { meeting, proposal, decision, action };
}

test('an asynchronous room cannot mark its own work as needing no approval', () => {
  const world = boardroomWorld();
  const { action } = runNightShift(world);

  assert.equal(action.requiresHumanApproval, true);
  assert.equal(action.approvedBy, null);
  assert.equal(action.status, 'queued');
  assert.equal(
    codeOf(() => world.xiv.executeAction(world.founder, { actionId: action.id })),
    'action_requires_approval',
  );
});

test('the morning brief counts what happened rather than asserting it', () => {
  const world = boardroomWorld();
  runNightShift(world);

  const brief = world.xiv.overnightBrief(world.founder, NIGHT);

  assert.equal(brief.meetingsCompleted, 1);
  assert.equal(brief.issuesInvestigated, 1);
  assert.equal(brief.opportunitiesIdentified, 1);
  assert.equal(brief.anomaliesDetected, 1);
  assert.equal(brief.decisionsRequiringApproval, 1);

  // The number that matters. It is counted from actions that ran without an
  // approver, so it would be non-zero if the invariant ever broke.
  assert.equal(brief.unauthorizedActionsExecuted, 0);

  assert.match(formatBrief(brief), /0 unauthorized actions executed/);
});

test('an asynchronous meeting refuses contributions after its window closes', () => {
  const world = boardroomWorld();
  const meeting = world.xiv.openOvernightMeeting(world.founder, {
    title: 'A window that has already passed',
    agenda: [{ title: 'Watch', detail: 'Overnight watch.' }],
    window: { start: '2020-01-01T20:00:00.000Z', end: '2020-01-02T07:00:00.000Z' },
  });
  seatAll(world, meeting);

  assert.equal(
    codeOf(() =>
      world.xiv.speak(world.founder, {
        meetingId: meeting.id,
        agentId: world.investigator.id,
        xarpRole: 'investigator',
        originalText: 'Still working long after the window shut.',
      }),
    ),
    'meeting_async_window_closed',
  );
});

test('an asynchronous meeting must declare a window that makes sense', () => {
  const world = boardroomWorld();

  assert.equal(
    codeOf(() =>
      world.xiv.openOvernightMeeting(world.founder, {
        title: 'Backwards window',
        agenda: [{ title: 'Watch', detail: 'Overnight watch.' }],
        window: { start: NIGHT.end, end: NIGHT.start },
      }),
    ),
    'meeting_async_window_invalid',
  );

  assert.equal(
    codeOf(() =>
      world.xiv.convene(world.founder, {
        title: 'Async with no window',
        agenda: [{ title: 'Watch', detail: 'Overnight watch.' }],
        meetingMode: 'asynchronous',
      }),
    ),
    'meeting_async_window_invalid',
  );
});

test('the command center separates the catalogue from what is actually running', () => {
  const world = boardroomWorld();
  runNightShift(world);
  world.xiv.setLogicalPopulation(world.founder, { professionKey: 'procurement', logicalAgentCount: 1_200 });

  world.xiv.issueControl(world.founder, {
    control: 'pause',
    subjectKind: 'agent',
    subjectAgentId: world.challenger.id,
    reason: 'Paused pending review.',
  });

  const view = world.xiv.commandCenter(world.founder);

  assert.equal(view.logicalAgents, 1_200);
  assert.equal(view.activeAgents, 4);
  assert.equal(view.pausedAgents, 1);
  assert.equal(view.humanApprovalsRequired, 1);
  assert.equal(view.universe.killSwitchEngaged, false);
  assert.ok(view.directory.length > 0);
  assert.ok(view.mostConsumedBudget !== null);
});

// --- The bounded API surface ------------------------------------------------

function api(world: BoardroomWorld, as = world.founder) {
  return createMeetingsApi({
    civilization: world.xiv,
    resolveActor: (request) => (request.headers?.authorization === 'deny' ? null : as),
  });
}

function post(path: string, body: Record<string, unknown> = {}): ApiRequest {
  return { method: 'POST', path, body };
}

test('the router exposes exactly the endpoints the story names', () => {
  const world = boardroomWorld();
  assert.deepEqual([...api(world).routes], [...MEETING_ROUTES]);
});

test('an unauthenticated call never reaches the civilization layer', () => {
  const world = boardroomWorld();
  const response = api(world).handle({
    method: 'POST',
    path: '/meetings',
    body: { title: 'Should not open' },
    headers: { authorization: 'deny' },
  });

  assert.equal(response.status, 401);
  assert.equal(world.xiv.listMeetings(world.founder).length, 0);
});

test('the router never takes identity from the request body', () => {
  const world = boardroomWorld();
  // The caller is the rival, and claims to be the founder in Alpha. The claim is
  // ignored: resolveActor decides, so the meeting is created in Beta.
  const response = api(world, world.rival).handle(
    post('/meetings', {
      title: 'Cross-tenant attempt',
      agenda: [{ title: 'Scope', detail: 'Trying to open a room in Alpha.' }],
      universeId: world.founder.universeId,
      userId: world.founder.userId,
    }),
  );

  assert.equal(response.status, 201);
  assert.equal(world.xiv.listMeetings(world.founder).length, 0);
  assert.equal(world.xiv.listMeetings(world.rival).length, 1);
});

test('a refusal keeps its governance code and maps to a sensible status', () => {
  const world = boardroomWorld();

  // A participant is not a supervisor, so convening is refused.
  const notSupervisor = api(world, world.analyst).handle(
    post('/meetings', { title: 'Unauthorised room', agenda: [] }),
  );
  assert.equal(notSupervisor.status, 403);
  assert.equal(notSupervisor.body.error, 'tenancy_not_a_supervisor');

  const opened = api(world).handle(
    post('/meetings', {
      title: 'Supplier resilience',
      agenda: [{ title: 'Question', detail: 'Dual-source?' }],
      budget: { maxParticipantAgents: 1 },
    }),
  );
  assert.equal(opened.status, 201);
  const meetingId = (opened.body.data as { id: string }).id;

  api(world).handle(
    post(`/meetings/${meetingId}/join`, {
      participantKind: 'agent',
      agentId: world.coordinator.id,
      xarpRoles: ['synthesizer'],
    }),
  );

  // The budget refusal arrives as 429 rather than a generic failure.
  const overBudget = api(world).handle(
    post(`/meetings/${meetingId}/join`, { participantKind: 'agent', agentId: world.risk.id }),
  );
  assert.equal(overBudget.status, 429);
  assert.equal(overBudget.body.error, 'meeting_budget_exhausted');

  // A meeting in another universe is a 404, not a 403: the caller learns nothing
  // about whether it exists.
  const foreign = api(world, world.rival).handle({ method: 'GET', path: `/meetings/${meetingId}` });
  assert.equal(foreign.status, 404);

  const unknownRoute = api(world).handle({ method: 'GET', path: '/nope' });
  assert.equal(unknownRoute.status, 404);
  assert.equal(unknownRoute.body.error, 'no_such_route');
});

test('pausing an agent over the API needs supervision and a reason', () => {
  const world = boardroomWorld();

  const denied = api(world, world.analyst).handle(
    post(`/agents/${world.coordinator.id}/pause`, { reason: 'Trying without authority.' }),
  );
  assert.equal(denied.status, 403);

  const missingReason = api(world).handle(post(`/agents/${world.coordinator.id}/pause`, {}));
  assert.equal(missingReason.status, 422);
  assert.equal(missingReason.body.error, 'agent_control_requires_target');

  const paused = api(world).handle(
    post(`/agents/${world.coordinator.id}/pause`, { reason: 'Paused during the contract review.' }),
  );
  assert.equal(paused.status, 201);
  assert.equal(
    codeOf(() =>
      world.xiv.queueTask(world.founder, {
        assignedAgentId: world.coordinator.id,
        title: 'Work after the API pause',
        description: 'Should not queue.',
        rollbackPlan: 'Discard.',
      }),
    ),
    'agent_control_state_blocked',
  );
});
