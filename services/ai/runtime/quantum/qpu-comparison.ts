/**
 * 62L-EX6 — Baseline link + comparison receipt + Home Base return + neural pathways.
 * Physical verification ≠ quantum advantage. Physical vs sim pathways stay separate.
 * Reputation never lifts permissions.
 */

import { createHash } from 'node:crypto';

import { computeReceiptHash } from './qpu-receipt.ts';
import { assertReceiptScope } from './qpu-reconciliation.ts';
import {
  CANONICAL_PATHWAY,
  type ComparisonReceipt,
  type NeuralPathwayRecord,
  type PhysicalQpuExecutionReceipt,
} from './types.ts';

export type BaselineLink = {
  baselineReceiptId: string;
  tenantId: string;
  universeId: string;
  algorithm: string;
  problemHash: string | null;
  runtimeMs: number | null;
  costUsd: number | null;
  qualityScore: number | null;
};

export type ComparePhysicalInput = {
  comparisonId: string;
  physicalReceipt: PhysicalQpuExecutionReceipt;
  baseline: BaselineLink | null;
  actorTenantId: string;
  actorUniverseId: string;
  /** Optional candidate metrics — never alone enough for advantage. */
  physicalRuntimeMs?: number | null;
  physicalCostUsd?: number | null;
  physicalQualityScore?: number | null;
};

/**
 * Link classical baseline to physical receipt (scope-checked).
 */
export function linkBaselineToReceipt(
  receipt: PhysicalQpuExecutionReceipt,
  baseline: BaselineLink,
  actor: { tenantId: string; universeId: string },
):
  | { ok: true; receipt: PhysicalQpuExecutionReceipt }
  | { ok: false; reason: string } {
  const scope = assertReceiptScope(receipt, actor);
  if (!scope.ok) return { ok: false, reason: scope.reason };
  if (baseline.tenantId !== actor.tenantId) {
    return { ok: false, reason: 'CROSS_TENANT_BASELINE_DENIED' };
  }
  if (baseline.universeId !== actor.universeId) {
    return { ok: false, reason: 'CROSS_UNIVERSE_BASELINE_DENIED' };
  }
  const body: Omit<PhysicalQpuExecutionReceipt, 'receiptHash'> = {
    ...receipt,
    baselineReceiptId: baseline.baselineReceiptId,
    quantumAdvantageVerified: false,
  };
  return { ok: true, receipt: { ...body, receiptHash: computeReceiptHash(body) } };
}

/**
 * Comparison receipt — physical verification never implies quantum advantage.
 */
export function createComparisonReceipt(input: ComparePhysicalInput): ComparisonReceipt {
  const reasons: string[] = [];
  let comparable = true;

  if (input.physicalReceipt.tenantId !== input.actorTenantId) {
    comparable = false;
    reasons.push('CROSS_TENANT_COMPARISON_DENIED');
  }
  if (input.physicalReceipt.universeId !== input.actorUniverseId) {
    comparable = false;
    reasons.push('CROSS_UNIVERSE_COMPARISON_DENIED');
  }
  if (!input.baseline) {
    comparable = false;
    reasons.push('BASELINE_REQUIRED_FOR_COMPARISON');
  } else {
    if (input.baseline.tenantId !== input.actorTenantId) {
      comparable = false;
      reasons.push('CROSS_TENANT_BASELINE_DENIED');
    }
    if (input.baseline.universeId !== input.actorUniverseId) {
      comparable = false;
      reasons.push('CROSS_UNIVERSE_BASELINE_DENIED');
    }
    if (
      input.baseline.problemHash &&
      input.physicalReceipt.problemHash &&
      input.baseline.problemHash !== input.physicalReceipt.problemHash
    ) {
      comparable = false;
      reasons.push('PROBLEM_HASH_MISMATCH_NOT_COMPARABLE');
    }
  }

  // Physical verification ≠ advantage — always false here.
  reasons.push('PHYSICAL_VERIFICATION_NEQ_QUANTUM_ADVANTAGE');

  return {
    comparisonId: input.comparisonId,
    physicalReceiptId: input.physicalReceipt.receiptId,
    baselineReceiptId: input.baseline?.baselineReceiptId ?? null,
    tenantId: input.actorTenantId,
    universeId: input.actorUniverseId,
    comparable,
    reasons,
    physicalFaster: null,
    physicalCheaper: null,
    physicalSuperior: null,
    quantumAdvantageVerified: false,
    createdAt: new Date().toISOString(),
  };
}

export type HomeBaseReturn = {
  accepted: boolean;
  returnPath: string;
  receiptId: string;
  verificationState: PhysicalQpuExecutionReceipt['verificationState'];
  physicalQpuVerified: boolean;
  quantumAdvantageVerified: false;
  neuralPathwayId: string | null;
  reasons: readonly string[];
};

/**
 * Return receipt to XIV Home Base — no hidden CoT, no permission lift.
 */
export function returnReceiptToHomeBase(
  receipt: PhysicalQpuExecutionReceipt,
  actor: { tenantId: string; universeId: string },
  opts?: { hiddenChainOfThought?: unknown },
): HomeBaseReturn {
  if (opts?.hiddenChainOfThought !== undefined) {
    return {
      accepted: false,
      returnPath: receipt.returnPath,
      receiptId: receipt.receiptId,
      verificationState: receipt.verificationState,
      physicalQpuVerified: false,
      quantumAdvantageVerified: false,
      neuralPathwayId: null,
      reasons: ['HIDDEN_COT_PERSISTENCE_DENIED'],
    };
  }
  const scope = assertReceiptScope(receipt, actor);
  if (!scope.ok) {
    return {
      accepted: false,
      returnPath: receipt.returnPath,
      receiptId: receipt.receiptId,
      verificationState: 'DENIED',
      physicalQpuVerified: false,
      quantumAdvantageVerified: false,
      neuralPathwayId: null,
      reasons: [scope.reason],
    };
  }
  return {
    accepted: true,
    returnPath: receipt.returnPath,
    receiptId: receipt.receiptId,
    verificationState: receipt.verificationState,
    physicalQpuVerified: receipt.physicalQpuVerified,
    quantumAdvantageVerified: false,
    neuralPathwayId: receipt.neuralPathwayId,
    reasons: ['RETURNED_TO_HOME_BASE'],
  };
}

/**
 * Neural pathway — physical and simulated pathways are separate; never conflated.
 */
export function recordNeuralPathway(
  receipt: PhysicalQpuExecutionReceipt,
): NeuralPathwayRecord {
  const pathwayKind =
    receipt.actualExecutionClass === 'PHYSICAL_QPU'
      ? 'PHYSICAL_QPU'
      : receipt.actualExecutionClass === 'SIMULATED_QUANTUM'
        ? 'SIMULATED_QUANTUM'
        : receipt.actualExecutionClass === 'QUANTUM_INSPIRED'
          ? 'QUANTUM_INSPIRED'
          : 'CLASSICAL';

  const pathwayId = createHash('sha256')
    .update(`${pathwayKind}:${receipt.receiptId}:${receipt.missionId}`)
    .digest('hex')
    .slice(0, 24);

  return {
    pathwayId,
    pathwayKind,
    receiptId: receipt.receiptId,
    missionId: receipt.missionId,
    tenantId: receipt.tenantId,
    universeId: receipt.universeId,
    hops: [...CANONICAL_PATHWAY],
    physicalVsSimSeparated: true,
    createdAt: new Date().toISOString(),
  };
}

/** Reputation may record delta but never lifts permissions. */
export function applyReputationDelta(
  receipt: PhysicalQpuExecutionReceipt,
  delta: number,
): PhysicalQpuExecutionReceipt {
  const body: Omit<PhysicalQpuExecutionReceipt, 'receiptHash'> = {
    ...receipt,
    reputationDelta: receipt.reputationDelta + delta,
    reputationLiftsPermissions: false,
  };
  return { ...body, receiptHash: computeReceiptHash(body) };
}

export function attachComparisonAndPathway(
  receipt: PhysicalQpuExecutionReceipt,
  comparison: ComparisonReceipt,
  pathway: NeuralPathwayRecord,
): PhysicalQpuExecutionReceipt {
  const body: Omit<PhysicalQpuExecutionReceipt, 'receiptHash'> = {
    ...receipt,
    comparisonReceiptId: comparison.comparisonId,
    neuralPathwayId: pathway.pathwayId,
    quantumAdvantageVerified: false,
  };
  return { ...body, receiptHash: computeReceiptHash(body) };
}
