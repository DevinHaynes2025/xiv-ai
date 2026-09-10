export type RouteProvider = 'OLLAMA' | 'LOCAL_RULES' | 'PLUGIN' | 'CLOUD_MODEL';

export interface RouteRequest {
  tenantId: string;
  taskId: string;
  requiresInternet: boolean;
  containsTopSecret: boolean;
  preferred?: RouteProvider;
  providerEvidence: Partial<Record<RouteProvider, string[]>>;
}

export interface RouteDecision {
  provider: RouteProvider;
  reason: string;
  online: boolean;
  evidenceRefs: string[];
  productionMutationAllowed: false;
}

export function routeHybridTask(req: RouteRequest): RouteDecision {
  if (!req.tenantId || !req.taskId) throw new Error('tenantId and taskId required');
  if (req.containsTopSecret && req.requiresInternet) {
    return {
      provider: 'OLLAMA',
      reason: 'TOP_SECRET content is forced to local execution',
      online: false,
      evidenceRefs: req.providerEvidence.OLLAMA ?? [],
      productionMutationAllowed: false,
    };
  }

  const localEvidence = req.providerEvidence.OLLAMA ?? [];
  if (!req.requiresInternet && localEvidence.length) {
    return { provider: 'OLLAMA', reason: 'offline-first local route', online: false, evidenceRefs: localEvidence, productionMutationAllowed: false };
  }

  const requested = req.preferred ?? 'PLUGIN';
  const evidence = req.providerEvidence[requested] ?? [];
  if (req.requiresInternet && evidence.length) {
    return { provider: requested, reason: 'approved online capability with evidence', online: true, evidenceRefs: evidence, productionMutationAllowed: false };
  }

  if (localEvidence.length) {
    return { provider: 'OLLAMA', reason: 'online route unavailable; local fallback', online: false, evidenceRefs: localEvidence, productionMutationAllowed: false };
  }

  return { provider: 'LOCAL_RULES', reason: 'no model/provider evidence; deterministic fallback', online: false, evidenceRefs: [], productionMutationAllowed: false };
}

export const HYBRID_ROUTER_GUARDRAILS = {
  offlineFirst: true,
  topSecretOnlineRoutingAllowed: false,
  providerAvailabilityRequiresEvidence: true,
  productionMutationAllowed: false,
};
