/**
 * AgentWorkforceManager — assign/schedule/pause/resume/handoff/evaluate/quarantine.
 * Cannot self-grant permissions, raise authority, disable Guardian, or change ownership.
 */

import type { CloudAgentRuntime } from './runtime';
import { openCloudAgentRuntime, registerRuntimeWorker, startRuntimeWorker } from './runtime';
import {
  openAgentScheduler,
  registerSchedule,
  createSchedule,
  matchWorkerCapabilities,
  type AgentScheduler,
  type SchedulableMission,
} from './scheduler';
import { markPoolWorkerStarted, openWorkerPool, scalePool } from './pools';
import type { SpecialtyWorkerRole, WorkerIdentity, WorkerPool } from './types';
import { listSpecialtyWorkers, spawnSpecialtyWorker } from './specialty-workers';
import { registerFollowTheSunSchedules } from './follow-the-sun';
import { registerNightShiftSchedule } from './night-shift-v1';

export type AgentWorkforceManager = {
  runtime: CloudAgentRuntime;
  scheduler: AgentScheduler;
  pools: Map<string, WorkerPool>;
  pausedWorkerIds: Set<string>;
  quarantinedWorkerIds: Set<string>;
  l4Enabled: false;
  defaultPermissions: 'NONE';
  runs247Live: false;
  maySelfGrantPermissions: false;
  mayIncreaseAuthority: false;
  mayDisableGuardian: false;
  mayChangeOwnership: false;
};

export function openAgentWorkforceManager(input?: {
  runtimeId?: string;
}): AgentWorkforceManager {
  const runtime = openCloudAgentRuntime({ runtimeId: input?.runtimeId });
  const scheduler = openAgentScheduler();
  registerFollowTheSunSchedules(scheduler);
  const night = registerNightShiftSchedule();
  for (const [, s] of night.schedules) {
    registerSchedule(scheduler, s);
  }
  registerSchedule(
    scheduler,
    createSchedule({
      scheduleId: 'on-demand-default',
      kind: 'ON_DEMAND',
      maxConcurrent: 4,
    }),
  );

  const pools = new Map<string, WorkerPool>();
  for (const role of listSpecialtyWorkers()) {
    pools.set(
      `pool-${role.role.toLowerCase()}`,
      openWorkerPool({
        poolId: `pool-${role.role.toLowerCase()}`,
        roles: [role.role],
        desiredSize: 1,
        maxSize: 4,
      }),
    );
  }

  return {
    runtime,
    scheduler,
    pools,
    pausedWorkerIds: new Set(),
    quarantinedWorkerIds: new Set(),
    l4Enabled: false,
    defaultPermissions: 'NONE',
    runs247Live: false,
    maySelfGrantPermissions: false,
    mayIncreaseAuthority: false,
    mayDisableGuardian: false,
    mayChangeOwnership: false,
  };
}

export function provisionSpecialtyWorker(
  mgr: AgentWorkforceManager,
  input: {
    role: SpecialtyWorkerRole;
    workerId: string;
    instanceId: string;
    tenantId: string;
    universeId: string;
  },
): { ok: true; workerId: string } | { ok: false; reason: string } {
  if (mgr.quarantinedWorkerIds.has(input.workerId)) {
    return { ok: false, reason: 'worker_quarantined' };
  }
  const identity = spawnSpecialtyWorker(input);
  registerRuntimeWorker(mgr.runtime, {
    workerId: identity.workerId,
    instanceId: identity.instanceId,
    role: identity.agentRole,
    tenantId: identity.tenantId,
    universeId: identity.universeId,
    capabilities: identity.capabilities,
  });
  const started = startRuntimeWorker(mgr.runtime, identity.workerId);
  if (!started.ok) return started;

  const pool = mgr.pools.get(`pool-${input.role.toLowerCase()}`);
  if (pool) {
    mgr.pools.set(pool.poolId, markPoolWorkerStarted(pool));
  }
  return { ok: true, workerId: identity.workerId };
}

export function pauseWorker(mgr: AgentWorkforceManager, workerId: string): void {
  mgr.pausedWorkerIds.add(workerId);
}

export function resumeWorker(mgr: AgentWorkforceManager, workerId: string): void {
  mgr.pausedWorkerIds.delete(workerId);
}

export function quarantineWorker(mgr: AgentWorkforceManager, workerId: string): void {
  mgr.quarantinedWorkerIds.add(workerId);
  mgr.pausedWorkerIds.add(workerId);
}

export function assignScheduleToCapableWorker(
  mgr: AgentWorkforceManager,
  scheduleId: string,
): ReturnType<typeof matchWorkerCapabilities> | { ok: false; reason: string } {
  const schedule = mgr.scheduler.schedules.get(scheduleId);
  if (!schedule) return { ok: false, reason: 'schedule_not_found' };
  const workers = [...mgr.runtime.workers.values()]
    .map((w) => w.identity)
    .filter((w) => !mgr.pausedWorkerIds.has(w.workerId) && !mgr.quarantinedWorkerIds.has(w.workerId));
  return matchWorkerCapabilities(schedule, workers);
}

export function resizePool(
  mgr: AgentWorkforceManager,
  poolId: string,
  desired: number,
): { ok: true; pool: WorkerPool } | { ok: false; reason: string } {
  const pool = mgr.pools.get(poolId);
  if (!pool) return { ok: false, reason: 'pool_not_found' };
  const scaled = scalePool(pool, desired);
  if (!scaled.ok) return { ok: false, reason: scaled.reason };
  mgr.pools.set(poolId, scaled.pool);
  return { ok: true, pool: scaled.pool };
}

export function listManagedWorkers(mgr: AgentWorkforceManager): readonly WorkerIdentity[] {
  return [...mgr.runtime.workers.values()].map((w) => w.identity);
}

export function workforceRuns247(_mgr: AgentWorkforceManager): false {
  return false;
}

export function managerMaySelfGrant(_mgr: AgentWorkforceManager): false {
  return false;
}
