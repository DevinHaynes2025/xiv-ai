/**
 * Provider-neutral AgentMissionQueue + in-memory DB-backed adapter.
 * AWS/Redis/cloud task adapters live in adapters.ts (NOT_CONFIGURED).
 */

import { createCheckpoint, resumeFromCheckpoint } from './checkpoint';
import { createLease, duplicateClaimRejected, leaseIsExpired, recoverExpiredLease, releaseLease, renewLease } from './lease';
import { transitionMission } from './transitions';
import type {
  AgentCheckpoint,
  AgentDebrief,
  AgentExecutionEvent,
  AgentHeartbeat,
  AgentLease,
  AgentMission,
  AgentMissionStatus,
} from './types';
import { DEFAULT_MAX_RETRIES } from './types';

export type ClaimResult =
  | { ok: true; mission: AgentMission; lease: AgentLease }
  | { ok: false; reason: string; audited?: true };

export type QueueOpResult =
  | { ok: true; mission: AgentMission }
  | { ok: false; reason: string; audited?: true };

export interface AgentMissionQueue {
  enqueue(mission: AgentMission): QueueOpResult;
  claim(input: {
    workerId: string;
    tenantId: string;
    universeId: string;
    nowMs: number;
    nowIso: string;
  }): ClaimResult;
  heartbeat(input: {
    leaseId: string;
    workerId: string;
    nowMs: number;
    nowIso: string;
  }): { ok: true; lease: AgentLease; heartbeat: AgentHeartbeat } | { ok: false; reason: string };
  checkpoint(input: {
    missionId: string;
    workerId: string;
    progressCursor: string;
    completedSteps?: readonly string[];
    pendingSteps?: readonly string[];
    contextRefs?: readonly string[];
    memoryRefs?: readonly string[];
    repoStateRef?: string | null;
    dbStateRef?: string | null;
    nowIso: string;
  }): { ok: true; checkpoint: AgentCheckpoint; mission: AgentMission } | { ok: false; reason: string; audited?: true };
  release(input: { leaseId: string; workerId: string; nowIso: string }): QueueOpResult;
  complete(input: { missionId: string; workerId: string; nowIso: string }): QueueOpResult;
  fail(input: { missionId: string; workerId: string; reason: string; nowIso: string }): QueueOpResult;
  retry(input: { missionId: string; nowIso: string }): QueueOpResult;
  getMission(missionId: string): AgentMission | null;
  getLease(leaseId: string): AgentLease | null;
  getCheckpoint(checkpointId: string): AgentCheckpoint | null;
  listEvents(missionId: string): readonly AgentExecutionEvent[];
}

function id(prefix: string, n: number): string {
  return `${prefix}_${n}`;
}

export function createMission(input: {
  missionId: string;
  tenantId: string;
  universeId: string;
  objective: string;
  budgetId: string;
  templateId?: string | null;
  authorityLevel?: 'L0' | 'L1' | 'L2' | 'L3';
  maxRetries?: number;
  nowIso: string;
  status?: AgentMissionStatus;
}): AgentMission {
  return {
    missionId: input.missionId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    objective: input.objective,
    status: input.status ?? 'DRAFT',
    templateId: input.templateId ?? null,
    assignedWorkerId: null,
    authorityLevel: input.authorityLevel ?? 'L0',
    selfExpandableAuthority: false,
    budgetId: input.budgetId,
    retryCount: 0,
    maxRetries: input.maxRetries ?? DEFAULT_MAX_RETRIES,
    leaseId: null,
    checkpointId: null,
    createdAt: input.nowIso,
    updatedAt: input.nowIso,
    l4Enabled: false,
    productionLive: false,
    permissions: [],
  };
}

/** In-memory DB-backed queue for tests and local foundation. */
export class DbBackedAgentMissionQueue implements AgentMissionQueue {
  private missions = new Map<string, AgentMission>();
  private leases = new Map<string, AgentLease>();
  private leasesByMission = new Map<string, string>();
  private checkpoints = new Map<string, AgentCheckpoint>();
  private debriefs = new Map<string, AgentDebrief>();
  private events: AgentExecutionEvent[] = [];
  private seq = 0;

  private nextId(prefix: string): string {
    this.seq += 1;
    return id(prefix, this.seq);
  }

  private emit(partial: Omit<AgentExecutionEvent, 'eventId' | 'audited'>): void {
    this.events.push({
      ...partial,
      eventId: this.nextId('evt'),
      audited: true,
    });
  }

  enqueue(mission: AgentMission): QueueOpResult {
    if (this.missions.has(mission.missionId)) {
      return { ok: false, reason: 'mission_already_exists' };
    }
    let next = mission;
    if (mission.status === 'DRAFT') {
      const t = transitionMission(mission, 'QUEUED', mission.updatedAt);
      if (!t.ok) return { ok: false, reason: t.reason };
      next = t.mission;
    } else if (mission.status !== 'QUEUED') {
      return { ok: false, reason: 'enqueue_requires_draft_or_queued' };
    }
    this.missions.set(next.missionId, next);
    this.emit({
      missionId: next.missionId,
      tenantId: next.tenantId,
      universeId: next.universeId,
      workerId: null,
      kind: 'ENQUEUED',
      at: next.updatedAt,
      detail: 'mission_enqueued',
    });
    return { ok: true, mission: next };
  }

  claim(input: {
    workerId: string;
    tenantId: string;
    universeId: string;
    nowMs: number;
    nowIso: string;
    missionId?: string;
  }): ClaimResult {
    const candidate = [...this.missions.values()].find(
      (m) =>
        m.status === 'QUEUED' &&
        m.tenantId === input.tenantId &&
        m.universeId === input.universeId &&
        (input.missionId === undefined || m.missionId === input.missionId),
    );
    if (!candidate) {
      // Duplicate protection: active lease on requested mission
      if (input.missionId) {
        const existingLeaseId = this.leasesByMission.get(input.missionId);
        const existing = existingLeaseId ? this.leases.get(existingLeaseId) ?? null : null;
        if (duplicateClaimRejected(existing ?? null, input.nowMs)) {
          this.emit({
            missionId: input.missionId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            workerId: input.workerId,
            kind: 'SECURITY_DENIED',
            at: input.nowIso,
            detail: 'duplicate_claim_rejected',
          });
          return { ok: false, reason: 'duplicate_claim_rejected', audited: true };
        }
      }
      return { ok: false, reason: 'no_queued_mission' };
    }

    const existingLeaseId = this.leasesByMission.get(candidate.missionId);
    const existing = existingLeaseId ? this.leases.get(existingLeaseId) ?? null : null;
    if (duplicateClaimRejected(existing ?? null, input.nowMs)) {
      this.emit({
        missionId: candidate.missionId,
        tenantId: candidate.tenantId,
        universeId: candidate.universeId,
        workerId: input.workerId,
        kind: 'SECURITY_DENIED',
        at: input.nowIso,
        detail: 'duplicate_claim_rejected',
      });
      return { ok: false, reason: 'duplicate_claim_rejected', audited: true };
    }

    const claimed = transitionMission(candidate, 'CLAIMED', input.nowIso);
    if (!claimed.ok) return { ok: false, reason: claimed.reason };
    const running = transitionMission(claimed.mission, 'RUNNING', input.nowIso);
    if (!running.ok) return { ok: false, reason: running.reason };

    const lease = createLease({
      leaseId: this.nextId('lease'),
      missionId: running.mission.missionId,
      workerId: input.workerId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      nowMs: input.nowMs,
    });

    const mission: AgentMission = {
      ...running.mission,
      assignedWorkerId: input.workerId,
      leaseId: lease.leaseId,
    };
    this.missions.set(mission.missionId, mission);
    this.leases.set(lease.leaseId, lease);
    this.leasesByMission.set(mission.missionId, lease.leaseId);
    this.emit({
      missionId: mission.missionId,
      tenantId: mission.tenantId,
      universeId: mission.universeId,
      workerId: input.workerId,
      kind: 'CLAIMED',
      at: input.nowIso,
      detail: 'mission_claimed',
    });
    return { ok: true, mission, lease };
  }

  heartbeat(input: {
    leaseId: string;
    workerId: string;
    nowMs: number;
    nowIso: string;
  }): { ok: true; lease: AgentLease; heartbeat: AgentHeartbeat } | { ok: false; reason: string } {
    const lease = this.leases.get(input.leaseId);
    if (!lease) return { ok: false, reason: 'lease_not_found' };
    if (lease.workerId !== input.workerId) return { ok: false, reason: 'worker_mismatch' };
    if (leaseIsExpired(lease, input.nowMs)) return { ok: false, reason: 'lease_expired' };
    const renewed = renewLease(lease, input.nowMs);
    if (!renewed) return { ok: false, reason: 'lease_renew_failed' };
    this.leases.set(renewed.leaseId, renewed);
    const heartbeat: AgentHeartbeat = {
      heartbeatId: this.nextId('hb'),
      missionId: renewed.missionId,
      leaseId: renewed.leaseId,
      workerId: input.workerId,
      tenantId: renewed.tenantId,
      universeId: renewed.universeId,
      at: input.nowIso,
      healthy: true,
    };
    this.emit({
      missionId: renewed.missionId,
      tenantId: renewed.tenantId,
      universeId: renewed.universeId,
      workerId: input.workerId,
      kind: 'HEARTBEAT',
      at: input.nowIso,
      detail: 'heartbeat_ok',
    });
    return { ok: true, lease: renewed, heartbeat };
  }

  checkpoint(input: {
    missionId: string;
    workerId: string;
    progressCursor: string;
    completedSteps?: readonly string[];
    pendingSteps?: readonly string[];
    contextRefs?: readonly string[];
    memoryRefs?: readonly string[];
    repoStateRef?: string | null;
    dbStateRef?: string | null;
    nowIso: string;
  }): { ok: true; checkpoint: AgentCheckpoint; mission: AgentMission } | { ok: false; reason: string; audited?: true } {
    const mission = this.missions.get(input.missionId);
    if (!mission) return { ok: false, reason: 'mission_not_found' };
    if (mission.assignedWorkerId !== input.workerId) {
      return { ok: false, reason: 'unauthorized_checkpoint_worker', audited: true };
    }
    if (mission.status !== 'RUNNING' && mission.status !== 'CHECKPOINTING') {
      return { ok: false, reason: 'mission_not_checkpointable' };
    }
    const toCp = transitionMission(mission, 'CHECKPOINTING', input.nowIso);
    if (!toCp.ok) return { ok: false, reason: toCp.reason };
    const cp = createCheckpoint({
      checkpointId: this.nextId('cp'),
      missionId: mission.missionId,
      tenantId: mission.tenantId,
      universeId: mission.universeId,
      workerId: input.workerId,
      progressCursor: input.progressCursor,
      completedSteps: input.completedSteps,
      pendingSteps: input.pendingSteps,
      contextRefs: input.contextRefs,
      memoryRefs: input.memoryRefs,
      repoStateRef: input.repoStateRef,
      dbStateRef: input.dbStateRef,
      lastHeartbeatAt: input.nowIso,
      attemptCount: mission.retryCount,
      createdAt: input.nowIso,
    });
    const back = transitionMission(toCp.mission, 'RUNNING', input.nowIso);
    if (!back.ok) return { ok: false, reason: back.reason };
    const next: AgentMission = { ...back.mission, checkpointId: cp.checkpointId };
    this.checkpoints.set(cp.checkpointId, cp);
    this.missions.set(next.missionId, next);
    this.emit({
      missionId: next.missionId,
      tenantId: next.tenantId,
      universeId: next.universeId,
      workerId: input.workerId,
      kind: 'CHECKPOINT',
      at: input.nowIso,
      detail: cp.checkpointId,
    });
    return { ok: true, checkpoint: cp, mission: next };
  }

  release(input: { leaseId: string; workerId: string; nowIso: string }): QueueOpResult {
    const lease = this.leases.get(input.leaseId);
    if (!lease) return { ok: false, reason: 'lease_not_found' };
    if (lease.workerId !== input.workerId) return { ok: false, reason: 'worker_mismatch', audited: true };
    const mission = this.missions.get(lease.missionId);
    if (!mission) return { ok: false, reason: 'mission_not_found' };
    this.leases.set(lease.leaseId, releaseLease(lease));
    this.leasesByMission.delete(mission.missionId);
    const next: AgentMission = {
      ...mission,
      leaseId: null,
      assignedWorkerId: null,
      updatedAt: input.nowIso,
    };
    this.missions.set(next.missionId, next);
    this.emit({
      missionId: next.missionId,
      tenantId: next.tenantId,
      universeId: next.universeId,
      workerId: input.workerId,
      kind: 'RELEASED',
      at: input.nowIso,
      detail: 'lease_released',
    });
    return { ok: true, mission: next };
  }

  complete(input: { missionId: string; workerId: string; nowIso: string }): QueueOpResult {
    const mission = this.missions.get(input.missionId);
    if (!mission) return { ok: false, reason: 'mission_not_found' };
    if (mission.assignedWorkerId !== input.workerId) {
      return { ok: false, reason: 'unauthorized_complete', audited: true };
    }
    const done = transitionMission(mission, 'COMPLETED', input.nowIso);
    if (!done.ok) return { ok: false, reason: done.reason };
    if (mission.leaseId) {
      const lease = this.leases.get(mission.leaseId);
      if (lease) this.leases.set(lease.leaseId, releaseLease(lease));
      this.leasesByMission.delete(mission.missionId);
    }
    const next: AgentMission = { ...done.mission, leaseId: null };
    this.missions.set(next.missionId, next);
    this.emit({
      missionId: next.missionId,
      tenantId: next.tenantId,
      universeId: next.universeId,
      workerId: input.workerId,
      kind: 'COMPLETED',
      at: input.nowIso,
      detail: 'mission_completed',
    });
    return { ok: true, mission: next };
  }

  fail(input: { missionId: string; workerId: string; reason: string; nowIso: string }): QueueOpResult {
    const mission = this.missions.get(input.missionId);
    if (!mission) return { ok: false, reason: 'mission_not_found' };
    if (mission.assignedWorkerId !== input.workerId) {
      return { ok: false, reason: 'unauthorized_fail', audited: true };
    }
    const failed = transitionMission(mission, 'FAILED', input.nowIso);
    if (!failed.ok) return { ok: false, reason: failed.reason };
    if (mission.leaseId) {
      const lease = this.leases.get(mission.leaseId);
      if (lease) this.leases.set(lease.leaseId, releaseLease(lease));
      this.leasesByMission.delete(mission.missionId);
    }
    const next: AgentMission = { ...failed.mission, leaseId: null };
    this.missions.set(next.missionId, next);
    this.emit({
      missionId: next.missionId,
      tenantId: next.tenantId,
      universeId: next.universeId,
      workerId: input.workerId,
      kind: 'FAILED',
      at: input.nowIso,
      detail: input.reason,
    });
    return { ok: true, mission: next };
  }

  retry(input: { missionId: string; nowIso: string }): QueueOpResult {
    const mission = this.missions.get(input.missionId);
    if (!mission) return { ok: false, reason: 'mission_not_found' };
    if (mission.status !== 'FAILED' && mission.status !== 'RETRY_WAIT') {
      return { ok: false, reason: 'retry_requires_failed_or_wait' };
    }
    if (mission.retryCount >= mission.maxRetries) {
      let current = mission;
      if (current.status === 'RETRY_WAIT') {
        // RETRY_WAIT → QUARANTINED is allowed
      }
      const quarantined = transitionMission(current, 'QUARANTINED', input.nowIso);
      if (!quarantined.ok) return { ok: false, reason: quarantined.reason };
      this.missions.set(quarantined.mission.missionId, quarantined.mission);
      this.emit({
        missionId: quarantined.mission.missionId,
        tenantId: quarantined.mission.tenantId,
        universeId: quarantined.mission.universeId,
        workerId: quarantined.mission.assignedWorkerId,
        kind: 'QUARANTINED',
        at: input.nowIso,
        detail: 'retry_limit_exceeded_founder_attention',
      });
      return { ok: false, reason: 'retry_limit_exceeded_quarantined', audited: true };
    }
    let current = mission;
    if (current.status === 'FAILED') {
      const wait = transitionMission(current, 'RETRY_WAIT', input.nowIso);
      if (!wait.ok) return { ok: false, reason: wait.reason };
      current = wait.mission;
    }
    const queued = transitionMission(current, 'QUEUED', input.nowIso);
    if (!queued.ok) return { ok: false, reason: queued.reason };
    const next: AgentMission = {
      ...queued.mission,
      retryCount: mission.retryCount + 1,
      assignedWorkerId: null,
      leaseId: null,
    };
    this.missions.set(next.missionId, next);
    this.emit({
      missionId: next.missionId,
      tenantId: next.tenantId,
      universeId: next.universeId,
      workerId: null,
      kind: 'RETRY',
      at: input.nowIso,
      detail: `retry_${next.retryCount}`,
    });
    return { ok: true, mission: next };
  }

  recoverOrphan(input: { missionId: string; nowMs: number; nowIso: string }): QueueOpResult {
    const mission = this.missions.get(input.missionId);
    if (!mission) return { ok: false, reason: 'mission_not_found' };
    const leaseId = mission.leaseId ?? this.leasesByMission.get(mission.missionId);
    if (!leaseId) return { ok: false, reason: 'no_lease' };
    const lease = this.leases.get(leaseId);
    if (!lease) return { ok: false, reason: 'lease_not_found' };
    const recovered = recoverExpiredLease({
      mission,
      lease,
      nowMs: input.nowMs,
      nowIso: input.nowIso,
    });
    if (!recovered.ok) return { ok: false, reason: recovered.reason };
    this.missions.set(recovered.mission.missionId, recovered.mission);
    this.leases.set(recovered.lease.leaseId, recovered.lease);
    this.leasesByMission.delete(recovered.mission.missionId);
    this.emit({
      missionId: recovered.mission.missionId,
      tenantId: recovered.mission.tenantId,
      universeId: recovered.mission.universeId,
      workerId: null,
      kind: 'ORPHAN_RECOVERY',
      at: input.nowIso,
      detail: recovered.action,
    });
    return { ok: true, mission: recovered.mission };
  }

  simulateWorkerCrashResume(input: {
    missionId: string;
    newWorkerId: string;
    nowMs: number;
    nowIso: string;
  }): ClaimResult & { resume?: ReturnType<typeof resumeFromCheckpoint> } {
    const recovered = this.recoverOrphan({
      missionId: input.missionId,
      nowMs: input.nowMs,
      nowIso: input.nowIso,
    });
    if (!recovered.ok) return { ok: false, reason: recovered.reason };
    const claimed = this.claim({
      workerId: input.newWorkerId,
      tenantId: recovered.mission.tenantId,
      universeId: recovered.mission.universeId,
      nowMs: input.nowMs,
      nowIso: input.nowIso,
    });
    if (!claimed.ok) return claimed;
    const cpId = claimed.mission.checkpointId;
    if (!cpId) return { ...claimed, resume: undefined };
    const cp = this.checkpoints.get(cpId);
    if (!cp) return claimed;
    return { ...claimed, resume: resumeFromCheckpoint(cp) };
  }

  storeDebrief(debrief: AgentDebrief): void {
    this.debriefs.set(debrief.debriefId, debrief);
  }

  getDebrief(debriefId: string): AgentDebrief | null {
    return this.debriefs.get(debriefId) ?? null;
  }

  getMission(missionId: string): AgentMission | null {
    return this.missions.get(missionId) ?? null;
  }

  getLease(leaseId: string): AgentLease | null {
    return this.leases.get(leaseId) ?? null;
  }

  getCheckpoint(checkpointId: string): AgentCheckpoint | null {
    return this.checkpoints.get(checkpointId) ?? null;
  }

  listEvents(missionId: string): readonly AgentExecutionEvent[] {
    return this.events.filter((e) => e.missionId === missionId);
  }

  /** Controlled upsert for Guardian/router handoff requeue — does not bypass isolation checks. */
  upsertMission(mission: AgentMission): void {
    this.missions.set(mission.missionId, mission);
  }

  quarantine(input: { missionId: string; nowIso: string; detail: string }): QueueOpResult {
    const mission = this.missions.get(input.missionId);
    if (!mission) return { ok: false, reason: 'mission_not_found' };
    let current = mission;
    if (current.status === 'RUNNING' || current.status === 'CLAIMED' || current.status === 'CHECKPOINTING') {
      const failed = transitionMission(current, 'FAILED', input.nowIso);
      if (!failed.ok) return { ok: false, reason: failed.reason };
      current = failed.mission;
    }
    if (current.status === 'FAILED' || current.status === 'RETRY_WAIT' || current.status === 'ORPHANED') {
      const q = transitionMission(current, 'QUARANTINED', input.nowIso);
      if (!q.ok) return { ok: false, reason: q.reason };
      this.missions.set(q.mission.missionId, q.mission);
      this.emit({
        missionId: q.mission.missionId,
        tenantId: q.mission.tenantId,
        universeId: q.mission.universeId,
        workerId: q.mission.assignedWorkerId,
        kind: 'QUARANTINED',
        at: input.nowIso,
        detail: input.detail,
      });
      return { ok: true, mission: q.mission };
    }
    if (current.status === 'QUEUED' || current.status === 'DRAFT') {
      // DRAFT/QUEUED cannot quarantine directly — cancel path only; force via fail simulation
      return { ok: false, reason: 'quarantine_requires_failed_retry_or_orphan' };
    }
    return { ok: false, reason: 'quarantine_not_applicable' };
  }
}

export function openDbBackedAgentMissionQueue(): DbBackedAgentMissionQueue {
  return new DbBackedAgentMissionQueue();
}
