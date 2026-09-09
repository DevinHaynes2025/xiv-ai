/**
 * 62L-EX2 — Repeatability / reproducibility summaries.
 * COMPLETED ≠ automatically REPRODUCIBLE.
 */

import type {
  ClassicalBaselineReceipt,
  RepeatabilitySummary,
} from './types.ts';

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function variance(values: number[]): number | null {
  if (values.length < 2) return null;
  const m = mean(values)!;
  return values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length;
}

export type RepeatRunObservation = {
  success: boolean;
  runtimeMs: number;
  quality: number | null;
  seed: number;
  samplingShots: number | null;
};

/**
 * Aggregate repeat runs. Marks REPRODUCIBLE only when enough successful
 * runs share seed/sampling and quality variance is within tolerance.
 */
export function summarizeRepeatability(input: {
  observations: readonly RepeatRunObservation[];
  expectedSeed: number;
  expectedSamplingShots: number | null;
  qualityVarianceTolerance: number;
  minSuccessfulRuns?: number;
}): RepeatabilitySummary {
  const minOk = input.minSuccessfulRuns ?? 2;
  const runCount = input.observations.length;
  const successful = input.observations.filter((o) => o.success);
  const failedRuns = runCount - successful.length;
  const runtimes = successful.map((o) => o.runtimeMs);
  const qualities = successful
    .map((o) => o.quality)
    .filter((q): q is number => typeof q === 'number');

  const seedPreserved = input.observations.every(
    (o) => o.seed === input.expectedSeed,
  );
  const samplingShotsPreserved = input.observations.every(
    (o) => o.samplingShots === input.expectedSamplingShots,
  );

  const qualityVar = variance(qualities);
  let reproducibilityState: RepeatabilitySummary['reproducibilityState'] =
    'NOT_EVALUATED';

  if (successful.length >= minOk && seedPreserved && samplingShotsPreserved) {
    if (
      qualityVar === null ||
      qualityVar <= input.qualityVarianceTolerance
    ) {
      reproducibilityState = 'REPRODUCIBLE';
    } else {
      reproducibilityState = 'NON_REPRODUCIBLE';
    }
  } else if (runCount > 0) {
    reproducibilityState = 'NON_REPRODUCIBLE';
  }

  return {
    runCount,
    successfulRuns: successful.length,
    failedRuns,
    medianRuntimeMs: median(runtimes),
    meanRuntimeMs: mean(runtimes),
    minRuntimeMs: runtimes.length ? Math.min(...runtimes) : null,
    maxRuntimeMs: runtimes.length ? Math.max(...runtimes) : null,
    varianceRuntimeMs: variance(runtimes),
    qualityVariance: qualityVar,
    seedPreserved,
    samplingShotsPreserved,
    reproducibilityState,
  };
}

/**
 * Apply repeatability result onto a completed baseline.
 * Never auto-promote COMPLETED → REPRODUCIBLE without this step.
 */
export function applyReproducibility(
  receipt: ClassicalBaselineReceipt,
  summary: RepeatabilitySummary,
): ClassicalBaselineReceipt {
  if (receipt.baselineState === 'FAILED') {
    return {
      ...receipt,
      reproducibilityState: 'NON_REPRODUCIBLE',
    };
  }
  if (summary.reproducibilityState === 'REPRODUCIBLE') {
    return {
      ...receipt,
      baselineState: 'REPRODUCIBLE',
      reproducibilityState: 'REPRODUCIBLE',
    };
  }
  if (summary.reproducibilityState === 'NON_REPRODUCIBLE') {
    return {
      ...receipt,
      reproducibilityState: 'NON_REPRODUCIBLE',
      // Keep COMPLETED if already completed — do not confuse with REPRODUCIBLE.
      baselineState:
        receipt.baselineState === 'COMPLETED'
          ? 'COMPLETED'
          : receipt.baselineState,
    };
  }
  return {
    ...receipt,
    reproducibilityState: 'NOT_EVALUATED',
  };
}
