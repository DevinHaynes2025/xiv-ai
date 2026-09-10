/**
 * Energy-aware agent society invariants.
 * L4 false, no always-on, debrief does not auto-promote, energy exhaustion stops meetings.
 */
import assert from 'node:assert/strict';

import {
  agentSocietyStatus,
  architectureExistsMeans247Live,
  alwaysOnBurningSilicon,
  createEnergyBudget,
  chargeEnergy,
  createSocietyMeeting,
  runSocietyTurn,
  stopMeetingOnEnergyExhaustion,
  societyL4Enabled,
  debriefAutoPromotesToGlobalBrain,
  extractLessonCandidatesFromDebrief,
  enqueueLessonCandidates,
  createLearningLoopStore,
  listWaitingReview,
  promoteLessonToGlobalBrain,
  mayAutoRewriteAgentsMd,
  mayAutoRewriteGlobalTruth,
  defaultWeekdayDaytimeDutyCycle,
  resolveScheduleMode,
  overnightAllowsFullInference,
  scheduleIsAlwaysOn,
  L4_AUTONOMY_ENABLED,
  AGENT_SOCIETY_ALWAYS_ON,
} from './index';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('L4 autonomy is false', () => {
  assert.equal(L4_AUTONOMY_ENABLED, false);
  assert.equal(societyL4Enabled(), false);
  assert.equal(agentSocietyStatus().l4Enabled, false);
});

test('architecture exists does not mean 24/7 live; no always-on silicon burn', () => {
  assert.equal(architectureExistsMeans247Live(), false);
  assert.equal(alwaysOnBurningSilicon(), false);
  assert.equal(AGENT_SOCIETY_ALWAYS_ON, false);
  assert.equal(scheduleIsAlwaysOn(defaultWeekdayDaytimeDutyCycle()), false);
  assert.equal(agentSocietyStatus().alwaysOn, false);
  assert.equal(agentSocietyStatus().architectureMeans247Live, false);
});

test('weekday daytime active; overnight checkpoint/debrief unless incident', () => {
  assert.equal(resolveScheduleMode({ weekday: 2, hourLocal: 10 }), 'ACTIVE');
  assert.equal(resolveScheduleMode({ weekday: 2, hourLocal: 22 }), 'CHECKPOINT_DEBRIEF');
  assert.equal(resolveScheduleMode({ weekday: 0, hourLocal: 11 }), 'CHECKPOINT_DEBRIEF');
  assert.equal(overnightAllowsFullInference({ weekday: 2, hourLocal: 23 }), false);
  assert.equal(overnightAllowsFullInference({ weekday: 2, hourLocal: 23, incident: true }), true);
  assert.equal(resolveScheduleMode({ weekday: 2, hourLocal: 23, incident: true }), 'INCIDENT_WAKE');
});

test('debrief lessons wait for review and never auto-promote to global brain', () => {
  assert.equal(debriefAutoPromotesToGlobalBrain(), false);
  assert.equal(mayAutoRewriteAgentsMd(), false);
  assert.equal(mayAutoRewriteGlobalTruth(), false);

  const candidates = extractLessonCandidatesFromDebrief({
    debriefId: 'db-1',
    organizationId: 'org_a',
    universeId: 'u_a',
    lessons: ['prefer batch debriefs', ''],
    createdAt: '2026-09-09T12:00:00Z',
  });
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].state, 'WAITING_REVIEW');
  assert.equal(candidates[0].promotesToGlobalBrain, false);
  assert.equal(candidates[0].rewritesAgentsMd, false);

  let store = createLearningLoopStore();
  store = enqueueLessonCandidates(store, candidates);
  assert.equal(listWaitingReview(store).length, 1);

  const blocked = promoteLessonToGlobalBrain(candidates[0], false);
  assert.equal(blocked.ok, false);
  if (!blocked.ok) {
    assert.equal(blocked.reason, 'human_approval_required');
    assert.equal(blocked.state, 'WAITING_REVIEW');
  }

  const staged = promoteLessonToGlobalBrain(candidates[0], true);
  assert.equal(staged.ok, true);
  if (staged.ok) {
    assert.equal(staged.candidate.promotesToGlobalBrain, false);
    assert.equal(staged.candidate.rewritesGlobalTruth, false);
    assert.equal(staged.note, 'staged_only_not_applied');
  }
});

test('energy budget exhaustion stops meeting', () => {
  const meeting = createSocietyMeeting({
    meetingId: 'm-energy',
    organizationId: 'org_a',
    universeId: 'u_a',
    title: 'Energy stop',
    agenda: [
      { itemId: 'a1', title: 'cheap', estimatedCost: 1, consequential: false },
      { itemId: 'a2', title: 'expensive', estimatedCost: 5, consequential: false },
    ],
    participantIds: ['agent-a', 'agent-b'],
    turnLimit: 10,
    energyCeiling: 2,
  });

  const t1 = runSocietyTurn(meeting, { cost: 1 });
  assert.equal(t1.ok, true);

  const t2 = runSocietyTurn(t1.ok ? t1.meeting : meeting, { cost: 2 });
  assert.equal(t2.ok, false);
  if (!t2.ok) {
    assert.equal(t2.reason, 'energy_budget_exhausted');
    assert.equal(t2.meeting.status, 'STOPPED_ENERGY');
  }

  const stopped = stopMeetingOnEnergyExhaustion(meeting);
  assert.equal(stopped.status, 'STOPPED_ENERGY');

  const budget = createEnergyBudget({
    budgetId: 'b1',
    organizationId: 'org_a',
    universeId: 'u_a',
    ceiling: 1,
  });
  const over = chargeEnergy(budget, 2);
  assert.equal(over.ok, false);
  if (!over.ok) assert.equal(over.reason, 'energy_budget_exhausted');
});

test('consequential meeting actions require approval', () => {
  const meeting = createSocietyMeeting({
    meetingId: 'm-approval',
    organizationId: 'org_a',
    universeId: 'u_a',
    title: 'Approval gate',
    agenda: [{ itemId: 'c1', title: 'ship', estimatedCost: 1, consequential: true }],
    participantIds: ['agent-a'],
    turnLimit: 3,
    energyCeiling: 10,
  });
  const blocked = runSocietyTurn(meeting, { consequential: true, approved: false });
  assert.equal(blocked.ok, false);
  if (!blocked.ok) {
    assert.equal(blocked.reason, 'consequential_requires_approval');
    assert.equal(blocked.meeting.status, 'AWAITING_APPROVAL');
  }
  const allowed = runSocietyTurn(meeting, { consequential: true, approved: true, cost: 1 });
  assert.equal(allowed.ok, true);
});

console.log('agentsociety: all tests passed');
