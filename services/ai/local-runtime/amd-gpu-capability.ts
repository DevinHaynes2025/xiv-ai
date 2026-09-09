/**
 * 62L-EL5 — AMD GPU capability candidate (evidence-first).
 *
 * Detection may yield DETECTED. Execution stays NOT_TESTED until bounded inference.
 * Candidate runtimes (Windows ML / ONNX Runtime) are recorded as candidates, not proven.
 * Never auto-promotes to VERIFIED. CPU remains the default fallback.
 */

import {
  advanceCapabilityState,
  isDetectedEqualVerified,
} from './capability-truth';
import type {
  CapabilityState,
  ComputeCapability,
  HardwareSnapshot,
  RouteDecision,
} from './types';
import { routeWorkload } from './workload-router';

/** Soft governance locks — unchanged Guardian/RLS/approval posture. */
export const EL5_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  GPU_AUTO_VERIFIED_FORBIDDEN: true as const,
  CPU_DEFAULT_FALLBACK: true as const,
  DRIVER_INSTALL_FORBIDDEN: true as const,
  PERMISSION_ELEVATION_FORBIDDEN: true as const,
  CLOUD_PURCHASE_FORBIDDEN: true as const,
  SYSTEM_CONFIG_CHANGE_FORBIDDEN: true as const,
  PERSONAL_FILE_ACCESS_FORBIDDEN: true as const,
  CREDENTIAL_ACCESS_FORBIDDEN: true as const,
  BROWSER_DATA_ACCESS_FORBIDDEN: true as const,
  UNRELATED_PROCESS_ACCESS_FORBIDDEN: true as const,
} as const;

export type GpuRuntimePathId = 'windows-ml' | 'onnx-runtime';

export type GpuRuntimePathCandidate = {
  id: GpuRuntimePathId;
  label: string;
  status: 'CANDIDATE';
  proven: false;
  notes: string;
};

export const AMD_GPU_RUNTIME_PATH_CANDIDATES: readonly GpuRuntimePathCandidate[] = [
  {
    id: 'windows-ml',
    label: 'Windows ML',
    status: 'CANDIDATE',
    proven: false,
    notes: 'Preferred Windows local inference bridge candidate — not installed/proven by EL5 alone.',
  },
  {
    id: 'onnx-runtime',
    label: 'ONNX Runtime',
    status: 'CANDIDATE',
    proven: false,
    notes: 'ONNX Runtime EP candidate for AMD GPU — candidate only until bounded inference succeeds.',
  },
] as const;

export type AmdGpuCapabilityCandidate = {
  kind: 'gpu';
  vendor: 'AMD';
  name: string;
  /** Initial hardware classification — never auto VERIFIED. */
  hardwareState: Extract<CapabilityState, 'DETECTED'>;
  /** GPU execution remains NOT_TESTED until bounded inference evidence exists. */
  executionState: Extract<CapabilityState, 'NOT_TESTED' | 'VERIFIED' | 'DEGRADED' | 'UNAVAILABLE'>;
  runtimePaths: readonly GpuRuntimePathCandidate[];
  evidence: string[];
  detectedEqualsVerified: false;
  l4AutonomyEnabled: false;
  privacyReadOnly: true;
  systemConfigChanged: false;
};

export type ClassifyAmdGpuInput = {
  name: string;
  vendor?: string;
  evidence?: string[];
};

function looksLikeAmdGpu(name: string, vendor?: string): boolean {
  const hay = `${vendor ?? ''} ${name}`.toLowerCase();
  return (
    hay.includes('amd') ||
    hay.includes('radeon') ||
    hay.includes('advanced micro devices')
  );
}

/**
 * Classify an AMD GPU as a capability *candidate*.
 * Always DETECTED for hardware; execution always starts NOT_TESTED.
 */
export function classifyAmdGpuCandidate(input: ClassifyAmdGpuInput): AmdGpuCapabilityCandidate | null {
  if (!looksLikeAmdGpu(input.name, input.vendor)) return null;

  return {
    kind: 'gpu',
    vendor: 'AMD',
    name: input.name,
    hardwareState: 'DETECTED',
    executionState: 'NOT_TESTED',
    runtimePaths: AMD_GPU_RUNTIME_PATH_CANDIDATES,
    evidence: [
      ...(input.evidence ?? []),
      'EL5 classifies AMD/Radeon visibility as DETECTED only.',
      'DETECTED ≠ VERIFIED; GPU execution remains NOT_TESTED until bounded inference.',
    ],
    detectedEqualsVerified: isDetectedEqualVerified(),
    l4AutonomyEnabled: EL5_LOCKS.L4_AUTONOMY_ENABLED,
    privacyReadOnly: true,
    systemConfigChanged: false,
  };
}

export function classifyAmdGpusFromSnapshot(
  snapshot: HardwareSnapshot,
): AmdGpuCapabilityCandidate[] {
  const out: AmdGpuCapabilityCandidate[] = [];
  for (const gpu of snapshot.gpus) {
    if (!gpu.name) continue;
    const candidate = classifyAmdGpuCandidate({
      name: gpu.name,
      vendor: gpu.vendor,
      evidence: gpu.evidence,
    });
    if (candidate) out.push(candidate);
  }
  return out;
}

/**
 * Refuse auto-promotion of a DETECTED AMD GPU to VERIFIED.
 */
export function refuseAmdGpuAutoVerify(candidate: AmdGpuCapabilityCandidate) {
  const attempt = advanceCapabilityState(candidate.hardwareState, 'VERIFIED');
  return {
    ...attempt,
    allowed: false as const,
    claimedVerified: false as const,
    executionState: candidate.executionState,
    reason: attempt.allowed
      ? 'DENY_AUTO_VERIFY_EVEN_IF_CHAIN_WOULD_ALLOW'
      : attempt.reason,
  };
}

/**
 * Promote GPU execution state only when bounded inference actually completed.
 * Without that evidence, state remains NOT_TESTED (never jumps to VERIFIED).
 */
export function resolveGpuExecutionState(input: {
  boundedInferenceCompleted: boolean;
  inferenceSucceeded?: boolean;
  hardwareState: CapabilityState;
}): {
  executionState: CapabilityState;
  hardwarePromotion: ReturnType<typeof advanceCapabilityState> | null;
  reason: string;
} {
  if (!input.boundedInferenceCompleted) {
    return {
      executionState: 'NOT_TESTED',
      hardwarePromotion: null,
      reason: 'GPU_EXECUTION_NOT_TESTED_UNTIL_BOUNDED_INFERENCE',
    };
  }

  if (!input.inferenceSucceeded) {
    return {
      executionState: 'UNAVAILABLE',
      hardwarePromotion: null,
      reason: 'BOUNDED_INFERENCE_FAILED_GPU_UNAVAILABLE_CPU_FALLBACK_REQUIRED',
    };
  }

  // Even with successful bounded inference, hardware must walk DETECTED → SUPPORTED → VERIFIED.
  // EL5 records success as evidence toward SUPPORTED, not an automatic VERIFIED claim.
  const toSupported = advanceCapabilityState(input.hardwareState, 'SUPPORTED');
  if (input.hardwareState === 'DETECTED') {
    return {
      executionState: 'SUPPORTED',
      hardwarePromotion: toSupported,
      reason: 'BOUNDED_INFERENCE_OK_HARDWARE_MAY_BECOME_SUPPORTED_NOT_AUTO_VERIFIED',
    };
  }

  if (input.hardwareState === 'SUPPORTED') {
    const toVerified = advanceCapabilityState('SUPPORTED', 'VERIFIED');
    return {
      executionState: toVerified.allowed ? 'VERIFIED' : 'SUPPORTED',
      hardwarePromotion: toVerified,
      reason: toVerified.allowed
        ? 'BOUNDED_INFERENCE_OK_FROM_SUPPORTED_MAY_VERIFY'
        : 'VERIFY_DENIED',
    };
  }

  return {
    executionState: 'NOT_TESTED',
    hardwarePromotion: null,
    reason: 'INSUFFICIENT_HARDWARE_STATE_FOR_GPU_VERIFY',
  };
}

export type GpuExecutionAttempt = {
  preferGpu?: boolean;
  gpuHardwareState: CapabilityState;
  gpuExecutionState: CapabilityState;
  boundedInferenceCompleted?: boolean;
  inferenceSucceeded?: boolean;
  error?: string;
};

export type GpuExecutionOutcome = {
  compute: 'cpu' | 'gpu';
  fallbackToCpu: boolean;
  capabilityState: CapabilityState;
  reason: string;
  errors: string[];
};

/**
 * Attempt GPU execution only when VERIFIED; otherwise safe CPU fallback.
 * Failed / unsupported / NOT_TESTED GPU paths never become the selected compute.
 */
export function attemptGpuOrFallbackCpu(input: GpuExecutionAttempt): GpuExecutionOutcome {
  const errors = input.error ? [input.error] : [];

  if (
    input.preferGpu &&
    input.gpuHardwareState === 'VERIFIED' &&
    input.gpuExecutionState === 'VERIFIED' &&
    input.boundedInferenceCompleted &&
    input.inferenceSucceeded
  ) {
    return {
      compute: 'gpu',
      fallbackToCpu: false,
      capabilityState: 'VERIFIED',
      reason: 'GPU_VERIFIED_BOUNDED_INFERENCE_PRESENT',
      errors,
    };
  }

  if (input.error || input.inferenceSucceeded === false) {
    errors.push('GPU_EXECUTION_FAILED_OR_UNSUPPORTED');
  }

  return {
    compute: 'cpu',
    fallbackToCpu: true,
    capabilityState: 'DETECTED',
    reason: 'CPU_SAFE_FALLBACK_GPU_NOT_VERIFIED_OR_FAILED',
    errors,
  };
}

/** Soft-wire existing CPU-first router: DETECTED AMD GPU never wins over CPU. */
export function routeWithAmdGpuCandidatePolicy(
  snapshot: HardwareSnapshot,
): RouteDecision & { amdCandidates: AmdGpuCapabilityCandidate[] } {
  const amdCandidates = classifyAmdGpusFromSnapshot(snapshot);
  const decision = routeWorkload(snapshot, { preferLocal: true });
  return { ...decision, amdCandidates };
}

export function toComputeCapability(candidate: AmdGpuCapabilityCandidate): ComputeCapability {
  return {
    kind: 'gpu',
    name: candidate.name,
    vendor: candidate.vendor,
    state: candidate.hardwareState,
    evidence: candidate.evidence,
  };
}
