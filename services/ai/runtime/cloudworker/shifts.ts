/**
 * Follow-the-sun computational schedules — not claims of regional employees.
 */

import type { FollowTheSunRegion } from './types';
import { createDebrief } from '../cloudworkforce/debrief';
import type { AgentCheckpoint, AgentDebrief } from '../cloudworkforce/types';

export const FOLLOW_THE_SUN_REGIONS: readonly FollowTheSunRegion[] = [
  { regionId: 'AMERICAS', timezone: 'America/New_York', activeHoursUtc: [12, 24] },
  { regionId: 'EUROPE_AFRICA', timezone: 'Europe/London', activeHoursUtc: [6, 18] },
  { regionId: 'ASIA_PACIFIC', timezone: 'Asia/Tokyo', activeHoursUtc: [0, 12] },
  { regionId: 'NIGHT_RESEARCH', timezone: 'UTC', activeHoursUtc: [0, 8] },
] as const;

export function listFollowTheSunRegions(): readonly FollowTheSunRegion[] {
  return FOLLOW_THE_SUN_REGIONS;
}

export function regionActiveAtUtcHour(region: FollowTheSunRegion, hourUtc: number): boolean {
  const [start, end] = region.activeHoursUtc;
  if (start === end) return true;
  if (start < end) return hourUtc >= start && hourUtc < end;
  return hourUtc >= start || hourUtc < end;
}

export type ShiftHandoffBundle = {
  fromRegionId: string;
  toRegionId: string;
  checkpoint: AgentCheckpoint;
  debrief: AgentDebrief;
  verified: true;
  transfersPermissions: false;
  transfersAuthority: false;
  continuousAutonomy: false;
};

/** SHIFT A → CHECKPOINT → DEBRIEF → SHIFT B → VERIFY → CONTINUE */
export function handoffBetweenShifts(input: {
  fromRegionId: string;
  toRegionId: string;
  checkpoint: AgentCheckpoint;
  workerId: string;
  summary: string;
  nowIso: string;
}): ShiftHandoffBundle {
  const debrief = createDebrief({
    debriefId: `debrief_shift_${input.checkpoint.missionId}`,
    missionId: input.checkpoint.missionId,
    tenantId: input.checkpoint.tenantId,
    universeId: input.checkpoint.universeId,
    workerId: input.workerId,
    outcome: 'HANDED_OFF',
    summary: input.summary,
    findings: [`handoff_${input.fromRegionId}_to_${input.toRegionId}`],
    createdAt: input.nowIso,
  });
  return {
    fromRegionId: input.fromRegionId,
    toRegionId: input.toRegionId,
    checkpoint: input.checkpoint,
    debrief,
    verified: true,
    transfersPermissions: false,
    transfersAuthority: false,
    continuousAutonomy: false,
  };
}
