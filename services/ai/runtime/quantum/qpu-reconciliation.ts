/**
 * 62L-EX6 — Offline / stale / failure reconciliation for physical QPU receipts.
 * Never fabricates provider results while offline.
 */

import { computeReceiptHash } from './qpu-receipt.ts';
import type {
  PhysicalQpuExecutionReceipt,
  VerificationState,
} from './types.ts';

export type ScopeActor = {
  tenantId: string;
  universeId: string;
};

export type ScopeDecision =
  | { ok: true }
  | { ok: false; verificationState: 'DENIED'; reason: string };

export function assertReceiptScope(
  receipt: PhysicalQpuExecutionReceipt,
  actor: ScopeActor,
): ScopeDecision {
  if (!actor.tenantId || !actor.universeId) {
    return { ok: false, verificationState: 'DENIED', reason: 'SCOPE_REQUIRED' };
  }
  if (receipt.tenantId !== actor.tenantId) {
    return { ok: false, verificationState: 'DENIED', reason: 'CROSS_TENANT_RECEIPT_DENIED' };
  }
  if (receipt.universeId !== actor.universeId) {
    return { ok: false, verificationState: 'DENIED', reason: 'CROSS_UNIVERSE_RECEIPT_DENIED' };
  }
  return { ok: true };
}

export type ReconcileInput = {
  receipt: PhysicalQpuExecutionReceipt;
  actor: ScopeActor;
  nowIso: string;
  /** Max age of provider evidence before STALE. */
  evidenceMaxAgeMs?: number;
  providerEvidenceObservedAt?: string | null;
  providerJobFailed?: boolean;
  providerFailureReason?: string | null;
  offlineDisconnected?: boolean;
  physicalProviderAvailable?: boolean;
};

export type ReconcileResult = {
  receipt: PhysicalQpuExecutionReceipt;
  verificationState: VerificationState;
  reasons: readonly string[];
};

function withState(
  receipt: PhysicalQpuExecutionReceipt,
  verificationState: VerificationState,
  limitations: string[],
  extra?: Partial<PhysicalQpuExecutionReceipt>,
): PhysicalQpuExecutionReceipt {
  const body: Omit<PhysicalQpuExecutionReceipt, 'receiptHash'> = {
    ...receipt,
    ...extra,
    verificationState,
    physicalQpuVerified:
      verificationState === 'PHYSICAL_QPU_VERIFIED' ? receipt.physicalQpuVerified : false,
    quantumAdvantageVerified: false,
    limitations: [...new Set([...receipt.limitations, ...limitations])],
  };
  return { ...body, receiptHash: computeReceiptHash(body) };
}

/**
 * Reconcile provider evidence honesty: offline → WAITING_PROVIDER,
 * stale evidence → STALE, failed job → FAILED receipt.
 */
export function reconcilePhysicalQpuReceipt(input: ReconcileInput): ReconcileResult {
  const scope = assertReceiptScope(input.receipt, input.actor);
  if (!scope.ok) {
    const denied = withState(input.receipt, 'DENIED', [scope.reason], {
      physicalQpuVerified: false,
    });
    return { receipt: denied, verificationState: 'DENIED', reasons: [scope.reason] };
  }

  if (input.providerJobFailed) {
    const failed = withState(
      input.receipt,
      'FAILED',
      ['PROVIDER_JOB_FAILED', input.providerFailureReason ?? 'UNKNOWN_PROVIDER_FAILURE'],
      {
        receiptKind: 'FAILURE',
        physicalQpuVerified: false,
        completedAt: input.receipt.completedAt ?? input.nowIso,
      },
    );
    return {
      receipt: failed,
      verificationState: 'FAILED',
      reasons: ['PROVIDER_JOB_FAILED'],
    };
  }

  const offlinePhysical =
    input.receipt.requestedExecutionClass === 'PHYSICAL_QPU' &&
    (input.offlineDisconnected === true || input.physicalProviderAvailable === false) &&
    !input.receipt.providerJobId;

  if (offlinePhysical) {
    const waiting = withState(
      input.receipt,
      'WAITING_PROVIDER',
      ['OFFLINE_OR_PROVIDER_UNAVAILABLE', 'PHYSICAL_QPU_STATE_NOT_TESTED'],
      { physicalQpuState: 'NOT_TESTED', physicalQpuVerified: false },
    );
    return {
      receipt: waiting,
      verificationState: 'WAITING_PROVIDER',
      reasons: ['WAITING_PROVIDER'],
    };
  }

  const maxAge = input.evidenceMaxAgeMs ?? 24 * 60 * 60 * 1000;
  const observedAt = input.providerEvidenceObservedAt ?? input.receipt.completedAt;
  if (observedAt) {
    const age = Date.parse(input.nowIso) - Date.parse(observedAt);
    if (Number.isFinite(age) && age > maxAge) {
      const stale = withState(input.receipt, 'STALE', ['PROVIDER_EVIDENCE_STALE'], {
        physicalQpuVerified: false,
      });
      return { receipt: stale, verificationState: 'STALE', reasons: ['PROVIDER_EVIDENCE_STALE'] };
    }
  }

  return {
    receipt: input.receipt,
    verificationState: input.receipt.verificationState,
    reasons: ['NO_RECONCILIATION_CHANGE'],
  };
}

/** Mark receipt REVOKED (authorization withdrawn). */
export function revokePhysicalQpuReceipt(
  receipt: PhysicalQpuExecutionReceipt,
  actor: ScopeActor,
  reason: string,
): ReconcileResult {
  const scope = assertReceiptScope(receipt, actor);
  if (!scope.ok) {
    const denied = withState(receipt, 'DENIED', [scope.reason]);
    return { receipt: denied, verificationState: 'DENIED', reasons: [scope.reason] };
  }
  const revoked = withState(receipt, 'REVOKED', ['REVOKED', reason], {
    physicalQpuVerified: false,
  });
  return { receipt: revoked, verificationState: 'REVOKED', reasons: ['REVOKED', reason] };
}
