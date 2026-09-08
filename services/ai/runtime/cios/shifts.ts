/**
 * 24/7 Operations — scheduled shifts (not uncontrolled autonomy).
 * Continuous operation only inside explicit boundaries.
 */

import {
  CONTINUOUS_BOUNDARIES,
  OPERATIONS_SHIFT_KINDS,
  SHIFT_LIFECYCLE,
  type ContinuousBoundary,
  type OperationsShiftKind,
  type ShiftLifecycleStage,
} from './types';

export type OperationsShift = {
  shiftId: string;
  kind: OperationsShiftKind;
  stage: ShiftLifecycleStage;
  tenantId: string;
  boundaries: readonly ContinuousBoundary[];
  uncontrolledAutonomy: false;
  silentProductionDeploy: false;
  l4Enabled: false;
  productionLive: false;
};

export function listOperationsShifts(): readonly OperationsShiftKind[] {
  return OPERATIONS_SHIFT_KINDS;
}

export function listShiftLifecycle(): readonly ShiftLifecycleStage[] {
  return SHIFT_LIFECYCLE;
}

export function listContinuousBoundaries(): readonly ContinuousBoundary[] {
  return CONTINUOUS_BOUNDARIES;
}

export function openOperationsShift(input: {
  kind: OperationsShiftKind;
  tenantId: string;
  stage?: ShiftLifecycleStage;
}): OperationsShift {
  return {
    shiftId: `shift:${input.kind}:${input.tenantId}`,
    kind: input.kind,
    stage: input.stage ?? 'ASSIGN',
    tenantId: input.tenantId,
    boundaries: CONTINUOUS_BOUNDARIES,
    uncontrolledAutonomy: false,
    silentProductionDeploy: false,
    l4Enabled: false,
    productionLive: false,
  };
}

export function advanceShiftStage(shift: OperationsShift, next: ShiftLifecycleStage): OperationsShift {
  const currentIdx = SHIFT_LIFECYCLE.indexOf(shift.stage);
  const nextIdx = SHIFT_LIFECYCLE.indexOf(next);
  if (nextIdx !== currentIdx + 1) {
    return shift;
  }
  return { ...shift, stage: next };
}

export function executeShiftTask(input: {
  shift: OperationsShift;
  authorized: boolean;
  withinBoundaries: boolean;
  targetsProduction?: boolean;
}) {
  if (input.shift.stage !== 'EXECUTE_BOUNDED_TASKS') {
    return { allowed: false as const, reason: 'shift_not_in_execute_stage' };
  }
  if (!input.authorized) {
    return { allowed: false as const, reason: 'shift_requires_authorize_stage_approval' };
  }
  if (!input.withinBoundaries) {
    return { allowed: false as const, reason: 'outside_continuous_operation_boundaries' };
  }
  if (input.targetsProduction === true) {
    return { allowed: false as const, reason: 'silent_production_deploy_forbidden' };
  }
  return { allowed: true as const, deployedToProduction: false as const };
}

export function shiftUncontrolledAutonomyAllowed(): false {
  return false;
}

export function continuousOperationWithoutBoundaries(): false {
  return false;
}
