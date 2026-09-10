export type FleetMode = 'OFFLINE_LOCAL' | 'ONLINE_APPROVED' | 'HYBRID';
export type AgentState = 'STANDBY' | 'READY' | 'RUNNING' | 'WAITING_EVIDENCE' | 'OFFLINE';

export interface FleetAgent {
  id: string;
  name: string;
  domain: string;
  mode: FleetMode;
  state: AgentState;
  maxAuthority: 'L0' | 'L1' | 'L2' | 'L3';
  preferredProvider: 'OLLAMA' | 'LOCAL_RULES' | 'PLUGIN' | 'CLOUD_MODEL';
  evidenceRefs: string[];
}

const domains = [
  'Executive','CTO','CISO','CFO','COO','Product','Revenue','People','LegalRisk','SupplyChain',
  'DevOps','Platform','Backend','Frontend','Mobile','QA','Security','Data','ML','LLM',
  'RAG','Evaluation','Database','Analytics','Forecasting','Optimization','Integrations','Cloud','FinOps','Observability',
  'IncidentResponse','Privacy','Compliance','IAM','Encryption','ThreatModeling','Customer','Community','Innovation','Research',
  'Strategy','Pricing','Accounting','Contracts','Sales','Marketing','Support','Onboarding','UXResearch','Design',
  'Accessibility','Localization','Translation','Documentation','Knowledge','Historian','DataMining','Provenance','Search','Graph',
  'Memory','Simulation','QuantumSim','Hardware','GPU','NPU','Edge','Device','Windows','Linux',
  'MacOS','Android','iOS','ChromeOS','Embedded','Networking','Storage','Backup','Recovery','Release',
  'SRE','Architecture','API','Events','Workflow','Marketplace','Plugins','BuilderNetwork','Learning','Academy',
  'Media','FinanceOps','Operations','Logistics','Warehouse','Procurement','Inventory','Transportation','Retail','Manufacturing'
] as const;

export const FLEET_SIZE = 100;
export const MAX_CONCURRENT_AGENTS = 8;

export function buildLeanAgentFleet(): FleetAgent[] {
  return Array.from({ length: FLEET_SIZE }, (_, index) => {
    const domain = domains[index % domains.length];
    return {
      id: `xiv-agent-${String(index + 1).padStart(3, '0')}`,
      name: `XIV ${domain} ${index + 1}`,
      domain,
      mode: index % 5 === 0 ? 'HYBRID' : 'OFFLINE_LOCAL',
      state: 'STANDBY',
      maxAuthority: index < 10 ? 'L2' : 'L1',
      preferredProvider: index % 5 === 0 ? 'PLUGIN' : 'OLLAMA',
      evidenceRefs: [],
    };
  });
}

export function activateFleetAgents(fleet: FleetAgent[], ids: string[], evidenceRefs: string[]): FleetAgent[] {
  if (ids.length > MAX_CONCURRENT_AGENTS) throw new Error('lean fleet concurrency cap exceeded');
  if (!evidenceRefs.length) throw new Error('evidence required before activation');
  const selected = new Set(ids);
  return fleet.map(agent => selected.has(agent.id)
    ? { ...agent, state: 'READY', evidenceRefs: [...new Set([...agent.evidenceRefs, ...evidenceRefs])] }
    : { ...agent, state: agent.state === 'RUNNING' ? 'STANDBY' : agent.state });
}

export const HYBRID_FLEET_GUARDRAILS = {
  logicalAgentsMayExceedActiveProcesses: true,
  maxConcurrentAgents: MAX_CONCURRENT_AGENTS,
  offlineFirst: true,
  crossTenantAccess: false,
  productionMutationAllowed: false,
  secretsInPromptsAllowed: false,
  activeStatusRequiresEvidence: true,
};
