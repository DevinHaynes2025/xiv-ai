/**
 * 62L-EW9 — Intel capability truth table (independent device/runtime classes).
 */

import type { DeviceTruthState, IntelDevice, IntelTruthClass } from './ew9-types.ts';
import { INTEL_DEVICES, INTEL_TRUTH_CLASSES, intelEnvironmentHonesty } from './ew9-types.ts';

export type IntelCapabilityRecord = {
  classId: IntelTruthClass;
  state: DeviceTruthState;
  detected: boolean;
  lastEvidenceAt: string | null;
  evidenceMaxAgeMs: number | null;
  note: string;
};

export type IntelDeviceCapability = {
  device: IntelDevice;
  state: DeviceTruthState;
  detected: boolean;
  runtimeProvider: string | null;
  lastEvidenceAt: string | null;
  evidenceMaxAgeMs: number | null;
  note: string;
};

export function defaultIntelCapabilityTable(): Record<
  IntelTruthClass,
  IntelCapabilityRecord
> {
  const env = intelEnvironmentHonesty();
  return {
    INTEL_CPU: {
      classId: 'INTEL_CPU',
      state: 'NOT_TESTED',
      detected: false,
      lastEvidenceAt: null,
      evidenceMaxAgeMs: 86_400_000,
      note: 'CPU presence probe not run — NOT_TESTED ≠ VERIFIED.',
    },
    INTEL_GPU: {
      classId: 'INTEL_GPU',
      state: env.gpuState,
      detected: false,
      lastEvidenceAt: null,
      evidenceMaxAgeMs: 86_400_000,
      note: env.note,
    },
    INTEL_NPU: {
      classId: 'INTEL_NPU',
      state: env.npuState,
      detected: false,
      lastEvidenceAt: null,
      evidenceMaxAgeMs: 86_400_000,
      note: env.note,
    },
    OPENVINO_RUNTIME: {
      classId: 'OPENVINO_RUNTIME',
      state: env.openVinoState,
      detected: false,
      lastEvidenceAt: null,
      evidenceMaxAgeMs: 86_400_000,
      note: 'OpenVINO NOT_CONFIGURED until local evidence — no silent install.',
    },
    ONNX_RUNTIME_PROVIDER: {
      classId: 'ONNX_RUNTIME_PROVIDER',
      state: env.onnxProviderState,
      detected: false,
      lastEvidenceAt: null,
      evidenceMaxAgeMs: 86_400_000,
      note: 'ONNX Runtime Intel EP NOT_CONFIGURED until local evidence.',
    },
    OTHER_DOCUMENTED_RUNTIME: {
      classId: 'OTHER_DOCUMENTED_RUNTIME',
      state: env.otherRuntimeState,
      detected: false,
      lastEvidenceAt: null,
      evidenceMaxAgeMs: 86_400_000,
      note: 'Other documented Intel runtimes remain DOCUMENTED only.',
    },
  };
}

export function defaultIntelDeviceTable(): Record<
  IntelDevice,
  IntelDeviceCapability
> {
  const env = intelEnvironmentHonesty();
  return {
    INTEL_CPU: {
      device: 'INTEL_CPU',
      state: 'VERIFIED',
      detected: true,
      runtimeProvider: 'xiv-intel-cpu-safe-baseline',
      lastEvidenceAt: new Date().toISOString(),
      evidenceMaxAgeMs: 86_400_000,
      note: 'CPU safe baseline — eligible when VERIFIED. Does not verify GPU/NPU.',
    },
    INTEL_GPU: {
      device: 'INTEL_GPU',
      state: env.gpuState,
      detected: false,
      runtimeProvider: null,
      lastEvidenceAt: null,
      evidenceMaxAgeMs: 86_400_000,
      note: env.note,
    },
    INTEL_NPU: {
      device: 'INTEL_NPU',
      state: env.npuState,
      detected: false,
      runtimeProvider: null,
      lastEvidenceAt: null,
      evidenceMaxAgeMs: 86_400_000,
      note: env.note,
    },
  };
}

export function listIntelTruthClasses(): readonly IntelTruthClass[] {
  return INTEL_TRUTH_CLASSES;
}

export function listIntelDevices(): readonly IntelDevice[] {
  return INTEL_DEVICES;
}

/** CPU present must never imply GPU/NPU verified. */
export function cpuPresentImpliesGpuVerified(): false {
  return false;
}

export function npuDetectedImpliesNpuInferenceVerified(): false {
  return false;
}
