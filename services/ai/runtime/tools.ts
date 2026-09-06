import { AuthorityLevel, type AuthorityLevel as Authority } from './authority';
import type { XivAgentId } from './agents';

export type RuntimeToolId =
  | 'business_context_reader'
  | 'business_health_analyzer'
  | 'operations_signal_reader'
  | 'risk_summarizer'
  | 'recommendation_generator'
  | 'diagnostic_summarizer'
  | 'diagnostic_story_builder'
  | 'business_health_report'
  | 'company_data_reader'
  | 'executive_brief_builder'
  | 'health_status_reader'
  | 'development_health_checker'
  | 'propose_operational_change'
  | 'human_only_production_change';

export type ToolRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type RuntimeToolDefinition = {
  id: RuntimeToolId;
  name: string;
  description: string;
  riskLevel: ToolRiskLevel;
  readOnly: boolean;
  reversible: boolean;
  requiresApproval: boolean;
  humanOnly: boolean;
  requiredAuthority: Authority;
  allowedAgentIds: readonly XivAgentId[];
};

const DOMAIN_READERS: readonly XivAgentId[] = [
  'executive',
  'supply_chain',
  'operations',
  'finance',
  'security',
  'customer_experience',
  'technology',
  'innovation',
];

export const READ_ONLY_CONTEXT_TOOLS: readonly RuntimeToolId[] = [
  'business_context_reader',
  'business_health_analyzer',
  'operations_signal_reader',
  'risk_summarizer',
  'recommendation_generator',
  'diagnostic_summarizer',
  'diagnostic_story_builder',
  'business_health_report',
  'company_data_reader',
  'executive_brief_builder',
  'health_status_reader',
];

export const XIV_TOOL_REGISTRY: readonly RuntimeToolDefinition[] = [
  {
    id: 'business_context_reader',
    name: 'Business context reader',
    description: 'Reads the replaceable business-context provider. No live system is queried.',
    riskLevel: 'low',
    readOnly: true,
    reversible: true,
    requiresApproval: false,
    humanOnly: false,
    requiredAuthority: AuthorityLevel.L0_Observe,
    allowedAgentIds: DOMAIN_READERS,
  },
  {
    id: 'business_health_analyzer',
    name: 'Business health analyzer',
    description: 'Summarizes prototype business-health score, risks, and opportunities.',
    riskLevel: 'low',
    readOnly: true,
    reversible: true,
    requiresApproval: false,
    humanOnly: false,
    requiredAuthority: AuthorityLevel.L0_Observe,
    allowedAgentIds: DOMAIN_READERS,
  },
  {
    id: 'operations_signal_reader',
    name: 'Operations signal reader',
    description: 'Reads inventory, supplier, warehouse, fulfillment, and CX sample signals.',
    riskLevel: 'low',
    readOnly: true,
    reversible: true,
    requiresApproval: false,
    humanOnly: false,
    requiredAuthority: AuthorityLevel.L0_Observe,
    allowedAgentIds: DOMAIN_READERS,
  },
  {
    id: 'risk_summarizer',
    name: 'Risk summarizer',
    description: 'Restates labeled sample risks. Does not assert live causal certainty.',
    riskLevel: 'low',
    readOnly: true,
    reversible: true,
    requiresApproval: false,
    humanOnly: false,
    requiredAuthority: AuthorityLevel.L1_Recommend,
    allowedAgentIds: DOMAIN_READERS,
  },
  {
    id: 'recommendation_generator',
    name: 'Recommendation generator',
    description: 'Produces a prototype recommendation. Nothing is executed.',
    riskLevel: 'low',
    readOnly: true,
    reversible: true,
    requiresApproval: false,
    humanOnly: false,
    requiredAuthority: AuthorityLevel.L1_Recommend,
    allowedAgentIds: DOMAIN_READERS,
  },
  {
    id: 'diagnostic_summarizer',
    name: 'Diagnostic summarizer',
    description: 'Short Sense → Understand summary from the context provider.',
    riskLevel: 'low',
    readOnly: true,
    reversible: true,
    requiresApproval: false,
    humanOnly: false,
    requiredAuthority: AuthorityLevel.L0_Observe,
    allowedAgentIds: [...DOMAIN_READERS, 'guardian'],
  },
  {
    id: 'diagnostic_story_builder',
    name: 'Diagnostic story builder',
    description: 'Builds a labeled what/why/impact story with a sample causal chain.',
    riskLevel: 'low',
    readOnly: true,
    reversible: true,
    requiresApproval: false,
    humanOnly: false,
    requiredAuthority: AuthorityLevel.L0_Observe,
    allowedAgentIds: DOMAIN_READERS,
  },
  {
    id: 'business_health_report',
    name: 'Business health report',
    description: 'Returns the typed multi-domain health report from the context provider.',
    riskLevel: 'low',
    readOnly: true,
    reversible: true,
    requiresApproval: false,
    humanOnly: false,
    requiredAuthority: AuthorityLevel.L0_Observe,
    allowedAgentIds: DOMAIN_READERS,
  },
  {
    id: 'company_data_reader',
    name: 'Company data reader',
    description: 'Reads authorized company data through the Company Data Gateway only. Read-only.',
    riskLevel: 'low',
    readOnly: true,
    reversible: true,
    requiresApproval: false,
    humanOnly: false,
    requiredAuthority: AuthorityLevel.L0_Observe,
    allowedAgentIds: DOMAIN_READERS,
  },
  {
    id: 'executive_brief_builder',
    name: 'Executive brief builder',
    description: 'Builds an Executive Intelligence Brief from authorized context. No production action.',
    riskLevel: 'low',
    readOnly: true,
    reversible: true,
    requiresApproval: false,
    humanOnly: false,
    requiredAuthority: AuthorityLevel.L1_Recommend,
    allowedAgentIds: ['executive'],
  },
  {
    id: 'health_status_reader',
    name: 'Health / status reader',
    description: 'Reads registered health signals. Does not monitor continuously.',
    riskLevel: 'low',
    readOnly: true,
    reversible: true,
    requiresApproval: false,
    humanOnly: false,
    requiredAuthority: AuthorityLevel.L0_Observe,
    allowedAgentIds: [...DOMAIN_READERS, 'guardian'],
  },
  {
    id: 'development_health_checker',
    name: 'Development health checker',
    description: 'Runs allowlisted Guardian checks only. Never accepts arbitrary shell input.',
    riskLevel: 'low',
    readOnly: true,
    reversible: true,
    requiresApproval: false,
    humanOnly: false,
    requiredAuthority: AuthorityLevel.L0_Observe,
    allowedAgentIds: ['guardian'],
  },
  {
    id: 'propose_operational_change',
    name: 'Propose operational change',
    description: 'Drafts a consequential operational change. Execution is never automatic.',
    riskLevel: 'high',
    readOnly: false,
    reversible: false,
    requiresApproval: true,
    humanOnly: false,
    requiredAuthority: AuthorityLevel.L3_HumanApproval,
    allowedAgentIds: ['executive', 'operations'],
  },
  {
    id: 'human_only_production_change',
    name: 'Human-only production change',
    description: 'Critical production mutation. Agents cannot invoke this tool.',
    riskLevel: 'critical',
    readOnly: false,
    reversible: false,
    requiresApproval: true,
    humanOnly: true,
    requiredAuthority: AuthorityLevel.L5_HumanOnly,
    allowedAgentIds: [],
  },
] as const;

const BY_ID = new Map(XIV_TOOL_REGISTRY.map((tool) => [tool.id, tool]));

export function getRuntimeTool(id: string): RuntimeToolDefinition | undefined {
  return BY_ID.get(id as RuntimeToolId);
}

export function listRuntimeTools(): readonly RuntimeToolDefinition[] {
  return XIV_TOOL_REGISTRY;
}

export function isRuntimeToolId(id: string): id is RuntimeToolId {
  return BY_ID.has(id as RuntimeToolId);
}
