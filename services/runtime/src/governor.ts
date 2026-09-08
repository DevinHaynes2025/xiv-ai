import type { AuditLedger } from './audit';
import type { Clock } from './clock';
import { RuntimeError } from './errors';
import type { IdFactory } from './ids';
import { tenantKey } from './isolation';
import type { ResourceBudget, ResourceDimension, TenantRef, WorkloadUsage } from './types';

export const RESOURCE_DIMENSIONS: readonly ResourceDimension[] = [
  'cpuMillis',
  'gpuMillis',
  'ramMb',
  'storageMb',
  'networkKb',
  'modelCalls',
  'modelTokens',
  'maxDurationMs',
  'maxAgents',
  'maxTasks',
  'maxCostUsd',
];

/** Nothing in this layer may declare a hard termination beyond this ceiling. */
export const MANDATORY_HARD_TERMINATION_MS = 15 * 60 * 1000;

/** Agents may not spawn agents beyond this depth, whatever their budget says. */
export const MAX_AGENT_SPAWN_DEPTH = 4;

export type TenantQuota = {
  tenant: TenantRef;
  cpuMillis: number;
  gpuMillis: number;
  modelCalls: number;
  modelTokens: number;
  costUsd: number;
  concurrentWorkloads: number;
};

export type BudgetLease = {
  leaseId: string;
  workloadId: string;
  tenant: TenantRef;
  budget: ResourceBudget;
  consumed: Record<ResourceDimension, number>;
  spawnDepth: number;
  startedAt: number | null;
  closed: boolean;
  terminatedByLimit: ResourceDimension | 'duration' | null;
};

function emptyConsumption(): Record<ResourceDimension, number> {
  return {
    cpuMillis: 0,
    gpuMillis: 0,
    ramMb: 0,
    storageMb: 0,
    networkKb: 0,
    modelCalls: 0,
    modelTokens: 0,
    maxDurationMs: 0,
    maxAgents: 0,
    maxTasks: 0,
    maxCostUsd: 0,
  };
}

/**
 * Resource governor (AC-08).
 *
 * Admission is the enforcement point: a workload with a missing, non-finite,
 * non-positive or over-ceiling dimension is never admitted, so there is no
 * runtime path on which an unbounded workload exists. After admission every
 * consumption call is checked against both the workload budget and the tenant
 * quota, and the first breach terminates the lease.
 */
export class ResourceGovernor {
  private readonly leases = new Map<string, BudgetLease>();
  private readonly quotas = new Map<string, TenantQuota>();
  private readonly tenantConsumption = new Map<string, { cpuMillis: number; gpuMillis: number; modelCalls: number; modelTokens: number; costUsd: number; active: number }>();
  private readonly usage: WorkloadUsage[] = [];
  private quotaBypassAttempts = 0;

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
    private readonly audit: AuditLedger,
  ) {}

  setQuota(quota: TenantQuota) {
    this.quotas.set(tenantKey(quota.tenant), quota);
  }

  quotaFor(tenant: TenantRef): TenantQuota | undefined {
    return this.quotas.get(tenantKey(tenant));
  }

  private tenantState(tenant: TenantRef) {
    const key = tenantKey(tenant);
    const existing = this.tenantConsumption.get(key);
    if (existing) return existing;
    const fresh = { cpuMillis: 0, gpuMillis: 0, modelCalls: 0, modelTokens: 0, costUsd: 0, active: 0 };
    this.tenantConsumption.set(key, fresh);
    return fresh;
  }

  validateBudget(budget: ResourceBudget): { ok: true } | { ok: false; reason: string } {
    for (const dimension of RESOURCE_DIMENSIONS) {
      const value = budget[dimension];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        return { ok: false, reason: `unbounded_dimension:${dimension}` };
      }
    }
    if (!Number.isFinite(budget.hardTerminationMs) || budget.hardTerminationMs <= 0) {
      return { ok: false, reason: 'missing_hard_termination_limit' };
    }
    if (budget.hardTerminationMs > MANDATORY_HARD_TERMINATION_MS) {
      return { ok: false, reason: 'hard_termination_above_ceiling' };
    }
    if (budget.maxDurationMs > budget.hardTerminationMs) {
      return { ok: false, reason: 'duration_above_hard_termination' };
    }
    if (budget.maxAgents < 1 || budget.maxTasks < 1) {
      return { ok: false, reason: 'agent_or_task_budget_below_one' };
    }
    return { ok: true };
  }

  admit(input: { workloadId: string; tenant: TenantRef; budget: ResourceBudget }): BudgetLease {
    const validation = this.validateBudget(input.budget);
    if (!validation.ok) {
      this.audit.append({
        tenant: input.tenant,
        category: 'resource',
        kind: 'budget_rejected',
        subjectId: input.workloadId,
        detail: { reason: validation.reason },
      });
      throw new RuntimeError('quota_exceeded', 'The workload budget is not enforceable.', {
        reason: validation.reason,
      });
    }

    const quota = this.quotaFor(input.tenant);
    if (!quota) {
      throw new RuntimeError('quota_exceeded', 'This tenant has no resource quota configured.', {
        tenant: tenantKey(input.tenant),
      });
    }
    const state = this.tenantState(input.tenant);
    if (state.active + 1 > quota.concurrentWorkloads) {
      this.quotaBypassAttempts += 1;
      this.audit.append({
        tenant: input.tenant,
        category: 'resource',
        kind: 'quota_denied',
        subjectId: input.workloadId,
        detail: { reason: 'concurrent_workloads', limit: quota.concurrentWorkloads },
      });
      throw new RuntimeError('quota_exceeded', 'The tenant concurrency quota is exhausted.', {
        limit: quota.concurrentWorkloads,
      });
    }
    if (
      state.cpuMillis + input.budget.cpuMillis > quota.cpuMillis ||
      state.gpuMillis + input.budget.gpuMillis > quota.gpuMillis ||
      state.modelCalls + input.budget.modelCalls > quota.modelCalls ||
      state.modelTokens + input.budget.modelTokens > quota.modelTokens ||
      state.costUsd + input.budget.maxCostUsd > quota.costUsd
    ) {
      this.quotaBypassAttempts += 1;
      this.audit.append({
        tenant: input.tenant,
        category: 'resource',
        kind: 'quota_denied',
        subjectId: input.workloadId,
        detail: { reason: 'tenant_quota_exhausted' },
      });
      throw new RuntimeError('quota_exceeded', 'The tenant resource quota cannot cover this budget.', {});
    }

    state.active += 1;
    const lease: BudgetLease = {
      leaseId: this.ids.mint('lease'),
      workloadId: input.workloadId,
      tenant: input.tenant,
      budget: input.budget,
      consumed: emptyConsumption(),
      spawnDepth: 0,
      startedAt: null,
      closed: false,
      terminatedByLimit: null,
    };
    this.leases.set(lease.leaseId, lease);
    this.audit.append({
      tenant: input.tenant,
      category: 'resource',
      kind: 'budget_attached',
      subjectId: input.workloadId,
      detail: { leaseId: lease.leaseId, hardTerminationMs: input.budget.hardTerminationMs },
    });
    return lease;
  }

  start(lease: BudgetLease) {
    lease.startedAt = this.clock.now();
  }

  private breach(lease: BudgetLease, dimension: ResourceDimension | 'duration', detail: Record<string, unknown>): never {
    lease.terminatedByLimit = dimension;
    this.audit.append({
      tenant: lease.tenant,
      category: 'resource',
      kind: dimension === 'duration' ? 'hard_termination_enforced' : 'budget_limit_enforced',
      subjectId: lease.workloadId,
      detail: { dimension, ...detail },
    });
    throw new RuntimeError(
      dimension === 'duration' ? 'hard_termination' : 'budget_exceeded',
      dimension === 'duration'
        ? 'The workload hit its mandatory hard termination limit.'
        : 'The workload exhausted its resource budget.',
      { dimension, workloadId: lease.workloadId },
    );
  }

  charge(lease: BudgetLease, dimension: ResourceDimension, amount: number) {
    if (lease.closed) {
      throw new RuntimeError('budget_exceeded', 'The resource lease is closed.', { leaseId: lease.leaseId });
    }
    if (!Number.isFinite(amount) || amount < 0) {
      throw new RuntimeError('malformed', 'Resource consumption must be a non-negative number.', { dimension });
    }
    this.enforceDuration(lease);

    const next = (lease.consumed[dimension] ?? 0) + amount;
    if (next > lease.budget[dimension]) {
      this.breach(lease, dimension, { requested: next, limit: lease.budget[dimension] });
    }
    lease.consumed[dimension] = next;

    const quota = this.quotaFor(lease.tenant);
    const state = this.tenantState(lease.tenant);
    if (quota) {
      if (dimension === 'cpuMillis') state.cpuMillis += amount;
      if (dimension === 'gpuMillis') state.gpuMillis += amount;
      if (dimension === 'modelCalls') state.modelCalls += amount;
      if (dimension === 'modelTokens') state.modelTokens += amount;
      if (dimension === 'maxCostUsd') state.costUsd += amount;
      if (
        state.cpuMillis > quota.cpuMillis ||
        state.gpuMillis > quota.gpuMillis ||
        state.modelCalls > quota.modelCalls ||
        state.modelTokens > quota.modelTokens ||
        state.costUsd > quota.costUsd
      ) {
        this.quotaBypassAttempts += 1;
        this.breach(lease, dimension, { reason: 'tenant_quota_exhausted' });
      }
    }
  }

  /** Duration and the mandatory hard-termination ceiling are checked together. */
  enforceDuration(lease: BudgetLease) {
    if (lease.startedAt === null) return;
    const elapsed = this.clock.now() - lease.startedAt;
    lease.consumed.maxDurationMs = elapsed;
    if (elapsed > lease.budget.hardTerminationMs || elapsed > MANDATORY_HARD_TERMINATION_MS) {
      this.breach(lease, 'duration', { elapsed, limit: lease.budget.hardTerminationMs });
    }
    if (elapsed > lease.budget.maxDurationMs) {
      this.breach(lease, 'maxDurationMs', { elapsed, limit: lease.budget.maxDurationMs });
    }
  }

  /**
   * Agent spawn accounting. Both the count and the recursion depth are capped,
   * so an agent that tries to create agents that create agents terminates.
   */
  noteAgentSpawn(lease: BudgetLease, depth: number) {
    if (depth > MAX_AGENT_SPAWN_DEPTH) {
      lease.terminatedByLimit = 'maxAgents';
      this.audit.append({
        tenant: lease.tenant,
        category: 'resource',
        kind: 'recursive_agent_creation_blocked',
        subjectId: lease.workloadId,
        detail: { depth, limit: MAX_AGENT_SPAWN_DEPTH },
      });
      throw new RuntimeError('recursion_limit', 'Recursive agent creation exceeded the depth limit.', { depth });
    }
    lease.spawnDepth = Math.max(lease.spawnDepth, depth);
    this.charge(lease, 'maxAgents', 1);
  }

  noteTask(lease: BudgetLease) {
    this.charge(lease, 'maxTasks', 1);
  }

  noteModelCall(lease: BudgetLease, tokens: number, costUsd: number) {
    this.charge(lease, 'modelCalls', 1);
    this.charge(lease, 'modelTokens', tokens);
    if (costUsd > 0) this.charge(lease, 'maxCostUsd', costUsd);
  }

  close(lease: BudgetLease, nodeId: string | null, options: { costAttributed: boolean }): WorkloadUsage {
    if (!lease.closed) {
      lease.closed = true;
      const state = this.tenantState(lease.tenant);
      state.active = Math.max(0, state.active - 1);
    }
    const endedAt = this.clock.now();
    const record: WorkloadUsage = {
      workloadId: lease.workloadId,
      tenant: lease.tenant,
      nodeId,
      consumed: { ...lease.consumed },
      costUsd: lease.consumed.maxCostUsd,
      costAttributed: options.costAttributed,
      startedAt: lease.startedAt,
      endedAt,
      durationMs: lease.startedAt === null ? 0 : endedAt - lease.startedAt,
      terminatedByLimit: lease.terminatedByLimit,
    };
    this.usage.push(record);
    this.audit.append({
      tenant: lease.tenant,
      category: 'resource',
      kind: 'usage_recorded',
      subjectId: lease.workloadId,
      detail: {
        leaseId: lease.leaseId,
        costUsd: record.costUsd,
        terminatedByLimit: record.terminatedByLimit,
        durationMs: record.durationMs,
      },
    });
    return record;
  }

  usageFor(workloadId: string): WorkloadUsage | undefined {
    return this.usage.find((record) => record.workloadId === workloadId);
  }

  allUsage(): readonly WorkloadUsage[] {
    return this.usage;
  }

  get deniedQuotaAttempts() {
    return this.quotaBypassAttempts;
  }

  export() {
    return { usage: [...this.usage], quotas: Object.fromEntries(this.quotas.entries()) };
  }
}
