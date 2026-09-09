/**
 * 62L-EM6 — Later cross-vendor benchmark contract (define only).
 *
 * same model + same input → CPU → AMD GPU/NPU → NVIDIA GPU
 * compare latency, throughput, memory, cost/energy proxy, reliability, output equivalence.
 *
 * Suite is CONTRACT_ONLY / NOT_TESTED until measured on real multi-vendor hardware.
 * Do not require live multi-vendor hardware for EM6 acceptance.
 */

export const EM6_BENCHMARK_CONTRACT_STATUS = 'CONTRACT_ONLY' as const;

export const EM6_BENCHMARK_MEASUREMENT_STATE = 'NOT_TESTED' as const;

export type CrossVendorBenchmarkTarget =
  | 'cpu'
  | 'amd_gpu'
  | 'amd_npu'
  | 'nvidia_gpu';

export type CrossVendorComparisonMetric =
  | 'latency_ms'
  | 'throughput'
  | 'memory_bytes'
  | 'cost_proxy'
  | 'energy_proxy'
  | 'reliability'
  | 'output_equivalence';

export type CrossVendorBenchmarkContract = {
  status: typeof EM6_BENCHMARK_CONTRACT_STATUS;
  measurementState: typeof EM6_BENCHMARK_MEASUREMENT_STATE;
  requiredSameModel: true;
  requiredSameInput: true;
  orderedTargets: readonly CrossVendorBenchmarkTarget[];
  comparisonMetrics: readonly CrossVendorComparisonMetric[];
  liveMultiVendorHardwareRequiredForEm6: false;
  notes: string[];
};

/** Frozen contract definition — not a measured suite. */
export const EM6_CROSS_VENDOR_BENCHMARK_CONTRACT: CrossVendorBenchmarkContract =
  Object.freeze({
    status: EM6_BENCHMARK_CONTRACT_STATUS,
    measurementState: EM6_BENCHMARK_MEASUREMENT_STATE,
    requiredSameModel: true as const,
    requiredSameInput: true as const,
    orderedTargets: ['cpu', 'amd_gpu', 'amd_npu', 'nvidia_gpu'] as const,
    comparisonMetrics: [
      'latency_ms',
      'throughput',
      'memory_bytes',
      'cost_proxy',
      'energy_proxy',
      'reliability',
      'output_equivalence',
    ] as const,
    liveMultiVendorHardwareRequiredForEm6: false as const,
    notes: [
      'CONTRACT_ONLY until measured on authorized hardware.',
      'EM6 does not claim cross-vendor equivalence or NVIDIA VERIFIED from this contract alone.',
    ],
  });

export function describeEm6BenchmarkContract(): CrossVendorBenchmarkContract {
  return EM6_CROSS_VENDOR_BENCHMARK_CONTRACT;
}

/** Honest gate: contract presence never equals measured VERIFIED comparison. */
export function isEm6BenchmarkSuiteMeasured(): false {
  return false;
}
