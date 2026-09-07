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
  | 'guardian'
  | 'risk'
  | 'compliance'
  | 'data_quality'
  | 'communications'
  | 'moderation'
  | 'market'
  | 'international'
  | 'strategy'
  | 'business_case'
  | 'research'
  | 'live_intelligence'
  | 'localization';

export type XivAgentDomain =
  | 'executive'
  | 'supply_chain'
  | 'operations'
  | 'finance'
  | 'security'
  | 'customer'
  | 'technology'
  | 'innovation'
  | 'reliability'
  | 'risk'
  | 'compliance'
  | 'quality'
  | 'communications'
  | 'trust'
  | 'market'
  | 'international'
  | 'strategy'
  | 'cases'
  | 'research'
  | 'live'
  | 'localization';

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
    description: 'Reads authorized multi-domain Business Health and prepares an Executive Intelligence Brief. Does not invent financial impact or change production systems.',
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
      'media_intelligence_reader',
      'propose_operational_change',
    ],
    requiresApprovalFor: ['production_change', 'financial_transfer', 'permission_change', 'external_send'],
    status: 'prototype',
  },
  {
    id: 'supply_chain',
    name: 'Supply Chain Agent',
    description: 'Reads authorized supply-chain data when a live source exists, then explains signals and recommends. Must not reallocate suppliers or place orders.',
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
      'media_intelligence_reader',
    ],
    requiresApprovalFor: ['production_change', 'external_send'],
    status: 'registered',
  },
  {
    id: 'operations',
    name: 'Operations Agent',
    description: 'Reads authorized operations data when available, produces a labeled causal narrative, and recommends. Must not change production systems.',
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
      'media_intelligence_reader',
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
    description: 'Reads security and Business Health signals according to policy. Must not rotate secrets or weaken isolation.',
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
      'media_intelligence_reader',
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
    description: 'Reads approved system and technology context only. Must not change production software or infrastructure.',
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
      'media_intelligence_reader',
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
    id: 'risk',
    name: 'Risk Agent',
    description: 'Synthesizes operational and strategic risk from authorized evidence. Does not invent financial impact or change production systems.',
    domain: 'risk',
    capabilities: ['observe_context', 'recommend', 'diagnose', 'summarize'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: [
      'risk_summarizer',
      'recommendation_generator',
      'diagnostic_summarizer',
      'business_health_report',
      'company_data_reader',
    ],
    requiresApprovalFor: ['production_change', 'external_send'],
    status: 'prototype',
  },
  {
    id: 'compliance',
    name: 'Compliance Agent',
    description: 'Maps authorized evidence to controls. Makes no legal claims unless a sourced record exists.',
    domain: 'compliance',
    capabilities: ['observe_context', 'recommend', 'summarize'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: ['diagnostic_summarizer', 'recommendation_generator', 'company_data_reader'],
    requiresApprovalFor: ['production_change', 'external_send'],
    status: 'prototype',
  },
  {
    id: 'data_quality',
    name: 'Data Quality Agent',
    description: 'Scores freshness, completeness, and provenance of authorized records. Does not convert sparse identity data into operational insight.',
    domain: 'quality',
    capabilities: ['observe_context', 'diagnose', 'summarize'],
    defaultAuthority: AuthorityLevel.L0_Observe,
    allowedTools: ['company_data_reader', 'health_status_reader', 'diagnostic_summarizer'],
    requiresApprovalFor: ['production_change'],
    status: 'prototype',
  },
  {
    id: 'communications',
    name: 'Communications Agent',
    description: 'Drafts business updates and livestream summaries from authorized inputs. Does not publish or send outbound messages.',
    domain: 'communications',
    capabilities: ['observe_context', 'recommend', 'draft', 'summarize'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: ['recommendation_generator', 'diagnostic_summarizer'],
    requiresApprovalFor: ['external_send', 'production_change'],
    status: 'prototype',
  },
  {
    id: 'moderation',
    name: 'Moderation / Trust Agent',
    description: 'Recommends business-livestream content-policy actions. Cannot silently terminate streams or auto-ban hosts.',
    domain: 'trust',
    capabilities: ['observe_context', 'recommend', 'summarize'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: ['recommendation_generator', 'diagnostic_summarizer'],
    requiresApprovalFor: ['permission_change', 'production_change'],
    status: 'prototype',
  },
  {
    id: 'market',
    name: 'Market Intelligence Agent',
    description: 'Reads authorized public market context. Does not invent prices, filings, or competitor facts.',
    domain: 'market',
    capabilities: ['observe_context', 'recommend', 'summarize'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: ['diagnostic_summarizer', 'recommendation_generator'],
    requiresApprovalFor: ['external_send', 'production_change'],
    status: 'prototype',
  },
  {
    id: 'international',
    name: 'International Business Agent',
    description: 'Supports cross-border expansion research. Distinguishes analysis from legal/tax certainty. Does not give unsupported regulatory conclusions.',
    domain: 'international',
    capabilities: ['observe_context', 'recommend', 'summarize'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: ['diagnostic_summarizer', 'recommendation_generator'],
    requiresApprovalFor: ['external_send', 'production_change'],
    status: 'prototype',
  },
  {
    id: 'strategy',
    name: 'Strategy Agent',
    description: 'Frames strategic options from authorized evidence. Does not execute strategy or invent financial outcomes.',
    domain: 'strategy',
    capabilities: ['observe_context', 'recommend', 'draft', 'summarize'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: ['diagnostic_summarizer', 'recommendation_generator'],
    requiresApprovalFor: ['production_change'],
    status: 'prototype',
  },
  {
    id: 'business_case',
    name: 'Business Case Agent',
    description: 'Structures business cases and lessons. Hypothetical cases stay labeled hypothetical.',
    domain: 'cases',
    capabilities: ['observe_context', 'recommend', 'draft', 'summarize'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: ['diagnostic_summarizer', 'recommendation_generator', 'diagnostic_story_builder'],
    requiresApprovalFor: ['production_change'],
    status: 'prototype',
  },
  {
    id: 'research',
    name: 'Research Agent',
    description: 'Assembles sourced research packs. Does not scrape arbitrary web sources or invent citations.',
    domain: 'research',
    capabilities: ['observe_context', 'summarize'],
    defaultAuthority: AuthorityLevel.L0_Observe,
    allowedTools: ['diagnostic_summarizer'],
    requiresApprovalFor: ['external_send', 'production_change'],
    status: 'prototype',
  },
  {
    id: 'live_intelligence',
    name: 'Live Intelligence Agent',
    description: 'May later summarize authorized business streams. Cannot automatically publish private content.',
    domain: 'live',
    capabilities: ['observe_context', 'summarize'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: ['diagnostic_summarizer', 'recommendation_generator'],
    requiresApprovalFor: ['external_send', 'production_change'],
    status: 'prototype',
  },
  {
    id: 'localization',
    name: 'Localization Agent',
    description: 'Prepares translation requests through provider-neutral interfaces. Machine translation is never certified legal translation.',
    domain: 'localization',
    capabilities: ['observe_context', 'draft', 'summarize'],
    defaultAuthority: AuthorityLevel.L1_Recommend,
    allowedTools: ['diagnostic_summarizer', 'recommendation_generator'],
    requiresApprovalFor: ['external_send'],
    status: 'prototype',
  },
  {
    id: 'guardian',
    name: 'Guardian Agent',
    description: 'Developer and runtime validation only. Must not read confidential company datasets.',
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
