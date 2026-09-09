/**
 * 62L-EW8 — NVIDIA benchmark ledger + neural pathway + cross-vendor compare.
 *
 * Measured paths update preference/confidence only — never permissions.
 * Compare equivalent workloads only; material differences → NOT_COMPARABLE.
 */

import {
  EW8_LOCKS,
  type ActualExecutionDevice,
  type FailureClass,
  type ResultState,
} from './ew8-types.ts';

export type BenchmarkRecord = {
  benchmarkId: string;
  workloadId: string;
  workloadGenomeHash: string;
  vendor: 'NVIDIA' | 'AMD' | 'INTEL' | 'ARM' | 'APPLE' | 'QUALCOMM' | 'CPU' | 'OTHER';
  device: ActualExecutionDevice;
  runtimeProvider: string;
  modelId: string;
  modelVersion: string;
  precision: string;
  batchSize: number;
  latencyMs: number;
  throughputItemsPerSec: number | null;
  vramMbPeak: number | null;
  resultState: ResultState;
  fallbackUsed: boolean;
  measuredAt: string;
  evidenceRefs: readonly string[];
  tenantId: string;
  universeId: string;
};

export type NeuralPathwayWeight = {
  pathId: string;
  preference: number;
  confidence: number;
  /** Permissions never change via pathway updates. */
  permissionsUnchanged: true;
  lastUpdatedAt: string;
  notes: readonly string[];
};

export type CrossVendorCompareInput = {
  left: BenchmarkRecord;
  right: BenchmarkRecord;
  /** Material difference keys that force NOT_COMPARABLE. */
  materialKeys?: readonly string[];
};

export type CrossVendorCompareResult =
  | {
      comparable: true;
      winner: 'left' | 'right' | 'tie';
      deltaLatencyMs: number;
      notes: string[];
    }
  | {
      comparable: false;
      failureClass: 'NOT_COMPARABLE';
      reason: string;
      notes: string[];
    };

export type BenchmarkLedger = {
  retain(record: BenchmarkRecord): { retained: true } | { denied: true; reason: string };
  get(benchmarkId: string): BenchmarkRecord | undefined;
  listForWorkload(
    workloadId: string,
    tenantId: string,
    universeId: string,
  ): readonly BenchmarkRecord[];
  updatePathway(
    pathId: string,
    preferenceDelta: number,
    confidenceDelta: number,
  ): NeuralPathwayWeight | { denied: true; reason: string };
  getPathway(pathId: string): NeuralPathwayWeight | undefined;
};

export function createBenchmarkLedger(): BenchmarkLedger {
  const byId = new Map<string, BenchmarkRecord>();
  const pathways = new Map<string, NeuralPathwayWeight>();

  return {
    retain(record) {
      if (EW8_LOCKS.CHILD_EXTRA_DATA_AUTHORITY !== false) {
        return {
          denied: true,
          reason: 'LOCK_VIOLATION_CHILD_EXTRA_DATA_AUTHORITY',
        };
      }
      byId.set(record.benchmarkId, Object.freeze({ ...record }));
      return { retained: true };
    },
    get(benchmarkId) {
      return byId.get(benchmarkId);
    },
    listForWorkload(workloadId, tenantId, universeId) {
      return [...byId.values()].filter(
        (r) =>
          r.workloadId === workloadId &&
          r.tenantId === tenantId &&
          r.universeId === universeId,
      );
    },
    updatePathway(pathId, preferenceDelta, confidenceDelta) {
      if (EW8_LOCKS.NEURAL_PATHWAY_MAY_INCREASE_PERMISSIONS !== false) {
        return {
          denied: true,
          reason: 'LOCK_VIOLATION_NEURAL_PATHWAY_PERMISSIONS',
        };
      }
      const prev = pathways.get(pathId) ?? {
        pathId,
        preference: 0,
        confidence: 0.1,
        permissionsUnchanged: true as const,
        lastUpdatedAt: new Date(0).toISOString(),
        notes: [],
      };
      const next: NeuralPathwayWeight = {
        pathId,
        preference: clamp(prev.preference + preferenceDelta, -10, 10),
        confidence: clamp(prev.confidence + confidenceDelta, 0, 1),
        permissionsUnchanged: true,
        lastUpdatedAt: new Date().toISOString(),
        notes: [
          ...prev.notes,
          'Pathway preference/confidence updated — permissions unchanged.',
        ],
      };
      pathways.set(pathId, next);
      return next;
    },
    getPathway(pathId) {
      return pathways.get(pathId);
    },
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Compare equivalent workloads only.
 * Material differences (model, precision, batch, genome, privacy class) → NOT_COMPARABLE.
 */
export function compareCrossVendor(
  input: CrossVendorCompareInput,
): CrossVendorCompareResult {
  const { left, right } = input;
  const notes: string[] = [];
  const material = input.materialKeys ?? [
    'workloadId',
    'workloadGenomeHash',
    'modelId',
    'modelVersion',
    'precision',
    'batchSize',
  ];

  for (const key of material) {
    const lv = (left as Record<string, unknown>)[key];
    const rv = (right as Record<string, unknown>)[key];
    if (lv !== rv) {
      return {
        comparable: false,
        failureClass: 'NOT_COMPARABLE',
        reason: `Material difference on ${key}: ${String(lv)} ≠ ${String(rv)}`,
        notes: [`Cross-vendor compare requires equivalent workloads.`],
      };
    }
  }

  if (left.fallbackUsed !== right.fallbackUsed) {
    notes.push(
      'Fallback asymmetry noted — comparison allowed only if genomes match; interpret cautiously.',
    );
  }

  const delta = left.latencyMs - right.latencyMs;
  const winner =
    Math.abs(delta) < 1 ? 'tie' : delta < 0 ? 'left' : 'right';
  notes.push('Equivalent workload compare — preference only, no permission change.');

  return {
    comparable: true,
    winner,
    deltaLatencyMs: delta,
    notes,
  };
}

export function buildBenchmarkFromExecution(input: {
  benchmarkId: string;
  workloadId: string;
  workloadGenomeHash: string;
  device: ActualExecutionDevice;
  runtimeProvider: string;
  modelId: string;
  modelVersion: string;
  precision: string;
  batchSize: number;
  latencyMs: number;
  throughputItemsPerSec: number | null;
  vramMbPeak: number | null;
  resultState: ResultState;
  fallbackUsed: boolean;
  evidenceRefs: readonly string[];
  tenantId: string;
  universeId: string;
}): BenchmarkRecord {
  return {
    benchmarkId: input.benchmarkId,
    workloadId: input.workloadId,
    workloadGenomeHash: input.workloadGenomeHash,
    vendor: input.device === 'CPU' || input.device === 'CPU_ONNX' ? 'CPU' : 'NVIDIA',
    device: input.device,
    runtimeProvider: input.runtimeProvider,
    modelId: input.modelId,
    modelVersion: input.modelVersion,
    precision: input.precision,
    batchSize: input.batchSize,
    latencyMs: input.latencyMs,
    throughputItemsPerSec: input.throughputItemsPerSec,
    vramMbPeak: input.vramMbPeak,
    resultState: input.resultState,
    fallbackUsed: input.fallbackUsed,
    measuredAt: new Date().toISOString(),
    evidenceRefs: [...input.evidenceRefs],
    tenantId: input.tenantId,
    universeId: input.universeId,
  };
}

export function notComparableFailure(): {
  failureClass: FailureClass;
  reason: string;
} {
  return {
    failureClass: 'NOT_COMPARABLE',
    reason: 'Material workload differences — NOT_COMPARABLE.',
  };
}
