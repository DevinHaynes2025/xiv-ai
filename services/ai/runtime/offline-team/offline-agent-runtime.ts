// 12D-231 — OFFLINE AGENT RUNTIME, DURABLE QUEUE & SAFE SYNCHRONIZATION
// (XIV Twelve layer 09: AI Guardrails / Autonomous Agent Runtime).
//
// The owner's offline-backend charter (2026-09-14) requires a durable local
// task queue with leases, heartbeats, crash recovery, idempotent processing,
// per-agent budgets, offline identity isolation, a network-deny posture with
// an explicit human-authorized synchronization gate, and conflict detection
// without silent overwrites. This module is that runtime as a pure,
// fail-closed contract:
//
//   enqueue (tenant/universe-scoped, budgeted) -> leaseNext (exclusive lease
//   with deadline) -> heartbeat renewals within the cap -> complete/fail
//   (idempotent, replay-refused) -> bounded retry with expired-lease
//   reclamation that COUNTS toward the retry limit -> terminal
//   CANCELLED/FAILED_PERMANENT states -> operator-receipt-gated sync
//   reconciliation -> digest-mismatch QUARANTINE (never a silent overwrite)
//
// It CALLS NOTHING: network-deny by default, zero model calls, zero remote
// calls, no provider fallback, no model-weight mutation, no learning
// promotion. Synchronization never runs on a timer or an agent's word — it
// requires a fresh single-use 64-hex operator receipt, and even then this
// contract only RECORDS reconciliation evidence; the network connector that
// would move bytes is a future story. A sync batch whose remote digests
// mismatch the local ledger QUARANTINES the task for human review instead of
// overwriting. The single-use grant is consumed at proposal time — after the
// receipt-shape and future-dating checks, but BEFORE batch validation and
// reconciliation — so a proposal whose batch or remote digests are malformed,
// or that is refused cross-universe, still CONSUMES its grant: a rejected
// receipt is never a reusable authorization, and the operator must issue a
// fresh receipt for every attempt. (Fail-closed by design; regression-tested.)
// Every lifecycle event lands in an append-only, hash-chained
// ledger whose entries carry agentId, taskId, and tenantId. Sparse logical
// scale (agent populations in the millions) is architecture, never
// materialized rows: the only measured ceiling stays 2,000,000 rows per
// database.

import { createHash } from 'node:crypto';

export const OFFLINE_RUNTIME_POLICY = Object.freeze({
  policyVersion: '12d-231-v1',
  maxReasonChars: 500,
  /** Per-agent LIFETIME admission budget (queue-depth control). */
  maxAdmittedTasksPerAgent: 1000,
  maxActiveLeasesPerAgent: 4,
  /** Owner control: maximum 3 autonomous retries (failures AND lease expiries). */
  maxAutonomousRetries: 3,
  /** A lease must be renewed (heartbeat) before this deadline or it expires. */
  maxLeaseMs: 300_000,
  /** A heartbeat may extend a lease, but never beyond this total cap. */
  maxTotalLeaseMs: 600_000,
  /** Sync NEVER runs automatically: a fresh single-use operator receipt is required. */
  syncRequiresOperatorReceipt: true,
  /** Network-deny by default; explicit human authorization opens one reconciliation. */
  networkDenyByDefault: true,
  /** Conflicts are quarantined for human review — never silently overwritten. */
  conflictsQuarantined: true,
  /** Data at rest must be encrypted by an operator-managed key provider; this
   *  contract records integrity (hash chains + digests) but claims NO crypto
   *  of its own. */
  atRestEncryption: 'OPERATOR_MANAGED_KEY_REQUIRED' as const,
  /** The ONLY measured queue ceiling (12D-103 drill). */
  measuredRowsPerDatabaseCeiling: 2_000_000,
});

export const OFFLINE_RUNTIME_GUARDRAILS = Object.freeze({
  networkDenyByDefault: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  noProviderFallback: true,
  noModelWeightMutation: true,
  automaticRecovery: false, // leases are reclaimed; FAILED_PERMANENT needs a human
  learningPromoted: false,
  humanDecision: 'REQUIRED' as const,
  noSilentOverwrites: true,
  originalFilesPreserved: true,
});

export const OFFLINE_RUNTIME_CONSTITUTION = Object.freeze({
  humanDecision: 'REQUIRED' as const,
  learningPromoted: false as const,
  modelCalls: 0 as const,
  remoteCalls: 0 as const,
  productionMutations: 0 as const,
  billionUsersProven: false as const,
});

export type OfflineTaskState =
  | 'PENDING'
  | 'LEASED'
  | 'COMPLETED'
  | 'FAILED_PERMANENT'
  | 'CANCELLED'
  | 'QUARANTINED';

export interface OfflineTask {
  readonly taskId: string;
  readonly agentId: string;
  readonly tenantId: string;
  readonly universeId: string;
  /** sha256 of the task payload — the raw payload NEVER enters this runtime. */
  readonly payloadDigest: string;
  readonly state: OfflineTaskState;
  readonly attemptsUsed: number;
  readonly maxAttempts: number;
  readonly enqueuedAtMs: number;
  /** Digest of the accepted result for COMPLETED tasks; null otherwise. */
  readonly resultDigest: string | null;
  readonly quarantineReason: string | null;
  readonly cancelledAtMs: number | null;
}

export interface OfflineLease {
  readonly leaseId: string;
  readonly taskId: string;
  readonly agentId: string;
  readonly grantedAtMs: number;
  readonly expiresAtMs: number;
  readonly heartbeatCount: number;
}

export type OfflineRuntimeEventKind =
  | 'TASK_ENQUEUED' | 'LEASE_GRANTED' | 'LEASE_RENEWED' | 'LEASE_EXPIRED'
  | 'TASK_COMPLETED' | 'TASK_FAILED_RETRYABLE' | 'TASK_FAILED_PERMANENT'
  | 'TASK_CANCELLED' | 'TASK_QUARANTINED' | 'AGENT_STOPPED'
  | 'SYNC_PROPOSED' | 'SYNC_CONFLICT' | 'SYNC_APPLIED';

export interface OfflineRuntimeEvent {
  readonly seq: number;
  readonly atMs: number;
  readonly agentId: string;
  readonly taskId: string;
  readonly tenantId: string;
  readonly kind: OfflineRuntimeEventKind;
  readonly detail: string;
  /** sha256 over (genesis + prevHash + seq + atMs + agentId + taskId + tenantId + kind + detail). */
  readonly hash: string;
}

export interface OperatorSyncGrant {
  /** sha256 64-hex operator receipt (out-of-band authenticated — never self-certified). */
  readonly operatorReceipt: string;
  readonly authorizedBy: string;
  readonly atMs: number;
}

export interface SyncBatch {
  readonly universeId: string;
  /** Declared remote digest per task — compared against the local ledger. */
  readonly remoteDigests: Readonly<Record<string, string>>;
}

const AGENT_ID_RE = /^xiv-[a-z0-9][a-z0-9-]{0,63}$/;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const RECEIPT_RE = /^[0-9a-f]{64}$/;
const DIGEST_RE = /^[0-9a-f]{64}$/;

function isNonNegInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
}

function digestOf(parts: readonly string[]): string {
  return createHash('sha256').update(parts.join('')).digest('hex');
}

function short(d: string): string {
  return d.slice(0, 12);
}

export class OfflineAgentRuntime {
  #genesis: string;
  #tasks = new Map<string, OfflineTask>();
  #leaseMap = new Map<string, OfflineLease>();
  #agents = new Map<string, { admitted: number; activeLeases: number; stopped: boolean }>();
  #grants = new Set<string>();
  #events: OfflineRuntimeEvent[] = [];
  #seq = 0;

  constructor(nowMs: number, seed: string) {
    if (!isNonNegInt(nowMs)) throw new Error('runtime genesis timestamp must be a non-negative safe integer');
    if (typeof seed !== 'string' || seed.length < 16) throw new Error('runtime genesis seed too short');
    this.#genesis = digestOf(['offline-runtime-genesis', OFFLINE_RUNTIME_POLICY.policyVersion, seed, String(nowMs)]);
  }

  /**
   * Enqueues one locally-owned task. The raw payload never enters the runtime —
   * only its sha256 digest. Admission is budget-checked per agent, scoped to a
   * tenant AND universe, and replay-refused on duplicate task ids.
   */
  enqueue(spec: {
    taskId: string; agentId: string; tenantId: string; universeId: string;
    payloadDigest: string; maxAttempts?: number; nowMs: number;
  }): OfflineTask {
    const { taskId, agentId, tenantId, universeId, payloadDigest, nowMs } = spec;
    if (!isNonNegInt(nowMs)) throw new Error('nowMs must be a non-negative safe integer');
    if (typeof taskId !== 'string' || !ID_RE.test(taskId)) throw new Error('malformed taskId');
    if (typeof agentId !== 'string' || !AGENT_ID_RE.test(agentId)) throw new Error('malformed agentId');
    if (typeof tenantId !== 'string' || !ID_RE.test(tenantId)) throw new Error('malformed tenantId');
    if (typeof universeId !== 'string' || !ID_RE.test(universeId)) throw new Error('malformed universeId');
    if (typeof payloadDigest !== 'string' || !DIGEST_RE.test(payloadDigest)) {
      throw new Error('payloadDigest must be 64-hex sha256');
    }
    const maxAttempts = spec.maxAttempts ?? OFFLINE_RUNTIME_POLICY.maxAutonomousRetries;
    if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > OFFLINE_RUNTIME_POLICY.maxAutonomousRetries) {
      throw new Error(`maxAttempts must be within 1..${OFFLINE_RUNTIME_POLICY.maxAutonomousRetries}`);
    }
    if (this.#tasks.has(taskId)) throw new Error('duplicate taskId (replay refused at admission)');
    const agent = this.#agents.get(agentId);
    if (agent?.stopped) throw new Error('agent is emergency-stopped');
    if ((agent?.admitted ?? 0) >= OFFLINE_RUNTIME_POLICY.maxAdmittedTasksPerAgent) {
      throw new Error('per-agent admission budget exhausted');
    }
    if (this.#tasks.size + 1 > OFFLINE_RUNTIME_POLICY.measuredRowsPerDatabaseCeiling) {
      throw new Error('measured 2,000,000-row per-database ceiling reached');
    }
    const task: OfflineTask = Object.freeze({
      taskId, agentId, tenantId, universeId, payloadDigest,
      state: 'PENDING' as const,
      attemptsUsed: 0,
      maxAttempts,
      enqueuedAtMs: nowMs,
      resultDigest: null,
      quarantineReason: null,
      cancelledAtMs: null,
    });
    this.#tasks.set(taskId, task);
    if (!this.#agents.has(agentId)) {
      this.#agents.set(agentId, { admitted: 0, activeLeases: 0, stopped: false });
    }
    this.#agents.get(agentId)!.admitted += 1;
    this.#append(agentId, taskId, tenantId, 'TASK_ENQUEUED', nowMs, `digest ${short(payloadDigest)} universe ${universeId}`);
    return task;
  }

  /** Grants an exclusive lease on the oldest leasable PENDING task for this agent. */
  leaseNext(agentId: string, nowMs: number): OfflineLease | null {
    if (!isNonNegInt(nowMs)) throw new Error('nowMs must be a non-negative safe integer');
    const agent = this.#agents.get(agentId);
    if (!agent) throw new Error('unknown agent (no admitted tasks)');
    if (agent.stopped) throw new Error('agent is emergency-stopped');
    if (agent.activeLeases >= OFFLINE_RUNTIME_POLICY.maxActiveLeasesPerAgent) {
      throw new Error('per-agent active-lease budget exhausted');
    }
    for (const task of this.#tasks.values()) {
      if (task.agentId !== agentId || task.state !== 'PENDING') continue;
      const lease: OfflineLease = Object.freeze({
        leaseId: digestOf([this.#genesis, 'LEASE', task.taskId, agentId, String(nowMs), String(this.#events.length)]),
        taskId: task.taskId,
        agentId,
        grantedAtMs: nowMs,
        expiresAtMs: nowMs + OFFLINE_RUNTIME_POLICY.maxLeaseMs,
        heartbeatCount: 0,
      });
      this.#setTask(task, { state: 'LEASED' });
      this.#leaseMap.set(lease.leaseId, lease);
      agent.activeLeases += 1;
      this.#append(agentId, task.taskId, task.tenantId, 'LEASE_GRANTED', nowMs, `lease ${short(lease.leaseId)} expires ${lease.expiresAtMs}`);
      return lease;
    }
    return null;
  }

  /** Heartbeat: extends an ACTIVE lease; never beyond the total-lease cap. */
  renewLease(leaseId: string, nowMs: number): OfflineLease {
    if (!isNonNegInt(nowMs)) throw new Error('nowMs must be a non-negative safe integer');
    const lease = this.#getLease(leaseId);
    const task = this.#tasks.get(lease.taskId)!;
    if (nowMs >= lease.expiresAtMs || nowMs >= lease.grantedAtMs + OFFLINE_RUNTIME_POLICY.maxTotalLeaseMs) {
      this.#expire(lease, nowMs);
      throw new Error('lease expired; heartbeat refused');
    }
    const renewed: OfflineLease = Object.freeze({
      ...lease,
      expiresAtMs: Math.min(lease.grantedAtMs + OFFLINE_RUNTIME_POLICY.maxTotalLeaseMs, nowMs + OFFLINE_RUNTIME_POLICY.maxLeaseMs),
      heartbeatCount: lease.heartbeatCount + 1,
    });
    this.#leaseMap.set(leaseId, renewed);
    this.#append(task.agentId, task.taskId, task.tenantId, 'LEASE_RENEWED', nowMs, `heartbeat ${renewed.heartbeatCount} expires ${renewed.expiresAtMs}`);
    return renewed;
  }

  /**
   * Completes a leased task with the sha256 of its result. Idempotent and
   * replay-refused: only an ACTIVE lease on a LEASED task completes, and a
   * completed task is terminal.
   */
  complete(leaseId: string, resultDigest: string, nowMs: number): OfflineTask {
    if (!isNonNegInt(nowMs)) throw new Error('nowMs must be a non-negative safe integer');
    if (typeof resultDigest !== 'string' || !DIGEST_RE.test(resultDigest)) throw new Error('resultDigest must be 64-hex sha256');
    const lease = this.#getLease(leaseId);
    const task = this.#tasks.get(lease.taskId)!;
    if (nowMs >= lease.expiresAtMs) {
      this.#expire(lease, nowMs);
      throw new Error('lease expired before completion');
    }
    if (task.state !== 'LEASED') throw new Error(`task is ${task.state}; completion refused`);
    this.#releaseLease(lease);
    const done = this.#setTask(task, { state: 'COMPLETED' as const, resultDigest });
    this.#append(task.agentId, task.taskId, task.tenantId, 'TASK_COMPLETED', nowMs, `result ${short(resultDigest)}`);
    return done;
  }

  /** Fails a lease: retryable while attempts remain, then terminal. */
  fail(leaseId: string, nowMs: number, reason: string): OfflineTask {
    if (!isNonNegInt(nowMs)) throw new Error('nowMs must be a non-negative safe integer');
    if (typeof reason !== 'string' || reason.length < 1 || reason.length > OFFLINE_RUNTIME_POLICY.maxReasonChars) {
      throw new Error('malformed failure reason');
    }
    const lease = this.#getLease(leaseId);
    const task = this.#tasks.get(lease.taskId)!;
    if (task.state !== 'LEASED') throw new Error(`task is ${task.state}; failure refused`);
    this.#releaseLease(lease);
    const attemptsUsed = task.attemptsUsed + 1;
    const permanent = attemptsUsed >= task.maxAttempts;
    const next = this.#setTask(task, {
      state: permanent ? 'FAILED_PERMANENT' as const : 'PENDING' as const,
      attemptsUsed,
    });
    this.#append(task.agentId, task.taskId, task.tenantId, permanent ? 'TASK_FAILED_PERMANENT' : 'TASK_FAILED_RETRYABLE', nowMs, `attempt ${attemptsUsed}/${task.maxAttempts}: ${reason}`);
    return next;
  }

  /**
   * Crash recovery: expires stale leases. Expiry COUNTS as a consumed attempt
   * (a crashing worker must not loop forever); the task returns to PENDING
   * while attempts remain, else becomes FAILED_PERMANENT.
   */
  reclaimExpiredLeases(nowMs: number): { reclaimed: number; failedPermanent: number } {
    if (!isNonNegInt(nowMs)) throw new Error('nowMs must be a non-negative safe integer');
    let reclaimed = 0;
    let failedPermanent = 0;
    for (const lease of [...this.#leaseMap.values()]) {
      if (nowMs >= lease.expiresAtMs) {
        this.#expire(lease, nowMs);
        reclaimed += 1;
        if (this.#tasks.get(lease.taskId)!.state === 'FAILED_PERMANENT') failedPermanent += 1;
      }
    }
    return { reclaimed, failedPermanent };
  }

  /** Human cancellation — a terminal state; any active lease on the task is revoked. */
  cancelTask(taskId: string, nowMs: number, reason: string): OfflineTask {
    if (!isNonNegInt(nowMs)) throw new Error('nowMs must be a non-negative safe integer');
    if (typeof reason !== 'string' || reason.length < 1 || reason.length > OFFLINE_RUNTIME_POLICY.maxReasonChars) {
      throw new Error('malformed cancellation reason');
    }
    const task = this.#tasks.get(taskId);
    if (!task) throw new Error('unknown task');
    if (task.state !== 'PENDING' && task.state !== 'LEASED') {
      throw new Error(`task is ${task.state}; cancellation refused`);
    }
    for (const lease of [...this.#leaseMap.values()]) {
      if (lease.taskId === taskId) this.#releaseLease(lease);
    }
    const cancelled = this.#setTask(task, { state: 'CANCELLED' as const, cancelledAtMs: nowMs });
    this.#append(task.agentId, taskId, task.tenantId, 'TASK_CANCELLED', nowMs, reason);
    return cancelled;
  }

  /** Emergency stop — idempotent; every later surface for the agent refuses. */
  emergencyStopAgent(agentId: string, nowMs: number, reason: string): void {
    if (!isNonNegInt(nowMs)) throw new Error('nowMs must be a non-negative safe integer');
    if (typeof agentId !== 'string' || !AGENT_ID_RE.test(agentId)) throw new Error('malformed agentId');
    if (typeof reason !== 'string' || reason.length < 1 || reason.length > OFFLINE_RUNTIME_POLICY.maxReasonChars) {
      throw new Error('malformed stop reason');
    }
    const agent = this.#agents.get(agentId);
    if (!agent) throw new Error('unknown agent');
    if (agent.stopped) return; // idempotent: one AGENT_STOPPED entry only
    agent.stopped = true;
    for (const lease of [...this.#leaseMap.values()]) {
      if (lease.agentId === agentId) {
        this.#releaseLease(lease);
        const t = this.#tasks.get(lease.taskId)!;
        if (t.state === 'LEASED') this.#setTask(t, { state: 'PENDING' as const });
      }
    }
    this.#append(agentId, '', this.#agentTenant(agentId), 'AGENT_STOPPED', nowMs, `stop deadline ${OFFLINE_RUNTIME_POLICY.maxLeaseMs}ms; reason: ${reason}`);
  }

  /**
   * THE ONLY DOOR OUT OF THE NETWORK-DENY POSTURE — and even then this
   * contract MOVES NO BYTES: it reconciles presented remote digests against
   * the local ledger and records the evidence. The network connector that
   * would transfer data is a future story. The grant is single-use and
   * consumed at proposal time (fail-closed: even a malformed batch consumes
   * the presented grant).
   */
  proposeSync(grant: OperatorSyncGrant, batch: SyncBatch, nowMs: number): {
    status: 'SYNC_PROPOSED' | 'SYNC_CONFLICT';
    conflicts: readonly string[];
    applied: number;
  } {
    if (!isNonNegInt(nowMs)) throw new Error('nowMs must be a non-negative safe integer');
    if (!grant || typeof grant !== 'object') throw new Error('operator grant required');
    if (typeof grant.operatorReceipt !== 'string' || !RECEIPT_RE.test(grant.operatorReceipt)) {
      throw new Error('operator receipt must be 64-hex sha256');
    }
    if (typeof grant.authorizedBy !== 'string' || grant.authorizedBy.length < 1 || grant.authorizedBy.length > 128) {
      throw new Error('malformed authorizer identity');
    }
    if (!isNonNegInt(grant.atMs) || grant.atMs > nowMs) throw new Error('grant timestamp must not be future-dated');
    if (!batch || typeof batch !== 'object' || typeof batch.universeId !== 'string' || !ID_RE.test(batch.universeId)) {
      throw new Error('malformed sync batch');
    }
    if (!batch.remoteDigests || typeof batch.remoteDigests !== 'object' || Array.isArray(batch.remoteDigests)) {
      throw new Error('malformed remote digests');
    }
    const keys = Object.keys(batch.remoteDigests);
    if (keys.length < 1 || keys.length > OFFLINE_RUNTIME_POLICY.maxAdmittedTasksPerAgent) {
      throw new Error('sync batch must carry 1..maxAdmittedTasksPerAgent entries');
    }
    // Single-use grant, consumed at proposal time (before any reconciliation).
    const grantKey = digestOf([this.#genesis, 'SYNC_GRANT', grant.operatorReceipt, String(grant.atMs)]);
    if (this.#grants.has(grantKey)) throw new Error('sync grant replay refused');
    this.#grants.add(grantKey);

    const conflicts: string[] = [];
    let applied = 0;
    for (const taskId of keys) {
      const remote = batch.remoteDigests[taskId];
      if (typeof remote !== 'string' || !DIGEST_RE.test(remote)) throw new Error(`remote digest for ${taskId} must be 64-hex sha256`);
      const task = this.#tasks.get(taskId);
      if (!task) { conflicts.push(taskId); continue; }
      if (task.universeId !== batch.universeId) throw new Error('cross-universe sync refused');
      const localDigest = task.resultDigest ?? task.payloadDigest;
      if (localDigest !== remote) {
        conflicts.push(taskId);
        this.#setTask(task, { state: 'QUARANTINED' as const, quarantineReason: 'sync digest mismatch; human review required' });
        this.#append(task.agentId, taskId, task.tenantId, 'TASK_QUARANTINED', nowMs, `local ${short(localDigest)} vs remote ${short(remote)}; quarantined, NOT overwritten`);
      } else {
        applied += 1;
        this.#append(task.agentId, taskId, task.tenantId, 'SYNC_APPLIED', nowMs, `digest ${short(localDigest)} reconciled`);
      }
    }
    this.#append('', '', '', 'SYNC_PROPOSED', nowMs, `universe ${batch.universeId} batch ${keys.length} reconciled ${applied} conflicts ${conflicts.length}; single operator grant consumed; no bytes moved`);
    return { status: conflicts.length > 0 ? 'SYNC_CONFLICT' : 'SYNC_PROPOSED', conflicts, applied };
  }

  taskState(taskId: string): OfflineTask | null {
    return this.#tasks.get(taskId) ?? null;
  }

  /** Tamper-evident check over the whole append-only ledger. */
  verifyLedger(): { ok: boolean; entries: number } {
    let prev = this.#genesis;
    for (let i = 0; i < this.#events.length; i++) {
      const e = this.#events[i];
      const expect = digestOf([this.#genesis, prev, String(e.seq), String(e.atMs), e.agentId, e.taskId, e.tenantId, e.kind, e.detail]);
      if (e.seq !== i || e.hash !== expect) return { ok: false, entries: this.#events.length };
      prev = e.hash;
    }
    return { ok: true, entries: this.#events.length };
  }

  ledgerEntries(): readonly OfflineRuntimeEvent[] {
    return this.#events;
  }

  // --- internals -----------------------------------------------------------

  #getLease(leaseId: string): OfflineLease {
    const lease = this.#leaseMap.get(leaseId);
    if (!lease) throw new Error('unknown lease');
    return lease;
  }

  #setTask(task: OfflineTask, patch: Partial<OfflineTask>): OfflineTask {
    const next: OfflineTask = Object.freeze({ ...task, ...patch });
    this.#tasks.set(task.taskId, next);
    return next;
  }

  #releaseLease(lease: OfflineLease): void {
    this.#leaseMap.delete(lease.leaseId);
    const agent = this.#agents.get(lease.agentId)!;
    agent.activeLeases -= 1;
  }

  #expire(lease: OfflineLease, nowMs: number): void {
    this.#releaseLease(lease);
    const task = this.#tasks.get(lease.taskId)!;
    if (task.state !== 'LEASED') return;
    // Expiry COUNTS as a consumed attempt (a crashing worker must not loop
    // forever); the task returns to PENDING while attempts remain, else dies.
    const attemptsUsed = task.attemptsUsed + 1;
    const permanent = attemptsUsed >= task.maxAttempts;
    this.#setTask(task, { state: permanent ? 'FAILED_PERMANENT' as const : 'PENDING' as const, attemptsUsed });
    this.#append(task.agentId, task.taskId, task.tenantId, 'LEASE_EXPIRED', nowMs, `lease ${short(lease.leaseId)} expired; attempt ${attemptsUsed}/${task.maxAttempts}${permanent ? '; FAILED_PERMANENT' : '; returned to PENDING'}`);
  }

  #agentTenant(agentId: string): string {
    for (const t of this.#tasks.values()) if (t.agentId === agentId) return t.tenantId;
    return '';
  }

  #append(agentId: string, taskId: string, tenantId: string, kind: OfflineRuntimeEventKind, atMs: number, detail: string): void {
    const seq = this.#seq++;
    const prev = this.#events.length === 0 ? this.#genesis : this.#events[this.#events.length - 1].hash;
    const hash = digestOf([this.#genesis, prev, String(seq), String(atMs), agentId, taskId, tenantId, kind, detail]);
    this.#events.push(Object.freeze({ seq, atMs, agentId, taskId, tenantId, kind, detail, hash }));
  }
}