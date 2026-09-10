export type AcademyRole = 'SUPPLY_CHAIN' | 'SECURITY' | 'DATA' | 'AI_ENGINEERING' | 'PRODUCT' | 'FINANCE' | 'DEVOPS' | 'HISTORY' | 'UX' | 'RESEARCH';

export interface AcademyLesson {
  lessonId: string;
  role: AcademyRole;
  objective: string;
  sourceRefs: string[];
  synthetic: boolean;
}

export interface AcademyEvaluation {
  lessonId: string;
  role: AcademyRole;
  score: number;
  evidenceRefs: string[];
  passed: boolean;
  approvedForSharedMemory: boolean;
}

export function evaluateLesson(lesson: AcademyLesson, score: number, evidenceRefs: string[]): AcademyEvaluation {
  const passed = lesson.sourceRefs.length > 0 && evidenceRefs.length > 0 && score >= 0.8;
  return {
    lessonId: lesson.lessonId,
    role: lesson.role,
    score,
    evidenceRefs,
    passed,
    approvedForSharedMemory: false,
  };
}

export const AGENT_ACADEMY_GUARDRAILS = {
  studyDoesNotEqualLearningUntilEvaluated: true,
  failedLessonsDoNotEnterTrustedMemory: true,
  sharedMemoryRequiresExplicitApproval: true,
  noAutonomousWeightTraining: true,
  maxConcurrentStudyAgents: 8,
};
