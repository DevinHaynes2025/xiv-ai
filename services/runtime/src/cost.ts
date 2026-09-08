import type { AuditLedger } from './audit';
import type { Clock } from './clock';
import type { IdFactory } from './ids';
import { tenantKey } from './isolation';
import type { ModelInvocationRecord, TenantRef, WorkloadUsage } from './types';

export type ComputeUsageRecord = {
  recordId: string;
  workloadId: string;
  tenant: TenantRef;
  nodeId: string | null;
  cpuMillis: number;
  gpuMillis: number;
  ramMbMillis: number;
  costUsd: number;
  attributed: boolean;
  at: number;
};

export type CostAnomalyAlert = {
  alertId: string;
  tenant: TenantRef;
  workloadId: string;
  observedUsd: number;
  baselineUsd: number;
  at: number;
};

export type BudgetAuthorization = {
  workloadId: string;
  approvedByPrincipalId: string;
  extraUsd: number;
  at: number;
};

/**
 * Cost governance (AC-21).
 *
 * Every workload writes exactly one compute-usage record. A workload that
 * exceeds its cost budget may only continue when a policy authorization exists,
 * and continuation without one is counted rather than tolerated.
 */
export class CostLedger {
  private readonly records: ComputeUsageRecord[] = [];
  private readonly anomalies: CostAnomalyAlert[] = [];
  private readonly authorizations = new Map<string, BudgetAuthorization>();
  private readonly monitoredResources = new Set<string>();
  private readonly alertedResources = new Set<string>();
  private unauthorizedContinuations = 0;

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
    private readonly audit: AuditLedger,
  ) {}

  monitorResource(resource: string) {
    this.monitoredResources.add(resource);
  }

  recordUsage(input: { usage: WorkloadUsage; invocations: readonly ModelInvocationRecord[] }): ComputeUsageRecord {
    const modelCost = input.invocations.reduce((total, record) => total + (record.costUsd ?? 0), 0);
    const record: ComputeUsageRecord = {
      recordId: this.ids.mint('usage'),
      workloadId: input.usage.workloadId,
      tenant: input.usage.tenant,
      nodeId: input.usage.nodeId,
      cpuMillis: input.usage.consumed.cpuMillis,
      gpuMillis: input.usage.consumed.gpuMillis,
      ramMbMillis: input.usage.consumed.ramMb * Math.max(1, input.usage.durationMs),
      costUsd: input.usage.costUsd + modelCost,
      attributed: input.usage.nodeId !== null && Boolean(input.usage.tenant.organizationId),
      at: this.clock.now(),
    };
    this.records.push(record);
    return record;
  }

  authorizeOverrun(input: { workloadId: string; approvedByPrincipalId: string; extraUsd: number }) {
    const authorization: BudgetAuthorization = { ...input, at: this.clock.now() };
    this.authorizations.set(input.workloadId, authorization);
    this.audit.append({
      tenant: null,
      category: 'resource',
      kind: 'budget_overrun_authorized',
      subjectId: input.workloadId,
      principalId: input.approvedByPrincipalId,
      detail: { extraUsd: input.extraUsd },
    });
    return authorization;
  }

  /** Returns true only when continuation is backed by a policy authorization. */
  mayContinueOverBudget(workloadId: string): boolean {
    const authorization = this.authorizations.get(workloadId);
    if (!authorization) {
      this.unauthorizedContinuations += 1;
      return false;
    }
    return true;
  }

  raiseAnomaly(input: { tenant: TenantRef; workloadId: string; observedUsd: number; baselineUsd: number; resource: string }) {
    const alert: CostAnomalyAlert = {
      alertId: this.ids.mint('costalert'),
      tenant: input.tenant,
      workloadId: input.workloadId,
      observedUsd: input.observedUsd,
      baselineUsd: input.baselineUsd,
      at: this.clock.now(),
    };
    this.anomalies.push(alert);
    this.alertedResources.add(input.resource);
    this.audit.append({
      tenant: input.tenant,
      category: 'resource',
      kind: 'cost_anomaly_raised',
      subjectId: input.workloadId,
      detail: { observedUsd: input.observedUsd, baselineUsd: input.baselineUsd, resource: input.resource },
    });
    return alert;
  }

  coverage(workloadIds: readonly string[]): number {
    if (!workloadIds.length) return 0;
    const covered = workloadIds.filter((id) => this.records.some((record) => record.workloadId === id)).length;
    return covered / workloadIds.length;
  }

  attributionRate(): number {
    if (!this.records.length) return 0;
    return this.records.filter((record) => record.attributed).length / this.records.length;
  }

  unattributedSpendShare(): number {
    const total = this.records.reduce((sum, record) => sum + record.costUsd, 0);
    if (total === 0) return 0;
    const unattributed = this.records
      .filter((record) => !record.attributed)
      .reduce((sum, record) => sum + record.costUsd, 0);
    return unattributed / total;
  }

  anomalyCoverage(): number {
    if (!this.monitoredResources.size) return 0;
    let covered = 0;
    for (const resource of this.monitoredResources) if (this.alertedResources.has(resource)) covered += 1;
    return covered / this.monitoredResources.size;
  }

  spendByTenant(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const record of this.records) {
      const key = tenantKey(record.tenant);
      out[key] = (out[key] ?? 0) + record.costUsd;
    }
    return out;
  }

  get unauthorizedOverBudgetContinuations() {
    return this.unauthorizedContinuations;
  }

  get recordCount() {
    return this.records.length;
  }

  export() {
    return { records: [...this.records], anomalies: [...this.anomalies] };
  }
}
