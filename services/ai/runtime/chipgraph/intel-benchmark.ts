/**
 * 62L-EW9 — Intel benchmark ledger + neural pathway preference (routing only).
 *
 * Comparable benchmarks only. Neural pathways strengthen routing weights from
 * measured success — never permissions / Guardian / RLS / tenant / Universe /
 * production authority.
 */

import type { IntelDevice } from './ew9-types.ts';
import { EW9_LOCKS } from './ew9-types.ts';
import type { ComputeExecutionReceipt } from './intel-receipt.ts';

export type IntelBenchmarkEntry = {
  benchmarkId: string;
  workloadId: string;
  modelId: string;
  device: IntelDevice;
  latencyMs: number;
  comparable: boolean;
  vendorFamily: 'INTEL';
  crossVendorComparable: boolean;
  receiptId: string;
  recordedAt: string;
  notes: string;
};

export type NeuralPathwayWeight = {
  pathwayId: string;
  fromDevice: IntelDevice | 'ANY';
  toDevice: IntelDevice;
  weight: number;
  successCount: number;
  failureCount: number;
  /** Explicit: pathway cannot change permissions. */
  permissionsUnchanged: true;
  guardianUnchanged: true;
  rlsUnchanged: true;
};

export type IntelBenchmarkLedger = {
  recordFromReceipt(
    receipt: ComputeExecutionReceipt,
    workloadId: string,
  ): IntelBenchmarkEntry | { denied: true; reason: string };
  listComparable(workloadId: string): readonly IntelBenchmarkEntry[];
  strengthenPathway(
    fromDevice: IntelDevice | 'ANY',
    toDevice: IntelDevice,
    success: boolean,
  ): NeuralPathwayWeight | { denied: true; reason: string };
  listPathways(): readonly NeuralPathwayWeight[];
};

export function createIntelBenchmarkLedger(): IntelBenchmarkLedger {
  const entries: IntelBenchmarkEntry[] = [];
  const pathways = new Map<string, NeuralPathwayWeight>();

  return {
    recordFromReceipt(receipt, workloadId) {
      if (receipt.resultState !== 'PASS' && receipt.resultState !== 'PARTIAL') {
        return {
          denied: true,
          reason: 'Non-PASS receipts are not comparable benchmark entries.',
        };
      }
      const entry: IntelBenchmarkEntry = {
        benchmarkId: `bench-${receipt.receiptId}`,
        workloadId,
        modelId: receipt.modelId,
        device: receipt.actualDevice,
        latencyMs: receipt.latencyMs,
        comparable: !receipt.fallbackUsed || receipt.actualDevice === 'INTEL_CPU',
        vendorFamily: 'INTEL',
        crossVendorComparable: true,
        receiptId: receipt.receiptId,
        recordedAt: receipt.completedAt,
        notes: receipt.fallbackUsed
          ? `Fallback receipt — actual=${receipt.actualDevice}; requested accelerator not verified.`
          : `Measured on ${receipt.actualDevice}.`,
      };
      entries.push(entry);
      return entry;
    },

    listComparable(workloadId) {
      return entries.filter((e) => e.workloadId === workloadId && e.comparable);
    },

    strengthenPathway(fromDevice, toDevice, success) {
      if (EW9_LOCKS.NEURAL_PATHWAY_MAY_INCREASE_PERMISSIONS !== false) {
        return {
          denied: true,
          reason: 'LOCK_VIOLATION_NEURAL_PATHWAY_PERMISSIONS',
        };
      }
      if (EW9_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE !== false) {
        return {
          denied: true,
          reason: 'LOCK_VIOLATION_GUARDIAN_RLS',
        };
      }

      const pathwayId = `${fromDevice}->${toDevice}`;
      const existing = pathways.get(pathwayId) ?? {
        pathwayId,
        fromDevice,
        toDevice,
        weight: 1,
        successCount: 0,
        failureCount: 0,
        permissionsUnchanged: true as const,
        guardianUnchanged: true as const,
        rlsUnchanged: true as const,
      };

      if (success) {
        existing.successCount += 1;
        existing.weight = Math.min(10, existing.weight + 0.1);
      } else {
        existing.failureCount += 1;
        existing.weight = Math.max(0.1, existing.weight - 0.1);
      }

      pathways.set(pathwayId, existing);
      return existing;
    },

    listPathways() {
      return [...pathways.values()];
    },
  };
}

/** Bottleneck classes reused from shared graph vocabulary (soft-wire). */
export const INTEL_BOTTLENECK_CLASSES = [
  'COMPUTE_BOUND',
  'MEMORY_BOUND',
  'CACHE_BOUND',
  'DATA_TRANSFER_BOUND',
  'RUNTIME_BOUND',
  'MODEL_COMPATIBILITY_BOUND',
  'QUEUE_BOUND',
  'I_O_BOUND',
  'NETWORK_BOUND',
  'THERMAL_RESOURCE_BOUND',
  'UNKNOWN',
] as const;

export type IntelBottleneckClass = (typeof INTEL_BOTTLENECK_CLASSES)[number];

export function classifyBottleneckFromReceipt(
  receipt: ComputeExecutionReceipt,
): IntelBottleneckClass {
  if (receipt.failureClass === 'RUNTIME_NOT_CONFIGURED') return 'RUNTIME_BOUND';
  if (receipt.failureClass === 'RUNTIME_UNAVAILABLE') return 'RUNTIME_BOUND';
  if (receipt.resultState === 'RESOURCE_LIMIT') return 'MEMORY_BOUND';
  if (receipt.resultState === 'TIMEOUT') return 'COMPUTE_BOUND';
  if (receipt.fallbackUsed) return 'MODEL_COMPATIBILITY_BOUND';
  if (receipt.resultState === 'PASS') return 'UNKNOWN';
  return 'UNKNOWN';
}
