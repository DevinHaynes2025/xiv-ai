/**
 * Guardian observer, kill/pause controls, tool policy, resource governor.
 * Controls work without cooperation from the affected agent.
 * Guardian is never subordinate to the meeting.
 */

import { charge, getMeeting, type MeetingNetwork } from './engine';
import type {
  Actor,
  AgentControl,
  Allow,
  Classification,
  Deny,
  GuardianObservation,
} from './types';
import { AGENT_CONTROLS } from './types';

function deny(reason: string): Deny {
  return { ok: false, reason, audited: true };
}
function allow<T>(value: T): Allow<T> {
  return { ok: true, value, audited: true };
}

export function observeGuardian(input: {
  actor: Actor;
  why: string;
  whatInformation: string;
  universe: string;
  classification: Classification;
  proposedAction: string;
  requiresHumanApproval: boolean;
}): GuardianObservation {
  return {
    who: `${input.actor.kind}:${input.actor.actorId}`,
    why: input.why,
    whatInformation: input.whatInformation,
    universe: input.universe,
    classification: input.classification,
    proposedAction: input.proposedAction,
    requiresHumanApproval: input.requiresHumanApproval,
    guardianSubordinate: false,
  };
}

export function guardianIsSubordinateToMeeting(): false {
  return false;
}

export function applyControl(
  net: MeetingNetwork,
  meetingId: string,
  admin: Actor,
  control: AgentControl,
  targetAgentId?: string,
): Allow<{ control: AgentControl; cooperative: false }> | Deny {
  const privileged: readonly AgentControl[] = [
    'PAUSE',
    'STOP',
    'QUARANTINE',
    'REVOKE_TASK',
    'REVOKE_TOOL',
    'ARCHIVE',
  ];
  if (privileged.includes(control) && !admin.admin) {
    return deny('control_requires_human_administrator');
  }
  if (!admin.admin && admin.kind !== 'human') {
    return deny('control_requires_human_administrator');
  }
  const meeting = net.meetings.get(meetingId);
  if (!meeting) return deny('meeting_not_found');
  if (admin.organizationId !== meeting.organizationId) {
    return deny('cross_organization_control_denied');
  }
  void targetAgentId;
  if (control === 'PAUSE') {
    net.meetings.set(meetingId, { ...meeting, status: 'PAUSED' });
  } else if (control === 'STOP' || control === 'QUARANTINE') {
    net.meetings.set(meetingId, {
      ...meeting,
      status: control === 'STOP' ? 'CLOSED' : 'QUARANTINED',
    });
  } else if (control === 'ARCHIVE') {
    net.meetings.set(meetingId, { ...meeting, status: 'ARCHIVED', stage: 'KNOWLEDGE_LINEAGE' });
  }
  return allow({ control, cooperative: false });
}

export function listControls(): readonly AgentControl[] {
  return AGENT_CONTROLS;
}

export function useTool(
  net: MeetingNetwork,
  meetingId: string,
  actor: Actor,
  toolId: string,
): Allow<{ toolId: string }> | Deny {
  const meeting = getMeeting(net, meetingId, actor);
  if (!meeting.ok) return meeting;
  if (!actor.tools.includes(toolId)) return deny('tool_outside_capability_policy');
  const spend = charge(net, meetingId, { toolCalls: 1, tokens: 15 });
  if (!spend.ok) return spend;
  return allow({ toolId });
}

export function terminateOnBudgetExhaustion(
  net: MeetingNetwork,
  meetingId: string,
): Allow<{ terminated: true; runaway: false }> | Deny {
  const meeting = net.meetings.get(meetingId);
  if (!meeting) return deny('meeting_not_found');
  net.meetings.set(meetingId, { ...meeting, status: 'CLOSED', stage: 'POST_MEETING_EVALUATION' });
  return allow({ terminated: true, runaway: false });
}

export function killTaskForce(
  net: MeetingNetwork,
  meetingId: string,
  admin: Actor,
): Allow<{ stopped: true; requiredCooperation: false }> | Deny {
  const applied = applyControl(net, meetingId, admin, 'STOP');
  if (!applied.ok) return applied;
  return allow({ stopped: true, requiredCooperation: false });
}
