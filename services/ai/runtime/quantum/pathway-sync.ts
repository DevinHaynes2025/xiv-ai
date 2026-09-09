/**
 * 62L-EX12 — Local/offline pathway sync.
 * Local offline edges start as LOCAL_CANDIDATE.
 * No auto global promote (AUTO_PROMOTE_LOCAL_GLOBAL=false).
 */

import {
  EX12_LOCKS,
  type AccessQuery,
  type LocalEdgePromotion,
  type PathwayDenial,
  type PathwayEdge,
} from './pathway-types.ts';
import {
  createEdgeDraft,
  type PathwayGraph,
  replaceEdge,
  upsertEdge,
} from './pathway-graph.ts';

export type LocalSyncReceipt = {
  edgeId: string;
  localPromotion: LocalEdgePromotion;
  autoPromotedGlobally: false;
  syncedAt: string;
};

/** Create a local offline edge — always starts LOCAL_CANDIDATE. */
export function createLocalOfflineEdge(
  graph: PathwayGraph,
  input: {
    edgeId: string;
    source: string;
    target: string;
    edgeType: PathwayEdge['edgeType'];
    quantumTruthLabel: PathwayEdge['quantumTruthLabel'];
    nowIso: string;
    evidenceRefs?: readonly string[];
  },
  query: AccessQuery,
): PathwayEdge | PathwayDenial {
  return upsertEdge(
    graph,
    createEdgeDraft({
      edgeId: input.edgeId,
      source: input.source,
      target: input.target,
      edgeType: input.edgeType,
      tenantId: graph.tenantId,
      universeId: graph.universeId,
      evidenceState: 'HYPOTHESIS',
      quantumTruthLabel: input.quantumTruthLabel,
      nowIso: input.nowIso,
      evidenceRefs: input.evidenceRefs,
      sourceClass: 'LOCAL',
      localPromotion: 'LOCAL_CANDIDATE',
      weightReason: 'local_offline_candidate',
    }),
    query,
  );
}

/**
 * Attempt global promotion of a local edge.
 * Auto-promote is forbidden; requires explicit human path.
 */
export function attemptPromoteLocalEdgeGlobally(
  graph: PathwayGraph,
  edgeId: string,
  query: AccessQuery,
  opts: {
    nowIso: string;
    humanApproved: boolean;
    autoPromote?: boolean;
  },
):
  | { ok: true; edge: PathwayEdge; autoPromotedGlobally: false; receipt: LocalSyncReceipt }
  | PathwayDenial {
  if (opts.autoPromote === true || EX12_LOCKS.AUTO_PROMOTE_LOCAL_GLOBAL) {
    return {
      ok: false,
      denied: true,
      reason: 'LOCAL_EDGE_NO_AUTO_GLOBAL_PROMOTE',
    };
  }
  const existing = graph.edges.get(edgeId);
  if (!existing) {
    return { ok: false, denied: true, reason: 'EDGE_NOT_FOUND' };
  }
  if (existing.localPromotion === null) {
    return { ok: false, denied: true, reason: 'NOT_A_LOCAL_EDGE' };
  }
  if (!opts.humanApproved) {
    const pending: PathwayEdge = {
      ...existing,
      localPromotion: 'PROMOTION_PENDING_HUMAN',
      lastObservedAt: opts.nowIso,
      weightReason: 'awaiting_human_promotion_approval',
    };
    const replaced = replaceEdge(graph, pending, query);
    if ('denied' in replaced) return replaced;
    return {
      ok: false,
      denied: true,
      reason: 'HUMAN_APPROVAL_REQUIRED_FOR_GLOBAL_PROMOTE',
    };
  }
  const promoted: PathwayEdge = {
    ...existing,
    localPromotion: 'GLOBALLY_ACCEPTED',
    evidenceState:
      existing.evidenceState === 'HYPOTHESIS' ? 'DOCUMENTED' : existing.evidenceState,
    lastObservedAt: opts.nowIso,
    weightReason: 'human_approved_global_accept',
  };
  const replaced = replaceEdge(graph, promoted, query);
  if ('denied' in replaced) return replaced;
  return {
    ok: true,
    edge: replaced,
    autoPromotedGlobally: false,
    receipt: {
      edgeId: replaced.edgeId,
      localPromotion: 'GLOBALLY_ACCEPTED',
      autoPromotedGlobally: false,
      syncedAt: opts.nowIso,
    },
  };
}

export function localEdgeStartsAsCandidate(edge: PathwayEdge): boolean {
  return edge.localPromotion === 'LOCAL_CANDIDATE';
}

export function didAutoPromoteGlobally(_edge: PathwayEdge): false {
  return false;
}

/** Offline sync merges local candidates without elevating promotion state. */
export function syncLocalCandidates(
  graph: PathwayGraph,
  candidates: readonly PathwayEdge[],
  query: AccessQuery,
  nowIso: string,
): { synced: number; promotions: LocalEdgePromotion[] } | PathwayDenial {
  let synced = 0;
  const promotions: LocalEdgePromotion[] = [];
  for (const c of candidates) {
    if (c.localPromotion !== 'LOCAL_CANDIDATE') {
      continue;
    }
    const next = {
      ...c,
      lastObservedAt: nowIso,
      // sync must not auto-elevate
      localPromotion: 'LOCAL_CANDIDATE' as const,
    };
    const result = replaceEdge(graph, next, query);
    if ('denied' in result) return result;
    synced += 1;
    promotions.push(result.localPromotion ?? 'LOCAL_CANDIDATE');
  }
  return { synced, promotions };
}
