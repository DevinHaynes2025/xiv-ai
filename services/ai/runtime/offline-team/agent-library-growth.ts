export interface AgentLibraryLesson {
  lessonId: string;
  domain: string;
  sourceRefs: string[];
  evaluationScore: number;
  approved: boolean;
  tenantId: string;
}

export interface AgentLibraryPromotion {
  lessonId: string;
  status: 'STUDY_ONLY' | 'ELIGIBLE_FOR_MEMORY' | 'REJECTED';
  reason: string;
}

export function evaluateAgentLibraryLesson(lesson: AgentLibraryLesson): AgentLibraryPromotion {
  if (!lesson.tenantId || lesson.sourceRefs.length === 0) return { lessonId: lesson.lessonId, status: 'REJECTED', reason: 'missing tenant/source evidence' };
  if (!lesson.approved) return { lessonId: lesson.lessonId, status: 'STUDY_ONLY', reason: 'human approval required' };
  if (lesson.evaluationScore < 0.8) return { lessonId: lesson.lessonId, status: 'STUDY_ONLY', reason: 'evaluation threshold not met' };
  return { lessonId: lesson.lessonId, status: 'ELIGIBLE_FOR_MEMORY', reason: 'approved and evaluated' };
}
