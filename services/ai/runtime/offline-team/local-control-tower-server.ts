export interface ControlTowerServerConfig {
  host: '127.0.0.1';
  port: number;
  authRequired: true;
  externalNetworkAllowed: false;
  topSecretResponsesAllowed: false;
}

export interface ControlTowerSnapshot {
  tenantId: string;
  generatedAt: string;
  activeAgents: number;
  queuedJobs: number;
  failedJobs: number;
  checkpoints: number;
  ollama: 'ACTIVE' | 'OFFLINE' | 'UNVERIFIED';
  runtime: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED';
}

export const defaultControlTowerServerConfig: ControlTowerServerConfig = {
  host: '127.0.0.1',
  port: 4317,
  authRequired: true,
  externalNetworkAllowed: false,
  topSecretResponsesAllowed: false,
};

export function sanitizeControlTowerSnapshot(snapshot: ControlTowerSnapshot): ControlTowerSnapshot {
  return { ...snapshot, activeAgents: Math.max(0, Math.min(8, snapshot.activeAgents)) };
}
