export type ResourceKind = 'CPU_SECONDS' | 'GPU_SECONDS' | 'STORAGE_BYTES' | 'API_CALLS' | 'MODEL_TOKENS' | 'VECTOR_OPS' | 'QUANTUM_SIM_JOBS';

export interface UsageRecord {
  tenantId: string;
  developerId: string;
  resource: ResourceKind;
  quantity: number;
  unitPriceMicros: number;
  receiptRef: string;
  measuredAt: string;
}

export function usageChargeMicros(r: UsageRecord): number {
  if (!Number.isFinite(r.quantity) || r.quantity < 0 || !Number.isInteger(r.unitPriceMicros) || r.unitPriceMicros < 0 || !r.receiptRef) {
    throw new Error('invalid metered usage');
  }
  return Math.round(r.quantity * r.unitPriceMicros);
}

export const infrastructureRentalPolicy = {
  meteredUsageOnly: true,
  tenantIsolationRequired: true,
  quotaRequired: true,
  topSecretExternalComputeAllowed: false,
  realQpuClaimRequiresHardwareAndBenchmarkReceipt: true,
  quantumDefault: 'SIMULATOR_OR_VERIFIED_ADAPTER_ONLY',
};
