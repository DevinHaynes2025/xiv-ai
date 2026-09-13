import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  EVENT_PLANE_POLICY, EVENT_PLANE_GUARDRAILS,
  planEventPlane, assertEventPlaneInvariants, adoptEventPlanePlan,
  type DistributedEventPlanePlan,
} from './event-plane-contract';
import { planRegionalCells, REGIONAL_CELL_GUARDRAILS } from './regional-cell-contract';
import { PARTITION_POLICY, type QueueRouting } from './queue-partition-contract';

const EPOCH = 'local-sqlite-pilot-2026-09';

const mkRouting = (
  shardCount: number,
  assigns: Array<[string, number]>,
  budgets: Record<string, number>,
): QueueRouting => Object.freeze({
  epoch: EPOCH,
  shardCount,
  assignments: Object.freeze(assigns.map(([tenantId, shardId]) => Object.freeze({ tenantId, shardId }))),
  tenantRowBudgets: Object.freeze(budgets),
});

const routing = mkRouting(4,
  [['tenant-a', 0], ['tenant-b', 0], ['tenant-c', 1], ['tenant-d', 3]],
  { 'tenant-a': 600_000, 'tenant-b': 400_000, 'tenant-c': 250_000, 'tenant-d': 750_000 });

test('policy and guardrails are frozen and honest', () => {
  assert.equal(Object.isFrozen(EVENT_PLANE_POLICY), true);
  assert.equal(Object.isFrozen(EVENT_PLANE_GUARDRAILS), true);
  assert.equal(EVENT_PLANE_POLICY.targetReplicationFactor, 2);
  assert.equal(EVENT_PLANE_POLICY.minCellsForReplication, 2);
  assert.equal(EVENT_PLANE_POLICY.perDatabaseMeasuredRowCeiling, PARTITION_POLICY.maxRowsPerShard,
    'the ONLY measured ceiling is the proven per-database one');
  assert.equal(EVENT_PLANE_GUARDRAILS.materializesNoInfrastructure, true);
  assert.equal(EVENT_PLANE_GUARDRAILS.advisoryUntilOperatorAdoption, true);
  assert.equal(EVENT_PLANE_GUARDRAILS.singleCellCannotReplicate, true);
  assert.equal(EVENT_PLANE_GUARDRAILS.noMeasuredReplicationEvidence, true);
  assert.equal(EVENT_PLANE_GUARDRAILS.automaticRecovery, false);
  assert.equal(EVENT_PLANE_GUARDRAILS.humanDecision, 'REQUIRED');
});

test('the plane plan derives primary and replica cells deterministically; a multi-cell plane replicates across distinct cells', () => {
  const cellPlan = planRegionalCells(routing, 2); // cell-0 = shards [0,2], cell-1 = shards [1,3]
  const plane = planEventPlane(routing, cellPlan);
  assert.equal(plane.kind, 'DISTRIBUTED_EVENT_PLANE_PLAN');
  assert.equal(plane.replicationDegraded, false);
  assert.equal(plane.streams.length, 4);
  assert.deepEqual(plane.streams.map((s) => [s.shardId, s.primaryCellId, s.replicaCellId]), [
    [0, 'cell-0', 'cell-1'],
    [1, 'cell-1', 'cell-0'],
    [2, 'cell-0', 'cell-1'],
    [3, 'cell-1', 'cell-0'],
  ]);
  assert.deepEqual(plane.streams.map((s) => s.projectedEventRows), [1_000_000, 250_000, 0, 750_000]);
  assert.equal(plane.totals.tenants, 4);
  assert.equal(plane.totals.projectedEventRows, 2_000_000);
  assert.equal(plane.humanDecision, 'REQUIRED');
  assert.equal(plane.learningPromoted, false);
  assert.equal(plane.modelCalls, 0);
  assert.equal(plane.remoteCalls, 0);
  assert.equal(plane.realEventStreamsProvisioned, 0);
  assert.equal(plane.realCellsProvisioned, 0);
  assert.equal(plane.billionUsersProven, false);
  assert.equal(plane.automaticRecovery, false);
  assert.ok(plane.assumptions.some((a) => /2,?000,000 rows per database|2000000 rows per database/.test(a)),
    'the measured ceiling is stated as the only measured number');
  assert.doesNotThrow(() => assertEventPlaneInvariants(plane));
});

test('a single-cell plane degrades honestly to one copy instead of fabricating a co-located replica', () => {
  const cellPlan = planRegionalCells(routing, 1);
  const plane = planEventPlane(routing, cellPlan);
  assert.equal(plane.replicationDegraded, true);
  for (const s of plane.streams) {
    assert.equal(s.replicaCellId, null, `shard ${s.shardId} honestly carries no replica`);
    assert.equal(s.primaryCellId, 'cell-0');
  }
  assert.doesNotThrow(() => assertEventPlaneInvariants(plane));
});

test('the plane fails closed on inconsistent or invalid inputs', () => {
  const cellPlan = planRegionalCells(routing, 2);
  // Unknown epoch.
  assert.throws(() => planEventPlane({ ...routing, epoch: 'no-such-epoch' }, cellPlan), /epoch/);
  // Duplicate tenant (12D-109's own validator).
  assert.throws(() => planEventPlane(mkRouting(2, [['t', 0], ['t', 1]], { t: 10 }), planRegionalCells(mkRouting(2, [['t', 0]], { t: 10 }), 2)), /duplicate tenant/);
  // Cell plan built from a DIFFERENT routing (shard count mismatch).
  const otherPlan = planRegionalCells(mkRouting(3, [['x', 0]], { x: 5 }), 2);
  assert.throws(() => planEventPlane(routing, otherPlan), /shard count does not match/);
  // Cell plan whose row projections were forged (totals kept internally consistent).
  const forgedCells = cellPlan.cells.map((c) => c.cellId === 'cell-0'
    ? Object.freeze({ ...c, projectedRows: c.projectedRows + 7 })
    : c);
  const forgedTotals = forgedCells.reduce((a, c) => a + c.projectedRows, 0);
  const forged = Object.freeze({
    ...cellPlan,
    cells: Object.freeze(forgedCells),
    totals: Object.freeze({ ...cellPlan.totals, projectedRows: forgedTotals }),
  });
  assert.throws(() => planEventPlane(routing, forged), /does not re-derive from the routing/);
  // A missing or invalid tenant row budget fails closed (never silently zero).
  assert.throws(() => planEventPlane(mkRouting(2, [['t', 0]], {}), planRegionalCells(mkRouting(2, [['t', 0]], { t: 10 }), 1)), /tenant row budget/);
  for (const bad of [0, -1, 0.5, PARTITION_POLICY.maxRowBudgetPerTenant + 1])
    assert.throws(() => planEventPlane(mkRouting(1, [['t', 0]], { t: bad }), planRegionalCells(mkRouting(1, [['t', 0]], { t: 1 }), 1)), /tenant row budget/);
  // A forged-consistent packet pair cannot route a database past the measured ceiling.
  const overCeiling = mkRouting(1, [['big1', 0], ['big2', 0]], { big1: 1_500_000, big2: 1_000_000 });
  const handBuiltPlan = Object.freeze({
    kind: 'REGIONAL_CELL_PLACEMENT_PLAN' as const,
    epoch: EPOCH,
    cellCount: 1,
    shardCount: 1,
    cells: Object.freeze([Object.freeze({ cellId: 'cell-0', shardIds: Object.freeze([0]), tenantCount: 2, projectedRows: 2_500_000 })]),
    totals: Object.freeze({ tenants: 2, projectedRows: 2_500_000 }),
    assumptions: Object.freeze(['a']),
    guardrails: REGIONAL_CELL_GUARDRAILS,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    realTenantsOnboarded: 0 as const,
    realCellsProvisioned: 0 as const,
    billionUsersProven: false as const,
    automaticRecovery: false as const,
  });
  assert.throws(() => planEventPlane(overCeiling, handBuiltPlan), /proven 2000000-row ceiling/);
  // The declared cell count is RE-DERIVED, never trusted (adversarial-review finding):
  // a sparse topology where the routing populates fewer cells than the cell plan
  // declares would otherwise hand replicas to cells no validated packet describes.
  const oneShard = mkRouting(1, [['t', 0]], { t: 10 });
  const sparsePlan2 = planRegionalCells(oneShard, 2); // legal: declares 2 cells, populates 1
  assert.equal(sparsePlan2.cellCount, 2);
  assert.throws(() => planEventPlane(oneShard, sparsePlan2), /the routing populates 1/);
  const sparsePlan16 = planRegionalCells(oneShard, 16);
  assert.throws(() => planEventPlane(oneShard, sparsePlan16), /the routing populates 1/);
});

test('adoption is receipt-gated and materializes nothing', () => {
  const plane = planEventPlane(routing, planRegionalCells(routing, 2));
  assert.throws(() => adoptEventPlanePlan(plane, { operatorReceiptSha256: '', adoptedBy: 'ceo', adoptedAtMs: 1 }), /operator receipt/);
  assert.throws(() => adoptEventPlanePlan(plane, { operatorReceiptSha256: 'zz', adoptedBy: 'ceo', adoptedAtMs: 1 }), /operator receipt/);
  // A non-positive or nonsense adoption timestamp fails closed (12D-119's nowMs > 0 rule).
  assert.throws(() => adoptEventPlanePlan(plane, { operatorReceiptSha256: 'a'.repeat(64), adoptedBy: 'ceo', adoptedAtMs: 0 }), /adoption timestamp/);
  assert.throws(() => adoptEventPlanePlan(plane, { operatorReceiptSha256: 'a'.repeat(64), adoptedBy: 'ceo', adoptedAtMs: -5 }), /adoption timestamp/);
  const record = adoptEventPlanePlan(plane, { operatorReceiptSha256: 'a'.repeat(64), adoptedBy: 'ceo', adoptedAtMs: 1 });
  assert.equal(record.kind, 'EVENT_PLANE_ADOPTION_RECORD');
  assert.equal(record.materializedByThisRuntime, false, 'adoption is a decision record, never provisioning');
  assert.equal(record.productionProvisioningAllowed, false);
  assert.equal(record.infrastructureProvisionedByThisRuntime, 0);
  assert.equal(record.billionUsersProven, false);
  assert.equal(record.operatorReceiptSha256, 'a'.repeat(64));
  // An adoption attempt against a tampered plan fails closed first.
  const tampered = { ...plane, replicationDegraded: true } as unknown as DistributedEventPlanePlan;
  assert.throws(() => adoptEventPlanePlan(Object.freeze(tampered), { operatorReceiptSha256: 'a'.repeat(64), adoptedBy: 'ceo', adoptedAtMs: 1 }), /replicationDegraded/);
});

test('the invariant check is tamper-evident: forged placement, coverage, flags and guardrails all fail closed', () => {
  const plane = planEventPlane(routing, planRegionalCells(routing, 2));
  const mutate = (fn: (p: {
    replicationDegraded: boolean;
    streams: Array<{ shardId: number; primaryCellId: string; replicaCellId: string | null; projectedEventRows: number }>;
    totals: { tenants: number; projectedEventRows: number };
    humanDecision: string; modelCalls: number;
  }) => void): DistributedEventPlanePlan => {
    const c = { ...plane, streams: [...plane.streams], totals: { ...plane.totals } } as unknown as {
      replicationDegraded: boolean;
      streams: Array<{ shardId: number; primaryCellId: string; replicaCellId: string | null; projectedEventRows: number }>;
      totals: { tenants: number; projectedEventRows: number };
      humanDecision: string; modelCalls: number;
    };
    fn(c);
    return Object.freeze(c) as unknown as DistributedEventPlanePlan;
  };
  // A co-located replica (re-labeled to the primary's cell) is caught by the
  // deterministic-placement check — for cellCount >= 2 the rule can never produce one.
  assert.throws(() => assertEventPlaneInvariants(mutate((p) => {
    p.streams[0] = { ...p.streams[0]!, replicaCellId: 'cell-0' };
  })), /deterministic \(shardId \+ 1\)/);
  // A replica that is not the deterministic (shardId + 1) % cellCount placement.
  assert.throws(() => assertEventPlaneInvariants(mutate((p) => {
    p.streams[1] = { ...p.streams[1]!, replicaCellId: 'cell-1' };
  })), /deterministic \(shardId \+ 1\)/);
  // A fabricated replica on a "degraded" single-cell plane.
  const single = planEventPlane(routing, planRegionalCells(routing, 1));
  const singleMutated = Object.freeze({
    ...single,
    streams: Object.freeze(single.streams.map((s, i) => i === 0
      ? Object.freeze({ ...s, replicaCellId: 'cell-0' }) : s)),
  }) as unknown as DistributedEventPlanePlan;
  assert.throws(() => assertEventPlaneInvariants(singleMutated), /fabricated copy/);
  // Flipped degradation flag.
  assert.throws(() => assertEventPlaneInvariants(mutate((p) => { p.replicationDegraded = true; })), /replicationDegraded flag is inconsistent/);
  // Missing stream coverage.
  assert.throws(() => assertEventPlaneInvariants(mutate((p) => { p.streams.splice(2, 1); })), /incomplete plan|does not match the shard count/);
  // Row projection past the measured ceiling (totals kept summing).
  assert.throws(() => assertEventPlaneInvariants(mutate((p) => {
    p.streams[0] = { ...p.streams[0]!, projectedEventRows: EVENT_PLANE_POLICY.perDatabaseMeasuredRowCeiling + 1 };
    p.totals.projectedEventRows += 1;
  })), /proven 2000000-row ceiling/);
  // Gutted governance flags.
  assert.throws(() => assertEventPlaneInvariants(mutate((p) => { p.humanDecision = 'AUTOMATIC'; })), /honest governance flags/);
  assert.throws(() => assertEventPlaneInvariants(mutate((p) => { p.modelCalls = 3; })), /honest governance flags/);
  // Fabricated guardrails.
  assert.throws(() => assertEventPlaneInvariants(Object.freeze({
    ...plane, guardrails: Object.freeze({ ...EVENT_PLANE_GUARDRAILS }),
  } as unknown as DistributedEventPlanePlan)), /frozen EVENT_PLANE_GUARDRAILS/);
});