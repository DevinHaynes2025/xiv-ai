/**
 * 62L-EM C — AMD Accelerator Benchmark
 *
 * GPU/NPU may reach VERIFIED only after a successful measured inference benchmark.
 * Otherwise remain DETECTED / SUPPORTED / NOT_TESTED.
 * CPU baseline is always available as deterministic fallback.
 */

import type { CapabilityState, ComputeCapability, ComputeKind, HardwareSnapshot } from './types';
import { EM_LOCKS } from './honesty';
import { routeWorkload } from './workload-router';

export type AcceleratorBenchmarkInput = {
  target: ComputeKind;
  /** Hardware previously detected (name/vendor). */
  detected?: boolean;
  /** Docs/drivers indicate support. */
  supported?: boolean;
  /** Measured inference benchmark completed successfully. */
  inferenceBenchmarkSucceeded?: boolean;
  /** Measured metrics (latency, throughput) — required for VERIFIED. */
  metrics?: { latencyMs?: number; throughputOps?: number; notes?: string[] };
  claimVerifiedWithoutBenchmark?: boolean;
};

export type AcceleratorBenchmarkResult = {
  target: ComputeKind;
  state: CapabilityState;
  verified: boolean;
  cpuFallbackAvailable: true;
  metrics?: AcceleratorBenchmarkInput['metrics'];
  reason: string;
  locks: { AMD_ACCELERATOR_VERIFIED_WITHOUT_BENCHMARK: false; DETECTED_EQ_VERIFIED: false };
};

export function runAmdAcceleratorBenchmark(
  input: AcceleratorBenchmarkInput,
): AcceleratorBenchmarkResult {
  const locks = {
    AMD_ACCELERATOR_VERIFIED_WITHOUT_BENCHMARK: EM_LOCKS.AMD_ACCELERATOR_VERIFIED_WITHOUT_BENCHMARK,
    DETECTED_EQ_VERIFIED: EM_LOCKS.DETECTED_EQ_VERIFIED,
  };

  if (input.target === 'cpu') {
    return {
      target: 'cpu',
      state: 'VERIFIED',
      verified: true,
      cpuFallbackAvailable: true,
      metrics: input.metrics,
      reason: 'CPU deterministic baseline is always available as fallback.',
      locks,
    };
  }

  if (input.claimVerifiedWithoutBenchmark === true) {
    return {
      target: input.target,
      state: input.detected ? 'DETECTED' : 'NOT_TESTED',
      verified: false,
      cpuFallbackAvailable: true,
      metrics: input.metrics,
      reason: 'DENIED: accelerator VERIFIED requires successful measured inference benchmark.',
      locks,
    };
  }

  if (input.inferenceBenchmarkSucceeded === true && input.metrics) {
    return {
      target: input.target,
      state: 'VERIFIED',
      verified: true,
      cpuFallbackAvailable: true,
      metrics: input.metrics,
      reason: `Measured ${input.target.toUpperCase()} inference benchmark succeeded.`,
      locks,
    };
  }

  if (input.supported === true) {
    return {
      target: input.target,
      state: 'SUPPORTED',
      verified: false,
      cpuFallbackAvailable: true,
      metrics: input.metrics,
      reason: `${input.target.toUpperCase()} indicated supported — still NOT VERIFIED without benchmark.`,
      locks,
    };
  }

  if (input.detected === true) {
    return {
      target: input.target,
      state: 'DETECTED',
      verified: false,
      cpuFallbackAvailable: true,
      metrics: input.metrics,
      reason: `${input.target.toUpperCase()} DETECTED ≠ VERIFIED; CPU fallback remains the safe route.`,
      locks,
    };
  }

  return {
    target: input.target,
    state: 'NOT_TESTED',
    verified: false,
    cpuFallbackAvailable: true,
    metrics: input.metrics,
    reason: `${input.target.toUpperCase()} accelerator path NOT_TESTED.`,
    locks,
  };
}

/**
 * Apply benchmark results onto a hardware snapshot without inventing VERIFIED.
 * Only promotes GPU/NPU to VERIFIED when benchmark.verified === true.
 */
export function applyAcceleratorBenchmarkToSnapshot(
  snapshot: HardwareSnapshot,
  results: AcceleratorBenchmarkResult[],
): HardwareSnapshot {
  const next: HardwareSnapshot = {
    ...snapshot,
    gpus: snapshot.gpus.map((g) => ({ ...g })),
    npus: snapshot.npus.map((n) => ({ ...n })),
    cpu: { ...snapshot.cpu },
    notes: [...snapshot.notes],
  };

  for (const result of results) {
    if (result.target === 'cpu' && result.verified) {
      next.cpu = {
        ...next.cpu,
        state: 'VERIFIED',
        evidence: [...next.cpu.evidence, result.reason],
      };
      continue;
    }

    const list = result.target === 'gpu' ? next.gpus : result.target === 'npu' ? next.npus : null;
    if (!list) continue;

    if (list.length === 0 && result.state !== 'NOT_TESTED') {
      const cap: ComputeCapability = {
        kind: result.target,
        state: result.verified ? 'VERIFIED' : result.state,
        evidence: [result.reason],
      };
      list.push(cap);
      continue;
    }

    for (const item of list) {
      if (result.verified) {
        item.state = 'VERIFIED';
        item.evidence = [...item.evidence, result.reason];
      } else if (result.state === 'SUPPORTED' && item.state === 'DETECTED') {
        item.state = 'SUPPORTED';
        item.evidence = [...item.evidence, result.reason];
      } else if (item.state === 'UNKNOWN' || item.state === 'NOT_TESTED') {
        item.state = result.state;
        item.evidence = [...item.evidence, result.reason];
      } else {
        item.evidence = [...item.evidence, result.reason];
      }
    }
  }

  next.notes.push(
    'AMD accelerator VERIFIED only after measured inference benchmark; otherwise DETECTED/SUPPORTED/NOT_TESTED.',
  );
  return next;
}

/** Route using post-benchmark snapshot — unverified accelerators never win. */
export function routeAfterAcceleratorBenchmark(
  snapshot: HardwareSnapshot,
  results: AcceleratorBenchmarkResult[],
) {
  const updated = applyAcceleratorBenchmarkToSnapshot(snapshot, results);
  return {
    snapshot: updated,
    decision: routeWorkload(updated, { preferLocal: true }),
    cpuFallbackAlwaysAvailable: true as const,
  };
}
