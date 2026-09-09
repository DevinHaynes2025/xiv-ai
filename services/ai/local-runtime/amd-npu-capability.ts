/**
 * 62L-EL6 — AMD Ryzen AI NPU capability candidate (evidence-first).
 *
 * Detection may yield DETECTED only with real device evidence (fixture-simulated
 * evidence allowed for rule tests). Execution stays NOT_TESTED until a bounded
 * local model successfully loads and completes inference.
 *
 * AMD CPU / Ryzen-branded system alone ≠ NPU_DETECTED.
 * Candidate Windows ML / ONNX Runtime EP paths are recorded as candidates, not proven.
 * Never auto-promotes to VERIFIED. Safe degrade: VERIFIED GPU else CPU.
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
import {
  attemptGpuOrFallbackCpu,
  classifyAmdGpusFromSnapshot,
  type AmdGpuCapabilityCandidate,
} from './amd-gpu-capability';
import { routeWorkload } from './workload-router';

/** Soft governance locks — unchanged Guardian/RLS/approval posture. */
export const EL6_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  NPU_AUTO_VERIFIED_FORBIDDEN: true as const,
  AMD_CPU_DOES_NOT_IMPLY_NPU: true as const,
  DETECTED_EQ_VERIFIED: false as const,
  PREFER_VERIFIED_GPU_ELSE_CPU_ON_NPU_FAIL: true as const,
  DRIVER_INSTALL_FORBIDDEN: true as const,
  BIOS_CHANGE_FORBIDDEN: true as const,
  PERMISSION_ELEVATION_FORBIDDEN: true as const,
  POWER_PLAN_CHANGE_FORBIDDEN: true as const,
  HIDDEN_PERSISTENCE_FORBIDDEN: true as const,
  CLOUD_PROVISIONING_FORBIDDEN: true as const,
  EXTERNAL_MODEL_ROUTING_FORBIDDEN: true as const,
  SYSTEM_CONFIG_CHANGE_FORBIDDEN: true as const,
  PERSONAL_FILE_ACCESS_FORBIDDEN: true as const,
  CREDENTIAL_ACCESS_FORBIDDEN: true as const,
  BROWSER_DATA_ACCESS_FORBIDDEN: true as const,
  UNRELATED_PROCESS_ACCESS_FORBIDDEN: true as const,
  GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT: true as const,
  HUMAN_APPROVAL_REQUIRED_INTACT: true as const,
} as const;

export type NpuRuntimePathId = 'windows-ml' | 'onnx-runtime-npu-ep';

export type NpuRuntimePathCandidate = {
  id: NpuRuntimePathId;
  label: string;
  status: 'CANDIDATE';
  proven: false;
  executionProviderHint: string;
  notes: string;
};

/** Candidate EP paths only — not proven by EL6 classification alone. */
export const AMD_NPU_RUNTIME_PATH_CANDIDATES: readonly NpuRuntimePathCandidate[] = [
  {
    id: 'windows-ml',
    label: 'Windows ML',
    status: 'CANDIDATE',
    proven: false,
    executionProviderHint: 'WindowsML / DirectML bridge candidate',
    notes: 'Preferred Windows local inference bridge candidate — not installed/proven by EL6 alone.',
  },
  {
    id: 'onnx-runtime-npu-ep',
    label: 'ONNX Runtime NPU EP',
    status: 'CANDIDATE',
    proven: false,
    executionProviderHint: 'ONNX Runtime AMD/VitisAI/QNN-style NPU EP candidate',
    notes: 'ONNX Runtime execution-provider candidate for AMD Ryzen AI NPU — candidate only until bounded inference succeeds.',
  },
] as const;

export type AmdNpuCapabilityCandidate = {
  kind: 'npu';
  vendor: 'AMD';
  name: string;
  /** Hardware classification after device evidence — never auto VERIFIED. */
  hardwareState: Extract<CapabilityState, 'DETECTED'>;
  /** NPU execution remains NOT_TESTED until bounded inference evidence exists. */
  executionState: Extract<CapabilityState, 'NOT_TESTED' | 'VERIFIED' | 'DEGRADED' | 'UNAVAILABLE'>;
  runtimePaths: readonly NpuRuntimePathCandidate[];
  evidence: string[];
  detectedEqualsVerified: false;
  l4AutonomyEnabled: false;
  privacyReadOnly: true;
  systemConfigChanged: false;
  inferredFromAmdCpuAlone: false;
};

export type ClassifyAmdNpuInput = {
  name: string;
  vendor?: string;
  /** Device-level evidence strings (PnP FriendlyName, CIM class, fixture ids). */
  evidence?: string[];
  /** Explicit device evidence present (required for DETECTED). */
  deviceEvidencePresent: boolean;
  /** CPU-only AMD/Ryzen signal — must NOT produce NPU_DETECTED by itself. */
  amdCpuPresent?: boolean;
  ryzenBrandedSystem?: boolean;
};

function looksLikeAmdNpu(name: string, vendor?: string): boolean {
  const hay = `${vendor ?? ''} ${name}`.toLowerCase();
  const mentionsNpu =
    hay.includes('npu') ||
    hay.includes('neural processing') ||
    hay.includes('ryzen ai') ||
    hay.includes('amd ipu');
  const mentionsAmd =
    hay.includes('amd') ||
    hay.includes('advanced micro devices') ||
    hay.includes('ryzen ai') ||
    hay.includes('xilinx') ||
    hay.includes('vitis');
  return mentionsNpu && (mentionsAmd || hay.includes('npu'));
}

/**
 * Classify an AMD NPU as a capability *candidate*.
 * Returns null when only AMD CPU / Ryzen branding is present without NPU device evidence.
 * Always DETECTED for hardware when evidence exists; execution always starts NOT_TESTED.
 */
export function classifyAmdNpuCandidate(
  input: ClassifyAmdNpuInput,
): AmdNpuCapabilityCandidate | null {
  // Hard rule: AMD CPU / Ryzen brand alone never implies NPU_DETECTED.
  if (!input.deviceEvidencePresent) {
    return null;
  }

  if (!input.name.trim()) return null;
  if (!looksLikeAmdNpu(input.name, input.vendor)) return null;

  return {
    kind: 'npu',
    vendor: 'AMD',
    name: input.name,
    hardwareState: 'DETECTED',
    executionState: 'NOT_TESTED',
    runtimePaths: AMD_NPU_RUNTIME_PATH_CANDIDATES,
    evidence: [
      ...(input.evidence ?? []),
      'EL6 classifies AMD Ryzen AI NPU visibility as DETECTED only with device evidence.',
      'DETECTED ≠ VERIFIED; NPU execution remains NOT_TESTED until bounded local inference.',
      'AMD CPU / Ryzen-branded system alone was not used as NPU proof.',
    ],
    detectedEqualsVerified: isDetectedEqualVerified(),
    l4AutonomyEnabled: EL6_LOCKS.L4_AUTONOMY_ENABLED,
    privacyReadOnly: true,
    systemConfigChanged: false,
    inferredFromAmdCpuAlone: false,
  };
}

/**
 * AMD CPU present without NPU device evidence must not become NPU_DETECTED.
 */
export function refuseAmdCpuAsNpuInference(input: {
  amdCpuPresent: boolean;
  ryzenBrandedSystem?: boolean;
  npuDeviceEvidencePresent: boolean;
}): {
  npuDetected: false;
  reason: string;
  locks: typeof EL6_LOCKS;
} {
  if (input.npuDeviceEvidencePresent) {
    return {
      npuDetected: false,
      reason: 'DEVICE_EVIDENCE_PATH_USE_classifyAmdNpuCandidate',
      locks: EL6_LOCKS,
    };
  }

  return {
    npuDetected: false,
    reason:
      input.amdCpuPresent || input.ryzenBrandedSystem
        ? 'DENY_AMD_CPU_OR_RYZEN_BRAND_ALONE_IS_NOT_NPU_DETECTED'
        : 'NO_NPU_DEVICE_EVIDENCE',
    locks: EL6_LOCKS,
  };
}

export function classifyAmdNpusFromSnapshot(
  snapshot: HardwareSnapshot,
): AmdNpuCapabilityCandidate[] {
  const out: AmdNpuCapabilityCandidate[] = [];
  for (const npu of snapshot.npus) {
    if (!npu.name) continue;
    const deviceEvidencePresent = (npu.evidence?.length ?? 0) > 0 || npu.state === 'DETECTED';
    const candidate = classifyAmdNpuCandidate({
      name: npu.name,
      vendor: npu.vendor,
      evidence: npu.evidence,
      deviceEvidencePresent,
      amdCpuPresent: snapshot.cpu.vendor === 'AMD',
      ryzenBrandedSystem: (snapshot.cpu.name ?? '').toLowerCase().includes('ryzen'),
    });
    if (candidate) out.push(candidate);
  }
  return out;
}

/**
 * Refuse auto-promotion of a DETECTED AMD NPU to VERIFIED (skip SUPPORTED).
 */
export function refuseAmdNpuAutoVerify(candidate: AmdNpuCapabilityCandidate) {
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
 * Promote NPU execution state only when bounded inference actually completed.
 * Without that evidence, state remains NOT_TESTED (never jumps to VERIFIED).
 */
export function resolveNpuExecutionState(input: {
  boundedInferenceCompleted: boolean;
  inferenceSucceeded?: boolean;
  modelLoaded?: boolean;
  hardwareState: CapabilityState;
}): {
  executionState: CapabilityState;
  hardwarePromotion: ReturnType<typeof advanceCapabilityState> | null;
  reason: string;
  claimedVerified: false | true;
} {
  if (!input.boundedInferenceCompleted || !input.modelLoaded) {
    return {
      executionState: 'NOT_TESTED',
      hardwarePromotion: null,
      reason: 'NPU_EXECUTION_NOT_TESTED_UNTIL_BOUNDED_MODEL_LOAD_AND_INFERENCE',
      claimedVerified: false,
    };
  }

  if (!input.inferenceSucceeded) {
    return {
      executionState: 'UNAVAILABLE',
      hardwarePromotion: null,
      reason: 'BOUNDED_INFERENCE_FAILED_NPU_UNAVAILABLE_SAFE_DEGRADE_REQUIRED',
      claimedVerified: false,
    };
  }

  // Successful bounded inference may advance DETECTED → SUPPORTED first (no skip to VERIFIED).
  if (input.hardwareState === 'DETECTED') {
    const toSupported = advanceCapabilityState('DETECTED', 'SUPPORTED');
    return {
      executionState: 'SUPPORTED',
      hardwarePromotion: toSupported,
      reason: 'BOUNDED_INFERENCE_OK_HARDWARE_MAY_BECOME_SUPPORTED_NOT_AUTO_VERIFIED',
      claimedVerified: false,
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
      claimedVerified: toVerified.allowed === true,
    };
  }

  return {
    executionState: 'NOT_TESTED',
    hardwarePromotion: null,
    reason: 'INSUFFICIENT_HARDWARE_STATE_FOR_NPU_VERIFY',
    claimedVerified: false,
  };
}

export type NpuExecutionAttempt = {
  preferNpu?: boolean;
  npuHardwareState: CapabilityState;
  npuExecutionState: CapabilityState;
  boundedInferenceCompleted?: boolean;
  inferenceSucceeded?: boolean;
  modelLoaded?: boolean;
  /** Soft-wired EL5 GPU verified state for degrade preference. */
  gpuHardwareState?: CapabilityState;
  gpuExecutionState?: CapabilityState;
  error?: string;
};

export type NpuExecutionOutcome = {
  compute: 'cpu' | 'gpu' | 'npu';
  fallbackFromNpu: boolean;
  capabilityState: CapabilityState;
  reason: string;
  errors: string[];
  npuVerifiedClaimed: false | true;
};

/**
 * Attempt NPU execution only when VERIFIED; otherwise safe degrade:
 * prefer VERIFIED GPU (EL5 soft-wire) else CPU.
 */
export function attemptNpuOrDegrade(input: NpuExecutionAttempt): NpuExecutionOutcome {
  const errors = input.error ? [input.error] : [];

  if (
    input.preferNpu &&
    input.npuHardwareState === 'VERIFIED' &&
    input.npuExecutionState === 'VERIFIED' &&
    input.boundedInferenceCompleted &&
    input.modelLoaded &&
    input.inferenceSucceeded
  ) {
    return {
      compute: 'npu',
      fallbackFromNpu: false,
      capabilityState: 'VERIFIED',
      reason: 'NPU_VERIFIED_BOUNDED_INFERENCE_PRESENT',
      errors,
      npuVerifiedClaimed: true,
    };
  }

  if (input.error || input.inferenceSucceeded === false) {
    errors.push('NPU_INFERENCE_FAILED_OR_UNSUPPORTED');
  }

  const gpuOutcome = attemptGpuOrFallbackCpu({
    preferGpu: true,
    gpuHardwareState: input.gpuHardwareState ?? 'NOT_TESTED',
    gpuExecutionState: input.gpuExecutionState ?? 'NOT_TESTED',
    boundedInferenceCompleted:
      input.gpuHardwareState === 'VERIFIED' && input.gpuExecutionState === 'VERIFIED',
    inferenceSucceeded:
      input.gpuHardwareState === 'VERIFIED' && input.gpuExecutionState === 'VERIFIED',
  });

  if (gpuOutcome.compute === 'gpu') {
    return {
      compute: 'gpu',
      fallbackFromNpu: true,
      capabilityState: 'VERIFIED',
      reason: 'NPU_NOT_VERIFIED_OR_FAILED_DEGRADE_TO_VERIFIED_GPU',
      errors,
      npuVerifiedClaimed: false,
    };
  }

  return {
    compute: 'cpu',
    fallbackFromNpu: true,
    capabilityState: 'DETECTED',
    reason: 'NPU_NOT_VERIFIED_OR_FAILED_DEGRADE_TO_CPU_NO_VERIFIED_GPU',
    errors,
    npuVerifiedClaimed: false,
  };
}

/** Soft-wire existing CPU-first router + EL5 GPU candidates: DETECTED NPU never wins. */
export function routeWithAmdNpuCandidatePolicy(
  snapshot: HardwareSnapshot,
): RouteDecision & {
  amdNpuCandidates: AmdNpuCapabilityCandidate[];
  amdGpuCandidates: AmdGpuCapabilityCandidate[];
} {
  const amdNpuCandidates = classifyAmdNpusFromSnapshot(snapshot);
  const amdGpuCandidates = classifyAmdGpusFromSnapshot(snapshot);
  const decision = routeWorkload(snapshot, { preferLocal: true });
  return { ...decision, amdNpuCandidates, amdGpuCandidates };
}

export function toNpuComputeCapability(candidate: AmdNpuCapabilityCandidate): ComputeCapability {
  return {
    kind: 'npu',
    name: candidate.name,
    vendor: candidate.vendor,
    state: candidate.hardwareState,
    evidence: candidate.evidence,
  };
}

/** Initial registry posture before any probe: UNKNOWN / NOT_TESTED — never DETECTED/VERIFIED. */
export function initialNpuCapabilityPosture(): {
  hardwareState: 'UNKNOWN' | 'NOT_TESTED';
  executionState: 'NOT_TESTED';
  verified: false;
} {
  return {
    hardwareState: 'NOT_TESTED',
    executionState: 'NOT_TESTED',
    verified: false,
  };
}
