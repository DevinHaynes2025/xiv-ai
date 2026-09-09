/**
 * Follow-the-sun schedules — region windows, not continuous autonomy.
 */

import type { FollowTheSunRegion } from './types';
import { createSchedule, type AgentScheduler, registerSchedule } from './scheduler';

export const DEFAULT_FOLLOW_THE_SUN_REGIONS: readonly FollowTheSunRegion[] = [
  { regionId: 'americas', timezone: 'America/Chicago', activeHoursUtc: [13, 21] },
  { regionId: 'emea', timezone: 'Europe/London', activeHoursUtc: [7, 15] },
  { regionId: 'apac', timezone: 'Asia/Tokyo', activeHoursUtc: [0, 8] },
];

export function isRegionActive(region: FollowTheSunRegion, hourUtc: number): boolean {
  const [start, end] = region.activeHoursUtc;
  if (start <= end) return hourUtc >= start && hourUtc < end;
  return hourUtc >= start || hourUtc < end;
}

export function activeFollowTheSunRegions(
  hourUtc: number,
  regions: readonly FollowTheSunRegion[] = DEFAULT_FOLLOW_THE_SUN_REGIONS,
): readonly FollowTheSunRegion[] {
  return regions.filter((r) => isRegionActive(r, hourUtc));
}

export function registerFollowTheSunSchedules(scheduler: AgentScheduler): void {
  for (const region of DEFAULT_FOLLOW_THE_SUN_REGIONS) {
    const [start, end] = region.activeHoursUtc;
    registerSchedule(
      scheduler,
      createSchedule({
        scheduleId: `fts-${region.regionId}`,
        kind: 'FOLLOW_THE_SUN',
        timezone: region.timezone,
        windowStartHourUtc: start,
        windowEndHourUtc: end,
        maxConcurrent: 2,
        preferredRoles: ['RESEARCH', 'ENGINEERING', 'QA'],
        requiredCapabilities: ['follow_the_sun'],
      }),
    );
  }
}

export function followTheSunMeans247(): false {
  return false;
}
