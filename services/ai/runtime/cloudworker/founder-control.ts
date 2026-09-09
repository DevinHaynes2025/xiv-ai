/**
 * Founder Mission Control + While You Were Away (LA-02 observability).
 * Extends LA-01 UI contracts — does not claim 24/7 LIVE.
 */

import { FOUNDER_BRIEF_EMAIL, openMissionControlPanel, openWhileYouWereAwayUi } from '../cloudworkforce';
import type { AgentWorkforceManager } from './workforce-manager';
import type { FounderMissionControlSnapshot, WhileYouWereAwayReport } from './types';

export function openFounderMissionControl(
  mgr: AgentWorkforceManager,
  input?: { cloudWorkerVerified?: boolean },
): FounderMissionControlSnapshot {
  return {
    title: 'Founder Mission Control',
    workers: [...mgr.runtime.workers.values()].map((w) => ({
      workerId: w.identity.workerId,
      state: w.state,
      role: w.identity.agentRole,
    })),
    schedules: [...mgr.scheduler.schedules.keys()],
    poolSizes: [...mgr.pools.values()].map((p) => ({
      poolId: p.poolId,
      current: p.currentSize,
      desired: p.desiredSize,
    })),
    cloudWorkerVerified: input?.cloudWorkerVerified ?? false,
    runs247Live: false,
    indefinite247: false,
    l4Enabled: false,
    defaultPermissions: 'NONE',
    founderBriefEmail: FOUNDER_BRIEF_EMAIL,
  };
}

export function buildWhileYouWereAwayReport(input: {
  completedMissionIds?: readonly string[];
  failedMissionIds?: readonly string[];
  recoveredCrashes?: number;
  deadLetters?: number;
  humanDecisionsRequired?: readonly string[];
  cloudWorkerVerified?: boolean;
}): WhileYouWereAwayReport {
  // Keep LA-01 UI contract aligned for mobile surfaces.
  openWhileYouWereAwayUi({
    completed: input.completedMissionIds ?? [],
    failed: input.failedMissionIds ?? [],
    quarantined: [],
    humanDecisionsRequired: input.humanDecisionsRequired ?? [],
  });
  openMissionControlPanel();
  return {
    title: 'While You Were Away',
    completedMissionIds: input.completedMissionIds ?? [],
    failedMissionIds: input.failedMissionIds ?? [],
    recoveredCrashes: input.recoveredCrashes ?? 0,
    deadLetters: input.deadLetters ?? 0,
    humanDecisionsRequired: input.humanDecisionsRequired ?? [],
    productionDeployedOvernight: false,
    agentsRan24x7Live: false,
    cloudWorkerVerified: input.cloudWorkerVerified ?? false,
  };
}
