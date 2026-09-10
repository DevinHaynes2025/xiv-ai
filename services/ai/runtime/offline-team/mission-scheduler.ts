export type MissionState = 'QUEUED' | 'PLANNING' | 'RUNNING' | 'PAUSED' | 'REVIEW' | 'DONE' | 'FAILED';
export type MissionRole = 'ARCHITECT' | 'CODER' | 'DATABASE_ENGINEER' | 'DATA_MINER' | 'HISTORIAN' | 'SECURITY_REVIEWER' | 'QA' | 'LEARNING_RECORDER';

export interface OfflineMission {
  missionId: string;
  tenantId: string;
  objective: string;
  priority: number;
  state: MissionState;
  requestedRoles: readonly MissionRole[];
  checkpointRefs: readonly string[];
  createdAt: string;
  updatedAt: string;
}

export interface MissionTask {
  taskId: string;
  missionId: string;
  role: MissionRole;
  objective: string;
  dependsOn: readonly string[];
  requiresHumanReview: boolean;
  productionMutation: false;
}

export const MISSION_SCHEDULER_GUARDRAILS = {
  offlineFirst: true,
  maxTasksPerMission: 64,
  maxParallelTasksPerMission: 8,
  productionMutationAllowed: false,
  autonomousDeployAllowed: false,
  policyGateBypassAllowed: false,
  resumeFromCheckpoint: true,
} as const;

export function decomposeMission(mission: OfflineMission): readonly MissionTask[] {
  if (!mission.missionId || !mission.tenantId || !mission.objective.trim()) throw new Error('mission identity required');
  const roles = [...new Set(mission.requestedRoles)].slice(0, MISSION_SCHEDULER_GUARDRAILS.maxTasksPerMission);
  return Object.freeze(roles.map((role, index) => Object.freeze({
    taskId: `${mission.missionId}:${String(index + 1).padStart(2, '0')}:${role.toLowerCase()}`,
    missionId: mission.missionId,
    role,
    objective: `${mission.objective} :: ${role}`,
    dependsOn: index === 0 ? Object.freeze([]) : Object.freeze([`${mission.missionId}:${String(index).padStart(2, '0')}:${roles[index - 1].toLowerCase()}`]),
    requiresHumanReview: role === 'SECURITY_REVIEWER' || role === 'QA',
    productionMutation: false as const,
  }))));
}
