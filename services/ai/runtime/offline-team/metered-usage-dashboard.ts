export type UsageMetric = 'CPU_SECONDS' | 'GPU_SECONDS' | 'STORAGE_BYTES' | 'API_CALLS' | 'MODEL_TOKENS' | 'VECTOR_OPS' | 'QUANTUM_SIM_JOBS';

export interface UsageRecord {
  tenantId: string;
  developerId: string;
  metric: UsageMetric;
  quantity: number;
  unitPriceMicros: number;
  evidenceRef: string;
  measuredAt: string;
}

export interface UsageSummary {
  byMetric: Record<string, number>;
  estimatedChargeMicros: number;
  evidenceRefs: string[];
}

export function summarizeUsage(records: UsageRecord[]): UsageSummary {
  const byMetric: Record<string, number> = {};
  let estimatedChargeMicros = 0;
  const evidenceRefs = new Set<string>();
  for (const record of records) {
    if (!record.evidenceRef || record.quantity < 0 || record.unitPriceMicros < 0) continue;
    byMetric[record.metric] = (byMetric[record.metric] ?? 0) + record.quantity;
    estimatedChargeMicros += Math.round(record.quantity * record.unitPriceMicros);
    evidenceRefs.add(record.evidenceRef);
  }
  return { byMetric, estimatedChargeMicros, evidenceRefs: [...evidenceRefs] };
}

export const USAGE_DASHBOARD_POLICY = {
  measuredEventsOnly: true,
  fabricatedUsageAllowed: false,
  qpuClaimWithoutHardwareReceipt: false,
  rawTopSecretPayloadsInDashboard: false,
} as const;
