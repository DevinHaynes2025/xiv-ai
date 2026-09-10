/**
 * 12D-08 optional stub — roster duty-cycle scheduler over founder-twin-roster energy budget.
 * CAP 64 replicas; maxDuty 0.25; no bio DNA; wormholes remain sparse SIMULATION pathways.
 * Read-only plan output — never auto-applies production.
 */
import {
  FOUNDER_TWIN_ENERGY_BUDGET_PER_CYCLE,
  FOUNDER_TWIN_GUARDRAILS,
  FOUNDER_TWIN_MAX_DUTY_CYCLE,
  FOUNDER_TWIN_REPLICA_HARD_CAP,
  assertFounderTwinGuardrails,
  type FounderTwinRoster,
} from './founder-twin-roster';
import { assertEthicsSafeCopy } from './universe-ethics';

export const ROSTER_DUTY_SCHEDULER_GUARDRAILS = {
  readOnly: true as const,
  productionAutoApply: false as const,
  replicaHardCap: FOUNDER_TWIN_REPLICA_HARD_CAP,
  maxDutyCycle: FOUNDER_TWIN_MAX_DUTY_CYCLE,
  energyBudgetPerCycle: FOUNDER_TWIN_ENERGY_BUDGET_PER_CYCLE,
  bioCloningAllowed: false as const,
  alwaysOnInfiniteClonesAllowed: false as const,
  wormholesAreSparseSimulationPathwaysOnly: true as const,
} as const;

export type RosterDutySlot = {
  replicaId: string;
  kind: string;
  dutyCycle: number;
  /** Fraction of cycle window [0,1) when this replica may be hot. */
  windowStartFrac: number;
  windowEndFrac: number;
  energyAllocated: number;
  hotEligible: boolean;
};

export type RosterDutyCyclePlan = {
  cycleId: string;
  tenantId: string;
  replicaSlots: RosterDutySlot[];
  energyBudgetTotal: number;
  energyAllocated: number;
  energyRemaining: number;
  maxDutyCycle: number;
  replicaHardCap: number;
  sparsePathwayCount: number;
  readOnly: true;
  productionAutoApply: false;
  ethicsNotice: string;
  guardrails: typeof ROSTER_DUTY_SCHEDULER_GUARDRAILS;
};

function assertSchedulerGuardrails(): void {
  assertFounderTwinGuardrails();
  if (ROSTER_DUTY_SCHEDULER_GUARDRAILS.productionAutoApply) {
    throw new Error('productionAutoApply must remain false');
  }
  if (ROSTER_DUTY_SCHEDULER_GUARDRAILS.bioCloningAllowed) {
    throw new Error('bioCloningAllowed must remain false');
  }
  if (!ROSTER_DUTY_SCHEDULER_GUARDRAILS.wormholesAreSparseSimulationPathwaysOnly) {
    throw new Error('wormholes must remain sparse SIMULATION pathways only');
  }
  if (FOUNDER_TWIN_REPLICA_HARD_CAP !== 64) {
    throw new Error('FOUNDER_TWIN_REPLICA_HARD_CAP must remain 64 for 12D-08 stub');
  }
  if (FOUNDER_TWIN_MAX_DUTY_CYCLE !== 0.25) {
    throw new Error('FOUNDER_TWIN_MAX_DUTY_CYCLE must remain 0.25 for 12D-08 stub');
  }
}

/**
 * Plan non-overlapping-ish duty windows within maxDuty 0.25 and remaining energy.
 * Stub only — does not mutate roster or schedule wall-clock timers.
 */
export function planRosterDutyCycle(roster: FounderTwinRoster): RosterDutyCyclePlan {
  assertSchedulerGuardrails();
  if (roster.replicas.length > FOUNDER_TWIN_REPLICA_HARD_CAP) {
    throw new Error('roster exceeds FOUNDER_TWIN_REPLICA_HARD_CAP');
  }

  const ethicsNotice =
    'Roster duty-cycle scheduler stub: digital-twin replicas only, CAP 64, maxDuty 0.25, energy budget enforced. No bio cloning; wormholes are sparse SIMULATION pathways. READ ONLY plan — never auto-applies production.';
  assertEthicsSafeCopy(ethicsNotice, 'roster-duty-cycle-scheduler');

  const n = roster.replicas.length;
  const slots: RosterDutySlot[] = [];
  let energyAllocated = 0;
  for (let i = 0; i < n; i++) {
    const replica = roster.replicas[i];
    const duty = Math.min(replica.dutyCycle, FOUNDER_TWIN_MAX_DUTY_CYCLE);
    if (duty <= 0 || duty > FOUNDER_TWIN_MAX_DUTY_CYCLE) {
      throw new Error('dutyCycle must be in (0, maxDuty]');
    }
    const windowStartFrac = n === 0 ? 0 : (i / n) % 1;
    let windowEndFrac = windowStartFrac + duty;
    if (windowEndFrac > 1) {
      // wrap stub: clamp end for display; hotEligible still respects duty <= max
      windowEndFrac = 1;
    }
    const energyAllocatedForSlot = replica.energyUsedThisCycle;
    if (energyAllocated + energyAllocatedForSlot > FOUNDER_TWIN_ENERGY_BUDGET_PER_CYCLE) {
      throw new Error('duty plan would exceed FOUNDER_TWIN_ENERGY_BUDGET_PER_CYCLE');
    }
    energyAllocated += energyAllocatedForSlot;
    slots.push({
      replicaId: replica.replicaId,
      kind: replica.kind,
      dutyCycle: duty,
      windowStartFrac: Math.round(windowStartFrac * 1000) / 1000,
      windowEndFrac: Math.round(windowEndFrac * 1000) / 1000,
      energyAllocated: energyAllocatedForSlot,
      hotEligible: duty > 0 && duty <= FOUNDER_TWIN_MAX_DUTY_CYCLE,
    });
  }


  return {
    cycleId: roster.cycleId,
    tenantId: roster.tenantId,
    replicaSlots: slots,
    energyBudgetTotal: FOUNDER_TWIN_ENERGY_BUDGET_PER_CYCLE,
    energyAllocated,
    energyRemaining: roster.energyBudgetRemaining,
    maxDutyCycle: FOUNDER_TWIN_MAX_DUTY_CYCLE,
    replicaHardCap: FOUNDER_TWIN_REPLICA_HARD_CAP,
    sparsePathwayCount: roster.sparsePathwayCount,
    readOnly: true,
    productionAutoApply: false,
    ethicsNotice,
    guardrails: ROSTER_DUTY_SCHEDULER_GUARDRAILS,
  };
}

export function summarizeDutyPlan(plan: RosterDutyCyclePlan): {
  slotCount: number;
  energyRemaining: number;
  maxDutyCycle: number;
  replicaHardCap: number;
  readOnly: true;
  productionAutoApply: false;
  bioCloningAllowed: false;
  wormholesAreSparseSimulationPathwaysOnly: true;
} {
  return {
    slotCount: plan.replicaSlots.length,
    energyRemaining: plan.energyRemaining,
    maxDutyCycle: plan.maxDutyCycle,
    replicaHardCap: plan.replicaHardCap,
    readOnly: true,
    productionAutoApply: false,
    bioCloningAllowed: false,
    wormholesAreSparseSimulationPathwaysOnly: true,
  };
}

/** @internal — silence unused FOUNDER_TWIN_GUARDRAILS import in some bundlers */
export function assertDutySchedulerAlignedWithTwinGuardrails(): void {
  if (FOUNDER_TWIN_GUARDRAILS.replicaHardCap !== FOUNDER_TWIN_REPLICA_HARD_CAP) {
    throw new Error('duty scheduler misaligned with twin hard cap');
  }
  assertSchedulerGuardrails();
}

