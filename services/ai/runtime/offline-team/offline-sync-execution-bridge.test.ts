// 12D-232 tests — adversarial coverage for the Offline-Sync Execution Bridge.
// Under test: trail-first re-derivation of a 12D-231 sync outcome (aggregate
// SYNC_PROPOSED entry + per-task SYNC_APPLIED entries), live task-state
// re-derivation, conflict batches never transportable, receipt separation and
// ordering, identity gates, ledger tamper refusal, and the frozen honest-flag
// packet. Nothing here moves bytes, calls a network, or executes anything.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  OfflineAgentRuntime, OFFLINE_RUNTIME_POLICY,
} from './offline-agent-runtime';
import {
  OFFLINE_SYNC_EXECUTION_POLICY,
  OFFLINE_SYNC_EXECUTION_GUARDRAILS,
  issueSyncExecutionInstruction,
  type SyncExecutionIssued,
} from './offline-sync-execution-bridge';

const T0 = 1_000_000_000;
const sha = (s: string): string => createHash('sha256').update(s).digest('hex');
const SYNC_RECIPT = 'a'.repeat(64);
const EXEC_RECIPT = 'b'.repeat(64);

const IDENTITY = Object.freeze({
  identityId: 'xiv-sync-connector',
  approvedTools: ['xiv.sync.transport'],
  dataBoundaries: ['universe-1'],
  actionPolicy: 'ADVISE_ONLY' as const,
});

/** A runtime holding ONE completed task reconciled by a successful sync at SYNC_AT. */
function syncedRuntime(): { rt: OfflineAgentRuntime; syncAtMs: number } {
  const rt = new OfflineAgentRuntime(T0, 'runtime-seed-123456789');
  rt.enqueue({
    taskId: 'task-1', agentId: 'xiv-field-agent', tenantId: 'tenant-alpha',
    universeId: 'universe-1', payloadDigest: sha('p1'), maxAttempts: 3, nowMs: T0,
  });
  const lease = rt.leaseNext('xiv-field-agent', T0 + 100)!;
  rt.complete(lease.leaseId, sha('r1'), T0 + 200);
  const syncAtMs = T0 + 400;
  const out = rt.proposeSync(
    { operatorReceipt: SYNC_RECIPT, authorizedBy: 'devin-xavier-haynes', atMs: T0 + 300 },
    { universeId: 'universe-1', remoteDigests: { 'task-1': sha('r1') } },
    syncAtMs,
  );
  if (out.status !== 'SYNC_PROPOSED' || out.applied !== 1) throw new Error('fixture broken');
  return { rt, syncAtMs };
}

function issue(rt: OfflineAgentRuntime, syncAtMs: number, overrides: Record<string, unknown> = {}): SyncExecutionIssued {
  return issueSyncExecutionInstruction({
    runtime: rt,
    syncOutcome: { status: 'SYNC_PROPOSED', conflicts: [], applied: 1 },
    syncUniverseId: 'universe-1',
    syncAtMs,
    syncGrantReceiptSha256: SYNC_RECIPT,
    taskIds: ['task-1'],
    executionGrant: { operatorReceiptSha256: EXEC_RECIPT, approvedBy: 'devin-xavier-haynes' },
    identity: IDENTITY,
    nowMs: syncAtMs + 100,
    timeLimitMs: 60_000,
    ...overrides,
  } as Parameters<typeof issueSyncExecutionInstruction>[0]);
}

test('12D-232 policy and guardrails match the charter and are frozen', () => {
  assert.equal(OFFLINE_SYNC_EXECUTION_POLICY.policyVersion, '12d-232-v1');
  assert.equal(OFFLINE_SYNC_EXECUTION_POLICY.executionToolId, 'xiv.sync.transport');
  assert.equal(OFFLINE_SYNC_EXECUTION_POLICY.requiredRiskClass, 'PRODUCTION_CONFIGURATION');
  assert.equal(OFFLINE_SYNC_EXECUTION_POLICY.requiredActionPolicy, 'ADVISE_ONLY');
  assert.equal(OFFLINE_SYNC_EXECUTION_GUARDRAILS.instructionRequiresAVerifiedRuntimeTrail, true);
  assert.equal(OFFLINE_SYNC_EXECUTION_GUARDRAILS.conflictBatchesAreNeverTransportable, true);
  assert.equal(OFFLINE_SYNC_EXECUTION_GUARDRAILS.classifiedNeverLeavesTheLocalPlane, true);
  assert.equal(OFFLINE_SYNC_EXECUTION_GUARDRAILS.executionGrantIsASeparateHumanAct, true);
  assert.equal(OFFLINE_SYNC_EXECUTION_GUARDRAILS.executesNothing, true);
  assert.equal(OFFLINE_SYNC_EXECUTION_GUARDRAILS.movesNoBytes, true);
  assert.equal(OFFLINE_SYNC_EXECUTION_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(Object.isFrozen(OFFLINE_SYNC_EXECUTION_POLICY), true);
  assert.equal(Object.isFrozen(OFFLINE_SYNC_EXECUTION_GUARDRAILS), true);
});

test('12D-232 happy path: a verified reconciled batch issues ONE bounded transport instruction', () => {
  const { rt, syncAtMs } = syncedRuntime();
  const issued = issue(rt, syncAtMs);
  assert.equal(issued.kind, 'SYNC_EXECUTION_ISSUED');
  assert.equal(issued.actionId, `sync.exec.universe-1.${syncAtMs}`);
  assert.deepEqual([...issued.transportableTaskIds], ['task-1']);
  assert.match(issued.instruction.minimumAction, /universe universe-1/);
  assert.match(issued.minimumAction, /tasks task-1/);
  assert.match(issued.minimumAction, /NO quarantined task/);
  assert.match(issued.minimumAction, /CONFIDENTIAL\/TOP_SECRET never leave the local plane/);
  assert.equal(issued.instruction.executedByThisRuntime, false);
  assert.equal(issued.instruction.productionExecutionAllowed, false);
  assert.equal(issued.humanDecision, 'REQUIRED');
  assert.equal(issued.bytesMovedByThisRuntime, false);
  assert.equal(issued.remoteCalls, 0);
  assert.equal(issued.modelCalls, 0);
  assert.equal(issued.billionUsersProven, false);
  assert.equal(issued.learningPromoted, false);
  assert.equal(Object.isFrozen(issued), true);
  assert.equal(Object.isFrozen(issued.transportableTaskIds), true);
  assert.equal(issued.workflow.stage, 'EXECUTE_MINIMUM_ACTION');
  assert.equal(issued.workflow.humanDecision, 'REQUIRED');
  assert.equal(issued.guardrails, OFFLINE_SYNC_EXECUTION_GUARDRAILS);
  // 12D-231 ceiling is not silently widened by this bridge.
  assert.ok(OFFLINE_SYNC_EXECUTION_POLICY.maxIdChars > 0);
  assert.equal(OFFLINE_RUNTIME_POLICY.maxAdmittedTasksPerAgent, 1000);
});

test('12D-232 a tampered runtime ledger is refused before anything is issued', () => {
  const { rt, syncAtMs } = syncedRuntime();
  (rt.ledgerEntries() as unknown as { push: (e: unknown) => void }).push({
    seq: 9999, atMs: T0, agentId: 'xiv-forge', taskId: 'task-1', tenantId: 'tenant-alpha',
    kind: 'SYNC_APPLIED', detail: 'forged', hash: 'f'.repeat(64),
  });
  assert.throws(() => issue(rt, syncAtMs), /ledger failed verification/);
});

test('12D-232 a forged outcome has no trail: inflated applied count refused', () => {
  const { rt, syncAtMs } = syncedRuntime();
  assert.throws(
    () => issueSyncExecutionInstruction({
      runtime: rt,
      syncOutcome: { status: 'SYNC_PROPOSED', conflicts: [], applied: 2 },
      syncUniverseId: 'universe-1', syncAtMs,
      syncGrantReceiptSha256: SYNC_RECIPT, taskIds: ['task-1'],
      executionGrant: { operatorReceiptSha256: EXEC_RECIPT, approvedBy: 'devin-xavier-haynes' },
      identity: IDENTITY, nowMs: syncAtMs + 100, timeLimitMs: 60_000,
    }),
    /applied count does not match|trail reconciled count/,
  );
});

test('12D-232 an invented task id is refused (no trail entry, no live task)', () => {
  const { rt, syncAtMs } = syncedRuntime();
  assert.throws(() => issue(rt, syncAtMs, { taskIds: ['task-ghost'] }), /no SYNC_APPLIED trail entry/);
  // A task id that exists but was never in the batch: live-state ordering must
  // still hold — the trail gate refuses first, and the live gate independently refuses.
  rt.enqueue({
    taskId: 'task-2', agentId: 'xiv-field-agent', tenantId: 'tenant-alpha',
    universeId: 'universe-1', payloadDigest: sha('p2'), maxAttempts: 3, nowMs: T0,
  });
  assert.throws(() => issue(rt, syncAtMs, { taskIds: ['task-2'] }), /no SYNC_APPLIED trail entry|is PENDING without a reconciled result/);
});

test('12D-232 a conflicting sync batch is never transportable', () => {
  const rt = new OfflineAgentRuntime(T0, 'runtime-seed-123456789');
  rt.enqueue({
    taskId: 'task-1', agentId: 'xiv-field-agent', tenantId: 'tenant-alpha',
    universeId: 'universe-1', payloadDigest: sha('local-truth'), maxAttempts: 3, nowMs: T0,
  });
  const syncAtMs = T0 + 400;
  const out = rt.proposeSync(
    { operatorReceipt: SYNC_RECIPT, authorizedBy: 'devin', atMs: T0 + 300 },
    { universeId: 'universe-1', remoteDigests: { 'task-1': sha('remote-different') } },
    syncAtMs,
  );
  assert.equal(out.status, 'SYNC_CONFLICT');
  assert.equal(rt.taskState('task-1')!.state, 'QUARANTINED');
  assert.throws(() => issueSyncExecutionInstruction({
    runtime: rt,
    syncOutcome: out,
    syncUniverseId: 'universe-1', syncAtMs,
    syncGrantReceiptSha256: SYNC_RECIPT, taskIds: ['task-1'],
    executionGrant: { operatorReceiptSha256: EXEC_RECIPT, approvedBy: 'devin' },
    identity: IDENTITY, nowMs: syncAtMs + 100, timeLimitMs: 60_000,
  }), /quarantined for human review; nothing from it is transportable/);
  // Even with the status gate bypassed, re-derivation refuses: the trail says
  // reconciled 0 conflicts 1, and no SYNC_APPLIED entry exists for the task.
  assert.throws(() => issue(rt, syncAtMs), /reconciled count does not match|no SYNC_APPLIED trail entry/);
});

test('12D-232 the execution grant is a separate human act: same receipt refused', () => {
  const { rt, syncAtMs } = syncedRuntime();
  assert.throws(
    () => issueSyncExecutionInstruction({
      runtime: rt,
      syncOutcome: { status: 'SYNC_PROPOSED', conflicts: [], applied: 1 },
      syncUniverseId: 'universe-1', syncAtMs,
      syncGrantReceiptSha256: SYNC_RECIPT, taskIds: ['task-1'],
      executionGrant: { operatorReceiptSha256: SYNC_RECIPT, approvedBy: 'devin-xavier-haynes' },
      identity: IDENTITY, nowMs: syncAtMs + 100, timeLimitMs: 60_000,
    }),
    /must differ from the sync-authorization receipt/,
  );
});

test('12D-232 an execution grant cannot predate the sync proposal', () => {
  const { rt, syncAtMs } = syncedRuntime();
  assert.throws(() => issue(rt, syncAtMs, { nowMs: syncAtMs - 1 }), /predates the sync proposal/);
});

test('12D-232 identity gates: policy, tool scope, and data boundary are exact', () => {
  const { rt, syncAtMs } = syncedRuntime();
  const wrongPolicy = { ...IDENTITY, actionPolicy: 'BOUNDED_AUTOMATION' } as const;
  assert.throws(() => issue(rt, syncAtMs, { identity: wrongPolicy }), /must be ADVISE_ONLY/);
  const wideTools = { ...IDENTITY, approvedTools: ['xiv.sync.transport', 'xiv.traffic.failover'] } as const;
  assert.throws(() => issue(rt, syncAtMs, { identity: wideTools }), /exactly one approved tool/);
  const wrongTool = { ...IDENTITY, approvedTools: ['xiv.traffic.failover'] } as const;
  assert.throws(() => issue(rt, syncAtMs, { identity: wrongTool }), /exactly one approved tool/);
  const noBoundary = { identityId: 'xiv-sync-connector', approvedTools: ['xiv.sync.transport'], dataBoundaries: ['universe-OTHER'], actionPolicy: 'ADVISE_ONLY' } as const;
  assert.throws(() => issue(rt, syncAtMs, { identity: noBoundary }), /data boundaries must include the sync universe/);
});

test('12D-232 cross-universe and quarantined tasks in the transport set fail closed', () => {
  const rt = new OfflineAgentRuntime(T0, 'runtime-seed-123456789');
  rt.enqueue({
    taskId: 'task-1', agentId: 'xiv-field-agent', tenantId: 'tenant-alpha',
    universeId: 'universe-1', payloadDigest: sha('p1'), maxAttempts: 3, nowMs: T0,
  });
  rt.enqueue({
    taskId: 'task-2', agentId: 'xiv-field-agent', tenantId: 'tenant-alpha',
    universeId: 'universe-OTHER', payloadDigest: sha('p2'), maxAttempts: 3, nowMs: T0,
  });
  const lease = rt.leaseNext('xiv-field-agent', T0 + 100)!;
  rt.complete(lease.leaseId, sha('r1'), T0 + 200);
  const syncAtMs = T0 + 400;
  const out = rt.proposeSync(
    { operatorReceipt: SYNC_RECIPT, authorizedBy: 'devin', atMs: T0 + 300 },
    { universeId: 'universe-1', remoteDigests: { 'task-1': sha('r1') } },
    syncAtMs,
  );
  assert.equal(out.status, 'SYNC_PROPOSED');
  // task-2 is PENDING and from another universe — both live-state gates refuse.
  assert.throws(
    () => issueSyncExecutionInstruction({
      runtime: rt,
      syncOutcome: { status: 'SYNC_PROPOSED', conflicts: [], applied: 2 },
      syncUniverseId: 'universe-1', syncAtMs,
      syncGrantReceiptSha256: SYNC_RECIPT, taskIds: ['task-1', 'task-2'],
      executionGrant: { operatorReceiptSha256: EXEC_RECIPT, approvedBy: 'devin' },
      identity: IDENTITY, nowMs: syncAtMs + 100, timeLimitMs: 60_000,
    }),
    /trail batch size does not match|belongs to universe/,
  );
});

test('12D-232 malformed inputs fail closed without partial state', () => {
  const { rt, syncAtMs } = syncedRuntime();
  assert.throws(() => issue(rt, syncAtMs, { runtime: null }), /fail closed/);
  assert.throws(() => issue(rt, syncAtMs, { syncUniverseId: 'bad universe!' }), /malformed sync universeId/);
  assert.throws(() => issue(rt, syncAtMs, { syncGrantReceiptSha256: 'nothex' }), /64-hex/);
  assert.throws(() => issue(rt, syncAtMs, { taskIds: [] }), /malformed transportable task ids/);
  assert.throws(() => issue(rt, syncAtMs, { taskIds: ['task-1', 'task-1'] }), /distinct/);
  assert.throws(() => issue(rt, syncAtMs, { executionGrant: { operatorReceiptSha256: 'ab'.repeat(32), approvedBy: '' } }), /malformed execution approver/);
  assert.throws(() => issue(rt, syncAtMs, { syncAtMs: syncAtMs + 10_000_000 }), /predates|SYNC_PROPOSED trail entry/);
  // Nothing was mutated on the runtime by any refusal.
  assert.equal(rt.verifyLedger().ok, true);
});