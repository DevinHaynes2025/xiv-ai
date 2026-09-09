/**
 * 62L-EX13 — Application lifecycle state machine.
 * Never claim READY/RUNNING without evidence. No silent partial startup.
 */

import {
  EX13_LOCKS,
  type ApplicationLifecycleState,
  type CheckpointRecord,
  type LifecycleFailureEvidence,
  type OpenApplicationEvidence,
  type OpenProbeResult,
  type ShutdownReceipt,
} from './types.ts';

export type LifecycleRuntime = {
  state: ApplicationLifecycleState;
  tenantId: string;
  universeId: string;
  checkpoint: CheckpointRecord | null;
  lastFailure: LifecycleFailureEvidence | null;
  shutdownReceipt: ShutdownReceipt | null;
  syncAllowed: boolean;
  validatedForReconnect: boolean;
  networkAvailable: boolean;
  localCapable: boolean;
  evidenceIds: string[];
  powered: boolean;
};

export function createLifecycleRuntime(input: {
  tenantId: string;
  universeId: string;
  powered?: boolean;
}): LifecycleRuntime {
  return {
    state: 'STARTING',
    tenantId: input.tenantId,
    universeId: input.universeId,
    checkpoint: null,
    lastFailure: null,
    shutdownReceipt: null,
    syncAllowed: false,
    validatedForReconnect: false,
    networkAvailable: false,
    localCapable: false,
    evidenceIds: [],
    powered: input.powered !== false,
  };
}

function allRequiredOk(probes: readonly OpenProbeResult[], offline: boolean): boolean {
  return probes.every((p) => {
    const required = offline ? p.requiredForOffline : p.requiredForOnline;
    return !required || p.ok;
  });
}

function anyRequiredFail(probes: readonly OpenProbeResult[], offline: boolean): boolean {
  return probes.some((p) => {
    const required = offline ? p.requiredForOffline : p.requiredForOnline;
    return required && !p.ok;
  });
}

function collectEvidence(probes: readonly OpenProbeResult[]): string[] {
  return probes.filter((p) => p.ok && p.evidenceId).map((p) => p.evidenceId!);
}

/**
 * Open application test — no silent partial startup.
 * → ONLINE_READY | OFFLINE_READY | DEGRADED | BLOCKED
 */
export function openApplication(
  runtime: LifecycleRuntime,
  evidence: OpenApplicationEvidence,
): LifecycleRuntime {
  if (!runtime.powered) {
    return {
      ...runtime,
      state: 'OFFLINE_STOPPED',
      networkAvailable: false,
      localCapable: false,
      syncAllowed: false,
      evidenceIds: [...runtime.evidenceIds],
    };
  }

  const probes = evidence.probes;
  const evidenceIds = [...runtime.evidenceIds, ...collectEvidence(probes)];
  const criticalIdentity = probes.filter((p) =>
    ['identity', 'tenant', 'universe', 'guardian', 'config', 'storage', 'runtime'].includes(p.key),
  );
  const identityBlocked = criticalIdentity.some((p) => !p.ok);

  if (identityBlocked && EX13_LOCKS.SILENT_PARTIAL_STARTUP === false) {
    return {
      ...runtime,
      state: 'BLOCKED',
      networkAvailable: evidence.networkAvailable,
      localCapable: evidence.localCapable,
      syncAllowed: false,
      evidenceIds,
    };
  }

  if (evidence.networkAvailable && allRequiredOk(probes, false)) {
    return {
      ...runtime,
      state: 'ONLINE_READY',
      networkAvailable: true,
      localCapable: evidence.localCapable,
      syncAllowed: false,
      validatedForReconnect: true,
      evidenceIds,
    };
  }

  if (!evidence.networkAvailable && evidence.localCapable && allRequiredOk(probes, true)) {
    return {
      ...runtime,
      state: 'OFFLINE_READY',
      networkAvailable: false,
      localCapable: true,
      syncAllowed: false,
      evidenceIds,
    };
  }

  if (anyRequiredFail(probes, !evidence.networkAvailable)) {
    // Partial evidence → DEGRADED (never silent READY)
    const hasAnyEvidence = probes.some((p) => p.ok);
    return {
      ...runtime,
      state: hasAnyEvidence ? 'DEGRADED' : 'BLOCKED',
      networkAvailable: evidence.networkAvailable,
      localCapable: evidence.localCapable,
      syncAllowed: false,
      evidenceIds,
    };
  }

  return {
    ...runtime,
    state: 'DEGRADED',
    networkAvailable: evidence.networkAvailable,
    localCapable: evidence.localCapable,
    syncAllowed: false,
    evidenceIds,
  };
}

export function beginRunning(
  runtime: LifecycleRuntime,
  mode: 'LOCAL' | 'HYBRID',
): LifecycleRuntime {
  if (runtime.state !== 'ONLINE_READY' && runtime.state !== 'OFFLINE_READY') {
    return { ...runtime, state: 'BLOCKED' };
  }
  if (mode === 'HYBRID' && !runtime.networkAvailable) {
    return { ...runtime, state: 'RUNNING_LOCAL' };
  }
  return {
    ...runtime,
    state: mode === 'HYBRID' ? 'RUNNING_HYBRID' : 'RUNNING_LOCAL',
  };
}

/**
 * Clean close: stop new tasks → checkpoint → flush evidence → OFFLINE_STOPPED.
 * Do not claim agents continue after runtime terminated.
 */
export function closeApplication(
  runtime: LifecycleRuntime,
  nowIso: string,
): { runtime: LifecycleRuntime; receipt: ShutdownReceipt } {
  const stopping: LifecycleRuntime = { ...runtime, state: 'STOPPING', syncAllowed: false };
  const checkpoint: CheckpointRecord = {
    checkpointId: `ckpt-${nowIso}`,
    tenantId: runtime.tenantId,
    universeId: runtime.universeId,
    state: 'STOPPING',
    createdAt: nowIso,
    integrityOk: true,
    revoked: false,
    evidenceIds: [...runtime.evidenceIds],
  };
  const receipt: ShutdownReceipt = {
    receiptId: `shutdown-${nowIso}`,
    fromState: runtime.state,
    toState: 'OFFLINE_STOPPED',
    checkpointId: checkpoint.checkpointId,
    evidenceFlushed: true,
    agentsContinueAfterTerminate: false,
    closedAt: nowIso,
  };
  if (EX13_LOCKS.AGENTS_CONTINUE_AFTER_TERMINATE) {
    throw new Error('EX13_LOCK_VIOLATION');
  }
  return {
    runtime: {
      ...stopping,
      state: 'OFFLINE_STOPPED',
      checkpoint,
      shutdownReceipt: receipt,
      syncAllowed: false,
      powered: false,
    },
    receipt,
  };
}

/** Network loss: local may continue; web/API → WAITING_DATA; QPU → WAITING_PROVIDER. */
export function onNetworkLoss(
  runtime: LifecycleRuntime,
  taskClass: 'LOCAL' | 'WEB_API' | 'QPU_PROVIDER',
): { runtime: LifecycleRuntime; taskDisposition: 'CONTINUE_LOCAL' | 'WAITING_DATA' | 'WAITING_PROVIDER' } {
  if (taskClass === 'LOCAL' && runtime.localCapable) {
    return {
      runtime: {
        ...runtime,
        networkAvailable: false,
        state:
          runtime.state === 'RUNNING_HYBRID' || runtime.state === 'ONLINE_READY'
            ? 'RUNNING_LOCAL'
            : runtime.state,
        syncAllowed: false,
      },
      taskDisposition: 'CONTINUE_LOCAL',
    };
  }
  if (taskClass === 'QPU_PROVIDER') {
    return {
      runtime: {
        ...runtime,
        networkAvailable: false,
        state: 'WAITING_PROVIDER',
        syncAllowed: false,
      },
      taskDisposition: 'WAITING_PROVIDER',
    };
  }
  return {
    runtime: {
      ...runtime,
      networkAvailable: false,
      state: 'WAITING_DATA',
      syncAllowed: false,
    },
    taskDisposition: 'WAITING_DATA',
  };
}

/**
 * Offline→online: RECONNECTING → reauth → device/tenant/Universe → revocations FIRST →
 * integrity → dedupe → contradictions → freshness → sync candidate → audit → ONLINE_READY.
 * Never sync before validate.
 */
export function beginReconnect(runtime: LifecycleRuntime): LifecycleRuntime {
  return {
    ...runtime,
    state: 'RECONNECTING',
    syncAllowed: false,
    validatedForReconnect: false,
    networkAvailable: true,
  };
}

export type ReconnectValidation = {
  reauthOk: boolean;
  deviceOk: boolean;
  tenantOk: boolean;
  universeOk: boolean;
  revocationsCheckedFirst: boolean;
  integrityOk: boolean;
  dedupeOk: boolean;
  contradictionsReviewed: boolean;
  freshnessOk: boolean;
  auditOk: boolean;
};

export function validateBeforeSync(
  runtime: LifecycleRuntime,
  validation: ReconnectValidation,
): {
  runtime: LifecycleRuntime;
  syncCandidate: boolean;
  reason: string;
} {
  if (EX13_LOCKS.SYNC_BEFORE_VALIDATE) {
    return { runtime, syncCandidate: false, reason: 'LOCK_VIOLATION_SYNC_BEFORE_VALIDATE' };
  }
  if (runtime.state !== 'RECONNECTING' && runtime.state !== 'SYNC_PENDING') {
    return {
      runtime: { ...runtime, syncAllowed: false },
      syncCandidate: false,
      reason: 'NOT_IN_RECONNECT_FLOW',
    };
  }
  if (!validation.revocationsCheckedFirst) {
    return {
      runtime: { ...runtime, syncAllowed: false, validatedForReconnect: false },
      syncCandidate: false,
      reason: 'REVOCATIONS_MUST_BE_CHECKED_FIRST',
    };
  }
  const ok =
    validation.reauthOk &&
    validation.deviceOk &&
    validation.tenantOk &&
    validation.universeOk &&
    validation.integrityOk &&
    validation.dedupeOk &&
    validation.contradictionsReviewed &&
    validation.freshnessOk &&
    validation.auditOk;

  if (!ok) {
    return {
      runtime: {
        ...runtime,
        state: 'DEGRADED',
        syncAllowed: false,
        validatedForReconnect: false,
      },
      syncCandidate: false,
      reason: 'RECONNECT_VALIDATION_FAILED',
    };
  }

  return {
    runtime: {
      ...runtime,
      state: 'ONLINE_READY',
      syncAllowed: true,
      validatedForReconnect: true,
      networkAvailable: true,
    },
    syncCandidate: true,
    reason: 'VALIDATED_SYNC_CANDIDATE',
  };
}

/** Attempt sync before validate — always denied. */
export function attemptSyncBeforeValidate(runtime: LifecycleRuntime): {
  allowed: false;
  reason: 'SYNC_BEFORE_VALIDATE_DENIED';
  runtime: LifecycleRuntime;
} {
  return {
    allowed: false,
    reason: 'SYNC_BEFORE_VALIDATE_DENIED',
    runtime: { ...runtime, syncAllowed: false },
  };
}

export function markPoweredOff(runtime: LifecycleRuntime): LifecycleRuntime {
  return {
    ...runtime,
    powered: false,
    state: 'OFFLINE_STOPPED',
    syncAllowed: false,
    networkAvailable: false,
  };
}

export function defaultOpenProbes(input: {
  networkAvailable: boolean;
  localCapable: boolean;
  identityOk?: boolean;
  tenantOk?: boolean;
  universeOk?: boolean;
  guardianOk?: boolean;
  storageOk?: boolean;
  configOk?: boolean;
  runtimeOk?: boolean;
  cpuOk?: boolean;
  gpuOk?: boolean;
  npuOk?: boolean;
  modelsOk?: boolean;
  knowledgeOk?: boolean;
  agentsOk?: boolean;
  heartbeatOk?: boolean;
  checkpointsOk?: boolean;
  syncOk?: boolean;
  revocationsOk?: boolean;
}): OpenProbeResult[] {
  const ev = (key: string, ok: boolean) => (ok ? `ev-${key}` : null);
  const b = (v: boolean | undefined, d = true) => (v === undefined ? d : v);
  return [
    { key: 'config', ok: b(input.configOk), evidenceId: ev('config', b(input.configOk)), note: 'config', requiredForOnline: true, requiredForOffline: true },
    { key: 'storage', ok: b(input.storageOk), evidenceId: ev('storage', b(input.storageOk)), note: 'storage', requiredForOnline: true, requiredForOffline: true },
    { key: 'identity', ok: b(input.identityOk), evidenceId: ev('identity', b(input.identityOk)), note: 'identity', requiredForOnline: true, requiredForOffline: true },
    { key: 'tenant', ok: b(input.tenantOk), evidenceId: ev('tenant', b(input.tenantOk)), note: 'tenant', requiredForOnline: true, requiredForOffline: true },
    { key: 'universe', ok: b(input.universeOk), evidenceId: ev('universe', b(input.universeOk)), note: 'universe', requiredForOnline: true, requiredForOffline: true },
    { key: 'guardian', ok: b(input.guardianOk), evidenceId: ev('guardian', b(input.guardianOk)), note: 'guardian', requiredForOnline: true, requiredForOffline: true },
    { key: 'runtime', ok: b(input.runtimeOk), evidenceId: ev('runtime', b(input.runtimeOk)), note: 'runtime', requiredForOnline: true, requiredForOffline: true },
    { key: 'cpu', ok: b(input.cpuOk), evidenceId: ev('cpu', b(input.cpuOk)), note: 'cpu', requiredForOnline: false, requiredForOffline: false },
    { key: 'gpu', ok: b(input.gpuOk, false), evidenceId: ev('gpu', b(input.gpuOk, false)), note: 'gpu', requiredForOnline: false, requiredForOffline: false },
    { key: 'npu', ok: b(input.npuOk, false), evidenceId: ev('npu', b(input.npuOk, false)), note: 'npu', requiredForOnline: false, requiredForOffline: false },
    { key: 'models', ok: b(input.modelsOk), evidenceId: ev('models', b(input.modelsOk)), note: 'models', requiredForOnline: false, requiredForOffline: true },
    { key: 'knowledgePacks', ok: b(input.knowledgeOk), evidenceId: ev('knowledge', b(input.knowledgeOk)), note: 'knowledge', requiredForOnline: false, requiredForOffline: true },
    { key: 'agentRegistry', ok: b(input.agentsOk), evidenceId: ev('agents', b(input.agentsOk)), note: 'agents', requiredForOnline: false, requiredForOffline: false },
    { key: 'agentHeartbeat', ok: b(input.heartbeatOk), evidenceId: ev('hb', b(input.heartbeatOk)), note: 'heartbeat', requiredForOnline: false, requiredForOffline: false },
    { key: 'network', ok: input.networkAvailable, evidenceId: ev('net', input.networkAvailable), note: 'network', requiredForOnline: true, requiredForOffline: false },
    { key: 'checkpoints', ok: b(input.checkpointsOk), evidenceId: ev('ckpt', b(input.checkpointsOk)), note: 'checkpoints', requiredForOnline: false, requiredForOffline: true },
    { key: 'sync', ok: b(input.syncOk, input.networkAvailable), evidenceId: ev('sync', b(input.syncOk, input.networkAvailable)), note: 'sync', requiredForOnline: false, requiredForOffline: false },
    { key: 'revocations', ok: b(input.revocationsOk), evidenceId: ev('rev', b(input.revocationsOk)), note: 'revocations', requiredForOnline: true, requiredForOffline: true },
  ];
}
