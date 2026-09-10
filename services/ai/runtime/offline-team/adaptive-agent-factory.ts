export type DemandKind = 'CODE' | 'DATA_MINING' | 'HISTORICAL_RESEARCH' | 'SECURITY_REVIEW' | 'DATABASE' | 'SIMULATION' | 'HARDWARE';
export type AgentSpecialty = 'ARCHITECT' | 'CODER' | 'DATA_MINER' | 'HISTORIAN' | 'SECURITY_REVIEWER' | 'DB_ENGINEER' | 'SIMULATION_AGENT' | 'HARDWARE_ANALYST';

export interface DemandSignal {
  id: string;
  tenantId: string;
  kind: DemandKind;
  urgency: number;
  backlog: number;
}

export interface LogicalAgent {
  id: string;
  tenantId: string;
  specialty: AgentSpecialty;
  reason: string;
  localPreferred: true;
  productionAuthority: false;
}

export const ADAPTIVE_AGENT_GUARDRAILS = {
  maxLogicalAgentsPerTenant: 64,
  maxCreatePerCycle: 8,
  infiniteCloningAllowed: false,
  crossTenantSpawnAllowed: false,
  autonomousProductionAuthority: false,
  localPreferred: true,
} as const;

const SPECIALTY: Record<DemandKind, AgentSpecialty> = {
  CODE: 'CODER',
  DATA_MINING: 'DATA_MINER',
  HISTORICAL_RESEARCH: 'HISTORIAN',
  SECURITY_REVIEW: 'SECURITY_REVIEWER',
  DATABASE: 'DB_ENGINEER',
  SIMULATION: 'SIMULATION_AGENT',
  HARDWARE: 'HARDWARE_ANALYST',
};

export function createAgentsForDemand(input: {
  signals: readonly DemandSignal[];
  existing: readonly LogicalAgent[];
}): readonly LogicalAgent[] {
  const created: LogicalAgent[] = [];
  const counts = new Map<string, number>();
  for (const a of input.existing) counts.set(a.tenantId, (counts.get(a.tenantId) ?? 0) + 1);
  const ordered = [...input.signals].sort((a, b) => (b.urgency + b.backlog) - (a.urgency + a.backlog));
  for (const signal of ordered) {
    if (created.length >= ADAPTIVE_AGENT_GUARDRAILS.maxCreatePerCycle) break;
    const current = counts.get(signal.tenantId) ?? 0;
    if (current >= ADAPTIVE_AGENT_GUARDRAILS.maxLogicalAgentsPerTenant) continue;
    const specialty = SPECIALTY[signal.kind];
    const agent: LogicalAgent = Object.freeze({
      id: `agent:${signal.tenantId}:${signal.kind}:${current + 1}`,
      tenantId: signal.tenantId,
      specialty,
      reason: `demand=${signal.kind}; urgency=${signal.urgency}; backlog=${signal.backlog}`,
      localPreferred: true,
      productionAuthority: false,
    });
    created.push(agent);
    counts.set(signal.tenantId, current + 1);
  }
  return Object.freeze(created);
}
