/**
 * Horizontal scale foundation — signals only; auto-scale not LIVE.
 */

import type { WorkerPool } from './types';
import { maxConcurrencyFor } from '../cloudworkforce/governor';
import type { ComputeGovernorLevel } from '../cloudworkforce/types';

export type ScaleSignals = {
  queueDepth: number;
  missionLatencyMs: number;
  cpuPercent: number | null;
  memoryPercent: number | null;
  budgetRemaining: number;
  priorityPressure: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BACKGROUND';
};

export type ScalePlan = {
  minimumWorkers: number;
  maximumWorkers: number;
  desiredWorkers: number;
  autoScaleLive: false;
  unlimitedCompute: false;
  reason: string;
};

export function planHorizontalScale(input: {
  pool: WorkerPool;
  signals: ScaleSignals;
  computeLevel?: ComputeGovernorLevel;
}): ScalePlan {
  const minimumWorkers = Math.max(0, Math.min(1, input.pool.desiredSize));
  const maximumWorkers = input.pool.maxSize;
  const govCap = maxConcurrencyFor(input.computeLevel ?? 'NORMAL');
  let desired = input.pool.desiredSize;

  if (input.signals.queueDepth > desired * 2) desired += 1;
  if (input.signals.priorityPressure === 'CRITICAL') desired += 1;
  if (input.signals.budgetRemaining <= 0) desired = Math.min(desired, 1);
  if ((input.signals.cpuPercent ?? 0) > 85 || (input.signals.memoryPercent ?? 0) > 85) {
    desired = Math.max(minimumWorkers, desired - 1);
  }

  desired = Math.max(minimumWorkers, Math.min(maximumWorkers, desired, govCap));

  return {
    minimumWorkers,
    maximumWorkers,
    desiredWorkers: desired,
    autoScaleLive: false,
    unlimitedCompute: false,
    reason: 'scale_foundation_only_not_live',
  };
}

export function moreWorkMeansUnlimitedCompute(): false {
  return false;
}
