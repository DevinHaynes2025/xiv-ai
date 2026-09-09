/**
 * 62L-EX13 — Hybrid heartbeat grid.
 * Stale heartbeat cannot report RUNNING_VERIFIED.
 */

import {
  EX13_LOCKS,
  HEARTBEAT_TARGETS,
  type HeartbeatRecord,
  type HeartbeatStatus,
  type HeartbeatTarget,
} from './types.ts';

export type HeartbeatGrid = {
  records: Map<HeartbeatTarget, HeartbeatRecord>;
};

export function createHeartbeatGrid(): HeartbeatGrid {
  return { records: new Map() };
}

export function beat(
  grid: HeartbeatGrid,
  target: HeartbeatTarget,
  nowIso: string,
  ttlMs: number,
  evidenceId: string | null = null,
): HeartbeatGrid {
  const next = new Map(grid.records);
  next.set(target, {
    target,
    lastBeatAt: nowIso,
    ttlMs,
    status: 'FRESH',
    evidenceId,
  });
  return { records: next };
}

export function evaluateHeartbeat(
  record: HeartbeatRecord,
  nowIso: string,
): HeartbeatStatus {
  const age = Date.parse(nowIso) - Date.parse(record.lastBeatAt);
  if (!Number.isFinite(age) || age < 0) return 'MISSING';
  if (age > record.ttlMs) {
    if (EX13_LOCKS.STALE_HEARTBEAT_AS_RUNNING_VERIFIED) {
      throw new Error('EX13_LOCK_VIOLATION');
    }
    return 'STALE';
  }
  if (!record.evidenceId) return 'FRESH';
  return 'RUNNING_VERIFIED';
}

export function refreshGridStatuses(grid: HeartbeatGrid, nowIso: string): HeartbeatGrid {
  const next = new Map<HeartbeatTarget, HeartbeatRecord>();
  for (const [target, record] of grid.records) {
    next.set(target, { ...record, status: evaluateHeartbeat(record, nowIso) });
  }
  return { records: next };
}

/** Stale/missing cannot claim RUNNING_VERIFIED. */
export function isRunningVerified(grid: HeartbeatGrid, target: HeartbeatTarget, nowIso: string): boolean {
  const record = grid.records.get(target);
  if (!record) return false;
  return evaluateHeartbeat(record, nowIso) === 'RUNNING_VERIFIED';
}

export function claimRunningVerified(
  grid: HeartbeatGrid,
  target: HeartbeatTarget,
  nowIso: string,
): { allowed: boolean; status: HeartbeatStatus; reason: string } {
  const record = grid.records.get(target);
  if (!record) {
    return { allowed: false, status: 'MISSING', reason: 'NO_HEARTBEAT' };
  }
  const status = evaluateHeartbeat(record, nowIso);
  if (status === 'STALE') {
    return {
      allowed: false,
      status: 'STALE',
      reason: 'STALE_HEARTBEAT_CANNOT_REPORT_RUNNING_VERIFIED',
    };
  }
  if (status !== 'RUNNING_VERIFIED') {
    return { allowed: false, status, reason: 'HEARTBEAT_NOT_VERIFIED' };
  }
  return { allowed: true, status: 'RUNNING_VERIFIED', reason: 'FRESH_EVIDENCED_HEARTBEAT' };
}

export function seedDefaultTargets(grid: HeartbeatGrid, nowIso: string, ttlMs = 30_000): HeartbeatGrid {
  let g = grid;
  for (const target of HEARTBEAT_TARGETS) {
    g = beat(g, target, nowIso, ttlMs, `hb-${target.toLowerCase()}`);
  }
  return g;
}
