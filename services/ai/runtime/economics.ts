import type {
  CandidateEvaluation,
  CostEstimate,
  ModelRecord,
  Placement,
  RuntimeNodeRecord,
  WorkloadRecord,
} from './types';

/**
 * XIV Compute Economics Engine (story section 18).
 *
 * These are planning estimates used for scheduling and telemetry, not billing.
 * Ranking applies the policy order security -> correctness -> availability ->
 * latency -> cost. Security and correctness are hard filters in
 * `eligibility.ts`, so only the last three tiers are comparative here.
 */

const COMPUTE_RATE_USD: Readonly<Record<Placement, number>> = Object.freeze({
  device: 0,
  edge: 0.0004,
  cpu: 0.0006,
  gpu: 0.004,
  private: 0.008,
});

const ENERGY_WH_PER_UNIT: Readonly<Record<Placement, number>> = Object.freeze({
  device: 0.02,
  edge: 0.05,
  cpu: 0.12,
  gpu: 0.6,
  private: 0.2,
});

const BASE_LATENCY_MS: Readonly<Record<Placement, number>> = Object.freeze({
  device: 5,
  edge: 20,
  cpu: 60,
  gpu: 80,
  private: 70,
});

const NETWORK_PENALTY_MS: Readonly<Record<RuntimeNodeRecord['hardware']['networkState'], number>> = Object.freeze({
  online: 0,
  metered: 80,
  constrained: 200,
  offline: Number.POSITIVE_INFINITY,
});

const BANDWIDTH_RATE_USD = 0.00005;
const STORAGE_RATE_USD = 0.000001;

export function estimateCost(
  workload: WorkloadRecord,
  placement: Placement,
  model: ModelRecord | null,
): CostEstimate {
  const { computeUnits, tokens, storageMb, bandwidthMb, runtimeMs } = workload.estimate;
  const modelCost = model
    ? (tokens / 1000) * model.costProfile.perThousandTokensUsd + (runtimeMs / 1000) * model.costProfile.perSecondUsd
    : 0;
  const monetaryUsd =
    computeUnits * COMPUTE_RATE_USD[placement] +
    bandwidthMb * BANDWIDTH_RATE_USD +
    storageMb * STORAGE_RATE_USD +
    modelCost;

  return {
    computeUnits,
    tokens,
    storageMb,
    bandwidthMb,
    runtimeMs,
    energyWh: computeUnits * ENERGY_WH_PER_UNIT[placement],
    monetaryUsd: Number(monetaryUsd.toFixed(6)),
  };
}

export function estimateLatencyMs(node: RuntimeNodeRecord, placement: Placement): number {
  return BASE_LATENCY_MS[placement] + NETWORK_PENALTY_MS[node.hardware.networkState];
}

const AVAILABILITY_SCORE: Readonly<Record<RuntimeNodeRecord['healthState'], number>> = Object.freeze({
  healthy: 3,
  unknown: 2,
  degraded: 1,
  unreachable: 0,
});

export type RankedCandidate = {
  evaluation: CandidateEvaluation;
  node: RuntimeNodeRecord;
  placement: Placement;
  latencyMs: number;
  cost: CostEstimate;
};

/**
 * Deterministic ordering. Availability outranks latency, latency outranks cost,
 * and node id breaks ties so a scheduling decision is reproducible in an audit.
 */
export function rankCandidates(
  candidates: readonly RankedCandidate[],
  preferredPlacement: Placement,
): RankedCandidate[] {
  return [...candidates].sort((a, b) => {
    const availability = AVAILABILITY_SCORE[b.node.healthState] - AVAILABILITY_SCORE[a.node.healthState];
    if (availability !== 0) return availability;

    const preference =
      Number(b.placement === preferredPlacement) - Number(a.placement === preferredPlacement);
    if (preference !== 0) return preference;

    if (a.latencyMs !== b.latencyMs) return a.latencyMs - b.latencyMs;
    if (a.cost.monetaryUsd !== b.cost.monetaryUsd) return a.cost.monetaryUsd - b.cost.monetaryUsd;
    return a.node.nodeId < b.node.nodeId ? -1 : 1;
  });
}

export function scoreFor(candidate: RankedCandidate, preferredPlacement: Placement): number {
  const availability = AVAILABILITY_SCORE[candidate.node.healthState] * 1_000_000;
  const preference = candidate.placement === preferredPlacement ? 100_000 : 0;
  const latency = Math.min(candidate.latencyMs, 9_999) * 10;
  const cost = Math.min(Math.round(candidate.cost.monetaryUsd * 1_000), 9_999);
  return availability + preference - latency - cost;
}
