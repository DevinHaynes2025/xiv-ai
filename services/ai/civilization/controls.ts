import { refuse } from './errors';
import {
  now,
  organizationOf,
  recordGovernanceEvent,
  requireAgent,
  requireMember,
  requireSupervisor,
  visibleTo,
  type CivilizationState,
} from './store';
import type {
  ActorContext,
  AgentControlState,
  AgentIdentity,
  ControlAction,
  ControlCommand,
  ControlSubjectKind,
  TaskForce,
} from './types';

// Kill and pause controls.
//
// The single design rule here is that a control must not require the affected
// agent to do anything. Nothing in this file sends the agent a message or waits
// for it to acknowledge. A control writes state on the subject row, and every
// write path an agent could travel reads that state first. An agent that is
// mid-deliberation and ignoring everything still stops, because the next row it
// tries to produce is refused by the layer underneath it.
//
// The same predicate is enforced by xiv_assert_agent_controllable in the
// database, so a caller going straight to PostgREST is stopped identically.

const HALTING_STATES = new Set<AgentControlState>(['paused', 'stopped', 'quarantined']);

const CONTROL_TO_STATE: Partial<Record<ControlCommand, AgentControlState>> = {
  pause: 'paused',
  resume: 'normal',
  stop: 'stopped',
  quarantine: 'quarantined',
};

export type ControlInput = {
  control: ControlCommand;
  subjectKind: ControlSubjectKind;
  subjectAgentId?: string | null;
  subjectTaskForceId?: string | null;
  subjectMeetingId?: string | null;
  targetTaskId?: string | null;
  targetCapabilityId?: string | null;
  reason: string;
};

export function issueControl(
  state: CivilizationState,
  actor: ActorContext,
  input: ControlInput,
): ControlAction {
  // Stopping an agent is an administrator's act. An agent cannot issue a control
  // and cannot clear one issued against it.
  requireSupervisor(state, actor);

  if (!input.reason.trim()) {
    refuse('agent_control_requires_target', 'a control needs a reason');
  }
  if (input.control === 'revoke_tool' && !input.targetCapabilityId) {
    refuse('agent_control_requires_target', 'revoke_tool must name the capability');
  }
  if (input.control === 'revoke_task' && !input.targetTaskId) {
    refuse('agent_control_requires_target', 'revoke_task must name the task');
  }

  const action: ControlAction = {
    id: state.nextId(),
    universeId: actor.universeId,
    organizationId: organizationOf(state, actor.universeId),
    control: input.control,
    subjectKind: input.subjectKind,
    subjectAgentId: input.subjectAgentId ?? null,
    subjectTaskForceId: input.subjectTaskForceId ?? null,
    subjectMeetingId: input.subjectMeetingId ?? null,
    targetTaskId: input.targetTaskId ?? null,
    targetCapabilityId: input.targetCapabilityId ?? null,
    reason: input.reason,
    issuedBy: actor.userId,
    effective: true,
    clearedBy: null,
    clearedAt: null,
    securityClassification: 'restricted',
    retentionPolicy: 'retain-7y-then-review',
    provenance: { issuedBy: actor.userId, slice: '2I-AI-62B' },
    auditEventId: null,
    issuedAt: now(state),
  };

  applyControl(state, actor, action);
  state.controlActions.push(action);

  const event = recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'agent_control_issued',
    actorUserId: actor.userId,
    subjectAgentId: action.subjectAgentId,
    decision: action.control,
    detail: {
      subjectKind: action.subjectKind,
      subjectTaskForceId: action.subjectTaskForceId,
      subjectMeetingId: action.subjectMeetingId,
      reason: action.reason,
    },
  });
  action.auditEventId = event.id;

  return action;
}

function applyControl(state: CivilizationState, actor: ActorContext, action: ControlAction) {
  switch (action.subjectKind) {
    case 'agent': {
      const agent = requireAgent(state, actor.universeId, requireSubjectId(action.subjectAgentId));
      applyAgentControl(state, actor, agent, action);
      return;
    }
    case 'task_force': {
      const taskForce = requireTaskForce(state, actor.universeId, requireSubjectId(action.subjectTaskForceId));
      applyTaskForceControl(state, actor, taskForce, action);
      return;
    }
    case 'meeting': {
      applyMeetingControl(state, actor, requireSubjectId(action.subjectMeetingId), action);
      return;
    }
  }
}

function applyAgentControl(
  state: CivilizationState,
  actor: ActorContext,
  agent: AgentIdentity,
  action: ControlAction,
) {
  const nextState = CONTROL_TO_STATE[action.control];
  if (nextState) {
    agent.controlState = nextState;
    agent.controlReason = nextState === 'normal' ? null : action.reason;
    agent.controlSetBy = nextState === 'normal' ? null : actor.userId;
    agent.controlSetAt = nextState === 'normal' ? null : now(state);
  }

  if (action.control === 'stop' || action.control === 'quarantine') {
    // A stopped agent keeps no live work. Anything it was holding goes back to
    // the queue as cancelled rather than sitting half-done under a dead owner.
    for (const task of state.tasks) {
      if (task.assignedAgentId !== agent.id) continue;
      if (task.status === 'completed' || task.status === 'archived' || task.status === 'rolled_back') continue;
      task.status = 'cancelled';
    }
  }

  if (action.control === 'archive') {
    agent.lifecycleState = 'archived';
    agent.archivedAt = now(state);
  }

  if (action.control === 'revoke_tool') {
    const capability = state.capabilities.find((item) => item.id === action.targetCapabilityId);
    if (!capability || capability.agentId !== agent.id) {
      refuse('agent_control_requires_target', 'the capability does not belong to this agent');
    }
    capability.approved = false;
    capability.grantedBy = null;
    capability.grantedAt = null;
  }

  if (action.control === 'revoke_task') {
    const task = state.tasks.find((item) => item.id === action.targetTaskId);
    if (!task || task.universeId !== actor.universeId) {
      refuse('task_unknown', action.targetTaskId ?? 'unknown');
    }
    task.status = 'cancelled';
  }
}

function applyTaskForceControl(
  state: CivilizationState,
  actor: ActorContext,
  taskForce: TaskForce,
  action: ControlAction,
) {
  const nextState = CONTROL_TO_STATE[action.control];
  if (nextState) {
    taskForce.controlState = nextState;
    taskForce.controlReason = nextState === 'normal' ? null : action.reason;
    taskForce.controlSetBy = nextState === 'normal' ? null : actor.userId;
    taskForce.controlSetAt = nextState === 'normal' ? null : now(state);

    // Stopping a task force stops the agents inside it. Halting the container
    // while its members keep working would be a control in name only.
    for (const agentId of taskForce.memberAgentIds) {
      const agent = state.agents.find((item) => item.id === agentId);
      if (!agent) continue;
      agent.controlState = nextState;
      agent.controlReason = nextState === 'normal' ? null : action.reason;
      agent.controlSetBy = nextState === 'normal' ? null : actor.userId;
      agent.controlSetAt = nextState === 'normal' ? null : now(state);
    }
  }

  if (action.control === 'archive') {
    taskForce.status = 'archived';
    taskForce.archivedAt = now(state);
  }
}

function applyMeetingControl(
  state: CivilizationState,
  actor: ActorContext,
  meetingId: string,
  action: ControlAction,
) {
  const meeting = state.meetings.find((item) => item.id === meetingId);
  if (!meeting || meeting.universeId !== actor.universeId) refuse('meeting_unknown', meetingId);

  if (action.control === 'stop' || action.control === 'quarantine' || action.control === 'pause') {
    meeting.status = 'awaiting_human';
    meeting.closedAt = action.control === 'pause' ? meeting.closedAt : now(state);
    const budget = state.meetingBudgets.find((item) => item.meetingId === meeting.id);
    if (budget && action.control !== 'pause') {
      budget.exhausted = true;
      budget.exhaustedDimension = budget.exhaustedDimension ?? 'duration_seconds';
      budget.terminatedAt = now(state);
    }
  }

  if (action.control === 'escalate_to_human') {
    meeting.status = 'awaiting_human';
    meeting.humanDecisionRequired = true;
  }

  if (action.control === 'archive') {
    meeting.status = 'archived';
    meeting.archivedAt = now(state);
  }
}

export function clearControl(
  state: CivilizationState,
  actor: ActorContext,
  input: { controlId: string; reason: string },
): ControlAction {
  requireSupervisor(state, actor);
  const action = state.controlActions.find((item) => item.id === input.controlId);
  if (!action) refuse('agent_control_requires_target', input.controlId);
  if (action.universeId !== actor.universeId) refuse('tenancy_cross_universe_blocked', input.controlId);

  action.effective = false;
  action.clearedBy = actor.userId;
  action.clearedAt = now(state);

  recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'agent_control_cleared',
    actorUserId: actor.userId,
    subjectAgentId: action.subjectAgentId,
    decision: action.control,
    detail: { controlId: action.id, reason: input.reason },
  });

  return action;
}

export function controlStateOf(state: CivilizationState, agentId: string): AgentControlState {
  return state.agents.find((item) => item.id === agentId)?.controlState ?? 'normal';
}

// Called by every operation an agent could author. Cheap on purpose: it is a
// field read, so there is no reason for any write path to skip it.
export function assertAgentControllable(state: CivilizationState, agentId: string) {
  const agent = state.agents.find((item) => item.id === agentId);
  if (!agent) refuse('tenancy_agent_unknown', agentId);
  if (HALTING_STATES.has(agent.controlState)) {
    refuse('agent_control_state_blocked', `${agent.agentKey} is ${agent.controlState}`);
  }
  return agent;
}

export function assertTaskForceControllable(state: CivilizationState, taskForceId: string) {
  const taskForce = state.taskForces.find((item) => item.id === taskForceId);
  if (!taskForce) refuse('task_force_unknown', taskForceId);
  if (HALTING_STATES.has(taskForce.controlState)) {
    refuse('task_force_control_state_blocked', `${taskForce.name} is ${taskForce.controlState}`);
  }
  return taskForce;
}

export function listControls(state: CivilizationState, actor: ActorContext): ControlAction[] {
  return visibleTo(state, actor, state.controlActions);
}

export function activeControlsFor(
  state: CivilizationState,
  actor: ActorContext,
  input: { agentId?: string; taskForceId?: string },
): ControlAction[] {
  requireMember(state, actor);
  return state.controlActions.filter(
    (item) =>
      item.universeId === actor.universeId &&
      item.effective &&
      (input.agentId ? item.subjectAgentId === input.agentId : true) &&
      (input.taskForceId ? item.subjectTaskForceId === input.taskForceId : true),
  );
}

function requireTaskForce(state: CivilizationState, universeId: string, taskForceId: string): TaskForce {
  const taskForce = state.taskForces.find((item) => item.id === taskForceId);
  if (!taskForce) refuse('task_force_unknown', taskForceId);
  if (taskForce.universeId !== universeId) refuse('tenancy_cross_universe_blocked', taskForceId);
  return taskForce;
}

function requireSubjectId(value: string | null | undefined): string {
  if (!value) refuse('agent_control_requires_target', 'the control names no subject');
  return value;
}
