/**
 * 62L-EX12 — Pathway weighting, preference, decay, recovery.
 * PREFERRED = routing preference only — never production permission.
 * Rejected/revoked/hypothesis evidence cannot strengthen VERIFIED routes.
 */

import {
  EX12_LOCKS,
  type EvidenceState,
  type PathwayEdge,
  type PreferenceLesson,
  type StrengtheningEvidence,
} from './pathway-types.ts';

const STRENGTHENABLE: ReadonlySet<EvidenceState> = new Set([
  'VERIFIED',
  'REPRODUCIBLE',
  'MEASURED',
  'SUPPORTED',
]);

const BLOCK_STRENGTHEN: ReadonlySet<EvidenceState> = new Set([
  'HYPOTHESIS',
  'REJECTED',
  'REVOKED',
  'CONTRADICTED',
  'REGRESSED',
  'STALE',
]);

export function evidenceMayStrengthenVerifiedRoute(
  evidence: StrengtheningEvidence,
  nowIso: string,
): { ok: boolean; reason: string } {
  if (evidence.revoked) {
    return { ok: false, reason: 'REVOKED_EVIDENCE_EXCLUDED' };
  }
  if (evidence.expiresAt && Date.parse(evidence.expiresAt) <= Date.parse(nowIso)) {
    return { ok: false, reason: 'EXPIRED_EVIDENCE_EXCLUDED' };
  }
  if (BLOCK_STRENGTHEN.has(evidence.evidenceState)) {
    return {
      ok: false,
      reason: `${evidence.evidenceState}_CANNOT_STRENGTHEN_VERIFIED_ROUTE`,
    };
  }
  if (!STRENGTHENABLE.has(evidence.evidenceState)) {
    return { ok: false, reason: 'EVIDENCE_STATE_INSUFFICIENT' };
  }
  if (evidence.evidenceState === 'VERIFIED' && !evidence.reproducible) {
    return { ok: false, reason: 'VERIFIED_REQUIRES_REPRODUCIBLE_TO_STRENGTHEN' };
  }
  if (!evidence.fresh) {
    return { ok: false, reason: 'STALE_EVIDENCE_WEAKENS_NOT_STRENGTHENS' };
  }
  if (EX12_LOCKS.HYPOTHESIS_EQ_VERIFIED) {
    return { ok: false, reason: 'LOCK_VIOLATION' };
  }
  return { ok: true, reason: 'EVIDENCE_MAY_STRENGTHEN_ROUTE_PREFERENCE' };
}

export function hypothesisSatisfiesVerifiedRoute(evidenceState: EvidenceState): false {
  void evidenceState;
  return false;
}

export function edgeSatisfiesVerifiedRoute(edge: PathwayEdge, nowIso: string): boolean {
  if (edge.revoked) return false;
  if (edge.expiresAt && Date.parse(edge.expiresAt) <= Date.parse(nowIso)) return false;
  if (edge.evidenceState === 'HYPOTHESIS') return false;
  if (edge.evidenceState === 'REJECTED' || edge.evidenceState === 'REVOKED') return false;
  if (edge.evidenceState === 'STALE' || edge.evidenceState === 'REGRESSED') return false;
  if (edge.evidenceState === 'CONTRADICTED') return false;
  return edge.evidenceState === 'VERIFIED' || edge.evidenceState === 'REPRODUCIBLE';
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function strengthenEdgeWeight(
  edge: PathwayEdge,
  evidence: StrengtheningEvidence,
  nowIso: string,
): { ok: true; edge: PathwayEdge } | { ok: false; reason: string } {
  const gate = evidenceMayStrengthenVerifiedRoute(evidence, nowIso);
  if (!gate.ok) return { ok: false, reason: gate.reason };

  const delta =
    evidence.evidenceState === 'REPRODUCIBLE'
      ? 0.12
      : evidence.evidenceState === 'VERIFIED'
        ? 0.1
        : 0.05;

  const next: PathwayEdge = {
    ...edge,
    weight: clamp01(edge.weight + delta),
    confidence: clamp01(edge.confidence + delta * 0.8),
    weightReason: `strengthened_by_${evidence.evidenceState}:${evidence.evidenceId}`,
    evidenceRefs: [...new Set([...edge.evidenceRefs, evidence.evidenceId])],
    lastObservedAt: nowIso,
    lastVerifiedAt: nowIso,
    freshnessState: 'FRESH',
    evidenceState:
      evidence.evidenceState === 'REPRODUCIBLE' ? 'REPRODUCIBLE' : edge.evidenceState,
    preferred: edge.preferred || edge.weight + delta >= 0.75,
  };
  return { ok: true, edge: next };
}

export function weakenEdgeForStaleRuntime(
  edge: PathwayEdge,
  nowIso: string,
  reason = 'stale_runtime',
): PathwayEdge {
  return {
    ...edge,
    weight: clamp01(edge.weight * 0.5),
    confidence: clamp01(edge.confidence * 0.6),
    freshnessState: 'STALE',
    evidenceState: edge.evidenceState === 'VERIFIED' ? 'STALE' : edge.evidenceState,
    weightReason: reason,
    lastObservedAt: nowIso,
    preferred: false,
  };
}

export function markPreferred(
  edge: PathwayEdge,
  preferred: boolean,
): { edge: PathwayEdge; meansProductionPermission: false } {
  if (EX12_LOCKS.PREFERRED_EQ_PRODUCTION_PERMISSION) {
    throw new Error('EX12_LOCK_VIOLATION');
  }
  return {
    edge: {
      ...edge,
      preferred,
      edgeType: preferred ? 'PREFERRED_FOR' : edge.edgeType,
      weightReason: preferred
        ? 'PREFERRED_FOR_routing_preference_only'
        : edge.weightReason,
    },
    meansProductionPermission: false,
  };
}

/** Preference lesson — ranking/confidence/retest only; never permissions. */
export function applyEx12NeuralPathwayLesson(input: {
  pathwayEdgeId: string;
  rankingDelta: number;
  confidenceDelta: number;
  retestRecommended: boolean;
  mayChangeGuardian?: boolean;
  mayChangeRls?: boolean;
  mayChangePermissions?: boolean;
  mayChangeTenant?: boolean;
  mayChangeUniverse?: boolean;
  mayChangeProduction?: boolean;
}): { allowed: boolean; lesson?: PreferenceLesson; reason: string } {
  if (
    input.mayChangeGuardian ||
    input.mayChangeRls ||
    input.mayChangePermissions ||
    input.mayChangeTenant ||
    input.mayChangeUniverse ||
    input.mayChangeProduction ||
    EX12_LOCKS.BROADEN_PERMISSIONS ||
    EX12_LOCKS.WEAKEN_GUARDIAN_RLS
  ) {
    return {
      allowed: false,
      reason: 'PATHWAY_PREFERENCE_CANNOT_CHANGE_PERMISSIONS',
    };
  }
  const lesson: PreferenceLesson = {
    pathwayEdgeId: input.pathwayEdgeId,
    rankingDelta: input.rankingDelta,
    confidenceDelta: input.confidenceDelta,
    retestRecommended: input.retestRecommended,
    permissionsChanged: false,
    guardianChanged: false,
    rlsChanged: false,
    tenantChanged: false,
    universeChanged: false,
    productionChanged: false,
  };
  return {
    allowed: true,
    lesson,
    reason: 'LESSON_MAY_UPDATE_ROUTING_CONFIDENCE_RETEST_ONLY',
  };
}

export function decayWeight(edge: PathwayEdge, factor: number, nowIso: string): PathwayEdge {
  return {
    ...edge,
    weight: clamp01(edge.weight * factor),
    lastObservedAt: nowIso,
    weightReason: `decay_x${factor}`,
  };
}

export function recoverWeightAfterRetest(
  edge: PathwayEdge,
  evidence: StrengtheningEvidence,
  nowIso: string,
): { ok: true; edge: PathwayEdge } | { ok: false; reason: string } {
  if (edge.evidenceState === 'REJECTED' || edge.evidenceState === 'REVOKED') {
    return { ok: false, reason: 'REJECTED_OR_REVOKED_NO_RECOVERY_WITHOUT_NEW_EVIDENCE' };
  }
  return strengthenEdgeWeight(
    { ...edge, evidenceState: 'MEASURED', freshnessState: 'FRESH' },
    evidence,
    nowIso,
  );
}
