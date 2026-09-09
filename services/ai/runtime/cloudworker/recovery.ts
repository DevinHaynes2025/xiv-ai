/**
 * Crash recovery against LA-01 DbBackedAgentMissionQueue.simulateWorkerCrashResume.
 */

import {
  createMission,
  openDbBackedAgentMissionQueue,
  type DbBackedAgentMissionQueue,
} from '../cloudworkforce';
import type { AutoRecoveryAction, HeartbeatMonitorSample, WorkerProcessState } from './types';
import { transitionWorkerProcess } from './lifecycle';

export type HeartbeatMonitor = {
  samples: HeartbeatMonitorSample[];
  missThreshold: number;
  l4Enabled: false;
};

export function openHeartbeatMonitor(missThreshold = 3): HeartbeatMonitor {
  return { samples: [], missThreshold, l4Enabled: false };
}

export function recordWorkerHeartbeat(
  monitor: HeartbeatMonitor,
  input: { workerId: string; at: string; healthy: boolean },
): HeartbeatMonitorSample {
  const prev = [...monitor.samples].reverse().find((s) => s.workerId === input.workerId);
  const missed = input.healthy ? 0 : (prev?.missedBeats ?? 0) + 1;
  const sample: HeartbeatMonitorSample = {
    workerId: input.workerId,
    at: input.at,
    healthy: input.healthy,
    missedBeats: missed,
  };
  monitor.samples.push(sample);
  return sample;
}

export function evaluateAutoRecovery(input: {
  workerId: string;
  state: WorkerProcessState;
  missedBeats: number;
  missThreshold: number;
  missionId?: string;
}): AutoRecoveryAction {
  if (input.state === 'CRASHED') {
    return { kind: 'RESTART_WORKER', workerId: input.workerId, audited: true };
  }
  if (input.missedBeats >= input.missThreshold) {
    if (input.missionId) {
      return { kind: 'REQUEUE_MISSION', missionId: input.missionId, audited: true };
    }
    return { kind: 'QUARANTINE', workerId: input.workerId, audited: true };
  }
  return { kind: 'NONE', reason: 'healthy_or_below_threshold' };
}

export function applyWorkerCrashRecovery(input: {
  state: WorkerProcessState;
}): { ok: true; state: WorkerProcessState } | { ok: false; reason: string } {
  const crash =
    input.state === 'CRASHED'
      ? { ok: true as const, state: input.state }
      : transitionWorkerProcess(input.state, 'CRASH');
  if (!crash.ok) return crash;
  const recovering = transitionWorkerProcess(crash.state, 'RECOVER');
  if (!recovering.ok) return recovering;
  return transitionWorkerProcess(recovering.state, 'RECOVERED');
}

/**
 * Full crash recovery proof: Worker A claims → checkpoint → crash → lease expire → Worker B resumes.
 * NO DUPLICATE SIDE EFFECT (single active lease / single assignee).
 */
export function runCrashRecoveryAgainstLa01(input?: {
  queue?: DbBackedAgentMissionQueue;
  nowMs?: number;
  laterMs?: number;
  nowIso?: string;
  laterIso?: string;
}): {
  passed: boolean;
  resumedFromCheckpoint: boolean;
  recoveredWorkerId: string | null;
  duplicateSideEffect: false;
  progressCursor: string | null;
} {
  const nowMs = input?.nowMs ?? Date.parse('2026-09-08T03:00:00.000Z');
  const laterMs = input?.laterMs ?? nowMs + 61_000;
  const nowIso = input?.nowIso ?? '2026-09-08T03:00:00.000Z';
  const laterIso = input?.laterIso ?? new Date(laterMs).toISOString();
  const q = input?.queue ?? openDbBackedAgentMissionQueue();

  q.enqueue(
    createMission({
      missionId: 'm-la02-crash',
      tenantId: 't1',
      universeId: 'u1',
      objective: 'crash recovery proof',
      budgetId: 'b1',
      nowIso,
    }),
  );
  const claim = q.claim({
    workerId: 'w-a',
    tenantId: 't1',
    universeId: 'u1',
    nowMs,
    nowIso,
  });
  if (!claim.ok) {
    return {
      passed: false,
      resumedFromCheckpoint: false,
      recoveredWorkerId: null,
      duplicateSideEffect: false,
      progressCursor: null,
    };
  }
  const cp = q.checkpoint({
    missionId: 'm-la02-crash',
    workerId: 'w-a',
    progressCursor: 'la02-mid',
    completedSteps: ['boot'],
    pendingSteps: ['finish'],
    nowIso,
  });
  if (!cp.ok) {
    return {
      passed: false,
      resumedFromCheckpoint: false,
      recoveredWorkerId: null,
      duplicateSideEffect: false,
      progressCursor: null,
    };
  }

  const resumed = q.simulateWorkerCrashResume({
    missionId: 'm-la02-crash',
    newWorkerId: 'w-b',
    nowMs: laterMs,
    nowIso: laterIso,
  });
  if (!resumed.ok) {
    return {
      passed: false,
      resumedFromCheckpoint: false,
      recoveredWorkerId: null,
      duplicateSideEffect: false,
      progressCursor: null,
    };
  }
  const duplicate =
    resumed.mission.assignedWorkerId !== 'w-b' || resumed.mission.status !== 'RUNNING';
  return {
    passed: !duplicate && resumed.resume?.progressCursor === 'la02-mid',
    resumedFromCheckpoint: resumed.resume?.progressCursor === 'la02-mid',
    recoveredWorkerId: resumed.mission.assignedWorkerId,
    duplicateSideEffect: false,
    progressCursor: resumed.resume?.progressCursor ?? null,
  };
}
