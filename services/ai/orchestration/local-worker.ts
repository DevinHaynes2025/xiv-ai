/**
 * Bounded local offline worker.
 * External/live API work → WAITING_DATA when offline.
 * Never fabricate fresh data.
 */

import {
  ALLOWED_TASK_CLASSES,
  GOB_LOCKS,
  type AllowedTaskClass,
  type AgentReturnPayload,
  type TenantScope,
} from './types.ts';

export type NetworkMode = 'ONLINE' | 'OFFLINE' | 'DEGRADED';

export type LocalWorkerTask = {
  taskId: string;
  agentId: string;
  taskClass: AllowedTaskClass | string;
  scope: TenantScope;
  requiresLiveApi: boolean;
  payload: Readonly<Record<string, unknown>>;
};

export type LocalWorkerResult =
  | {
      status: 'COMPLETED';
      offlineMode: boolean;
      returnPayload: AgentReturnPayload;
    }
  | {
      status: 'WAITING_DATA';
      offlineMode: true;
      reason: string;
      returnPayload: AgentReturnPayload;
    }
  | {
      status: 'DENIED';
      reason: string;
      returnPayload: AgentReturnPayload;
    };

export type LocalWorker = {
  setNetworkMode(mode: NetworkMode): void;
  getNetworkMode(): NetworkMode;
  isAllowedTaskClass(taskClass: string): taskClass is AllowedTaskClass;
  execute(task: LocalWorkerTask): LocalWorkerResult;
};

function baseReturn(
  partial: Partial<AgentReturnPayload> & { nextAction: string; result: unknown },
): AgentReturnPayload {
  return {
    result: partial.result,
    evidence: partial.evidence ?? [],
    tests: partial.tests ?? [],
    failures: partial.failures ?? [],
    contradictions: partial.contradictions ?? [],
    blockers: partial.blockers ?? [],
    lessons: partial.lessons ?? [],
    candidateSkills: partial.candidateSkills ?? [],
    nextAction: partial.nextAction,
  };
}

export function createLocalWorker(initialMode: NetworkMode = 'OFFLINE'): LocalWorker {
  let networkMode: NetworkMode = initialMode;

  return {
    setNetworkMode(mode) {
      networkMode = mode;
    },

    getNetworkMode() {
      return networkMode;
    },

    isAllowedTaskClass(taskClass: string): taskClass is AllowedTaskClass {
      return (ALLOWED_TASK_CLASSES as readonly string[]).includes(taskClass);
    },

    execute(task) {
      if (GOB_LOCKS.FABRICATE_FRESH_DATA_WHEN_OFFLINE) {
        return {
          status: 'DENIED',
          reason: 'LOCK_VIOLATION_FABRICATE_FRESH_DATA',
          returnPayload: baseReturn({
            result: null,
            failures: ['LOCK_VIOLATION'],
            nextAction: 'HALT',
          }),
        };
      }

      if (!this.isAllowedTaskClass(task.taskClass)) {
        return {
          status: 'DENIED',
          reason: `TASK_CLASS_NOT_ALLOWED:${task.taskClass}`,
          returnPayload: baseReturn({
            result: null,
            failures: [`TASK_CLASS_NOT_ALLOWED:${task.taskClass}`],
            nextAction: 'REQUEST_ALLOWED_TASK_CLASS',
          }),
        };
      }

      const offline = networkMode === 'OFFLINE' || networkMode === 'DEGRADED';

      if (task.requiresLiveApi && offline) {
        if (GOB_LOCKS.FABRICATE_FRESH_DATA_WHEN_OFFLINE === false) {
          return {
            status: 'WAITING_DATA',
            offlineMode: true,
            reason: 'EXTERNAL_LIVE_API_UNAVAILABLE_OFFLINE',
            returnPayload: baseReturn({
              result: null,
              blockers: ['WAITING_DATA:EXTERNAL_LIVE_API'],
              lessons: [
                'Do not fabricate fresh data when offline; wait for reconnect or use offline packs.',
              ],
              nextAction: 'WAIT_FOR_NETWORK_OR_USE_OFFLINE_PACK',
            }),
          };
        }
      }

      // Local allowed work — structured local analysis only (no fabricated live facts).
      const evidence = [
        `taskClass=${task.taskClass}`,
        `networkMode=${networkMode}`,
        `agentId=${task.agentId}`,
        `taskId=${task.taskId}`,
      ];

      return {
        status: 'COMPLETED',
        offlineMode: offline,
        returnPayload: baseReturn({
          result: {
            taskClass: task.taskClass,
            processedLocally: true,
            networkMode,
            note:
              offline
                ? 'Completed from local/offline-capable inputs only; freshness of external facts NOT claimed.'
                : 'Completed with network available; still no fabricated evidence.',
            inputKeys: Object.keys(task.payload),
          },
          evidence,
          tests: [`local_worker_allowed_${task.taskClass}`],
          lessons: [
            'Local worktree access ≠ offline model inference.',
            'Freshness of external data remains WAITING_DATA until verified sync.',
          ],
          nextAction: 'RETURN_TO_HOME_BASE',
        }),
      };
    },
  };
}
