import assert from 'node:assert/strict';
import { test } from 'node:test';

import { runContestedSupplierDecision, REQUIRED_DEMONSTRATION_STAGES } from '../demonstration-62b';
import { REQUIRED_SYNTHESIS_ROLES } from '../xarp';
import { codeOf, fixedClock, sequentialIds } from './harness';

function demonstration() {
  return runContestedSupplierDecision({ clock: fixedClock(), nextId: sequentialIds() });
}

// The definition of done for 2I-AI-62B, asserted against a run of the real
// layer rather than a description of one.

test('the meeting walks every stage of the lifecycle, in order and only forward', () => {
  const run = demonstration();

  assert.deepEqual(run.stagesWalked, [...REQUIRED_DEMONSTRATION_STAGES]);
  assert.equal(run.meeting.lifecycleStage, 'knowledge_lineage');

  // The lifecycle is one-way. The room cannot be walked back to re-open a stage
  // it has already left.
  assert.equal(
    codeOf(() =>
      run.civilization.advanceStage(run.founder, { meetingId: run.meeting.id, stage: 'debate' }),
    ),
    'meeting_lifecycle_regression',
  );
});

test('the room reasoned with every required XARP duty filled', () => {
  const run = demonstration();
  for (const role of REQUIRED_SYNTHESIS_ROLES) {
    assert.ok(run.synthesis.rolesPresent.includes(role), `${role} was not filled`);
  }
  assert.deepEqual(run.synthesis.rolesMissing, []);
});

test('the executive received alternatives and a live disagreement, not a consensus', () => {
  const run = demonstration();

  assert.equal(run.synthesis.alternatives.length, 2);
  assert.equal(run.rejectedOptionKey, 'A');

  // The finance objection was blocking and unresolved at synthesis, so it
  // reached the executive intact.
  assert.equal(run.synthesis.preservedDisagreements.length, 1);
  assert.equal(run.synthesis.preservedDisagreements[0].severity, 'blocking');
  assert.match(run.synthesis.preservedDisagreements[0].position, /divisional ceiling/);

  // And the room said out loud that it needed a person, with its reasons.
  assert.equal(run.synthesis.humanDecisionRequired, true);
  assert.ok(run.synthesis.reasons.some((reason) => /blocking objection is unresolved/.test(reason)));
  assert.ok(run.synthesis.reasons.some((reason) => /insufficient_evidence/.test(reason)));

  // The disagreement is carried into the decision record too, so it survives
  // past the meeting that produced it.
  assert.equal(run.decision.preservedDisagreements.length, 1);
  assert.equal(run.decision.alternatives.length, 2);
});

test('confidence is stated, bounded, and lower than the option was proposed at', () => {
  const run = demonstration();

  assert.ok(run.synthesis.confidence > 0 && run.synthesis.confidence < 1);
  assert.equal(run.decision.xivConfidence, run.synthesis.confidence);

  // Option B was proposed at 0.79 by its own author. The blocking objection and
  // the opposing evidence cost it, so the number the executive sees is not the
  // number the proposing agent asked for.
  const optionB = run.synthesis.alternatives.find((item) => item.optionKey === 'B');
  assert.ok((optionB?.confidence ?? 1) < 0.79);
});

test('a named human decided, and the machine recommendation sits beside the decision', () => {
  const run = demonstration();

  assert.equal(run.decision.decidedByUserId, run.founder.userId);
  assert.equal(run.decision.decisionKind, 'approved');
  assert.ok(run.decision.rationale.length > 0);

  // The recommendation is recorded as XIV's, not as the decision itself.
  assert.ok(run.decision.xivRecommendation.length > 0);
  assert.notEqual(run.decision.xivRecommendation, run.decision.rationale);

  // The approval is a first-class record pointing at what it approved.
  const approval = run.civilization
    .listHumanKnowledge(run.founder)
    .find((item) => item.id === run.humanApprovalRecordId);
  assert.equal(approval?.category, 'HUMAN_APPROVAL');
  assert.equal(approval?.approvesDecisionId, run.decision.id);
});

test('nothing executed without a named approver and a rollback plan', () => {
  const run = demonstration();

  assert.equal(run.action.status, 'completed');
  assert.equal(run.action.approvedBy, run.founder.userId);
  assert.ok(run.action.rollbackPlan && run.action.rollbackPlan.length > 0);

  // The number the morning brief reports, computed from the record.
  assert.equal(run.unauthorizedActionsExecuted, 0);
});

test('the outcome was measured against what was predicted, and fed back', () => {
  const run = demonstration();

  const outcome = run.civilization.listMeetingOutcomes(run.founder)[0];
  assert.equal(outcome.horizonDays, 90);
  assert.equal(outcome.predicted.cost_increase_pct, 18);
  assert.equal(outcome.observed.cost_increase_pct, 14);
  assert.equal(outcome.metrics.cost_increase_pct_delta, -4);
  assert.equal(run.outcomeGrade, 'successful');

  // Only the agents whose work carried the decision are graded on it.
  assert.deepEqual(
    run.reputationAfter.map((item) => item.agentId).sort(),
    [run.agents.coordinator.id, run.agents.demand.id, run.agents.finance.id].sort(),
  );

  // Reputation still grants nothing. No capability exists in this universe.
  assert.equal(run.civilization.listCapabilities(run.founder).length, 0);
});

test('the whole decision reconstructs from stored rows', () => {
  const run = demonstration();
  const memory = run.civilization.reconstructMeeting(run.founder, run.meeting.id);

  assert.match(memory.problem, /dual-source/i);
  assert.equal(memory.temporalContext?.location, 'Osaka');
  assert.equal(memory.participants.length, 6);
  assert.equal(memory.evidence.length, 2);
  assert.ok(memory.arguments.length >= 3);
  assert.equal(memory.alternatives.length, 2);
  assert.equal(memory.objections.length, 1);
  assert.equal(memory.votes.length, 2);
  assert.equal(memory.decision?.id, run.decision.id);
  assert.equal(memory.approval?.by, run.founder.userId);
  assert.equal(memory.actions.length, 1);
  assert.equal(memory.outcomes.length, 1);
  assert.ok(memory.guardianObservations.length >= 1);

  // Every piece of evidence names where it came from and what would undermine it.
  for (const item of memory.evidence) {
    assert.ok(item.source.length > 0);
    assert.ok(Object.keys(item.provenance).length > 0);
    assert.ok(item.counterargument.length > 0);
    assert.ok(item.risk.length > 0);
    assert.ok(item.unknowns.length > 0);
  }

  // The Japanese original survived the translation that sits beside it.
  const translated = memory.arguments.find((item) => item.originalLanguage === 'ja');
  assert.equal(translated?.originalText, '第二ラインは六時間停止しました。');
  assert.equal(translated?.translationLanguage, 'en');
  assert.ok(translated?.culturalContext && translated.culturalContext.length > 0);
  assert.notEqual(translated?.culturalContext, translated?.factualClaim);
});

test('the audit trail names who, what and why at every consequential step', () => {
  const run = demonstration();
  const kinds = run.auditTrail.map((event) => event.eventKind);

  for (const expected of [
    'meeting_stage_advanced',
    'meeting_evidence_submitted',
    'meeting_proposal_recorded',
    'meeting_objection_raised',
    'meeting_objection_resolved',
    'meeting_proposal_vote',
    'meeting_synthesized',
    'meeting_decided',
    'meeting_action_queued',
    'meeting_action_authorized',
    'meeting_outcome_recorded',
    'meeting_budget_set',
    'guardian_observation',
    'human_knowledge_recorded',
    'agent_reputation_updated',
  ]) {
    assert.ok(kinds.includes(expected as never), `the audit trail is missing ${expected}`);
  }

  // Every event is attributable to a human, which is what makes the trail usable
  // in a review rather than merely voluminous.
  for (const event of run.auditTrail) {
    assert.ok(event.actorUserId || event.subjectAgentId, `${event.eventKind} names nobody`);
  }

  // The decision event carries the disagreement, not only the choice.
  const decided = run.auditTrail.find((event) => event.eventKind === 'meeting_decided');
  const preserved = (decided?.detail as { preservedDisagreements: string[] }).preservedDisagreements;
  assert.equal(preserved.length, 1);
  assert.match(preserved[0], /divisional ceiling/);
});

test('the demonstration is deterministic', () => {
  const first = demonstration();
  const second = demonstration();

  assert.equal(first.synthesis.confidence, second.synthesis.confidence);
  assert.deepEqual(first.stagesWalked, second.stagesWalked);
  assert.deepEqual(
    first.auditTrail.map((event) => event.eventKind),
    second.auditTrail.map((event) => event.eventKind),
  );
});
