import { getAgentTool, HIGH_RISK_TOOLS } from './tools';
import type { AgentTool, AgentToolId, AgentType, PolicyDecision, StructuredAgentOutput } from './types';

const LOW_AND_MEDIUM: readonly AgentToolId[] = [
  'read_profile',
  'read_interests',
  'summarize_interests',
  'recommend_communities',
  'search_opportunities',
  'search_knowledge',
  'explain_trends',
  'draft_report',
  'draft_community_intro',
  'read_organization_universe',
  'summarize_anonymous_themes',
  'draft_anonymous_idea',
  'private_wellness_prompt',
  'summarize_business_health',
  'summarize_company_health',
  'list_connected_systems',
  'draft_briefing_note',
  'draft_chair_brief',
  'draft_campaign',
  'prepare_supplier_email',
  'create_project_task',
  'suggest_inventory_changes',
  'simulate_supplier_reallocation',
];

export const AGENT_ALLOWED_TOOLS: Record<AgentType, readonly AgentToolId[]> = {
  consumer_agent: [
    'read_profile',
    'read_interests',
    'summarize_interests',
    'recommend_communities',
    'search_opportunities',
    'search_knowledge',
    'explain_trends',
    'draft_report',
    'draft_community_intro',
  ],
  employee_agent: [
    'read_organization_universe',
    'summarize_anonymous_themes',
    'draft_anonymous_idea',
    'private_wellness_prompt',
    'search_knowledge',
    'create_project_task',
  ],
  business_agent: [
    'read_profile',
    'read_interests',
    'summarize_business_health',
    'explain_trends',
    'list_connected_systems',
    'draft_report',
    'draft_briefing_note',
    'draft_campaign',
    'create_project_task',
    'suggest_inventory_changes',
  ],
  executive_agent: [
    'read_profile',
    'summarize_company_health',
    'explain_trends',
    'list_connected_systems',
    'draft_report',
    'draft_chair_brief',
    'simulate_supplier_reallocation',
    'prepare_supplier_email',
    'suggest_inventory_changes',
  ],
};

export function isToolAllowed(agentType: AgentType, toolId: AgentToolId) {
  if (HIGH_RISK_TOOLS.includes(toolId)) return false;
  return AGENT_ALLOWED_TOOLS[agentType].includes(toolId);
}

export function assertToolAllowed(agentType: AgentType, toolId: AgentToolId) {
  const decision = authorizeTool({ agentType, toolId, approved: false });
  if (!decision.allowed) throw new Error(decision.reason);
}

export function requiresHumanApproval(tool: AgentTool) {
  return tool.requiresApproval || tool.riskLevel === 'medium' || tool.riskLevel === 'high' || tool.riskLevel === 'critical';
}

export function canAutoExecute(_tool: AgentTool) {
  return false;
}

export function canSimulate(tool: AgentTool, approved: boolean) {
  if (tool.riskLevel === 'high' || tool.riskLevel === 'critical') return false;
  if (!approved && requiresHumanApproval(tool)) return false;
  return tool.prototype;
}

export function authorizeTool(input: {
  agentType: AgentType;
  toolId: AgentToolId;
  approved?: boolean;
  anonymous?: boolean;
}): PolicyDecision {
  const tool = getAgentTool(input.toolId);

  if (tool.riskLevel === 'high' || tool.riskLevel === 'critical' || HIGH_RISK_TOOLS.includes(input.toolId)) {
    return { allowed: false, requiresApproval: false, reason: 'policy_high_risk_blocked' };
  }

  if (input.anonymous && tool.layer === 'profile') {
    return { allowed: false, requiresApproval: false, reason: 'policy_employee_identity_blocked' };
  }

  if (!AGENT_ALLOWED_TOOLS[input.agentType].includes(input.toolId) || !LOW_AND_MEDIUM.includes(input.toolId)) {
    return { allowed: false, requiresApproval: false, reason: 'policy_tool_not_allowlisted' };
  }

  if (tool.riskLevel === 'medium' || tool.requiresApproval) {
    return { allowed: true, requiresApproval: true, reason: 'policy_medium_requires_approval' };
  }

  return { allowed: true, requiresApproval: false, reason: 'policy_low_allowlisted' };
}

const HIGH_BLOB =
  /move money|wire transfer|payroll|terminate account|delete account|enterprise permission|large purchase|production system|change production|grant admin/i;

export function gateStructuredOutput(raw: StructuredAgentOutput): StructuredAgentOutput {
  const evidence = raw.evidence.filter((item) => typeof item === 'string' && item.trim()).slice(0, 8);
  const blob = `${raw.summary} ${raw.recommendation} ${raw.proposedAction?.type ?? ''} ${raw.proposedAction?.description ?? ''} ${evidence.join(' ')}`;
  let riskLevel = raw.riskLevel;
  if (!['low', 'medium', 'high', 'critical'].includes(riskLevel)) {
    riskLevel = 'medium';
  }
  if (HIGH_BLOB.test(blob) && (riskLevel === 'low' || riskLevel === 'medium')) {
    riskLevel = 'high';
  }

  const requiresApproval = riskLevel === 'medium' || riskLevel === 'high' || riskLevel === 'critical' ? true : Boolean(raw.requiresApproval);

  return {
    summary: raw.summary.trim() || 'No summary returned.',
    recommendation: raw.recommendation.trim() || 'No recommendation returned.',
    riskLevel,
    requiresApproval,
    evidence,
    proposedAction: raw.proposedAction
      ? { type: raw.proposedAction.type.trim(), description: raw.proposedAction.description.trim() }
      : undefined,
  };
}
