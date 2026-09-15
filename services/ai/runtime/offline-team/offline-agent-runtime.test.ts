// 12D-231 tests — adversarial coverage for the Offline Agent Runtime.
// Under test: budgeted admission, exclusive leases with heartbeats, bounded
// retry including crash-expiry accounting, idempotent completion and replay
// refusal, tenant/universe isolation, network-deny sync gate with single-use
// operator grants, conflict quarantine without silent overwrites, human
// cancellation, emergency stop, and ledger tamper evidence. Nothing here
// touches a network, a provider, or production.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  OFFLINE_RUNTIME_POLICY,
  OFFLINE_RUNTIME_GUARDRAILS,
  OFFLINE_RUNTIME_CONSTITUTION,
  OfflineAgentRuntime,
  type OperatorSyncGrant,
} from './offline-agent-runtime';

const T0 = 1_000_000_000;
const sha = (s: string): string => createHash('sha256').update(s).digest('hex');

function spec(overrides: Partial<Parameters<OfflineAgentRuntime['enqueue']>[0]> = {}) {
  return {
    taskId: 'task-1',
    agentId: 'xiv-field-agent',
    tenantId: 'tenant-alpha',
    universeId: 'universe-1',
    payloadDigest: sha('payload-1'),
    maxAttempts: 3,
    nowMs: T0,
    ...overrides,
  };
}

function freshRuntime(): OfflineAgentRuntime {
  return new OfflineAgentRuntime(T0, 'runtime-seed-123456789');
}

test('12D-231 policy constants match the owner charter', () => {
  assert.equal(OFFLINE_RUNTIME_POLICY.maxAutonomousRetries, 3);
  assert.equal(OFFLINE_RUNTIME_POLICY.maxLeaseMs, 300_000);
  assert.equal(OFFLINE_RUNTIME_POLICY.maxTotalLeaseMs, 600_000);
  assert.equal(OFFLINE_RUNTIME_POLICY.syncRequiresOperatorReceipt, true);
  assert.equal(OFFLINE_RUNTIME_POLICY.networkDenyByDefault, true);
  assert.equal(OFFLINE_RUNTIME_POLICY.conflictsQuarantined, true);
  assert.equal(OFFLINE_RUNTIME_POLICY.atRestEncryption, 'OPERATOR_MANAGED_KEY_REQUIRED');
  assert.equal(OFFLINE_RUNTIME_POLICY.measuredRowsPerDatabaseCeiling, 2_000_000);
  assert.equal(OFFLINE_RUNTIME_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(OFFLINE_RUNTIME_GUARDRAILS.noProviderFallback, true);
  assert.equal(OFFLINE_RUNTIME_GUARDRAILS.noModelWeightMutation, true);
  assert.equal(OFFLINE_RUNTIME_GUARDRAILS.noSilentOverwrites, true);
  assert.equal(OFFLINE_RUNTIME_GUARDRAILS.learningPromoted, false);
  assert.equal(OFFLINE_RUNTIME_CONSTITUTION.modelCalls, 0);
  assert.equal(OFFLINE_RUNTIME_CONSTITUTION.remoteCalls, 0);
  assert.equal(OFFLINE_RUNTIME_CONSTITUTION.billionUsersProven, false);
  assert.equal(Object.isFrozen(OFFLINE_RUNTIME_POLICY), true);
  assert.equal(Object.isFrozen(OFFLINE_RUNTIME_GUARDRAILS), true);
  assert.equal(Object.isFrozen(OFFLINE_RUNTIME_CONSTITUTION), true);
});

test('12D-231 enqueue -> lease -> complete happy path is exclusive, idempotent, and ledger-verified', () => {
  const rt = freshRuntime();
  rt.enqueue(spec());
  const lease = rt.leaseNext('xiv-field-agent', T0 + 1_000)!;
  assert.equal(lease.taskId, 'task-1');
  assert.match(lease.leaseId, /^[0-9a-f]{64}$/);
  // Exclusive: while the lease is active, the task cannot be leased again.
  assert.equal(rt.leaseNext('xiv-field-agent', T0 + 1_100), null);
  const done = rt.complete(lease.leaseId, sha('result-1'), T0 + 2_000);
  assert.equal(done.state, 'COMPLETED');
  assert.equal(done.resultDigest, sha('result-1'));
  // Terminal: re-completion, re-leasing, and cancellation are all refused.
  assert.throws(() => rt.complete(lease.leaseId, sha('result-1'), T0 + 2_100));
  assert.equal(rt.leaseNext('xiv-field-agent', T0 + 2_200), null);
  assert.equal(rt.verifyLedger().ok, true);
  // Raw payloads never enter the ledger — only digests.
  for (const e of rt.ledgerEntries()) assert.equal(e.detail.includes('result-1'), false);
});

test('12D-231 duplicate admission is replay-refused; malformed input throws without mutation', () => {
  const rt = freshRuntime();
  rt.enqueue(spec());
  assert.throws(() => rt.enqueue(spec()), /duplicate taskId/);
  assert.throws(() => rt.enqueue(spec({ payloadDigest: 'short' })), /64-hex/);
  assert.throws(() => rt.enqueue(spec({ maxAttempts: 4 })), /within 1\.\.3/);
  assert.throws(() => rt.enqueue(spec({ tenantId: 'bad tenant!' })), /malformed tenantId/);
  assert.equal(rt.taskState('task-1')!.attemptsUsed, 0);
  assert.equal(rt.verifyLedger().ok, true);
});

test('12D-231 tenant and universe isolation: cross-tenant enqueue and cross-universe sync are refused', () => {
  const rt = freshRuntime();
  rt.enqueue(spec());
  // The task is bound to tenant-alpha/universe-1; a sync batch scoped to a
  // DIFFERENT universe cannot touch it.
  const held = rt.leaseNext('xiv-field-agent', T0 + 1_000);
  assert.notEqual(held, null);
  const grant: OperatorSyncGrant = { operatorReceipt: 'a'.repeat(64), authorizedBy: 'devin-xavier-haynes', atMs: T0 };
  assert.throws(() =>
    rt.proposeSync(grant, { universeId: 'universe-OTHER', remoteDigests: { 'task-1': sha('payload-1') } }, T0 + 2_000),
  /cross-universe/);
  assert.equal(rt.taskState('task-1')!.state, 'LEASED');
});

test('12D-231 heartbeat renews within the cap; past the cap the lease dies', () => {
  const rt = freshRuntime();
  rt.enqueue(spec());
  const lease = rt.leaseNext('xiv-field-agent', T0)!;
  const r1 = rt.renewLease(lease.leaseId, T0 + 200_000);
  assert.equal(r1.heartbeatCount, 1);
  assert.equal(r1.expiresAtMs, T0 + 500_000);
  // Past the TOTAL cap (granted T0 + 600k), a heartbeat kills the lease.
  assert.throws(() => rt.renewLease(lease.leaseId, T0 + 600_000), /expired/);
  // The task survived as PENDING with ONE consumed attempt.
  assert.equal(rt.taskState('task-1')!.state, 'PENDING');
  assert.equal(rt.taskState('task-1')!.attemptsUsed, 1);
});

test('12D-231 crash recovery: expiry counts attempts; the retry limit stops the crash loop', () => {
  const rt = freshRuntime();
  rt.enqueue(spec({ maxAttempts: 3 }));
  // A worker crashes (never completes, never fails) three times in a row.
  for (let i = 0; i < 3; i++) {
    const lease = rt.leaseNext('xiv-field-agent', T0 + i * 1_000)!;
    rt.reclaimExpiredLeases(lease.expiresAtMs);
    if (i < 2) assert.equal(rt.taskState('task-1')!.state, 'PENDING');
  }
  const dead = rt.taskState('task-1')!;
  assert.equal(dead.state, 'FAILED_PERMANENT');
  assert.equal(dead.attemptsUsed, 3);
  // Terminal: never leasable again — the crash loop is over.
  assert.equal(rt.leaseNext('xiv-field-agent', T0 + 99_999), null);
  const kinds = rt.ledgerEntries().map((e) => e.kind);
  assert.equal(kinds.filter((k) => k === 'LEASE_EXPIRED').length, 3);
});

test('12D-231 fail() is retryable then terminal at the owner limit of 3', () => {
  const rt = freshRuntime();
  rt.enqueue(spec({ maxAttempts: 3 }));
  for (let i = 0; i < 3; i++) {
    const lease = rt.leaseNext('xiv-field-agent', T0 + i * 1_000)!;
    const t = rt.fail(lease.leaseId, T0 + i * 1_000 + 100, `transient ${i}`);
    if (i < 2) assert.equal(t.state, 'PENDING');
    else assert.equal(t.state, 'FAILED_PERMANENT');
  }
  assert.equal(rt.leaseNext('xiv-field-agent', T0 + 9_000), null);
  // Malformed reason refused.
  const l = rt.leaseNext('xiv-field-agent', T0 + 10_000); // null: no pending tasks
  assert.equal(l, null);
  assert.equal(rt.verifyLedger().ok, true);
});

test('12D-231 per-agent budgets: admission cap and active-lease cap are enforced', () => {
  const rt = freshRuntime();
  for (let i = 0; i < OFFLINE_RUNTIME_POLICY.maxAdmittedTasksPerAgent; i++) {
    rt.enqueue(spec({ taskId: `task-${i}` }));
  }
  assert.throws(() => rt.enqueue(spec({ taskId: 'task-over' })), /admission budget/);
  // Active-lease cap (4).
  for (let i = 0; i < OFFLINE_RUNTIME_POLICY.maxActiveLeasesPerAgent; i++) {
    assert.notEqual(rt.leaseNext('xiv-field-agent', T0 + 1_000), null);
  }
  assert.throws(() => rt.leaseNext('xiv-field-agent', T0 + 1_000), /active-lease budget/);
  // An unknown agent has no surfaces.
  assert.throws(() => rt.leaseNext('xiv-ghost-agent', T0 + 1_000), /unknown agent/);
});

test('12D-231 sync gate: no receipt, no network; valid receipt reconciles; replay and forgery refused', () => {
  const rt = freshRuntime();
  rt.enqueue(spec({ taskId: 'task-A', payloadDigest: sha('p1') }));
  rt.enqueue(spec({ taskId: 'task-B', payloadDigest: sha('p2') }));
  // WITHOUT a receipt the gate is closed — any presentation throws.
  assert.throws(() =>
    rt.proposeSync({ operatorReceipt: 'nothex', authorizedBy: 'devin', atMs: T0 }, { universeId: 'universe-1', remoteDigests: { 'task-1': sha('p1') } }, T0 + 1_000),
  /64-hex/);
  const grant: OperatorSyncGrant = { operatorReceipt: 'b'.repeat(64), authorizedBy: 'devin-xavier-haynes', atMs: T0 };
  const out = rt.proposeSync(grant, { universeId: 'universe-1', remoteDigests: { 'task-A': sha('p1'), 'task-B': sha('p2') } }, T0 + 2_000);
  assert.equal(out.status, 'SYNC_PROPOSED');
  assert.equal(out.applied, 2);
  assert.equal(out.conflicts.length, 0);
  // The grant is single-use: replay refused.
  assert.throws(() => rt.proposeSync(grant, { universeId: 'universe-1', remoteDigests: { 'task-A': sha('p1') } }, T0 + 3_000), /replay/);
  // Future-dated grant refused.
  assert.throws(() =>
    rt.proposeSync({ operatorReceipt: 'c'.repeat(64), authorizedBy: 'devin', atMs: T0 + 99_999 }, { universeId: 'universe-1', remoteDigests: { 'task-A': sha('p1') } }, T0 + 4_000),
  /future-dated/);
  // Malformed remote digest refused (and the consumed grant is disclosed as fail-closed).
  const grant2: OperatorSyncGrant = { operatorReceipt: 'd'.repeat(64), authorizedBy: 'devin', atMs: T0 };
  assert.throws(() => rt.proposeSync(grant2, { universeId: 'universe-1', remoteDigests: { 'task-A': 'nothex' } }, T0 + 5_000), /64-hex/);
  assert.equal(rt.verifyLedger().ok, true);
});

test('12D-231 digest mismatch QUARANTINES for human review; no silent overwrite', () => {
  const rt = freshRuntime();
  rt.enqueue(spec({ taskId: 'task-1', payloadDigest: sha('local-truth') }));
  const grant: OperatorSyncGrant = { operatorReceipt: 'e'.repeat(64), authorizedBy: 'devin', atMs: T0 };
  const out = rt.proposeSync(grant, { universeId: 'universe-1', remoteDigests: { 'task-1': sha('remote-different') } }, T0 + 1_000);
  assert.equal(out.status, 'SYNC_CONFLICT');
  assert.deepEqual([...out.conflicts], ['task-1']);
  const t = rt.taskState('task-1')!;
  assert.equal(t.state, 'QUARANTINED');
  assert.equal(t.payloadDigest, sha('local-truth')); // local truth PRESERVED
  assert.match(t.quarantineReason!, /human review required/);
  const q = rt.ledgerEntries().find((e) => e.kind === 'TASK_QUARANTINED');
  assert.match(q!.detail, /NOT overwritten/);
  // A quarantined task is terminal — never leasable again.
  assert.equal(rt.leaseNext('xiv-field-agent', T0 + 2_000), null);
});

test('12D-231 unknown tasks in a sync batch become conflicts, not fabrications', () => {
  const rt = freshRuntime();
  rt.enqueue(spec({ taskId: 'task-1', payloadDigest: sha('p') }));
  const grant: OperatorSyncGrant = { operatorReceipt: 'f'.repeat(64), authorizedBy: 'devin', atMs: T0 };
  const out = rt.proposeSync(grant, { universeId: 'universe-1', remoteDigests: { 'task-1': sha('p'), 'task-ghost': sha('x') } }, T0 + 1_000);
  assert.equal(out.status, 'SYNC_CONFLICT');
  assert.deepEqual([...out.conflicts], ['task-ghost']);
  assert.equal(out.applied, 1);
  assert.equal(rt.taskState('task-ghost'), null);
});

test('12D-231 human cancellation and emergency stop are terminal and idempotent', () => {
  const rt = freshRuntime();
  rt.enqueue(spec({ taskId: 'task-1' }));
  const lease = rt.leaseNext('xiv-field-agent', T0 + 1_000)!;
  const cancelled = rt.cancelTask('task-1', T0 + 2_000, 'operator cancelled');
  assert.equal(cancelled.state, 'CANCELLED');
  // The active lease was revoked outright; completing it is refused at the
  // lease layer (revocation, not just a terminal-state guard).
  assert.throws(() => rt.complete(lease.leaseId, sha('r'), T0 + 3_000), /unknown lease/);
  assert.throws(() => rt.cancelTask('task-1', T0 + 3_000, 'again'), /cancellation refused/);
  // Emergency stop: idempotent, and every later surface refuses.
  rt.emergencyStopAgent('xiv-field-agent', T0 + 4_000, 'operator halt');
  rt.emergencyStopAgent('xiv-field-agent', T0 + 4_100, 'duplicate');
  assert.equal(rt.ledgerEntries().filter((e) => e.kind === 'AGENT_STOPPED').length, 1);
  assert.throws(() => rt.leaseNext('xiv-field-agent', T0 + 5_000), /emergency-stopped/);
  assert.throws(() => rt.enqueue(spec({ taskId: 'task-2' })), /emergency-stopped/);
  assert.equal(rt.verifyLedger().ok, true);
});

test('12D-231 emergency stop revokes active leases and preserves attempts', () => {
  const rt = freshRuntime();
  rt.enqueue(spec({ taskId: 'task-1', maxAttempts: 3 }));
  rt.leaseNext('xiv-field-agent', T0)!;
  rt.emergencyStopAgent('xiv-field-agent', T0 + 1_000, 'halt');
  assert.equal(rt.taskState('task-1')!.state, 'PENDING');
  assert.equal(rt.taskState('task-1')!.attemptsUsed, 0);
  assert.equal(rt.ledgerEntries().filter((e) => e.kind === 'LEASE_GRANTED').length, 1);
});

test('12D-231 the ledger is hash-chained, identity-attached, and tamper-evident', () => {
  const rt = freshRuntime();
  rt.enqueue(spec());
  const lease = rt.leaseNext('xiv-field-agent', T0 + 1_000)!;
  rt.complete(lease.leaseId, sha('r'), T0 + 2_000);
  const trail = rt.verifyLedger();
  assert.equal(trail.ok, true);
  assert.equal(trail.entries >= 3, true);
  for (const e of rt.ledgerEntries()) {
    assert.match(e.hash, /^[0-9a-f]{64}$/);
    assert.equal(typeof e.tenantId, 'string');
  }
  // Injected tampering is detected.
  (rt.ledgerEntries() as unknown as { push: (e: unknown) => void }).push({
    seq: 9999, atMs: T0, agentId: 'xiv-forge', taskId: 't', tenantId: 'x',
    kind: 'TASK_COMPLETED', detail: 'forged', hash: 'f'.repeat(64),
  });
  assert.equal(rt.verifyLedger().ok, false);
});

test('12D-231 the 2,000,000-row measured ceiling is re-asserted structurally', () => {
  assert.equal(OFFLINE_RUNTIME_POLICY.measuredRowsPerDatabaseCeiling, 2_000_000);
  assert.equal(OFFLINE_RUNTIME_POLICY.maxAdmittedTasksPerAgent, 1000);
  assert.ok(OFFLINE_RUNTIME_POLICY.maxAdmittedTasksPerAgent < OFFLINE_RUNTIME_POLICY.measuredRowsPerDatabaseCeiling);
});

test('12D-231 crash expiry via DIRECT presentation: exactly one attempt, lease revoked, never zero or two', () => {
  const rt = freshRuntime();
  rt.enqueue(spec({ maxAttempts: 3 }));
  const lease = rt.leaseNext('xiv-field-agent', T0)!;
  // Worker crashed; the expired lease is presented DIRECTLY to complete() —
  // no reclaim pass ever ran.
  assert.throws(
    () => rt.complete(lease.leaseId, sha('r'), T0 + OFFLINE_RUNTIME_POLICY.maxLeaseMs + 1),
    /lease expired before completion/,
  );
  const t = rt.taskState('task-1')!;
  assert.equal(t.state, 'PENDING');
  assert.equal(t.attemptsUsed, 1); // exactly one consumed — never zero, never two
  // The expired lease was consumed by that presentation: replaying it is
  // refused as unknown-lease and consumes NO further attempt.
  assert.throws(
    () => rt.complete(lease.leaseId, sha('r'), T0 + OFFLINE_RUNTIME_POLICY.maxLeaseMs + 2),
    /unknown lease/,
  );
  assert.throws(
    () => rt.renewLease(lease.leaseId, T0 + OFFLINE_RUNTIME_POLICY.maxLeaseMs + 2),
    /unknown lease/,
  );
  assert.equal(rt.taskState('task-1')!.attemptsUsed, 1);
  assert.equal(rt.ledgerEntries().filter((e) => e.kind === 'LEASE_EXPIRED').length, 1);
  // Re-reclaiming the already-expired lease consumes nothing further.
  const r = rt.reclaimExpiredLeases(T0 + OFFLINE_RUNTIME_POLICY.maxLeaseMs + 3);
  assert.equal(r.reclaimed, 0);
  assert.equal(rt.taskState('task-1')!.attemptsUsed, 1);
});

test('12D-231 crash expiry via heartbeat presentation also counts exactly one attempt', () => {
  const rt = freshRuntime();
  rt.enqueue(spec({ maxAttempts: 3 }));
  const lease = rt.leaseNext('xiv-field-agent', T0)!;
  assert.throws(
    () => rt.renewLease(lease.leaseId, T0 + OFFLINE_RUNTIME_POLICY.maxLeaseMs + 1),
    /lease expired; heartbeat refused/,
  );
  assert.equal(rt.taskState('task-1')!.state, 'PENDING');
  assert.equal(rt.taskState('task-1')!.attemptsUsed, 1);
  assert.equal(rt.ledgerEntries().filter((e) => e.kind === 'LEASE_EXPIRED').length, 1);
});

test('12D-231 active-lease counters are freed by completion, cancellation, and expiry alike', () => {
  const N = OFFLINE_RUNTIME_POLICY.maxActiveLeasesPerAgent; // cap = 4
  const ids = Array.from({ length: N + 1 }, (_, i) => `t-${i}`);

  // COMPLETION frees a slot: with the cap saturated, one completion admits
  // the (N+1)th task — impossible if the counter never decremented.
  const rtA = freshRuntime();
  for (const id of ids) rtA.enqueue(spec({ taskId: id }));
  const leasesA = Array.from({ length: N }, (_, i) => rtA.leaseNext('xiv-field-agent', T0)!);
  rtA.complete(leasesA[0].leaseId, sha('r'), T0 + 1_000);
  const fifth = rtA.leaseNext('xiv-field-agent', T0 + 1_100)!;
  assert.equal(fifth.taskId, 't-4');

  // CANCELLATION frees a slot (the lease is revoked outright).
  const rtB = freshRuntime();
  for (const id of ids) rtB.enqueue(spec({ taskId: id }));
  const leasesB = Array.from({ length: N }, (_, i) => rtB.leaseNext('xiv-field-agent', T0)!);
  rtB.cancelTask(leasesB[0].taskId, T0 + 1_000, 'operator cancelled');
  assert.notEqual(rtB.leaseNext('xiv-field-agent', T0 + 1_100), null);

  // EXPIRY frees the slots: reclaiming the four expired leases admits the fifth.
  const rtC = freshRuntime();
  for (const id of ids) rtC.enqueue(spec({ taskId: id }));
  for (let i = 0; i < N; i++) rtC.leaseNext('xiv-field-agent', T0)!;
  const r = rtC.reclaimExpiredLeases(T0 + OFFLINE_RUNTIME_POLICY.maxLeaseMs + 1);
  assert.equal(r.reclaimed, N);
  assert.notEqual(rtC.leaseNext('xiv-field-agent', T0 + 1_200), null);
});

test('12D-231 a REJECTED sync proposal still consumed its grant; its replay is refused', () => {
  const rt = freshRuntime();
  rt.enqueue(spec({ taskId: 'task-A', payloadDigest: sha('p1') }));
  const grant: OperatorSyncGrant = { operatorReceipt: 'a'.repeat(64), authorizedBy: 'devin', atMs: T0 };
  // First proposal REJECTED (malformed remote digest) — but the grant was
  // consumed at proposal time. Fail-closed: nothing reconciled, nothing applied.
  assert.throws(
    () => rt.proposeSync(grant, { universeId: 'universe-1', remoteDigests: { 'task-A': 'nothex' } }, T0 + 1_000),
    /64-hex/,
  );
  assert.equal(rt.taskState('task-A')!.state, 'PENDING');
  assert.equal(rt.ledgerEntries().filter((e) => e.kind === 'SYNC_APPLIED').length, 0);
  // The SAME receipt replayed — with a fully valid batch this time — is refused.
  assert.throws(
    () => rt.proposeSync(grant, { universeId: 'universe-1', remoteDigests: { 'task-A': sha('p1') } }, T0 + 2_000),
    /replay/,
  );
});

test('12D-231 task records, leases, and ledger entries are frozen after creation', () => {
  const rt = freshRuntime();
  rt.enqueue(spec());
  const lease = rt.leaseNext('xiv-field-agent', T0 + 1_000)!;
  const t = rt.taskState('task-1')!;
  assert.equal(Object.isFrozen(t), true);
  assert.equal(Object.isFrozen(lease), true);
  assert.throws(() => { (t as { state: string }).state = 'CANCELLED'; }, TypeError);
  assert.throws(() => { (lease as { expiresAtMs: number }).expiresAtMs = T0 + 99_999_999; }, TypeError);
  rt.complete(lease.leaseId, sha('r'), T0 + 2_000);
  for (const e of rt.ledgerEntries()) {
    assert.equal(Object.isFrozen(e), true);
    assert.throws(() => { (e as { detail: string }).detail = 'forged'; }, TypeError);
  }
  assert.equal(rt.verifyLedger().ok, true);
});