/**
 * XIV Architecture Queue barrel.
 * Queued 62-series architecture uploaded into the brain. Reference only; grants no authority.
 */

export { QUEUE_STORY_IDS, SECURITY_LOCK_FLAGS } from './types';
export type {
  NeuralPathway,
  QueueDeploymentState,
  QueueEvidence,
  QueueLimitVerdict,
  QueuePosition,
  QueueSecurityTest,
  QueueStoryId,
  QueuedStory,
  SecurityLock,
  SecurityLockFlag,
  SecurityTestVerdict,
  VerifiedZeroCounter,
} from './types';

export { QUEUE_ORDER, XIV_ARCHITECTURE_QUEUE } from './stories';

export {
  advanceQueue,
  connectNeuralPathways,
  currentQueueStory,
  documentationChangesQueueState,
  evaluateQueueEvidence,
  evaluateQueueLimit,
  expectedSecurityVerdict,
  getQueuedStory,
  limitExceededIncreasesLimit,
  listQueuedStories,
  neuralPathwayGrantsAuthority,
  nextQueueStory,
  preflightState,
  previousQueueStory,
  queueAdvancement,
  queuedArchitectureAuthorizesMigration,
  securityLockEngaged,
  unlockSecurityFlag,
  uploadQueueToBrain,
} from './governor';
export type { QueueAdvancementStep, QueueUpload } from './governor';
