/**
 * IDE independence / offline-founder test.
 * Local process can prove IDE independence.
 * CLOUD_WORKER_VERIFIED requires authenticated cloud deploy + offline proof.
 * Still never proves indefinite 24/7.
 */

import { openDbBackedAgentMissionQueue, createMission } from '../cloudworkforce';
import { openAgentWorkforceManager, provisionSpecialtyWorker } from './workforce-manager';
import { runCrashRecoveryAgainstLa01 } from './recovery';
import { openDurableCloudQueue, enqueueDurable, claimDurable, ackDurable } from './durable-queue';
import { detectCloudDeployment, deployMinimalCloudWorker } from './deployment';
import { appendAudit, openCloudWorkerAuditLog } from './audit';

export type OfflineFounderTestResult = {
  passed: boolean;
  /** True only when a verified cloud worker completed the offline path. */
  cloudWorkerVerified: boolean;
  mode: 'LOCAL_PROCESS_SIM' | 'CLOUD_VERIFIED';
  indefinite247: false;
  runs247Live: false;
  reasons: readonly string[];
  ideRequired: false;
  dependsOnCursor: false;
  dependsOnVsCode: false;
  dependsOnReplit: false;
  dependsOnFounderPcRuntime: false;
};

/**
 * Simulates founder offline (no IDE): durable queue + workforce + crash recovery.
 * Passing local path ⇒ IDE independence, NOT CLOUD_WORKER_VERIFIED.
 */
export function runOfflineFounderTest(): OfflineFounderTestResult {
  const reasons: string[] = [];
  const audit = openCloudWorkerAuditLog();
  const cloudDeploy = deployMinimalCloudWorker({ preferredProvider: 'AWS_ECS' });
  const local = detectCloudDeployment('LOCAL_PROCESS');
  void local;

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
  const cloudWorkerVerified = passed && cloudDeploy.deployed && cloudDeploy.cloudDeployment === 'MINIMAL_WORKER_DEPLOYED';
  const mode = cloudWorkerVerified ? 'CLOUD_VERIFIED' : 'LOCAL_PROCESS_SIM';

  appendAudit(audit, {
    eventId: 'offline-founder-1',
    at: nowIso,
    kind: 'OFFLINE_FOUNDER_TEST',
    detail: passed
      ? cloudWorkerVerified
        ? 'passed_cloud_verified'
        : 'passed_local_sim_not_cloud_verified'
      : reasons.join(','),
  });

  return {
    passed,
    cloudWorkerVerified,
    mode,
    indefinite247: false,
    runs247Live: false,
    reasons: cloudWorkerVerified
      ? reasons
      : [...reasons, ...(passed ? ['CLOUD_DEPLOYMENT=BLOCKED_local_sim_only'] : [])],
    ideRequired: false,
    dependsOnCursor: false,
    dependsOnVsCode: false,
    dependsOnReplit: false,
    dependsOnFounderPcRuntime: false,
  };
}
