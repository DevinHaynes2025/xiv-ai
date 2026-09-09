/**
 * 62L-EW9 — Intel runtime candidates (OpenVINO / ONNX / CPU-native / GPU / NPU).
 *
 * DOCUMENTED or NOT_CONFIGURED until local evidence. No silent driver/runtime install.
 */

import type { DeviceTruthState } from './ew9-types.ts';
import { EW9_LOCKS, intelEnvironmentHonesty } from './ew9-types.ts';

export const INTEL_RUNTIME_CANDIDATES = [
  'OPENVINO_COMPATIBLE',
  'ONNX_RUNTIME_INTEL',
  'CPU_NATIVE',
  'INTEL_GPU_RUNTIME',
  'INTEL_NPU_RUNTIME',
] as const;

export type IntelRuntimeCandidate = (typeof INTEL_RUNTIME_CANDIDATES)[number];

export type IntelRuntimeRecord = {
  runtimeId: IntelRuntimeCandidate;
  state: DeviceTruthState;
  configured: boolean;
  installAttempted: false;
  note: string;
};

export function defaultIntelRuntimeTable(): Record<
  IntelRuntimeCandidate,
  IntelRuntimeRecord
> {
  const env = intelEnvironmentHonesty();
  return {
    OPENVINO_COMPATIBLE: {
      runtimeId: 'OPENVINO_COMPATIBLE',
      state: env.openVinoState,
      configured: false,
      installAttempted: false,
      note: 'OpenVINO-compatible candidate — NOT_CONFIGURED until local evidence.',
    },
    ONNX_RUNTIME_INTEL: {
      runtimeId: 'ONNX_RUNTIME_INTEL',
      state: env.onnxProviderState,
      configured: false,
      installAttempted: false,
      note: 'ONNX Runtime Intel path — NOT_CONFIGURED until local evidence.',
    },
    CPU_NATIVE: {
      runtimeId: 'CPU_NATIVE',
      state: 'SUPPORTED',
      configured: true,
      installAttempted: false,
      note: 'CPU-native XIV baseline — supported for bounded CPU tests.',
    },
    INTEL_GPU_RUNTIME: {
      runtimeId: 'INTEL_GPU_RUNTIME',
      state: 'NOT_CONFIGURED',
      configured: false,
      installAttempted: false,
      note: 'Intel GPU runtime candidate — NOT_CONFIGURED; no silent install.',
    },
    INTEL_NPU_RUNTIME: {
      runtimeId: 'INTEL_NPU_RUNTIME',
      state: 'NOT_CONFIGURED',
      configured: false,
      installAttempted: false,
      note: 'Intel NPU runtime candidate — NOT_CONFIGURED; no silent install.',
    },
  };
}

/**
 * Resolve runtime for a preferred device. Missing → NOT_CONFIGURED / UNAVAILABLE.
 * Never silently installs.
 */
export function resolveIntelRuntime(input: {
  preferredDevice: 'INTEL_CPU' | 'INTEL_GPU' | 'INTEL_NPU';
  runtimes?: Readonly<Record<IntelRuntimeCandidate, IntelRuntimeRecord>>;
}): {
  runtime: IntelRuntimeRecord;
  eligible: boolean;
  failureClass: 'RUNTIME_NOT_CONFIGURED' | 'RUNTIME_UNAVAILABLE' | null;
} {
  void EW9_LOCKS.MAY_SILENT_DRIVER_RUNTIME_INSTALL; // must remain false
  const table = input.runtimes ?? defaultIntelRuntimeTable();

  if (input.preferredDevice === 'INTEL_CPU') {
    const runtime = table.CPU_NATIVE;
    return { runtime, eligible: true, failureClass: null };
  }

  if (input.preferredDevice === 'INTEL_GPU') {
    const runtime =
      table.INTEL_GPU_RUNTIME.state !== 'NOT_CONFIGURED' &&
      table.INTEL_GPU_RUNTIME.state !== 'UNAVAILABLE'
        ? table.INTEL_GPU_RUNTIME
        : table.OPENVINO_COMPATIBLE.state !== 'NOT_CONFIGURED' &&
            table.OPENVINO_COMPATIBLE.state !== 'UNAVAILABLE'
          ? table.OPENVINO_COMPATIBLE
          : table.ONNX_RUNTIME_INTEL;

    if (runtime.state === 'UNAVAILABLE' || runtime.state === 'REVOKED') {
      return {
        runtime,
        eligible: false,
        failureClass: 'RUNTIME_UNAVAILABLE',
      };
    }
    if (
      runtime.state === 'NOT_CONFIGURED' ||
      (!runtime.configured && runtime.state !== 'VERIFIED')
    ) {
      return {
        runtime: { ...runtime, state: 'NOT_CONFIGURED' },
        eligible: false,
        failureClass: 'RUNTIME_NOT_CONFIGURED',
      };
    }
    return { runtime, eligible: true, failureClass: null };
  }

  // INTEL_NPU — prefer explicit NPU runtime, else OpenVINO candidate
  const npuPreferred =
    table.INTEL_NPU_RUNTIME.state === 'UNAVAILABLE' ||
    table.INTEL_NPU_RUNTIME.state === 'REVOKED'
      ? table.INTEL_NPU_RUNTIME
      : table.INTEL_NPU_RUNTIME.state !== 'NOT_CONFIGURED'
        ? table.INTEL_NPU_RUNTIME
        : table.OPENVINO_COMPATIBLE;

  if (
    npuPreferred.state === 'UNAVAILABLE' ||
    npuPreferred.state === 'REVOKED'
  ) {
    return {
      runtime: npuPreferred,
      eligible: false,
      failureClass: 'RUNTIME_UNAVAILABLE',
    };
  }
  if (
    npuPreferred.state === 'NOT_CONFIGURED' ||
    (!npuPreferred.configured && npuPreferred.state !== 'VERIFIED')
  ) {
    return {
      runtime: { ...npuPreferred, state: 'NOT_CONFIGURED' },
      eligible: false,
      failureClass: 'RUNTIME_NOT_CONFIGURED',
    };
  }
  return { runtime: npuPreferred, eligible: true, failureClass: null };
}

/** Explicit deny of silent installs. */
export function attemptSilentRuntimeInstall(): {
  attempted: false;
  denied: true;
  reason: string;
} {
  return {
    attempted: false,
    denied: true,
    reason:
      'MAY_SILENT_DRIVER_RUNTIME_INSTALL=false — no silent OpenVINO/ONNX/driver install.',
  };
}
