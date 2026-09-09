/**
 * Mission leases — exclusive claim, heartbeat renew, expire → orphan recovery.
 * Duplicate active claims are rejected.
 */

import type { AgentLease, AgentMission } from './types';
import { DEFAULT_LEASE_TTL_MS } from './types';
import { transitionMission } from './transitions';

export function createLease(input: {
  leaseId: string;
  missionId: string;
  workerId: string;
  tenantId: string;
  universeId: string;
  nowMs: number;
  ttlMs?: number;
}): AgentLease {
  const ttl = input.ttlMs ?? DEFAULT_LEASE_TTL_MS;
  const acquiredAt = new Date(input.nowMs).toISOString();
  const expiresAt = new Date(input.nowMs + ttl).toISOString();
  return {
    leaseId: input.leaseId,
    missionId: input.missionId,
    workerId: input.workerId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    acquiredAt,
    expiresAt,
    heartbeatAt: acquiredAt,
    active: true,
  };
}

export function leaseIsExpired(lease: AgentLease, nowMs: number): boolean {
  if (!lease.active) return true;
  return Date.parse(lease.expiresAt) <= nowMs;
}

export function duplicateClaimRejected(existing: AgentLease | null, nowMs: number): boolean {
  if (!existing) return false;
  if (!existing.active) return false;
  return !leaseIsExpired(existing, nowMs);
}

export function renewLease(lease: AgentLease, nowMs: number, ttlMs?: number): AgentLease | null {
  if (!lease.active) return null;
  if (leaseIsExpired(lease, nowMs)) return null;
  const ttl = ttlMs ?? DEFAULT_LEASE_TTL_MS;
  const heartbeatAt = new Date(nowMs).toISOString();
  return {
    ...lease,
    heartbeatAt,
    expiresAt: new Date(nowMs + ttl).toISOString(),
  };
}

export function releaseLease(lease: AgentLease): AgentLease {
  return { ...lease, active: false };
}

export function recoverExpiredLease(input: {
  mission: AgentMission;
  lease: AgentLease;
  nowMs: number;
  nowIso: string;
}):
  | { ok: true; mission: AgentMission; lease: AgentLease; action: string }
  | { ok: false; reason: string } {
  if (!leaseIsExpired(input.lease, input.nowMs) && input.lease.active) {
    return { ok: false, reason: 'lease_still_active' };
  }
  const orphaned = transitionMission(input.mission, 'ORPHANED', input.nowIso);
  if (!orphaned.ok) {
    // Already ORPHANED / terminal-ish — try QUEUED via ORPHANED path
    if (input.mission.status === 'ORPHANED') {
      const queued = transitionMission(input.mission, 'QUEUED', input.nowIso);
      if (!queued.ok) return { ok: false, reason: queued.reason };
      return {
        ok: true,
        mission: {
          ...queued.mission,
          assignedWorkerId: null,
          leaseId: null,
        },
        lease: releaseLease(input.lease),
        action: 'orphan_requeued',
      };
    }
    return { ok: false, reason: orphaned.reason };
  }
  const queued = transitionMission(orphaned.mission, 'QUEUED', input.nowIso);
  if (!queued.ok) return { ok: false, reason: queued.reason };
  return {
    ok: true,
    mission: {
      ...queued.mission,
      assignedWorkerId: null,
      leaseId: null,
    },
    lease: releaseLease(input.lease),
    action: 'expired_lease_orphan_requeued',
  };
}
