/**
 * EW6 receipts — fallback requested vs actual; neural pathway strengthen/weaken.
 * Neural pathways may change routing preference / confidence / retest priority.
 * May NOT change permissions, Guardian, RLS, tenant/Universe access,
 * production / contract / payment authority.
 */

import {
  EW6_LOCKS,
  type EvidenceState,
  type TenantScope,
} from './types.ts';
import type { CapabilityGraph } from './graph.ts';
import { scopedKey } from './registry.ts';

export type FallbackReceipt = {
  receiptId: string;
  requestedDeviceId: string;
  requestedLabel: string;
  requestedState: EvidenceState;
  actualDeviceId: string;
  actualLabel: string;
  actualState: EvidenceState;
  fallbackUsed: true;
  /** CPU (or other) path may PASS while requested accelerator stays NOT_TESTED. */
  actualOutcome: 'PASS' | 'FAIL' | 'DEGRADED';
  requestedRemainsUnverified: true;
  scope: TenantScope;
  at: string;
  notes: string;
};

export type PathwayOutcome = 'SUCCESS_MEASURED' | 'FAILED' | 'STALE';

export type NeuralPathwayUpdate = {
  deviceNodeId: string;
  outcome: PathwayOutcome;
  previousWeight: number;
  nextWeight: number;
  previousConfidence: number;
  nextConfidence: number;
  retestPriority: number;
  permissionsChanged: false;
  guardianChanged: false;
  rlsChanged: false;
  tenantUniverseAccessChanged: false;
  productionContractPaymentAuthorityChanged: false;
};

/**
 * Record fallback: requested=AMD_NPU actual=CPU → fallbackUsed=true.
 * CPU may PASS; AMD NPU remains NOT_TESTED / unverified.
 */
export function recordFallbackReceipt(input: {
  graph: CapabilityGraph;
  receiptId: string;
  requestedDeviceNodeId: string;
  actualDeviceNodeId: string;
  actualOutcome: 'PASS' | 'FAIL' | 'DEGRADED';
  scope: TenantScope;
  notes?: string;
}): FallbackReceipt | { ok: false; reason: string } {
  const requested = input.graph.getNode(input.requestedDeviceNodeId, input.scope);
  const actual = input.graph.getNode(input.actualDeviceNodeId, input.scope);
  if (!requested.ok) return { ok: false, reason: requested.reason };
  if (!actual.ok) return { ok: false, reason: actual.reason };

  if (EW6_LOCKS.FALLBACK_EQ_REQUESTED_VERIFIED) {
    return { ok: false, reason: 'LOCK_VIOLATION_FALLBACK_EQ_VERIFIED' };
  }

  // Ensure requested accelerator is NOT marked VERIFIED by fallback alone.
  if (
    requested.value.evidenceState === 'VERIFIED' &&
    requested.value.acceleratorClass === 'NPU'
  ) {
    // Do not demote real VERIFIED if somehow present; but fallback must not create it.
  } else if (
    requested.value.evidenceState !== 'VERIFIED' &&
    (requested.value.evidenceState === 'NOT_TESTED' ||
      requested.value.evidenceState === 'DOCUMENTED' ||
      requested.value.evidenceState === 'DETECTED' ||
      requested.value.evidenceState === 'SUPPORTED')
  ) {
    // Leave requested as-is (NOT_TESTED / unverified).
  }

  const fallbackNodeId = scopedKey(input.scope, `fallback:${input.receiptId}`);
  input.graph.putNode({
    id: fallbackNodeId,
    kind: 'FallbackNode',
    version: '2.0.0',
    source: 'ew6-fallback',
    sourceDate: new Date().toISOString(),
    orgId: input.scope.orgId,
    tenantId: input.scope.tenantId,
    universeId: input.scope.universeId,
    evidenceState: actual.value.evidenceState,
    confidence: actual.value.confidence,
    freshness: actual.value.freshness,
    benchmarkRefs: [],
    knownLimitations: [
      'fallbackUsed=true — requested accelerator remains unverified by this receipt',
    ],
    lastVerifiedAt: null,
    label: `fallback ${requested.value.label} → ${actual.value.label}`,
    pathwayWeight: 1,
    retestPriority: Math.max(requested.value.retestPriority, 6),
  });

  input.graph.putEdge({
    id: scopedKey(input.scope, `edge:fallback:${input.receiptId}`),
    version: '2.0.0',
    source: 'ew6-fallback',
    sourceDate: new Date().toISOString(),
    orgId: input.scope.orgId,
    tenantId: input.scope.tenantId,
    universeId: input.scope.universeId,
    evidenceState: actual.value.evidenceState,
    confidence: 0.7,
    freshness: 1,
    benchmarkRefs: [],
    knownLimitations: [],
    lastVerifiedAt: null,
    fromId: input.requestedDeviceNodeId,
    toId: input.actualDeviceNodeId,
    kind: 'FALLBACK',
    pathwayWeight: 1,
  });

  // Bump retest priority on requested accelerator path.
  input.graph.updateNodeEvidence(input.requestedDeviceNodeId, input.scope, {
    retestPriority: Math.max(requested.value.retestPriority, 6),
  });

  return {
    receiptId: input.receiptId,
    requestedDeviceId: requested.value.id,
    requestedLabel: requested.value.label,
    requestedState: requested.value.evidenceState,
    actualDeviceId: actual.value.id,
    actualLabel: actual.value.label,
    actualState: actual.value.evidenceState,
    fallbackUsed: true,
    actualOutcome: input.actualOutcome,
    requestedRemainsUnverified: true,
    scope: input.scope,
    at: new Date().toISOString(),
    notes:
      input.notes ??
      'fallbackUsed=true; actual path may PASS; requested accelerator NOT_TESTED/UNVERIFIED',
  };
}

/**
 * Strengthen successful measured routes; weaken failed/stale.
 * Explicitly cannot change authority surfaces.
 */
export function applyNeuralPathwayUpdate(input: {
  graph: CapabilityGraph;
  deviceNodeId: string;
  scope: TenantScope;
  outcome: PathwayOutcome;
}): NeuralPathwayUpdate | { ok: false; reason: string } {
  if (EW6_LOCKS.NEURAL_PATHWAY_MAY_CHANGE_PERMISSIONS) {
    return { ok: false, reason: 'LOCK_VIOLATION_PERMISSIONS' };
  }
  if (EW6_LOCKS.NEURAL_PATHWAY_MAY_CHANGE_GUARDIAN) {
    return { ok: false, reason: 'LOCK_VIOLATION_GUARDIAN' };
  }
  if (EW6_LOCKS.NEURAL_PATHWAY_MAY_CHANGE_RLS) {
    return { ok: false, reason: 'LOCK_VIOLATION_RLS' };
  }
  if (EW6_LOCKS.NEURAL_PATHWAY_MAY_CHANGE_PROD_CONTRACT_PAYMENT) {
    return { ok: false, reason: 'LOCK_VIOLATION_PROD_AUTHORITY' };
  }

  const node = input.graph.getNode(input.deviceNodeId, input.scope);
  if (!node.ok) return { ok: false, reason: node.reason };

  const previousWeight = node.value.pathwayWeight;
  const previousConfidence = node.value.confidence;
  let nextWeight = previousWeight;
  let nextConfidence = previousConfidence;
  let retestPriority = node.value.retestPriority;

  if (input.outcome === 'SUCCESS_MEASURED') {
    nextWeight = Math.min(previousWeight + 0.25, 5);
    nextConfidence = Math.min(previousConfidence + 0.05, 0.99);
    retestPriority = Math.max(0, retestPriority - 1);
  } else if (input.outcome === 'FAILED') {
    nextWeight = Math.max(previousWeight - 0.35, 0.1);
    nextConfidence = Math.max(previousConfidence - 0.1, 0.05);
    retestPriority = Math.min(retestPriority + 2, 10);
  } else {
    // STALE
    nextWeight = Math.max(previousWeight - 0.2, 0.1);
    nextConfidence = Math.max(previousConfidence - 0.15, 0.05);
    retestPriority = Math.min(retestPriority + 3, 10);
  }

  input.graph.updateNodeEvidence(input.deviceNodeId, input.scope, {
    pathwayWeight: nextWeight,
    confidence: nextConfidence,
    retestPriority,
  });

  // Optional lesson node (XIV proprietary pathway memory).
  const lessonId = scopedKey(
    input.scope,
    `lesson:${input.deviceNodeId}:${input.outcome}:${Date.now()}`,
  );
  input.graph.putNode({
    id: lessonId,
    kind: 'LessonNode',
    version: '2.0.0',
    source: 'ew6-neural-pathway',
    sourceDate: new Date().toISOString(),
    orgId: input.scope.orgId,
    tenantId: input.scope.tenantId,
    universeId: input.scope.universeId,
    evidenceState: node.value.evidenceState,
    confidence: nextConfidence,
    freshness: input.outcome === 'STALE' ? 0 : 1,
    benchmarkRefs: [],
    knownLimitations: [
      'Lesson affects routing preference/confidence/retest only — not permissions/Guardian/RLS/authority.',
    ],
    lastVerifiedAt: null,
    label: `pathway ${input.outcome}`,
    pathwayWeight: nextWeight,
    retestPriority,
  });

  return {
    deviceNodeId: input.deviceNodeId,
    outcome: input.outcome,
    previousWeight,
    nextWeight,
    previousConfidence,
    nextConfidence,
    retestPriority,
    permissionsChanged: false,
    guardianChanged: false,
    rlsChanged: false,
    tenantUniverseAccessChanged: false,
    productionContractPaymentAuthorityChanged: false,
  };
}
