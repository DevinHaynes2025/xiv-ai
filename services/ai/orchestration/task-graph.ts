/**
 * Task graph with parent-child scope inheritance, budgets, and return paths.
 */

import { createHash } from 'node:crypto';
import {
  GOB_LOCKS,
  scopesMatch,
  type AllowedTaskClass,
  type TenantScope,
} from './types.ts';

export type TaskNode = {
  taskId: string;
  parentTaskId: string | null;
  missionId: string;
  agentId: string;
  taskClass: AllowedTaskClass;
  scope: TenantScope;
  computeBudget: number;
  storageBudget: number;
  status: 'PENDING' | 'RUNNING' | 'BLOCKED' | 'DONE' | 'DENIED' | 'WAITING_DATA';
  returnPath: string;
  createdAt: string;
};

export type TaskGraph = {
  createRoot(input: {
    missionId: string;
    agentId: string;
    taskClass: AllowedTaskClass;
    scope: TenantScope;
    computeBudget: number;
    storageBudget: number;
    returnPath: string;
  }): { created: true; node: TaskNode } | { created: false; denied: true; reason: string };
  spawnChild(input: {
    parentTaskId: string;
    agentId: string;
    taskClass: AllowedTaskClass;
    /** Child may only inherit/narrow parent scope — never expand. */
    requestedScope?: TenantScope;
    computeBudget: number;
    storageBudget: number;
  }):
    | { created: true; node: TaskNode }
    | { created: false; denied: true; reason: string };
  get(taskId: string): TaskNode | null;
  childrenOf(taskId: string): readonly TaskNode[];
  list(scope: TenantScope): readonly TaskNode[];
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createTaskGraph(): TaskGraph {
  const nodes = new Map<string, TaskNode>();

  return {
    createRoot(input) {
      if (GOB_LOCKS.L4_AUTONOMY_ENABLED) {
        return {
          created: false,
          denied: true,
          reason: 'L4_AUTONOMY_MUST_BE_FALSE',
        };
      }
      const taskId = `task-${sha256(`${input.missionId}:${input.agentId}:${nowIso()}`)}`;
      const node: TaskNode = {
        taskId,
        parentTaskId: null,
        missionId: input.missionId,
        agentId: input.agentId,
        taskClass: input.taskClass,
        scope: { ...input.scope },
        computeBudget: input.computeBudget,
        storageBudget: input.storageBudget,
        status: 'PENDING',
        returnPath: input.returnPath,
        createdAt: nowIso(),
      };
      nodes.set(taskId, node);
      return { created: true, node };
    },

    spawnChild(input) {
      const parent = nodes.get(input.parentTaskId);
      if (!parent) {
        return {
          created: false,
          denied: true,
          reason: 'PARENT_TASK_NOT_FOUND',
        };
      }
      if (input.computeBudget > parent.computeBudget) {
        return {
          created: false,
          denied: true,
          reason: 'CHILD_COMPUTE_BUDGET_EXCEEDS_PARENT',
        };
      }
      if (input.storageBudget > parent.storageBudget) {
        return {
          created: false,
          denied: true,
          reason: 'CHILD_STORAGE_BUDGET_EXCEEDS_PARENT',
        };
      }
      const scope = input.requestedScope ?? parent.scope;
      if (!scopesMatch(scope, parent.scope)) {
        return {
          created: false,
          denied: true,
          reason: 'CHILD_SCOPE_MUST_INHERIT_PARENT_TENANT_UNIVERSE',
        };
      }
      const taskId = `task-${sha256(`${parent.taskId}:${input.agentId}:${nowIso()}`)}`;
      const node: TaskNode = {
        taskId,
        parentTaskId: parent.taskId,
        missionId: parent.missionId,
        agentId: input.agentId,
        taskClass: input.taskClass,
        scope: { ...parent.scope },
        computeBudget: input.computeBudget,
        storageBudget: input.storageBudget,
        status: 'PENDING',
        returnPath: parent.returnPath,
        createdAt: nowIso(),
      };
      nodes.set(taskId, node);
      return { created: true, node };
    },

    get(taskId) {
      return nodes.get(taskId) ?? null;
    },

    childrenOf(taskId) {
      return [...nodes.values()].filter((n) => n.parentTaskId === taskId);
    },

    list(scope) {
      return [...nodes.values()].filter((n) => scopesMatch(n.scope, scope));
    },
  };
}
