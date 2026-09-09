import type { RuntimeHeartbeat } from './types';

export const DEFAULT_HEARTBEAT_STALE_MS = 2 * 60 * 1000;

export function classifyHeartbeat(
  input: { nodeId: string; observedAt?: string | null; running?: boolean | null },
  now = new Date(),
  staleAfterMs = DEFAULT_HEARTBEAT_STALE_MS,
): RuntimeHeartbeat {
  if (!input.observedAt) {
    return {
      nodeId: input.nodeId,
      observedAt: now.toISOString(),
      state: input.running === false ? 'OFFLINE_STOPPED' : 'UNKNOWN',
      detail: 'No fresh heartbeat timestamp is available.',
    };
  }

  const observed = new Date(input.observedAt);
  if (Number.isNaN(observed.getTime())) {
    return {
      nodeId: input.nodeId,
      observedAt: now.toISOString(),
      state: 'UNKNOWN',
      detail: 'Heartbeat timestamp is invalid.',
    };
  }

  const ageMs = Math.max(0, now.getTime() - observed.getTime());
  if (input.running === false) {
    return {
      nodeId: input.nodeId,
      observedAt: observed.toISOString(),
      state: 'OFFLINE_STOPPED',
      detail: 'Runtime explicitly reported stopped.',
    };
  }

  if (ageMs > staleAfterMs) {
    return {
      nodeId: input.nodeId,
      observedAt: observed.toISOString(),
      state: 'STALE',
      detail: `Heartbeat is ${ageMs}ms old, above the ${staleAfterMs}ms freshness limit.`,
    };
  }

  if (input.running === true) {
    return {
      nodeId: input.nodeId,
      observedAt: observed.toISOString(),
      state: 'RUNNING_VERIFIED',
      detail: 'Fresh heartbeat and explicit running signal are present.',
    };
  }

  return {
    nodeId: input.nodeId,
    observedAt: observed.toISOString(),
    state: 'WAITING_NODE',
    detail: 'Fresh observation exists but runtime state is not confirmed running.',
  };
}
