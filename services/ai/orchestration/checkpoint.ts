/**
 * Checkpoint + restore for sleep/power-off and resume candidates.
 * RUNNING_VERIFIED → OFFLINE_STOPPED on power-off.
 * Restart: restore → policy validation → dependency validation → resume candidate.
 * Never claim work continued while machine off.
 */

import { createHash } from 'node:crypto';
import {
  GOB_LOCKS,
  type CheckpointRecord,
  type ComputeState,
  type RuntimeState,
  type TenantScope,
} from './types.ts';

export type CheckpointStore = {
  save(input: {
    agentId: string;
    missionId: string;
    taskId: string;
    scope: TenantScope;
    runtimeState: RuntimeState;
    progressSummary: string;
    evidenceRefs?: readonly string[];
    dependencySnapshot?: readonly string[];
    computeState: ComputeState;
  }):
    | { saved: true; checkpoint: CheckpointRecord }
    | { saved: false; denied: true; reason: string };
  get(checkpointId: string, scope: TenantScope): CheckpointRecord | null;
  list(scope: TenantScope): readonly CheckpointRecord[];
  /**
   * On power-off: mark RUNNING checkpoints as OFFLINE_STOPPED.
   * Does NOT claim work continued.
   */
  onPowerOff(scope: TenantScope): {
    transitioned: number;
    priorStateRequired: 'RUNNING';
    newState: 'OFFLINE_STOPPED';
    workContinuedWhileOff: false;
  };
  /**
   * Restore path: restore → policy → dependencies → resume candidate.
   */
  restore(input: {
    checkpointId: string;
    scope: TenantScope;
    policyValid: boolean;
    dependenciesValid: boolean;
  }):
    | {
        restored: true;
        checkpoint: CheckpointRecord;
        resumeCandidate: true;
        workContinuedWhileOff: false;
      }
    | {
        restored: false;
        denied: true;
        reason: string;
        workContinuedWhileOff: false;
      };
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function createCheckpointStore(): CheckpointStore {
  const byId = new Map<string, CheckpointRecord>();

  return {
    save(input) {
      if (GOB_LOCKS.AGENTS_WORKING_WHILE_MACHINE_OFF) {
        return {
          saved: false,
          denied: true,
          reason: 'LOCK_VIOLATION_AGENTS_WORKING_WHILE_OFF',
        };
      }
      const createdAt = new Date().toISOString();
      const body = JSON.stringify({
        agentId: input.agentId,
        missionId: input.missionId,
        taskId: input.taskId,
        tenantId: input.scope.tenantId,
        universeId: input.scope.universeId,
        runtimeState: input.runtimeState,
        progressSummary: input.progressSummary,
        createdAt,
      });
      const hash = sha256(body);
      const checkpoint: CheckpointRecord = {
        checkpointId: `ckpt-${hash.slice(0, 20)}`,
        agentId: input.agentId,
        missionId: input.missionId,
        taskId: input.taskId,
        tenantId: input.scope.tenantId,
        homeUniverseId: input.scope.universeId,
        runtimeState: input.runtimeState,
        progressSummary: input.progressSummary,
        evidenceRefs: input.evidenceRefs ?? [],
        dependencySnapshot: input.dependencySnapshot ?? [],
        computeState: input.computeState,
        createdAt,
        hash,
      };
      byId.set(checkpoint.checkpointId, checkpoint);
      return { saved: true, checkpoint };
    },

    get(checkpointId, scope) {
      const c = byId.get(checkpointId);
      if (!c) return null;
      if (
        c.tenantId !== scope.tenantId ||
        c.homeUniverseId !== scope.universeId
      ) {
        return null;
      }
      return c;
    },

    list(scope) {
      return [...byId.values()].filter(
        (c) =>
          c.tenantId === scope.tenantId &&
          c.homeUniverseId === scope.universeId,
      );
    },

    onPowerOff(scope) {
      let transitioned = 0;
      for (const [id, c] of byId) {
        if (
          c.tenantId === scope.tenantId &&
          c.homeUniverseId === scope.universeId &&
          (c.runtimeState === 'RUNNING' || c.runtimeState === 'CHECKPOINTED')
        ) {
          c.runtimeState = 'OFFLINE_STOPPED';
          c.computeState = 'OFFLINE_STOPPED';
          byId.set(id, c);
          transitioned += 1;
        }
      }
      return {
        transitioned,
        priorStateRequired: 'RUNNING' as const,
        newState: 'OFFLINE_STOPPED' as const,
        workContinuedWhileOff: false as const,
      };
    },

    restore(input) {
      const c = this.get(input.checkpointId, input.scope);
      if (!c) {
        return {
          restored: false,
          denied: true,
          reason: 'CHECKPOINT_NOT_FOUND',
          workContinuedWhileOff: false,
        };
      }
      if (!input.policyValid) {
        return {
          restored: false,
          denied: true,
          reason: 'POLICY_VALIDATION_FAILED',
          workContinuedWhileOff: false,
        };
      }
      if (!input.dependenciesValid) {
        return {
          restored: false,
          denied: true,
          reason: 'DEPENDENCY_VALIDATION_FAILED',
          workContinuedWhileOff: false,
        };
      }
      // Resume candidate only — does not claim work continued while off.
      c.runtimeState = 'IDLE';
      if (c.computeState === 'OFFLINE_STOPPED') {
        c.computeState = 'WAITING_NODE';
      }
      byId.set(c.checkpointId, c);
      return {
        restored: true,
        checkpoint: c,
        resumeCandidate: true,
        workContinuedWhileOff: false,
      };
    },
  };
}
