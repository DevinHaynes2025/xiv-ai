export type WorkforceDepartment = 'DEVOPS' | 'AI_ENGINEERING' | 'AI_HR' | 'THINK_TANK' | 'LEARNING' | 'INNOVATION' | 'MEDIA' | 'OPERATIONS';
export type WorkforceState = 'READY' | 'LEARNING' | 'MEETING' | 'BREAK' | 'WAITING_EVIDENCE' | 'OFFLINE';

export interface WorkforceAgent {
  agentId: string;
  tenantId: string;
  department: WorkforceDepartment;
  role: string;
  state: WorkforceState;
  skills: readonly string[];
  evidenceRefs: readonly string[];
  confidentiality: 'INTERNAL' | 'CONFIDENTIAL';
}

export interface CampusSpace {
  spaceId: string;
  kind: 'THINK_TANK' | 'BREAK_ROOM' | 'GAME_ROOM' | 'MENTAL_GYM' | 'LIBRARY' | 'MEDIA_CENTER' | 'INNOVATION_HUB' | 'MEETING_ROOM';
  purpose: string;
  simulationOnly: boolean;
  tenantId: string;
}

export const AI_WORKFORCE_GUARDRAILS = {
  maxAgentsPerDepartmentPerCycle: 16,
  autonomousProductionDeploy: false,
  secretsInPrompts: false,
  sourceBackedLearningRequired: true,
  mediaStudyRequiresProvenance: true,
  learningMutatesModelWeights: false,
  learningRewritesAgentCode: false,
} as const;

export function createWorkforceAgent(input: Omit<WorkforceAgent, 'state' | 'confidentiality'>): WorkforceAgent {
  const hasEvidence = input.evidenceRefs.length > 0;
  return Object.freeze({ ...input, state: hasEvidence ? 'READY' : 'WAITING_EVIDENCE', confidentiality: 'INTERNAL' });
}

export function createCampusSpace(input: Omit<CampusSpace, 'simulationOnly'>): CampusSpace {
  return Object.freeze({ ...input, simulationOnly: true });
}
