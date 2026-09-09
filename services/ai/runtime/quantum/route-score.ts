/**
 * 62L-EX7 — Route scoring.
 * Policy gates override score. Stale benchmarks lower eligibility/confidence.
 */

import type {
  HybridExecutionRequest,
  RouteCandidate,
  RouteScoreBreakdown,
} from './types.ts';

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function scoreRouteCandidate(
  request: HybridExecutionRequest,
  candidate: RouteCandidate,
): RouteScoreBreakdown {
  const d = candidate.device;

  const privacy =
    request.privacyClass === 'PRIVATE_LOCAL_ONLY' || request.localOnly
      ? d.locality === 'LOCAL'
        ? 1
        : 0
      : d.locality === 'LOCAL'
        ? 0.9
        : 0.4;

  const locality = d.locality === 'LOCAL' ? 1 : 0.25;

  const latency =
    request.latencyBudgetMs != null && d.startupMs != null
      ? clamp01(1 - d.startupMs / Math.max(request.latencyBudgetMs, 1))
      : d.startupMs == null
        ? 0.5
        : clamp01(1 - d.startupMs / 10_000);

  const throughput = d.historicalSuccessRate ?? 0.5;

  const memoryFit =
    request.memoryBudgetMb != null && d.memoryMb != null
      ? d.memoryMb >= request.memoryBudgetMb
        ? 1
        : clamp01(d.memoryMb / request.memoryBudgetMb)
      : 0.7;

  const quality = request.qualityTarget != null ? 0.7 : 0.6;

  const reliability = clamp01(d.historicalSuccessRate ?? 0.55);

  const startup =
    d.startupMs == null ? 0.5 : clamp01(1 - d.startupMs / 5_000);

  const historicalSuccess = clamp01(d.historicalSuccessRate ?? 0.5);

  // Stale benchmark lowers freshness + confidence contribution.
  const freshness =
    d.benchmarkFreshness === 'FRESH'
      ? 1
      : d.benchmarkFreshness === 'STALE'
        ? 0.25
        : 0.5;

  const cost =
    d.estimatedCost == null
      ? 0.7
      : request.externalCostBudget != null && request.externalCostBudget > 0
        ? clamp01(1 - d.estimatedCost / request.externalCostBudget)
        : d.estimatedCost === 0
          ? 1
          : 0.4;

  const energyProxy =
    d.energyProxy == null ? 0.5 : clamp01(1 - d.energyProxy / 100);

  const queue =
    d.queueDepth == null ? 0.6 : clamp01(1 - d.queueDepth / 50);

  const providerAvailability =
    d.routeClass === 'PHYSICAL_QPU_CANDIDATE'
      ? d.providerAvailable === true
        ? 0.8
        : 0.1
      : 0.7;

  // Preferred classes get a mild boost — PREFERRED ≠ production auth.
  const preferredBoost = request.preferredRouteClasses.includes(d.routeClass)
    ? 0.05
    : 0;

  // LOCAL_FIRST tier: lower tier number → higher locality-weighted preference.
  const tierBoost = clamp01((7 - candidate.localFirstTier) / 6) * 0.1;

  const stalePenalty = d.benchmarkFreshness === 'STALE' ? 0.15 : 0;

  const total = clamp01(
    (privacy +
      locality +
      latency +
      throughput +
      memoryFit +
      quality +
      reliability +
      startup +
      historicalSuccess +
      freshness +
      cost +
      energyProxy +
      queue +
      providerAvailability) /
      14 +
      preferredBoost +
      tierBoost -
      stalePenalty,
  );

  return {
    privacy,
    locality,
    latency,
    throughput,
    memoryFit,
    quality,
    reliability,
    startup,
    historicalSuccess,
    freshness,
    cost,
    energyProxy,
    queue,
    providerAvailability,
    total,
  };
}

export function rankCandidates(
  request: HybridExecutionRequest,
  eligible: readonly RouteCandidate[],
): Array<{ candidate: RouteCandidate; score: RouteScoreBreakdown }> {
  const scored = eligible.map((candidate) => ({
    candidate,
    score: scoreRouteCandidate(request, candidate),
  }));

  scored.sort((a, b) => {
    // LOCAL_FIRST tier wins before raw score.
    if (a.candidate.localFirstTier !== b.candidate.localFirstTier) {
      return a.candidate.localFirstTier - b.candidate.localFirstTier;
    }
    // Stale benchmarks sort lower within same tier.
    const aStale = a.candidate.device.benchmarkFreshness === 'STALE' ? 1 : 0;
    const bStale = b.candidate.device.benchmarkFreshness === 'STALE' ? 1 : 0;
    if (aStale !== bStale) return aStale - bStale;
    return b.score.total - a.score.total;
  });

  return scored;
}

/** Stale benchmark may remain eligible but with reduced confidence. */
export function staleLowersConfidence(
  candidate: RouteCandidate,
  score: RouteScoreBreakdown,
): { eligible: boolean; confidence: number; note: string } {
  if (candidate.device.benchmarkFreshness === 'STALE') {
    return {
      eligible: true,
      confidence: Math.min(score.total, score.freshness),
      note: 'STALE benchmark lowers eligibility confidence; strong claims blocked.',
    };
  }
  return {
    eligible: true,
    confidence: score.total,
    note: 'Benchmark freshness acceptable for routing (≠ VERIFIED production auth).',
  };
}
