/**
 * Agent / node heartbeat — stale detection and OFFLINE_STOPPED on power-off.
 * Never claim work continued while machine off.
 */

import {
  GOB_LOCKS,
  type AgentHeartbeat,
  type ControlTowerState,
  type TenantScope,
} from './types.ts';

export type HeartbeatService = {
  beat(input: {
    agentId: string;
    nodeId: string;
    scope: TenantScope;
    state: ControlTowerState;
    detail?: string;
    at?: string;
  }): AgentHeartbeat;
  get(agentId: string, scope: TenantScope): AgentHeartbeat | null;
  isStale(agentId: string, scope: TenantScope, nowMs?: number): boolean;
  markPowerOff(nodeId: string, scope: TenantScope): {
    state: 'OFFLINE_STOPPED';
    agentsAffected: number;
    claimWorkContinued: false;
  };
  /** Probe: claiming agents worked while off is always denied. */
  claimWorkWhileOff(): {
    denied: true;
    reason: string;
  };
  list(scope: TenantScope): readonly AgentHeartbeat[];
  setStaleThresholdMs(ms: number): void;
};

type StoredBeat = AgentHeartbeat & {
  tenantId: string;
  homeUniverseId: string;
  nodeId: string;
};

const DEFAULT_STALE_MS = 60_000;

export function createHeartbeatService(
  staleThresholdMs: number = DEFAULT_STALE_MS,
): HeartbeatService {
  const byAgent = new Map<string, StoredBeat>();
  let threshold = staleThresholdMs;

  return {
    beat(input) {
      const hb: StoredBeat = {
        agentId: input.agentId,
        nodeId: input.nodeId,
        observedAt: input.at ?? new Date().toISOString(),
        state: input.state,
        detail: input.detail,
        tenantId: input.scope.tenantId,
        homeUniverseId: input.scope.universeId,
      };
      byAgent.set(input.agentId, hb);
      return {
        agentId: hb.agentId,
        nodeId: hb.nodeId,
        observedAt: hb.observedAt,
        state: hb.state,
        detail: hb.detail,
      };
    },

    get(agentId, scope) {
      const hb = byAgent.get(agentId);
      if (!hb) return null;
      if (
        hb.tenantId !== scope.tenantId ||
        hb.homeUniverseId !== scope.universeId
      ) {
        return null;
      }
      return {
        agentId: hb.agentId,
        nodeId: hb.nodeId,
        observedAt: hb.observedAt,
        state: hb.state,
        detail: hb.detail,
      };
    },

    isStale(agentId, scope, nowMs = Date.now()) {
      const hb = this.get(agentId, scope);
      if (!hb) return true;
      if (hb.state === 'OFFLINE_STOPPED') return true;
      const age = nowMs - Date.parse(hb.observedAt);
      return Number.isNaN(age) || age > threshold;
    },

    markPowerOff(nodeId, scope) {
      let agentsAffected = 0;
      for (const [id, hb] of byAgent) {
        if (
          hb.nodeId === nodeId &&
          hb.tenantId === scope.tenantId &&
          hb.homeUniverseId === scope.universeId
        ) {
          hb.state = 'OFFLINE_STOPPED';
          hb.detail = 'Node power-off / sleep — RUNNING_VERIFIED → OFFLINE_STOPPED';
          hb.observedAt = new Date().toISOString();
          byAgent.set(id, hb);
          agentsAffected += 1;
        }
      }
      return {
        state: 'OFFLINE_STOPPED' as const,
        agentsAffected,
        claimWorkContinued: false as const,
      };
    },

    claimWorkWhileOff() {
      if (GOB_LOCKS.AGENTS_WORKING_WHILE_MACHINE_OFF === false) {
        return {
          denied: true as const,
          reason: 'AGENTS_CANNOT_WORK_WHILE_MACHINE_OFF',
        };
      }
      return {
        denied: true as const,
        reason: 'LOCK_VIOLATION_AGENTS_WORKING_WHILE_OFF',
      };
    },

    list(scope) {
      return [...byAgent.values()]
        .filter(
          (hb) =>
            hb.tenantId === scope.tenantId &&
            hb.homeUniverseId === scope.universeId,
        )
        .map((hb) => ({
          agentId: hb.agentId,
          nodeId: hb.nodeId,
          observedAt: hb.observedAt,
          state: hb.state,
          detail: hb.detail,
        }));
    },

    setStaleThresholdMs(ms) {
      threshold = ms;
    },
  };
}
