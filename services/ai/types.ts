export type AgentType = 'consumer_agent' | 'employee_agent' | 'business_agent' | 'executive_agent';

export type AgentRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ToolLayer =
  | 'profile'
  | 'interests'
  | 'organization_universe'
  | 'business_metrics'
  | 'connected_systems'
  | 'search_knowledge'
  | 'future_actions';

export type ModelProviderId = 'mock' | 'gemini' | 'openai' | 'ollama' | 'future';

export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'awaiting_approval'
  | 'simulating'
  | 'blocked';

export type AgentToolId =
  | 'read_profile'
  | 'read_interests'
  | 'summarize_interests'
  | 'recommend_communities'
  | 'search_opportunities'
  | 'search_knowledge'
  | 'explain_trends'
  | 'draft_report'
  | 'draft_community_intro'
  | 'read_organization_universe'
  | 'summarize_anonymous_themes'
  | 'draft_anonymous_idea'
  | 'private_wellness_prompt'
  | 'summarize_business_health'
  | 'summarize_company_health'
  | 'list_connected_systems'
  | 'draft_briefing_note'
  | 'draft_chair_brief'
  | 'draft_campaign'
  | 'prepare_supplier_email'
  | 'create_project_task'
  | 'suggest_inventory_changes'
  | 'simulate_supplier_reallocation'
  | 'move_money'
  | 'modify_payroll'
  | 'terminate_accounts'
  | 'change_enterprise_permissions'
  | 'execute_large_purchases'
  | 'change_production_systems';

export type AgentRole = 'consumer' | 'employee' | 'business_owner' | 'executive' | 'entrepreneur';

export type AgentTool = {
  id: AgentToolId;
  name: string;
  description: string;
  layer: ToolLayer;
  riskLevel: AgentRiskLevel;
  requiresApproval: boolean;
  prototype: true;
};

export type Agent = {
  id: string;
  type: AgentType;
  name: string;
  summary: string;
  allowedTools: readonly AgentToolId[];
  status: AgentStatus;
};

export type AgentMessageRole = 'user' | 'agent' | 'system';

export type AgentMessage = {
  id: string;
  agentType: AgentType;
  role: AgentMessageRole;
  content: string;
  createdAt: string;
  actionId?: string;
};

export type AgentActionStatus = 'proposed' | 'approved' | 'rejected' | 'simulated' | 'blocked';

export type PersistedAgentActionStatus =
  | 'proposed'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type AgentEvidence = {
  id: string;
  label: string;
  detail: string;
  source: string;
};

export type AgentAction = {
  id: string;
  agentType: AgentType;
  toolId: AgentToolId;
  title: string;
  summary: string;
  recommendation?: string;
  riskLevel: AgentRiskLevel;
  status: AgentActionStatus;
  requiresApproval: boolean;
  prototype: true;
  evidence: AgentEvidence[];
  createdAt: string;
  decidedAt?: string;
};

export type AgentApproval = {
  id: string;
  actionId: string;
  agentType: AgentType;
  decision: 'approve' | 'reject';
  decidedAt: string;
  actorUserId: string;
  note: string;
};

export type AgentIntentKind =
  | 'session_open'
  | 'message'
  | 'propose'
  | 'approve'
  | 'reject'
  | 'simulate'
  | 'blocked'
  | 'view_evidence'
  | 'tool_invoke'
  | 'policy_refuse';

export type AgentIntentLog = {
  id: string;
  at: string;
  userId: string;
  agentType: AgentType;
  kind: AgentIntentKind;
  toolId?: AgentToolId;
  actionId?: string;
  riskLevel?: AgentRiskLevel;
  note: string;
};

export type OrganizationContext = {
  kind: 'placeholder_universe' | 'demo_tenant';
  name: string;
  detail: string;
};

export type ApprovedDataContext = {
  alias?: string;
  profileName?: string;
  interests?: string[];
  metricsNote?: string;
  systemsNote?: string;
  universeNote?: string;
};

export type AgentSessionContext = {
  userId: string;
  role: AgentRole;
  agentType: AgentType;
  interests: string[];
  displayName?: string;
  alias?: string;
  anonymous: boolean;
  organizationContext: OrganizationContext;
  approvedDataContext: ApprovedDataContext;
};

export type AgentTurnContext = {
  userMessage: string;
  role: AgentRole;
  organizationContext: OrganizationContext;
  approvedDataContext: ApprovedDataContext;
};

export type AgentTurnResult = {
  reply: string;
  summary?: string;
  recommendation?: string;
  riskLevel?: AgentRiskLevel;
  requiresApproval?: boolean;
  proposedAction?: AgentAction;
  invokeToolId?: AgentToolId;
  blocked?: string;
  provider: ModelProviderId;
};

export type StructuredAgentOutput = {
  summary: string;
  recommendation: string;
  riskLevel: AgentRiskLevel;
  requiresApproval: boolean;
  evidence: string[];
  proposedAction?: {
    type: string;
    description: string;
  };
};

export type PolicyDecision = {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
};

export type AgentSessionRow = {
  id: string;
  user_id: string;
  organization_id: string | null;
  agent_type: AgentType;
  started_at: string;
  ended_at: string | null;
};

export type AgentMessageRow = {
  id: string;
  session_id: string;
  user_id: string;
  role: AgentMessageRole;
  content: string;
  created_at?: string;
};

export type AgentActionRow = {
  id: string;
  session_id: string;
  user_id: string;
  organization_id: string | null;
  agent_type: AgentType;
  tool_id: AgentToolId;
  action_type: string;
  description: string;
  risk_level: AgentRiskLevel;
  status: PersistedAgentActionStatus;
  input_payload: Record<string, unknown>;
  result_payload: Record<string, unknown> | null;
  created_at?: string;
  completed_at: string | null;
};

export type AgentActionApprovalRow = {
  id: string;
  action_id: string;
  user_id: string;
  decision: 'approved' | 'rejected';
  decision_note: string | null;
  created_at?: string;
};

export type AgentMemoryRow = {
  id: string;
  user_id: string;
  agent_type: AgentType;
  memory_key: string;
  memory_value: string;
};

export type AuditEventRow = {
  id: string;
  user_id: string;
  session_id: string | null;
  action_id: string | null;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at?: string;
};
