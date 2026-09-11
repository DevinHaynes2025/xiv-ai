export type AgentRuntimeState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'FAILED' | 'RECOVERING' | 'STOPPED';

export interface SupervisedAgent {
  agentId: string;
  tenantId: string;
  role: string;
  state: AgentRuntimeState;
  memoryNamespace: string;
  lastCheckpointId?: string;
  evidenceRefs: string[];
}

export interface SupervisorPolicy {
  maxConcurrentAgents: number;
  productionMutationAllowed: boolean;
  requireTenantMatch: boolean;
  requireEvidenceOnPromotion: boolean;
}

export const DEFAULT_SUPERVISOR_POLICY: SupervisorPolicy = {
  maxConcurrentAgents: 8,
  productionMutationAllowed: false,
  requireTenantMatch: true,
  requireEvidenceOnPromotion: true,
};

export function canStartAgent(agent: SupervisedAgent, activeAgents: SupervisedAgent[], policy = DEFAULT_SUPERVISOR_POLICY): boolean {
  if (!agent.tenantId || !agent.agentId || !agent.memoryNamespace) return false;
  const active = activeAgents.filter(a => a.state === 'RUNNING' || a.state === 'RECOVERING');
  if (active.length >= policy.maxConcurrentAgents) return false;
  if (policy.requireTenantMatch && active.some(a => a.tenantId !== agent.tenantId)) return false;
  return true;
}

export const supervisorGuardrails = {
  offlineFirst: true,
  activeAgentTarget: '2-8',
  productionMutationAllowed: false,
  topSecretExternalRoutingAllowed: false,
};
