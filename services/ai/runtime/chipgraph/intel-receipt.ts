/**
 * 62L-EW9 — Compute / execution return receipt (shared fabric mirror).
 *
 * Missing receipt → UNVERIFIED. Silent fallback does NOT verify accelerator.
 * Records requested vs actual device.
 */

import type { FailureClass, IntelDevice, ResultState } from './ew9-types.ts';
import { EW9_LOCKS } from './ew9-types.ts';

export type ResourceUsageSnapshot = {
  ramMbObserved: number | null;
  gpuMemoryMbObserved: number | null;
  npuMemoryMbObserved: number | null;
  concurrencyObserved: number | null;
  thermalPressure: 'NONE' | 'ELEVATED' | 'CRITICAL' | 'UNKNOWN';
  batteryPercent: number | null;
  notes: readonly string[];
};

export type ComputeExecutionReceipt = {
  receiptId: string;
  requestId: string;
  nodeId: string;
  requestedDevice: IntelDevice;
  actualDevice: IntelDevice;
  runtimeProvider: string;
  modelId: string;
  modelHash: string;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  resourceUsage: ResourceUsageSnapshot;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  resultState: ResultState;
  failureClass: FailureClass;
  benchmarkRef: string | null;
  evidenceRefs: readonly string[];
  requestedDeviceVerified: boolean;
  agentId: string;
  tenantId: string;
  universeId: string;
};

export type ReceiptIngestOutcome =
  | {
      accepted: true;
      receipt: ComputeExecutionReceipt;
      verification: 'VERIFIED' | 'PASS_WITH_FALLBACK' | 'PASS';
    }
  | {
      accepted: false;
      verification: 'UNVERIFIED';
      reason: string;
      failureClass: FailureClass;
    };

export function missingReceiptOutcome(requestId: string): ReceiptIngestOutcome {
  return {
    accepted: false,
    verification: 'UNVERIFIED',
    reason: `MISSING_RECEIPT for requestId=${requestId} → UNVERIFIED.`,
    failureClass: 'MISSING_RECEIPT',
  };
}

export function buildExecutionReceipt(input: {
  receiptId: string;
  requestId: string;
  nodeId: string;
  requestedDevice: IntelDevice;
  actualDevice: IntelDevice;
  runtimeProvider: string;
  modelId: string;
  modelHash: string;
  startedAt: string;
  completedAt: string;
  resourceUsage: ResourceUsageSnapshot;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  resultState: ResultState;
  failureClass: FailureClass;
  benchmarkRef: string | null;
  evidenceRefs: readonly string[];
  agentId: string;
  tenantId: string;
  universeId: string;
}): ComputeExecutionReceipt {
  const latencyMs = Math.max(
    0,
    Date.parse(input.completedAt) - Date.parse(input.startedAt),
  );

  const deviceMismatch = input.requestedDevice !== input.actualDevice;
  const fallbackUsed = input.fallbackUsed || deviceMismatch;

  let failureClass = input.failureClass;
  const resultState = input.resultState;
  if (
    deviceMismatch &&
    !input.fallbackUsed &&
    EW9_LOCKS.SILENT_FALLBACK_ALLOWED === false
  ) {
    failureClass = 'SILENT_FALLBACK_FORBIDDEN';
  }

  const requestedDeviceVerified =
    !fallbackUsed &&
    input.requestedDevice === input.actualDevice &&
    input.resultState === 'PASS';

  const honestRequestedVerified = fallbackUsed ? false : requestedDeviceVerified;

  return {
    receiptId: input.receiptId,
    requestId: input.requestId,
    nodeId: input.nodeId,
    requestedDevice: input.requestedDevice,
    actualDevice: input.actualDevice,
    runtimeProvider: input.runtimeProvider,
    modelId: input.modelId,
    modelHash: input.modelHash,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    latencyMs: Number.isFinite(latencyMs) ? latencyMs : 0,
    resourceUsage: input.resourceUsage,
    fallbackUsed,
    fallbackReason:
      input.fallbackReason ??
      (fallbackUsed
        ? `FALLBACK ${input.requestedDevice} → ${input.actualDevice}`
        : null),
    resultState,
    failureClass:
      failureClass === 'SILENT_FALLBACK_FORBIDDEN'
        ? 'SILENT_FALLBACK_FORBIDDEN'
        : input.failureClass,
    benchmarkRef: input.benchmarkRef,
    evidenceRefs: input.evidenceRefs,
    requestedDeviceVerified: honestRequestedVerified,
    agentId: input.agentId,
    tenantId: input.tenantId,
    universeId: input.universeId,
  };
}

export function ingestReceipt(
  receipt: ComputeExecutionReceipt | null | undefined,
  requestId: string,
): ReceiptIngestOutcome {
  if (!receipt) {
    return missingReceiptOutcome(requestId);
  }
  if (receipt.requestId !== requestId) {
    return {
      accepted: false,
      verification: 'UNVERIFIED',
      reason: 'RECEIPT_REQUEST_ID_MISMATCH → UNVERIFIED.',
      failureClass: 'MISSING_RECEIPT',
    };
  }
  if (receipt.fallbackUsed) {
    return {
      accepted: true,
      receipt,
      verification: 'PASS_WITH_FALLBACK',
    };
  }
  if (receipt.resultState === 'PASS' && receipt.requestedDeviceVerified) {
    return { accepted: true, receipt, verification: 'VERIFIED' };
  }
  if (receipt.resultState === 'PASS') {
    return { accepted: true, receipt, verification: 'PASS' };
  }
  return {
    accepted: true,
    receipt,
    verification: 'PASS',
  };
}

export type HomeBaseReceiptLedger = {
  store(
    receipt: ComputeExecutionReceipt,
  ): { stored: true } | { denied: true; reason: string };
  get(receiptId: string): ComputeExecutionReceipt | undefined;
  listForTenant(
    tenantId: string,
    universeId: string,
  ): readonly ComputeExecutionReceipt[];
};

export function createHomeBaseReceiptLedger(): HomeBaseReceiptLedger {
  const byId = new Map<string, ComputeExecutionReceipt>();

  return {
    store(receipt) {
      if (EW9_LOCKS.CHILD_EXTRA_DATA_AUTHORITY !== false) {
        return {
          denied: true,
          reason: 'LOCK_VIOLATION_CHILD_EXTRA_DATA_AUTHORITY',
        };
      }
      byId.set(receipt.receiptId, Object.freeze({ ...receipt }));
      return { stored: true };
    },
    get(receiptId) {
      return byId.get(receiptId);
    },
    listForTenant(tenantId, universeId) {
      return [...byId.values()].filter(
        (r) => r.tenantId === tenantId && r.universeId === universeId,
      );
    },
  };
}
