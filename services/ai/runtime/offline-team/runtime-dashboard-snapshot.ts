export interface RuntimeDashboardSnapshot {
  timestamp: string;
  mode: 'OFFLINE' | 'HYBRID' | 'ONLINE';
  brainHealth: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED';
  activeAgents: number;
  queueDepth: number;
  pausedForReview: number;
  recoveryPending: number;
  ollama: 'ACTIVE' | 'OFFLINE' | 'UNVERIFIED';
  gpu: 'VERIFIED' | 'DETECTED' | 'UNVERIFIED';
  topSecretExternalExposure: false;
}

export function buildRuntimeDashboardSnapshot(input: Omit<RuntimeDashboardSnapshot, 'topSecretExternalExposure'>): RuntimeDashboardSnapshot {
  return { ...input, topSecretExternalExposure: false };
}
