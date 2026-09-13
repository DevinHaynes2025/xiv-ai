import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  adoptTenantRouting, TenantRoutedQueue, TENANT_ROUTING_ADOPTION_GUARDRAILS,
} from './tenant-routed-queue';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import { PARTITION_POLICY, tenantHash } from './queue-partition-contract';

const now = 1_700_000_000_000;
const receipt = 'a'.repeat(64);
const epoch = PARTITION_POLICY.routingEpochs[0]!;

const closeQueues = (queues?: Map<number, OfflineStoryQueue>) => {
  if (!queues) return;
  for (const q of queues.values()) { try { q.close(); } catch { /* Windows handle lag */ } }
};

const story = (id: string, tenantId: string): OfflineStory => ({
  id, tenantId, roleId: 'node_backend',
  objective: `Synthetic routed draft ${id}`, acceptance: ['Must pass the fixture test'],
  dependencies: [], sourceRevision: 'b'.repeat(40), masterPlanSha256: 'c'.repeat(64),
  kind: 'PRODUCT_STORY', securityClass: 'ORDINARY',
});

const fixture = (dir: string, shardCount = 2) => {
  const adoption = adoptTenantRouting({ epoch, shardCount, operatorReceiptSha256: receipt }, now);
  const queues = new Map<number, OfflineStoryQueue>();
  for (let s = 0; s < shardCount; s++) queues.set(s, new OfflineStoryQueue(join(dir, `shard-${s}.sqlite`), () => now));
  const routed = new TenantRoutedQueue({ adoption, shardQueues: queues });
  return { adoption, queues, routed };
};

test('adoption is receipt-gated, epoch-bounded, and frozen with honest flags', () => {
  for (const bad of [
    { epoch: 'unknown-epoch', shardCount: 2, operatorReceiptSha256: receipt },
    { epoch, shardCount: 0, operatorReceiptSha256: receipt },
    { epoch, shardCount: PARTITION_POLICY.maxShards + 1, operatorReceiptSha256: receipt },
    { epoch, shardCount: 2, operatorReceiptSha256: 'not-a-receipt' },
    { epoch, shardCount: 2, operatorReceiptSha256: 'a'.repeat(63) },
  ]) assert.throws(() => adoptTenantRouting(bad, now));
  assert.throws(() => adoptTenantRouting({ epoch, shardCount: 2, operatorReceiptSha256: receipt }, -1));
  const adoption = adoptTenantRouting({ epoch, shardCount: 2, operatorReceiptSha256: receipt }, now);
  assert.equal(Object.isFrozen(adoption), true);
  assert.equal(adoption.humanDecision, 'REQUIRED');
  assert.equal(adoption.learningPromoted, false);
  assert.equal(adoption.modelCalls, 0);
  assert.equal(adoption.remoteCalls, 0);
  assert.equal(adoption.realTenantsOnboarded, 0);
  assert.equal(adoption.billionUsersProven, false);
  assert.equal(TENANT_ROUTING_ADOPTION_GUARDRAILS.adoptionRequiresOperatorReceipt, true);
  assert.equal(TENANT_ROUTING_ADOPTION_GUARDRAILS.facadeMaterializesNoShardDatabase, true);
  assert.equal(TENANT_ROUTING_ADOPTION_GUARDRAILS.facadeGrantsNoAdditionalConcurrency, true);
  assert.equal(TENANT_ROUTING_ADOPTION_GUARDRAILS.automaticRecovery, false);
});

test('the facade fails closed on incomplete, duplicated, or non-queue provisioning', () => {
  const adoption = adoptTenantRouting({ epoch, shardCount: 2, operatorReceiptSha256: receipt }, now);
  const dir = mkdtempSync(join(tmpdir(), 'xiv-trq-missing-'));
  const one = new Map<number, OfflineStoryQueue>();
  const extra = new Map<number, OfflineStoryQueue>();
  try {
    // One queue provided where two are planned: construction must refuse before anything opens.
    one.set(0, new OfflineStoryQueue(join(dir, 'shard-0.sqlite'), () => now));
    assert.throws(() => new TenantRoutedQueue({ adoption, shardQueues: one }), /shard 1 has no provisioned queue/);
    // An extra queue outside the adopted plan is also fail closed.
    extra.set(0, new OfflineStoryQueue(join(dir, 's0.sqlite'), () => now));
    extra.set(1, new OfflineStoryQueue(join(dir, 's1.sqlite'), () => now));
    extra.set(2, new OfflineStoryQueue(join(dir, 's2.sqlite'), () => now));
    assert.throws(() => new TenantRoutedQueue({ adoption, shardQueues: extra }), /does not match the adopted shard count/);
    // A duplicated queue instance silently collapses per-shard singleton leases: fail closed.
    const dup = new Map<number, OfflineStoryQueue>(extra);
    dup.delete(2); dup.set(1, extra.get(0)!);
    assert.throws(() => new TenantRoutedQueue({ adoption, shardQueues: dup }), /distinct instances/);
    // A non-OfflineStoryQueue shard entry is fail closed at runtime, not just typecheck.
    const fake = new Map<number, OfflineStoryQueue>() as unknown as Map<number, OfflineStoryQueue>;
    fake.set(0, { page: () => [] } as unknown as OfflineStoryQueue);
    fake.set(1, extra.get(1)!);
    assert.throws(() => new TenantRoutedQueue({ adoption, shardQueues: fake }), /not an OfflineStoryQueue/);
    // A missing shard-queue map entirely.
    assert.throws(() => new TenantRoutedQueue({ adoption, shardQueues: null as never }), /shard queue map required/);
    // Routing without adoption is never operative.
    assert.throws(() => new TenantRoutedQueue({ adoption: { ...adoption, kind: 'OTHER' as never } as never, shardQueues: extra }), /adopted routing record is required/);
  } finally { closeQueues(one); closeQueues(extra); rmSync(dir, { recursive: true, force: true }); }
});

test('onboarding is per-call receipt-gated, deterministic, and ceiling-bounded', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-trq-onboard-'));
  let first: ReturnType<typeof fixture> | null = null;
  let second: ReturnType<typeof fixture> | null = null;
  try {
    first = fixture(dir);
    const secondDir = join(dir, 'second');
    mkdirSync(secondDir);
    second = fixture(secondDir);
    const routed = first.routed;
    // Two independent facades over the same receipt route identically — the contract, not the facade, decides.
    const a = routed.onboardTenant('tenant-alpha', 1000, receipt);
    const b = second.routed.onboardTenant('tenant-alpha', 1000, receipt);
    assert.equal(a.shardId, b.shardId);
    assert.equal(a.humanDecision, 'REQUIRED');
    assert.equal(a.realTenantsOnboarded, 0);
    assert.equal(a.onboardingIsSyntheticFixtureOnly, true);
    // Wrong or missing receipt fails closed, before any routing state changes.
    assert.throws(() => routed.onboardTenant('tenant-beta', 1000, 'b'.repeat(64)), /receipt does not match/);
    assert.throws(() => routed.onboardTenant('tenant-beta', 1000, ''));
    // Double onboarding fails closed.
    assert.throws(() => routed.onboardTenant('tenant-alpha', 1000, receipt), /already routed/);
    // The contract itself rejects a non-positive per-tenant budget (routing stays contract-owned).
    assert.throws(() => routed.onboardTenant('tenant-zero', 0, receipt), /row budget/);
    // The facade's aggregate per-shard ceiling is distinct from the contract's per-tenant
    // budget: fill one shard's projection with a big tenant, then onboard a second tenant
    // onto the SAME shard (deterministically found) whose budget pushes the sum past 2,000,000.
    const big = routed.onboardTenant('tenant-big', 1_900_000, receipt);
    let sameShard = '';
    for (let i = 0; i < 1000 && !sameShard; i++) {
      const candidate = `tenant-same-${i}`;
      if (tenantHash(candidate) % 2 === big.shardId) sameShard = candidate;
    }
    assert.ok(sameShard);
    assert.throws(() => routed.onboardTenant(sameShard, 200_000, receipt), /measured 2,000,000-row ceiling/);
    // A modest tenant on the other shard still onboards, at its CONTRACT-determined
    // preferred shard (both shards have room, so placement is the pure hash placement).
    const filled = routed.onboardTenant('tenant-extra', 1, receipt);
    assert.equal(filled.shardId, tenantHash('tenant-extra') % 2);
    // Unknown-tenant enqueue fails closed before onboarding.
    assert.throws(() => routed.enqueue([story('s1', 'tenant-never-routed')]), /tenant not routed/);
  } finally { closeQueues(first?.queues); closeQueues(second?.queues); rmSync(dir, { recursive: true, force: true }); }
});

test('real routing end to end: enqueue, claim, renew, settle across provisioned shard queues', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-trq-endtoend-'));
  let queues: Map<number, OfflineStoryQueue> | null = null;
  let routed: TenantRoutedQueue;
  try {
    ({ routed, queues } = fixture(dir) as { routed: TenantRoutedQueue; queues: Map<number, OfflineStoryQueue> });
    const pa = routed.onboardTenant('tenant-a', 10_000, receipt);
    // Pick a second tenant whose preferred shard differs from tenant-a's, deterministically.
    const otherShard = pa.shardId === 0 ? 1 : 0;
    let tenantB = '';
    for (let i = 0; i < 1000 && !tenantB; i++) {
      const candidate = `tenant-b-${i}`;
      if (tenantHash(candidate) % 2 === otherShard) tenantB = candidate;
    }
    assert.ok(tenantB, 'deterministic fixture: a second tenant on the other shard must exist');
    const pb = routed.onboardTenant(tenantB, 10_000, receipt);
    assert.equal(pb.shardId, otherShard);
    const enq = routed.enqueue([story('story-a1', 'tenant-a'), story('story-b1', tenantB)]);
    assert.equal(enq.kind, 'TENANT_ROUTED_ENQUEUE');
    assert.equal(enq.inserted, 2);
    assert.equal(enq.duplicates, 0);
    assert.equal(enq.shardsTouched, 2, 'the two tenants route to distinct shards in this fixture');
    assert.equal(enq.humanDecision, 'REQUIRED');
    assert.equal(enq.learningPromoted, false);
    assert.equal(enq.modelCalls, 0);
    assert.equal(enq.remoteCalls, 0);
    assert.equal(enq.realTenantsOnboarded, 0);
    assert.equal(enq.billionUsersProven, false);
    assert.equal(enq.automaticRecovery, false);
    // Cross-shard enqueue is NOT atomic: a story that fails validation on the HIGHER
    // shard leaves the lower shard's insert durably committed, and the error must say so.
    const hiShard = Math.max(pa.shardId, pb.shardId);
    const loShard = Math.min(pa.shardId, pb.shardId);
    const loTenant = pa.shardId === hiShard ? tenantB : 'tenant-a';
    const hiTenant = pa.shardId === hiShard ? 'tenant-a' : tenantB;
    const broken = { ...story('story-broken', hiTenant), objective: 'x'.repeat(3001) } as OfflineStory;
    assert.throws(
      () => routed.enqueue([story('story-ok', loTenant), broken]),
      /tenant-routed enqueue failed on shard \d+.*earlier shards \d+ already committed durably \(1 inserted, 0 duplicates\)/,
      'partial cross-shard failure is never silent — the committed shards are named',
    );
    assert.equal(queues.get(loShard)!.page(loTenant).some((r) => String(r.id) === 'story-ok'), true, 'the committed story is durably present');
    // Recovery path: unchanged content retries idempotently and the broken story is dropped.
    const retry = routed.enqueue([story('story-ok', loTenant)]);
    assert.equal(retry.inserted, 0);
    assert.equal(retry.duplicates, 1);
    // Each shard queue holds exactly its tenant's story — the facade did not cross-write.
    assert.equal(queues.get(pa.shardId)!.page('tenant-a').some((r) => String(r.id) === 'story-a1'), true);
    assert.equal(queues.get(pb.shardId)!.page(tenantB).some((r) => String(r.id) === 'story-b1'), true);
    assert.equal(queues.get(pa.shardId)!.page(tenantB).some((r) => String(r.id) === 'story-b1'), false);
    // Claiming tenant-a's story leases ONLY its shard; the other shard stays claimable.
    const leaseA = routed.claimNext('tenant-a', 'node_backend', 'synthetic-worker');
    assert.ok(leaseA);
    assert.equal(leaseA.tenantId, 'tenant-a');
    assert.equal(leaseA.storyId, 'story-a1');
    const leaseB = routed.claimNext(tenantB, 'node_backend', 'synthetic-worker');
    assert.ok(leaseB, 'a lease on shard A never blocks shard B — per-shard singleton leases');
    // Renewal and settlement forward to the owning shard and honor its policy.
    const renewed = routed.renewLease(leaseA, 60_000);
    assert.equal(renewed.lease.token, leaseA.token);
    routed.settle(leaseA, { outcome: 'DRAFT', outputHash: 'd'.repeat(64), providerSettled: true });
    const state = queues.get(pa.shardId)!.inspectStory('tenant-a', 'story-a1');
    assert.equal(state!.state, 'AWAITING_REVIEW', 'settlement routes to the owning shard with the same review hold');
    // An unknown tenant claim fails closed.
    assert.throws(() => routed.claimNext('tenant-ghost', 'node_backend', 'synthetic-worker'), /tenant not routed/);
  } finally { closeQueues(queues ?? undefined); rmSync(dir, { recursive: true, force: true }); }
});

test('the routing report is a pure 12D-109 projection with honest scale flags', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-trq-report-'));
  let queues: Map<number, OfflineStoryQueue> | null = null;
  let routed: TenantRoutedQueue;
  try {
    ({ routed, queues } = fixture(dir) as { routed: TenantRoutedQueue; queues: Map<number, OfflineStoryQueue> });
    routed.onboardTenant('tenant-r1', 5_000, receipt);
    routed.onboardTenant('tenant-r2', 5_000, receipt);
    const report = routed.routingReport(now + 1);
    assert.equal(report.kind, 'QUEUE_SHARD_PLACEMENT_PLAN');
    assert.equal(Object.isFrozen(report), true);
    assert.equal(report.epoch, epoch);
    assert.equal(report.totals.tenants, 2);
    for (const shard of report.shards) {
      assert.ok(shard.projectedRows <= PARTITION_POLICY.maxRowsPerShard, 'projection never passes the measured ceiling');
    }
    assert.equal(report.syntheticTenantsRouted, 2);
    assert.equal(report.realTenantsOnboarded, 0);
    assert.equal(report.humanDecision, 'REQUIRED');
    assert.equal(report.learningPromoted, false);
    assert.equal(report.billionUsersProven, false);
    assert.equal(report.modelCalls, 0);
    assert.equal(report.remoteCalls, 0);
    assert.throws(() => routed.routingReport(-1), /report timestamp required/);
  } finally { closeQueues(queues ?? undefined); rmSync(dir, { recursive: true, force: true }); }
});
test('a routing assignment that would create a new shard fails closed: this facade provisions no database', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-trq-newshard-'));
  let queues: Map<number, OfflineStoryQueue> | null = null;
  let routed: TenantRoutedQueue;
  try {
    ({ routed, queues } = fixture(dir) as { routed: TenantRoutedQueue; queues: Map<number, OfflineStoryQueue> });
    // Exactly 2 x maxTenantsPerShard = 500 onboards fill both shards; the 501st forces a
    // NEW shard in the contract, and the facade refuses rather than strand a tenant on a
    // database it never provisioned.
    let onboarded = 0;
    for (let i = 0; i < 500; i++) { routed.onboardTenant(`tenant-cap-${i}`, 1, receipt); onboarded += 1; }
    assert.equal(onboarded, 500);
    assert.throws(() => routed.onboardTenant('tenant-cap-500', 1, receipt), /routing requires a new shard/);
  } finally { closeQueues(queues ?? undefined); rmSync(dir, { recursive: true, force: true }); }
});

test('enqueue batch boundaries fail closed before any shard is touched', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-trq-batch-'));
  let queues: Map<number, OfflineStoryQueue> | null = null;
  let routed: TenantRoutedQueue;
  try {
    ({ routed, queues } = fixture(dir) as { routed: TenantRoutedQueue; queues: Map<number, OfflineStoryQueue> });
    routed.onboardTenant('tenant-x', 1000, receipt);
    for (const bad of [null, undefined, [], 'nope', Array.from({ length: 1001 }, () => story('s', 'tenant-x'))])
      assert.throws(() => routed.enqueue(bad as never), /invalid enqueue batch/);
  } finally { closeQueues(queues ?? undefined); rmSync(dir, { recursive: true, force: true }); }
});

test('re-enqueueing unchanged content is accounted as a duplicate, and returnUnstarted returns the story to READY', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-trq-dup-'));
  let queues: Map<number, OfflineStoryQueue> | null = null;
  let routed: TenantRoutedQueue;
  try {
    ({ routed, queues } = fixture(dir) as { routed: TenantRoutedQueue; queues: Map<number, OfflineStoryQueue> });
    routed.onboardTenant('tenant-d', 1000, receipt);
    const first = routed.enqueue([story('story-d1', 'tenant-d')]);
    assert.equal(first.inserted, 1);
    const second = routed.enqueue([story('story-d1', 'tenant-d')]);
    assert.equal(second.inserted, 0);
    assert.equal(second.duplicates, 1, 'unchanged content re-enqueue is a duplicate, not a silent no-op');
    const lease = routed.claimNext('tenant-d', 'node_backend', 'synthetic-worker');
    assert.ok(lease);
    routed.returnUnstarted(lease);
    assert.equal(queues!.get(0)!.page('tenant-d').some(() => true), true);
    const state = queues!.get(0)!.inspectStory('tenant-d', 'story-d1') ?? queues!.get(1)!.inspectStory('tenant-d', 'story-d1');
    assert.equal(state!.state, 'READY', 'returnUnstarted routed to the owning shard and the story is claimable again');
  } finally { closeQueues(queues ?? undefined); rmSync(dir, { recursive: true, force: true }); }
});
