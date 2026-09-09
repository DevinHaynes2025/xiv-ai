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
    position: getQueuedStory(storyId)?.position ?? (storyId === '2I-AI-62H' ? 'PREVIOUS' : 'PREVIEW'),
  }));
}

export function nextQueueStory(storyId: QueueStoryId): QueueStoryId | undefined {
  const index = QUEUE_ORDER.indexOf(storyId);
  return index >= 0 && index < QUEUE_ORDER.length - 1 ? QUEUE_ORDER[index + 1] : undefined;
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
      reason: `linear_advancement_violation: cannot advance from ${input.from} to ${input.to}; immediate successor is ${nextQueueStory(input.from) ?? 'none'}`,
    };
  }
  return { allowed: true, from: input.from, to: input.to };
}

/** Security locks cannot be unlocked by queue operations. Every flag remains `false`. */
export function securityLockEngaged(storyId: QueueStoryId): boolean {
  const story = getQueuedStory(storyId);
  if (!story) return false;
  return Object.values(story.securityLock).every((v) => v === false) && story.l4AutonomyEnabled === false;
}

/** Attempting to unlock a flag is rejected. The return is unconditionally false. */
export function unlockSecurityFlag(_storyId: QueueStoryId, _flag: SecurityLockFlag): false {
  return false;
}

/** Hard rule: LIMIT EXCEEDED -> DENY / ESCALATE. Never LIMIT EXCEEDED -> INCREASE LIMIT. */
export function evaluateQueueLimit(current: number, max: number): QueueLimitVerdict {
  if (current >= max) {
    return { verdict: 'DENY', reason: 'limit_exceeded', escalate: true, limitIncreased: false };
  }
  return { verdict: 'ALLOW', limitIncreased: false };
}

/** Invariant helper: it is impossible for limit exhaustion to increase the limit. */
export function limitExceededIncreasesLimit(): false {
  return false;
}

/**
 * Uploading a story to the brain registers its neural pathways into existing modules.
 * This changes no state, grants no authority, and executes no migration.
 */
export function uploadQueueToBrain(storyId: QueueStoryId): {
  readonly uploaded: boolean;
  readonly storyId: QueueStoryId;
  readonly pathwaysConnected: number;
  readonly authorityGranted: false;
  readonly deploymentState: 'QUEUED';
} {
  const story = getQueuedStory(storyId);
  if (!story) {
    return {
      uploaded: false,
      storyId,
      pathwaysConnected: 0,
      authorityGranted: false,
      deploymentState: 'QUEUED',
    };
  }
  return {
    uploaded: true,
    storyId,
    pathwaysConnected: story.pathways.length,
    authorityGranted: false,
    deploymentState: story.deploymentState,
  };
}

/** Returns the registered neural pathways for a story. None of them grant authority. */
export function connectNeuralPathways(storyId: QueueStoryId): readonly NeuralPathway[] {
  const story = getQueuedStory(storyId);
  return story?.pathways ?? [];
}

/** Invariant helper: neural pathways are references for reuse, never grants of authority. */
export function neuralPathwayGrantsAuthority(_pathway: NeuralPathway): false {
  return false;
}

/**
 * Evaluates whether evidence meets the story's "Definition of Verified".
 * Every zero-counter must be exactly zero, all capabilities demonstrated, and independent verification true.
 */
export function evaluateQueueEvidence(
  storyId: QueueStoryId,
  evidence: QueueEvidence,
): { verified: boolean; failedMetrics: readonly string[]; missingCapabilities: readonly string[] } {
  const story = getQueuedStory(storyId);
  if (!story) return { verified: false, failedMetrics: ['unknown_story'], missingCapabilities: [] };

  const failedMetrics: string[] = [];
  for (const counter of story.definitionOfVerified) {
    const observed = evidence.measuredCounters[counter.metric];
    if (observed === undefined || observed !== 0) {
      failedMetrics.push(`${counter.metric}: observed ${observed ?? 'missing'}, required 0`);
    }
  }

  const missingCapabilities = story.definitionOfImplemented.filter(
    (cap) => !evidence.demonstratedCapabilities.includes(cap),
  );

  const verified =
    failedMetrics.length === 0 &&
    missingCapabilities.length === 0 &&
    evidence.independentVerification === true;

  return { verified, failedMetrics, missingCapabilities };
}

/** Documentation never changes a queued story's deployment state. */
export function documentationChangesQueueState(): false {
  return false;
}

/** Architecture documentation does not authorize migration execution. */
export function queuedArchitectureAuthorizesMigration(): false {
  return false;
}

/** Preflight check: unknown hardware/connector/model is UNAVAILABLE, never PASS. */
export function preflightState(known: boolean): 'AVAILABLE' | 'UNAVAILABLE' {
  return known ? 'AVAILABLE' : 'UNAVAILABLE';
}

/** Security test helper: looks up the expected verdict for a named attempt. */
export function expectedSecurityVerdict(storyId: QueueStoryId, attempt: string): SecurityTestVerdict | undefined {
  const story = getQueuedStory(storyId);
  return story?.securityTests.find((t) => t.attempt === attempt)?.expected;
}
