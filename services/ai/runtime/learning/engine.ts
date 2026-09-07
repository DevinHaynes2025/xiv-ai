import { createId } from '../actions';
import { recordLesson } from '../feedback';
import { neverFabricateSuccess, recordFailedOutcome } from './outcomes';
import type { LearningContext } from './types';

export function runContinuousLearningCycle(input: {
  problem: string;
  recommendationId: string;
  decision: LearningContext['decision'];
  expectedOutcome: string;
  actualOutcome?: string | null;
}): LearningContext {
  const outcome = neverFabricateSuccess(
    recordFailedOutcome(input.problem, input.expectedOutcome),
  );
  const lesson = recordLesson({
    ...outcome,
    recommendationId: input.recommendationId,
    decision: input.decision,
    actualOutcome: input.actualOutcome ?? outcome.actualOutcome,
  });
  return {
    problem: input.problem,
    recommendationId: input.recommendationId,
    decision: input.decision,
    expectedOutcome: input.expectedOutcome,
    actualOutcome: input.actualOutcome ?? null,
    lessons: [lesson.summary],
    mutatesModel: false,
    mutatesAgentCode: false,
  };
}

export function learningCycleId() {
  return createId('lrn');
}
