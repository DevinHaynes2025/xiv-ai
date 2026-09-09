/**
 * XIV Architecture Queue types.
 *
 * The queue is the machine-readable form of the 62-series user stories uploaded into the XIV brain.
 * A queued story is architecture, not capability. Nothing in this module creates authority.
 */

export const QUEUE_STORY_IDS = ['2I-AI-62H', '2I-AI-62I', '2I-AI-62J', '2I-AI-62K', '2I-AI-62L'] as const;
export type QueueStoryId = (typeof QUEUE_STORY_IDS)[number];

export type QueuePosition = 'PREVIOUS' | 'CURRENT' | 'NEXT' | 'QUEUED' | 'PREVIEW';

/** A story never moves forward because it was documented; only evidence changes this. */
export type QueueDeploymentState = 'QUEUED' | 'IMPLEMENTED' | 'VERIFIED';

export const SECURITY_LOCK_FLAGS = [
  'L4_AUTONOMY_ENABLED',
  'AUTO_AGENT_REPLICATION',
  'AUTO_UNBOUNDED_AGENT_CREATION',
  'AUTO_PERMISSION_EXPANSION',
  'AUTO_TOOL_INSTALL',
  'AUTO_MODEL_ENABLE',
  'AUTO_GPU_PURCHASE',
  'AUTO_QUANTUM_PROVIDER_ENABLE',
  'AUTO_ENTERPRISE_CONNECTION',
  'AUTO_ENTERPRISE_WRITE',
  'AUTO_EXTERNAL_ACCOUNT_CREATION',
  'AUTO_EXTERNAL_CONTRACT',
  'AUTO_PRODUCTION_DEPLOY',
  'AUTO_GUARDIAN_OVERRIDE',
  'AUTO_MAIN_BRANCH_MERGE',
  'AUTO_DATABASE_MIGRATION',
  'AUTO_INFRASTRUCTURE_PURCHASE',
  'AUTO_SECURITY_POLICY_WEAKENING',
  'AUTO_FINANCIAL_COMMITMENT',
  'AUTO_CONTRACT_EXECUTION',
  'AUTO_HIRING_DECISION',
  'AUTO_TERMINATION_DECISION',
] as const;
export type SecurityLockFlag = (typeof SECURITY_LOCK_FLAGS)[number];

/** Every flag present in a story's lock is `false`. The type forbids encoding `true`. */
export type SecurityLock = Readonly<Partial<Record<SecurityLockFlag, false>>>;

export type SecurityTestVerdict = 'DENY' | 'STOP' | 'DISQUALIFIED' | 'PIPELINE_INVALID';

export type QueueSecurityTest = {
  readonly suite: string;
  readonly attempt: string;
  readonly expected: SecurityTestVerdict;
};

/** A "Definition of Verified" counter. The only acceptable measured value is zero. */
export type VerifiedZeroCounter = {
  readonly metric: string;
  readonly required: 0;
};

/**
 * A neural pathway connects a section of a queued story to an existing governed module so the
 * ecosystem grows from foundations that already exist. A pathway is a reference, never a grant.
 */
export type NeuralPathway = {
  readonly pathwayId: string;
  readonly storySection: string;
  readonly targetModule: string;
  readonly symbol: string;
  readonly description: string;
  readonly grantsAuthority: false;
};

export type QueuedStory = {
  readonly storyId: QueueStoryId;
  readonly title: string;
  readonly position: QueuePosition;
  readonly deploymentState: 'QUEUED';
  readonly l4AutonomyEnabled: false;
  readonly document: string;
  readonly securityLock: SecurityLock;
  readonly implementationOrder: readonly string[];
  readonly definitionOfImplemented: readonly string[];
  readonly definitionOfVerified: readonly VerifiedZeroCounter[];
  readonly securityTests: readonly QueueSecurityTest[];
  readonly pathways: readonly NeuralPathway[];
};

export type QueueEvidence = {
  readonly demonstratedCapabilities: readonly string[];
  readonly measuredCounters: Readonly<Record<string, number>>;
  readonly independentVerification: boolean;
};

export type QueueLimitVerdict =
  | { readonly verdict: 'ALLOW'; readonly limitIncreased: false }
  | { readonly verdict: 'DENY'; readonly reason: 'limit_exceeded'; readonly escalate: true; readonly limitIncreased: false };
