/**
 * 62L-EX10 — Benchmark Normalization.
 * Normalize experiment sides into comparable metric envelopes.
 * Does not invent missing cost/energy; preserves timing scope labels.
 */

import type {
  ExperimentSide,
  NormalizedMetrics,
  TimingScope,
} from './types.ts';

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function std(values: number[]): number | null {
  if (values.length < 2) return null;
  const m = mean(values);
  if (m === null) return null;
  const variance =
    values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export type NormalizationResult = {
  side: 'BASELINE' | 'CANDIDATE';
  timingScope: TimingScope;
  metrics: NormalizedMetrics;
  notes: string[];
};

export function normalizeExperimentSide(
  side: ExperimentSide,
  label: 'BASELINE' | 'CANDIDATE',
): NormalizationResult {
  const notes: string[] = [];
  const samples =
    side.runtimesMs.length > 0
      ? side.runtimesMs
      : side.runtimeMs !== null
        ? [side.runtimeMs]
        : [];

  if (samples.length < 2) {
    notes.push('SINGLE_OR_ZERO_RUN_NO_HIGH_CONFIDENCE_STATS');
  } else {
    notes.push('MULTI_RUN_STATISTICAL_METRICS');
  }

  if (side.costMethod === 'UNKNOWN') {
    notes.push('COST_UNKNOWN_NOT_NORMALIZED_AS_MEASURED');
  }
  if (side.energyMethod === 'UNKNOWN') {
    notes.push('ENERGY_UNKNOWN_NOT_FABRICATED');
  }

  const costNormalized =
    side.costMethod === 'UNKNOWN' || side.costValue === null
      ? null
      : side.costValue;
  const energyNormalized =
    side.energyMethod === 'UNKNOWN' || side.energyValue === null
      ? null
      : side.energyValue;

  return {
    side: label,
    timingScope: side.timingScope,
    metrics: {
      latencyMeanMs: mean(samples),
      latencyStdMs: std(samples),
      throughputMean: side.throughput,
      memoryPeakMb: side.memoryPeakMb,
      qualityScore: side.qualityScore,
      costNormalized,
      energyNormalized,
      runCount: Math.max(side.runCount, samples.length),
      statistical: samples.length >= 2,
    },
    notes,
  };
}

export function normalizePair(
  baseline: ExperimentSide,
  candidate: ExperimentSide,
): {
  baseline: NormalizationResult;
  candidate: NormalizationResult;
  timingScopesMatch: boolean;
  notes: string[];
} {
  const b = normalizeExperimentSide(baseline, 'BASELINE');
  const c = normalizeExperimentSide(candidate, 'CANDIDATE');
  const timingScopesMatch = baseline.timingScope === candidate.timingScope;
  const notes = [
    ...b.notes.map((n) => `BASELINE:${n}`),
    ...c.notes.map((n) => `CANDIDATE:${n}`),
  ];
  if (!timingScopesMatch) {
    notes.push('TIMING_SCOPE_MISMATCH_NO_SILENT_EQUIVALENCE');
  }
  return { baseline: b, candidate: c, timingScopesMatch, notes };
}
