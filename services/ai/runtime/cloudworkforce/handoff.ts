/**
 * Agent-to-agent handoff via Guardian / mission router.
 * Loads mission / checkpoint / debrief / memory / repo / db state.
 * No permission or authority transfer.
 */

import type { AgentCheckpoint, AgentDebrief, AgentHandoff, AgentMission, AgentWorker } from './types';
import { createDebrief } from './debrief';
import { resumeFromCheckpoint } from './checkpoint';
import type { DbBackedAgentMissionQueue } from './queue';
import { transitionMission } from './transitions';

export type HandoffBundle = {
  mission: AgentMission;
  checkpoint: AgentCheckpoint | null;
  debrief: AgentDebrief | null;
  memoryRefs: readonly string[];
  repoStateRef: string | null;
  dbStateRef: string | null;
  resume: ReturnType<typeof resumeFromCheckpoint> | null;
};

export function createMissionHandoff(input: {
  handoffId: string;
  missionId: string;
  fromWorkerId: string;
  toWorkerId: string;
  tenantId: string;
  universeId: string;
  checkpointId: string;
  debriefId?: string | null;
  createdAt: string;
}): AgentHandoff {
  return {
    handoffId: input.handoffId,
    missionId: input.missionId,
    fromWorkerId: input.fromWorkerId,
    toWorkerId: input.toWorkerId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    checkpointId: input.checkpointId,
    debriefId: input.debriefId ?? null,
    viaGuardian: true,
    viaMissionRouter: true,
    transfersPermissions: false,
    transfersAuthority: false,
    sameTenantRequired: true,
    sameUniverseRequired: true,
    createdAt: input.createdAt,
  };
}

export function evaluateHandoff(input: {
  from: AgentWorker;
  to: AgentWorker;
  mission: AgentMission;
}): { allowed: true } | { allowed: false; reason: string; audited: true } {
  if (input.from.tenantId !== input.to.tenantId || input.from.tenantId !== input.mission.tenantId) {
    return { allowed: false, reason: 'cross_tenant_handoff_denied', audited: true };
  }
  if (
    input.from.universeId !== input.to.universeId ||
    input.from.universeId !== input.mission.universeId
  ) {
    return { allowed: false, reason: 'cross_universe_handoff_denied', audited: true };
  }
  if (input.from.forged || input.to.forged) {
    return { allowed: false, reason: 'forged_worker_denied', audited: true };
  }
  return { allowed: true };
}

export function executeHandoff(
  queue: DbBackedAgentMissionQueue,
  input: {
    from: AgentWorker;
    to: AgentWorker;
    missionId: string;
    nowIso: string;
    summary?: string;
  },
):
  | { ok: true; handoff: AgentHandoff; bundle: HandoffBundle }
  | { ok: false; reason: string; audited?: true } {
  const mission = queue.getMission(input.missionId);
  if (!mission) return { ok: false, reason: 'mission_not_found' };
  const gate = evaluateHandoff({ from: input.from, to: input.to, mission });
  if (!gate.allowed) return { ok: false, reason: gate.reason, audited: true };

  if (mission.assignedWorkerId !== input.from.workerId) {
    return { ok: false, reason: 'handoff_source_not_assignee', audited: true };
  }

  let checkpoint = mission.checkpointId ? queue.getCheckpoint(mission.checkpointId) : null;
  if (!checkpoint) {
    const cp = queue.checkpoint({
      missionId: mission.missionId,
      workerId: input.from.workerId,
      progressCursor: 'handoff',
      nowIso: input.nowIso,
    });
    if (!cp.ok) return { ok: false, reason: cp.reason, audited: cp.audited };
    checkpoint = cp.checkpoint;
  }

  const debrief = createDebrief({
    debriefId: `debrief_handoff_${mission.missionId}`,
    missionId: mission.missionId,
    tenantId: mission.tenantId,
    universeId: mission.universeId,
    workerId: input.from.workerId,
    outcome: 'HANDED_OFF',
    summary: input.summary ?? 'handoff_via_guardian_mission_router',
    createdAt: input.nowIso,
  });
  queue.storeDebrief(debrief);

  const handed = transitionMission(
    queue.getMission(mission.missionId) ?? mission,
    'HANDED_OFF',
    input.nowIso,
  );
  if (!handed.ok) return { ok: false, reason: handed.reason };

  const queued = transitionMission(handed.mission, 'QUEUED', input.nowIso);
  if (!queued.ok) return { ok: false, reason: queued.reason };

  // Re-enqueue state into queue store via internal mutation: use fail path avoidance
  // Directly patch through a complete→no: use claim path after releasing lease
  if (mission.leaseId) {
    queue.release({ leaseId: mission.leaseId, workerId: input.from.workerId, nowIso: input.nowIso });
  }

  const handoff = createMissionHandoff({
    handoffId: `handoff_${mission.missionId}_${input.to.workerId}`,
    missionId: mission.missionId,
    fromWorkerId: input.from.workerId,
    toWorkerId: input.to.workerId,
    tenantId: mission.tenantId,
    universeId: mission.universeId,
    checkpointId: checkpoint.checkpointId,
    debriefId: debrief.debriefId,
    createdAt: input.nowIso,
  });

  const persisted: AgentMission = {
    ...queued.mission,
    checkpointId: checkpoint.checkpointId,
    assignedWorkerId: null,
    leaseId: null,
  };
  queue.upsertMission(persisted);

  const bundle: HandoffBundle = {
    mission: persisted,
    checkpoint,
    debrief,
    memoryRefs: checkpoint.memoryRefs,
    repoStateRef: checkpoint.repoStateRef,
    dbStateRef: checkpoint.dbStateRef,
    resume: resumeFromCheckpoint(checkpoint),
  };

  return { ok: true, handoff, bundle };
}

export function handoffTransfersPermissions(): false {
  return false;
}

export function handoffTransfersAuthority(): false {
  return false;
}
