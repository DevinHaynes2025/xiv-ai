/**
 * 62L-EL — Offline Agent Heartbeat.
 * Missing / stale / stopped → WAITING_NODE / OFFLINE_STOPPED / STALE.
 * Do NOT claim agents run while ASUS / node is off.
 */

import type { RuntimeHeartbeat } from './types';
import { DEFAULT_HEARTBEAT_STALE_MS } from './runtime-state';

export type HeartbeatInput = {
  nodeId: string;
  observedAt?: string | null;
  running?: boolean | null;
  devicePoweredOn?: boolean | null;
};

export function classifyHeartbeat(
  input: HeartbeatInput,
  now = new Date(),
  staleAfterMs = DEFAULT_HEARTBEAT_STALE_MS,
): RuntimeHeartbeat {
  const base = {
    nodeId: input.nodeId,
    agentsClaimedWorkingWhileOff: false as const,
  };

  if (input.devicePoweredOn === false || input.running === false) {
    return {
      ...base,
      observedAt: input.observedAt ? new Date(input.observedAt).toISOString() : now.toISOString(),
      state: 'OFFLINE_STOPPED',
      detail:
        input.devicePoweredOn === false
          ? 'Device reported powered off — agents are NOT claimed running.'
          : 'Runtime explicitly reported stopped — agents are NOT claimed running.',
    };
  }

  if (!input.observedAt) {
    return {
      ...base,
      observedAt: now.toISOString(),
      state: 'WAITING_NODE',
      detail: 'No fresh heartbeat timestamp — WAITING_NODE (do not claim offline agents running).',
    };
  }

  const observed = new Date(input.observedAt);
  if (Number.isNaN(observed.getTime())) {
    return {
      ...base,
      observedAt: now.toISOString(),
      state: 'UNKNOWN',
      detail: 'Heartbeat timestamp is invalid.',
    };
  }

  const ageMs = Math.max(0, now.getTime() - observed.getTime());
  if (ageMs > staleAfterMs) {
    return {
      ...base,
      observedAt: observed.toISOString(),
      state: 'STALE',
      detail: `Heartbeat is ${ageMs}ms old (limit ${staleAfterMs}ms) — treat as WAITING_NODE / not verified running.`,
    };
  }

  if (input.running === true && input.devicePoweredOn !== false) {
    return {
      ...base,
      observedAt: observed.toISOString(),
      state: 'RUNNING_VERIFIED',
      detail: 'Fresh heartbeat and explicit running signal are present.',
    };
  }

  return {
    ...base,
    observedAt: observed.toISOString(),
    state: 'WAITING_NODE',
    detail: 'Fresh observation exists but runtime running is not confirmed.',
  };
}

export function agentsMayClaimWorking(heartbeat: RuntimeHeartbeat): boolean {
  return heartbeat.state === 'RUNNING_VERIFIED';
}

export function heartbeatHonesty() {
  return {
    missingHeartbeatMeansWaitingOrStopped: true as const,
    agentsWorkingWhileNodeOff: false as const,
    runningVerifiedRequiresFreshEvidence: true as const,
  };
}
