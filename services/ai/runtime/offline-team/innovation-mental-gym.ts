export interface InnovationProposal {
  proposalId: string;
  tenantId: string;
  authorAgentId: string;
  objective: string;
  hypothesis: string;
  evidenceRefs: readonly string[];
  state: 'PROPOSED' | 'REVIEW' | 'EXPERIMENT' | 'REJECTED' | 'LEARNED';
  productionMutationAllowed: false;
}

export interface MentalGymExercise {
  exerciseId: string;
  skill: 'REASONING' | 'DEBUGGING' | 'PLANNING' | 'CRITIQUE' | 'EVIDENCE' | 'CREATIVITY';
  prompt: string;
  rubric: readonly string[];
  maxScore: number;
}

export interface MentalGymResult {
  exerciseId: string;
  agentId: string;
  score: number;
  evidenceRefs: readonly string[];
  passed: boolean;
}

export const INNOVATION_MENTAL_GYM_GUARDRAILS = {
  experimentsAreSandboxed: true,
  productionMutationAllowed: false,
  evidenceRequiredForPromotion: true,
  scoresDoNotImplyConsciousnessOrGeneralIntelligence: true,
} as const;

export function evaluateMentalGym(input: {
  exercise: MentalGymExercise;
  agentId: string;
  score: number;
  evidenceRefs: readonly string[];
}): MentalGymResult {
  const boundedScore = Math.max(0, Math.min(input.score, input.exercise.maxScore));
  return Object.freeze({
    exerciseId: input.exercise.exerciseId,
    agentId: input.agentId,
    score: boundedScore,
    evidenceRefs: Object.freeze([...input.evidenceRefs]),
    passed: boundedScore >= Math.ceil(input.exercise.maxScore * 0.7) && input.evidenceRefs.length > 0,
  });
}
