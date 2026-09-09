/**
 * 62L-EM6 — NVIDIA Runtime Candidate Path (evidence-first).
 *
 * Core flow (adapter segment):
 * Agent Compute Envelope → Policy Gate → Compute Registry → NVIDIA Adapter
 * → Verified Runtime → Inference → Return Receipt → XIV Home Base
 *
 * Detection may yield DETECTED. CUDA / TensorRT / TensorRT-LLM remain UNKNOWN
 * or NOT_TESTED until separately evidenced. VERIFIED requires actual bounded
 * model load + inference on the *requested* NVIDIA execution path.
 *
 * NVIDIA = INTEGRATION_CANDIDATE until evidence. Never auto-installs CUDA,
 * drivers, TensorRT, or system packages. No overclock / BIOS / thermal bypass.
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
import {
  EM6_INTEGRATION_STATUS,
  EM6_LOCKS,
} from './em6-honesty';

/** Soft governance locks — mirror EM6 honesty; Guardian/RLS unchanged. */
export const EM6_ADAPTER_LOCKS = EM6_LOCKS;

export type NvidiaRuntimePathId =
  | 'cuda'
  | 'tensorrt'
  | 'tensorrt-llm'
  | 'onnx-cuda-ep'
  | 'onnx-tensorrt-ep';

export type NvidiaRuntimePathCandidate = {
  id: NvidiaRuntimePathId;
  label: string;
  status: 'CANDIDATE';
  proven: false;
  notes: string;
};

export const NVIDIA_RUNTIME_PATH_CANDIDATES: readonly NvidiaRuntimePathCandidate[] =
  [
    {
      id: 'cuda',
      label: 'CUDA',
      status: 'CANDIDATE',
      proven: false,
      notes: 'CUDA presence is NOT inferred from GPU detection alone.',
    },
    {
      id: 'tensorrt',
      label: 'TensorRT',
      status: 'CANDIDATE',
      proven: false,
      notes: 'TensorRT candidate only until bounded inference on this path.',
    },
    {
      id: 'tensorrt-llm',
      label: 'TensorRT-LLM',
      status: 'CANDIDATE',
      proven: false,
      notes: 'TensorRT-LLM candidate only; not proven by EM6 alone.',
    },
    {
      id: 'onnx-cuda-ep',
      label: 'ONNX Runtime CUDA EP',
      status: 'CANDIDATE',
      proven: false,
      notes: 'ONNX CUDA EP compatibility candidate — NOT_TESTED until measured.',
    },
    {
      id: 'onnx-tensorrt-ep',
      label: 'ONNX Runtime TensorRT EP',
      status: 'CANDIDATE',
      proven: false,
      notes: 'ONNX TensorRT EP candidate — NOT_TESTED until measured.',
    },
  ] as const;

export type PrecisionMode = 'fp32' | 'fp16' | 'bf16' | 'int8' | 'fp8' | 'unknown';

export type ComponentTruthState = CapabilityState;

/** Adapter tracking fields required by EM6. */
export type NvidiaAdapterTracking = {
  deviceId: string;
  gpuModel: string;
  vramBytes: number | null;
  driverState: ComponentTruthState;
  cudaState: ComponentTruthState;
  tensorRtState: ComponentTruthState;
  tensorRtLlmState: ComponentTruthState;
  onnxCompatibility: ComponentTruthState;
  supportedPrecisionModes: readonly PrecisionMode[];
  modelCompatibility: ComponentTruthState;
  benchmarkEvidence: string[];
  thermalResourceState: ComponentTruthState;
  lastVerificationTimestamp: string | null;
  fallbackRoute: 'cpu' | 'amd-gpu' | 'amd-npu' | 'authorized-cloud' | 'none';
};

export type NvidiaCapabilityCandidate = {
  kind: 'gpu';
  vendor: 'NVIDIA';
  name: string;
  integrationStatus: typeof EM6_INTEGRATION_STATUS;
  /** Hardware visibility — DETECTED from probe; never auto VERIFIED. */
  hardwareState: Extract<CapabilityState, 'DETECTED'>;
  /**
   * NVIDIA execution remains NOT_TESTED until bounded inference on the
   * requested NVIDIA path succeeds with matching actual path.
   */
  executionState: Extract<
    CapabilityState,
    'NOT_TESTED' | 'VERIFIED' | 'DEGRADED' | 'UNAVAILABLE' | 'SUPPORTED'
  >;
  runtimePaths: readonly NvidiaRuntimePathCandidate[];
  tracking: NvidiaAdapterTracking;
  evidence: string[];
  detectedEqualsVerified: false;
  detectedEqualsCudaWorks: false;
  detectedEqualsTensorRtWorks: false;
  l4AutonomyEnabled: false;
  privacyReadOnly: true;
  systemConfigChanged: false;
  multiGpuRoutingState: 'NOT_TESTED';
};

export type ClassifyNvidiaGpuInput = {
  name: string;
  vendor?: string;
  deviceId?: string;
  vramBytes?: number | null;
  evidence?: string[];
  driverObserved?: boolean;
};

function looksLikeNvidiaGpu(name: string, vendor?: string): boolean {
  const hay = `${vendor ?? ''} ${name}`.toLowerCase();
  return (
    hay.includes('nvidia') ||
    hay.includes('geforce') ||
    hay.includes('quadro') ||
    hay.includes('tesla') ||
    hay.includes('rtx') ||
    hay.includes('gtx') ||
    hay.includes('a100') ||
    hay.includes('h100') ||
    hay.includes('l40')
  );
}

function makeDeviceId(name: string, explicit?: string): string {
  if (explicit && explicit.trim()) return explicit.trim();
  return `nvidia:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/**
 * Classify an NVIDIA GPU as a capability *candidate*.
 * Hardware → DETECTED. CUDA/TensorRT → UNKNOWN (not proven by detection).
 * Execution → NOT_TESTED. Integration → INTEGRATION_CANDIDATE.
 */
export function classifyNvidiaGpuCandidate(
  input: ClassifyNvidiaGpuInput,
): NvidiaCapabilityCandidate | null {
  if (!looksLikeNvidiaGpu(input.name, input.vendor)) return null;

  const deviceId = makeDeviceId(input.name, input.deviceId);
  const driverState: ComponentTruthState = input.driverObserved
    ? 'DETECTED'
    : 'UNKNOWN';

  return {
    kind: 'gpu',
    vendor: 'NVIDIA',
    name: input.name,
    integrationStatus: EM6_INTEGRATION_STATUS,
    hardwareState: 'DETECTED',
    executionState: 'NOT_TESTED',
    runtimePaths: NVIDIA_RUNTIME_PATH_CANDIDATES,
    tracking: {
      deviceId,
      gpuModel: input.name,
      vramBytes: input.vramBytes ?? null,
      driverState,
      cudaState: 'UNKNOWN',
      tensorRtState: 'UNKNOWN',
      tensorRtLlmState: 'UNKNOWN',
      onnxCompatibility: 'NOT_TESTED',
      supportedPrecisionModes: ['unknown'],
      modelCompatibility: 'NOT_TESTED',
      benchmarkEvidence: [],
      thermalResourceState: 'NOT_TESTED',
      lastVerificationTimestamp: null,
      fallbackRoute: 'cpu',
    },
    evidence: [
      ...(input.evidence ?? []),
      'EM6 classifies NVIDIA visibility as DETECTED only.',
      'Detecting NVIDIA GPU ≠ proving CUDA or TensorRT works.',
      'DETECTED ≠ VERIFIED; NVIDIA execution remains NOT_TESTED until bounded inference on the requested path.',
      'Integration status: INTEGRATION_CANDIDATE.',
    ],
    detectedEqualsVerified: isDetectedEqualVerified(),
    detectedEqualsCudaWorks: EM6_LOCKS.NVIDIA_DETECTED_EQ_CUDA_WORKS,
    detectedEqualsTensorRtWorks: EM6_LOCKS.NVIDIA_DETECTED_EQ_TENSORRT_WORKS,
    l4AutonomyEnabled: EM6_LOCKS.L4_AUTONOMY_ENABLED,
    privacyReadOnly: true,
    systemConfigChanged: false,
    multiGpuRoutingState: 'NOT_TESTED',
  };
}

export function classifyNvidiaGpusFromSnapshot(
  snapshot: HardwareSnapshot,
): NvidiaCapabilityCandidate[] {
  const out: NvidiaCapabilityCandidate[] = [];
  for (const gpu of snapshot.gpus) {
    if (!gpu.name) continue;
    const candidate = classifyNvidiaGpuCandidate({
      name: gpu.name,
      vendor: gpu.vendor,
      evidence: gpu.evidence,
    });
    if (candidate) out.push(candidate);
  }
  return out;
}

/** Refuse auto-promotion of DETECTED NVIDIA hardware to VERIFIED. */
export function refuseNvidiaAutoVerify(candidate: NvidiaCapabilityCandidate) {
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

export type NvidiaBoundedInferenceEvidence = {
  /** Path the caller requested (must match actual for VERIFIED). */
  requestedPath: NvidiaRuntimePathId;
  /** Path that actually executed. */
  actualPath: NvidiaRuntimePathId | 'cpu' | null;
  boundedInferenceCompleted: boolean;
  inferenceSucceeded?: boolean;
  modelId?: string;
  latencyMs?: number | null;
  memoryBytes?: number | null;
  recordedAt?: string;
  error?: string;
};

/**
 * Resolve NVIDIA execution truth.
 * VERIFIED requires: bounded load+inference completed successfully on the
 * *requested* NVIDIA path (actualPath === requestedPath, not CPU).
 */
export function resolveNvidiaExecutionState(input: {
  hardwareState: CapabilityState;
  evidence: NvidiaBoundedInferenceEvidence;
}): {
  executionState: CapabilityState;
  hardwarePromotion: ReturnType<typeof advanceCapabilityState> | null;
  reason: string;
  nvidiaVerifiedClaimed: false | true;
  cpuFallbackRecorded: boolean;
} {
  const { evidence } = input;

  if (!evidence.boundedInferenceCompleted) {
    return {
      executionState: 'NOT_TESTED',
      hardwarePromotion: null,
      reason: 'NVIDIA_EXECUTION_NOT_TESTED_UNTIL_BOUNDED_INFERENCE',
      nvidiaVerifiedClaimed: false,
      cpuFallbackRecorded: evidence.actualPath === 'cpu',
    };
  }

  // Explicit CPU fallback — may record CPU path; cannot VERIFIED NVIDIA.
  if (evidence.actualPath === 'cpu') {
    return {
      executionState: 'NOT_TESTED',
      hardwarePromotion: null,
      reason:
        'CPU_FALLBACK_RECORDED_EXPLICITLY_CANNOT_VERIFY_NVIDIA_PATH',
      nvidiaVerifiedClaimed: false,
      cpuFallbackRecorded: true,
    };
  }

  // Silent / mismatched path — requested NVIDIA path did not actually run.
  if (
    evidence.actualPath == null ||
    evidence.actualPath !== evidence.requestedPath
  ) {
    return {
      executionState: 'NOT_TESTED',
      hardwarePromotion: null,
      reason:
        'REQUESTED_NVIDIA_PATH_NOT_ACTUAL_CANNOT_VERIFY',
      nvidiaVerifiedClaimed: false,
      cpuFallbackRecorded: false,
    };
  }

  if (!evidence.inferenceSucceeded) {
    return {
      executionState: 'UNAVAILABLE',
      hardwarePromotion: null,
      reason:
        'BOUNDED_INFERENCE_FAILED_ON_REQUESTED_NVIDIA_PATH_CPU_FALLBACK_REQUIRED',
      nvidiaVerifiedClaimed: false,
      cpuFallbackRecorded: false,
    };
  }

  // Success on requested NVIDIA path: walk DETECTED → SUPPORTED → VERIFIED.
  if (input.hardwareState === 'DETECTED') {
    const toSupported = advanceCapabilityState('DETECTED', 'SUPPORTED');
    return {
      executionState: 'SUPPORTED',
      hardwarePromotion: toSupported,
      reason:
        'BOUNDED_INFERENCE_OK_ON_REQUESTED_PATH_HARDWARE_MAY_BECOME_SUPPORTED_NOT_AUTO_VERIFIED',
      nvidiaVerifiedClaimed: false,
      cpuFallbackRecorded: false,
    };
  }

  if (input.hardwareState === 'SUPPORTED') {
    const toVerified = advanceCapabilityState('SUPPORTED', 'VERIFIED');
    return {
      executionState: toVerified.allowed ? 'VERIFIED' : 'SUPPORTED',
      hardwarePromotion: toVerified,
      reason: toVerified.allowed
        ? 'BOUNDED_INFERENCE_OK_FROM_SUPPORTED_MAY_VERIFY_REQUESTED_NVIDIA_PATH'
        : 'VERIFY_DENIED',
      nvidiaVerifiedClaimed: toVerified.allowed,
      cpuFallbackRecorded: false,
    };
  }

  return {
    executionState: 'NOT_TESTED',
    hardwarePromotion: null,
    reason: 'INSUFFICIENT_HARDWARE_STATE_FOR_NVIDIA_VERIFY',
    nvidiaVerifiedClaimed: false,
    cpuFallbackRecorded: false,
  };
}

export type NvidiaExecutionAttempt = {
  preferNvidia?: boolean;
  hardwareState: CapabilityState;
  executionState: CapabilityState;
  requestedPath: NvidiaRuntimePathId;
  actualPath?: NvidiaRuntimePathId | 'cpu' | null;
  boundedInferenceCompleted?: boolean;
  inferenceSucceeded?: boolean;
  error?: string;
};

export type NvidiaExecutionOutcome = {
  compute: 'cpu' | 'gpu';
  vendor: 'NVIDIA' | 'CPU_FALLBACK';
  fallbackToCpu: boolean;
  fallbackRecordedExplicitly: boolean;
  capabilityState: CapabilityState;
  reason: string;
  errors: string[];
  nvidiaVerified: boolean;
};

/**
 * Attempt NVIDIA execution only when VERIFIED on the requested path;
 * otherwise safe CPU fallback — recorded explicitly (cannot verify NVIDIA).
 */
export function attemptNvidiaOrFallbackCpu(
  input: NvidiaExecutionAttempt,
): NvidiaExecutionOutcome {
  const errors = input.error ? [input.error] : [];

  if (
    input.preferNvidia &&
    input.hardwareState === 'VERIFIED' &&
    input.executionState === 'VERIFIED' &&
    input.boundedInferenceCompleted &&
    input.inferenceSucceeded &&
    input.actualPath != null &&
    input.actualPath === input.requestedPath &&
    input.actualPath !== 'cpu'
  ) {
    return {
      compute: 'gpu',
      vendor: 'NVIDIA',
      fallbackToCpu: false,
      fallbackRecordedExplicitly: false,
      capabilityState: 'VERIFIED',
      reason: 'NVIDIA_VERIFIED_BOUNDED_INFERENCE_ON_REQUESTED_PATH',
      errors,
      nvidiaVerified: true,
    };
  }

  if (input.error || input.inferenceSucceeded === false) {
    errors.push('NVIDIA_EXECUTION_FAILED_OR_UNSUPPORTED');
  }
  if (input.actualPath === 'cpu') {
    errors.push('CPU_FALLBACK_EXPLICIT_NVIDIA_NOT_VERIFIED');
  }

  return {
    compute: 'cpu',
    vendor: 'CPU_FALLBACK',
    fallbackToCpu: true,
    fallbackRecordedExplicitly: true,
    capabilityState: 'DETECTED',
    reason: 'CPU_SAFE_FALLBACK_NVIDIA_NOT_VERIFIED_OR_FAILED',
    errors,
    nvidiaVerified: false,
  };
}

/** Soft-wire CPU-first router: DETECTED NVIDIA never wins over CPU. */
export function routeWithNvidiaCandidatePolicy(
  snapshot: HardwareSnapshot,
): RouteDecision & { nvidiaCandidates: NvidiaCapabilityCandidate[] } {
  const nvidiaCandidates = classifyNvidiaGpusFromSnapshot(snapshot);
  const decision = routeWorkload(snapshot, { preferLocal: true });
  return { ...decision, nvidiaCandidates };
}

export function toComputeCapability(
  candidate: NvidiaCapabilityCandidate,
): ComputeCapability {
  return {
    kind: 'gpu',
    name: candidate.name,
    vendor: candidate.vendor,
    state: candidate.hardwareState,
    evidence: candidate.evidence,
  };
}

// ---------------------------------------------------------------------------
// Install / privileged-config denies
// ---------------------------------------------------------------------------

export type Em6DeniedAction =
  | 'install_cuda'
  | 'install_driver'
  | 'install_tensorrt'
  | 'install_system_package'
  | 'overclock'
  | 'bios_change'
  | 'thermal_limit_bypass'
  | 'privileged_config_change';

export type Em6DenyResult = {
  allowed: false;
  action: Em6DeniedAction;
  reason: string;
  l4AutonomyEnabled: false;
};

const DENY_REASONS: Record<Em6DeniedAction, string> = {
  install_cuda: 'EM6_DENY_CUDA_AUTO_INSTALL',
  install_driver: 'EM6_DENY_DRIVER_AUTO_INSTALL',
  install_tensorrt: 'EM6_DENY_TENSORRT_AUTO_INSTALL',
  install_system_package: 'EM6_DENY_SYSTEM_PACKAGE_AUTO_INSTALL',
  overclock: 'EM6_DENY_OVERCLOCK',
  bios_change: 'EM6_DENY_BIOS_MODIFICATION',
  thermal_limit_bypass: 'EM6_DENY_THERMAL_LIMIT_BYPASS',
  privileged_config_change: 'EM6_DENY_PRIVILEGED_CONFIG_CHANGE',
};

/** Agents cannot install CUDA/drivers/TensorRT/packages or change privileged config. */
export function denyNvidiaInstallOrPrivilegedAction(
  action: Em6DeniedAction,
): Em6DenyResult {
  return {
    allowed: false,
    action,
    reason: DENY_REASONS[action],
    l4AutonomyEnabled: EM6_LOCKS.L4_AUTONOMY_ENABLED,
  };
}

// ---------------------------------------------------------------------------
// Multi-GPU routing — NOT_TESTED until measured
// ---------------------------------------------------------------------------

export type MultiGpuRoutingAssessment = {
  deviceCount: number;
  routingState: 'NOT_TESTED';
  assumedVerified: false;
  reason: string;
};

export function assessMultiGpuRouting(
  candidates: NvidiaCapabilityCandidate[],
): MultiGpuRoutingAssessment {
  return {
    deviceCount: candidates.length,
    routingState: 'NOT_TESTED',
    assumedVerified: EM6_LOCKS.MULTI_GPU_ROUTING_ASSUMED_VERIFIED,
    reason:
      'MULTI_GPU_ROUTING_REMAINS_NOT_TESTED_UNTIL_MEASURED',
  };
}

// ---------------------------------------------------------------------------
// Cloud NVIDIA spend / authorization gate
// ---------------------------------------------------------------------------

export type CloudNvidiaAccessRequest = {
  providerId: string;
  explicitlyAuthorized: boolean;
  spendControlsPresent: boolean;
  autoPurchaseRequested?: boolean;
};

export type CloudNvidiaAccessDecision = {
  allowed: boolean;
  reasons: string[];
  autoPurchaseForbidden: true;
};

/**
 * Cloud NVIDIA capacity requires separately authorized providers and spend
 * controls. Auto-purchase is always denied.
 */
export function gateCloudNvidiaAccess(
  request: CloudNvidiaAccessRequest,
): CloudNvidiaAccessDecision {
  const reasons: string[] = [];

  if (request.autoPurchaseRequested) {
    reasons.push('EM6_DENY_CLOUD_NVIDIA_AUTO_PURCHASE');
  }
  if (!request.explicitlyAuthorized) {
    reasons.push('EM6_DENY_CLOUD_WITHOUT_EXPLICIT_AUTHORIZATION');
  }
  if (!request.spendControlsPresent) {
    reasons.push('EM6_DENY_CLOUD_WITHOUT_SPEND_CONTROLS');
  }
  if (!request.providerId.trim()) {
    reasons.push('EM6_DENY_CLOUD_PROVIDER_UNSPECIFIED');
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    autoPurchaseForbidden: EM6_LOCKS.CLOUD_NVIDIA_AUTO_PURCHASE_FORBIDDEN,
  };
}

// ---------------------------------------------------------------------------
// Private/tenant data cross-node gate
// ---------------------------------------------------------------------------

export type CrossNodeDataMoveRequest = {
  privacyClass: 'private' | 'tenant' | 'shared' | 'public_cloud';
  sourceNodeId: string;
  destinationNodeId: string;
  explicitlyAuthorized: boolean;
};

export function gatePrivateTenantCrossNodeMove(
  request: CrossNodeDataMoveRequest,
): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (request.sourceNodeId === request.destinationNodeId) {
    return { allowed: true, reasons };
  }
  if (
    (request.privacyClass === 'private' || request.privacyClass === 'tenant') &&
    !request.explicitlyAuthorized
  ) {
    reasons.push(
      'EM6_DENY_PRIVATE_TENANT_DATA_CROSS_NODE_WITHOUT_EXPLICIT_AUTHORIZATION',
    );
  }
  return { allowed: reasons.length === 0, reasons };
}

// ---------------------------------------------------------------------------
// Soft EL9 resource ceilings for NVIDIA path (presence of governor unchanged)
// ---------------------------------------------------------------------------

export type NvidiaResourceLimits = {
  maxVramBytes: number;
  maxConcurrency: number;
  maxRuntimeMs: number;
  maxQueueDepth: number;
  maxTaskDurationMs: number;
};

export const DEFAULT_NVIDIA_RESOURCE_LIMITS: NvidiaResourceLimits = Object.freeze({
  maxVramBytes: 8 * 1024 * 1024 * 1024,
  maxConcurrency: 1,
  maxRuntimeMs: 60_000,
  maxQueueDepth: 4,
  maxTaskDurationMs: 120_000,
});

export type NvidiaResourceAdmitRequest = {
  estimatedVramBytes: number;
  concurrency: number;
  estimatedRuntimeMs: number;
  queueDepth: number;
  taskDurationMs: number;
};

export function admitNvidiaUnderResourceGovernor(
  request: NvidiaResourceAdmitRequest,
  limits: NvidiaResourceLimits = DEFAULT_NVIDIA_RESOURCE_LIMITS,
): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (request.estimatedVramBytes > limits.maxVramBytes) {
    reasons.push('EM6_EL9_VRAM_CEILING');
  }
  if (request.concurrency > limits.maxConcurrency) {
    reasons.push('EM6_EL9_CONCURRENCY_CEILING');
  }
  if (request.estimatedRuntimeMs > limits.maxRuntimeMs) {
    reasons.push('EM6_EL9_RUNTIME_CEILING');
  }
  if (request.queueDepth > limits.maxQueueDepth) {
    reasons.push('EM6_EL9_QUEUE_DEPTH_CEILING');
  }
  if (request.taskDurationMs > limits.maxTaskDurationMs) {
    reasons.push('EM6_EL9_TASK_DURATION_CEILING');
  }
  return { allowed: reasons.length === 0, reasons };
}

/** Record a CPU fallback receipt — honesty: does not verify NVIDIA. */
export function recordCpuFallbackReceipt(input: {
  modelId: string;
  reason: string;
  recordedAt?: string;
}): {
  fallbackRoute: 'cpu';
  nvidiaVerified: false;
  modelId: string;
  reason: string;
  recordedAt: string;
} {
  return {
    fallbackRoute: 'cpu',
    nvidiaVerified: false,
    modelId: input.modelId,
    reason: input.reason,
    recordedAt: input.recordedAt ?? new Date().toISOString(),
  };
}
