import type { AgentRiskLevel, AgentTool, AgentToolId, ToolLayer } from './types';

const tool = (
  id: AgentToolId,
  name: string,
  description: string,
  layer: ToolLayer,
  riskLevel: AgentRiskLevel,
  requiresApproval: boolean,
): AgentTool => ({
  id,
  name,
  description,
  layer,
  riskLevel,
  requiresApproval,
  prototype: true,
});

export const AGENT_TOOLS: Record<AgentToolId, AgentTool> = {
  read_profile: tool('read_profile', 'Read profile', 'Read the signed-in profile. Employee agent cannot use this.', 'profile', 'low', false),
  read_interests: tool('read_interests', 'Read interests', 'Read saved interests from the account.', 'interests', 'low', false),
  summarize_interests: tool('summarize_interests', 'Summarize interests', 'Draft an on-device summary of saved interests.', 'interests', 'low', false),
  recommend_communities: tool('recommend_communities', 'Recommend communities', 'Point at mock communities that match interests.', 'search_knowledge', 'low', false),
  search_opportunities: tool('search_opportunities', 'Search opportunities', 'Point at mock opportunity cards on device.', 'search_knowledge', 'low', false),
  search_knowledge: tool('search_knowledge', 'Search knowledge', 'Search mock knowledge only. No live index.', 'search_knowledge', 'low', false),
  explain_trends: tool('explain_trends', 'Explain trends', 'Explain synthetic trends already shown in the workspace.', 'business_metrics', 'low', false),
  draft_report: tool('draft_report', 'Create draft report', 'Prepare a draft report on-device. It is not filed.', 'future_actions', 'low', false),
  draft_community_intro: tool('draft_community_intro', 'Draft community intro', 'Prepare a circle introduction. Sending is not implemented.', 'future_actions', 'medium', true),
  read_organization_universe: tool(
    'read_organization_universe',
    'Organization universe',
    'Read the placeholder company universe. Membership is not connected.',
    'organization_universe',
    'low',
    false,
  ),
  summarize_anonymous_themes: tool(
    'summarize_anonymous_themes',
    'Summarize anonymous themes',
    'Cluster mock floor themes without attaching identity.',
    'organization_universe',
    'low',
    false,
  ),
  draft_anonymous_idea: tool('draft_anonymous_idea', 'Draft anonymous idea', 'Prepare an idea card. It is not submitted to HR.', 'future_actions', 'medium', true),
  private_wellness_prompt: tool(
    'private_wellness_prompt',
    'Private wellness prompt',
    'Offer a private check-in prompt. Nothing is shared with an employer.',
    'future_actions',
    'low',
    false,
  ),
  summarize_business_health: tool(
    'summarize_business_health',
    'Summarize business metrics',
    'Restate the synthetic business health score.',
    'business_metrics',
    'low',
    false,
  ),
  summarize_company_health: tool(
    'summarize_company_health',
    'Summarize company health',
    'Restate the synthetic company health composite.',
    'business_metrics',
    'low',
    false,
  ),
  list_connected_systems: tool(
    'list_connected_systems',
    'List connected systems',
    'List placeholder connectors. No credentials are read.',
    'connected_systems',
    'low',
    false,
  ),
  draft_briefing_note: tool('draft_briefing_note', 'Draft briefing note', 'Prepare a briefing sentence from mock notes.', 'future_actions', 'low', false),
  draft_chair_brief: tool('draft_chair_brief', 'Draft chair brief', 'Prepare a chair packet sentence. It is not sent.', 'future_actions', 'low', false),
  draft_campaign: tool('draft_campaign', 'Create a draft campaign', 'Prepare a campaign draft. It is not published.', 'future_actions', 'medium', true),
  prepare_supplier_email: tool('prepare_supplier_email', 'Prepare a supplier email', 'Draft a supplier email. It is not sent.', 'future_actions', 'medium', true),
  create_project_task: tool('create_project_task', 'Create a project task', 'Prepare a task card. No live tracker is written.', 'future_actions', 'medium', true),
  suggest_inventory_changes: tool(
    'suggest_inventory_changes',
    'Suggest inventory changes',
    'Suggest inventory changes. No WMS is mutated.',
    'future_actions',
    'medium',
    true,
  ),
  simulate_supplier_reallocation: tool(
    'simulate_supplier_reallocation',
    'Supplier reallocation simulation',
    'Run a prototype supplier reallocation simulation. No live orders or vendors are touched.',
    'future_actions',
    'medium',
    true,
  ),
  move_money: tool('move_money', 'Move money', 'Blocked. Agents cannot move money.', 'future_actions', 'high', true),
  modify_payroll: tool('modify_payroll', 'Modify payroll', 'Blocked. Agents cannot modify payroll.', 'future_actions', 'high', true),
  terminate_accounts: tool('terminate_accounts', 'Terminate accounts', 'Blocked. Agents cannot terminate accounts.', 'future_actions', 'high', true),
  change_enterprise_permissions: tool(
    'change_enterprise_permissions',
    'Change enterprise permissions',
    'Blocked. Agents cannot change enterprise permissions.',
    'future_actions',
    'high',
    true,
  ),
  execute_large_purchases: tool(
    'execute_large_purchases',
    'Execute large purchases',
    'Blocked. Agents cannot execute large purchases.',
    'future_actions',
    'high',
    true,
  ),
  change_production_systems: tool(
    'change_production_systems',
    'Change production systems',
    'Blocked. Agents cannot change production systems.',
    'future_actions',
    'high',
    true,
  ),
};

export const HIGH_RISK_TOOLS: readonly AgentToolId[] = [
  'move_money',
  'modify_payroll',
  'terminate_accounts',
  'change_enterprise_permissions',
  'execute_large_purchases',
  'change_production_systems',
];

export function getAgentTool(id: AgentToolId): AgentTool {
  return AGENT_TOOLS[id];
}

export function listAgentTools(ids: readonly AgentToolId[]): AgentTool[] {
  return ids.map((id) => AGENT_TOOLS[id]);
}
