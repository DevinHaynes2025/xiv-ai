import { FleetAgent } from './hybrid-agent-fleet';

export type MissionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_REVIEW';
export type MissionDomain = 'FULL_STACK' | 'MOBILE' | 'UX' | 'DEVOPS' | 'AI_LLM' | 'DATA' | 'SECURITY' | 'SUPPLY_CHAIN' | 'FINANCE' | 'RESEARCH';

export interface MissionRequest {
  missionId: string;
  tenantId: string;
  objective: string;
  domain: MissionDomain;
  priority: MissionPriority;
  requiresOnline?: boolean;
  confidentiality: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
}

export interface MissionAssignment {
  missionId: string;
  selectedAgentIds: string[];
  maxConcurrent: number;
  requiresHumanApproval: boolean;
  reason: string;
}

export const DISPATCH_GUARDRAILS = {
  minimumLogicalFleet: 100,
  maximumConcurrentWorkers: 8,
  minimumReviewers: 1,
  topSecretOnlineAllowed: false,
  productionMutationAllowed: false,
};

const DOMAIN_HINTS: Record<MissionDomain, string[]> = {
  FULL_STACK: ['Backend', 'Frontend', 'API', 'Database', 'Design', 'QA'],
  MOBILE: ['Mobile', 'Android', 'iOS', 'Device', 'ARM'],
  UX: ['Design', 'UXResearch', 'Accessibility', 'Localization', 'Mobile'],
  DEVOPS: ['DevOps', 'Release', 'SRE', 'Observability', 'Cloud'],
  AI_LLM: ['LLM', 'RAG', 'Evaluation', 'ML', 'Plugins'],
  DATA: ['Data', 'Database', 'Analytics', 'Graph', 'Search', 'Memory'],
  SECURITY: ['Security', 'CISO', 'IAM', 'Encryption', 'Privacy', 'Compliance'],
  SUPPLY_CHAIN: ['SupplyChain', 'Logistics', 'Warehouse', 'Inventory', 'Transportation'],
  FINANCE: ['CFO', 'FinanceOps', 'Pricing', 'Accounting', 'Revenue'],
  RESEARCH: ['Research', 'Historian', 'Simulation', 'Innovation', 'QuantumSim'],
};

export function dispatchMission(mission: MissionRequest, agents: FleetAgent[]): MissionAssignment {
  if (agents.length < DISPATCH_GUARDRAILS.minimumLogicalFleet) throw new Error('logical fleet below lean 100-agent target');
  if (mission.confidentiality === 'TOP_SECRET' && mission.requiresOnline) throw new Error('TOP_SECRET missions cannot be routed online');

  const hints = new Set(DOMAIN_HINTS[mission.domain]);
  const scored = agents
    .map(agent => ({ agent, score: hints.has(agent.domain) ? 10 : 0 }))
    .sort((a, b) => b.score - a.score || a.agent.id.localeCompare(b.agent.id));

  const selected = scored.filter(x => x.score > 0).slice(0, 7).map(x => x.agent.id);
  const fallback = selected.length >= 2 ? selected : agents.slice(0, 3).map(a => a.id);

  return {
    missionId: mission.missionId,
    selectedAgentIds: fallback.slice(0, DISPATCH_GUARDRAILS.maximumConcurrentWorkers),
    maxConcurrent: Math.min(DISPATCH_GUARDRAILS.maximumConcurrentWorkers, fallback.length),
    requiresHumanApproval: mission.priority === 'CRITICAL_REVIEW' || mission.confidentiality === 'TOP_SECRET',
    reason: `Selected a bounded specialist pool for ${mission.domain}; unused agents remain logical/standby to keep XIV lean.`,
  };
}
