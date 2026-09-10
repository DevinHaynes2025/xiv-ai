import { HybridAgentDefinition } from './hybrid-agent-fleet';

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
  FULL_STACK: ['full stack', 'frontend', 'backend', 'api', 'typescript', 'react', 'database'],
  MOBILE: ['mobile', 'android', 'ios', 'react native', 'device'],
  UX: ['ux', 'ui', 'design', 'accessibility', 'experience'],
  DEVOPS: ['devops', 'ci', 'cd', 'docker', 'observability', 'release'],
  AI_LLM: ['llm', 'rag', 'ollama', 'prompt', 'evaluation', 'agent'],
  DATA: ['data', 'database', 'etl', 'analytics', 'graph', 'vector'],
  SECURITY: ['security', 'ciso', 'iam', 'zero trust', 'secrets', 'audit'],
  SUPPLY_CHAIN: ['supply chain', 'logistics', 'warehouse', 'inventory', 'transport'],
  FINANCE: ['finance', 'cfo', 'pricing', 'revenue', 'cost'],
  RESEARCH: ['research', 'historian', 'simulation', 'scenario', 'innovation'],
};

export function dispatchMission(mission: MissionRequest, agents: HybridAgentDefinition[]): MissionAssignment {
  if (agents.length < DISPATCH_GUARDRAILS.minimumLogicalFleet) throw new Error('logical fleet below lean 100-agent target');
  if (mission.confidentiality === 'TOP_SECRET' && mission.requiresOnline) throw new Error('TOP_SECRET missions cannot be routed online');

  const hints = DOMAIN_HINTS[mission.domain];
  const scored = agents
    .map(agent => ({ agent, score: hints.reduce((s, h) => s + agent.capabilities.join(' ').toLowerCase().includes(h) ? 1 : 0, 0) }))
    .sort((a, b) => b.score - a.score || a.agent.agentId.localeCompare(b.agent.agentId));

  const selected = scored.filter(x => x.score > 0).slice(0, 7).map(x => x.agent.agentId);
  const fallback = selected.length >= 2 ? selected : agents.slice(0, 3).map(a => a.agentId);

  return {
    missionId: mission.missionId,
    selectedAgentIds: fallback.slice(0, DISPATCH_GUARDRAILS.maximumConcurrentWorkers),
    maxConcurrent: Math.min(DISPATCH_GUARDRAILS.maximumConcurrentWorkers, fallback.length),
    requiresHumanApproval: mission.priority === 'CRITICAL_REVIEW' || mission.confidentiality === 'TOP_SECRET',
    reason: `Selected a bounded specialist pool for ${mission.domain}; unused agents remain logical/standby to keep XIV lean.`,
  };
}
