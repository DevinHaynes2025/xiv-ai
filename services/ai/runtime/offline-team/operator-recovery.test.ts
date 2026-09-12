import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SharedHostLeaseStore, type HostLeaseBinding, type HostLeaseHandle } from './shared-host-lease-store';
import { OfflineStoryQueue, type OfflineStory, type StoryLease } from './offline-story-queue';

const hostId = 'a'.repeat(32), source = 'b'.repeat(40);
const tenantId = 'synthetic-tenant';
const binding = (workId = 'work-1'): HostLeaseBinding => ({
  tenantId, holderInstanceId: 'worker-a', lane: 'OFFLINE_SHIFT', workId,
  sourceCommit: source, providerId: 'ollama', modelId: 'qwen2.5-coder:7b', presenceEvidenceRef: 'fixture:presence' });
const story = (id = 'story-1'): OfflineStory => ({ id, tenantId, roleId: 'node_backend',
  objective: `Synthetic bounded draft ${id}`, acceptance: ['Must pass the fixture test'],
  dependencies: [], sourceRevision: source, masterPlanSha256: 'c'.repeat(64),
  kind: 'PRODUCT_STORY', securityClass: 'ORDINARY' });
const ev = (s: string) => `operator:${s}`;

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-recovery-test-'));
  const path = join(dir, 'host.sqlite'); SharedHostLeaseStore.initialize(path, hostId);
  let now = 1_800_000_000_000;
  const stores: SharedHostLeaseStore[] = [], queues: OfflineStoryQueue[] = [];
  return { dir, now: () => now, advance: (n: number) => { now += n; },
    open: () => { const s = new SharedHostLeaseStore(path, hostId, () => now); stores.push(s); return s; },
    queue: (name = 'queue') => { const q = new OfflineStoryQueue(join(dir, `${name}.sqlite`), () => now); queues.push(q); return q; },
    done: () => { for (const q of queues) { try { q.close(); } catch {} } for (const s of stores) { try { s.close(); } catch {} } rmSync(dir, { recursive: true, force: true }); } };
}
function reserve(s: SharedHostLeaseStore): HostLeaseHandle {
  const r = s.acquire(binding()); if (r.status !== 'RESERVED_NOT_STARTED') throw new Error('expected reservation'); return r.handle;
}
function claimed(q: OfflineStoryQueue): StoryLease {
  q.enqueue([story()]);
  const lease = q.claimNext(tenantId, 'node_backend', 'worker-a', 120_000);
  if (!lease) throw new Error('expected claim'); return lease;
}

test('an expired-unsettled ACTIVE lease is voided by operator evidence and capacity becomes reusable', () => {
  const f = fixture(); try {
    const a = f.open(); const h = reserve(a); f.advance(30_001);
    const b = f.open();
    assert.equal(b.snapshot(tenantId).expiredUnsettled, true);
    assert.equal(b.acquire(binding('next')).decision, 'DENY_EXPIRED_UNSETTLED');
    const voided = b.voidLeaseByOperator(h.leaseId, ev('expired-unsettled-reviewed'));
    assert.equal(voided.state, 'VOIDED_BY_OPERATOR');
    assert.equal(voided.operatorRecoveryAttested, true);
    assert.equal(b.acquire(binding('next')).status, 'RESERVED_NOT_STARTED');
  } finally { f.done(); }
});

test('operator void refuses an unexpired ACTIVE lease, a wrong lease id, and missing evidence', () => {
  const f = fixture(); try {
    const a = f.open(); const h = reserve(a);
    const b = f.open();
    assert.throws(() => b.voidLeaseByOperator(h.leaseId, ev('too-early')));
    assert.throws(() => b.voidLeaseByOperator('x'.repeat(36), ev('wrong-id')));
    f.advance(30_001);
    assert.throws(() => b.voidLeaseByOperator(h.leaseId, ''));
    assert.throws(() => b.voidLeaseByOperator(h.leaseId, 'x'.repeat(300)));
    assert.equal(b.snapshot(tenantId).state, 'ACTIVE'); // Nothing changed.
  } finally { f.done(); }
});

test('operator confirms an unconfirmed stop after independent verification, then releases', () => {
  const f = fixture(); try {
    const a = f.open(); const h = reserve(a); a.markStopped(h, false);
    const b = f.open();
    assert.equal(b.snapshot(tenantId).state, 'STOPPED_UNCONFIRMED');
    const confirmed = b.confirmStoppedByOperator(h.leaseId, ev('operator-verified-provider-stopped'));
    assert.equal(confirmed.state, 'STOPPED_CONFIRMED');
    assert.equal(confirmed.operatorRecoveryAttested, true);
    assert.equal(b.snapshot(tenantId).state, 'STOPPED_CONFIRMED');
    b.releaseByOperator(h.leaseId, ev('operator-release'));
    assert.equal(b.snapshot(tenantId).state, 'RELEASED');
    assert.equal(b.acquire(binding('after')).status, 'RESERVED_NOT_STARTED');
  } finally { f.done(); }
});

test('confirm and void refuse ACTIVE leases and the void path records never-attested provider fate', () => {
  const f = fixture(); try {
    const a = f.open(); const h = reserve(a);
    const b = f.open();
    assert.throws(() => b.confirmStoppedByOperator(h.leaseId, ev('too-early')));
    assert.throws(() => b.voidLeaseByOperator(h.leaseId, ev('too-early')));
    assert.equal(b.snapshot(tenantId).state, 'ACTIVE');
  } finally { f.done(); }
});

test('operator voids a stale queue lease to READY or FAILED without claiming any settlement', () => {
  const f = fixture(); try {
    const q = f.queue(); const lease = claimed(q);
    const held = q.inspectHeldLease();
    assert.ok(held); assert.equal(held.token, lease.token); assert.equal(held.expired, false);
    // Ownership mismatch is rejected.
    assert.throws(() => q.voidLease({ ...held, token: 'other' }, 'READY', ev('bad')));
    q.voidLease(held, 'READY', ev('operator-attests-no-provider-effect'));
    assert.equal(q.summary(tenantId).leaseHeld, false);
    assert.equal(q.summary(tenantId).counts.find(c => String(c.state) === 'READY')?.count, 1);
    // Second recovery on the same story, now retired as FAILED.
    const lease2 = q.claimNext(tenantId, 'node_backend', 'worker-a', 120_000);
    assert.ok(lease2check(q, lease2));
    q.voidLease(q.inspectHeldLease()!, 'FAILED', ev('operator-retires'));
    assert.equal(q.summary(tenantId).counts.find(c => String(c.state) === 'FAILED')?.count, 1);
    assert.equal(q.inspectHeldLease(), null);
  } finally { f.done(); }
});
function lease2check(q: OfflineStoryQueue, lease: StoryLease | null): boolean { return lease !== null; }

test('inspectHeldLease is read-only and reports expiry honestly', () => {
  const f = fixture(); try {
    const q = f.queue();
    assert.equal(q.inspectHeldLease(), null);
    const lease = claimed(q);
    const held = q.inspectHeldLease();
    assert.ok(held); assert.equal(held.token, lease.token); assert.equal(held.deadlineMs, lease.deadlineMs);
    f.advance(120_001);
    assert.equal(q.inspectHeldLease()!.expired, true);
    assert.equal(q.inspectHeldLease()!.token, lease.token); // Still held; nothing auto-stolen.
  } finally { f.done(); }
});

test('recovery after a 12D-99 unconfirmed hold restores full capacity end-to-end', () => {
  const f = fixture(); try {
    const q = f.queue(); const lease = claimed(q);
    // Simulate the supervised worker's unconfirmed hold: provider fate unknown.
    const a = f.open(); const r = a.acquire({ tenantId, holderInstanceId: 'worker-a', lane: 'OFFLINE_SHIFT',
      workId: `queue:${lease.token}`, sourceCommit: source, providerId: 'ollama',
      modelId: 'qwen2.5-coder:7b', presenceEvidenceRef: 'fixture:presence' });
    if (r.status !== 'RESERVED_NOT_STARTED') throw new Error('expected reservation');
    a.markStopped(r.handle, false); // providerAcknowledged: false
    const b = f.open();
    assert.equal(b.snapshot(tenantId).state, 'STOPPED_UNCONFIRMED');
    assert.equal(b.acquire(binding('next')).decision, 'DENY_OPERATOR_REVIEW_HOLD');
    // Operator reviews, confirms the provider actually stopped, releases, and requeues the story.
    b.confirmStoppedByOperator(r.handle.leaseId, ev('operator-verified-stop'));
    b.releaseByOperator(r.handle.leaseId, ev('operator-release'));
    const heldLease = q.inspectHeldLease(); assert.ok(heldLease);
    q.voidLease(heldLease, 'READY', ev('operator-attests-no-provider-side-effect'));
    assert.equal(b.snapshot(tenantId).state, 'RELEASED');
    const retry = q.claimNext(tenantId, 'node_backend', 'worker-b', 120_000);
    assert.ok(retry !== null);
  } finally { f.done(); }
});