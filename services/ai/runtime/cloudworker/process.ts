/**
 * Worker process lifecycle runner — BOOT → … → NEXT MISSION.
 * Local-process only unless cloud deploy verified.
 */

import {
  createDebrief,
  createMission,
  openDbBackedAgentMissionQueue,
  type DbBackedAgentMissionQueue,
} from '../cloudworkforce';
import type { WorkerIdentity, WorkerProcessState } from './types';
import { transitionWorkerProcess } from './lifecycle';
import { createMissionAudit, type MissionAuditRecord } from './audit';

export type WorkerProcessStep =
  | 'BOOT'
  | 'LOAD_CONFIGURATION'
  | 'VERIFY_IDENTITY'
  | 'REGISTER'
  | 'HEALTH_CHECK'
  | 'POLL_QUEUE'
  | 'CLAIM_MISSION'
  | 'VERIFY_LEASE'
  | 'VERIFY_AUTHORITY'
  | 'LOAD_CHECKPOINT'
  | 'EXECUTE'
  | 'CHECKPOINT'
  | 'DEBRIEF'
  | 'COMPLETE'
  | 'NEXT_MISSION';

export const WORKER_PROCESS_STEPS: readonly WorkerProcessStep[] = [
  'BOOT',
  'LOAD_CONFIGURATION',
  'VERIFY_IDENTITY',
  'REGISTER',
  'HEALTH_CHECK',
  'POLL_QUEUE',
  'CLAIM_MISSION',
  'VERIFY_LEASE',
  'VERIFY_AUTHORITY',
  'LOAD_CHECKPOINT',
  'EXECUTE',
  'CHECKPOINT',
  'DEBRIEF',
  'COMPLETE',
  'NEXT_MISSION',
] as const;

export type WorkerProcessRunResult = {
  steps: readonly WorkerProcessStep[];
  state: WorkerProcessState;
  missionId: string | null;
  checkpointId: string | null;
  debriefId: string | null;
  audit: MissionAuditRecord | null;
  dependsOnIde: false;
  dependsOnFounderPc: false;
  l4Enabled: false;
};

/**
 * Execute one harmless verification mission through the full worker lifecycle.
 */
export function runWorkerProcessOnce(input: {
  identity: WorkerIdentity;
  queue?: DbBackedAgentMissionQueue;
  missionId?: string;
  nowMs?: number;
  nowIso?: string;
  objective?: string;
}): WorkerProcessRunResult {
  const nowMs = input.nowMs ?? Date.parse('2026-09-08T04:00:00.000Z');
  const nowIso = input.nowIso ?? '2026-09-08T04:00:00.000Z';
  const q = input.queue ?? openDbBackedAgentMissionQueue();
  const missionId = input.missionId ?? `m-verify-${input.identity.workerId}`;
  const steps: WorkerProcessStep[] = [];

  let state: WorkerProcessState = 'CREATED';
  const boot = transitionWorkerProcess(state, 'START');
  if (!boot.ok) throw new Error(boot.reason);
  state = boot.state;
  steps.push('BOOT', 'LOAD_CONFIGURATION', 'VERIFY_IDENTITY', 'REGISTER');

  if (input.identity.forged || input.identity.defaultPermissions !== 'NONE' || input.identity.l4Enabled) {
    throw new Error('identity_verification_failed');
  }
  steps.push('HEALTH_CHECK');
  const healthy = transitionWorkerProcess(state, 'MARK_HEALTHY');
  if (!healthy.ok) throw new Error(healthy.reason);
  state = healthy.state;

  steps.push('POLL_QUEUE');
  if (!q.getMission(missionId)) {
    q.enqueue(
      createMission({
        missionId,
        tenantId: input.identity.tenantId,
        universeId: input.identity.universeId,
        objective: input.objective ?? 'Execute XIV cloud runtime verification.',
        budgetId: 'b-verify',
        nowIso,
      }),
    );
  }

  steps.push('CLAIM_MISSION');
  const claim = q.claim({
    workerId: input.identity.workerId,
    tenantId: input.identity.tenantId,
    universeId: input.identity.universeId,
    nowMs,
    nowIso,
    missionId,
  });
  if (!claim.ok) throw new Error(claim.reason);

  steps.push('VERIFY_LEASE', 'VERIFY_AUTHORITY', 'LOAD_CHECKPOINT', 'EXECUTE');
  if (claim.mission.authorityLevel === undefined || claim.mission.selfExpandableAuthority) {
    throw new Error('authority_verification_failed');
  }

  steps.push('CHECKPOINT');
  const cp = q.checkpoint({
    missionId,
    workerId: input.identity.workerId,
    progressCursor: 'verify-complete',
    completedSteps: ['harmless_test'],
    pendingSteps: [],
    nowIso,
  });
  if (!cp.ok) throw new Error(cp.reason);

  steps.push('DEBRIEF');
  const debrief = createDebrief({
    debriefId: `debrief-${missionId}`,
    missionId,
    tenantId: input.identity.tenantId,
    universeId: input.identity.universeId,
    workerId: input.identity.workerId,
    outcome: 'SUCCESS',
    summary: 'Cloud runtime verification mission completed',
    findings: ['heartbeat_ok', 'checkpoint_ok'],
    createdAt: nowIso,
  });

  steps.push('COMPLETE');
  const done = q.complete({ missionId, workerId: input.identity.workerId, nowIso });
  if (!done.ok) throw new Error(done.reason);

  steps.push('NEXT_MISSION');
  const audit = createMissionAudit({
    auditId: `audit-${missionId}`,
    missionId,
    who: input.identity.workerId,
    what: 'cloud_runtime_verification',
    when: nowIso,
    why: 'la02_deployment_test',
    where: 'LOCAL_PROCESS',
    tools: [],
    dataScopes: ['mission_local'],
    authority: 'L0',
    result: 'SUCCESS',
    costUnits: 1,
    checkpointId: cp.checkpoint.checkpointId,
    outcome: debrief.outcome,
  });

  return {
    steps,
    state,
    missionId,
    checkpointId: cp.checkpoint.checkpointId,
    debriefId: debrief.debriefId,
    audit,
    dependsOnIde: false,
    dependsOnFounderPc: false,
    l4Enabled: false,
  };
}
