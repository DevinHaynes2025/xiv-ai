/**
 * Memory integration: mission → checkpoint → outcome → debrief → lesson.
 * Classify memory scope. No auto Global Brain promotion.
 */

import type { AgentCheckpoint, AgentDebrief, AgentMemoryScopeClass, AgentMission } from './types';

export type MissionMemoryRecord = {
  memoryId: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  scope: AgentMemoryScopeClass;
  checkpointId: string | null;
  outcome: string | null;
  debriefId: string | null;
  lesson: string | null;
  autoPromotesToGlobalBrain: false;
  createdAt: string;
};

export function classifyMemoryScope(input: {
  intended: AgentMemoryScopeClass;
  containsTenantPrivate?: boolean;
}): AgentMemoryScopeClass {
  if (input.intended === 'GLOBAL_BRAIN_CANDIDATE' && input.containsTenantPrivate) {
    return 'COMPANY_PRIVATE';
  }
  return input.intended;
}

export function recordMissionMemoryChain(input: {
  memoryId: string;
  mission: AgentMission;
  checkpoint: AgentCheckpoint | null;
  debrief: AgentDebrief | null;
  outcome: string | null;
  lesson: string | null;
  scope?: AgentMemoryScopeClass;
  createdAt: string;
}): MissionMemoryRecord {
  const scope = classifyMemoryScope({
    intended: input.scope ?? 'MISSION_LOCAL',
    containsTenantPrivate: true,
  });
  return {
    memoryId: input.memoryId,
    missionId: input.mission.missionId,
    tenantId: input.mission.tenantId,
    universeId: input.mission.universeId,
    scope,
    checkpointId: input.checkpoint?.checkpointId ?? null,
    outcome: input.outcome,
    debriefId: input.debrief?.debriefId ?? null,
    lesson: input.lesson,
    autoPromotesToGlobalBrain: false,
    createdAt: input.createdAt,
  };
}

export function memoryAutoPromotesToGlobalBrain(_record: MissionMemoryRecord): false {
  return false;
}

export function evaluateGlobalBrainPromotion(_record: MissionMemoryRecord): {
  allowed: false;
  reason: string;
  audited: true;
} {
  return {
    allowed: false,
    reason: 'no_auto_global_brain_promotion',
    audited: true,
  };
}
