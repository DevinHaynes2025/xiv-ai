import type { BudgetOwner, ResourceBudget, ResourceUsage, TenantScope, WorkloadEstimate } from './types';

/**
 * Resource governor arithmetic (story section 17). Every runtime, agent and
 * universe carries a limit across all twelve dimensions so no single agent or
 * meeting can consume uncontrolled infrastructure.
 */

export const BUDGET_DIMENSIONS = [
  'cpuMillis',
  'gpuMillis',
  'ramMb',
  'storageMb',
  'networkMb',
  'tokens',
  'modelCalls',
  'agentCount',
  'taskCount',
  'energyWh',
  'costUsd',
  'durationMs',
] as const;

export type BudgetDimension = (typeof BUDGET_DIMENSIONS)[number];

export function zeroUsage(): ResourceUsage {
  return {
    cpuMillis: 0,
    gpuMillis: 0,
    ramMb: 0,
    storageMb: 0,
    networkMb: 0,
    tokens: 0,
    modelCalls: 0,
    agentCount: 0,
    taskCount: 0,
    energyWh: 0,
    costUsd: 0,
    durationMs: 0,
  };
}

export function budgetKey(scope: TenantScope, owner: BudgetOwner): string {
  return `${scope.organizationId}/${scope.universeId}/${owner.kind}/${owner.id}`;
}

export function addUsage(a: ResourceUsage, b: ResourceUsage): ResourceUsage {
  const out = zeroUsage();
  for (const dimension of BUDGET_DIMENSIONS) out[dimension] = a[dimension] + b[dimension];
  return out;
}

export function remaining(limit: ResourceBudget, used: ResourceUsage): ResourceBudget {
  const out = zeroUsage();
  for (const dimension of BUDGET_DIMENSIONS) out[dimension] = limit[dimension] - used[dimension];
  return out;
}

/** Returns the dimensions that a prospective charge would push past the limit. */
export function overLimitDimensions(
  limit: ResourceBudget,
  used: ResourceUsage,
  charge: ResourceUsage,
): BudgetDimension[] {
  const breaches: BudgetDimension[] = [];
  for (const dimension of BUDGET_DIMENSIONS) {
    if (used[dimension] + charge[dimension] > limit[dimension]) breaches.push(dimension);
  }
  return breaches;
}

/** Translates a workload estimate into the charge the governor reserves up front. */
export function chargeForEstimate(
  estimate: WorkloadEstimate,
  input: { usesGpu: boolean; monetaryUsd: number; energyWh: number; modelCalls: number },
): ResourceUsage {
  return {
    cpuMillis: input.usesGpu ? Math.round(estimate.runtimeMs * 0.2) : estimate.runtimeMs,
    gpuMillis: input.usesGpu ? estimate.runtimeMs : 0,
    ramMb: estimate.memoryMb,
    storageMb: estimate.storageMb,
    networkMb: estimate.bandwidthMb,
    tokens: estimate.tokens,
    modelCalls: input.modelCalls,
    agentCount: 0,
    taskCount: 1,
    energyWh: input.energyWh,
    costUsd: input.monetaryUsd,
    durationMs: estimate.runtimeMs,
  };
}

export function defaultNodeBudget(overrides: Partial<ResourceBudget> = {}): ResourceBudget {
  return {
    cpuMillis: 3_600_000,
    gpuMillis: 900_000,
    ramMb: 262_144,
    storageMb: 1_048_576,
    networkMb: 102_400,
    tokens: 2_000_000,
    modelCalls: 5_000,
    agentCount: 64,
    taskCount: 5_000,
    energyWh: 2_000,
    costUsd: 250,
    durationMs: 86_400_000,
    ...overrides,
  };
}
