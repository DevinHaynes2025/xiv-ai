import type { DatabaseNode, HighwayRequest, HighwayRoute } from './types';

function eligible(node: DatabaseNode, request: HighwayRequest): boolean {
  if (node.state !== 'AVAILABLE' && !(request.offlinePreferred && node.state === 'OFFLINE')) return false;
  if (!request.allowedProviders.includes(node.provider)) return false;
  if (request.requiresWrite && !node.writable) return false;
  if (request.requiresVector && !node.vectorCapable) return false;
  if (request.requiresGraph && !node.graphCapable) return false;
  if (!node.encrypted) return false;
  if (node.tenantId && node.tenantId !== request.tenantId) return false;
  if (node.estimatedLatencyMs > request.maxLatencyMs) return false;
  if (node.estimatedCostPerMillionOps > request.maxCostPerMillionOps) return false;
  return true;
}

export function routeDatabaseCity(nodes: DatabaseNode[], request: HighwayRequest): HighwayRoute | null {
  const candidates = nodes.filter((node) => eligible(node, request));
  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    const localBiasA = request.offlinePreferred && a.provider === 'LOCAL' ? -1000 : 0;
    const localBiasB = request.offlinePreferred && b.provider === 'LOCAL' ? -1000 : 0;
    const scoreA = a.estimatedLatencyMs + a.estimatedCostPerMillionOps + localBiasA;
    const scoreB = b.estimatedLatencyMs + b.estimatedCostPerMillionOps + localBiasB;
    return scoreA - scoreB;
  });

  const chosen = candidates[0];
  const score = 1 / Math.max(1, chosen.estimatedLatencyMs + chosen.estimatedCostPerMillionOps);
  return {
    nodeIds: [chosen.id],
    totalLatencyMs: chosen.estimatedLatencyMs,
    estimatedCostPerMillionOps: chosen.estimatedCostPerMillionOps,
    score,
  };
}

export function fallbackChain(nodes: DatabaseNode[], request: HighwayRequest): HighwayRoute[] {
  return nodes
    .filter((node) => eligible(node, request))
    .map((node) => ({
      nodeIds: [node.id],
      totalLatencyMs: node.estimatedLatencyMs,
      estimatedCostPerMillionOps: node.estimatedCostPerMillionOps,
      score: 1 / Math.max(1, node.estimatedLatencyMs + node.estimatedCostPerMillionOps),
    }))
    .sort((a, b) => b.score - a.score);
}
