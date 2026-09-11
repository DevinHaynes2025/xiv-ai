export interface ControlTowerServerConfig {
  host: '127.0.0.1';
  port: number;
  authRequired: true;
  externalNetworkAllowed: false;
  topSecretResponsesAllowed: false;
}

export interface ControlTowerSnapshot {
  health: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED';
  activeAgents: number;
  queueDepth: number;
  pendingSync: number;
  meetingsRunning: number;
  lastCheckpointAt?: string;
}

export function validateControlTowerServer(config: ControlTowerServerConfig): void {
  if (config.host !== '127.0.0.1') throw new Error('localhost-only');
  if (!config.authRequired) throw new Error('authentication-required');
  if (config.externalNetworkAllowed !== false) throw new Error('external-network-disabled');
  if (config.topSecretResponsesAllowed !== false) throw new Error('top-secret-response-blocked');
  if (config.port < 1024 || config.port > 65535) throw new Error('invalid-port');
}

export function sanitizeControlTowerSnapshot(snapshot: ControlTowerSnapshot): ControlTowerSnapshot {
  return { ...snapshot, activeAgents: Math.max(0, Math.min(8, snapshot.activeAgents)) };
}
