/**
 * 62L-EX1 — Quantum / classical execution receipts.
 * Records actual device/runtime — never fabricates cloud/QPU execution while offline.
 * Returns evidence to XIV Home Base via returnPath.
 */

import type { ExecutionClass, QuantumMissionContract } from './types';

export type ExecutionReceipt = {
  receiptId: string;
  missionId: string;
  taskId: string;
  agentId: string;
  classification: ExecutionClass;
  requestedDevice: string;
  actualDevice: string;
  requestedRuntime: string;
  actualRuntime: string;
  provider: string | null;
  backend: string | null;
  modelOrAlgorithm: string;
  version: string;
  inputHash: string;
  startedAt: string;
  completedAt: string;
  runtimeMs: number;
  memoryUsage: number;
  cost: number;
  benchmarkId: string | null;
  baselineId: string | null;
  resultState: string;
  outputEvidence: readonly string[];
  limitations: readonly string[];
  fallbackUsed: boolean;
  fallbackReason: string | null;
  returnPath: string;
  tenantId: string;
  universeId: string;
  fabricated: false;
  quantumAdvantageVerified: false | true;
  l4Enabled: false;
  hiddenCotPersisted: false;
  guardianRlsUnchanged: true;
};

export type ReceiptCreateResult =
  | { ok: true; receipt: ExecutionReceipt }
  | { ok: false; reason: string };

export type ExecutionReceiptInput = {
  receiptId: string;
  mission: QuantumMissionContract;
  requestedDevice: string;
  actualDevice: string;
  requestedRuntime: string;
  actualRuntime: string;
  provider?: string | null;
  backend?: string | null;
  modelOrAlgorithm: string;
  version: string;
  inputHash: string;
  startedAt: string;
  completedAt: string;
  runtimeMs: number;
  memoryUsage: number;
  cost?: number;
  benchmarkId?: string | null;
  baselineId?: string | null;
  resultState: string;
  outputEvidence: readonly string[];
  limitations?: readonly string[];
  fallbackUsed?: boolean;
  fallbackReason?: string | null;
  /** Must not claim fabricated QPU while offline/disconnected. */
  claimPhysicalQpu?: boolean;
};

export function createExecutionReceipt(input: ExecutionReceiptInput): ReceiptCreateResult {
  const { mission } = input;

  if (mission.workState === 'OFFLINE_STOPPED' || mission.poweredOff) {
    return { ok: false, reason: 'POWERED_OFF_CANNOT_EMIT_CONTINUED_RECEIPT' };
  }

  if (mission.workState === 'EXPIRED' || mission.status === 'EXPIRED') {
    return { ok: false, reason: 'EXPIRED_MISSION_CANNOT_EMIT_RECEIPT' };
  }

  if (
    input.claimPhysicalQpu === true &&
    (mission.offlineDisconnected || !mission.physicalQpuAvailable)
  ) {
    return { ok: false, reason: 'FABRICATE_CLOUD_QPU_EXECUTION_DENIED' };
  }

  if (
    input.actualDevice !== input.requestedDevice &&
    input.fallbackUsed !== true &&
    !input.fallbackReason
  ) {
    return { ok: false, reason: 'ACTUAL_DEVICE_MISMATCH_REQUIRES_FALLBACK_REASON' };
  }

  if (!input.actualDevice || !input.actualRuntime) {
    return { ok: false, reason: 'ACTUAL_DEVICE_AND_RUNTIME_REQUIRED' };
  }

  const receipt: ExecutionReceipt = {
    receiptId: input.receiptId,
    missionId: mission.missionId,
    taskId: mission.taskId,
    agentId: mission.agentId,
    classification: mission.classification,
    requestedDevice: input.requestedDevice,
    actualDevice: input.actualDevice,
    requestedRuntime: input.requestedRuntime,
    actualRuntime: input.actualRuntime,
    provider: input.provider ?? null,
    backend: input.backend ?? null,
    modelOrAlgorithm: input.modelOrAlgorithm,
    version: input.version,
    inputHash: input.inputHash,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    runtimeMs: input.runtimeMs,
    memoryUsage: input.memoryUsage,
    cost: input.cost ?? 0,
    benchmarkId: input.benchmarkId ?? null,
    baselineId: input.baselineId ?? mission.classicalBaselineId,
    resultState: input.resultState,
    outputEvidence: [...input.outputEvidence],
    limitations: [...(input.limitations ?? [])],
    fallbackUsed: input.fallbackUsed === true,
    fallbackReason: input.fallbackReason ?? null,
    returnPath: mission.returnPath,
    tenantId: mission.tenantId,
    universeId: mission.universeId,
    fabricated: false,
    quantumAdvantageVerified: mission.quantumAdvantageVerified,
    l4Enabled: false,
    hiddenCotPersisted: false,
    guardianRlsUnchanged: true,
  };

  return { ok: true, receipt };
}

/** Complete mission to Home Base with receipt — no hidden CoT. */
export function completeMissionWithReceipt(
  mission: QuantumMissionContract,
  receiptInput: Omit<ExecutionReceiptInput, 'mission'> & {
    hiddenChainOfThought?: unknown;
  },
):
  | { ok: true; mission: QuantumMissionContract; receipt: ExecutionReceipt }
  | { ok: false; reason: string } {
  if (receiptInput.hiddenChainOfThought !== undefined) {
    return { ok: false, reason: 'HIDDEN_COT_PERSISTENCE_DENIED' };
  }
  if (mission.workState === 'WAITING_PROVIDER') {
    return { ok: false, reason: 'CANNOT_COMPLETE_WHILE_WAITING_PROVIDER' };
  }
  if (mission.workState === 'OFFLINE_STOPPED') {
    return { ok: false, reason: 'CANNOT_COMPLETE_WHILE_OFFLINE_STOPPED' };
  }

  const created = createExecutionReceipt({
    ...receiptInput,
    mission,
  });
  if (!created.ok) {
    return created;
  }

  return {
    ok: true,
    mission: {
      ...mission,
      workState: 'COMPLETED',
      status: 'COMPLETED',
    },
    receipt: created.receipt,
  };
}
