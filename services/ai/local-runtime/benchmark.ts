/**
 * 62L-EL5 — GPU/accelerator capability benchmark recorder.
 *
 * Required fields: model, provider, latency, memory/resource use, timestamp, errors.
 * Without bounded inference evidence, executionState stays NOT_TESTED.
 * Does not install drivers, elevate permissions, or mutate system configuration.
 */

import type { CapabilityState } from './types';
import { EL5_LOCKS, resolveGpuExecutionState } from './amd-gpu-capability';

export type GpuCapabilityBenchmarkInput = {
  model: string;
  provider: string;
  /** Latency in milliseconds when measured; omit/undefined when not run. */
  latencyMs?: number;
  /** Memory/resource use in bytes when measured. */
  memoryBytes?: number;
  resourceNotes?: string;
  errors?: string[];
  /** Must be true only when a real model load + bounded inference completed. */
  boundedInferenceCompleted?: boolean;
  inferenceSucceeded?: boolean;
  hardwareState?: CapabilityState;
  timestamp?: string;
};

export type GpuCapabilityBenchmarkRecord = {
  model: string;
  provider: string;
  latencyMs: number | null;
  memoryBytes: number | null;
  resourceNotes: string;
  timestamp: string;
  errors: string[];
  executionState: CapabilityState;
  boundedInferenceCompleted: boolean;
  systemConfigChanged: false;
  driverInstalled: false;
  permissionsElevated: false;
  l4AutonomyEnabled: false;
  reason: string;
};

function idSuffix() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Record a GPU capability benchmark attempt.
 * Fixtures/unit tests must not fake VERIFIED without boundedInferenceCompleted.
 */
export function recordGpuCapabilityBenchmark(
  input: GpuCapabilityBenchmarkInput,
): GpuCapabilityBenchmarkRecord {
  const bounded = input.boundedInferenceCompleted === true;
  const resolved = resolveGpuExecutionState({
    boundedInferenceCompleted: bounded,
    inferenceSucceeded: input.inferenceSucceeded,
    hardwareState: input.hardwareState ?? 'DETECTED',
  });

  const errors = [...(input.errors ?? [])];
  if (!bounded) {
    errors.push('BOUNDED_INFERENCE_NOT_RUN');
  }

  return {
    model: input.model,
    provider: input.provider,
    latencyMs: typeof input.latencyMs === 'number' ? input.latencyMs : null,
    memoryBytes: typeof input.memoryBytes === 'number' ? input.memoryBytes : null,
    resourceNotes: input.resourceNotes ?? 'resource use not measured',
    timestamp: input.timestamp ?? new Date().toISOString(),
    errors,
    executionState: resolved.executionState,
    boundedInferenceCompleted: bounded,
    systemConfigChanged: false,
    driverInstalled: false,
    permissionsElevated: false,
    l4AutonomyEnabled: EL5_LOCKS.L4_AUTONOMY_ENABLED,
    reason: resolved.reason,
  };
}

/** Simulator-only classical CPU timing used when GPU path is not verified — not a GPU claim. */
export function recordCpuFallbackBenchmark(input: {
  model: string;
  latencyMs: number;
  memoryBytes?: number;
  errors?: string[];
}): GpuCapabilityBenchmarkRecord {
  return recordGpuCapabilityBenchmark({
    model: input.model,
    provider: 'cpu-fallback',
    latencyMs: input.latencyMs,
    memoryBytes: input.memoryBytes,
    resourceNotes: `cpu-fallback:${idSuffix()}`,
    errors: input.errors,
    boundedInferenceCompleted: false,
    hardwareState: 'DETECTED',
  });
}
