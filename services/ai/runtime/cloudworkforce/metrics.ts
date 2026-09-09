/**
 * Observability metrics for cloud workforce runtime.
 * Architecture exists ≠ 24/7 LIVE.
 */

import type { ComputeGovernorLevel, WorkforceObservabilityMetrics } from './types';
import { maxConcurrencyFor } from './governor';

export function createEmptyMetrics(
  level: ComputeGovernorLevel = 'NORMAL',
): WorkforceObservabilityMetrics {
  return {
    missionsQueued: 0,
    missionsRunning: 0,
    missionsCompleted: 0,
    missionsFailed: 0,
    missionsQuarantined: 0,
    activeLeases: 0,
    expiredLeasesRecovered: 0,
    duplicateClaimsRejected: 0,
    heartbeats: 0,
    checkpoints: 0,
    handoffs: 0,
    securityDenials: 0,
    computeGovernorLevel: level,
    maxConcurrency: maxConcurrencyFor(level),
    architectureExistsIsNotLive247: true,
  };
}

export function bumpMetric<K extends keyof WorkforceObservabilityMetrics>(
  metrics: WorkforceObservabilityMetrics,
  key: K,
  by = 1,
): WorkforceObservabilityMetrics {
  const current = metrics[key];
  if (typeof current !== 'number') return metrics;
  return { ...metrics, [key]: current + by };
}

export function architectureExistsIsNotLive247(): true {
  return true;
}
