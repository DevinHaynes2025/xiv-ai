/**
 * Workforce observability metrics — honest labels.
 * architectureExistsIsNotLive247 is always true.
 */

import type { ComputeGovernorLevel, WorkforceObservabilityMetrics } from './types';
import { maxConcurrencyFor } from './governor';

export function openWorkforceObservability(input?: {
  missionsQueued?: number;
  missionsRunning?: number;
  missionsCompleted?: number;
  missionsFailed?: number;
  missionsQuarantined?: number;
  activeLeases?: number;
  expiredLeasesRecovered?: number;
  duplicateClaimsRejected?: number;
  heartbeats?: number;
  checkpoints?: number;
  handoffs?: number;
  securityDenials?: number;
  computeGovernorLevel?: ComputeGovernorLevel;
}): WorkforceObservabilityMetrics {
  const level = input?.computeGovernorLevel ?? 'NORMAL';
  return {
    missionsQueued: input?.missionsQueued ?? 0,
    missionsRunning: input?.missionsRunning ?? 0,
    missionsCompleted: input?.missionsCompleted ?? 0,
    missionsFailed: input?.missionsFailed ?? 0,
    missionsQuarantined: input?.missionsQuarantined ?? 0,
    activeLeases: input?.activeLeases ?? 0,
    expiredLeasesRecovered: input?.expiredLeasesRecovered ?? 0,
    duplicateClaimsRejected: input?.duplicateClaimsRejected ?? 0,
    heartbeats: input?.heartbeats ?? 0,
    checkpoints: input?.checkpoints ?? 0,
    handoffs: input?.handoffs ?? 0,
    securityDenials: input?.securityDenials ?? 0,
    computeGovernorLevel: level,
    maxConcurrency: maxConcurrencyFor(level),
    architectureExistsIsNotLive247: true,
  };
}
