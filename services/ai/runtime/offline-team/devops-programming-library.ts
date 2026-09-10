export type ProgrammingTrack = 'PYTHON' | 'JAVA' | 'JAVASCRIPT_TYPESCRIPT' | 'DEVOPS' | 'CLOUD' | 'DATA' | 'SECURITY';

export interface LibraryLesson {
  lessonId: string;
  track: ProgrammingTrack;
  title: string;
  sourceRefs: string[];
  exerciseRefs: string[];
  difficulty: 'FOUNDATION' | 'INTERMEDIATE' | 'ADVANCED';
  approved: boolean;
}

export interface AgentStudyReceipt {
  agentId: string;
  lessonId: string;
  score: number;
  evidenceRefs: string[];
  completedAt: string;
}

export function lessonCanEnterTrustedCurriculum(lesson: LibraryLesson, receipt?: AgentStudyReceipt): boolean {
  if (!lesson.approved || !lesson.sourceRefs.length) return false;
  if (!receipt) return false;
  return receipt.lessonId === lesson.lessonId && receipt.score >= 0.8 && receipt.evidenceRefs.length > 0;
}

export const DEVOPS_LIBRARY_GUARDRAILS = {
  approvedSourcesRequired: true,
  exercisesRunInSandboxByDefault: true,
  productionMutationFromTrainingAllowed: false,
  learningReceiptRequired: true,
};
