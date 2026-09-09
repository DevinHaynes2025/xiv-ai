/**
 * 62L-ES-HC4 — Task graph with budgets, scopes, and return paths.
 *
 * Every branch execution requires a Home Base receipt (enforced via
 * home-base-receipts). Tenant isolation; no L4 autonomy.
 */

import { createHash } from 'node:crypto';
import {
  HC4_LOCKS,
  scopesMatch,
  type Hc4Actor,
  type TenantScope,
} from './types.ts';

export type TaskNodeStatus =
  | 'PENDING'
  | 'READY'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'BLOCKED'
  | 'CANCELLED';

export type TaskBudget = {
  maxCpuMs: number;
  maxMemoryMb: number;
  maxFanout: number;
};

export type TaskNode = {
  nodeId: string;
  label: string;
  dependsOn: readonly string[];
  status: TaskNodeStatus;
  budget: TaskBudget;
  scope: TenantScope;
  returnPath: string;
  receiptId: string | null;
};

export type TaskGraph = {
  graphId: string;
  scope: TenantScope;
  nodes: Map<string, TaskNode>;
  addNode(input: {
    nodeId: string;
    label: string;
    dependsOn?: readonly string[];
    budget: TaskBudget;
    returnPath: string;
  }): TaskNode | { denied: true; reason: string };
  executeBranch(input: {
    nodeId: string;
    actor: Hc4Actor;
    /** Required — branch execution without receipt is denied. */
    receiptId: string | null;
  }):
    | { executed: true; node: TaskNode; returnPath: string }
    | {
        executed: false;
        denied: true;
        state: 'DENIED' | 'BLOCKED';
        reason: string;
      };
  getReturnPath(nodeId: string): string | null;
  list(scope: TenantScope): readonly TaskNode[];
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

export function createTaskGraph(input: {
  graphId?: string;
  scope: TenantScope;
}): TaskGraph {
  const graphId = input.graphId ?? `tg-${sha256(JSON.stringify(input.scope))}`;
  const nodes = new Map<string, TaskNode>();

  return {
    graphId,
    scope: input.scope,
    nodes,

    addNode(nodeInput) {
      if (nodes.size >= 256) {
        return { denied: true as const, reason: 'GRAPH_NODE_LIMIT' };
      }
      const node: TaskNode = {
        nodeId: nodeInput.nodeId,
        label: nodeInput.label,
        dependsOn: nodeInput.dependsOn ?? [],
        status: 'PENDING',
        budget: nodeInput.budget,
        scope: input.scope,
        returnPath: nodeInput.returnPath,
        receiptId: null,
      };
      nodes.set(node.nodeId, node);
      return node;
    },

    executeBranch(exec) {
      if (HC4_LOCKS.L4_AUTONOMY_ENABLED) {
        return {
          executed: false,
          denied: true,
          state: 'DENIED',
          reason: 'L4_AUTONOMY_MUST_REMAIN_FALSE',
        };
      }

      const actorScope: TenantScope = {
        orgId: exec.actor.orgId,
        tenantId: exec.actor.tenantId,
        universeId: exec.actor.universeId,
      };
      if (!scopesMatch(actorScope, input.scope)) {
        return {
          executed: false,
          denied: true,
          state: 'DENIED',
          reason: 'TENANT_UNIVERSE_ISOLATION_VIOLATION',
        };
      }

      const node = nodes.get(exec.nodeId);
      if (!node) {
        return {
          executed: false,
          denied: true,
          state: 'DENIED',
          reason: 'UNKNOWN_NODE',
        };
      }

      // Receipt required for every branch execution.
      if (
        !exec.receiptId &&
        HC4_LOCKS.BRANCH_EXECUTION_WITHOUT_HOME_BASE_RECEIPT === false
      ) {
        return {
          executed: false,
          denied: true,
          state: 'DENIED',
          reason: 'HOME_BASE_RECEIPT_REQUIRED_FOR_BRANCH_EXECUTION',
        };
      }

      for (const depId of node.dependsOn) {
        const dep = nodes.get(depId);
        if (!dep || dep.status !== 'SUCCEEDED') {
          node.status = 'BLOCKED';
          return {
            executed: false,
            denied: true,
            state: 'BLOCKED',
            reason: `DEPENDENCY_NOT_SATISFIED:${depId}`,
          };
        }
      }

      node.status = 'SUCCEEDED';
      node.receiptId = exec.receiptId;
      return {
        executed: true,
        node,
        returnPath: node.returnPath,
      };
    },

    getReturnPath(nodeId) {
      return nodes.get(nodeId)?.returnPath ?? null;
    },

    list(scope) {
      if (!scopesMatch(scope, input.scope)) return [];
      return [...nodes.values()];
    },
  };
}
