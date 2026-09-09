import {
  listAgentInstances,
  populationStats,
  requestAgentInstance,
  resetAgentPopulation,
  setAgentState,
  type AgentInstance,
} from './agent-population';
import type { MeshAgentRole } from './agent-mesh';
import { BJ_LOCKS } from './global-operations-brain-types';

/**
 * Global Agent Workforce Scheduler — logical workforce; sparse/bounded activation.
 * Not millions of OS processes. Reuses agent-population hard caps.
 */

export const WORKFORCE_HARD_CAPS = Object.freeze({
  maxActiveActivations: 32,
  maxActivationsPerRole: 4,
  maxLogicalAddressSpace: 1_000_000, // addressable slots, not running processes
  materializeAllSlots: false as const,
});

export type WorkforceActivationRequest = {
  tenantId: string;
  universeId: string;
  role: MeshAgentRole;
  taskId?: string;
  priority?: 'low' | 'normal' | 'high';
  ttlMinutes?: number;
  claimMillionProcesses?: boolean;
};

export type WorkforceScheduleResult = {
  accepted: boolean;
  reason: string;
  activation: AgentInstance | null;
  stats: ReturnType<typeof populationStats>;
  logicalAddressSpace: number;
  materializedProcesses: number;
  productionAuthorization: false;
  sparseActivation: true;
};

export function resetWorkforceScheduler() {
  resetAgentPopulation();
}

export function scheduleWorkforceActivation(input: WorkforceActivationRequest): WorkforceScheduleResult {
  const caps = {
    logicalAddressSpace: WORKFORCE_HARD_CAPS.maxLogicalAddressSpace,
    productionAuthorization: false as const,
    sparseActivation: true as const,
  };

  if (!input.tenantId || !input.universeId) {
    return {
      accepted: false,
      reason: 'TENANT_AND_UNIVERSE_REQUIRED',
      activation: null,
      stats: populationStats(),
      materializedProcesses: 0,
      ...caps,
    };
  }

  if (input.claimMillionProcesses) {
    return {
      accepted: false,
      reason: 'DENIED_MILLION_PROCESS_CLAIM — logical address space ≠ running processes; sparse activation only.',
      activation: null,
      stats: populationStats(),
      materializedProcesses: populationStats().active,
      ...caps,
    };
  }

  const created = requestAgentInstance({
    role: input.role,
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: input.taskId,
    ttlMinutes: input.ttlMinutes ?? 30,
  });

  if (!('instance' in created) || !created.instance) {
    return {
      accepted: false,
      reason: created.reason,
      activation: null,
      stats: populationStats(),
      materializedProcesses: populationStats().active,
      ...caps,
    };
  }

  return {
    accepted: true,
    reason: created.created ? 'SPARSE_BOUNDED_ACTIVATION' : created.reason,
    activation: created.instance,
    stats: populationStats(),
    materializedProcesses: populationStats().active,
    ...caps,
  };
}

export function hibernateWorkforceAgent(agentId: string) {
  const agent = listAgentInstances().find((a) => a.id === agentId);
  if (!agent) return { ok: false as const, reason: 'NOT_FOUND' };
  try {
    if (agent.state === 'RUNNING') setAgentState(agentId, 'READY');
    const next = setAgentState(agentId, 'HIBERNATING');
    return { ok: true as const, instance: next };
  } catch (error) {
    return { ok: false as const, reason: error instanceof Error ? error.message : 'TRANSITION_DENIED' };
  }
}

export function workforceSchedulerHonesty() {
  return {
    locks: BJ_LOCKS,
    caps: WORKFORCE_HARD_CAPS,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
    millionProcessesRunning: false as const,
  };
}
