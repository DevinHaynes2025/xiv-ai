/**
 * 62L-EX2 — Classical baseline contract, library, execution targets, stale detection.
 */

import { createHash } from 'node:crypto';
import {
  CLASSICAL_ALGORITHM_CANDIDATES,
  EX2_LOCKS,
  type BaselineState,
  type ClassicalAlgorithmCandidate,
  type ClassicalBaselineReceipt,
  type CostProxy,
  type DeviceClass,
  type DeviceEvidenceState,
  type EnergyProxy,
  type QualityMetrics,
  type StaleTrigger,
  type SuccessCriteria,
} from './types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hashPayload(payload: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');
}

export type CreateBaselineInput = {
  baselineId: string;
  missionId: string;
  taskId: string;
  tenantId: string;
  universeId: string;
  problemClass: string;
  problemVersion: string;
  algorithmId: string;
  algorithmVersion: string;
  datasetVersion: string;
  problemSize: number;
  seed: number;
  configuration?: Record<string, unknown>;
  precision: string;
  tolerance: number;
  runtimeId: string;
  runtimeVersion: string;
  deviceClass: DeviceClass;
  deviceId: string;
  deviceEvidenceState: DeviceEvidenceState;
  successCriteria: SuccessCriteria;
  evidenceRefs?: readonly string[];
  inputPayload: unknown;
  samplingShots?: number | null;
  requireVerifiedAccelerator?: boolean;
};

export type DeniedBaseline = {
  denied: true;
  state: 'DENIED';
  reason: string;
};

export type BaselineLibraryIndex = {
  byProblemClass: Map<string, ClassicalBaselineReceipt[]>;
  bySize: Map<number, ClassicalBaselineReceipt[]>;
  byAlgorithm: Map<string, ClassicalBaselineReceipt[]>;
  byDevice: Map<string, ClassicalBaselineReceipt[]>;
  byRuntime: Map<string, ClassicalBaselineReceipt[]>;
  byPrecision: Map<string, ClassicalBaselineReceipt[]>;
  byDate: Map<string, ClassicalBaselineReceipt[]>;
  byVersion: Map<string, ClassicalBaselineReceipt[]>;
  all: ClassicalBaselineReceipt[];
};

/**
 * CPU is always eligible. GPU/NPU only when independently VERIFIED
 * (or when VERIFIED is not required and evidence state is recorded truthfully).
 */
export function selectExecutionTarget(input: {
  preferred: DeviceClass;
  deviceEvidenceState: DeviceEvidenceState;
  requireVerifiedAccelerator?: boolean;
}): {
  deviceClass: DeviceClass;
  deviceEvidenceState: DeviceEvidenceState;
  cpuFallback: boolean;
  excludedUnverifiedAccelerator: boolean;
  note: string;
} {
  const requireVerified = input.requireVerifiedAccelerator ?? true;
  if (input.preferred === 'CPU') {
    return {
      deviceClass: 'CPU',
      deviceEvidenceState: input.deviceEvidenceState,
      cpuFallback: false,
      excludedUnverifiedAccelerator: false,
      note: 'CPU target selected (always eligible).',
    };
  }

  if (requireVerified && input.deviceEvidenceState !== 'VERIFIED') {
    return {
      deviceClass: 'CPU',
      deviceEvidenceState: input.deviceEvidenceState,
      cpuFallback: true,
      excludedUnverifiedAccelerator: true,
      note: `${input.preferred} excluded — deviceEvidenceState=${input.deviceEvidenceState} (VERIFIED required); CPU fallback recorded truthfully.`,
    };
  }

  return {
    deviceClass: input.preferred,
    deviceEvidenceState: input.deviceEvidenceState,
    cpuFallback: false,
    excludedUnverifiedAccelerator: false,
    note: `${input.preferred} accepted with evidenceState=${input.deviceEvidenceState}.`,
  };
}

export function isClassicalAlgorithmCandidate(
  id: string,
): id is ClassicalAlgorithmCandidate {
  return (CLASSICAL_ALGORITHM_CANDIDATES as readonly string[]).includes(id);
}

export function defaultEnergyProxy(
  override?: Partial<EnergyProxy>,
): EnergyProxy {
  return {
    state: override?.state ?? 'ENERGY_UNKNOWN',
    value: override?.value ?? null,
    unit: override?.unit ?? null,
    note:
      override?.note ??
      'Energy not fabricated — ENERGY_UNKNOWN until measured or proxy-estimated.',
  };
}

export function defaultCostProxy(override?: Partial<CostProxy>): CostProxy {
  return {
    state: override?.state ?? 'COST_UNKNOWN',
    value: override?.value ?? null,
    currency: override?.currency ?? null,
    note:
      override?.note ??
      'Cost not fabricated — COST_UNKNOWN when unknown (EX2_LOCKS.FABRICATE_COST=false).',
  };
}

/**
 * Create a READY classical baseline receipt (not yet executed).
 */
export function createClassicalBaseline(
  input: CreateBaselineInput,
): ClassicalBaselineReceipt | DeniedBaseline {
  if (!input.tenantId.trim() || !input.universeId.trim()) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'TENANT_AND_UNIVERSE_REQUIRED',
    };
  }

  const target = selectExecutionTarget({
    preferred: input.deviceClass,
    deviceEvidenceState: input.deviceEvidenceState,
    requireVerifiedAccelerator: input.requireVerifiedAccelerator,
  });

  const createdAt = nowIso();
  return {
    baselineId: input.baselineId,
    missionId: input.missionId,
    taskId: input.taskId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    problemClass: input.problemClass,
    problemVersion: input.problemVersion,
    algorithmId: input.algorithmId,
    algorithmVersion: input.algorithmVersion,
    inputHash: hashPayload(input.inputPayload),
    datasetVersion: input.datasetVersion,
    problemSize: input.problemSize,
    seed: input.seed,
    configuration: {
      ...(input.configuration ?? {}),
      executionNote: target.note,
      cpuFallback: target.cpuFallback,
      excludedUnverifiedAccelerator: target.excludedUnverifiedAccelerator,
      preferredDeviceClass: input.deviceClass,
    },
    precision: input.precision,
    tolerance: input.tolerance,
    runtimeId: input.runtimeId,
    runtimeVersion: input.runtimeVersion,
    deviceClass: target.deviceClass,
    deviceId: target.cpuFallback ? 'cpu-fallback' : input.deviceId,
    deviceEvidenceState: target.deviceEvidenceState,
    startedAt: createdAt,
    completedAt: null,
    runtimeMs: null,
    memoryPeakMb: null,
    throughput: null,
    latency: null,
    energyProxy: defaultEnergyProxy(),
    costProxy: defaultCostProxy(),
    outputHash: null,
    qualityMetrics: {
      objectiveValue: null,
      accuracy: null,
      feasibility: null,
      custom: {},
    },
    successCriteria: input.successCriteria,
    evidenceRefs: input.evidenceRefs ?? [],
    baselineState: 'READY',
    reproducibilityState: 'NOT_EVALUATED',
    createdAt,
    staleTriggers: [],
    samplingShots: input.samplingShots ?? null,
  };
}

export type CompleteBaselineInput = {
  receipt: ClassicalBaselineReceipt;
  success: boolean;
  runtimeMs: number;
  memoryPeakMb?: number;
  throughput?: number;
  latency?: number;
  outputPayload: unknown;
  qualityMetrics: QualityMetrics;
  energyProxy?: Partial<EnergyProxy>;
  costProxy?: Partial<CostProxy>;
  evidenceRefs?: readonly string[];
};

/**
 * Complete a baseline run. COMPLETED ≠ REPRODUCIBLE.
 */
export function completeClassicalBaseline(
  input: CompleteBaselineInput,
): ClassicalBaselineReceipt {
  const completedAt = nowIso();
  const baselineState: BaselineState = input.success ? 'COMPLETED' : 'FAILED';
  return {
    ...input.receipt,
    completedAt,
    runtimeMs: input.runtimeMs,
    memoryPeakMb: input.memoryPeakMb ?? null,
    throughput: input.throughput ?? null,
    latency: input.latency ?? null,
    outputHash: hashPayload(input.outputPayload),
    qualityMetrics: input.qualityMetrics,
    energyProxy: defaultEnergyProxy(input.energyProxy),
    costProxy: defaultCostProxy(input.costProxy),
    evidenceRefs: [
      ...input.receipt.evidenceRefs,
      ...(input.evidenceRefs ?? []),
    ],
    baselineState,
    // Explicit: completion never auto-promotes reproducibility.
    reproducibilityState: 'NOT_EVALUATED',
  };
}

export function markBaselineStale(
  receipt: ClassicalBaselineReceipt,
  triggers: readonly StaleTrigger[],
): ClassicalBaselineReceipt {
  if (triggers.length === 0) return receipt;
  return {
    ...receipt,
    baselineState: 'STALE',
    staleTriggers: [...new Set([...receipt.staleTriggers, ...triggers])],
  };
}

export function createBaselineLibrary(
  receipts: readonly ClassicalBaselineReceipt[] = [],
): BaselineLibraryIndex {
  const lib: BaselineLibraryIndex = {
    byProblemClass: new Map(),
    bySize: new Map(),
    byAlgorithm: new Map(),
    byDevice: new Map(),
    byRuntime: new Map(),
    byPrecision: new Map(),
    byDate: new Map(),
    byVersion: new Map(),
    all: [],
  };
  for (const r of receipts) indexBaseline(lib, r);
  return lib;
}

function pushMap<K>(map: Map<K, ClassicalBaselineReceipt[]>, key: K, r: ClassicalBaselineReceipt) {
  const list = map.get(key) ?? [];
  list.push(r);
  map.set(key, list);
}

export function indexBaseline(
  lib: BaselineLibraryIndex,
  receipt: ClassicalBaselineReceipt,
): void {
  lib.all.push(receipt);
  pushMap(lib.byProblemClass, receipt.problemClass, receipt);
  pushMap(lib.bySize, receipt.problemSize, receipt);
  pushMap(lib.byAlgorithm, receipt.algorithmId, receipt);
  pushMap(lib.byDevice, `${receipt.deviceClass}:${receipt.deviceId}`, receipt);
  pushMap(lib.byRuntime, receipt.runtimeId, receipt);
  pushMap(lib.byPrecision, receipt.precision, receipt);
  pushMap(lib.byDate, receipt.createdAt.slice(0, 10), receipt);
  pushMap(
    lib.byVersion,
    `${receipt.problemVersion}|${receipt.algorithmVersion}|${receipt.runtimeVersion}`,
    receipt,
  );
}

/**
 * Stale baselines cannot support strong claims until rerun.
 */
export function baselineSupportsStrongClaim(
  receipt: ClassicalBaselineReceipt,
): { ok: boolean; reason: string } {
  if (receipt.baselineState === 'STALE' || receipt.staleTriggers.length > 0) {
    return {
      ok: false,
      reason: `STALE_BASELINE_BLOCKED: ${receipt.staleTriggers.join(',') || 'STALE'}`,
    };
  }
  if (receipt.baselineState === 'FAILED') {
    return { ok: false, reason: 'FAILED_BASELINE_BLOCKED' };
  }
  if (
    receipt.baselineState !== 'COMPLETED' &&
    receipt.baselineState !== 'REPRODUCIBLE'
  ) {
    return {
      ok: false,
      reason: `BASELINE_STATE_NOT_ELIGIBLE:${receipt.baselineState}`,
    };
  }
  if (EX2_LOCKS.COMPLETED_EQ_REPRODUCIBLE) {
    return { ok: false, reason: 'LOCK_VIOLATION_COMPLETED_EQ_REPRODUCIBLE' };
  }
  return { ok: true, reason: 'BASELINE_ELIGIBLE_FOR_COMPARISON' };
}
