export { runContinuousLearningCycle, learningCycleId } from './engine';
export { evaluateLearningContext } from './evaluation';
export { continuousLearningMutatesModels } from './feedback';
export { recordLesson } from './lessons';
export { learningStateFromOutcome, neverFabricateSuccess, recordFailedOutcome } from './outcomes';
export type { LearningContext, LearningState } from './types';
export {
  LEARNING_LIFECYCLE,
  createLearningLesson,
  learningMayMutateAgentAuthority,
  learningMayRewriteSecurityPolicy,
} from './cycle';
export type {
  AgentAction,
  AgentHypothesis,
  AgentObservation,
  AgentPrediction,
  AgentRecommendation,
  HumanDecision,
  LearningEvidence,
  LearningLesson,
  LearningScope,
  ObservedOutcome,
  OutcomeEvaluation,
} from './cycle';
