/**
 * Compute governor — NORMAL…UNKNOWN; pressure reduces concurrency.
 */

import type { ComputeGovernorLevel } from './types';
import { COMPUTE_GOVERNOR_LEVELS } from './types';

const CONCURRENCY: Record<ComputeGovernorLevel, number> = {
  NORMAL: 8,
  ELEVATED: 4,
  HIGH: 2,
  CRITICAL: 1,
  EMERGENCY: 0,
  UNKNOWN: 1,
};

export function listComputeGovernorLevels(): readonly ComputeGovernorLevel[] {
  return COMPUTE_GOVERNOR_LEVELS;
}

export function maxConcurrencyFor(level: ComputeGovernorLevel): number {
  return CONCURRENCY[level];
}

export function pressureReducesConcurrency(from: ComputeGovernorLevel, to: ComputeGovernorLevel): boolean {
  return maxConcurrencyFor(to) <= maxConcurrencyFor(from);
}

export function openComputeGovernor(level: ComputeGovernorLevel = 'NORMAL') {
  return {
    level,
    maxConcurrency: maxConcurrencyFor(level),
    pressureReducesConcurrency: true as const,
    grantsAuthority: false as const,
    l4Enabled: false as const,
    productionLive: false as const,
  };
}

export function elevatePressure(
  current: ComputeGovernorLevel,
  next: ComputeGovernorLevel,
): { level: ComputeGovernorLevel; maxConcurrency: number } {
  return {
    level: next,
    maxConcurrency: maxConcurrencyFor(next),
  };
}
