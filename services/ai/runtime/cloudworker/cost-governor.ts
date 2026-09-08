/**
 * Cost governor + model router connection for cloud workers.
 */

import { maxConcurrencyFor, openComputeGovernor } from '../cloudworkforce';
import type { ComputeGovernorLevel } from '../cloudworkforce/types';
import type { CostGovernorDecision, ModelRouterConnection } from './types';
import { detectCloudDeployment } from './deployment';

export function openCostGovernor(input?: {
  budgetRemaining?: number;
  computeLevel?: ComputeGovernorLevel;
}) {
  const level = input?.computeLevel ?? 'NORMAL';
  const gov = openComputeGovernor(level);
  return {
    budgetRemaining: input?.budgetRemaining ?? 100,
    compute: gov,
    selfExpandable: false as const,
    l4Enabled: false as const,
    productionLive: false as const,
  };
}

export function evaluateCost(
  governor: ReturnType<typeof openCostGovernor>,
  estimatedUnits: number,
): CostGovernorDecision {
  if (estimatedUnits <= 0) {
    return {
      allowed: false,
      reason: 'non_positive_cost',
      estimatedUnits,
      budgetRemaining: governor.budgetRemaining,
      selfExpandable: false,
    };
  }
  if (governor.compute.maxConcurrency <= 0) {
    return {
      allowed: false,
      reason: 'compute_emergency_block',
      estimatedUnits,
      budgetRemaining: governor.budgetRemaining,
      selfExpandable: false,
    };
  }
  if (estimatedUnits > governor.budgetRemaining) {
    return {
      allowed: false,
      reason: 'budget_exhausted',
      estimatedUnits,
      budgetRemaining: governor.budgetRemaining,
      selfExpandable: false,
    };
  }
  return {
    allowed: true,
    reason: 'within_budget',
    estimatedUnits,
    budgetRemaining: governor.budgetRemaining - estimatedUnits,
    selfExpandable: false,
  };
}

export function connectModelRouter(): ModelRouterConnection {
  // Model router module exists in services/ai — connection is CONFIGURED in-process,
  // not a live paid provider claim.
  const cloud = detectCloudDeployment('LOCAL_PROCESS');
  void cloud;
  return {
    connected: true,
    routerId: 'xiv-model-router',
    lifecycle: 'CONFIGURED',
    mayBypassBudget: false,
    l4Enabled: false,
  };
}

export function modelRouterMayBypassCost(_c: ModelRouterConnection): false {
  return false;
}

export function costRespectsComputePressure(level: ComputeGovernorLevel): number {
  return maxConcurrencyFor(level);
}
