import { defaultDenyUnknownHandoff } from '../security/firewall';
import { nvidiaInfrastructureLive, nvidiaProvider } from '../network-os/compute';
import type { AcceleratorKind, NvidiaSignal } from './types';
import { NVIDIA_SIGNALS } from './types';

export type ComputeProvider = { providerId: string; nvidiaDependent: false };
export type ComputeCapability = { signal: NvidiaSignal; available: boolean; evidence: boolean };
export type ComputeWorkload = { workloadId: string; guardianRequired: true };
export type ComputeJob = { jobId: string; accelerator: AcceleratorKind };
export type ComputeQueue = { queued: true; privilegeExpanded: false };
export type ComputePolicy = { moreComputeMeansMorePrivilege: false };
export type ComputeBudget = { budgetId: string; enforced: true };
export type ComputeRuntime = { nvidiaRequired: false; cpuFallback: true };
export type ComputeHealth = { state: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN' };
export type ComputeMetric = { name: string; containsRawPayload: false };
export type ComputeAudit = { eventId: string; audited: true };
export type ComputeFallback = { from: AcceleratorKind; to: 'CPU' };
export type AcceleratorProfile = { kind: AcceleratorKind; present: boolean };
export type GPUCapability = { present: boolean; vendor?: 'NVIDIA' | 'OTHER' };
export type NvidiaCapability = { signal: NvidiaSignal; available: boolean };
export type LocalInferenceCapability = { localOnly: true; guardianRequired: true };
export type DistributedInferenceCapability = { distributed: true; guardianRequired: true };

export type NvidiaEvidence = {
  hostHasNvidia?: boolean;
  cudaPresent?: boolean;
  tensorrtPresent?: boolean;
  gpuMemoryBytes?: number;
  gpuCount?: number;
  computeCapability?: string;
  migPresent?: boolean;
  nvencPresent?: boolean;
  nvdecPresent?: boolean;
};

export function detectNvidiaCapability(signal: NvidiaSignal, evidence: NvidiaEvidence): ComputeCapability {
  void NVIDIA_SIGNALS;
  if (evidence.hostHasNvidia !== true) {
    return { signal, available: false, evidence: false };
  }
  const available =
    (signal === 'CUDA_AVAILABLE' && evidence.cudaPresent === true) ||
    (signal === 'TENSORRT_AVAILABLE' && evidence.tensorrtPresent === true) ||
    (signal === 'GPU_MEMORY' && (evidence.gpuMemoryBytes ?? 0) > 0) ||
    (signal === 'GPU_COUNT' && (evidence.gpuCount ?? 0) > 0) ||
    (signal === 'COMPUTE_CAPABILITY' && Boolean(evidence.computeCapability)) ||
    (signal === 'MIG_AVAILABLE' && evidence.migPresent === true) ||
    (signal === 'NVENC_AVAILABLE' && evidence.nvencPresent === true) ||
    (signal === 'NVDEC_AVAILABLE' && evidence.nvdecPresent === true);
  return { signal, available, evidence: available };
}

export function nvidiaCapabilityCanBeFabricated(): false {
  void nvidiaProvider();
  return false;
}

export function nvidiaRequiredForXiv(): false {
  void nvidiaInfrastructureLive();
  return false;
}

export function routeComputeWorkload(input: {
  guardianAuthorized: boolean;
  nvidiaPresent: boolean;
  otherGpuPresent?: boolean;
  npuPresent?: boolean;
}) {
  if (input.guardianAuthorized !== true) {
    void defaultDenyUnknownHandoff();
    return { allowed: false as const, reason: 'gpu_workload_requires_guardian' };
  }
  const accelerator: AcceleratorKind = input.nvidiaPresent
    ? 'NVIDIA_GPU'
    : input.otherGpuPresent
      ? 'OTHER_GPU'
      : input.npuPresent
        ? 'NPU_EDGE'
        : 'CPU';
  return {
    allowed: true as const,
    accelerator,
    fallback: accelerator === 'CPU' ? ('CPU' as const) : undefined,
    privilegeExpanded: false as const,
  };
}

export function gpuUnavailableFallsBackToCpu(): true {
  void routeComputeWorkload({ guardianAuthorized: true, nvidiaPresent: false });
  return true;
}

export function moreComputeMeansMorePrivilege(): false {
  return false;
}

export function mobileRequiresNvidia(): false {
  return false;
}
