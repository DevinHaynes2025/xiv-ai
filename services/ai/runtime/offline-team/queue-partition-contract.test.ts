import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  PARTITION_POLICY, PARTITION_GUARDRAILS, initialRouting, tenantHash,
  assignTenantToShard, planShardPlacement, evaluateRouting,
  type QueueRouting, type TenantGrowthEvent,
} from './queue-partition-contract';

const EPOCH = 'local-sqlite-pilot-2026-09';
const build = (tenantIds: readonly string[], shardCount = 4, budget = 1_000): QueueRouting => {
  let routing = initialRouting(EPOCH, shardCount);
  for (const t of tenantIds) routing = assignTenantToShard(routing, t, budget).routing;
  return routing;
};

test('routing is deterministic: same tenant, same shard across calls and independent rebuilds', () => {
  const a = build(['tenant-alpha', 'tenant-beta', 'tenant-gamma']);
  const b = build(['tenant-alpha', 'tenant-beta', 'tenant-gamma']);
  assert.deepEqual(a.assignments, b.assignments);
  assert.deepEqual(planShardPlacement(a), planShardPlacement(b));
  // Repeat calls for an already-assigned tenant return the same shard, never re-route.
  const again = assignTenantToShard(a, 'tenant-alpha', 1_000);
  assert.equal(again.shardId, a.assignments[0].shardId);
  assert.equal(again.routing, a);
  // The pure hash itself is process-independent: identical value on a fresh call sequence.
  assert.equal(tenantHash('tenant-alpha'), tenantHash('tenant-alpha'));
  assert.notEqual(tenantHash('tenant-alpha'), tenantHash('tenant-beta'));
});

test('overflow respects maxTenantsPerShard and creates the lowest new shard id', () => {
  let routing = initialRouting(EPOCH, 1);
  const ids = Array.from({ length: PARTITION_POLICY.maxTenantsPerShard + 10 }, (_, i) => `tenant-${String(i).padStart(4, '0')}`);
  for (const t of ids) routing = assignTenantToShard(routing, t, 10).routing;
  const plan = planShardPlacement(routing);
  assert.equal(routing.shardCount, 2);
  assert.equal(plan.shards[0].tenantCount, PARTITION_POLICY.maxTenantsPerShard);
  assert.equal(plan.shards[1].tenantCount, 10);
  for (const a of routing.assignments.slice(0, PARTITION_POLICY.maxTenantsPerShard)) assert.equal(a.shardId, 0);
  for (const a of routing.assignments.slice(PARTITION_POLICY.maxTenantsPerShard)) assert.equal(a.shardId, 1);
});

test('no shard plan projects past the proven 2,000,000-row ceiling; over-ceiling plans fail closed', () => {
  const routing = build(['tenant-a', 'tenant-b', 'tenant-c'], 2, 900_000);
  const plan = planShardPlacement(routing);
  assert.equal(PARTITION_POLICY.maxRowsPerShard, 2_000_000); // = OFFLINE_QUEUE_POLICY.maxRows
  for (const s of plan.shards) {
    assert.ok(s.projectedRows <= PARTITION_POLICY.maxRowsPerShard);
    assert.ok(s.tenantCount <= PARTITION_POLICY.maxTenantsPerShard);
  }
  assert.equal(plan.totals.projectedRows, 2_700_000);
  // Two tenants whose budgets sum past the ceiling can never share one shard's projection.
  const hot = build(['tenant-hot-1', 'tenant-hot-2'], 1, 1_500_000);
  assert.equal(hot.assignments[0].shardId, hot.assignments[1].shardId);
  assert.throws(() => planShardPlacement(hot), /proven 2000000-row ceiling/);
  assert.throws(() => assignTenantToShard(initialRouting(EPOCH, 1), 'tenant-x', 2_000_001), /row budget/);
  assert.throws(() => assignTenantToShard(initialRouting(EPOCH, 1), 'tenant-x', 0), /row budget/);
});

test('unknown epochs and garbage tenant identities fail closed', () => {
  assert.throws(() => initialRouting('bogus-future-epoch', 4), /unknown routing epoch/);
  const forged = { epoch: 'bogus-future-epoch', shardCount: 4, assignments: [], tenantRowBudgets: {} } as unknown as QueueRouting;
  assert.throws(() => assignTenantToShard(forged, 'tenant-a', 100), /unknown routing epoch/);
  assert.throws(() => planShardPlacement(forged), /unknown routing epoch/);
  const routing = initialRouting(EPOCH, 4);
  for (const bad of ['', 'bad id', 'tenant; DROP', 42, null, 'x'.repeat(PARTITION_POLICY.maxTenantIdChars + 1)])
    assert.throws(() => assignTenantToShard(routing, bad as never, 100), /invalid tenant identity/);
  assert.throws(() => evaluateRouting(routing, [{ kind: 'TENANT_ONBOARD', tenantId: 'bad id!', rowBudget: 10 }]), /invalid tenant identity/);
  assert.throws(() => initialRouting(EPOCH, 0), /shard count/);
  assert.throws(() => initialRouting(EPOCH, PARTITION_POLICY.maxShards + 1), /shard count/);
});

test('policy and guardrails are frozen and state the honest posture', () => {
  assert.ok(Object.isFrozen(PARTITION_POLICY));
  assert.ok(Object.isFrozen(PARTITION_GUARDRAILS));
  assert.ok(Object.isFrozen(PARTITION_POLICY.routingEpochs));
  assert.throws(() => { (PARTITION_POLICY as Record<string, unknown>).maxRowsPerShard = 9_999_999; }, TypeError);
  assert.throws(() => { (PARTITION_GUARDRAILS as Record<string, unknown>).billionUsersProven = true; }, TypeError);
  assert.equal(PARTITION_GUARDRAILS.materializesNoDatabase, true);
  assert.equal(PARTITION_GUARDRAILS.remoteCallsAllowed, false);
  assert.equal(PARTITION_GUARDRAILS.routingIsAdvisoryUntilAdopted, true);
  assert.equal(PARTITION_GUARDRAILS.countsSimulatedTenantsAsReal, false);
  assert.equal(PARTITION_GUARDRAILS.billionUsersProven, false);
  assert.equal(PARTITION_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(PARTITION_GUARDRAILS.learningPromoted, false);
});

test('plans are sparse logical projections with zero real tenants', () => {
  const plan = planShardPlacement(build(['tenant-a', 'tenant-b'], 2, 1_000));
  assert.equal(plan.kind, 'QUEUE_SHARD_PLACEMENT_PLAN');
  assert.equal(plan.realTenantsOnboarded, 0);
  assert.equal(plan.humanDecision, 'REQUIRED');
  assert.equal(plan.learningPromoted, false);
  assert.equal(plan.modelCalls, 0);
  assert.equal(plan.remoteCalls, 0);
  assert.equal(plan.billionUsersProven, false);
  assert.ok(Object.isFrozen(plan));
  const text = plan.assumptions.join(' ');
  assert.match(text, /zero real tenants/);
  assert.match(text, /no database was read or written/);
  assert.match(text, /routing is advisory until a queue adapter adopts it/);
  assert.match(text, /billion-user readiness is NOT proven/);
  assert.equal(plan.assumptions.some(a => a.includes(`${PARTITION_POLICY.maxRowsPerShard} rows, the proven single-database`)), true);
});

test('evaluateRouting folds simulated growth events deterministically, bounded, and still pure', () => {
  const events: TenantGrowthEvent[] = [
    { kind: 'TENANT_ONBOARD', tenantId: 'tenant-a', rowBudget: 100 },
    { kind: 'TENANT_ONBOARD', tenantId: 'tenant-b', rowBudget: 200 },
    { kind: 'TENANT_GROWTH', tenantId: 'tenant-a', additionalRows: 50 },
  ];
  const start = initialRouting(EPOCH, 2);
  const e1 = evaluateRouting(start, events);
  const e2 = evaluateRouting(initialRouting(EPOCH, 2), [...events]);
  assert.deepEqual(e1.plan, e2.plan);
  assert.equal(e1.eventsApplied, 3);
  assert.equal(e1.simulatedTenants, 2);
  const grown = e1.plan.shards.find(s => s.projectedRows === 150 && s.tenantCount === 1);
  assert.ok(grown); // tenant-a: 100 + 50, wherever FNV-1a placed it
  assert.equal(e1.plan.totals.projectedRows, 350);
  assert.equal(e1.realTenantsOnboarded, 0);
  assert.equal(e1.humanDecision, 'REQUIRED');
  assert.equal(e1.modelCalls, 0);
  assert.equal(e1.remoteCalls, 0);
  // Fail closed: duplicates, growth for unknown tenants, budget-cap breaches, unbounded batches.
  assert.throws(() => evaluateRouting(start, [{ kind: 'TENANT_ONBOARD', tenantId: 'tenant-a', rowBudget: 1 },
    { kind: 'TENANT_ONBOARD', tenantId: 'tenant-a', rowBudget: 1 }]), /duplicates fail closed/);
  assert.throws(() => evaluateRouting(start, [{ kind: 'TENANT_GROWTH', tenantId: 'tenant-z', additionalRows: 1 }]), /unassigned simulated tenant/);
  assert.throws(() => evaluateRouting(start, [{ kind: 'TENANT_ONBOARD', tenantId: 'tenant-c', rowBudget: 1 },
    { kind: 'TENANT_GROWTH', tenantId: 'tenant-c', additionalRows: PARTITION_POLICY.maxRowBudgetPerTenant }]), /per-tenant row budget cap/);
  assert.throws(() => evaluateRouting(start, [{ kind: 'TENANT_MERGE' } as never]), /unknown simulated event kind/);
  assert.throws(() => evaluateRouting(start, Array.from({ length: PARTITION_POLICY.maxSimulatedEvents + 1 },
    () => ({ kind: 'TENANT_GROWTH', tenantId: 'tenant-a', additionalRows: 1 }))), /bounded simulated event list/);
});