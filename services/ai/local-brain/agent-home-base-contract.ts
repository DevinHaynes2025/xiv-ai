/**
 * 62L-EM1 — XIV Agent Home Base Contract
 *
 * Encodes required agent fields, branch validation, permission inheritance,
 * signed return envelopes, and denial rules for the Home Base lifecycle.
 *
 * Soft-wires local-runtime heartbeat + EL9 resource governor (presence / policy).
 * Soft-wires #157 EM home base module when present on disk (not assumed landed).
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  DATA_CLASS_RANK,
  EM1_CORE_FLOW,
  EM1_HONESTY_BANNER,
  EM1_LOCKS,
  NEXT_PHASE_EM2,
  type AgentRuntimeState,
  type BranchValidationResult,
  type CheckpointResult,
  type ComputeBudget,
  type DataClass,
  type HomeBaseAgentContract,
  type ReturnEnvelopePayload,
  type SignedReturnEnvelope,
  type StructuredEvidence,
} from './agent-home-base-types';
import { em1SoftWireSnapshot } from './agent-home-base-soft-wire';

export {
  EM1_CORE_FLOW,
  EM1_HONESTY_BANNER,
  EM1_LOCKS,
  NEXT_PHASE_EM2,
} from './agent-home-base-types';
export type * from './agent-home-base-types';
export { em1SoftWireSnapshot } from './agent-home-base-soft-wire';

/** Default HMAC key id for local/dev signed envelopes (not production KMS). */
export const EM1_DEFAULT_KEY_ID = 'xiv-em1-home-base-dev' as const;

export function assertEm1LocksIntact(): boolean {
  return (
    EM1_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EM1_LOCKS.TIP_LAND === false &&
    EM1_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EM1_LOCKS.CHILD_BROADER_THAN_PARENT === false &&
    EM1_LOCKS.SILENT_PERMANENT_AUTHORITY === false &&
    EM1_LOCKS.CROSS_ORG_MOVE_DEFAULT === false &&
    EM1_LOCKS.CROSS_UNIVERSE_MOVE_DEFAULT === false &&
    EM1_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_AS_RESULT === false &&
    EM1_LOCKS.EXPIRED_BRANCH_SILENT_CONTINUE === false &&
    EM1_LOCKS.REVOKED_ACCEPTS_NEW_WORK === false &&
    EM1_LOCKS.HIGH_CONSEQUENCE_WITHOUT_HUMAN_AUTH === false &&
    EM1_LOCKS.MANAGE_PULL_REQUEST === false
  );
}

export function em1HonestySnapshot() {
  return {
    banner: EM1_HONESTY_BANNER,
    locks: EM1_LOCKS,
    coreFlow: EM1_CORE_FLOW,
    nextPhase: NEXT_PHASE_EM2,
    softWire: em1SoftWireSnapshot(),
    l4AutonomyEnabled: false as const,
  };
}

function deny(
  denialCode: string,
  reasons: string[],
  runtimeState: AgentRuntimeState = 'DENIED',
): BranchValidationResult {
  return { valid: false, denialCode, reasons, runtimeState };
}

function isNonEmpty(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function budgetWithin(parent: ComputeBudget, child: ComputeBudget): string[] {
  const reasons: string[] = [];
  const checks: Array<[keyof ComputeBudget, string]> = [
    ['maxRuntimeMs', 'maxRuntimeMs'],
    ['maxCpuPercent', 'maxCpuPercent'],
    ['maxGpuMemoryBytes', 'maxGpuMemoryBytes'],
    ['maxNpuMemoryBytes', 'maxNpuMemoryBytes'],
    ['maxRamBytes', 'maxRamBytes'],
    ['maxModelSessions', 'maxModelSessions'],
    ['maxToolCalls', 'maxToolCalls'],
  ];
  for (const [key, label] of checks) {
    if (!(Number.isFinite(child[key]) && child[key] >= 0)) {
      reasons.push(`Child ${label} must be a finite non-negative number.`);
      continue;
    }
    if (child[key] > parent[key]) {
      reasons.push(
        `Child ${label} ${child[key]} exceeds parent ceiling ${parent[key]}.`,
      );
    }
  }
  return reasons;
}

function toolsWithin(
  parentTools: readonly string[],
  childTools: readonly string[],
): string[] {
  const parent = new Set(parentTools);
  return childTools
    .filter((t) => !parent.has(t))
    .map((t) => `Child tool "${t}" is not in parent allowedTools.`);
}

function dataClassesWithin(
  parent: readonly DataClass[],
  child: readonly DataClass[],
): string[] {
  const maxParent = Math.max(...parent.map((c) => DATA_CLASS_RANK[c]), 0);
  return child
    .filter((c) => DATA_CLASS_RANK[c] > maxParent)
    .map(
      (c) =>
        `Child data class "${c}" exceeds parent max classification rank ${maxParent}.`,
    );
}

function scopeMatchesParent(
  parent: HomeBaseAgentContract,
  child: HomeBaseAgentContract,
): string[] {
  const reasons: string[] = [];
  if (child.homeUniverseId !== parent.homeUniverseId) {
    reasons.push(
      `Cross-Universe movement denied by default (${child.homeUniverseId} ≠ ${parent.homeUniverseId}).`,
    );
  }
  if (parent.scopeKind === 'organization' || child.scopeKind === 'organization') {
    if (child.organizationId !== parent.organizationId) {
      reasons.push(
        `Cross-organization movement denied by default (${child.organizationId} ≠ ${parent.organizationId}).`,
      );
    }
  }
  if (parent.scopeKind === 'personal' || child.scopeKind === 'personal') {
    if (child.personalScopeId !== parent.personalScopeId) {
      reasons.push(
        `Cross-personal-scope movement denied by default (${child.personalScopeId} ≠ ${parent.personalScopeId}).`,
      );
    }
  }
  if (child.scopeKind !== parent.scopeKind) {
    reasons.push(
      `Scope kind change denied by default (${child.scopeKind} ≠ ${parent.scopeKind}).`,
    );
  }
  return reasons;
}

function requiredFieldsPresent(agent: HomeBaseAgentContract): string[] {
  const reasons: string[] = [];
  if (!isNonEmpty(agent.agentId)) reasons.push('agentId is required.');
  if (!isNonEmpty(agent.homeUniverseId)) reasons.push('homeUniverseId is required.');
  if (!isNonEmpty(agent.ownerUserId)) reasons.push('ownerUserId is required.');
  if (!isNonEmpty(agent.mission)) reasons.push('mission is required.');
  if (!isNonEmpty(agent.returnPath)) reasons.push('returnPath is required (every agent must know where to return).');
  if (!isNonEmpty(agent.expiry)) reasons.push('expiry is required.');
  if (!isNonEmpty(agent.homeBaseId)) reasons.push('homeBaseId (Home Base) is required.');
  if (!Array.isArray(agent.allowedTools)) reasons.push('allowedTools is required.');
  if (!Array.isArray(agent.allowedDataClasses) || agent.allowedDataClasses.length === 0) {
    reasons.push('allowedDataClasses must be a non-empty list.');
  }
  if (agent.scopeKind === 'organization' && !isNonEmpty(agent.organizationId)) {
    reasons.push('organizationId is required for organization scope.');
  }
  if (agent.scopeKind === 'personal' && !isNonEmpty(agent.personalScopeId)) {
    reasons.push('personalScopeId is required for personal scope.');
  }
  if (!agent.branchBounds) {
    reasons.push('branchBounds (max runtime, resource budget, task scope, stop condition) required.');
  } else {
    if (!isNonEmpty(agent.branchBounds.taskScope)) {
      reasons.push('branchBounds.taskScope is required.');
    }
    if (!isNonEmpty(agent.branchBounds.stopCondition)) {
      reasons.push('branchBounds.stopCondition is required.');
    }
    if (
      !Number.isFinite(agent.branchBounds.maxRuntimeMs) ||
      agent.branchBounds.maxRuntimeMs <= 0
    ) {
      reasons.push('branchBounds.maxRuntimeMs must be a positive finite number.');
    }
  }
  if (!agent.heartbeat || !agent.heartbeat.state) {
    reasons.push('heartbeat state is required.');
  }
  if (agent.permanentAuthority !== false) {
    reasons.push('permanentAuthority must be false — no agent can create itself permanent authority.');
  }
  if (agent.requiresHumanAuthForHighConsequence !== true) {
    reasons.push('requiresHumanAuthForHighConsequence must be true.');
  }
  return reasons;
}

/**
 * Validate a child branch against its parent/Home Base.
 * A branch is valid only with: known parent/Home Base, bounded authority,
 * explicit compute/data limits, heartbeat state, and (later) signed return envelope.
 */
export function validateBranchAgainstParent(
  parent: HomeBaseAgentContract,
  child: HomeBaseAgentContract,
  now: Date = new Date(),
): BranchValidationResult {
  const fieldReasons = [
    ...requiredFieldsPresent(parent),
    ...requiredFieldsPresent(child),
  ];
  if (fieldReasons.length > 0) {
    return deny('MISSING_REQUIRED_FIELDS', fieldReasons);
  }

  if (!isNonEmpty(child.parentAgentId) || child.parentAgentId !== parent.agentId) {
    return deny('UNKNOWN_PARENT', [
      'Child branch must declare known parentAgentId matching the parent agent.',
    ]);
  }

  if (child.homeBaseId !== parent.homeBaseId && child.homeBaseId !== parent.agentId) {
    return deny('UNKNOWN_HOME_BASE', [
      `Child homeBaseId ${child.homeBaseId} does not match parent Home Base.`,
    ]);
  }

  if (parent.revocationState === 'REVOKED' || child.revocationState === 'REVOKED') {
    return deny(
      'REVOKED',
      ['Revoked agents stop accepting new work.'],
      'REVOKED',
    );
  }

  const expiryMs = Date.parse(child.expiry);
  if (!Number.isFinite(expiryMs)) {
    return deny('INVALID_EXPIRY', ['Child expiry must be a valid ISO timestamp.']);
  }
  if (now.getTime() > expiryMs) {
    return deny(
      'EXPIRED',
      ['Expired branch cannot silently continue.'],
      'EXPIRED',
    );
  }

  if (child.permanentAuthority !== false) {
    return deny('PERMANENT_AUTHORITY_DENIED', [
      'No agent can create itself permanent authority.',
    ]);
  }

  const scopeReasons = scopeMatchesParent(parent, child);
  if (scopeReasons.length > 0) {
    return deny('CROSS_SCOPE_DENIED', scopeReasons);
  }

  const inheritReasons = [
    ...toolsWithin(parent.allowedTools, child.allowedTools),
    ...dataClassesWithin(parent.allowedDataClasses, child.allowedDataClasses),
    ...budgetWithin(parent.computeBudget, child.computeBudget),
    ...budgetWithin(parent.branchBounds.resourceBudget, child.branchBounds.resourceBudget),
  ];
  if (child.branchBounds.maxRuntimeMs > parent.branchBounds.maxRuntimeMs) {
    inheritReasons.push(
      `Child maxRuntimeMs ${child.branchBounds.maxRuntimeMs} exceeds parent ${parent.branchBounds.maxRuntimeMs}.`,
    );
  }
  if (inheritReasons.length > 0) {
    return deny('BROADER_THAN_PARENT', inheritReasons);
  }

  if (
    child.heartbeat.state === 'WAITING_NODE' ||
    child.heartbeat.state === 'OFFLINE_STOPPED' ||
    child.heartbeat.state === 'STALE'
  ) {
    return deny(
      'HOME_BASE_UNAVAILABLE',
      [
        `Heartbeat ${child.heartbeat.state}: checkpoint safely → WAITING_NODE; do not claim work.`,
      ],
      'WAITING_NODE',
    );
  }

  if (!isNonEmpty(child.returnPath)) {
    return deny('MISSING_RETURN_PATH', [
      'Every agent must know where to return results (returnPath).',
    ]);
  }

  return {
    valid: true,
    agent: { ...child, runtimeState: 'BRANCHED' },
    reasons: ['Branch accepted: known parent/Home Base, bounded authority, limits, heartbeat.'],
  };
}

/** Revoked agents reject new work. */
export function acceptNewWork(
  agent: HomeBaseAgentContract,
  now: Date = new Date(),
): { accepted: boolean; reason: string; runtimeState: AgentRuntimeState } {
  if (agent.revocationState === 'REVOKED') {
    return {
      accepted: false,
      reason: 'Revoked agents stop accepting new work.',
      runtimeState: 'REVOKED',
    };
  }
  const expiryMs = Date.parse(agent.expiry);
  if (Number.isFinite(expiryMs) && now.getTime() > expiryMs) {
    return {
      accepted: false,
      reason: 'Expired branch cannot silently continue.',
      runtimeState: 'EXPIRED',
    };
  }
  if (
    agent.heartbeat.state === 'WAITING_NODE' ||
    agent.heartbeat.state === 'OFFLINE_STOPPED' ||
    agent.heartbeat.state === 'STALE'
  ) {
    return {
      accepted: false,
      reason: 'Home Base / node unavailable — WAITING_NODE.',
      runtimeState: 'WAITING_NODE',
    };
  }
  return {
    accepted: true,
    reason: 'Agent ACTIVE and eligible for bounded work.',
    runtimeState: 'ACTIVE',
  };
}

/**
 * When Home Base is unavailable: checkpoint safely → WAITING_NODE.
 * Never continue as if Home Base were reachable.
 */
export function checkpointWhenHomeBaseUnavailable(
  agent: HomeBaseAgentContract,
  homeBaseReachable: boolean,
  reason = 'Home Base unavailable',
): CheckpointResult {
  if (homeBaseReachable) {
    return {
      agentId: agent.agentId,
      runtimeState: 'CHECKPOINTED',
      checkpointId: `ckpt_${agent.agentId}_reachable`,
      reason: 'Home Base reachable — optional checkpoint only.',
      evidencePreserved: true,
    };
  }
  return {
    agentId: agent.agentId,
    runtimeState: 'WAITING_NODE',
    checkpointId: `ckpt_${agent.agentId}_${Date.now().toString(36)}`,
    reason: `${reason} — checkpoint safely → WAITING_NODE.`,
    evidencePreserved: true,
  };
}

/** Deny permanent self-authority elevation. */
export function denyPermanentSelfAuthority(input: {
  agentId: string;
  claimPermanentAuthority: boolean;
}): { allowed: false; reason: string; permanentAuthority: false } {
  void input.claimPermanentAuthority;
  return {
    allowed: false,
    reason: 'No agent can create itself permanent authority (EM1 lock).',
    permanentAuthority: false,
  };
}

/**
 * High-consequence recommendations must return to Home Base for human authorization.
 * Never auto-execute under L4_AUTONOMY_ENABLED=false.
 */
export function gateHighConsequenceRecommendation(input: {
  agent: HomeBaseAgentContract;
  recommendation: string;
  humanAuthorized: boolean;
}): {
  allowed: boolean;
  requiresHumanAuth: true;
  returnedToHomeBase: true;
  reason: string;
} {
  void input.recommendation;
  if (EM1_LOCKS.L4_AUTONOMY_ENABLED !== false) {
    return {
      allowed: false,
      requiresHumanAuth: true,
      returnedToHomeBase: true,
      reason: 'L4_AUTONOMY_ENABLED must remain false.',
    };
  }
  if (!input.humanAuthorized) {
    return {
      allowed: false,
      requiresHumanAuth: true,
      returnedToHomeBase: true,
      reason:
        'High-consequence recommendation returned to Home Base for human authorization.',
    };
  }
  return {
    allowed: true,
    requiresHumanAuth: true,
    returnedToHomeBase: true,
    reason: 'Human authorization recorded at Home Base.',
  };
}

/** Build structured evidence — never accept hidden CoT as the result body. */
export function buildStructuredEvidence(input: {
  summary: string;
  facts?: Record<string, unknown>;
  artifacts?: string[];
  hiddenChainOfThought?: string | null;
}): { ok: true; evidence: StructuredEvidence } | { ok: false; reason: string } {
  if (input.hiddenChainOfThought != null && String(input.hiddenChainOfThought).length > 0) {
    return {
      ok: false,
      reason:
        'Results must return as structured evidence, not hidden chain-of-thought.',
    };
  }
  if (!isNonEmpty(input.summary)) {
    return { ok: false, reason: 'Structured evidence requires a non-empty summary.' };
  }
  return {
    ok: true,
    evidence: {
      kind: 'structured_evidence',
      summary: input.summary.trim(),
      facts: Object.freeze({ ...(input.facts ?? {}) }),
      artifacts: Object.freeze([...(input.artifacts ?? [])]),
      hiddenChainOfThought: null,
    },
  };
}

function canonicalPayload(payload: ReturnEnvelopePayload): string {
  return JSON.stringify(payload, Object.keys(payload).sort());
}

export function signReturnEnvelope(
  payload: ReturnEnvelopePayload,
  secret: string,
  keyId: string = EM1_DEFAULT_KEY_ID,
  now: Date = new Date(),
): SignedReturnEnvelope {
  const signedAt = now.toISOString();
  const signature = createHmac('sha256', secret)
    .update(`${keyId}\n${signedAt}\n${canonicalPayload(payload)}`)
    .digest('hex');
  return {
    payload,
    signature,
    algorithm: 'HMAC-SHA256',
    signedAt,
    keyId,
  };
}

export function verifyReturnEnvelope(
  envelope: SignedReturnEnvelope,
  secret: string,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (envelope.algorithm !== 'HMAC-SHA256') {
    reasons.push('Unsupported signature algorithm.');
  }
  if (
    Object.prototype.hasOwnProperty.call(envelope.payload as object, 'hiddenEvidence') ||
    Object.prototype.hasOwnProperty.call(envelope.payload as object, 'chainOfThought')
  ) {
    reasons.push('Hidden evidence / chain-of-thought fields are not allowed on return envelopes.');
  }
  if (envelope.payload.evidence?.kind !== 'structured_evidence') {
    reasons.push('Return envelope must carry structured_evidence.');
  }
  if (envelope.payload.evidence?.hiddenChainOfThought != null) {
    reasons.push('hiddenChainOfThought must be null on structured evidence.');
  }
  if (
    envelope.payload.highConsequence &&
    envelope.payload.humanAuthorizationRequired &&
    !envelope.payload.humanAuthorized
  ) {
    reasons.push(
      'High-consequence return requires humanAuthorization at Home Base.',
    );
  }
  if (!isNonEmpty(envelope.payload.returnPath)) {
    reasons.push('Signed envelope missing returnPath.');
  }
  if (!isNonEmpty(envelope.payload.homeBaseId)) {
    reasons.push('Signed envelope missing homeBaseId.');
  }

  const expected = createHmac('sha256', secret)
    .update(
      `${envelope.keyId}\n${envelope.signedAt}\n${canonicalPayload(envelope.payload)}`,
    )
    .digest('hex');

  try {
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(envelope.signature, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      reasons.push('Return envelope signature mismatch.');
    }
  } catch {
    reasons.push('Return envelope signature malformed.');
  }

  return { ok: reasons.length === 0, reasons };
}

/**
 * Acceptance gate: branch valid only with known parent/Home Base, bounded
 * authority, explicit compute/data limits, heartbeat, and signed return envelope.
 */
export function evaluateBranchAcceptance(input: {
  parent: HomeBaseAgentContract;
  child: HomeBaseAgentContract;
  envelope: SignedReturnEnvelope | null;
  secret: string;
  now?: Date;
}): {
  accepted: boolean;
  reasons: string[];
  validation: BranchValidationResult;
  envelopeOk: boolean;
} {
  const validation = validateBranchAgainstParent(
    input.parent,
    input.child,
    input.now ?? new Date(),
  );
  const reasons: string[] = [];
  if (!validation.valid) {
    reasons.push(...validation.reasons);
    return {
      accepted: false,
      reasons,
      validation,
      envelopeOk: false,
    };
  }

  if (!input.envelope) {
    reasons.push('Signed return envelope is required for branch acceptance.');
    return {
      accepted: false,
      reasons,
      validation,
      envelopeOk: false,
    };
  }

  const verified = verifyReturnEnvelope(input.envelope, input.secret);
  if (!verified.ok) {
    reasons.push(...verified.reasons);
    return {
      accepted: false,
      reasons,
      validation,
      envelopeOk: false,
    };
  }

  if (input.envelope.payload.agentId !== input.child.agentId) {
    reasons.push('Envelope agentId does not match child agent.');
  }
  if (input.envelope.payload.homeBaseId !== input.child.homeBaseId) {
    reasons.push('Envelope homeBaseId does not match child Home Base.');
  }
  if (input.envelope.payload.returnPath !== input.child.returnPath) {
    reasons.push('Envelope returnPath does not match child returnPath.');
  }

  return {
    accepted: reasons.length === 0,
    reasons:
      reasons.length === 0
        ? [
            'Branch accepted: known parent/Home Base, bounded authority, compute/data limits, heartbeat, signed return envelope.',
          ]
        : reasons,
    validation,
    envelopeOk: reasons.length === 0,
  };
}

/** Factory helpers for tests / local wiring. */
export function createHomeBaseRoot(overrides: Partial<HomeBaseAgentContract> = {}): HomeBaseAgentContract {
  const budget: ComputeBudget = {
    maxRuntimeMs: 3_600_000,
    maxCpuPercent: 80,
    maxGpuMemoryBytes: 8 * 1024 * 1024 * 1024,
    maxNpuMemoryBytes: 2 * 1024 * 1024 * 1024,
    maxRamBytes: 16 * 1024 * 1024 * 1024,
    maxModelSessions: 4,
    maxToolCalls: 200,
  };
  const agentId = overrides.agentId ?? 'home-base-root';
  const base: HomeBaseAgentContract = {
    agentId,
    homeUniverseId: 'universe-xiv',
    scopeKind: 'organization',
    organizationId: 'org-xiv',
    personalScopeId: null,
    ownerUserId: 'user-founder',
    mission: 'XIV Home Base — governed agent context',
    allowedTools: ['research', 'simulate', 'price_analyze', 'local_infer'],
    allowedDataClasses: ['public', 'internal', 'confidential'],
    computeBudget: budget,
    runtimeState: 'ACTIVE',
    heartbeat: {
      state: 'RUNNING_VERIFIED',
      observedAt: new Date().toISOString(),
      nodeId: 'node-home',
    },
    parentAgentId: null,
    returnPath: `xiv://home-base/${agentId}/inbox`,
    expiry: new Date(Date.now() + 86_400_000).toISOString(),
    revocationState: 'ACTIVE',
    homeBaseId: agentId,
    branchBounds: {
      maxRuntimeMs: budget.maxRuntimeMs,
      resourceBudget: { ...budget },
      taskScope: 'home-base-root',
      stopCondition: 'mission_complete_or_expiry_or_revoke',
    },
    permanentAuthority: false,
    requiresHumanAuthForHighConsequence: true,
  };
  return {
    ...base,
    ...overrides,
    // Non-negotiable locks — cannot be overridden into permanence / L4.
    permanentAuthority: false,
    requiresHumanAuthForHighConsequence: true,
  };
}

export function createChildBranch(
  parent: HomeBaseAgentContract,
  overrides: Partial<HomeBaseAgentContract> = {},
): HomeBaseAgentContract {
  const childBudget: ComputeBudget = {
    maxRuntimeMs: Math.min(600_000, parent.computeBudget.maxRuntimeMs),
    maxCpuPercent: Math.min(40, parent.computeBudget.maxCpuPercent),
    maxGpuMemoryBytes: Math.min(
      2 * 1024 * 1024 * 1024,
      parent.computeBudget.maxGpuMemoryBytes,
    ),
    maxNpuMemoryBytes: Math.min(
      512 * 1024 * 1024,
      parent.computeBudget.maxNpuMemoryBytes,
    ),
    maxRamBytes: Math.min(4 * 1024 * 1024 * 1024, parent.computeBudget.maxRamBytes),
    maxModelSessions: Math.min(1, parent.computeBudget.maxModelSessions),
    maxToolCalls: Math.min(20, parent.computeBudget.maxToolCalls),
  };
  const agentId = overrides.agentId ?? `child-${parent.agentId}-1`;
  const base: HomeBaseAgentContract = {
    ...parent,
    agentId,
    mission: 'Bounded research branch',
    allowedTools: [...parent.allowedTools].slice(0, 2),
    allowedDataClasses: parent.allowedDataClasses.filter((c) => c !== 'confidential'),
    computeBudget: childBudget,
    runtimeState: 'BRANCHED',
    parentAgentId: parent.agentId,
    returnPath: parent.returnPath,
    homeBaseId: parent.homeBaseId,
    branchBounds: {
      maxRuntimeMs: childBudget.maxRuntimeMs,
      resourceBudget: { ...childBudget },
      taskScope: 'research-pricing-subset',
      stopCondition: 'evidence_ready_or_budget_exhausted',
    },
    permanentAuthority: false,
    requiresHumanAuthForHighConsequence: true,
  };
  return {
    ...base,
    ...overrides,
    parentAgentId: overrides.parentAgentId ?? parent.agentId,
    homeBaseId: overrides.homeBaseId ?? parent.homeBaseId,
    permanentAuthority: false,
    requiresHumanAuthForHighConsequence: true,
  };
}
