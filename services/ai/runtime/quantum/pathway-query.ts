/**
 * 62L-EX12 — Pathway query + explainability.
 * Queries return evidence refs; never invent scale or collapse quantum labels.
 */

import type {
  AccessQuery,
  PathwayDenial,
  PathwayEdge,
  PathwayExplainability,
  PathwayNode,
} from './pathway-types.ts';
import {
  type PathwayGraph,
  getEdge,
  getNode,
} from './pathway-graph.ts';

function assertQueryScope(
  graph: PathwayGraph,
  query: AccessQuery,
): PathwayDenial | null {
  if (query.tenantId !== graph.tenantId) {
    return { ok: false, denied: true, reason: 'CROSS_TENANT_DENIED' };
  }
  if (query.universeId !== graph.universeId) {
    return { ok: false, denied: true, reason: 'CROSS_UNIVERSE_DENIED' };
  }
  return null;
}

export type PathwayQueryResult = {
  ok: true;
  edge: PathwayEdge;
  sourceNode: PathwayNode | undefined;
  targetNode: PathwayNode | undefined;
  evidenceRefs: readonly string[];
  benchmarkRefs: readonly string[];
  comparisonRefs: readonly string[];
  explain: PathwayExplainability;
};

export function queryPathwayEdge(
  graph: PathwayGraph,
  edgeId: string,
  query: AccessQuery,
): PathwayQueryResult | PathwayDenial {
  const denied = assertQueryScope(graph, query);
  if (denied) return denied;
  const edge = getEdge(graph, edgeId);
  if (!edge) {
    return { ok: false, denied: true, reason: 'EDGE_NOT_FOUND' };
  }
  if (edge.revoked) {
    return { ok: false, denied: true, reason: 'REVOKED_EVIDENCE_EXCLUDED' };
  }
  return {
    ok: true,
    edge,
    sourceNode: getNode(graph, edge.source),
    targetNode: getNode(graph, edge.target),
    evidenceRefs: [...edge.evidenceRefs],
    benchmarkRefs: [...edge.benchmarkRefs],
    comparisonRefs: [...edge.comparisonRefs],
    explain: explainPathwayEdge(edge),
  };
}

export function explainPathwayEdge(edge: PathwayEdge): PathwayExplainability {
  return {
    edgeId: edge.edgeId,
    edgeType: edge.edgeType,
    evidenceState: edge.evidenceState,
    quantumTruthLabel: edge.quantumTruthLabel,
    weight: edge.weight,
    weightReason: edge.weightReason,
    evidenceRefs: [...edge.evidenceRefs],
    benchmarkRefs: [...edge.benchmarkRefs],
    comparisonRefs: [...edge.comparisonRefs],
    preferred: edge.preferred,
    preferredMeansPermission: false,
    freshnessState: edge.freshnessState,
    localPromotion: edge.localPromotion,
    integrityHash: edge.integrityHash,
  };
}

export function queryEdgesByType(
  graph: PathwayGraph,
  edgeType: PathwayEdge['edgeType'],
  query: AccessQuery,
): { ok: true; edges: PathwayEdge[] } | PathwayDenial {
  const denied = assertQueryScope(graph, query);
  if (denied) return denied;
  return {
    ok: true,
    edges: [...graph.edges.values()].filter((e) => e.edgeType === edgeType && !e.revoked),
  };
}

export function excludeExpiredOrRevokedEvidence(
  edge: PathwayEdge,
  nowIso: string,
): { included: boolean; reason: string; evidenceRefs: readonly string[] } {
  if (edge.revoked || edge.evidenceState === 'REVOKED') {
    return { included: false, reason: 'REVOKED_EVIDENCE_EXCLUDED', evidenceRefs: [] };
  }
  if (edge.expiresAt && Date.parse(edge.expiresAt) <= Date.parse(nowIso)) {
    return { included: false, reason: 'EXPIRED_EVIDENCE_EXCLUDED', evidenceRefs: [] };
  }
  if (edge.evidenceState === 'REJECTED') {
    return { included: false, reason: 'REJECTED_EVIDENCE_EXCLUDED', evidenceRefs: [] };
  }
  return {
    included: true,
    reason: 'EVIDENCE_INCLUDED',
    evidenceRefs: [...edge.evidenceRefs],
  };
}

export function findPreferredRoutes(
  graph: PathwayGraph,
  query: AccessQuery,
): { ok: true; edges: PathwayEdge[]; preferenceMeansPermission: false } | PathwayDenial {
  const denied = assertQueryScope(graph, query);
  if (denied) return denied;
  return {
    ok: true,
    edges: [...graph.edges.values()].filter((e) => e.preferred && !e.revoked),
    preferenceMeansPermission: false,
  };
}
