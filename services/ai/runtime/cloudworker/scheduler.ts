/**
 * AgentScheduler — schedules, priority ordering, capability matching, budgets.
 * No improvised permissions. L4 disabled.
 */

import type { AgentMission } from '../cloudworkforce/types';
import type {
  AgentSchedule,
  CapabilityMatchResult,
  ScheduleKind,
  SpecialtyWorkerRole,
  WorkerIdentity,
} from './types';

export const SCHEDULE_KINDS: readonly ScheduleKind[] = [
  'ONCE',
  'CRON',
  'INTERVAL',
  'FOLLOW_THE_SUN',
  'NIGHT_SHIFT',
  'ON_DEMAND',
  'POOL_FILL',
] as const;

export function scheduleAllowsSilentProd(_s: AgentSchedule): false {
  return false;
}

export type MissionPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BACKGROUND';

export type ScheduleType =
  | 'IMMEDIATE'
  | 'ONE_TIME'
  | 'RECURRING'
  | 'SHIFT'
  | 'EVENT_TRIGGERED'
  | 'DEPENDENCY_TRIGGERED';

export type SchedulableMission = {
  mission: AgentMission;
  priority: MissionPriority;
  scheduleType: ScheduleType;
  requiredSkills: readonly string[];
  requiredTools: readonly string[];
  requiredDataScopes: readonly string[];
  requiredModelCapabilities: readonly string[];
  requiredEnvironment: string;
  preferredRoles: readonly SpecialtyWorkerRole[];
  dependencyMissionIds: readonly string[];
  budgetRemaining: number;
  estimatedCost: number;
};

export type AgentScheduler = {
  schedules: Map<string, AgentSchedule>;
  l4Enabled: false;
  improvisesPermissions: false;
  productionLive: false;
  continuousAutonomy: false;
};

const PRIORITY_RANK: Record<MissionPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
  BACKGROUND: 4,
};

export function openAgentScheduler(): AgentScheduler {
  return {
    schedules: new Map(),
    l4Enabled: false,
    improvisesPermissions: false,
    productionLive: false,
    continuousAutonomy: false,
  };
}

export function createSchedule(input: {
  scheduleId: string;
  kind: ScheduleKind;
  requiredCapabilities?: readonly string[];
  preferredRoles?: readonly SpecialtyWorkerRole[];
  timezone?: string;
  windowStartHourUtc?: number | null;
  windowEndHourUtc?: number | null;
  maxConcurrent?: number;
}): AgentSchedule {
  return {
    scheduleId: input.scheduleId,
    kind: input.kind,
    requiredCapabilities: input.requiredCapabilities ?? [],
    preferredRoles: input.preferredRoles ?? [],
    timezone: input.timezone ?? 'UTC',
    windowStartHourUtc: input.windowStartHourUtc ?? null,
    windowEndHourUtc: input.windowEndHourUtc ?? null,
    maxConcurrent: input.maxConcurrent ?? 1,
    nightShiftSafeLimits: true,
    l4Enabled: false,
    productionLive: false,
    continuousAutonomy: false,
  };
}

/** Alias kept for call sites preferring createAgentSchedule naming. */
export const createAgentSchedule = createSchedule;

export function registerSchedule(scheduler: AgentScheduler, schedule: AgentSchedule): void {
  scheduler.schedules.set(schedule.scheduleId, schedule);
}

export function listSchedules(scheduler: AgentScheduler): readonly AgentSchedule[] {
  return [...scheduler.schedules.values()];
}

export function compareMissionPriority(a: MissionPriority, b: MissionPriority): number {
  return PRIORITY_RANK[a] - PRIORITY_RANK[b];
}

/** Security incidents (CRITICAL) supersede ordinary development work. */
export function orderByPriority(missions: readonly SchedulableMission[]): SchedulableMission[] {
  return [...missions].sort((x, y) => {
    const p = compareMissionPriority(x.priority, y.priority);
    if (p !== 0) return p;
    return x.mission.createdAt.localeCompare(y.mission.createdAt);
  });
}

export function dependenciesSatisfied(
  mission: SchedulableMission,
  completedIds: ReadonlySet<string>,
): boolean {
  return mission.dependencyMissionIds.every((id) => completedIds.has(id));
}

export function matchWorkerCapabilities(
  target: SchedulableMission | AgentSchedule,
  workers: readonly WorkerIdentity[],
): CapabilityMatchResult {
  const requiredSkills = 'requiredSkills' in target ? target.requiredSkills : target.requiredCapabilities;
  const preferredRoles = target.preferredRoles;
  const tenantId = 'mission' in target ? target.mission.tenantId : undefined;
  const universeId = 'mission' in target ? target.mission.universeId : undefined;
  const eligible = workers.filter((w) => {
    if (w.forged) return false;
    if (tenantId && w.tenantId !== tenantId) return false;
    if (universeId && w.universeId !== universeId) return false;
    if (w.defaultPermissions !== 'NONE') return false;
    if (w.allTools || w.l4Enabled) return false;
    if (preferredRoles.length > 0 && !preferredRoles.includes(w.agentRole)) {
      return false;
    }
    return requiredSkills.every((s) => w.capabilities.includes(s));
  });
  if (eligible.length === 0) {
    return { ok: false, reason: 'BLOCKED_no_capability_match' };
  }
  const scored = eligible
    .map((w) => ({
      workerId: w.workerId,
      score:
        w.capabilities.filter((c) => requiredSkills.includes(c)).length +
        (preferredRoles.includes(w.agentRole) ? 10 : 0),
    }))
    .sort((a, b) => b.score - a.score);
  return { ok: true, workerId: scored[0]!.workerId, score: scored[0]!.score };
}

export function budgetAllows(mission: SchedulableMission): boolean {
  return mission.budgetRemaining >= mission.estimatedCost && mission.estimatedCost >= 0;
}

export type ScheduleDecision =
  | { ok: true; workerId: string; missionId: string }
  | { ok: false; reason: string; audited: true };

/**
 * MISSION → CAPABILITY MATCH → PERMISSION CHECK → BUDGET CHECK → WORKER
 * Does not improvise permissions.
 */
export function scheduleMission(input: {
  mission: SchedulableMission;
  workers: readonly WorkerIdentity[];
  completedDependencyIds: ReadonlySet<string>;
  availableWorkerIds: ReadonlySet<string>;
}): ScheduleDecision {
  if (!dependenciesSatisfied(input.mission, input.completedDependencyIds)) {
    return { ok: false, reason: 'dependency_unsatisfied', audited: true };
  }
  if (!budgetAllows(input.mission)) {
    return { ok: false, reason: 'budget_insufficient', audited: true };
  }
  const match = matchWorkerCapabilities(input.mission, input.workers);
  if (!match.ok) {
    return { ok: false, reason: match.reason, audited: true };
  }
  if (!input.availableWorkerIds.has(match.workerId)) {
    return { ok: false, reason: 'worker_unavailable', audited: true };
  }
  const worker = input.workers.find((w) => w.workerId === match.workerId);
  if (!worker || worker.defaultPermissions !== 'NONE' || worker.allTools || worker.l4Enabled) {
    return { ok: false, reason: 'permission_check_failed', audited: true };
  }
  return { ok: true, workerId: match.workerId, missionId: input.mission.mission.missionId };
}
