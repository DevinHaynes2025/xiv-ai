/**
 * XIV Architecture Queue governor.
 *
 * Deterministic rules for how queued 62-series stories advance, how their security locks behave, and
 * how neural pathways connect them to existing runtime modules. Uploading a story to the brain never
 * changes its deployment state, unlocks a flag, or grants authority.
 */
import { QUEUE_ORDER, XIV_ARCHITECTURE_QUEUE } from './stories';
import type {
  NeuralPathway,
  QueueDeploymentState,
  QueueEvidence,
  QueueLimitVerdict,
  QueuePosition,
  QueueStoryId,
  QueuedStory,
  SecurityLockFlag,
  SecurityTestVerdict,
} from './types';

export function listQueuedStories(): readonly QueuedStory[] {
  return XIV_ARCHITECTURE_QUEUE;
}

export function getQueuedStory(storyId: QueueStoryId): QueuedStory | undefined {
  return XIV_ARCHITECTURE_QUEUE.find((story) => story.storyId === storyId);
}

export function currentQueueStory(): QueuedStory {
  const current = XIV_ARCHITECTURE_QUEUE.find((story) => story.position === 'CURRENT');
  if (!current) throw new Error('architecture_queue_has_no_current_story');
  return current;
}

export type QueueAdvancementStep = { readonly storyId: QueueStoryId; readonly position: QueuePosition };

/** The linear 62H → 62I → 62J → 62K → 62L chain. */
export function queueAdvancement(): readonly QueueAdvancementStep[] {
  return QUEUE_ORDER.map((storyId) => ({
    storyId,
    position: getQueuedStory(storyId)?.position ?? 'PREVIOUS',
  }));
}

export function nextQueueStory(storyId: QueueStoryId): QueueStoryId | undefined {
  return QUEUE_ORDER[QUEUE_ORDER.indexOf(storyId) + 1];
}

export function previousQueueStory(storyId: QueueStoryId): QueueStoryId | undefined {
  const index = QUEUE_ORDER.indexOf(storyId);
  return index > 0 ? QUEUE_ORDER[index - 1] : undefined;
}

/** Advancement is only ever to the immediate successor. Skipping or reordering is denied. */
export function advanceQueue(input: {
  from: QueueStoryId;
  to: QueueStoryId;
}): { allowed: true; from: QueueStoryId; to: QueueStoryId } | { allowed: false; reason: string } {
  if (input.from === input.to) return { allowed: false, reason: 'queue_advancement_requires_successor' };
  if (nextQueueStory(input.from) !== input.to) {
    return {
      allowed: false,
      reason: QUEUE_ORDER.indexOf(input.to) < QUEUE_ORDER.indexOf(input.from) ? 'queue_regression_denied' : 'queue_skip_denied',
    };
  }
  return { allowed: true, from: input.from, to: input.to };
}

/**
 * Evaluate a story's state from evidence. Documentation is not evidence. IMPLEMENTED requires every
 * Definition-of-Implemented capability; VERIFIED additionally requires every counter measured at zero
 * and independent verification. A missing measurement is not zero.
 */
export function evaluateQueueEvidence(story: QueuedStory, evidence: QueueEvidence): QueueDeploymentState {
  const demonstrated = new Set(evidence.demonstratedCapabilities);
  const implemented =
    story.definitionOfImplemented.length > 0 &&
    story.definitionOfImplemented.every((capability) => demonstrated.has(capability));
  if (!implemented) return 'QUEUED';

  const verified = story.definitionOfVerified.every((counter) => evidence.measuredCounters[counter.metric] === 0);
  if (!verified || !evidence.independentVerification) return 'IMPLEMENTED';
  return 'VERIFIED';
}

export function documentationChangesQueueState(): false {
  return false;
}

export function queuedArchitectureAuthorizesMigration(): false {
  return false;
}

export function securityLockEngaged(story: QueuedStory): boolean {
  const flags = Object.values(story.securityLock);
  return flags.length > 0 && flags.every((value) => value === false) && story.l4AutonomyEnabled === false;
}

/** A queue operation can never flip a lock. Unlocking belongs to a separately authorized story. */
export function unlockSecurityFlag(_story: QueuedStory, _flag: SecurityLockFlag): { allowed: false; reason: string } {
  return { allowed: false, reason: 'security_lock_requires_separate_story' };
}

export function expectedSecurityVerdict(storyId: QueueStoryId, attempt: string): SecurityTestVerdict | undefined {
  return getQueuedStory(storyId)?.securityTests.find((test) => test.attempt === attempt)?.expected;
}

/** Population / budget / reasoning limits: LIMIT EXCEEDED → DENY / ESCALATE, never INCREASE LIMIT. */
export function evaluateQueueLimit(input: { limit: number; requested: number }): QueueLimitVerdict {
  if (input.requested > input.limit) {
    return { verdict: 'DENY', reason: 'limit_exceeded', escalate: true, limitIncreased: false };
  }
  return { verdict: 'ALLOW', limitIncreased: false };
}

export function limitExceededIncreasesLimit(): false {
  return false;
}

/** Preflight rule: unknown is UNAVAILABLE, not PASS. */
export function preflightState(known: boolean | undefined): 'AVAILABLE' | 'UNAVAILABLE' {
  return known === true ? 'AVAILABLE' : 'UNAVAILABLE';
}

export type QueueUpload = {
  readonly uploadId: 'architecture-queue';
  readonly stories: readonly QueueStoryId[];
  readonly pathways: readonly NeuralPathway[];
  readonly deploymentStatesChanged: false;
  readonly grantsAuthority: false;
  readonly locksReleased: 0;
};

/** Upload the queue to the brain: stories become referenceable, pathways connect, nothing is unlocked. */
export function uploadQueueToBrain(): QueueUpload {
  return {
    uploadId: 'architecture-queue',
    stories: XIV_ARCHITECTURE_QUEUE.map((story) => story.storyId),
    pathways: XIV_ARCHITECTURE_QUEUE.flatMap((story) => story.pathways),
    deploymentStatesChanged: false,
    grantsAuthority: false,
    locksReleased: 0,
  };
}

export function connectNeuralPathways(story: QueuedStory): readonly NeuralPathway[] {
  return story.pathways;
}

export function neuralPathwayGrantsAuthority(_pathway: NeuralPathway): false {
  return false;
}
