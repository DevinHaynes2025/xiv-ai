import type {
  FabricSchedulerDecision,
} from './xvi-agent-fabric-scheduler';

import {
  XviFabricRuntimeStream,
} from './xvi-agent-fabric-runtime-stream';

export interface FabricRuntimeObserver {
  readonly stream: XviFabricRuntimeStream;

  missionStarted(atMs: number): void;

  tickStarted(
    decision: Readonly<FabricSchedulerDecision>,
    atMs: number,
  ): void;

  workStarted(
    decision: Readonly<FabricSchedulerDecision>,
    atMs: number,
  ): void;

  workCompleted(
    decision: Readonly<FabricSchedulerDecision>,
    atMs: number,
  ): void;

  checkpointStarted(
    decision: Readonly<FabricSchedulerDecision>,
    atMs: number,
  ): void;

  checkpointCompleted(
    decision: Readonly<FabricSchedulerDecision>,
    atMs: number,
  ): void;

  heartbeatRenewed(
    decision: Readonly<FabricSchedulerDecision>,
    atMs: number,
  ): void;

  failureRecorded(atMs: number): void;
  ownershipLost(atMs: number): void;
  reviewRequired(atMs: number): void;
  missionStopped(atMs: number): void;
}

export const XVI_RUNTIME_OBSERVER_GUARDRAILS =
  Object.freeze({
    providerCalls: 0,
    processSpawns: 0,
    productionAuthority: false,
    secretMaterialIncluded: false,
    mutatesScheduler: false,
    ownsLease: false,
  });

const refuse = (): never => {
  throw new Error('XVI_RUNTIME_OBSERVER_REFUSED');
};

export function createFabricRuntimeObserver(
  tenantId: string,
  missionId: string,
): FabricRuntimeObserver {
  const stream =
    new XviFabricRuntimeStream(
      tenantId,
      missionId,
    );

  let sequence = 0;
  let lastAtMs = -1;

  const append = (
    kind:
      | 'MISSION_STARTED'
      | 'TICK_STARTED'
      | 'WORK_STARTED'
      | 'WORK_COMPLETED'
      | 'CHECKPOINT_STARTED'
      | 'CHECKPOINT_COMPLETED'
      | 'HEARTBEAT_RENEWED'
      | 'FAILURE_RECORDED'
      | 'OWNERSHIP_LOST'
      | 'REVIEW_REQUIRED'
      | 'MISSION_STOPPED',
    atMs: number,
  ): void => {
    if (
      !Number.isSafeInteger(atMs) ||
      atMs < 0 ||
      atMs < lastAtMs
    ) {
      refuse();
    }

    const nextSequence =
      sequence + 1;

    if (
      !Number.isSafeInteger(nextSequence)
    ) {
      refuse();
    }

    stream.append({
      tenantId,
      missionId,
      sequence: nextSequence,
      occurredAtMs: atMs,
      kind,
    });

    sequence = nextSequence;
    lastAtMs = atMs;
  };

  const assertDecision = (
    decision: Readonly<FabricSchedulerDecision>,
  ): void => {
    if (
      decision.tenantId !== tenantId ||
      decision.missionId !== missionId ||
      decision.productionAuthority !== false ||
      decision.providerCalls !== 0 ||
      decision.processSpawns !== 0 ||
      decision.secretMaterialIncluded !== false
    ) {
      refuse();
    }
  };

  return Object.freeze({
    stream,

    missionStarted(atMs) {
      append(
        'MISSION_STARTED',
        atMs,
      );
    },

    tickStarted(decision, atMs) {
      assertDecision(decision);
      append('TICK_STARTED', atMs);
    },

    workStarted(decision, atMs) {
      assertDecision(decision);
      append('WORK_STARTED', atMs);
    },

    workCompleted(decision, atMs) {
      assertDecision(decision);
      append('WORK_COMPLETED', atMs);
    },

    checkpointStarted(decision, atMs) {
      assertDecision(decision);
      append(
        'CHECKPOINT_STARTED',
        atMs,
      );
    },

    checkpointCompleted(decision, atMs) {
      assertDecision(decision);
      append(
        'CHECKPOINT_COMPLETED',
        atMs,
      );
    },

    heartbeatRenewed(decision, atMs) {
      assertDecision(decision);
      append(
        'HEARTBEAT_RENEWED',
        atMs,
      );
    },

    failureRecorded(atMs) {
      append('FAILURE_RECORDED', atMs);
    },

    ownershipLost(atMs) {
      append('OWNERSHIP_LOST', atMs);
    },

    reviewRequired(atMs) {
      append('REVIEW_REQUIRED', atMs);
    },

    missionStopped(atMs) {
      append('MISSION_STOPPED', atMs);
    },
  });
}
