import assert from 'node:assert/strict';
import { test } from 'node:test';

import { runSupplyChainTaskForceDemonstration } from '../demonstration';
import { HUMAN_JUDGMENT_REQUIRED } from '../human-bridge';
import { provenanceOf, XACP_PHASES } from '../xacp';
import { codeOf, fixedClock, sequentialIds } from './harness';

function demonstration() {
  return runSupplyChainTaskForceDemonstration({ clock: fixedClock(), nextId: sequentialIds() });
}

test('human, universe, coordinator, specialists, meeting, recommendation, approval, audited result', () => {
  const run = demonstration();

  // Human -> XIV Universe
  const universe = run.civilization.readUniverse(run.executive);
  assert.equal(universe.createdBy, run.founder.userId);
  assert.equal(universe.lifecycleStage, 'operational');

  // -> Coordinator Agent -> specialist agents
  assert.equal(run.coordinator.profession, 'coordination');
  assert.equal(run.specialists.length, 8);
  assert.equal(
    run.specialists.every((agent) => agent.parentAgentId === run.coordinator.id),
    true,
  );
  assert.equal(
    run.specialists.every((agent) => agent.humanSupervisorId === run.executive.userId),
    true,
  );

  // -> private agent meeting -> evidence exchange
  assert.equal(run.meeting.securityClassification, 'confidential');
  assert.equal(run.conversation.length, 4);
  assert.equal(
    run.conversation.every((message) => message.evidence.length > 0 && message.reasoningArtifact.length > 0),
    true,
  );

  // -> recommendation
  assert.ok(run.recommendation.situation);
  assert.equal(run.recommendation.alternatives.length, 3);
  assert.ok(run.recommendation.risk);
  assert.ok(run.recommendation.requiredApproval);

  // -> human approval -> audited result
  assert.equal(run.auditedResult.taskStatus, 'completed');
  assert.equal(run.auditedResult.approvedBy, run.executive.userId);
  assert.equal(run.auditedResult.meetingDecisionBy, run.executive.userId);
  assert.ok(run.auditTrail.length > 0);
});

test('the protocol walk covers every XACP phase with complete provenance', () => {
  const run = demonstration();

  const phases = run.protocolWalk.map((message) => message.phase);
  assert.deepEqual(phases, XACP_PHASES.filter((phase) => phase !== 'archive'));

  for (const message of run.protocolWalk) {
    const provenance = provenanceOf(message);
    assert.ok(provenance.sender, 'every message names a sender');
    assert.ok(provenance.receiver, 'every message names a receiver');
    assert.equal(provenance.universe, run.executive.universeId);
    assert.ok(provenance.purpose);
    assert.ok(provenance.reasoningArtifact);
  }

  const report = run.protocolWalk[run.protocolWalk.length - 1];
  assert.equal(report.phase, 'report');
  assert.equal(report.decision, 'recommend_partial_reallocation');
  assert.equal(report.approvalStatus, 'pending');
  assert.ok((report.confidence ?? 0) > 0);
});

test('the room escalates to a human rather than resolving its own disagreement', () => {
  const run = demonstration();

  assert.equal(run.humanJudgmentStatement, HUMAN_JUDGMENT_REQUIRED);
  assert.deepEqual(run.meeting.unresolvedDisagreements, [
    'Q4 demand is a forecast, so the cost of reallocation is not yet bounded',
  ]);

  const escalation = run.auditTrail.find((event) => event.eventKind === 'meeting_escalated_to_human');
  assert.equal(escalation?.detail.reason, HUMAN_JUDGMENT_REQUIRED);
});

test('the human decision is an attributable governance record', () => {
  const run = demonstration();

  const decision = run.auditTrail.find((event) => event.eventKind === 'meeting_decided');
  assert.equal(decision?.actorUserId, run.executive.userId);
  assert.equal(
    decision?.decision,
    'Approve partial reallocation and open a separate review of carrier dependency',
  );

  const approval = run.auditTrail.find((event) => event.eventKind === 'task_approved');
  assert.equal(approval?.actorUserId, run.executive.userId);
  assert.equal(approval?.decision, 'approved');
});

test('no tool ran without approval and the consequential step waited', () => {
  const run = demonstration();

  const task = run.civilization.listTasks(run.executive).find((item) => item.id === run.approvedTaskId);
  assert.ok(task);
  assert.equal(task?.requiresHumanApproval, true);
  assert.ok(task?.approvedAt);
  assert.ok(task?.approvedBy);
  assert.ok(task?.rollbackPlan, 'an approval-gated task always states how it would be undone');
  assert.equal(run.auditedResult.scheduledAwaitingApproval, 1);

  const order = run.auditTrail
    .filter((event) => ['task_queued', 'task_scheduled', 'task_approved', 'task_completed'].includes(event.eventKind))
    .map((event) => event.eventKind);
  assert.deepEqual(order, ['task_queued', 'task_scheduled', 'task_approved', 'task_completed']);
});

test('the evaluation gate ran before any agent held runtime', () => {
  const run = demonstration();

  for (const agent of [run.coordinator, ...run.specialists]) {
    const gate = run.civilization.activationGateStatus(agent.id);
    assert.deepEqual(gate.missing, []);
    assert.deepEqual(gate.failed, []);
    assert.equal(gate.ready, true);
  }

  const activationOrder = run.auditTrail
    .filter((event) => event.eventKind === 'agent_evaluated' || event.eventKind === 'agent_activated')
    .filter((event) => event.subjectAgentId === run.coordinator.id)
    .map((event) => event.eventKind);
  assert.deepEqual(activationOrder, ['agent_evaluated', 'agent_evaluated', 'agent_activated']);
});

test('agents sleep after the task force dissolves', () => {
  const run = demonstration();

  const agents = run.civilization.listAgents(run.executive);
  assert.equal(
    agents.every((agent) => agent.lifecycleState === 'sleeping'),
    true,
    'no agent stays resident merely because it once ran',
  );

  const taskForce = run.civilization.listTaskForces(run.executive)[0];
  assert.equal(taskForce.status, 'archived');
  assert.ok(taskForce.dissolvedAt);
});

test('cost telemetry accounts for the work that ran', () => {
  const run = demonstration();

  const telemetry = run.civilization.costTelemetry(run.executive);
  assert.equal(telemetry.consumedCostMicroUsd, 118_400);
  assert.equal(telemetry.consumedTasks, 1);
  assert.equal(telemetry.maxCostMicroUsd, 2_000_000);
  assert.ok(telemetry.utilization > 0 && telemetry.utilization < 1);
  assert.equal(run.costMicroUsd, telemetry.consumedCostMicroUsd);
});

test('the decision can be traced back to the evidence it rested on', () => {
  const run = demonstration();

  const portClosure = run.civilization
    .listKnowledgeSources(run.executive)
    .find((source) => source.title === 'Port of Rotterdam berth closure notice');
  assert.ok(portClosure);

  const trace = run.civilization.traceLineage(run.executive, portClosure.id);
  assert.equal(trace.whereItCameFrom, 'carrier notice forwarded by the operations director');
  assert.deepEqual(trace.stages, ['origin', 'decision']);
  assert.deepEqual(trace.whichDecisionsDependedOnIt, [run.approvedTaskId]);
  assert.deepEqual(trace.whoChangedIt, [run.executive.userId]);
});

test('a historical source informs the room without becoming a modern instruction', () => {
  const run = demonstration();

  const sources = run.civilization.listKnowledgeSources(run.executive);
  const historical = sources.find((source) => source.era === 'medieval');
  const derived = sources.find((source) => source.origin === `derived_from:${historical?.id}`);

  assert.equal(historical?.claimKind, 'historical_evidence');
  assert.ok(historical?.originalText, 'the original survives its translation');
  assert.notEqual(historical?.translation, historical?.interpretation);
  assert.equal(derived?.claimKind, 'agent_inference');
  assert.equal(derived?.era, 'present');
});

test('the whole demonstration stays inside one universe', () => {
  const run = demonstration();

  const trail = run.auditTrail;
  assert.equal(
    trail.every((event) => event.universeId === run.executive.universeId),
    true,
  );

  const outsider = { userId: 'human-nobody', universeId: run.executive.universeId };
  assert.equal(codeOf(() => run.civilization.auditTrail(outsider)), 'tenancy_not_a_member');
  assert.equal(codeOf(() => run.civilization.listMeetings(outsider)), 'tenancy_not_a_member');
});

test('the orbital runtime interface exists and was never used', () => {
  const run = demonstration();

  const nodes = run.civilization.listRuntimeNodes(run.founder);
  const orbital = nodes.find((node) => node.platformClass === 'orbital_compute');

  assert.ok(orbital, 'the interface exists so the architecture does not need redesigning later');
  assert.equal(orbital?.status, 'unconfigured_external');
  assert.equal(orbital?.isExternalUnconfigured, true);
  assert.equal(
    run.civilization.listAgents(run.founder).some((agent) => agent.modelRuntime === orbital?.nodeKey),
    false,
  );
});

test('a second run of the same demonstration produces the same audited outcome', () => {
  const first = demonstration();
  const second = demonstration();

  assert.equal(first.auditTrail.length, second.auditTrail.length);
  assert.deepEqual(
    first.auditTrail.map((event) => event.eventKind),
    second.auditTrail.map((event) => event.eventKind),
  );
  assert.deepEqual(first.auditedResult, second.auditedResult);
});
