import type { LearningContext } from './types';

export function evaluateLearningContext(context: LearningContext) {
  return {
    canReferenceLesson: context.lessons.length > 0,
    mutatesModel: context.mutatesModel,
    mutatesAgentCode: context.mutatesAgentCode,
  };
}
