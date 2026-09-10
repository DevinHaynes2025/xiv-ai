export type HighwayProvider = 'OLLAMA' | 'LOCAL_RULES' | 'GROK' | 'CHATGPT' | 'GEMINI' | 'GOOGLE_CLOUD' | 'AZURE';
export type HighwayExecution = 'LOCAL' | 'CLOUD_SANDBOX';

export interface ProviderCapability {
  provider: HighwayProvider;
  execution: HighwayExecution;
  available: boolean;
  offlineCapable: boolean;
  latencyMs: number;
  costScore: number;
  privacyScore: number;
  evidenceRefs: readonly string[];
}

export interface HighwayWorkload {
  tenantId: string;
  objective: string;
  requiresOffline: boolean;
  maxLatencyMs: number;
  minPrivacyScore: number;
  allowedProviders: readonly HighwayProvider[];
}

export const NEURAL_HIGHWAY_GUARDRAILS = {
  offlineFirst: true,
  productionExecutionAllowed: false,
  crossTenantRoutingAllowed: false,
  verifiedProviderRequiresEvidence: true,
  policyGateBypassAllowed: false,
} as const;

export function routeNeuralHighway(workload: HighwayWorkload, capabilities: readonly ProviderCapability[]) {
  const eligible = capabilities.filter((c) =>
    c.available &&
    workload.allowedProviders.includes(c.provider) &&
    (!workload.requiresOffline || c.offlineCapable) &&
    c.latencyMs <= workload.maxLatencyMs &&
    c.privacyScore >= workload.minPrivacyScore &&
    (c.execution === 'LOCAL' || c.evidenceRefs.length > 0)
  );

  return eligible
    .map((c) => ({
      ...c,
      score: (c.offlineCapable ? 100 : 0) + c.privacyScore * 10 - c.costScore * 2 - c.latencyMs / 100,
    }))
    .sort((a, b) => b.score - a.score);
}
