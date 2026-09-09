/**
 * Mission budgets — cost ceilings; never self-expandable.
 */

import type { AgentBudget } from './types';

export function createAgentBudget(input: {
  budgetId: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  costCeiling: number;
  spent?: number;
}): AgentBudget {
  return {
    budgetId: input.budgetId,
    missionId: input.missionId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    costCeiling: input.costCeiling,
    spent: input.spent ?? 0,
    selfExpandable: false,
  };
}

export function evaluateBudgetSpend(
  budget: AgentBudget,
  additional: number,
):
  | { ok: true; budget: AgentBudget }
  | { ok: false; reason: string; audited: true } {
  if (additional < 0) {
    return { ok: false, reason: 'negative_spend_denied', audited: true };
  }
  const nextSpent = budget.spent + additional;
  if (nextSpent > budget.costCeiling) {
    return { ok: false, reason: 'budget_exceeded', audited: true };
  }
  return {
    ok: true,
    budget: { ...budget, spent: nextSpent, selfExpandable: false },
  };
}

export function budgetIsSelfExpandable(_budget: AgentBudget): false {
  return false;
}
