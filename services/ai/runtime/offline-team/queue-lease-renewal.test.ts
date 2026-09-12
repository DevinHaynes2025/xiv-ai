import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OfflineStoryQueue, type OfflineStory, type StoryLease } from './offline-story-queue';
import { SharedHostLeaseStore } from './shared-host-lease-store';
import { SharedQueueAdmission, type SharedQueueContext } from './shared-queue-admission';
import { runSupervisedLocalStory, SUPERVISED_WORKER_POLICY } from './supervised-local-worker';

const hostId = 'a'.repeat(32), source = 'b'.repeat(40), planHash = 'c'.repeat(64);
const tenantId = 'synthetic-tenant';
const story = (id = 'story-1'): OfflineStory => ({ id, tenantId, roleId: 'node_backend',
  objective: `Synthetic bounded draft ${id}`, acceptance: ['Must pass the fixture test'],
  dependencies: [], sourceRevision: source, masterPlanSha256: planHash,
  kind: 'PRODUCT_STORY', securityClass: 'ORDINARY' });
const context: SharedQueueContext = { tenantId, holderInstanceId: 'supervised-worker',
  sourceCommit: source, approvedPlanSha256: planHash, providerId: 'ollama',
  modelId: 'qwen2.5-coder:7b', presenceEvidenceRef: 'fixture:presence' };

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-lease-renewal-test-'));
  const hostPath = join(dir, 'host.sqlite');
  SharedHostLeaseStore.initialize(hostPath, hostId);
  let now = 1_800_000_000_000;
  let seq = 0;
  const queues: OfflineStoryQueue[] = [], hosts: SharedHostLeaseStore[] = [];
  return { dir, now: () => now, advance: (n: number) => { now += n; },
    queue: () => { const q = new OfflineStoryQueue(join(dir, `queue-${++seq}.sqlite`), () => now); queues.push(q); return q; },
    host: () => { const h = new SharedHostLeaseStore(hostPath, hostId, () => now); hosts.push(h); return h; },
    done: () => { for (const q of queues) { try { q.close(); } catch {} } for (const h of hosts) { try { h.close(); } catch {} } rmSync(dir, { recursive: true, force: true }); } };
}

test('queue-lease renewal keeps an unexpired lease settable past its original deadline; a lapsed one is never resurrected', () => {
  const f = fixture(); try {
    const q = f.queue();
    // Negative control: past the original 120s deadline, settlement fails without renewal.
    q.enqueue([story('story-1')]);
    const l1 = q.claimNext(tenantId, 'node_backend', 'worker-a', 120_000); assert.ok(l1);
    f.advance(130_000);
    assert.throws(() => q.renewLease(l1, 60_000)); // Lapsed leases are operator-recovery territory.
    q.settle(l1, { outcome: 'DRAFT', outputHash: 'd'.repeat(64), providerSettled: true });
    assert.equal(q.inspectStory(tenantId, 'story-1')?.state, 'FAILED');
    // With renewal the same clock position settles as AWAITING_REVIEW.
    q.enqueue([story('story-2')]);
    const l2 = q.claimNext(tenantId, 'node_backend', 'worker-a', 120_000); assert.ok(l2);
    f.advance(110_000);
    const renewed = q.renewLease(l2, 60_000);
    assert.equal(renewed.extended, true); assert.equal(renewed.extensionExhausted, false);
    assert.equal(renewed.lease.deadlineMs, f.now() + 60_000);
    assert.equal(q.inspectHeldLease()?.renewals, 1);
    f.advance(55_000); // Now 165s past claim — past the original deadline, inside the renewal.
    q.settle(renewed.lease, { outcome: 'DRAFT', outputHash: 'd'.repeat(64), providerSettled: true });
    assert.equal(q.inspectStory(tenantId, 'story-2')?.state, 'AWAITING_REVIEW');
  } finally { f.done(); }
});

test('renewal never shortens a lease and is capped at the original deadline plus maxLeaseMs', () => {
  const f = fixture(); try {
    const q = f.queue(); q.enqueue([story()]);
    const lease = q.claimNext(tenantId, 'node_backend', 'worker-a', 120_000); assert.ok(lease);
    // A renewal request smaller than the remaining time is refused without shrinking.
    const r1 = q.renewLease(lease, 60_000);
    assert.equal(r1.extended, false); assert.equal(r1.extensionExhausted, false);
    assert.equal(r1.lease.deadlineMs, lease.deadlineMs);
    assert.equal(q.inspectHeldLease()?.renewals, 0);
    // Reach near the original deadline, then renew past it.
    f.advance(115_000);
    const r2 = q.renewLease(lease, 60_000);
    assert.equal(r2.extended, true); assert.equal(r2.extensionExhausted, false);
    assert.equal(r2.lease.deadlineMs, lease.deadlineMs + 55_000);
    // A request reaching the total-life cap (base + 300s) is clamped and reported exhausted.
    f.advance(50_000); // now = 165s; request 300s → now + 300s is beyond base + 300s.
    const r3 = q.renewLease(r2.lease, 300_000);
    assert.equal(r3.extended, true); assert.equal(r3.extensionExhausted, true);
    assert.equal(r3.lease.deadlineMs, lease.deadlineMs + 300_000); // Clamped exactly to the cap.
    assert.equal(q.inspectHeldLease()?.renewals, 2);
    // At the cap: no growth, no shrink; exhaustion is reported once the request would exceed it.
    f.advance(205_000); // now = 370s, still inside the 420s cap window.
    const r4 = q.renewLease(r3.lease, 60_000);
    assert.equal(r4.extended, false); assert.equal(r4.extensionExhausted, true);
    assert.equal(r4.lease.deadlineMs, r3.lease.deadlineMs);
  } finally { f.done(); }
});

test('renewal requires the exact current lease identity and bounded extension amounts', () => {
  const f = fixture(); try {
    const q = f.queue(); q.enqueue([story()]);
    const lease = q.claimNext(tenantId, 'node_backend', 'worker-a', 120_000); assert.ok(lease);
    assert.throws(() => q.renewLease({ ...lease, token: 'other' }, 60_000));
    assert.throws(() => q.renewLease(lease, 0));
    assert.throws(() => q.renewLease(lease, 300_001));
    assert.equal(q.inspectHeldLease()?.renewals, 0);
  } finally { f.done(); }
});

test('admission.renewQueueLease refreshes the ticket and the renewed ticket settles', () => {
  const f = fixture(); try {
    const q = f.queue(); const host = f.host();
    const admission = new SharedQueueAdmission(q, host, context);
    q.enqueue([story()]);
    let ticket = admission.claimNext('node_backend').ticket; assert.ok(ticket);
    // Keep both leases alive while the virtual clock passes the original queue deadline.
    for (let i = 0; i < 30; i++) {
      ticket = admission.renew(ticket); // Host lease maintenance (short TTL).
      ticket = admission.renewQueueLease(ticket, 60_000).ticket;
      f.advance(5_000);
    }
    assert.equal(f.now() >= 120_000 + 1_800_000_000_000, true); // Past the original deadline.
    const settled = admission.settle(ticket, { providerAcknowledged: true, outcome: 'DRAFT',
      outputHash: 'e'.repeat(64), evidenceRef: 'generate:fixture' });
    assert.equal(settled.status, 'SETTLED_REVIEW_NOT_GRANTED');
    assert.equal(q.inspectStory(tenantId, 'story-1')?.state, 'AWAITING_REVIEW');
  } finally { f.done(); }
});

test('a long generation settles because queue-lease renewal rides the maintenance interval', async t => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const f = fixture(); try {
    const q = f.queue(); const host = f.host();
    const admission = new SharedQueueAdmission(q, host, context);
    q.enqueue([story()]);
    let release!: (value: Record<string, unknown>) => void;
    const gated = new Promise<Record<string, unknown>>(res => { release = res; });
    const runP = runSupervisedLocalStory(admission, 'node_backend', {
      tenantId, clock: f.now, presence: () => 'fixture:presence',
      request: async () => new Response(JSON.stringify(await gated),
        { status: 200, headers: { 'content-type': 'application/json' } }),
    });
    await new Promise(resolve => setTimeout(resolve, 0)); // Reach the gated request.
    // Simulate 160s of generation: every 4s the maintenance interval renews both leases.
    for (let i = 0; i < 40; i++) { t.mock.timers.tick(SUPERVISED_WORKER_POLICY.hostRenewalIntervalMs); f.advance(SUPERVISED_WORKER_POLICY.hostRenewalIntervalMs); }
    assert.equal(f.now() >= 120_000 + 1_800_000_000_000, true); // Past the original queue deadline.
    const held = q.inspectHeldLease();
    assert.ok(held); assert.equal(held.expired, false); assert.ok((held.renewals ?? 0) > 0);
    release!({ model: SUPERVISED_WORKER_POLICY.model, done: true, done_reason: 'stop',
      response: 'Draft: the long local generation completed within the renewed window.',
      eval_count: 42 });
    const run = await runP;
    assert.equal(run.status, 'SETTLED_AWAITING_REVIEW');
    assert.equal(run.storyState, 'AWAITING_REVIEW');
    assert.ok(run.queueLeaseExtensions > 0);
    assert.equal(run.queueLeaseExtensionExhausted, false);
    assert.equal(run.queueLeaseRetained, false);
    assert.equal(run.hostLeaseUnresolved, false);
  } finally { f.done(); }
});