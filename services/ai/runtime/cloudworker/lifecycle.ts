/**
 * Worker process lifecycle — deterministic state machine.
 */

import type { WorkerProcessState } from './types';

export type LifecycleEvent =
  | 'START'
  | 'MARK_HEALTHY'
  | 'MARK_DEGRADED'
  | 'MARK_UNHEALTHY'
  | 'STOP'
  | 'CRASH'
  | 'RECOVER'
  | 'RECOVERED';

const ALLOWED: Record<WorkerProcessState, readonly LifecycleEvent[]> = {
  CREATED: ['START', 'STOP'],
  STARTING: ['MARK_HEALTHY', 'CRASH', 'STOP', 'MARK_UNHEALTHY'],
  HEALTHY: ['MARK_DEGRADED', 'MARK_UNHEALTHY', 'STOP', 'CRASH'],
  DEGRADED: ['MARK_HEALTHY', 'MARK_UNHEALTHY', 'STOP', 'CRASH'],
  UNHEALTHY: ['RECOVER', 'STOP', 'CRASH'],
  STOPPING: ['STOP'],
  STOPPED: ['START'],
  CRASHED: ['RECOVER'],
  RECOVERING: ['RECOVERED', 'CRASH', 'MARK_UNHEALTHY'],
};

function nextState(state: WorkerProcessState, event: LifecycleEvent): WorkerProcessState | null {
  switch (event) {
    case 'START':
      return state === 'CREATED' || state === 'STOPPED' ? 'STARTING' : null;
    case 'MARK_HEALTHY':
      return state === 'STARTING' || state === 'DEGRADED' || state === 'RECOVERING' ? 'HEALTHY' : null;
    case 'MARK_DEGRADED':
      return state === 'HEALTHY' ? 'DEGRADED' : null;
    case 'MARK_UNHEALTHY':
      return state === 'STARTING' || state === 'HEALTHY' || state === 'DEGRADED' || state === 'RECOVERING'
        ? 'UNHEALTHY'
        : null;
    case 'STOP':
      if (state === 'STOPPING') return 'STOPPED';
      if (state === 'CREATED' || state === 'STOPPED') return 'STOPPED';
      return 'STOPPING';
    case 'CRASH':
      return 'CRASHED';
    case 'RECOVER':
      return state === 'CRASHED' || state === 'UNHEALTHY' ? 'RECOVERING' : null;
    case 'RECOVERED':
      return state === 'RECOVERING' ? 'HEALTHY' : null;
    default:
      return null;
  }
}

export function transitionWorkerProcess(
  state: WorkerProcessState,
  event: LifecycleEvent,
): { ok: true; state: WorkerProcessState } | { ok: false; reason: string } {
  if (!(ALLOWED[state] as readonly string[]).includes(event)) {
    return { ok: false, reason: `lifecycle_denied:${state}:${event}` };
  }
  const next = nextState(state, event);
  if (!next) return { ok: false, reason: `lifecycle_invalid:${state}:${event}` };
  return { ok: true, state: next };
}

export function workerLifecycleAllowsL4(): false {
  return false;
}
