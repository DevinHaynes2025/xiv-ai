export type ControlTowerStatus = 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED';

export interface ControlTowerSnapshot {
  tenantId: string;
  status: ControlTowerStatus;
  activeAgents: number;
  queuedJobs: number;
  pendingSync: number;
  conflicts: number;
  meetingsScheduled: number;
  databaseHealth: ControlTowerStatus;
  ollamaHealth: ControlTowerStatus;
  gpuHealth: ControlTowerStatus;
  generatedAt: string;
}

export interface ControlTowerApiConfig {
  host: '127.0.0.1';
  port: number;
  authRequired: true;
  externalNetworkAllowed: false;
  topSecretResponsesAllowed: false;
}

export function createControlTowerApiConfig(port = 4414): ControlTowerApiConfig {
  if (port < 1024 || port > 65535) throw new Error('invalid localhost API port');
  return {
    host: '127.0.0.1',
    port,
    authRequired: true,
    externalNetworkAllowed: false,
    topSecretResponsesAllowed: false,
  };
}

export function summarizeControlTower(input: Omit<ControlTowerSnapshot, 'generatedAt'>): ControlTowerSnapshot {
  if (input.activeAgents < 0 || input.activeAgents > 8) throw new Error('activeAgents must be 0-8');
  return { ...input, generatedAt: new Date().toISOString() };
}
