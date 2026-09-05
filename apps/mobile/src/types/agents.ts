import type { AgentRiskLevel, AgentToolId, AgentType } from '@/lib/ai';
import type { RoleId } from '@/types/session';

export type SpecializedAgentId =
  | 'executive'
  | 'business'
  | 'trading_research'
  | 'real_estate'
  | 'insurance'
  | 'supply_chain'
  | 'sales'
  | 'crm'
  | 'warehouse'
  | 'procurement'
  | 'logistics'
  | 'customer'
  | 'marketing'
  | 'operations'
  | 'finance'
  | 'people'
  | 'security'
  | 'innovation';

export type SpecializedAgentStatus = 'active' | 'coming_soon';

export type SpecializedAgent = {
  id: SpecializedAgentId;
  name: string;
  role: string;
  mission: string;
  allowedTools: readonly string[];
  riskLevel: AgentRiskLevel;
  status: SpecializedAgentStatus;
  approvalRequired: boolean;
  liveFor: RoleId[];
  backend: 'gemini_executive' | 'none';
  mapsTo?: AgentType;
};

export type AgentSession = {
  id: string;
  agentId: SpecializedAgentId;
  userId: string;
  startedAt: string;
  endedAt: string | null;
};

export type AgentTask = {
  id: string;
  sessionId: string;
  title: string;
  status: 'queued' | 'awaiting_approval' | 'blocked' | 'complete';
};

export type AgentPlan = {
  id: string;
  taskId: string;
  steps: string[];
  requiresApproval: boolean;
};

export type AgentResult = {
  id: string;
  taskId: string;
  summary: string;
  prototype: true;
};

export type AgentMemory = {
  id: string;
  userId: string;
  agentId: SpecializedAgentId;
  key: string;
  value: string;
};

export type AgentAuditEvent = {
  id: string;
  userId: string;
  agentId: SpecializedAgentId;
  eventType: string;
  createdAt: string;
};

export type AgentRoutingCard = SpecializedAgent & {
  toolIds?: readonly AgentToolId[];
};

/** Phase 6 architecture only. No memory backend, self-modify, or deployment. */
export type Phase6Capability = 'memory' | 'builder_agent';
export type Phase6Status = 'coming_soon';
export type BuilderAgentDeployment = 'not_implemented';
export type AgentMemoryBackend = 'not_implemented';
