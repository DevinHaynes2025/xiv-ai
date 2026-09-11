import { createHash } from 'node:crypto';

export type AgentStateStatus = 'IDLE' | 'WORKING' | 'PAUSED' | 'RECOVERING';

export interface PersistentAgentState {
  tenantId: string;
  agentId: string;
  role: string;
  status: AgentStateStatus;
  checkpointId: string;
  memoryNamespace: string;
  queueItemIds: string[];
  updatedAt: string;
  stateHash: string;
}

export function createAgentState(input: Omit<PersistentAgentState, 'updatedAt' | 'stateHash'>): PersistentAgentState {
  if (!input.tenantId || !input.agentId || !input.role || !input.checkpointId) throw new Error('invalid agent state');
  const updatedAt = new Date().toISOString();
  const material = JSON.stringify({ ...input, updatedAt });
  return { ...input, updatedAt, stateHash: createHash('sha256').update(material).digest('hex') };
}

export function restoreAgentStates(states: PersistentAgentState[], tenantId: string): PersistentAgentState[] {
  return states.filter(s => s.tenantId === tenantId && Boolean(s.checkpointId));
}

export const AGENT_STATE_GUARDRAILS = {
  maxActiveAgents: 8,
  minCouncilAgents: 2,
  silentSelfRewriteAllowed: false,
  productionMutationAllowed: false,
} as const;
