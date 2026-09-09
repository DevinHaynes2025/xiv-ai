/**
 * 62L-EL7 — Execution provider registry (truthful defaults).
 *
 * GPU/NPU remain NOT_TESTED until real model-load + bounded inference evidence exists.
 * CPU is the safe routing fallback; it is not auto-VERIFIED for inference without evidence.
 */

import type { CapabilityState, ComputeKind } from './types';

export type ExecutionProviderId = 'cpu' | 'amd-gpu' | 'amd-npu' | 'windows-ml' | 'onnx-runtime';

export type ExecutionProviderRecord = {
  id: ExecutionProviderId;
  device: ComputeKind;
  /** Capability for scheduling/inference selection. */
  state: CapabilityState;
  label: string;
  evidence: string[];
  /** True only when a measured load+inference fixture/evidence boundary is attached. */
  measuredEvidencePresent: boolean;
};

/** Default registry: accelerators NOT_TESTED; CPU DETECTED for routing, not VERIFIED for inference. */
export function defaultExecutionProviderRegistry(): ExecutionProviderRecord[] {
  return [
    {
      id: 'cpu',
      device: 'cpu',
      state: 'DETECTED',
      label: 'CPU (safe fallback path)',
      evidence: ['CPU is the deterministic safe routing fallback until a provider is VERIFIED.'],
      measuredEvidencePresent: false,
    },
    {
      id: 'amd-gpu',
      device: 'gpu',
      state: 'NOT_TESTED',
      label: 'AMD GPU',
      evidence: ['GPU execution remains NOT_TESTED until bounded local inference evidence exists.'],
      measuredEvidencePresent: false,
    },
    {
      id: 'amd-npu',
      device: 'npu',
      state: 'NOT_TESTED',
      label: 'AMD NPU',
      evidence: ['NPU execution remains NOT_TESTED until bounded local inference evidence exists.'],
      measuredEvidencePresent: false,
    },
    {
      id: 'windows-ml',
      device: 'cpu',
      state: 'NOT_TESTED',
      label: 'Windows ML (candidate)',
      evidence: ['Windows ML is a candidate bridge only — not auto-installed or proven by EL7.'],
      measuredEvidencePresent: false,
    },
    {
      id: 'onnx-runtime',
      device: 'cpu',
      state: 'NOT_TESTED',
      label: 'ONNX Runtime (candidate)',
      evidence: ['ONNX Runtime EP candidate — not auto-installed or proven by EL7.'],
      measuredEvidencePresent: false,
    },
  ];
}

/**
 * Select preferred VERIFIED provider; otherwise CPU routing fallback.
 * Never selects GPU/NPU while NOT_TESTED/UNAVAILABLE.
 */
export function selectVerifiedOrCpuFallback(
  registry: ExecutionProviderRecord[],
  preferredDevice: ComputeKind | 'auto' = 'auto',
): {
  selected: ExecutionProviderRecord;
  usedVerified: boolean;
  fellBackToCpu: boolean;
  reason: string;
} {
  const verified = registry.filter((p) => p.state === 'VERIFIED' && p.measuredEvidencePresent);

  if (preferredDevice !== 'auto') {
    const preferredVerified = verified.find((p) => p.device === preferredDevice);
    if (preferredVerified) {
      return {
        selected: preferredVerified,
        usedVerified: true,
        fellBackToCpu: false,
        reason: `VERIFIED_${preferredDevice.toUpperCase()}_SELECTED`,
      };
    }
  } else if (verified.length > 0) {
    // Prefer NPU → GPU → CPU among verified
    const ordered =
      verified.find((p) => p.device === 'npu') ??
      verified.find((p) => p.device === 'gpu') ??
      verified.find((p) => p.device === 'cpu') ??
      verified[0];
    return {
      selected: ordered,
      usedVerified: true,
      fellBackToCpu: ordered.device === 'cpu' && preferredDevice === 'auto',
      reason: `VERIFIED_${ordered.device.toUpperCase()}_SELECTED`,
    };
  }

  const cpu =
    registry.find((p) => p.id === 'cpu') ??
    ({
      id: 'cpu' as const,
      device: 'cpu' as const,
      state: 'DETECTED' as const,
      label: 'CPU (safe fallback path)',
      evidence: ['synthetic cpu fallback'],
      measuredEvidencePresent: false,
    } satisfies ExecutionProviderRecord);

  return {
    selected: cpu,
    usedVerified: false,
    fellBackToCpu: true,
    reason: 'CPU_SAFE_FALLBACK_NO_VERIFIED_PROVIDER',
  };
}
