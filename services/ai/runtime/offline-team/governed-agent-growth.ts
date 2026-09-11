export interface AgentGrowthRequest {
  tenantId: string;
  requestedRole: string;
  needEvidenceRefs: string[];
  activeAgentCount: number;
  maxConcurrentAgents: number;
  humanApproved: boolean;
}

export function canCreateAgent(req: AgentGrowthRequest): boolean {
  return req.needEvidenceRefs.length > 0 &&
    req.humanApproved &&
    req.activeAgentCount < req.maxConcurrentAgents &&
    req.maxConcurrentAgents <= 8;
}

export const agentGrowthPolicy = {
  minConcurrentAgents: 2,
  maxConcurrentAgents: 8,
  unlimitedAgentMultiplicationAllowed: false,
  selfGrantedAuthorityAllowed: false,
  newAgentRequiresNeedEvidence: true,
  productionAuthorityInheritedAutomatically: false,
};
