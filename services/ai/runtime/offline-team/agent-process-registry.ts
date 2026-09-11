export type AgentProcessStatus = 'ACTIVE' | 'IDLE' | 'PAUSED' | 'OFFLINE' | 'UNVERIFIED';

export interface AgentProcessRecord {
  agentId: string;
  role: string;
  pid?: number;
  status: AgentProcessStatus;
  startedAt?: string;
  lastHeartbeatAt?: string;
  receiptRef?: string;
}

export function validateAgentProcess(record: AgentProcessRecord): AgentProcessRecord {
  if (record.status === 'ACTIVE' && (!record.pid || !record.receiptRef)) {
    return { ...record, status: 'UNVERIFIED' };
  }
  return record;
}

export function boundedActiveAgents(records: AgentProcessRecord[]): boolean {
  const active = records.filter((r) => r.status === 'ACTIVE').length;
  return active >= 0 && active <= 8;
}
