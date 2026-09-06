import { AuthorityLevel, type AuthorityLevel as Authority } from './authority';

export type XivAgentId =
  | 'executive'
  | 'supply_chain'
  | 'operations'
  | 'finance'
  | 'security'
  | 'customer_experience'
  | 'technology'
  | 'innovation'
  | 'guardian';

export type XivAgentDomain =
  | 'executive'
  | 'supply_chain'
  | 'operations'
  | 'finance'
  | 'security'
  | 'customer'
  | 'technology'
  | 'innovation'
  | 'reliability';

export type XivAgentStatus = 'registered' | 'prototype' | 'available' | 'future';

export type XivAgentCapability =
  | 'observe_context'
  | 'recommend'
  | 'draft'
  | 'diagnose'
  | 'summarize'
  | 'monitor_health';

export type ApprovalClass =
  | 'production_change'
  | 'financial_transfer'
  | 'permission_change'
  | 'external_send'
  | 'secret_rotation';

export type XivAgentDefinition = {
  id: XivAgentId;
  name: string;
  description: string;
  domain: XivAgentDomain;
  capabilities: readonly XivAgentCapability[];
  defaultAuthority: Authority;
  allowedTools: readonly string[];
  requiresApprovalFor: readonly ApprovalClass[];
  status: XivAgentStatus;
};

export const XIV_AGENT_REGISTRY: readonly XivAgentDefinition[] = [
  {
    id: 'executive',
    name: 'Executive Agent',
    description: 'Prepares governed briefs and recommended actions for the chair. Does not change production systems.',
    domain: 'executive',
    capabilities: ['observe_context', 'recommend', 'draft', 'summarize'],
    defaultAuthority: AuthorityLevel.L3_HumanApproval,
    allowedTools: [
      'business_context_reader',
      'business_health_analyzer',
      'operations_signal_reader',
      'risk_summarizer',
      'health_status_reader',
      'recommendation_generator',
      'diagnostic_summarizer',
      'diagnostic_story_builder',
      'business_health_report',
      'company_data_reader',
      'executive_brief_builder',
      'propose_operational_change',
    ],
    requiresApprovalFor: ['production_change', 'financial_transfer', 'permission_change', 'external_send'],
    status: 'prototype',
  },
  {
    id: 'supply_chain',
    name: 'Supply Chain Agent',
    description: 'Reads corridor and exception context. Must not reallocate suppliers or place orders.',
    domain: 'supply_chain',
    capabilities: ['observe_context', 'recommend', 'diagnose'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: [
      'business_context_reader',
      'business_health_analyzer',
      'operations_signal_reader',
      'risk_summarizer',
      'health_status_reader',
      'recommendation_generator',
      'diagnostic_summarizer',
      'diagnostic_story_builder',
      'business_health_report',
      'company_data_reader',
    ],
    requiresApprovalFor: ['production_change', 'external_send'],
    status: 'registered',
  },
  {
    id: 'operations',
    name: 'Operations Agent',
    description: 'Diagnoses throughput and exceptions. Must not change production systems.',
    domain: 'operations',
    capabilities: ['observe_context', 'recommend', 'diagnose', 'summarize'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: [
      'business_context_reader',
      'business_health_analyzer',
      'operations_signal_reader',
      'risk_summarizer',
      'health_status_reader',
      'recommendation_generator',
      'diagnostic_summarizer',
      'diagnostic_story_builder',
      'business_health_report',
      'company_data_reader',
      'propose_operational_change',
    ],
    requiresApprovalFor: ['production_change'],
    status: 'prototype',
  },
  {
    id: 'finance',
    name: 'Finance Agent',
    description: 'Summarizes synthetic financial context. Must not move money or post journal entries.',
    domain: 'finance',
    capabilities: ['observe_context', 'recommend', 'summarize'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: [
      'business_context_reader',
      'business_health_analyzer',
      'operations_signal_reader',
      'risk_summarizer',
      'health_status_reader',
      'recommendation_generator',
      'diagnostic_summarizer',
      'diagnostic_story_builder',
      'business_health_report',
      'company_data_reader',
    ],
    requiresApprovalFor: ['financial_transfer', 'production_change'],
    status: 'registered',
  },
  {
    id: 'security',
    name: 'Security Agent',
    description: 'Flags access and vendor-risk themes. Must not rotate secrets or weaken isolation.',
    domain: 'security',
    capabilities: ['observe_context', 'recommend', 'diagnose'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: [
      'business_context_reader',
      'business_health_analyzer',
      'operations_signal_reader',
      'risk_summarizer',
      'health_status_reader',
      'recommendation_generator',
      'diagnostic_summarizer',
      'diagnostic_story_builder',
      'business_health_report',
      'company_data_reader',
    ],
    requiresApprovalFor: ['permission_change', 'secret_rotation', 'production_change'],
    status: 'registered',
  },
  {
    id: 'customer_experience',
    name: 'Customer Experience Agent',
    description: 'Reads relationship and service context. Must not write customer records or send outbound messages.',
    domain: 'customer',
    capabilities: ['observe_context', 'recommend', 'summarize'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: [
      'business_context_reader',
      'business_health_analyzer',
      'operations_signal_reader',
      'risk_summarizer',
      'health_status_reader',
      'recommendation_generator',
      'diagnostic_summarizer',
      'diagnostic_story_builder',
      'business_health_report',
      'company_data_reader',
    ],
    requiresApprovalFor: ['external_send', 'production_change'],
    status: 'registered',
  },
  {
    id: 'technology',
    name: 'Technology Agent',
    description: 'Reads system-health context. Must not change production software or infrastructure.',
    domain: 'technology',
    capabilities: ['observe_context', 'recommend', 'diagnose'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: [
      'business_context_reader',
      'business_health_analyzer',
      'operations_signal_reader',
      'risk_summarizer',
      'health_status_reader',
      'recommendation_generator',
      'diagnostic_summarizer',
      'diagnostic_story_builder',
      'business_health_report',
      'company_data_reader',
    ],
    requiresApprovalFor: ['production_change', 'permission_change'],
    status: 'registered',
  },
  {
    id: 'innovation',
    name: 'Innovation Agent',
    description: 'Collects ideas and sketches. Must not modify production software.',
    domain: 'innovation',
    capabilities: ['observe_context', 'recommend', 'draft'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: ['business_context_reader', 'recommendation_generator', 'diagnostic_summarizer'],
    requiresApprovalFor: ['production_change'],
    status: 'future',
  },
  {
    id: 'guardian',
    name: 'Guardian Agent',
    description: 'Observes development and reliability signals. Diagnosis only — no unrestricted auto-fix.',
    domain: 'reliability',
    capabilities: ['observe_context', 'diagnose', 'monitor_health'],
    defaultAuthority: AuthorityLevel.L0_Observe,
    allowedTools: ['health_status_reader', 'diagnostic_summarizer', 'development_health_checker'],
    requiresApprovalFor: ['production_change', 'permission_change', 'secret_rotation'],
    status: 'prototype',
  },
] as const;

const BY_ID = new Map(XIV_AGENT_REGISTRY.map((agent) => [agent.id, agent]));

export function getXivAgent(id: string): XivAgentDefinition | undefined {
  return BY_ID.get(id as XivAgentId);
}

export function listXivAgents(): readonly XivAgentDefinition[] {
  return XIV_AGENT_REGISTRY;
}

export function isXivAgentId(id: string): id is XivAgentId {
  return BY_ID.has(id as XivAgentId);
}
