/**
 * 62L-EX2 — Comparable benchmark helpers + cost/energy honesty.
 */

import type {
  ClassicalBaselineReceipt,
  ComparabilityReceipt,
  CostProxy,
  EnergyProxy,
} from './types.ts';
import { defaultCostProxy, defaultEnergyProxy } from './baseline.ts';

export type ComparableBenchmarkPack = {
  packId: string;
  baselineId: string;
  candidateId: string;
  comparisonId: string;
  comparisonState: ComparabilityReceipt['comparisonState'];
  metrics: {
    baselineRuntimeMs: number | null;
    candidateRuntimeMs: number | null;
    baselineQuality: number | null;
    candidateQuality: number | null;
  };
  cost: CostProxy;
  energy: EnergyProxy;
  honesty: string;
};

/**
 * Build a comparable benchmark pack only when comparison is ELIGIBLE.
 * Cost/energy never fabricated.
 */
export function buildComparableBenchmark(input: {
  packId: string;
  baseline: ClassicalBaselineReceipt;
  candidateId: string;
  candidateRuntimeMs: number | null;
  candidateQuality: number | null;
  comparability: ComparabilityReceipt;
  cost?: Partial<CostProxy>;
  energy?: Partial<EnergyProxy>;
}): ComparableBenchmarkPack | { denied: true; reason: string } {
  if (input.comparability.comparisonState !== 'ELIGIBLE') {
    return {
      denied: true,
      reason: `BENCHMARK_REQUIRES_ELIGIBLE_COMPARISON:${input.comparability.comparisonState}`,
    };
  }

  const cost = defaultCostProxy(input.cost);
  const energy = defaultEnergyProxy(input.energy);

  if (
    cost.state === 'KNOWN' &&
    (cost.value === null || Number.isNaN(cost.value))
  ) {
    return {
      denied: true,
      reason: 'COST_KNOWN_REQUIRES_NUMERIC_VALUE',
    };
  }

  if (
    (energy.state === 'MEASURED' || energy.state === 'ENERGY_PROXY_ESTIMATE') &&
    (energy.value === null || Number.isNaN(energy.value))
  ) {
    return {
      denied: true,
      reason: 'ENERGY_STATE_REQUIRES_NUMERIC_VALUE',
    };
  }

  return {
    packId: input.packId,
    baselineId: input.baseline.baselineId,
    candidateId: input.candidateId,
    comparisonId: input.comparability.comparisonId,
    comparisonState: input.comparability.comparisonState,
    metrics: {
      baselineRuntimeMs: input.baseline.runtimeMs,
      candidateRuntimeMs: input.candidateRuntimeMs,
      baselineQuality: input.baseline.qualityMetrics.objectiveValue,
      candidateQuality: input.candidateQuality,
    },
    cost,
    energy,
    honesty:
      'DOCUMENTED ≠ VERIFIED; COST_UNKNOWN / ENERGY_UNKNOWN when not measured; no fabricate.',
  };
}

export function recordCostProxy(
  known: boolean,
  value: number | null,
  currency: string | null = 'USD',
): CostProxy {
  if (!known || value === null) {
    return defaultCostProxy({ state: 'COST_UNKNOWN', value: null, currency: null });
  }
  return defaultCostProxy({
    state: 'KNOWN',
    value,
    currency,
    note: 'Measured/known cost proxy recorded.',
  });
}

export function recordEnergyProxy(
  mode: 'MEASURED' | 'ENERGY_PROXY_ESTIMATE' | 'ENERGY_UNKNOWN',
  value: number | null,
  unit: string | null = 'J',
): EnergyProxy {
  if (mode === 'ENERGY_UNKNOWN' || value === null) {
    return defaultEnergyProxy({
      state: 'ENERGY_UNKNOWN',
      value: null,
      unit: null,
    });
  }
  return defaultEnergyProxy({
    state: mode,
    value,
    unit,
    note:
      mode === 'MEASURED'
        ? 'Measured energy recorded.'
        : 'ENERGY_PROXY_ESTIMATE — not claimed as measured.',
  });
}
