/**
 * US-AGT-01 â€” AI Workforce: propose supplier simulation.
 * Propose-only until human approval. Simulation â‰  production. L4 remains false.
 */

import { decideAgentAction, openAgentSession, proposeListedTool, type AgentSnapshot } from './agent-router';
import { withTurnContext } from './turn-context';
import { getAgentTool } from './tools';
import type { AgentRole, AgentType } from './types';

export const SUPPLIER_SIMULATION_TOOL_ID = 'simulate_supplier_reallocation' as const;

export const SUPPLIER_SIMULATION_POLICY = {
  requiresApproval: true,
  l4Autonomy: false,
  productionMutation: false,
  simulationEqualsProduction: false,
  label: 'SIMULATION_NOT_PRODUCTION',
} as const;

const ALLOWED_PROPOSERS: readonly AgentType[] = ['executive_agent'];

export function supplierSimulationTool() {
  return getAgentTool(SUPPLIER_SIMULATION_TOOL_ID);
}

export function canProposeSupplierSimulation(agentType: AgentType | null | undefined): boolean {
  return Boolean(agentType && ALLOWED_PROPOSERS.includes(agentType));
}

export async function proposeSupplierSimulation(input: {
  userId: string;
  agentType: AgentType;
}): Promise<AgentSnapshot> {
  if (!canProposeSupplierSimulation(input.agentType)) {
    throw new Error('supplier_simulation_agent_not_allowed');
  }
  const tool = supplierSimulationTool();
  if (!tool.requiresApproval) {
    throw new Error('supplier_simulation_must_require_approval');
  }
  return proposeListedTool({
    userId: input.userId,
    agentType: input.agentType,
    toolId: SUPPLIER_SIMULATION_TOOL_ID,
  });
}

export async function decideSupplierSimulation(input: {
  userId: string;
  agentType: AgentType;
  actionId: string;
  decision: 'approve' | 'reject';
}): Promise<AgentSnapshot> {
  if (!canProposeSupplierSimulation(input.agentType)) {
    throw new Error('supplier_simulation_agent_not_allowed');
  }
  return decideAgentAction(input);
}

/** Convenience for tests / local smoke: open session then propose. */
export async function openAndProposeSupplierSimulation(input: {
  userId: string;
  role: Extract<AgentRole, 'executive'>;
}): Promise<AgentSnapshot> {
  const agentType = 'executive_agent';
  openAgentSession(
    withTurnContext({
      userId: input.userId,
      role: input.role,
      interests: [],
      displayName: 'operator',
      anonymous: false,
    }),
  );
  return proposeSupplierSimulation({ userId: input.userId, agentType });
}

