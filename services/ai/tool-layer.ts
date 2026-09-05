import { authorizeTool } from './policies';
import { getAgentTool } from './tools';
import {
  systemBusinessMetrics,
  systemConnectedSystems,
  systemOrganizationUniverse,
  systemReadInterests,
  systemReadProfile,
  systemSearchKnowledge,
} from './systems';
import type { AgentSessionContext, AgentToolId, AgentType } from './types';

export type ToolInvokeResult = {
  blocked: string | null;
  text: string;
  requiresApproval: boolean;
};

export async function invokeToolLayer(input: {
  agentType: AgentType;
  toolId: AgentToolId;
  context: AgentSessionContext;
  approved?: boolean;
}): Promise<ToolInvokeResult> {
  const tool = getAgentTool(input.toolId);
  const decision = authorizeTool({
    agentType: input.agentType,
    toolId: input.toolId,
    approved: input.approved,
    anonymous: input.context.anonymous,
  });

  if (!decision.allowed) {
    return { blocked: decision.reason, text: '', requiresApproval: false };
  }

  if (decision.requiresApproval && !input.approved) {
    return { blocked: null, text: tool.description, requiresApproval: true };
  }

  if (tool.layer === 'profile') {
    const result = await systemReadProfile(input.context);
    return { blocked: result.blocked, text: result.text, requiresApproval: false };
  }
  if (tool.layer === 'interests') {
    const result = await systemReadInterests(input.context);
    return { blocked: result.blocked, text: result.text, requiresApproval: false };
  }
  if (tool.layer === 'organization_universe') {
    return { blocked: null, text: systemOrganizationUniverse(), requiresApproval: false };
  }
  if (tool.layer === 'business_metrics') {
    return { blocked: null, text: systemBusinessMetrics(), requiresApproval: false };
  }
  if (tool.layer === 'connected_systems') {
    return { blocked: null, text: systemConnectedSystems(), requiresApproval: false };
  }
  if (tool.layer === 'search_knowledge') {
    return { blocked: null, text: systemSearchKnowledge(), requiresApproval: false };
  }

  return {
    blocked: null,
    text: input.approved ? `Prototype simulation: ${tool.name}. No live system was changed.` : tool.description,
    requiresApproval: decision.requiresApproval,
  };
}
