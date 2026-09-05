import type { SpecializedAgent, SpecializedAgentId } from '@/types/agents';
import type { RoleId } from '@/types/session';

export type CatalogAgentId =
  | 'executive'
  | 'business'
  | 'market'
  | 'operations'
  | 'opportunity'
  | 'research'
  | 'community'
  | 'wellness'
  | SpecializedAgentId;

export type CatalogAgent = {
  id: CatalogAgentId;
  name: string;
  summary: string;
  liveFor: RoleId[];
};

export const xivAgentCatalog: CatalogAgent[] = [
  {
    id: 'executive',
    name: 'Executive',
    summary: 'Chair-facing intelligence with governed recommendations and approval.',
    liveFor: ['executive'],
  },
  {
    id: 'business',
    name: 'Business',
    summary: 'Reviews business health and recommends the next governed action.',
    liveFor: ['business_owner'],
  },
  {
    id: 'market',
    name: 'Market Intelligence',
    summary: 'Market, competitor, and demand signals for the network.',
    liveFor: [],
  },
  {
    id: 'operations',
    name: 'Operations',
    summary: 'Throughput, exceptions, and capacity across connected systems.',
    liveFor: [],
  },
  {
    id: 'opportunity',
    name: 'Opportunity',
    summary: 'Surfaces network opportunities matched to your interests.',
    liveFor: [],
  },
  {
    id: 'research',
    name: 'Research',
    summary: 'Deep briefings and evidence packs for decisions in motion.',
    liveFor: [],
  },
  {
    id: 'community',
    name: 'Community',
    summary: 'Network rooms, introductions, and community intelligence.',
    liveFor: [],
  },
  {
    id: 'wellness',
    name: 'Wellness',
    summary: 'Private check-ins that stay off the company floor.',
    liveFor: [],
  },
];

export const specializedAgents: SpecializedAgent[] = [
  {
    id: 'executive',
    name: 'Executive Agent',
    role: 'Chair intelligence',
    mission: 'Prepare governed briefs and recommended actions for the chair. No production system is changed without approval.',
    allowedTools: ['summarize_company_health', 'draft_chair_brief', 'read_organization_universe'],
    riskLevel: 'high',
    status: 'active',
    approvalRequired: true,
    liveFor: ['executive'],
    backend: 'gemini_executive',
    mapsTo: 'executive_agent',
  },
  {
    id: 'business',
    name: 'Business Agent',
    role: 'Operating intelligence',
    mission: 'Review business health and propose the next governed action. High-risk tools stay approval-bound.',
    allowedTools: ['summarize_business_health', 'draft_briefing_note', 'list_connected_systems'],
    riskLevel: 'medium',
    status: 'active',
    approvalRequired: true,
    liveFor: ['business_owner'],
    backend: 'gemini_executive',
    mapsTo: 'business_agent',
  },
  {
    id: 'trading_research',
    name: 'Trading Research Agent',
    role: 'Markets research',
    mission: 'Read public desk notes and education. Must not execute trades or issue guaranteed signals.',
    allowedTools: ['search_knowledge', 'explain_trends', 'draft_report'],
    riskLevel: 'high',
    status: 'coming_soon',
    approvalRequired: true,
    liveFor: [],
    backend: 'none',
  },
  {
    id: 'real_estate',
    name: 'Real Estate Agent',
    role: 'Property operations',
    mission: 'Organize listings, leads, and neighborhood context. Must not claim appraisal authority.',
    allowedTools: ['search_knowledge', 'draft_report', 'draft_campaign'],
    riskLevel: 'medium',
    status: 'coming_soon',
    approvalRequired: true,
    liveFor: [],
    backend: 'none',
  },
  {
    id: 'insurance',
    name: 'Insurance Agent',
    role: 'Coverage operations',
    mission: 'Support clients, renewals, and education. Must not bind coverage or underwrite.',
    allowedTools: ['search_knowledge', 'draft_report', 'draft_campaign'],
    riskLevel: 'high',
    status: 'coming_soon',
    approvalRequired: true,
    liveFor: [],
    backend: 'none',
  },
  {
    id: 'supply_chain',
    name: 'Supply Chain Agent',
    role: 'Corridor operations',
    mission: 'Surface exceptions and capacity. Must not reallocate suppliers without approval.',
    allowedTools: ['explain_trends', 'simulate_supplier_reallocation', 'draft_report'],
    riskLevel: 'high',
    status: 'coming_soon',
    approvalRequired: true,
    liveFor: [],
    backend: 'none',
  },
  {
    id: 'marketing',
    name: 'Marketing Agent',
    role: 'Demand quality',
    mission: 'Draft campaigns and floor copy. Must not publish without approval.',
    allowedTools: ['draft_campaign', 'draft_community_intro', 'search_knowledge'],
    riskLevel: 'medium',
    status: 'coming_soon',
    approvalRequired: true,
    liveFor: [],
    backend: 'none',
  },
  {
    id: 'operations',
    name: 'Operations Agent',
    role: 'Throughput and exceptions',
    mission: 'Name the exception and the next governed step. Must not change production systems.',
    allowedTools: ['list_connected_systems', 'create_project_task', 'draft_briefing_note'],
    riskLevel: 'high',
    status: 'coming_soon',
    approvalRequired: true,
    liveFor: [],
    backend: 'none',
  },
  {
    id: 'sales',
    name: 'Sales Agent',
    role: 'Revenue motion',
    mission: 'Surface stalled deals and draft follow-ups. Must not auto-send or invent a live CRM write.',
    allowedTools: ['draft_report', 'draft_campaign', 'search_knowledge'],
    riskLevel: 'medium',
    status: 'coming_soon',
    approvalRequired: true,
    liveFor: [],
    backend: 'none',
  },
  {
    id: 'crm',
    name: 'CRM Agent',
    role: 'Account memory',
    mission: 'Organize accounts and activity. Must not claim a live CRM connection.',
    allowedTools: ['search_knowledge', 'draft_report', 'draft_briefing_note'],
    riskLevel: 'medium',
    status: 'coming_soon',
    approvalRequired: true,
    liveFor: [],
    backend: 'none',
  },
  {
    id: 'warehouse',
    name: 'Warehouse Agent',
    role: 'Fulfillment tower',
    mission: 'Name congestion and recovery. Must not confirm picks, receives, or shipments.',
    allowedTools: ['explain_trends', 'draft_report', 'list_connected_systems'],
    riskLevel: 'high',
    status: 'coming_soon',
    approvalRequired: true,
    liveFor: [],
    backend: 'none',
  },
  {
    id: 'procurement',
    name: 'Procurement Agent',
    role: 'Supplier desk',
    mission: 'Flag late POs. Must not reallocate suppliers without approval.',
    allowedTools: ['explain_trends', 'simulate_supplier_reallocation', 'draft_report'],
    riskLevel: 'high',
    status: 'coming_soon',
    approvalRequired: true,
    liveFor: [],
    backend: 'none',
  },
  {
    id: 'logistics',
    name: 'Logistics Agent',
    role: 'Transportation',
    mission: 'Read lane exceptions. Must not book freight or change carriers.',
    allowedTools: ['explain_trends', 'draft_report', 'list_connected_systems'],
    riskLevel: 'high',
    status: 'coming_soon',
    approvalRequired: true,
    liveFor: [],
    backend: 'none',
  },
  {
    id: 'customer',
    name: 'Customer Agent',
    role: 'Account health',
    mission: 'Connect relationship and operations conceptually. Must not write customer records.',
    allowedTools: ['draft_report', 'draft_briefing_note', 'search_knowledge'],
    riskLevel: 'medium',
    status: 'coming_soon',
    approvalRequired: true,
    liveFor: [],
    backend: 'none',
  },
  {
    id: 'finance',
    name: 'Finance Agent',
    role: 'Chair numbers',
    mission: 'Summarize synthetic snapshots. Must not post journal entries or execute trades.',
    allowedTools: ['summarize_business_health', 'draft_report', 'draft_briefing_note'],
    riskLevel: 'high',
    status: 'coming_soon',
    approvalRequired: true,
    liveFor: [],
    backend: 'none',
  },
  {
    id: 'people',
    name: 'People Agent',
    role: 'Coverage',
    mission: 'Speak to coverage and climate without identifying employees. Must not monitor individuals.',
    allowedTools: ['draft_briefing_note', 'search_knowledge', 'draft_report'],
    riskLevel: 'high',
    status: 'coming_soon',
    approvalRequired: true,
    liveFor: [],
    backend: 'none',
  },
  {
    id: 'security',
    name: 'Security Agent',
    role: 'Control posture',
    mission: 'Flag access and vendor risk. Must not rotate secrets or weaken tenant isolation.',
    allowedTools: ['list_connected_systems', 'draft_report', 'draft_briefing_note'],
    riskLevel: 'high',
    status: 'coming_soon',
    approvalRequired: true,
    liveFor: [],
    backend: 'none',
  },
  {
    id: 'innovation',
    name: 'Innovation Agent',
    role: 'Build notes',
    mission: 'Collect ideas and project sketches. Must not modify production software.',
    allowedTools: ['search_opportunities', 'draft_report', 'create_project_task'],
    riskLevel: 'medium',
    status: 'coming_soon',
    approvalRequired: true,
    liveFor: [],
    backend: 'none',
  },
];

export function isLiveCatalogAgent(agent: CatalogAgent, role: RoleId | null) {
  return Boolean(role && agent.liveFor.includes(role));
}

export function isLiveSpecializedAgent(agent: SpecializedAgent, role: RoleId | null) {
  return agent.status === 'active' && Boolean(role && agent.liveFor.includes(role));
}
