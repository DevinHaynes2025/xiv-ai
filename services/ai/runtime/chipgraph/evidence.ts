/**
 * EW6 evidence — VERIFIED requires runtime/test evidence.
 * Proprietary / restricted evidence is rejected.
 * Stale benchmarks lower eligibility / demote VERIFIED.
 */

import {
  ALLOWED_EVIDENCE_CLASSES,
  EW6_LOCKS,
  RESTRICTED_EVIDENCE_CLASSES,
  scopesMatch,
  type AllowedEvidenceClass,
  type EvidenceState,
  type RestrictedEvidenceClass,
  type TenantScope,
} from './types.ts';
import type { CapabilityGraph, CapabilityNode } from './graph.ts';
import { scopedKey } from './registry.ts';

export type EvidencePayload = {
  evidenceId: string;
  evidenceClass: AllowedEvidenceClass | RestrictedEvidenceClass | string;
  targetNodeId: string;
  kind:
    | 'documentation'
    | 'detection'
    | 'runtime_support'
    | 'bounded_runtime_test'
    | 'benchmark'
    | 'heartbeat'
    | 'revocation';
  fresh: boolean;
  staleAfterMs: number;
  recordedAt: string;
  scope: TenantScope;
  notes: string;
  benchmarkRef?: string;
};

export type EvidenceAcceptResult =
  | {
      ok: true;
      evidenceId: string;
      node: CapabilityNode;
      appliedState: EvidenceState;
    }
  | {
      ok: false;
      rejected: true;
      reason:
        | 'PROPRIETARY_RESTRICTED_EVIDENCE'
        | 'CROSS_TENANT_DENIED'
        | 'CROSS_UNIVERSE_DENIED'
        | 'NODE_NOT_FOUND'
        | 'VERIFIED_REQUIRES_RUNTIME_TEST'
        | 'STALE_BLOCKS_VERIFIED'
        | 'LADDER_SKIP_DENIED'
        | 'UNKNOWN_EVIDENCE_CLASS';
    };

export type EvidenceStore = {
  records: Map<string, EvidencePayload>;
};

export function createEvidenceStore(): EvidenceStore {
  return { records: new Map() };
}

export function isRestrictedEvidenceClass(
  value: string,
): value is RestrictedEvidenceClass {
  return (RESTRICTED_EVIDENCE_CLASSES as readonly string[]).includes(value);
}

export function isAllowedEvidenceClass(
  value: string,
): value is AllowedEvidenceClass {
  return (ALLOWED_EVIDENCE_CLASSES as readonly string[]).includes(value);
}

export function isEvidenceStale(
  record: EvidencePayload,
  nowMs: number = Date.now(),
): boolean {
  if (!record.fresh) return true;
  const recorded = Date.parse(record.recordedAt);
  if (Number.isNaN(recorded)) return true;
  return nowMs - recorded > record.staleAfterMs;
}

/**
 * Reject proprietary/restricted evidence. Never ingest RTL/firmware/trade secrets.
 */
export function rejectIfProprietary(payload: EvidencePayload): EvidenceAcceptResult | null {
  if (
    isRestrictedEvidenceClass(payload.evidenceClass) ||
    EW6_LOCKS.MAY_COPY_VENDOR_RTL_FIRMWARE
  ) {
    return {
      ok: false,
      rejected: true,
      reason: 'PROPRIETARY_RESTRICTED_EVIDENCE',
    };
  }
  if (!isAllowedEvidenceClass(payload.evidenceClass)) {
    return {
      ok: false,
      rejected: true,
      reason: 'UNKNOWN_EVIDENCE_CLASS',
    };
  }
  return null;
}

function desiredStateFromKind(
  kind: EvidencePayload['kind'],
): EvidenceState | null {
  switch (kind) {
    case 'documentation':
      return 'DOCUMENTED';
    case 'detection':
      return 'DETECTED';
    case 'runtime_support':
      return 'SUPPORTED';
    case 'bounded_runtime_test':
    case 'benchmark':
      return 'VERIFIED';
    case 'revocation':
      return 'REVOKED';
    default:
      return null;
  }
}

/**
 * Apply evidence to a node. DOCUMENTED/DETECTED cannot become VERIFIED.
 * VERIFIED requires bounded_runtime_test or fresh benchmark evidence.
 */
export function applyEvidence(
  graph: CapabilityGraph,
  store: EvidenceStore,
  payload: EvidencePayload,
  nowMs: number = Date.now(),
): EvidenceAcceptResult {
  const proprietary = rejectIfProprietary(payload);
  if (proprietary) return proprietary;

  if (!scopesMatch(payload.scope, payload.scope)) {
    /* always true — isolation enforced via graph.getNode */
  }

  const nodeResult = graph.getNode(payload.targetNodeId, payload.scope);
  if (!nodeResult.ok) {
    return {
      ok: false,
      rejected: true,
      reason: nodeResult.reason,
    };
  }

  const desired = desiredStateFromKind(payload.kind);
  if (desired === 'VERIFIED') {
    if (
      payload.kind !== 'bounded_runtime_test' &&
      payload.kind !== 'benchmark'
    ) {
      return {
        ok: false,
        rejected: true,
        reason: 'VERIFIED_REQUIRES_RUNTIME_TEST',
      };
    }
    if (isEvidenceStale(payload, nowMs)) {
      return {
        ok: false,
        rejected: true,
        reason: 'STALE_BLOCKS_VERIFIED',
      };
    }
    // DOCUMENTED/DETECTED cannot jump to VERIFIED via documentation/detection kinds
    // (already gated by kind). Still block if current is DOCUMENTED and kind is wrong.
  }

  if (
    desired === 'VERIFIED' &&
    (nodeResult.value.evidenceState === 'DOCUMENTED' ||
      nodeResult.value.evidenceState === 'DETECTED') &&
    payload.kind !== 'bounded_runtime_test' &&
    payload.kind !== 'benchmark'
  ) {
    return {
      ok: false,
      rejected: true,
      reason: 'LADDER_SKIP_DENIED',
    };
  }

  store.records.set(payload.evidenceId, payload);

  const evidenceNodeId = scopedKey(
    payload.scope,
    `evidence:${payload.evidenceId}`,
  );
  graph.putNode({
    id: evidenceNodeId,
    kind: 'EvidenceNode',
    version: '2.0.0',
    source: payload.evidenceClass,
    sourceDate: payload.recordedAt,
    orgId: payload.scope.orgId,
    tenantId: payload.scope.tenantId,
    universeId: payload.scope.universeId,
    evidenceState: desired ?? nodeResult.value.evidenceState,
    confidence: desired === 'VERIFIED' ? 0.95 : 0.5,
    freshness: isEvidenceStale(payload, nowMs) ? 0 : 1,
    benchmarkRefs: payload.benchmarkRef ? [payload.benchmarkRef] : [],
    knownLimitations: [],
    lastVerifiedAt: desired === 'VERIFIED' ? payload.recordedAt : null,
    label: `Evidence ${payload.evidenceId}`,
    pathwayWeight: 1,
    retestPriority: 0,
  });

  graph.putEdge({
    id: scopedKey(payload.scope, `edge:evidence:${payload.evidenceId}`),
    version: '2.0.0',
    source: payload.evidenceClass,
    sourceDate: payload.recordedAt,
    orgId: payload.scope.orgId,
    tenantId: payload.scope.tenantId,
    universeId: payload.scope.universeId,
    evidenceState: desired ?? 'DOCUMENTED',
    confidence: 0.5,
    freshness: 1,
    benchmarkRefs: payload.benchmarkRef ? [payload.benchmarkRef] : [],
    knownLimitations: [],
    lastVerifiedAt: desired === 'VERIFIED' ? payload.recordedAt : null,
    fromId: evidenceNodeId,
    toId: payload.targetNodeId,
    kind: 'EVIDENCE',
    pathwayWeight: 1,
  });

  let appliedState = nodeResult.value.evidenceState;
  if (desired === 'VERIFIED') {
    appliedState = 'VERIFIED';
  } else if (desired === 'REVOKED') {
    appliedState = 'REVOKED';
  } else if (desired && nodeResult.value.evidenceState === 'DOCUMENTED') {
    // Allow one-step style updates when advancing via matching kind.
    if (desired === 'DETECTED' || desired === 'SUPPORTED') {
      appliedState = desired;
    }
  } else if (desired === 'SUPPORTED' && nodeResult.value.evidenceState === 'DETECTED') {
    appliedState = 'SUPPORTED';
  } else if (desired === 'DETECTED' && nodeResult.value.evidenceState === 'DOCUMENTED') {
    appliedState = 'DETECTED';
  }

  const updated = graph.updateNodeEvidence(payload.targetNodeId, payload.scope, {
    evidenceState: appliedState,
    confidence: appliedState === 'VERIFIED' ? 0.95 : nodeResult.value.confidence,
    freshness: isEvidenceStale(payload, nowMs) ? 0 : 1,
    benchmarkRefs: payload.benchmarkRef
      ? [...nodeResult.value.benchmarkRefs, payload.benchmarkRef]
      : nodeResult.value.benchmarkRefs,
    lastVerifiedAt:
      appliedState === 'VERIFIED'
        ? payload.recordedAt
        : nodeResult.value.lastVerifiedAt,
  });

  if (!updated.ok) {
    return {
      ok: false,
      rejected: true,
      reason: updated.reason,
    };
  }

  return {
    ok: true,
    evidenceId: payload.evidenceId,
    node: updated.value,
    appliedState,
  };
}

/**
 * Mark a node STALE when backing benchmark evidence expires.
 * Stale lowers eligibility (routing) and demotes VERIFIED.
 */
export function demoteIfStale(input: {
  graph: CapabilityGraph;
  nodeId: string;
  scope: TenantScope;
  evidence: EvidencePayload;
  nowMs?: number;
}): {
  demoted: boolean;
  previousState: EvidenceState;
  nextState: EvidenceState;
  reason: string;
} {
  const nodeResult = input.graph.getNode(input.nodeId, input.scope);
  if (!nodeResult.ok) {
    return {
      demoted: false,
      previousState: 'UNAVAILABLE',
      nextState: 'UNAVAILABLE',
      reason: nodeResult.reason,
    };
  }
  const previous = nodeResult.value.evidenceState;
  if (!isEvidenceStale(input.evidence, input.nowMs)) {
    return {
      demoted: false,
      previousState: previous,
      nextState: previous,
      reason: 'EVIDENCE_FRESH',
    };
  }
  if (EW6_LOCKS.STALE_EVIDENCE_KEEPS_VERIFIED) {
    return {
      demoted: false,
      previousState: previous,
      nextState: previous,
      reason: 'LOCK_VIOLATION',
    };
  }
  input.graph.updateNodeEvidence(input.nodeId, input.scope, {
    evidenceState: 'STALE',
    freshness: 0,
    confidence: Math.min(nodeResult.value.confidence, 0.2),
    retestPriority: Math.max(nodeResult.value.retestPriority, 8),
  });
  return {
    demoted: true,
    previousState: previous,
    nextState: 'STALE',
    reason: 'STALE_BENCHMARK_DEMOTES_VERIFIED',
  };
}

/**
 * Hard rule helpers for tests / routing.
 */
export function documentedSatisfiesVerified(state: EvidenceState): boolean {
  if (EW6_LOCKS.DOCUMENTED_EQ_VERIFIED) return true;
  return state === 'DOCUMENTED' ? false : state === 'VERIFIED';
}

export function detectedSatisfiesVerified(state: EvidenceState): boolean {
  if (EW6_LOCKS.DETECTED_EQ_VERIFIED) return true;
  return state === 'DETECTED' ? false : state === 'VERIFIED';
}
