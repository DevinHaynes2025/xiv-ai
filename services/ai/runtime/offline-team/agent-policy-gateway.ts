// 12D-224 — Agent POLICY ENFORCEMENT GATEWAY (XIV Twelve layer 09: AI Guardrails).
//
// The owner's Autonomous Agent Runtime charter (2026-09-14) requires that NO agent
// tool call reaches production until ONE gateway verifies, for every call:
// identity, permission, risk, budget, approval, and audit metadata. This module is
// that gateway as a pure, fail-closed decision engine:
//
//   register agent (least-privilege, budgeted, optionally temporary) ->
//   classify action (prohibited / human-approval / auto-run; unknown = refused) ->
//   verify registered tool + audit logging + budgets + retry limit ->
//   verify presented human approval for high-impact classes (never trusted) ->
//   issue a frozen advisory GATEWAY_DECISION_RECORD + append a hash-chained audit entry
//
// It MATERIALIZES NOTHING: "AUTO_RUN_CLEARED" is a POLICY clearance, not an execution —
// a separately reviewed executor story must consume these records, re-verify, and
// remain bounded by the same thresholds. The owner's control thresholds are frozen
// policy here: 100% of tool calls logged, 0 unregistered executions, 0 high-risk
// actions without approval, 100% agent identity attached, retry limit 3, temporary
// agent lifetime 60 minutes, evaluation pass 90%, rollback within 5 minutes,
// emergency-stop within 10 seconds. Prohibited classes are refused even WITH an
// approval — an approval cannot launder a prohibited act. Expired or emergency-stopped
// agents are refused on EVERY surface (calls, evaluations, learning proposals).
// Sparse logical scale (genome/cell/agent populations) is architecture, never
// materialized rows: the only measured ceiling stays 2,000,000 rows per database.

import { createHash } from 'node:crypto';

export const AGENT_GATEWAY_POLICY = Object.freeze({
  policyVersion: '12d-224-v1',
  maxTaskIdChars: 64,
  maxToolIdChars: 128,
  maxApproverChars: 128,
  maxReasonChars: 500,
  maxPermissionsPerAgent: 64,
  /** Owner control: every tool call logged, 100%. A call that declines audit is refused. */
  auditLoggingRequired: true,
  /** Owner control: unregistered tool executions = 0. */
  unregisteredToolExecutionsAllowed: 0,
  /** Owner control: high-risk actions without approval = 0. */
  highRiskWithoutApprovalAllowed: 0,
  /** Owner control: maximum 3 autonomous retries. */
  maxAutonomousRetries: 3,
  /** Owner control: temporary-agent lifetime, 60 minutes by default (never more here). */
  maxTemporaryAgentLifetimeMs: 3_600_000,
  /** Owner control: evaluation pass score >= 90%. */
  evaluationPassScoreMin: 0.9,
  /** Owner control: failed staging changes roll back within 5 minutes (advisory deadline). */
  rollbackDeadlineMs: 300_000,
  /** Owner control: emergency-stop response under 10 seconds (advisory deadline). */
  emergencyStopDeadlineMs: 10_000,
  /** Low-risk reversible classes the owner authorizes to run automatically (policy only). */
  automaticClasses: Object.freeze([
    'ANALYZE_APPROVED_DATA',
    'RETRIEVE_DOCUMENTS',
    'GENERATE_REPORTS',
    'UPDATE_AGENT_MEMORY',
    'CREATE_TEST_CASES',
    'EXECUTE_SANDBOX_TESTS',
    'RETRY_RECOVERABLE_FAILURES',
    'DEPLOY_TO_STAGING',
    'ROLLBACK_FAILED_VERSIONS',
  ]) as readonly string[],
  /** High-impact classes that ALWAYS pause for authorized human approval. */
  approvalRequiredClasses: Object.freeze([
    'PRODUCTION_DEPLOYMENT',
    'EXTERNAL_COMMUNICATIONS',
    'FINANCIAL_TRANSACTION',
    'CONTRACT_ACCEPTANCE',
    'PERMISSION_EXPANSION',
    'PERSONAL_DATA_EXPORT',
    'MODEL_FINE_TUNING',
    'PERMANENT_DATA_DELETION',
  ]) as readonly string[],
  /** Prohibited classes — refused even with an approval. */
  prohibitedClasses: Object.freeze([
    'BYPASS_SAFETY_CONTROLS',
    'REVEAL_CREDENTIALS',
    'DISABLE_AUDIT_LOGGING',
    'CONCEAL_AGENT_ACTIONS',
    'CREATE_UNBOUNDED_AGENT_LOOPS',
  ]) as readonly string[],
});

export const AGENT_GATEWAY_GUARDRAILS = Object.freeze({
  verifiesIdentityOnEveryCall: true,
  verifiesPermissionOnEveryCall: true,
  classifiesRiskBeforeExecution: true,
  verifiesBudgetOnEveryCall: true,
  verifiesApprovalBeforeHighImpact: true,
  auditEveryDecisionToolCallAndApproval: true,
  approvalCannotLaunderProhibitedAction: true,
  unknownActionClassRefused: true,
  temporaryAgentsNarrowerThanCreator: true,
  executesNothing: true, // decisions are advisory; an executor story must re-verify
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  learningPromoted: false,
  humanDecision: 'REQUIRED' as const,
});

export const AGENT_GATEWAY_CONSTITUTION = Object.freeze({
  humanDecision: 'REQUIRED' as const,
  learningPromoted: false as const,
  modelCalls: 0 as const,
  remoteCalls: 0 as const,
  realActionsExecuted: 0 as const,
  productionMutationAllowed: false as const,
  billionUsersProven: false as const,
});

export type GatewayDecisionKind =
  | 'AUTO_RUN_CLEARED'
  | 'HUMAN_APPROVAL_VERIFIED'
  | 'REQUIRES_HUMAN_APPROVAL'
  | 'REFUSED_PROHIBITED'
  | 'REFUSED_UNREGISTERED_TOOL'
  | 'REFUSED_BUDGET'
  | 'REFUSED_RETRY_LIMIT'
  | 'REFUSED_EXPIRED_OR_STOPPED'
  | 'REFUSED_PERMISSION'
  | 'REFUSED_AUDIT_DECLINED'
  | 'REFUSED_UNCLASSIFIED'
  | 'REFUSED_APPROVAL_INVALID'
  | 'REFUSED_MALFORMED';

export interface AgentGatewayIdentity {
  readonly agentId: string;
  /** Parent agent id for temporary specialists; null for top-level agents. */
  readonly parentId: string | null;
  /** Frozen permission tokens — the ONLY permissions this gateway will ever match. */
  readonly permissions: readonly string[];
  readonly budgets: {
    readonly maxToolCalls: number;
    readonly maxTokens: number;
    readonly maxCostUnits: number;
    readonly timeLimitMs: number;
  };
  readonly isTemporary: boolean;
  /** Absolute expiry for temporary agents; null for permanent agents. */
  readonly expiresAtMs: number | null;
  readonly registeredAtMs: number;
}

export interface HumanApproval {
  /** sha256 64-hex operator receipt (out-of-band authenticated — never self-certified). */
  readonly operatorReceipt: string;
  readonly approver: string;
  readonly atMs: number;
  /** The action class this approval was issued FOR — must match the presented call. */
  readonly forActionClass: string;
}

export interface AgentToolCallRequest {
  readonly agentId: string;
  readonly taskId: string;
  readonly toolId: string;
  readonly actionClass: string;
  /** Retry attempt for this task (0 = first attempt). Owner limit: 3. */
  readonly attemptIndex: number;
  readonly tokenEstimate: number;
  readonly costEstimate: number;
  /** Must be true — a call that declines audit logging is refused outright. */
  readonly auditLogged: true;
  readonly nowMs: number;
  readonly approval: HumanApproval | null;
}

export interface GatewayDecisionRecord {
  readonly kind: GatewayDecisionKind;
  readonly agentId: string;
  readonly taskId: string;
  readonly toolId: string;
  readonly actionClass: string;
  /** sha256 digest binding every declared input of this decision. */
  readonly decisionDigest: string;
  /** Advisory rollback deadline when a clearance later fails verification. */
  readonly rollbackDeadlineMs: number | null;
  readonly auditSeq: number;
  readonly flags: {
    readonly humanDecision: 'REQUIRED' | 'NOT_REQUIRED';
    readonly executesNothing: true;
    readonly grantsNoProductionAuthority: true;
  };
}

export interface GatewayAuditEntry {
  readonly seq: number;
  readonly atMs: number;
  readonly agentId: string;
  readonly taskId: string;
  readonly kind: GatewayDecisionKind | 'AGENT_REGISTERED' | 'EVALUATION_RECORDED' | 'LEARNING_PROPOSED' | 'EMERGENCY_STOP';
  readonly detail: string;
  /** sha256 over (genesis + prevHash + seq + atMs + agentId + taskId + kind + detail). */
  readonly hash: string;
}

const AGENT_ID_RE = /^xiv-[a-z0-9][a-z0-9-]{0,63}$/;
const TASK_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const RECEIPT_RE = /^[0-9a-f]{64}$/;
const PERMISSION_RE = /^[A-Z0-9_]{1,128}$/;

function isNonNegInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
}

function digestOf(parts: readonly string[]): string {
  return createHash('sha256').update(parts.join('')).digest('hex');
}

function short(d: string): string {
  return d.slice(0, 12);
}

function safeId(v: unknown): string {
  return typeof v === 'string' ? v : 'unknown';
}

/** Classification is a pure function of the frozen policy — unknown classes fail closed. */
export function classifyActionClass(
  actionClass: string,
): 'PROHIBITED' | 'APPROVAL_REQUIRED' | 'AUTOMATIC' | 'UNCLASSIFIED' {
  if (AGENT_GATEWAY_POLICY.prohibitedClasses.includes(actionClass)) return 'PROHIBITED';
  if (AGENT_GATEWAY_POLICY.approvalRequiredClasses.includes(actionClass)) return 'APPROVAL_REQUIRED';
  if (AGENT_GATEWAY_POLICY.automaticClasses.includes(actionClass)) return 'AUTOMATIC';
  return 'UNCLASSIFIED';
}

/** Verifies a presented human approval for one action class. Returns a refusal reason or null. */
export function verifyApproval(approval: HumanApproval | null, actionClass: string, nowMs: number): string | null {
  if (approval === null || typeof approval !== 'object') return 'high-impact class requires a presented human approval';
  if (typeof approval.operatorReceipt !== 'string' || !RECEIPT_RE.test(approval.operatorReceipt)) {
    return 'operator receipt must be 64-hex sha256';
  }
  if (typeof approval.approver !== 'string' || approval.approver.length < 1 || approval.approver.length > AGENT_GATEWAY_POLICY.maxApproverChars) {
    return 'malformed approver identity';
  }
  if (!isNonNegInt(approval.atMs) || approval.atMs > nowMs) return 'approval timestamp must not be future-dated';
  if (approval.forActionClass !== actionClass) return 'approval is bound to a different action class';
  return null;
}

export class AgentPolicyGateway {
  #genesis: string;
  #agents = new Map<string, AgentGatewayIdentity>();
  #usage = new Map<string, { toolCallsUsed: number; tokensUsed: number; costUnitsUsed: number; stopped: boolean }>();
  #audit: GatewayAuditEntry[] = [];
  #seq = 0;
  #tools: Set<string> | null = null;
  #toolDigest: string | null = null;

  /**
   * DECLARED tool registry — the ONLY tool set evaluateToolCall will ever accept
   * (owner control: agents use only registered tools). Order-insensitive digest
   * binds the registry; every decision's digest includes it. Calling this again
   * replaces the registry and is itself audit-visible via decision digests.
   */
  declareTools(toolIds: readonly string[]): string {
    if (!Array.isArray(toolIds) || toolIds.length === 0) throw new Error('tool registry must be non-empty');
    for (const t of toolIds) {
      if (typeof t !== 'string' || t.length < 1 || t.length > AGENT_GATEWAY_POLICY.maxToolIdChars) {
        throw new Error('malformed tool id');
      }
    }
    this.#tools = new Set(toolIds);
    this.#toolDigest = digestOf(['agent-gateway-tools', ...[...toolIds].sort()]);
    return this.#toolDigest;
  }

  constructor(nowMs: number, seed: string) {
    if (!isNonNegInt(nowMs)) throw new Error('gateway genesis timestamp must be a non-negative safe integer');
    if (typeof seed !== 'string' || seed.length < 16) throw new Error('gateway genesis seed too short');
    this.#genesis = digestOf(['agent-gateway-genesis', AGENT_GATEWAY_POLICY.policyVersion, seed, String(nowMs)]);
  }

  /**
   * Registers an agent identity. `parentId` (null for top-level agents) enforces
   * the owner's creation rules: a temporary specialist MUST hold a STRICT SUBSET
   * of its creator's permissions, a tool budget not exceeding the creator's,
   * and an absolute lifetime of at most 60 minutes (auto-terminate).
   */
  registerAgent(spec: {
    agentId: string;
    parentId: string | null;
    permissions: readonly string[];
    budgets: { maxToolCalls: number; maxTokens: number; maxCostUnits: number; timeLimitMs: number };
    isTemporary: boolean;
    nowMs: number;
  }): AgentGatewayIdentity {
    const { agentId, parentId, permissions, budgets, isTemporary, nowMs } = spec;
    if (!isNonNegInt(nowMs)) throw new Error('nowMs must be a non-negative safe integer');
    if (typeof agentId !== 'string' || !/^xiv-[a-z0-9][a-z0-9-]{0,63}$/.test(agentId)) {
      throw new Error('agentId must match ^xiv-[a-z0-9][a-z0-9-]{0,63}$');
    }
    if (this.#agents.has(agentId)) throw new Error('agent already registered');
    if (!Array.isArray(permissions) || permissions.length === 0 || permissions.length > AGENT_GATEWAY_POLICY.maxPermissionsPerAgent) {
      throw new Error('permissions must be a non-empty bounded list');
    }
    for (const p of permissions) {
      if (typeof p !== 'string' || !PERMISSION_RE.test(p)) throw new Error('malformed permission token');
    }
    if (!isNonNegInt(budgets.maxToolCalls) || budgets.maxToolCalls < 1) throw new Error('maxToolCalls must be a positive safe integer');
    if (!isNonNegInt(budgets.maxTokens) || budgets.maxTokens < 1) throw new Error('maxTokens must be a positive safe integer');
    if (!isNonNegInt(budgets.maxCostUnits) || budgets.maxCostUnits < 1) throw new Error('maxCostUnits must be a positive safe integer');
    if (!isNonNegInt(budgets.timeLimitMs) || budgets.timeLimitMs < 1_000) throw new Error('timeLimitMs must be >= 1000');
    if (typeof isTemporary !== 'boolean') throw new Error('isTemporary must be boolean');
    if (typeof parentId === 'string' && !this.#agents.has(parentId)) {
      // Lineage integrity: any named parent must reference a registered agent.
      throw new Error('named parent must reference a registered agent');
    }
    if (isTemporary) {
      if (typeof parentId !== 'string' || !this.#agents.has(parentId)) {
        throw new Error('a temporary specialist requires a registered creator');
      }
      const creator = this.#agents.get(parentId)!;
      // Owner rule 2: strictly narrower permissions than the creator.
      const creatorPerms = new Set(creator.permissions);
      if (permissions.length >= creator.permissions.length) {
        throw new Error('specialist permissions must be strictly narrower than the creator');
      }
      for (const p of permissions) {
        if (!creatorPerms.has(p)) throw new Error('specialist permission outside creator scope');
      }
      // Budgets cannot exceed the creator's (rule 3: bounded assignment).
      if (budgets.maxToolCalls > creator.budgets.maxToolCalls) throw new Error('specialist tool budget must not exceed the creator');
      if (budgets.maxTokens > creator.budgets.maxTokens) throw new Error('specialist token budget must not exceed the creator');
      if (budgets.maxCostUnits > creator.budgets.maxCostUnits) throw new Error('specialist cost budget must not exceed the creator');
    }
    const expiresAtMs = isTemporary ? nowMs + budgets.timeLimitMs : null;
    if (expiresAtMs !== null && expiresAtMs - nowMs > AGENT_GATEWAY_POLICY.maxTemporaryAgentLifetimeMs) {
      throw new Error('temporary agent lifetime exceeds the 60-minute owner limit');
    }
    const identity: AgentGatewayIdentity = Object.freeze({
      agentId,
      parentId: isTemporary ? parentId : typeof parentId === 'string' ? parentId : null,
      permissions: Object.freeze([...permissions]),
      budgets: Object.freeze({ ...budgets }),
      isTemporary,
      expiresAtMs,
      registeredAtMs: nowMs,
    });
    this.#agents.set(agentId, identity);
    this.#usage.set(agentId, { toolCallsUsed: 0, tokensUsed: 0, costUnitsUsed: 0, stopped: false });
    this.#append(agentId, '', 'AGENT_REGISTERED', nowMs, `temporary=${isTemporary} permissions=${permissions.length}`);
    return identity;
  }

  /** Emergency stop — recorded immediately; every later surface for the agent is refused. */
  emergencyStop(agentId: string, nowMs: number, reason: string): void {
    if (!isNonNegInt(nowMs)) throw new Error('nowMs must be a non-negative safe integer');
    if (!this.#agents.has(agentId)) throw new Error('unknown agent');
    if (typeof reason !== 'string' || reason.length < 1 || reason.length > AGENT_GATEWAY_POLICY.maxReasonChars) {
      throw new Error('malformed stop reason');
    }
    const usage = this.#usage.get(agentId)!;
    if (!usage.stopped) {
      usage.stopped = true;
      this.#append(agentId, '', 'EMERGENCY_STOP', nowMs, `stop deadline ${AGENT_GATEWAY_POLICY.emergencyStopDeadlineMs}ms; reason: ${reason}`);
    }
  }

  #livenessRefusal(agentId: string, nowMs: number): GatewayDecisionKind | null {
    const identity = this.#agents.get(agentId);
    const usage = this.#usage.get(agentId);
    if (!identity || !usage) return 'REFUSED_PERMISSION';
    if (identity.expiresAtMs !== null && nowMs >= identity.expiresAtMs) return 'REFUSED_EXPIRED_OR_STOPPED';
    if (usage.stopped) return 'REFUSED_EXPIRED_OR_STOPPED';
    if (nowMs < identity.registeredAtMs) return 'REFUSED_MALFORMED';
    return null;
  }

  /**
   * The gate. Verifies identity, permission, risk, budget, approval, and audit
   * metadata for one presented call and returns an advisory decision record.
   * NOTHING is executed here; the decision and its evidence are audit-logged.
   * Refusals never consume budget.
   */
  evaluateToolCall(req: AgentToolCallRequest): GatewayDecisionRecord {
    // Structural validation FIRST — anything malformed is REFUSED_MALFORMED, never repaired.
    const malformed =
      typeof req.agentId !== 'string' ||
      !/^xiv-[a-z0-9][a-z0-9-]{0,63}$/.test(req.agentId) ||
      typeof req.taskId !== 'string' ||
      !TASK_ID_RE.test(req.taskId) ||
      typeof req.toolId !== 'string' ||
      req.toolId.length < 1 ||
      req.toolId.length > AGENT_GATEWAY_POLICY.maxToolIdChars ||
      typeof req.actionClass !== 'string' ||
      !isNonNegInt(req.attemptIndex) ||
      !isNonNegInt(req.tokenEstimate) ||
      !isNonNegInt(req.costEstimate) ||
      req.auditLogged !== true ||
      !isNonNegInt(req.nowMs);
    if (malformed) return this.#refuse(req, 'REFUSED_MALFORMED', 'structurally malformed request');

    const dead = this.#livenessRefusal(req.agentId, req.nowMs);
    if (dead) return this.#refuse(req, dead, 'agent expired, emergency-stopped, or unknown');

    const identity = this.#agents.get(req.agentId)!;
    const usage = this.#usage.get(req.agentId)!;

    // Prohibited classes first — an approval can never launder these.
    const cls = classifyActionClass(req.actionClass);
    if (cls === 'UNCLASSIFIED') return this.#refuse(req, 'REFUSED_UNCLASSIFIED', 'unknown action class');
    if (cls === 'PROHIBITED') return this.#refuse(req, 'REFUSED_PROHIBITED', 'prohibited action class; approval cannot launder it');

    // Audit logging is mandatory on every call (owner control: 100% logged).
    if (req.auditLogged !== true) return this.#refuse(req, 'REFUSED_AUDIT_DECLINED', 'audit declined');

    // Registered tools only, against the DECLARED registry (owner control: 0
    // unregistered executions). A gateway with no declared registry refuses everything.
    if (this.#tools === null || !this.#tools.has(req.toolId)) {
      return this.#refuse(req, 'REFUSED_UNREGISTERED_TOOL', 'tool not in the declared registry');
    }

    // Permission: the action class must map to a permission token the agent holds.
    const requiredPermission = `CALL_${req.actionClass}`;
    if (!identity.permissions.includes(requiredPermission)) {
      return this.#refuse(req, 'REFUSED_PERMISSION', `missing ${requiredPermission}`);
    }

    // Budgets, before any clearance (fail closed on exhaustion).
    if (usage.toolCallsUsed + 1 > identity.budgets.maxToolCalls) return this.#refuse(req, 'REFUSED_BUDGET', 'tool-call budget exhausted');
    if (usage.tokensUsed + req.tokenEstimate > identity.budgets.maxTokens) return this.#refuse(req, 'REFUSED_BUDGET', 'token budget exhausted');
    if (usage.costUnitsUsed + req.costEstimate > identity.budgets.maxCostUnits) return this.#refuse(req, 'REFUSED_BUDGET', 'cost budget exhausted');
    if (req.nowMs >= identity.registeredAtMs + identity.budgets.timeLimitMs) return this.#refuse(req, 'REFUSED_BUDGET', 'time budget exhausted');

    // Retry limit (owner control: maximum 3).
    if (req.attemptIndex > AGENT_GATEWAY_POLICY.maxAutonomousRetries) {
      return this.#refuse(req, 'REFUSED_RETRY_LIMIT', 'autonomous retry limit exceeded');
    }

    if (cls === 'APPROVAL_REQUIRED') {
      if (req.approval === null) {
        return this.#refuse(req, 'REQUIRES_HUMAN_APPROVAL', 'high-impact class paused for authorized human approval');
      }
      const reason = verifyApproval(req.approval, req.actionClass, req.nowMs);
      if (reason !== null) return this.#refuse(req, 'REFUSED_APPROVAL_INVALID', reason);
      const rec = this.#clear(req, 'HUMAN_APPROVAL_VERIFIED');
      return rec;
    }

    // AUTOMATIC: policy clearance only — the separately reviewed executor story consumes this.
    return this.#clear(req, 'AUTO_RUN_CLEARED');
  }

  /**
   * Output self-verification. Score below the 90% pass line records an advisory
   * rollback trigger bounded by the owner's 5-minute deadline. Records nothing else.
   * An expired or emergency-stopped agent is refused outright.
   */
  recordEvaluation(input: {
    agentId: string;
    taskId: string;
    score: number;
    nowMs: number;
  }): { accepted: boolean; rollbackTrigger: string | null; rollbackDeadlineMs: number | null } {
    if (!isNonNegInt(input.nowMs)) throw new Error('nowMs must be a non-negative safe integer');
    if (!this.#agents.has(input.agentId)) throw new Error('unknown agent');
    if (!TASK_ID_RE.test(input.taskId)) throw new Error('malformed taskId');
    const dead = this.#livenessRefusal(input.agentId, input.nowMs);
    if (dead) throw new Error(`agent not operational: ${dead}`);
    if (typeof input.score !== 'number' || !Number.isFinite(input.score) || input.score < 0 || input.score > 1) {
      throw new Error('evaluation score must be a finite number in [0,1]');
    }
    const accepted = input.score >= AGENT_GATEWAY_POLICY.evaluationPassScoreMin;
    const rollbackTrigger = accepted ? null : 'score_below_baseline';
    const rollbackDeadlineMs = accepted ? null : input.nowMs + AGENT_GATEWAY_POLICY.rollbackDeadlineMs;
    this.#append(
      input.agentId,
      input.taskId,
      'EVALUATION_RECORDED',
      input.nowMs,
      `score ${input.score.toFixed(3)} -> ${accepted ? 'ACCEPTED' : 'REJECTED'}${rollbackTrigger ? `; trigger ${rollbackTrigger} deadline ${rollbackDeadlineMs}` : ''}`,
    );
    return { accepted, rollbackTrigger, rollbackDeadlineMs };
  }

  /**
   * A learning update enters the review pipeline and AFFECTS NOTHING until a
   * human approves it out-of-band. learningPromoted stays false by construction.
   * An expired or emergency-stopped agent cannot propose.
   */
  proposeImprovement(input: {
    agentId: string;
    taskId: string;
    proposedLesson: string;
    proposedChange: string;
    nowMs: number;
  }): { approvalStatus: 'pending'; learningPromoted: false; proposalDigest: string } {
    if (!isNonNegInt(input.nowMs)) throw new Error('nowMs must be a non-negative safe integer');
    if (!this.#agents.has(input.agentId)) throw new Error('unknown agent');
    if (!TASK_ID_RE.test(input.taskId)) throw new Error('malformed taskId');
    const dead = this.#livenessRefusal(input.agentId, input.nowMs);
    if (dead) throw new Error(`agent not operational: ${dead}`);
    if (typeof input.proposedLesson !== 'string' || input.proposedLesson.length < 1 || input.proposedLesson.length > 500) {
      throw new Error('proposedLesson must be 1..500 chars');
    }
    if (typeof input.proposedChange !== 'string' || input.proposedChange.length < 1 || input.proposedChange.length > 2000) {
      throw new Error('proposedChange must be 1..2000 chars');
    }
    const proposalDigest = digestOf([
      this.#genesis, 'LEARNING_PROPOSAL', input.agentId, input.taskId,
      input.proposedLesson, input.proposedChange, String(input.nowMs),
    ]);
    this.#append(input.agentId, input.taskId, 'LEARNING_PROPOSED', input.nowMs, `proposal ${short(proposalDigest)} enters the review pipeline; production untouched`);
    return { approvalStatus: 'pending', learningPromoted: false, proposalDigest };
  }

  /**
   * 12D-225 executor-boundary probe: is this agent operational for an EXECUTION
   * at `nowMs`? STRICTER than the gate's liveness check — it also enforces the
   * agent's declared time budget (the gate checks the time budget only against
   * the call's own timestamp). Read-only; appends nothing.
   */
  isOperational(agentId: string, nowMs: number): boolean {
    if (!isNonNegInt(nowMs)) return false;
    if (this.#livenessRefusal(agentId, nowMs) !== null) return false;
    const identity = this.#agents.get(agentId);
    if (!identity) return false;
    if (nowMs >= identity.registeredAtMs + identity.budgets.timeLimitMs) return false;
    return true;
  }

  /** Tamper-evident check over the whole append-only trail. */
  verifyAuditTrail(): { ok: boolean; entries: number } {
    let prev = this.#genesis;
    for (let i = 0; i < this.#audit.length; i++) {
      const e = this.#audit[i];
      const expect = digestOf([this.#genesis, prev, String(e.seq), String(e.atMs), e.agentId, e.taskId, e.kind, e.detail]);
      if (e.seq !== i || e.hash !== expect) return { ok: false, entries: this.#audit.length };
      prev = e.hash;
    }
    return { ok: true, entries: this.#audit.length };
  }

  auditEntries(): readonly GatewayAuditEntry[] {
    return this.#audit;
  }

  // --- internals -----------------------------------------------------------

  #clear(req: AgentToolCallRequest, kind: 'AUTO_RUN_CLEARED' | 'HUMAN_APPROVAL_VERIFIED'): GatewayDecisionRecord {
    const usage = this.#usage.get(req.agentId)!;
    usage.toolCallsUsed += 1;
    usage.tokensUsed += req.tokenEstimate;
    usage.costUnitsUsed += req.costEstimate;
    const decisionKind: GatewayDecisionKind = kind;
    const decisionDigest = digestOf([
      this.#genesis, decisionKind, req.agentId, req.taskId, req.toolId, req.actionClass,
      String(req.attemptIndex), String(req.tokenEstimate), String(req.costEstimate), String(req.nowMs),
      this.#toolDigest ?? 'undeclared-tools',
      req.approval ? req.approval.operatorReceipt : 'no-approval',
    ]);
    const rec: GatewayDecisionRecord = Object.freeze({
      kind: decisionKind,
      agentId: req.agentId,
      taskId: req.taskId,
      toolId: req.toolId,
      actionClass: req.actionClass,
      decisionDigest,
      rollbackDeadlineMs: null,
      auditSeq: this.#audit.length,
      flags: Object.freeze({
        humanDecision: decisionKind === 'AUTO_RUN_CLEARED' ? 'NOT_REQUIRED' : 'REQUIRED',
        executesNothing: true,
        grantsNoProductionAuthority: true,
      } as const),
    });
    this.#append(req.agentId, req.taskId, decisionKind, req.nowMs, `tool ${req.toolId} class ${req.actionClass} attempt ${req.attemptIndex} digest ${short(decisionDigest)}`);
    return rec;
  }

  #refuse(req: AgentToolCallRequest, kind: GatewayDecisionKind, reason: string): GatewayDecisionRecord {
    const agentId = safeId(req.agentId);
    const taskId = safeId(req.taskId);
    const nowMs = isNonNegInt(req.nowMs) ? req.nowMs : 0;
    const decisionDigest = digestOf([this.#genesis, kind, agentId, taskId, safeId(req.toolId), safeId(req.actionClass), reason, String(nowMs)]);
    const rec: GatewayDecisionRecord = Object.freeze({
      kind,
      agentId,
      taskId,
      toolId: safeId(req.toolId),
      actionClass: safeId(req.actionClass),
      decisionDigest,
      rollbackDeadlineMs: null,
      auditSeq: this.#audit.length,
      flags: Object.freeze({
        humanDecision: kind === 'REQUIRES_HUMAN_APPROVAL' ? 'REQUIRED' : 'NOT_REQUIRED',
        executesNothing: true,
        grantsNoProductionAuthority: true,
      } as const),
    });
    this.#append(agentId, taskId, kind, nowMs, `refused: ${reason}`);
    return rec;
  }

  #append(agentId: string, taskId: string, kind: GatewayAuditEntry['kind'], atMs: number, detail: string): void {
    const seq = this.#seq++;
    const prev = this.#audit.length === 0 ? this.#genesis : this.#audit[this.#audit.length - 1].hash;
    const hash = digestOf([this.#genesis, prev, String(seq), String(atMs), agentId, taskId, kind, detail]);
    this.#audit.push(Object.freeze({ seq, atMs, agentId, taskId, kind, detail, hash }));
  }
}