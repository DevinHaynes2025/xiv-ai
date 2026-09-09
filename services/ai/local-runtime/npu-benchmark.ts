/**
 * 62L-EL6 — NPU capability benchmark / evidence recorder.
 *
 * Captures latency, model, execution provider, timestamp, errors, and resource
 * observations. NPU execution stays NOT_TESTED / non-VERIFIED until a bounded
 * local model load + inference succeeds. Fixtures must not fake VERIFIED without
 * that evidence.
 */

import type { CapabilityState } from './types';
import {
  EL6_LOCKS,
  resolveNpuExecutionState,
  type NpuRuntimePathId,
} from './amd-npu-capability';

export type NpuCapabilityBenchmarkInput = {
  model: string;
  /** Candidate or selected execution provider id/label. */
  executionProvider: string;
  executionProviderPathId?: NpuRuntimePathId;
  /** Latency in milliseconds when measured; omit when not run. */
  latencyMs?: number;
  /** Memory/resource use in bytes when measured. */
  memoryBytes?: number;
  resourceNotes?: string;
  errors?: string[];
  /** Must be true only when a real model load completed. */
  modelLoaded?: boolean;
  /** Must be true only when bounded inference completed. */
  boundedInferenceCompleted?: boolean;
  inferenceSucceeded?: boolean;
  hardwareState?: CapabilityState;
  timestamp?: string;
};

export type NpuCapabilityBenchmarkRecord = {
  model: string;
  executionProvider: string;
  executionProviderPathId: NpuRuntimePathId | 'unspecified';
  latencyMs: number | null;
  memoryBytes: number | null;
  resourceNotes: string;
  timestamp: string;
  errors: string[];
  executionState: CapabilityState;
  boundedInferenceCompleted: boolean;
  modelLoaded: boolean;
  claimedVerified: false | true;
  systemConfigChanged: false;
  driverInstalled: false;
  biosChanged: false;
  permissionsElevated: false;
  powerPlanChanged: false;
  hiddenPersistence: false;
  cloudProvisioning: false;
  externalModelRouting: false;
  l4AutonomyEnabled: false;
  reason: string;
};

/**
 * Record an NPU capability benchmark / evidence attempt.
 * Without modelLoaded + boundedInferenceCompleted success, never VERIFIED.
 */
export function recordNpuCapabilityBenchmark(
  input: NpuCapabilityBenchmarkInput,
): NpuCapabilityBenchmarkRecord {
  const bounded = input.boundedInferenceCompleted === true;
  const modelLoaded = input.modelLoaded === true;
  const resolved = resolveNpuExecutionState({
    boundedInferenceCompleted: bounded,
    modelLoaded,
    inferenceSucceeded: input.inferenceSucceeded,
    hardwareState: input.hardwareState ?? 'DETECTED',
  });

  const errors = [...(input.errors ?? [])];
  if (!bounded) errors.push('BOUNDED_INFERENCE_NOT_RUN');
  if (!modelLoaded) errors.push('MODEL_LOAD_NOT_CONFIRMED');

  return {
    model: input.model,
    executionProvider: input.executionProvider,
    executionProviderPathId: input.executionProviderPathId ?? 'unspecified',
    latencyMs: typeof input.latencyMs === 'number' ? input.latencyMs : null,
    memoryBytes: typeof input.memoryBytes === 'number' ? input.memoryBytes : null,
    resourceNotes: input.resourceNotes ?? 'resource use not measured',
    timestamp: input.timestamp ?? new Date().toISOString(),
    errors,
    executionState: resolved.executionState,
    boundedInferenceCompleted: bounded,
    modelLoaded,
    claimedVerified: resolved.claimedVerified,
    systemConfigChanged: false,
    driverInstalled: false,
    biosChanged: false,
    permissionsElevated: false,
    powerPlanChanged: false,
    hiddenPersistence: false,
    cloudProvisioning: false,
    externalModelRouting: false,
    l4AutonomyEnabled: EL6_LOCKS.L4_AUTONOMY_ENABLED,
    reason: resolved.reason,
  };
}

/** Evidence field checklist helper for tests / ops honesty. */
export function npuEvidenceFieldsPresent(record: NpuCapabilityBenchmarkRecord): {
  ok: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (!record.model) missing.push('model');
  if (!record.executionProvider) missing.push('executionProvider');
  if (!record.timestamp) missing.push('timestamp');
  if (!Array.isArray(record.errors)) missing.push('errors');
  if (record.latencyMs === undefined) missing.push('latencyMs');
  if (!record.resourceNotes) missing.push('resourceNotes');
  return { ok: missing.length === 0, missing };
}
