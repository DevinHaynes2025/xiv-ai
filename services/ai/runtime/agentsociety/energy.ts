/**
 * Energy-aware agent society — budgets, duty cycles, sleep/idle.
 * Architecture exists ≠ 24/7 live inference. Prefer batch/debrief over constant GPU burn.
 */

export type AgentEnergyState = 'ACTIVE' | 'IDLE' | 'SLEEP' | 'CHECKPOINT_ONLY';

export type EnergyBudget = {
  budgetId: string;
  organizationId: string;
  universeId: string;
  /** Soft energy units (tokens/compute proxy), not dollars. */
  ceiling: number;
  spent: number;
  selfExpandable: false;
  preferBatchOverContinuous: true;
};

export type DutyCycleWindow = {
  /** Local weekday 0=Sun … 6=Sat, or null = every day. */
  weekday: number | null;
  startHourLocal: number;
  endHourLocal: number;
  mode: 'ACTIVE' | 'CHECKPOINT_DEBRIEF' | 'SLEEP';
};

export type DutyCycle = {
  cycleId: string;
  timezone: string;
  windows: readonly DutyCycleWindow[];
  alwaysOn: false;
};

export const ARCHITECTURE_EXISTS_MEANS_247_LIVE = false as const;

export function architectureExistsMeans247Live(): false {
  return ARCHITECTURE_EXISTS_MEANS_247_LIVE;
}

export function createEnergyBudget(input: {
  budgetId: string;
  organizationId: string;
  universeId: string;
  ceiling: number;
  spent?: number;
}): EnergyBudget {
  return {
    budgetId: input.budgetId,
    organizationId: input.organizationId,
    universeId: input.universeId,
    ceiling: input.ceiling,
    spent: input.spent ?? 0,
    selfExpandable: false,
    preferBatchOverContinuous: true,
  };
}

export function createDutyCycle(input: {
  cycleId: string;
  timezone?: string;
  windows: readonly DutyCycleWindow[];
}): DutyCycle {
  return {
    cycleId: input.cycleId,
    timezone: input.timezone ?? 'America/Chicago',
    windows: input.windows,
    alwaysOn: false,
  };
}

export function chargeEnergy(
  budget: EnergyBudget,
  cost: number,
):
  | { ok: true; budget: EnergyBudget }
  | { ok: false; reason: 'energy_budget_exhausted' | 'negative_charge_denied'; audited: true; budget: EnergyBudget } {
  if (cost < 0) {
    return { ok: false, reason: 'negative_charge_denied', audited: true, budget };
  }
  const next = budget.spent + cost;
  if (next > budget.ceiling) {
    return {
      ok: false,
      reason: 'energy_budget_exhausted',
      audited: true,
      budget,
    };
  }
  return {
    ok: true,
    budget: { ...budget, spent: next, selfExpandable: false, preferBatchOverContinuous: true },
  };
}

export function isEnergyExhausted(budget: EnergyBudget): boolean {
  return budget.spent >= budget.ceiling;
}

export function enterSleepState(): { state: 'SLEEP'; inference: 'off'; alwaysOn: false } {
  return { state: 'SLEEP', inference: 'off', alwaysOn: false };
}

export function enterIdleState(): { state: 'IDLE'; inference: 'paused'; alwaysOn: false } {
  return { state: 'IDLE', inference: 'paused', alwaysOn: false };
}

export function preferBatchDebriefOverConstantInference(): true {
  return true;
}

export function alwaysOnBurningSilicon(): false {
  return false;
}
