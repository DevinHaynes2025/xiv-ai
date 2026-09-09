/**
 * AgentMission status transition matrix.
 * Authority self-escalation is never allowed.
 */

import type { AgentMission, AgentMissionStatus, AgentMissionStatusTransition } from './types';

const ALLOWED: Readonly<Record<AgentMissionStatus, readonly AgentMissionStatus[]>> = {
  DRAFT: ['QUEUED', 'CANCELLED'],
  QUEUED: ['CLAIMED', 'CANCELLED'],
  CLAIMED: ['RUNNING', 'FAILED', 'ORPHANED', 'CANCELLED'],
  RUNNING: ['CHECKPOINTING', 'COMPLETED', 'FAILED', 'HANDED_OFF', 'ORPHANED'],
  CHECKPOINTING: ['RUNNING', 'FAILED', 'ORPHANED', 'HANDED_OFF'],
  HANDED_OFF: ['QUEUED', 'COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  FAILED: ['RETRY_WAIT', 'QUARANTINED', 'CANCELLED'],
  RETRY_WAIT: ['QUEUED', 'QUARANTINED', 'CANCELLED'],
  QUARANTINED: ['CANCELLED'],
  CANCELLED: [],
  ORPHANED: ['QUEUED', 'QUARANTINED', 'FAILED', 'CANCELLED'],
};

export function listAllowedTransitions(from: AgentMissionStatus): readonly AgentMissionStatus[] {
  return ALLOWED[from];
}

export function evaluateTransition(
  from: AgentMissionStatus,
  to: AgentMissionStatus,
): AgentMissionStatusTransition {
  const allowed = ALLOWED[from].includes(to);
  return {
    from,
    to,
    allowed,
    reason: allowed ? undefined : `transition_${from}_to_${to}_denied`,
  };
}

export function transitionMission(
  mission: AgentMission,
  to: AgentMissionStatus,
  nowIso: string,
): { ok: true; mission: AgentMission } | { ok: false; reason: string } {
  const gate = evaluateTransition(mission.status, to);
  if (!gate.allowed) {
    return { ok: false, reason: gate.reason ?? 'transition_denied' };
  }
  return {
    ok: true,
    mission: {
      ...mission,
      status: to,
      updatedAt: nowIso,
    },
  };
}

export function agentMayEscalateOwnAuthority(_mission: AgentMission): false {
  return false;
}

export function openTransitionAudit(input: {
  mission: AgentMission;
  to: AgentMissionStatus;
}): { allowed: boolean; audited: true; reason?: string } {
  const gate = evaluateTransition(input.mission.status, input.to);
  return { allowed: gate.allowed, audited: true, reason: gate.reason };
}
