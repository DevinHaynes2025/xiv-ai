/**
 * 62L-EX5 — Physical QPU execution receipt (registry-side).
 * PHYSICAL_QPU_VERIFIED requires a real job receipt — not mocked registry success.
 * Physical execution alone cannot claim quantum advantage.
 * Never store raw credentials in receipts.
 */

import type { Ex5ExecutionClass, PhysicalOrSimulator } from './qpu-types.ts';

export type QpuExecutionReceipt = {
  receiptId: string;
  jobId: string;
  missionId: string;
  taskId: string;
  tenantId: string;
  universeId: string;
  providerId: string;
  backendId: string;
  physicalOrSimulator: PhysicalOrSimulator;
  executionClass: Ex5ExecutionClass;
  /** True only when a real physical job completed (not mocked). */
  physicalJobCompleted: boolean;
  mocked: boolean;
  startedAt: string;
  completedAt: string;
  shots: number;
  resultDigest: string;
  evidenceRefs: readonly string[];
  /** Raw credentials must never appear. */
  rawCredentialsPresent: false;
  physicalQpuVerified: boolean;
  quantumAdvantageVerified: false;
  classicalBaselineCompared: boolean;
  reproducibleBenchmark: boolean;
  reviewGatePassed: boolean;
  limitations: readonly string[];
  l4Enabled: false;
  guardianRlsUnchanged: true;
};

export type ReceiptCreateResult =
  | { ok: true; receipt: QpuExecutionReceipt }
  | { ok: false; reason: string };

export function createQpuExecutionReceipt(input: {
  receiptId: string;
  jobId: string;
  missionId: string;
  taskId: string;
  tenantId: string;
  universeId: string;
  providerId: string;
  backendId: string;
  physicalOrSimulator: PhysicalOrSimulator;
  executionClass: Ex5ExecutionClass;
  physicalJobCompleted: boolean;
  mocked: boolean;
  startedAt: string;
  completedAt: string;
  shots: number;
  resultDigest: string;
  evidenceRefs?: readonly string[];
  classicalBaselineCompared?: boolean;
  reproducibleBenchmark?: boolean;
  reviewGatePassed?: boolean;
  limitations?: readonly string[];
  /** Attempt to claim PHYSICAL_QPU_VERIFIED. */
  claimPhysicalQpuVerified?: boolean;
  /** Attempt to claim quantum advantage. */
  claimQuantumAdvantage?: boolean;
}): ReceiptCreateResult {
  if (input.mocked && input.claimPhysicalQpuVerified) {
    return { ok: false, reason: 'MOCKED_RECEIPT_CANNOT_CLAIM_PHYSICAL_QPU_VERIFIED' };
  }

  if (
    input.physicalOrSimulator === 'SIMULATOR' &&
    (input.claimPhysicalQpuVerified || input.executionClass === 'PHYSICAL_QPU_VERIFIED')
  ) {
    return { ok: false, reason: 'SIMULATOR_NEVER_PHYSICAL_QPU_VERIFIED' };
  }

  let physicalQpuVerified = false;
  if (input.claimPhysicalQpuVerified) {
    if (
      input.physicalOrSimulator === 'PHYSICAL_QPU' &&
      input.physicalJobCompleted === true &&
      input.mocked === false &&
      input.resultDigest.length > 0
    ) {
      physicalQpuVerified = true;
    } else {
      return { ok: false, reason: 'PHYSICAL_QPU_VERIFIED_REQUIRES_REAL_JOB_RECEIPT' };
    }
  }

  // Physical execution alone cannot claim quantum advantage.
  if (input.claimQuantumAdvantage === true) {
    const advantageOk =
      physicalQpuVerified &&
      input.classicalBaselineCompared === true &&
      input.reproducibleBenchmark === true &&
      input.reviewGatePassed === true;
    if (!advantageOk) {
      return {
        ok: false,
        reason: 'PHYSICAL_EXECUTION_ALONE_CANNOT_CLAIM_QUANTUM_ADVANTAGE',
      };
    }
  }

  const executionClass: Ex5ExecutionClass =
    input.physicalOrSimulator === 'SIMULATOR'
      ? 'SIMULATED_QUANTUM'
      : physicalQpuVerified
        ? 'PHYSICAL_QPU_VERIFIED'
        : input.executionClass === 'PHYSICAL_QPU_VERIFIED' && !physicalQpuVerified
          ? 'CLASSICAL'
          : input.executionClass;

  const receipt: QpuExecutionReceipt = {
    receiptId: input.receiptId,
    jobId: input.jobId,
    missionId: input.missionId,
    taskId: input.taskId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    providerId: input.providerId,
    backendId: input.backendId,
    physicalOrSimulator: input.physicalOrSimulator,
    executionClass,
    physicalJobCompleted: input.physicalJobCompleted,
    mocked: input.mocked,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    shots: input.shots,
    resultDigest: input.resultDigest,
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    rawCredentialsPresent: false,
    physicalQpuVerified,
    quantumAdvantageVerified: false,
    classicalBaselineCompared: input.classicalBaselineCompared === true,
    reproducibleBenchmark: input.reproducibleBenchmark === true,
    reviewGatePassed: input.reviewGatePassed === true,
    limitations: [
      ...(input.limitations ?? []),
      ...(input.mocked ? ['mocked-registry-or-adapter'] : []),
      'quantum-advantage-not-claimed-from-physical-execution-alone',
    ],
    l4Enabled: false,
    guardianRlsUnchanged: true,
  };

  return { ok: true, receipt };
}

/**
 * Evaluate whether a receipt earns PHYSICAL_QPU_VERIFIED.
 * Real job receipt required; mocked registry flow never qualifies.
 */
export function evaluatePhysicalQpuVerified(receipt: QpuExecutionReceipt): {
  physicalQpuVerified: boolean;
  reason: string;
} {
  if (receipt.mocked) {
    return { physicalQpuVerified: false, reason: 'MOCKED_FLOW_NOT_PHYSICAL_VERIFICATION' };
  }
  if (receipt.physicalOrSimulator !== 'PHYSICAL_QPU') {
    return { physicalQpuVerified: false, reason: 'NOT_PHYSICAL_BACKEND' };
  }
  if (!receipt.physicalJobCompleted || !receipt.resultDigest) {
    return { physicalQpuVerified: false, reason: 'REAL_JOB_RECEIPT_REQUIRED' };
  }
  return { physicalQpuVerified: true, reason: 'REAL_PHYSICAL_JOB_RECEIPT' };
}

export function evaluateAdvantageFromReceipt(receipt: QpuExecutionReceipt): {
  quantumAdvantageVerified: false;
  allowed: boolean;
  reason: string;
  missing: readonly string[];
} {
  const missing: string[] = [];
  if (!receipt.physicalQpuVerified) missing.push('PHYSICAL_QPU_VERIFIED');
  if (!receipt.classicalBaselineCompared) missing.push('CLASSICAL_BASELINE');
  if (!receipt.reproducibleBenchmark) missing.push('REPRODUCIBLE_BENCHMARK');
  if (!receipt.reviewGatePassed) missing.push('REVIEW_GATE');
  return {
    quantumAdvantageVerified: false,
    allowed: missing.length === 0,
    reason:
      missing.length === 0
        ? 'ADVANTAGE_GATES_MET_BUT_EX5_DOES_NOT_AUTO_CLAIM'
        : `PHYSICAL_EXECUTION_ALONE_INSUFFICIENT:${missing.join('+')}`,
    missing,
  };
}
