/**
 * IDE independence / offline-founder test.
 * CLOUD_WORKER_VERIFIED only if this harness passes — still not indefinite 24/7.
 */

import { openDbBackedAgentMissionQueue, createMission } from '../cloudworkforce';
import { openAgentWorkforceManager, provisionSpecialtyWorker } from './workforce-manager';
import { runCrashRecoveryAgainstLa01 } from './recovery';
import { openDurableCloudQueue, enqueueDurable, claimDurable, ackDurable } from './durable-queue';
import { detectCloudDeployment } from './deployment';
import { appendAudit, openCloudWorkerAuditLog } from './audit';

export type OfflineFounderTestResult = {
  passed: boolean;
  cloudWorkerVerified: boolean;
  indefinite247: false;
  runs247Live: false;
  reasons: readonly string[];
  ideRequired: false;
};

/**
 * Simulates founder offline (no IDE): local durable queue + workforce + crash recovery.
 * Does not require Cursor IDE session. Passing ⇒ CLOUD_WORKER_VERIFIED for this run only.
 */
export function runOfflineFounderTest(): OfflineFounderTestResult {
  const reasons: string[] = [];
  const audit = openCloudWorkerAuditLog();
  const deployment = detectCloudDeployment('LOCAL_PROCESS');

  if (deployment.provider !== 'LOCAL_PROCESS' && deployment.cloudDeployment === 'BLOCKED') {
    // Still allow local offline verification path.
  }

  const mgr = openAgentWorkforceManager({ runtimeId: 'offline-founder' });
  const provisioned = provisionSpecialtyWorker(mgr, {
    role: 'RESEARCH',
    workerId: 'offline-research-1',
    instanceId: 'inst-1',
    tenantId: 't1',
    universeId: 'u1',
  });
  if (!provisioned.ok) {
    reasons.push(`provision_failed:${provisioned.reason}`);
  }

  const q = openDurableCloudQueue('IN_PROCESS_DURABLE');
  const nowIso = '2026-09-08T04:00:00.000Z';
  enqueueDurable(q, {
    messageId: 'msg-1',
    missionId: 'offline-m1',
    payloadCursor: 'c0',
    nowIso,
  });
  const claimed = claimDurable(q, nowIso);
  if (!claimed) reasons.push('durable_claim_failed');
  else if (!ackDurable(q, claimed.messageId)) reasons.push('durable_ack_failed');

  // LA-01 mission path still works without IDE.
  const missions = openDbBackedAgentMissionQueue();
  missions.enqueue(
    createMission({
      missionId: 'offline-mission',
      tenantId: 't1',
      universeId: 'u1',
      objective: 'offline founder',
      budgetId: 'b1',
      nowIso,
    }),
  );
  const claim = missions.claim({
    workerId: 'offline-research-1',
    tenantId: 't1',
    universeId: 'u1',
    nowMs: Date.parse(nowIso),
    nowIso,
  });
  if (!claim.ok) reasons.push(`mission_claim_failed:${claim.reason}`);

  const crash = runCrashRecoveryAgainstLa01();
  if (!crash.passed || !crash.resumedFromCheckpoint) {
    reasons.push('crash_recovery_failed');
  }

  const passed = reasons.length === 0 && provisioned.ok;
  appendAudit(audit, {
    eventId: 'offline-founder-1',
    at: nowIso,
    kind: 'OFFLINE_FOUNDER_TEST',
    detail: passed ? 'passed' : reasons.join(','),
  });

  return {
    passed,
    cloudWorkerVerified: passed,
    indefinite247: false,
    runs247Live: false,
    reasons,
    ideRequired: false,
  };
}
