// 12D-225 — GATEWAY EXECUTOR (XIV Twelve layer 09: AI Guardrails).
//
// The 12D-224 charter reserves execution for "a separately reviewed executor
// story [that] must consume these records, re-verify, and remain bounded by
// the same thresholds". This module is that executor as a pure, fail-closed
// VERIFICATION engine:
//
//   present a 12D-224 GatewayDecisionRecord + the EXACT request it decided ->
//   re-run the gateway decision on that request (never trust the record) ->
//   require kind AND digest to match, re-check liveness at execution time ->
//   consume the digest (one instruction per decision, replay refused) ->
//   emit a frozen EXECUTION_INSTRUCTION + append a hash-chained audit entry
//
// It EXECUTES NOTHING and MATERIALIZES NOTHING: the emitted record is an
// instruction for a downstream runner, carrying the same policy class
// restrictions; approval-verified instructions REQUIRE the 12D-121
// decision-safety workflow before any side effect. Refused records never
// consume a decision digest. One executor instance per gateway (WeakSet
// binding) closes the cross-executor replay path. The re-verification IS the
// authoritative budget charge: executing a cleared call consumes one
// additional budget unit at the executor boundary (declared-estimate
// discipline, disclosed in the handoff). The only measured ceiling stays
// 2,000,000 rows per database; sparse logical scale is never materialized.

import { createHash } from 'node:crypto';
import {
  AgentPolicyGateway,
  type AgentToolCallRequest,
  type GatewayDecisionRecord,
} from './agent-policy-gateway';

export const GATEWAY_EXECUTOR_POLICY = Object.freeze({
  policyVersion: '12d-225-v1',
  /** Owner control: every presented record is re-decided, never trusted. */
  reVerifiesEveryRecord: true,
  /** Owner control: one instruction per decision digest, replay refused. */
  oneInstructionPerDecisionDigest: true,
  /** Owner control: one executor instance per gateway. */
  oneExecutorPerGateway: true,
  /** Only gateway clearances are executable; every refusal kind is terminal. */
  executableDecisionKinds: Object.freeze(['AUTO_RUN_CLEARED', 'HUMAN_APPROVAL_VERIFIED']) as readonly string[],
});

export const GATEWAY_EXECUTOR_GUARDRAILS = Object.freeze({
  executesNothing: true, // emits EXECUTION_INSTRUCTIONs; no side effect occurs here
  materializesNothing: true,
  reChecksLivenessAtExecutionTime: true,
  approvalCannotLaunderProhibitedAction: true, // refusal-kind records are never executable
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  learningPromoted: false,
  humanDecision: 'REQUIRED' as const,
});

export const GATEWAY_EXECUTOR_CONSTITUTION = Object.freeze({
  humanDecision: 'REQUIRED' as const,
  learningPromoted: false as const,
  modelCalls: 0 as const,
  remoteCalls: 0 as const,
  realActionsExecuted: 0 as const,
  productionMutationAllowed: false as const,
  billionUsersProven: false as const,
});

export type GatewayExecutionKind =
  | 'EXECUTION_INSTRUCTION_ISSUED'
  | 'REFUSED_REPLAY'
  | 'REFUSED_STALE'
  | 'REFUSED_DIGEST_MISMATCH'
  | 'REFUSED_KIND_NOT_EXECUTABLE'
  | 'REFUSED_MALFORMED'
  | 'REFUSED_TRAIL_TAMPERED';

export interface GatewayExecutionRecord {
  readonly kind: GatewayExecutionKind;
  readonly agentId: string;
  readonly taskId: string;
  readonly toolId: string;
  readonly actionClass: string;
  /** Echoed decision digest on clearances and digest checks; null for structural refusals. */
  readonly decisionDigest: string | null;
  /** sha256 binding the instruction to the gateway decision and the execution time. */
  readonly instructionDigest: string | null;
  readonly executedAtMs: number;
  readonly reason: string | null;
  readonly flags: {
    readonly humanDecision: 'REQUIRED' | 'NOT_REQUIRED';
    /** High-impact instructions require the 12D-121 workflow before ANY action. */
    readonly requiresDecisionSafetyWorkflowBeforeAnyAction: boolean;
    readonly executesNothing: true;
    readonly materializesNothing: true;
    readonly grantsNoProductionAuthority: true;
  };
}

export interface GatewayExecutorAuditEntry {
  readonly seq: number;
  readonly atMs: number;
  readonly agentId: string;
  readonly taskId: string;
  readonly kind: GatewayExecutionKind;
  readonly detail: string;
  /** sha256 over (executorGenesis + prevHash + seq + atMs + agentId + taskId + kind + detail). */
  readonly hash: string;
}

const RECEIPT_DIGEST_RE = /^[0-9a-f]{64}$/;
const MAX_INSTRUCTION_PER_EXECUTOR = 10_000;

/** Executors already bound to a gateway — closes the cross-executor replay path. */
const BOUND_GATEWAYS = new WeakSet<object>();

function isNonNegInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
}

function digestOf(parts: readonly string[]): string {
  return createHash('sha256').update(parts.join('')).digest('hex');
}

function safeId(v: unknown): string {
  return typeof v === 'string' ? v : 'unknown';
}

export class GatewayExecutor {
  #genesis: string;
  #gateway: AgentPolicyGateway;
  #consumed = new Set<string>();
  #audit: GatewayExecutorAuditEntry[] = [];
  #seq = 0;

  constructor(gateway: AgentPolicyGateway, nowMs: number, seed: string) {
    if (!(gateway instanceof AgentPolicyGateway)) throw new Error('executor requires an AgentPolicyGateway');
    if (!isNonNegInt(nowMs)) throw new Error('executor genesis timestamp must be a non-negative safe integer');
    if (typeof seed !== 'string' || seed.length < 16) throw new Error('executor genesis seed too short');
    if (BOUND_GATEWAYS.has(gateway)) throw new Error('this gateway already has a bound executor');
    if (!gateway.verifyAuditTrail().ok) throw new Error('gateway audit trail failed verification at executor construction');
    BOUND_GATEWAYS.add(gateway);
    this.#gateway = gateway;
    this.#genesis = digestOf(['gateway-executor-genesis', GATEWAY_EXECUTOR_POLICY.policyVersion, seed, String(nowMs)]);
  }

  /**
   * Re-verifies a presented 12D-224 decision record against the bound gateway
   * and, on success, emits ONE execution instruction. Fail-closed at every
   * step; refusals never consume the decision digest.
   */
  executeClearedCall(input: {
    request: AgentToolCallRequest;
    decision: GatewayDecisionRecord;
    executedAtMs: number;
  }): GatewayExecutionRecord {
    const { request, decision } = input;

    // Structural validation FIRST — anything malformed is REFUSED_MALFORMED.
    const malformed =
      input === null ||
      typeof input !== 'object' ||
      request === null ||
      typeof request !== 'object' ||
      decision === null ||
      typeof decision !== 'object' ||
      typeof decision.kind !== 'string' ||
      typeof decision.decisionDigest !== 'string' ||
      !RECEIPT_DIGEST_RE.test(decision.decisionDigest) ||
      typeof decision.flags !== 'object' ||
      decision.flags === null ||
      decision.flags.executesNothing !== true ||
      decision.flags.grantsNoProductionAuthority !== true ||
      !isNonNegInt(input.executedAtMs) ||
      !isNonNegInt(request.nowMs) ||
      input.executedAtMs < request.nowMs ||
      decision.agentId !== request.agentId ||
      decision.taskId !== request.taskId ||
      decision.toolId !== request.toolId ||
      decision.actionClass !== request.actionClass;
    if (malformed) return this.#refuse(request, 'REFUSED_MALFORMED', 'structurally malformed presentation', null, input?.executedAtMs);

    // The bound gateway's trail must be intact — a tampered trail vouches for nothing.
    if (!this.#gateway.verifyAuditTrail().ok) {
      return this.#refuse(request, 'REFUSED_TRAIL_TAMPERED', 'bound gateway audit trail failed verification', decision.decisionDigest, input?.executedAtMs);
    }

    // Only gateway CLEARANCES are executable; every refusal kind is terminal.
    if (!GATEWAY_EXECUTOR_POLICY.executableDecisionKinds.includes(decision.kind)) {
      return this.#refuse(request, 'REFUSED_KIND_NOT_EXECUTABLE', `kind ${decision.kind} is not an executable clearance`, decision.decisionDigest, input?.executedAtMs);
    }

    // One instruction per decision digest — replay refused.
    if (this.#consumed.has(decision.decisionDigest)) {
      return this.#refuse(request, 'REFUSED_REPLAY', 'decision digest already consumed by a prior execution', decision.decisionDigest, input?.executedAtMs);
    }

    // Re-decide, never trust: the fresh decision must match kind AND digest.
    const fresh = this.#gateway.evaluateToolCall(request);
    if (fresh.kind !== decision.kind) {
      return this.#refuse(request, 'REFUSED_STALE', `re-verification diverged: fresh decision is ${fresh.kind}`, decision.decisionDigest, input?.executedAtMs);
    }
    if (fresh.decisionDigest !== decision.decisionDigest) {
      return this.#refuse(request, 'REFUSED_DIGEST_MISMATCH', 'fresh decision digest differs from the presented record', decision.decisionDigest, input?.executedAtMs);
    }

    // Liveness AND time budget re-checked at EXECUTION time (stricter probe).
    if (!this.#gateway.isOperational(request.agentId, input.executedAtMs)) {
      return this.#refuse(request, 'REFUSED_STALE', 'agent not operational at the execution timestamp', decision.decisionDigest, input?.executedAtMs);
    }

    // Cap check BEFORE consumption — a cap-exceeded throw must never leave a
    // consumed digest without an instruction (invariant guard, not a policy threshold).
    if (this.#consumed.size + 1 > MAX_INSTRUCTION_PER_EXECUTOR) {
      throw new Error('executor instruction cap exceeded; construct a fresh executor with operator authorization');
    }
    // Consume and issue. The re-verification is the authoritative budget charge.
    this.#consumed.add(decision.decisionDigest);
    const approvalRequired = decision.kind === 'HUMAN_APPROVAL_VERIFIED';
    const instructionDigest = digestOf([
      this.#genesis, 'EXECUTION_INSTRUCTION', decision.decisionDigest,
      request.agentId, request.taskId, request.toolId, request.actionClass,
      String(input.executedAtMs),
    ]);
    const rec: GatewayExecutionRecord = Object.freeze({
      kind: 'EXECUTION_INSTRUCTION_ISSUED' as const,
      agentId: request.agentId,
      taskId: request.taskId,
      toolId: request.toolId,
      actionClass: request.actionClass,
      decisionDigest: decision.decisionDigest,
      instructionDigest,
      executedAtMs: input.executedAtMs,
      reason: null,
      flags: Object.freeze({
        humanDecision: approvalRequired ? 'REQUIRED' as const : 'NOT_REQUIRED' as const,
        requiresDecisionSafetyWorkflowBeforeAnyAction: approvalRequired,
        executesNothing: true,
        materializesNothing: true,
        grantsNoProductionAuthority: true,
      } as const),
    });
    this.#append(request.agentId, request.taskId, rec.kind, input.executedAtMs, `instruction ${instructionDigest.slice(0, 12)} for decision ${decision.decisionDigest.slice(0, 12)}`);
    return rec;
  }

  /** Tamper-evident check over the executor's own append-only trail. */
  verifyExecutorTrail(): { ok: boolean; entries: number } {
    let prev = this.#genesis;
    for (let i = 0; i < this.#audit.length; i++) {
      const e = this.#audit[i];
      const expect = digestOf([this.#genesis, prev, String(e.seq), String(e.atMs), e.agentId, e.taskId, e.kind, e.detail]);
      if (e.seq !== i || e.hash !== expect) return { ok: false, entries: this.#audit.length };
      prev = e.hash;
    }
    return { ok: true, entries: this.#audit.length };
  }

  executorAuditEntries(): readonly GatewayExecutorAuditEntry[] {
    return this.#audit;
  }

  // --- internals -----------------------------------------------------------

  #refuse(
    request: AgentToolCallRequest,
    kind: Exclude<GatewayExecutionKind, 'EXECUTION_INSTRUCTION_ISSUED'>,
    reason: string,
    decisionDigest: string | null,
    executedAtMs: unknown,
  ): GatewayExecutionRecord {
    const agentId = safeId(request?.agentId);
    const taskId = safeId(request?.taskId);
    // Stamp the EXECUTION timestamp when valid; fall back to the request's own
    // timestamp (then 0) only for presentations too malformed to carry one.
    const atMs = isNonNegInt(executedAtMs)
      ? executedAtMs
      : isNonNegInt(request?.nowMs)
        ? request.nowMs
        : 0;
    const rec: GatewayExecutionRecord = Object.freeze({
      kind,
      agentId,
      taskId,
      toolId: safeId(request?.toolId),
      actionClass: safeId(request?.actionClass),
      decisionDigest,
      instructionDigest: null,
      executedAtMs: atMs,
      reason,
      flags: Object.freeze({
        humanDecision: 'NOT_REQUIRED' as const,
        requiresDecisionSafetyWorkflowBeforeAnyAction: false,
        executesNothing: true,
        materializesNothing: true,
        grantsNoProductionAuthority: true,
      } as const),
    });
    this.#append(agentId, taskId, kind, atMs, `refused: ${reason}`);
    return rec;
  }

  #append(agentId: string, taskId: string, kind: GatewayExecutorAuditEntry['kind'], atMs: number, detail: string): void {
    const seq = this.#seq++;
    const prev = this.#audit.length === 0 ? this.#genesis : this.#audit[this.#audit.length - 1].hash;
    const hash = digestOf([this.#genesis, prev, String(seq), String(atMs), agentId, taskId, kind, detail]);
    this.#audit.push(Object.freeze({ seq, atMs, agentId, taskId, kind, detail, hash }));
  }
}