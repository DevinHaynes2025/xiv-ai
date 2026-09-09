import type { MeshAgentRole } from './agent-mesh';
import { requestAgentInstance } from './agent-population';

export type AgentDemand = {
  tenantId: string;
  universeId: string;
  taskId: string;
  requestedRoles: MeshAgentRole[];
  consequence: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  approved: boolean;
};

export function planDemandAgents(demand: AgentDemand) {
  const roles = [...new Set(demand.requestedRoles)].slice(0, 6);
  if (demand.consequence === 'HIGH' || demand.consequence === 'CRITICAL') {
    return { status: 'HUMAN_APPROVAL_REQUIRED' as const, agents: [], productionAuthorization: false as const };
  }
  if (!demand.approved) return { status: 'NOT_APPROVED' as const, agents: [], productionAuthorization: false as const };

  const agents = roles.map((role) => requestAgentInstance({
    role,
    tenantId: demand.tenantId,
    universeId: demand.universeId,
    taskId: demand.taskId,
    ttlMinutes: 30,
  }));
  return { status: 'PLANNED' as const, agents, productionAuthorization: false as const };
}
