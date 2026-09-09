/**
 * 62L-EW8 — NVIDIA runtime candidates (documented only).
 *
 * CUDA, TensorRT, TensorRT-LLM, ONNX Runtime NVIDIA provider, and other
 * documented NVIDIA inference interfaces. Never auto-installs drivers/CUDA/
 * TensorRT; never changes PATH/system config; never requests admin.
 * Missing → NOT_CONFIGURED / UNAVAILABLE.
 */

import {
  EW8_LOCKS,
  type ActualExecutionDevice,
  type MultiGpuState,
  type TruthState,
} from './ew8-types.ts';
import type { NvidiaCapabilitySnapshot } from './nvidia-capabilities.ts';
import {
  layerSatisfiesMinimum,
  rejectStaleVerified,
} from './nvidia-capabilities.ts';

export type NvidiaRuntimeCandidateId =
  | 'cuda'
  | 'tensorrt'
  | 'tensorrt-llm'
  | 'onnx-runtime-nvidia'
  | 'other-documented-nvidia-inference';

export type NvidiaRuntimeCandidate = {
  id: NvidiaRuntimeCandidateId;
  label: string;
  status: 'DOCUMENTED' | 'NOT_CONFIGURED' | 'UNAVAILABLE' | 'SUPPORTED' | 'VERIFIED';
  proven: boolean;
  notes: string;
};

export const NVIDIA_RUNTIME_CANDIDATES: readonly NvidiaRuntimeCandidate[] = [
  {
    id: 'cuda',
    label: 'CUDA',
    status: 'DOCUMENTED',
    proven: false,
    notes: 'Documented candidate — CUDA presence not inferred from GPU detection.',
  },
  {
    id: 'tensorrt',
    label: 'TensorRT',
    status: 'DOCUMENTED',
    proven: false,
    notes: 'Documented candidate — TensorRT ≠ CUDA ≠ model verified.',
  },
  {
    id: 'tensorrt-llm',
    label: 'TensorRT-LLM',
    status: 'DOCUMENTED',
    proven: false,
    notes: 'Documented candidate only until bounded LLM inference evidenced.',
  },
  {
    id: 'onnx-runtime-nvidia',
    label: 'ONNX Runtime NVIDIA provider',
    status: 'DOCUMENTED',
    proven: false,
    notes: 'ONNX Runtime NVIDIA EP documented interface — NOT_TESTED until measured.',
  },
  {
    id: 'other-documented-nvidia-inference',
    label: 'Other documented NVIDIA inference interfaces',
    status: 'DOCUMENTED',
    proven: false,
    notes: 'Placeholder for additional documented interfaces — no auto-discovery install.',
  },
] as const;

export type ModelLoadVerificationInput = {
  snapshot: NvidiaCapabilitySnapshot;
  runtimeId: NvidiaRuntimeCandidateId;
  gpuDetectedExact: boolean;
  runtimeInitialized: boolean;
  modelLoaded: boolean;
  modelVersion: string;
  inferenceCompleted: boolean;
  actualDeviceConfirmed: ActualExecutionDevice;
  requestedDevice: ActualExecutionDevice;
  outputValidated: boolean;
  receiptGenerated: boolean;
  benchmarkRetained: boolean;
  silentCpuFallback: boolean;
  /** When true, multi-GPU measurement evidence exists. */
  multiGpuMeasured?: boolean;
  nowMs?: number;
};

export type ModelLoadVerificationResult = {
  nvidiaPathVerified: boolean;
  gpuState: TruthState;
  runtimeState: TruthState;
  modelState: TruthState;
  multiGpuState: MultiGpuState;
  reasons: string[];
  eligibleForVerifiedRouting: boolean;
};

/**
 * Model-load VERIFIED only when ALL preconditions hold.
 * Silent CPU fallback does NOT verify NVIDIA GPU.
 */
export function evaluateModelLoadVerification(
  input: ModelLoadVerificationInput,
): ModelLoadVerificationResult {
  const reasons: string[] = [];
  const snap = rejectStaleVerified(input.snapshot, input.nowMs);

  if (EW8_LOCKS.MAY_AUTO_INSTALL_DRIVERS_CUDA_TENSORRT !== false) {
    return {
      nvidiaPathVerified: false,
      gpuState: 'UNAVAILABLE',
      runtimeState: 'UNAVAILABLE',
      modelState: 'UNAVAILABLE',
      multiGpuState: 'MULTI_GPU_NOT_TESTED',
      reasons: ['LOCK_VIOLATION_AUTO_INSTALL'],
      eligibleForVerifiedRouting: false,
    };
  }

  // Stale GPU/runtime evidence rejected.
  if (snap.layers.NVIDIA_GPU.state === 'STALE') {
    reasons.push('STALE GPU evidence rejected — cannot VERIFIED.');
  }
  if (
    snap.layers.CUDA_RUNTIME.state === 'STALE' ||
    snap.layers.TENSORRT.state === 'STALE'
  ) {
    reasons.push('STALE runtime evidence rejected — cannot VERIFIED.');
  }

  const requiresNvidia =
    input.requestedDevice === 'NVIDIA_GPU' ||
    input.requestedDevice === 'CUDA' ||
    input.requestedDevice === 'TENSORRT' ||
    input.requestedDevice === 'TENSORRT_LLM' ||
    input.requestedDevice === 'ONNX_NVIDIA';

  if (input.silentCpuFallback) {
    reasons.push(
      'Silent CPU fallback does NOT verify NVIDIA GPU — NVIDIA stays NOT_TESTED/DEGRADED.',
    );
    return {
      nvidiaPathVerified: false,
      gpuState:
        snap.layers.NVIDIA_GPU.state === 'VERIFIED'
          ? 'DEGRADED'
          : snap.layers.NVIDIA_GPU.state === 'DETECTED' ||
              snap.layers.NVIDIA_GPU.state === 'DOCUMENTED'
            ? snap.layers.NVIDIA_GPU.state
            : 'NOT_TESTED',
      runtimeState:
        input.runtimeId === 'tensorrt' || input.runtimeId === 'tensorrt-llm'
          ? 'NOT_TESTED'
          : snap.layers.CUDA_RUNTIME.state === 'NOT_CONFIGURED'
            ? 'NOT_CONFIGURED'
            : 'NOT_TESTED',
      modelState: 'NOT_TESTED',
      multiGpuState: 'MULTI_GPU_NOT_TESTED',
      reasons,
      eligibleForVerifiedRouting: false,
    };
  }

  const preconditions = [
    { ok: input.gpuDetectedExact, msg: 'exact GPU detected' },
    { ok: input.runtimeInitialized, msg: 'runtime initializes' },
    { ok: input.modelLoaded && Boolean(input.modelVersion), msg: 'model/version loads' },
    { ok: input.inferenceCompleted, msg: 'inference completes' },
    {
      ok:
        input.actualDeviceConfirmed === input.requestedDevice &&
        requiresNvidia &&
        input.actualDeviceConfirmed !== 'CPU' &&
        input.actualDeviceConfirmed !== 'CPU_ONNX',
      msg: 'actual device confirmed on requested NVIDIA path',
    },
    { ok: input.outputValidated, msg: 'output validated' },
    { ok: input.receiptGenerated, msg: 'receipt generated' },
    { ok: input.benchmarkRetained, msg: 'benchmark retained' },
    {
      ok: layerSatisfiesMinimum(snap, 'NVIDIA_GPU', 'DETECTED') || input.gpuDetectedExact,
      msg: 'GPU layer at least DETECTED',
    },
  ];

  let allOk = reasons.length === 0;
  for (const p of preconditions) {
    if (!p.ok) {
      allOk = false;
      reasons.push(`Missing precondition: ${p.msg}`);
    }
  }

  // DOCUMENTED / DETECTED alone cannot verify.
  if (
    (snap.layers.NVIDIA_GPU.state === 'DOCUMENTED' ||
      snap.layers.NVIDIA_GPU.state === 'DETECTED') &&
    !allOk
  ) {
    reasons.push(
      `${snap.layers.NVIDIA_GPU.state} NVIDIA GPU cannot satisfy VERIFIED without full runtime evidence.`,
    );
  }

  const multiGpuState: MultiGpuState = input.multiGpuMeasured
    ? 'MULTI_GPU_VERIFIED'
    : allOk
      ? 'SINGLE_GPU_VERIFIED'
      : 'MULTI_GPU_NOT_TESTED';

  if (!input.multiGpuMeasured) {
    reasons.push('MULTI_GPU_NOT_TESTED until measured — no distributed/tensor/pipeline claims.');
  }

  if (allOk) {
    reasons.push('All model-load VERIFIED preconditions met for single-GPU path.');
  }

  return {
    nvidiaPathVerified: allOk,
    gpuState: allOk ? 'VERIFIED' : snap.layers.NVIDIA_GPU.state,
    runtimeState: allOk
      ? 'VERIFIED'
      : mapRuntimeMissing(input.runtimeId, snap),
    modelState: allOk ? 'VERIFIED' : 'NOT_TESTED',
    multiGpuState: allOk && !input.multiGpuMeasured
      ? 'SINGLE_GPU_VERIFIED'
      : multiGpuState,
    reasons,
    eligibleForVerifiedRouting: allOk,
  };
}

function mapRuntimeMissing(
  runtimeId: NvidiaRuntimeCandidateId,
  snap: NvidiaCapabilitySnapshot,
): TruthState {
  if (runtimeId === 'cuda') {
    return snap.layers.CUDA_RUNTIME.state === 'NOT_CONFIGURED'
      ? 'NOT_CONFIGURED'
      : snap.layers.CUDA_RUNTIME.state === 'UNAVAILABLE'
        ? 'UNAVAILABLE'
        : 'NOT_TESTED';
  }
  if (runtimeId === 'tensorrt' || runtimeId === 'tensorrt-llm') {
    return snap.layers.TENSORRT.state === 'NOT_CONFIGURED'
      ? 'NOT_CONFIGURED'
      : snap.layers.TENSORRT.state === 'UNAVAILABLE'
        ? 'UNAVAILABLE'
        : 'NOT_TESTED';
  }
  if (runtimeId === 'onnx-runtime-nvidia') {
    return snap.layers.ONNX_NVIDIA_PROVIDER.state === 'NOT_CONFIGURED'
      ? 'NOT_CONFIGURED'
      : 'NOT_TESTED';
  }
  return 'NOT_TESTED';
}

export function resolveRuntimeCandidateStatus(
  id: NvidiaRuntimeCandidateId,
  snap: NvidiaCapabilitySnapshot,
): NvidiaRuntimeCandidate {
  const base = NVIDIA_RUNTIME_CANDIDATES.find((c) => c.id === id)!;
  if (id === 'cuda' && snap.layers.CUDA_RUNTIME.state === 'NOT_CONFIGURED') {
    return {
      ...base,
      status: 'NOT_CONFIGURED',
      proven: false,
      notes: 'CUDA missing → NOT_CONFIGURED. No auto-install.',
    };
  }
  if (
    (id === 'tensorrt' || id === 'tensorrt-llm') &&
    snap.layers.TENSORRT.state === 'NOT_CONFIGURED'
  ) {
    return {
      ...base,
      status: 'NOT_CONFIGURED',
      proven: false,
      notes: 'TensorRT missing → NOT_CONFIGURED. No auto-install.',
    };
  }
  if (
    id === 'onnx-runtime-nvidia' &&
    snap.layers.ONNX_NVIDIA_PROVIDER.state === 'NOT_CONFIGURED'
  ) {
    return {
      ...base,
      status: 'NOT_CONFIGURED',
      proven: false,
      notes: 'ONNX NVIDIA provider NOT_CONFIGURED.',
    };
  }
  return { ...base };
}

export function attemptAutoInstallRuntime(): {
  denied: true;
  reason: string;
} {
  return {
    denied: true,
    reason:
      'MAY_AUTO_INSTALL_DRIVERS_CUDA_TENSORRT=false — missing runtime stays NOT_CONFIGURED/UNAVAILABLE.',
  };
}

export function attemptChangePathOrSystemConfig(): {
  denied: true;
  reason: string;
} {
  return {
    denied: true,
    reason: 'MAY_CHANGE_PATH_OR_SYSTEM_CONFIG=false — no PATH/system config mutation.',
  };
}

export function attemptRequestAdmin(): { denied: true; reason: string } {
  return {
    denied: true,
    reason: 'MAY_REQUEST_ADMIN=false — no admin elevation.',
  };
}
