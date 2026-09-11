export type AgentHeartbeatStatus = 'ACTIVE' | 'IDLE' | 'PAUSED' | 'OFFLINE' | 'UNVERIFIED';

export interface AgentHeartbeat {
  tenantId: string;
  agentId: string;
  role: string;
  status: AgentHeartbeatStatus;
  lastSeenAt: string;
  checkpointId?: string;
  queueItemId?: string;
  evidenceRefs: string[];
}

export class AgentHeartbeatStore {
  private readonly items = new Map<string, AgentHeartbeat>();

  upsert(heartbeat: AgentHeartbeat) {
    if (!heartbeat.tenantId || !heartbeat.agentId) throw new Error('tenantId and agentId required');
    this.items.set(`${heartbeat.tenantId}:${heartbeat.agentId}`, { ...heartbeat });
  }

  list(tenantId: string) {
    return [...this.items.values()].filter((x) => x.tenantId === tenantId);
  }

  activeCount(tenantId: string) {
    return this.list(tenantId).filter((x) => x.status === 'ACTIVE').length;
  }
}

export const AGENT_HEARTBEAT_GUARDRAILS = {
  maxConcurrentActiveAgents: 8,
  minConcurrentActiveAgents: 2,
  heartbeatIsProofOfConsciousness: false,
  heartbeatIsProofOfOptimization: false,
} as const;
