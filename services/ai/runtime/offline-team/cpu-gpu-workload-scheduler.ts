export type ComputeTarget = 'CPU' | 'GPU' | 'UNVERIFIED_GPU';

export interface WorkloadRequest {
  workloadId: string;
  tenantId: string;
  estimatedMemoryMb: number;
  gpuPreferred: boolean;
  consequential: boolean;
}

export interface ComputeReceipt {
  cpuDetected: boolean;
  gpuDetected: boolean;
  gpuVerified: boolean;
  availableMemoryMb: number;
}

export function scheduleWorkload(request: WorkloadRequest, receipt: ComputeReceipt): ComputeTarget {
  if (!receipt.cpuDetected) throw new Error('CPU receipt required');
  if (request.gpuPreferred && receipt.gpuDetected && receipt.gpuVerified && request.estimatedMemoryMb <= receipt.availableMemoryMb) return 'GPU';
  if (request.gpuPreferred && receipt.gpuDetected && !receipt.gpuVerified) return 'UNVERIFIED_GPU';
  return 'CPU';
}

export const computeGuardrails = {
  detectedIsNotVerified: true,
  verifiedGpuRequiredForGpuScheduling: true,
  consequentialActionsRequireHumanApproval: true,
};
