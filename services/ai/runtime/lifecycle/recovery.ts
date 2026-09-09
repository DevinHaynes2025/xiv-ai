/**
 * 62L-EX13 — Crash / forced-close recovery.
 * LifecycleFailureEvidence → RECOVERED | PARTIAL_RECOVERY | RESTART_REQUIRED | BLOCKED.
 */

import type { LifecycleRuntime } from './state-machine.ts';
import type {
  CheckpointRecord,
  LifecycleFailureEvidence,
  RecoveryVerdict,
} from './types.ts';

export function recordForcedCloseOrCrash(
  runtime: LifecycleRuntime,
  nowIso: string,
  opts: { checkpointFlushed: boolean; evidenceFlushed: boolean },
): { runtime: LifecycleRuntime; failure: LifecycleFailureEvidence } {
  const failure: LifecycleFailureEvidence = {
    failureId: `fail-${nowIso}`,
    priorState: runtime.state,
    incompleteShutdown: true,
    checkpointFlushed: opts.checkpointFlushed,
    evidenceFlushed: opts.evidenceFlushed,
    crashedAt: nowIso,
    note: 'Forced close/crash — incomplete shutdown evidence recorded.',
  };
  return {
    runtime: {
      ...runtime,
      state: 'CRASHED',
      lastFailure: failure,
      syncAllowed: false,
      shutdownReceipt: null,
    },
    failure,
  };
}

export function recoverOnNextLaunch(
  runtime: LifecycleRuntime,
  checkpoint: CheckpointRecord | null,
  nowIso: string,
): { runtime: LifecycleRuntime; verdict: RecoveryVerdict; reason: string } {
  const recovering: LifecycleRuntime = {
    ...runtime,
    state: 'RECOVERING',
    powered: true,
  };

  if (runtime.lastFailure && !runtime.lastFailure.checkpointFlushed && !checkpoint) {
    return {
      runtime: { ...recovering, state: 'BLOCKED', checkpoint: null },
      verdict: 'BLOCKED',
      reason: 'NO_CHECKPOINT_AFTER_INCOMPLETE_SHUTDOWN',
    };
  }

  if (!checkpoint) {
    return {
      runtime: { ...recovering, state: 'BLOCKED', checkpoint: null },
      verdict: 'RESTART_REQUIRED',
      reason: 'CHECKPOINT_MISSING',
    };
  }

  if (checkpoint.revoked) {
    return {
      runtime: { ...recovering, state: 'BLOCKED', checkpoint },
      verdict: 'BLOCKED',
      reason: 'CHECKPOINT_REVOKED',
    };
  }
  if (!checkpoint.integrityOk) {
    return {
      runtime: { ...recovering, state: 'BLOCKED', checkpoint },
      verdict: 'BLOCKED',
      reason: 'CHECKPOINT_INTEGRITY_FAILED',
    };
  }
  if (checkpoint.tenantId !== runtime.tenantId || checkpoint.universeId !== runtime.universeId) {
    return {
      runtime: { ...recovering, state: 'BLOCKED', checkpoint },
      verdict: 'BLOCKED',
      reason: 'CHECKPOINT_SCOPE_MISMATCH',
    };
  }

  const partial =
    Boolean(runtime.lastFailure) &&
    (!runtime.lastFailure!.evidenceFlushed || !runtime.lastFailure!.checkpointFlushed);

  if (partial) {
    return {
      runtime: {
        ...recovering,
        state: 'DEGRADED',
        checkpoint: { ...checkpoint, createdAt: nowIso },
        evidenceIds: [...new Set([...runtime.evidenceIds, ...checkpoint.evidenceIds])],
      },
      verdict: 'PARTIAL_RECOVERY',
      reason: 'CHECKPOINT_OK_BUT_PRIOR_FLUSH_INCOMPLETE',
    };
  }

  return {
    runtime: {
      ...recovering,
      state:
        checkpoint.state === 'STOPPING' || checkpoint.state === 'OFFLINE_STOPPED'
          ? 'OFFLINE_READY'
          : 'ONLINE_READY',
      checkpoint: { ...checkpoint },
      evidenceIds: [...new Set([...runtime.evidenceIds, ...checkpoint.evidenceIds])],
      lastFailure: null,
    },
    verdict: 'RECOVERED',
    reason: 'CHECKPOINT_VALIDATED',
  };
}
