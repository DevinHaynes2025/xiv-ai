/**
 * 62L-EX5 — QPU cost policy / spending governor.
 * External spend → HUMAN_APPROVAL_REQUIRED. No autonomous purchase.
 * Never store raw credentials. Never fabricate cost freshness.
 */

import {
  EX5_LOCKS,
  type CostPolicy,
  type GateResult,
  type SpendingLimits,
} from './qpu-types.ts';

export function defaultCostPolicy(overrides: Partial<CostPolicy> = {}): CostPolicy {
  return {
    policyId: overrides.policyId ?? 'qpu-cost-policy-default',
    currency: 'USD',
    maxSpendUsd: overrides.maxSpendUsd ?? 0,
    perJobMaxUsd: overrides.perJobMaxUsd ?? 0,
    externalSpendRequiresHumanApproval: true,
    autonomousPurchaseAllowed: false,
    version: overrides.version ?? 'ex5-0.1.0',
  };
}

export function defaultSpendingLimits(overrides: Partial<SpendingLimits> = {}): SpendingLimits {
  return {
    softLimitUsd: overrides.softLimitUsd ?? 0,
    hardLimitUsd: overrides.hardLimitUsd ?? 0,
    spentUsd: overrides.spentUsd ?? 0,
  };
}

export function evaluateCostGate(input: {
  estimatedCostUsd: number;
  budgetRemainingUsd: number;
  paymentRequired: boolean;
  humanApprovalGranted: boolean;
  costPolicy: CostPolicy;
  spendingLimits: SpendingLimits;
}): GateResult {
  const base = {
    providerState: null,
    backendState: null,
    physicalOrSimulator: null,
    physicalQpuVerified: false as const,
    quantumAdvantageVerified: false as const,
    fabricated: false as const,
    l4Enabled: false as const,
    guardianRlsUnchanged: true as const,
    executionClass: null,
  };

  if (EX5_LOCKS.BUY_QPU_CLOUD_AUTONOMOUSLY) {
    return {
      ...base,
      decision: 'DENIED',
      reason: 'AUTONOMOUS_PURCHASE_LOCK_VIOLATION',
      humanApprovalRequired: true,
    };
  }

  if (input.costPolicy.autonomousPurchaseAllowed !== false) {
    return {
      ...base,
      decision: 'DENIED',
      reason: 'AUTONOMOUS_PURCHASE_MUST_REMAIN_FALSE',
      humanApprovalRequired: true,
    };
  }

  if (input.estimatedCostUsd > input.budgetRemainingUsd) {
    return {
      ...base,
      decision: 'DENIED',
      reason: 'BUDGET_EXCEEDED',
      humanApprovalRequired: false,
    };
  }

  if (input.estimatedCostUsd > input.costPolicy.perJobMaxUsd && input.costPolicy.perJobMaxUsd >= 0) {
    if (input.estimatedCostUsd > 0 && input.costPolicy.perJobMaxUsd === 0) {
      return {
        ...base,
        decision: 'DENIED',
        reason: 'BUDGET_EXCEEDED',
        humanApprovalRequired: false,
      };
    }
  }

  const projectedSpend = input.spendingLimits.spentUsd + input.estimatedCostUsd;
  if (projectedSpend > input.spendingLimits.hardLimitUsd) {
    return {
      ...base,
      decision: 'DENIED',
      reason: 'BUDGET_EXCEEDED',
      humanApprovalRequired: false,
    };
  }

  if (
    input.paymentRequired ||
    (input.estimatedCostUsd > 0 && input.costPolicy.externalSpendRequiresHumanApproval)
  ) {
    if (!input.humanApprovalGranted) {
      return {
        ...base,
        decision: 'HUMAN_APPROVAL_REQUIRED',
        reason: 'EXTERNAL_SPEND_REQUIRES_HUMAN_APPROVAL',
        humanApprovalRequired: true,
      };
    }
  }

  return {
    ...base,
    decision: 'ALLOWED',
    reason: 'COST_GATE_PASSED',
    humanApprovalRequired: input.paymentRequired || input.estimatedCostUsd > 0,
  };
}
