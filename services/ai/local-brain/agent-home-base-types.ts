/**
 * 62L-EM1 — XIV Agent Home Base Contract types
 *
 * Core flow:
 * XIV Home Base → agent mission → bounded branch task →
 * CPU/GPU/NPU/model/tool → evidence/result → return receipt → Home Base
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * L4_AUTONOMY_ENABLED=false — no silent authority / tip-land / PR.
 */

export const EM1_HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const EM1_CORE_FLOW = [
  'XIV_HOME_BASE',
  'AGENT_MISSION',
  'BOUNDED_BRANCH_TASK',
  'CPU_GPU_NPU_MODEL_TOOL',
  'EVIDENCE_RESULT',
  'RETURN_RECEIPT',
  'HOME_BASE',
] as const;

export const EM1_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  CHILD_BROADER_THAN_PARENT: false as const,
  SILENT_PERMANENT_AUTHORITY: false as const,
  CROSS_ORG_MOVE_DEFAULT: false as const,
  CROSS_UNIVERSE_MOVE_DEFAULT: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_AS_RESULT: false as const,
  EXPIRED_BRANCH_SILENT_CONTINUE: false as const,
  REVOKED_ACCEPTS_NEW_WORK: false as const,
  HIGH_CONSEQUENCE_WITHOUT_HUMAN_AUTH: false as const,
  MANAGE_PULL_REQUEST: false as const,
});

export const NEXT_PHASE_EM2 =
  'EM2 — Branch-and-Return Task Graph — split work into child missions, coordinate, merge verified results back into main XIV brain' as const;

/** Runtime / heartbeat states used by Home Base agents. */
export type AgentRuntimeState =
  | 'REGISTERED'
  | 'ACTIVE'
  | 'BRANCHED'
  | 'RETURNING'
  | 'CHECKPOINTED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'DENIED';

export type HeartbeatState =
  | 'RUNNING_VERIFIED'
  | 'STALE'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'UNKNOWN';

export type RevocationState = 'ACTIVE' | 'REVOKED' | 'PENDING_REVOKE';

export type ScopeKind = 'organization' | 'personal';

export type DataClass =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'sovereign';

export type ComputeBudget = {
  maxRuntimeMs: number;
  maxCpuPercent: number;
  maxGpuMemoryBytes: number;
  maxNpuMemoryBytes: number;
  maxRamBytes: number;
  maxModelSessions: number;
  maxToolCalls: number;
};

export type BranchBounds = {
  maxRuntimeMs: number;
  resourceBudget: ComputeBudget;
  taskScope: string;
  stopCondition: string;
};

export type AgentHeartbeat = {
  state: HeartbeatState;
  observedAt: string | null;
  nodeId: string | null;
};

/**
 * Required Home Base agent fields (EM1 contract).
 * organizationId XOR personalScopeId must be present via scopeKind.
 */
export type HomeBaseAgentContract = {
  agentId: string;
  homeUniverseId: string;
  scopeKind: ScopeKind;
  /** Required when scopeKind === 'organization'. */
  organizationId: string | null;
  /** Required when scopeKind === 'personal'. */
  personalScopeId: string | null;
  ownerUserId: string;
  mission: string;
  allowedTools: readonly string[];
  allowedDataClasses: readonly DataClass[];
  computeBudget: ComputeBudget;
  runtimeState: AgentRuntimeState;
  heartbeat: AgentHeartbeat;
  /** null only for the root Home Base agent itself. */
  parentAgentId: string | null;
  returnPath: string;
  expiry: string;
  revocationState: RevocationState;
  /** Home Base id this agent returns to (root uses own agentId). */
  homeBaseId: string;
  branchBounds: BranchBounds;
  /** Permanent self-authority is always false under EM1. */
  permanentAuthority: false;
  /** High-consequence actions require human auth at Home Base. */
  requiresHumanAuthForHighConsequence: true;
};

export type StructuredEvidence = {
  kind: 'structured_evidence';
  summary: string;
  facts: Readonly<Record<string, unknown>>;
  artifacts: readonly string[];
  /** Explicitly forbid shipping raw hidden CoT as the result. */
  hiddenChainOfThought: null;
};

export type ReturnEnvelopePayload = {
  agentId: string;
  homeBaseId: string;
  parentAgentId: string | null;
  returnPath: string;
  mission: string;
  evidence: StructuredEvidence;
  completedAt: string;
  branchId: string;
  highConsequence: boolean;
  humanAuthorizationRequired: boolean;
  humanAuthorized: boolean;
};

export type SignedReturnEnvelope = {
  payload: ReturnEnvelopePayload;
  signature: string;
  algorithm: 'HMAC-SHA256';
  signedAt: string;
  keyId: string;
};

export type BranchValidationOk = {
  valid: true;
  agent: HomeBaseAgentContract;
  reasons: string[];
};

export type BranchValidationDeny = {
  valid: false;
  denialCode: string;
  reasons: string[];
  runtimeState: AgentRuntimeState;
};

export type BranchValidationResult = BranchValidationOk | BranchValidationDeny;

export type CheckpointResult = {
  agentId: string;
  runtimeState: 'WAITING_NODE' | 'CHECKPOINTED';
  checkpointId: string;
  reason: string;
  evidencePreserved: true;
};

export const DATA_CLASS_RANK: Readonly<Record<DataClass, number>> = {
  public: 0,
  internal: 1,
  confidential: 2,
  restricted: 3,
  sovereign: 4,
};
