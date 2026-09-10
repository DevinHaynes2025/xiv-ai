import { createHash } from 'node:crypto';

export interface FleetLesson {
  tenantId: string;
  agentId: string;
  taskId: string;
  lesson: string;
  confidence: number;
  evidenceRefs: string[];
  approved: boolean;
}

export interface FleetPathway {
  id: string;
  tenantId: string;
  fromAgentId: string;
  taskId: string;
  relation: 'LEARNED_FROM' | 'SUPPORTS' | 'CONTRADICTS' | 'ROUTES_TO';
  contentHash: string;
  confidence: number;
  evidenceRefs: string[];
}

export function createFleetPathway(lesson: FleetLesson, relation: FleetPathway['relation'] = 'LEARNED_FROM'): FleetPathway {
  if (!lesson.approved) throw new Error('lesson approval required');
  if (!lesson.evidenceRefs.length) throw new Error('lesson evidence required');
  if (lesson.confidence < 0 || lesson.confidence > 1) throw new Error('confidence must be 0..1');
  const contentHash = createHash('sha256').update(`${lesson.tenantId}|${lesson.agentId}|${lesson.taskId}|${lesson.lesson}`).digest('hex');
  return {
    id: `fleet-path-${contentHash.slice(0, 20)}`,
    tenantId: lesson.tenantId,
    fromAgentId: lesson.agentId,
    taskId: lesson.taskId,
    relation,
    contentHash,
    confidence: lesson.confidence,
    evidenceRefs: [...new Set(lesson.evidenceRefs)],
  };
}

export function buildSharedLearningContext(pathways: FleetPathway[], tenantId: string, max = 32): FleetPathway[] {
  if (max < 1 || max > 64) throw new Error('learning context cap must be 1..64');
  return pathways.filter(x => x.tenantId === tenantId).slice(-max);
}

export const FLEET_LEARNING_GUARDRAILS = {
  approvedLessonsOnly: true,
  evidenceRequired: true,
  crossTenantLearningAllowed: false,
  mutatesModelWeights: false,
  mutatesAgentCode: false,
  maxLearningContext: 64,
};
