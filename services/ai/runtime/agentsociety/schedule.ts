/**
 * Default duty cycles: weekday/daytime active; overnight = checkpoint/debrief only unless incident.
 */

import { createDutyCycle, type DutyCycle, type DutyCycleWindow } from './energy';

export type ScheduleMode = 'ACTIVE' | 'CHECKPOINT_DEBRIEF' | 'SLEEP' | 'INCIDENT_WAKE';

export type LocalClock = {
  /** 0=Sun … 6=Sat */
  weekday: number;
  hourLocal: number;
  incident?: boolean;
};

const WEEKDAY_DAYTIME: DutyCycleWindow[] = [1, 2, 3, 4, 5].map((weekday) => ({
  weekday,
  startHourLocal: 8,
  endHourLocal: 18,
  mode: 'ACTIVE' as const,
}));

const OVERNIGHT_CHECKPOINT: DutyCycleWindow = {
  weekday: null,
  startHourLocal: 18,
  endHourLocal: 8,
  mode: 'CHECKPOINT_DEBRIEF',
};

export function defaultWeekdayDaytimeDutyCycle(cycleId = 'default-weekday-daytime'): DutyCycle {
  return createDutyCycle({
    cycleId,
    timezone: 'America/Chicago',
    windows: [...WEEKDAY_DAYTIME, OVERNIGHT_CHECKPOINT],
  });
}

export function resolveScheduleMode(clock: LocalClock, duty: DutyCycle = defaultWeekdayDaytimeDutyCycle()): ScheduleMode {
  if (clock.incident) {
    return 'INCIDENT_WAKE';
  }
  const hour = ((clock.hourLocal % 24) + 24) % 24;
  const isWeekday = clock.weekday >= 1 && clock.weekday <= 5;
  const inDaytime = hour >= 8 && hour < 18;

  for (const window of duty.windows) {
    if (window.mode !== 'ACTIVE') continue;
    if (window.weekday !== null && window.weekday !== clock.weekday) continue;
    if (hour >= window.startHourLocal && hour < window.endHourLocal) {
      return 'ACTIVE';
    }
  }

  if (!isWeekday || !inDaytime) {
    return 'CHECKPOINT_DEBRIEF';
  }
  return 'SLEEP';
}

export function overnightAllowsFullInference(clock: LocalClock): boolean {
  if (clock.incident) return true;
  return false;
}

export function overnightDefaultWork(): readonly ('CHECKPOINT' | 'DEBRIEF')[] {
  return ['CHECKPOINT', 'DEBRIEF'];
}

export function scheduleIsAlwaysOn(_duty?: DutyCycle): false {
  return false;
}
