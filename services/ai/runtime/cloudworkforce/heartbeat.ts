/**
 * Heartbeat + recovery with bounded retries → quarantine + founder attention.
 */

import type { AgentHeartbeat, AgentMission } from './types';
import { DEFAULT_MAX_RETRIES } from './types';
import type { DbBackedAgentMissionQueue } from './queue';

export function recordHeartbeat(input: {
  heartbeatId: string;
  missionId: string;
  leaseId: string;
  workerId: string;
  tenantId: string;
  universeId: string;
  at: string;
  healthy?: boolean;
}): AgentHeartbeat {
  return {
    heartbeatId: input.heartbeatId,
    missionId: input.missionId,
    leaseId: input.leaseId,
    workerId: input.workerId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    at: input.at,
    healthy: input.healthy ?? true,
  };
}

export function evaluateRecovery(input: {
  mission: AgentMission;
  missedHeartbeats: number;
  maxMissed?: number;
}):
  | { action: 'CONTINUE' }
  | { action: 'RETRY' }
  | { action: 'QUARANTINE_FOUNDER_ATTENTION'; reason: string } {
  const maxMissed = input.maxMissed ?? 3;
  if (input.missedHeartbeats >= maxMissed || input.mission.retryCount >= input.mission.maxRetries) {
    return {
      action: 'QUARANTINE_FOUNDER_ATTENTION',
      reason: 'bounded_retries_exhausted_founder_attention',
    };
  }
  if (input.missedHeartbeats > 0) {
    return { action: 'RETRY' };
  }
  return { action: 'CONTINUE' };
}

/**
 * Fail → retry until limit, then quarantine for founder attention.
 * Prefer explicit quarantine when recovery decision demands it.
 */
export function applyBoundedRecovery(
  queue: DbBackedAgentMissionQueue,
  input: {
    missionId: string;
    workerId: string;
    missedHeartbeats: number;
    nowIso: string;
    failReason?: string;
  },
): { ok: true; mission: AgentMission; action: string } | { ok: false; reason: string } {
  const mission = queue.getMission(input.missionId);
  if (!mission) return { ok: false, reason: 'mission_not_found' };
  const decision = evaluateRecovery({ mission, missedHeartbeats: input.missedHeartbeats });

  if (decision.action === 'CONTINUE') {
    return { ok: true, mission, action: 'CONTINUE' };
  }

  if (mission.status === 'RUNNING' || mission.status === 'CLAIMED' || mission.status === 'CHECKPOINTING') {
    const failed = queue.fail({
      missionId: input.missionId,
      workerId: input.workerId,
      reason: input.failReason ?? (decision.action === 'RETRY' ? 'missed_heartbeat' : decision.reason),
      nowIso: input.nowIso,
    });
    if (!failed.ok) return failed;
  }

  if (decision.action === 'RETRY') {
    const retried = queue.retry({ missionId: input.missionId, nowIso: input.nowIso });
    if (!retried.ok) return { ok: false, reason: retried.reason };
    return { ok: true, mission: retried.mission, action: 'RETRY' };
  }

  const current = queue.getMission(input.missionId);
  if (!current) return { ok: false, reason: 'mission_not_found' };
  if (current.status === 'QUARANTINED') {
    return { ok: true, mission: current, action: 'QUARANTINE_FOUNDER_ATTENTION' };
  }
  if (current.status === 'FAILED' || current.status === 'RETRY_WAIT' || current.status === 'ORPHANED') {
    const q = queue.quarantine({
      missionId: input.missionId,
      nowIso: input.nowIso,
      detail: decision.reason,
    });
    if (!q.ok) return { ok: false, reason: q.reason };
    return { ok: true, mission: q.mission, action: 'QUARANTINE_FOUNDER_ATTENTION' };
  }
  // Force fail then quarantine
  if (current.assignedWorkerId) {
    const failed = queue.fail({
      missionId: input.missionId,
      workerId: current.assignedWorkerId,
      reason: decision.reason,
      nowIso: input.nowIso,
    });
    if (!failed.ok) return failed;
  }
  const q = queue.quarantine({
    missionId: input.missionId,
    nowIso: input.nowIso,
    detail: decision.reason,
  });
  if (!q.ok) return { ok: false, reason: q.reason };
  return { ok: true, mission: q.mission, action: 'QUARANTINE_FOUNDER_ATTENTION' };
}

export function defaultMaxRetries(): number {
  return DEFAULT_MAX_RETRIES;
}
