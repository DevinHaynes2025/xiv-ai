export type BrainMode = 'OFFLINE' | 'HYBRID' | 'ONLINE';
export type RuntimeStatus = 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED';

export interface BrainRuntimeReceipt {
  mode: BrainMode;
  status: RuntimeStatus;
  ollamaReachable: boolean;
  localModel?: string;
  cpuDetected: boolean;
  gpuDetected: boolean;
  gpuVerified: boolean;
  networkAllowed: boolean;
  topSecretExternalRoutingAllowed: false;
  productionMutationAllowed: false;
  checkedAt: string;
}

export function deriveBrainMode(input: { ollamaReachable: boolean; networkAllowed: boolean }): BrainMode {
  if (input.ollamaReachable && input.networkAllowed) return 'HYBRID';
  if (input.ollamaReachable) return 'OFFLINE';
  return input.networkAllowed ? 'ONLINE' : 'OFFLINE';
}

export function assessRuntimeStatus(r: Omit<BrainRuntimeReceipt, 'status' | 'mode'>): RuntimeStatus {
  if (!r.cpuDetected) return 'UNVERIFIED';
  if (!r.ollamaReachable && !r.networkAllowed) return 'OFFLINE';
  if (r.gpuDetected && !r.gpuVerified) return 'DEGRADED';
  return 'HEALTHY';
}

export const OFFLINE_ONLINE_GUARDRAILS = {
  offlineDoesNotImplyAuthorization: true,
  localLearningMode: 'RAG_MEMORY_EVAL',
  modelWeightMutationAllowed: false,
  topSecretExternalRoutingAllowed: false,
  productionMutationAllowed: false,
} as const;
