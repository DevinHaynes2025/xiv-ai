export interface WorkerAssignment {
  workerId: string;
  role: string;
  provider: 'OLLAMA' | 'LOCAL_RULES' | 'PLUGIN' | 'CLOUD_MODEL';
  objective: string;
  evidenceRefs: string[];
}

export interface MissionPoolPlan {
  missionId: string;
  tenantId: string;
  assignments: WorkerAssignment[];
  maxConcurrent: number;
  requiresHumanApproval: boolean;
}

export function buildMissionPoolPlan(input: {
  missionId: string;
  tenantId: string;
  objective: string;
  roles: string[];
  evidenceRefs: string[];
  confidentiality: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
}): MissionPoolPlan {
  if (!input.evidenceRefs.length) throw new Error('evidence required before mission dispatch');
  const roles = [...new Set(input.roles)].slice(0, 8);
  if (roles.length < 2) throw new Error('mission worker pool requires at least two specialist roles');
  return {
    missionId: input.missionId,
    tenantId: input.tenantId,
    maxConcurrent: roles.length,
    requiresHumanApproval: input.confidentiality === 'TOP_SECRET',
    assignments: roles.map((role, index) => ({
      workerId: `${input.missionId}-${String(index + 1).padStart(2, '0')}`,
      role,
      provider: 'OLLAMA',
      objective: input.objective,
      evidenceRefs: input.evidenceRefs,
    })),
  };
}

export const LIVE_POOL_GUARDRAILS = {
  maxConcurrentWorkers: 8,
  offlineFirst: true,
  topSecretOnlineAllowed: false,
  productionMutationAllowed: false,
  modelSelfModificationAllowed: false,
  lessonsRequireEvidence: true,
};
