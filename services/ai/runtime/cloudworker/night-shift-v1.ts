/**
 * Governed Night Shift V1 runtime — safe limits on top of LA-01 template.
 */

import {
  evaluateNightShiftWork,
  NIGHT_SHIFT_ALLOWED_WORK,
  NIGHT_SHIFT_TEMPLATE_ID,
  openNightShiftMissionTemplate,
} from '../cloudworkforce';
import type { NightShiftV1Limits } from './types';
import { createSchedule, openAgentScheduler, registerSchedule } from './scheduler';

export const NIGHT_SHIFT_V1_LIMITS: NightShiftV1Limits = {
  maxMissionsPerShift: 20,
  maxConcurrentWorkers: 4,
  maxRetries: 2,
  allowSilentProdDeploy: false,
  allowL4: false,
  allowSelfGrant: false,
  allowSecretRotation: false,
  runs247Live: false,
};

export type NightShiftV1Runtime = {
  templateId: typeof NIGHT_SHIFT_TEMPLATE_ID;
  limits: NightShiftV1Limits;
  missionsStarted: number;
  activeWorkers: number;
  l4Enabled: false;
  productionLive: false;
  runs247Live: false;
};

export function openNightShiftV1Runtime(): NightShiftV1Runtime {
  // Ensure LA-01 template is the source of allow/deny.
  openNightShiftMissionTemplate();
  return {
    templateId: NIGHT_SHIFT_TEMPLATE_ID,
    limits: { ...NIGHT_SHIFT_V1_LIMITS },
    missionsStarted: 0,
    activeWorkers: 0,
    l4Enabled: false,
    productionLive: false,
    runs247Live: false,
  };
}

export function registerNightShiftSchedule() {
  const scheduler = openAgentScheduler();
  registerSchedule(
    scheduler,
    createSchedule({
      scheduleId: 'night-shift-v1',
      kind: 'NIGHT_SHIFT',
      preferredRoles: ['RESEARCH', 'ENGINEERING', 'QA', 'SECURITY', 'DATABASE', 'KNOWLEDGE'],
      requiredCapabilities: [],
      maxConcurrent: NIGHT_SHIFT_V1_LIMITS.maxConcurrentWorkers,
      windowStartHourUtc: 0,
      windowEndHourUtc: 8,
    }),
  );
  return scheduler;
}

export function tryStartNightShiftMission(
  runtime: NightShiftV1Runtime,
  work: string,
): { ok: true; runtime: NightShiftV1Runtime } | { ok: false; reason: string; audited: true } {
  const evalWork = evaluateNightShiftWork(work);
  if (!evalWork.allowed) {
    return { ok: false, reason: evalWork.reason, audited: true };
  }
  if (runtime.missionsStarted >= runtime.limits.maxMissionsPerShift) {
    return { ok: false, reason: 'night_shift_mission_cap', audited: true };
  }
  if (runtime.activeWorkers >= runtime.limits.maxConcurrentWorkers) {
    return { ok: false, reason: 'night_shift_worker_cap', audited: true };
  }
  return {
    ok: true,
    runtime: {
      ...runtime,
      missionsStarted: runtime.missionsStarted + 1,
      activeWorkers: runtime.activeWorkers + 1,
    },
  };
}

export function nightShiftAllowsSilentProd(): false {
  return false;
}

export function nightShiftAllowedWorkCount(): number {
  return NIGHT_SHIFT_ALLOWED_WORK.length;
}
