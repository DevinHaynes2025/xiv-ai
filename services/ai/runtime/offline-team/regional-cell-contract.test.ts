import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  REGIONAL_CELL_POLICY, REGIONAL_CELL_GUARDRAILS, shardCellId,
  planRegionalCells, assertCellPlanInvariants, type RegionalCellPlacementPlan,
} from './regional-cell-contract';
import { PARTITION_POLICY } from './queue-partition-contract';

const epoch = PARTITION_POLICY.routingEpochs[0]!;

// initialRouting is frozen with empty assignments; tests that need pre-assigned tenants
// build the routing through the frozen contract's own shape (frozen, same fields).
const planRegionalCellsFixRouting = (shardCount: number, assignments: { tenantId: string; shardId: number }[], budgets: Record<string, number>) =>
  Object.freeze({
    epoch,
    shardCount,
    assignments: Object.freeze(assignments.map((a) => Object.freeze({ ...a }))),
    tenantRowBudgets: Object.freeze({ ...budgets }),
  });

test('policy and guardrails are frozen, honest governance data', () => {
  assert.equal(Object.isFrozen(REGIONAL_CELL_POLICY), true);
  assert.equal(Object.isFrozen(REGIONAL_CELL_GUARDRAILS), true);
  assert.equal(REGIONAL_CELL_POLICY.maxCells, 16);
  assert.equal(REGIONAL_CELL_POLICY.maxShardsPerCell, PARTITION_POLICY.maxShards);
  assert.equal(REGIONAL_CELL_POLICY.perDatabaseMeasuredRowCeiling, 2_000_000);
  assert.equal(REGIONAL_CELL_GUARDRAILS.materializesNoInfrastructure, true);
  assert.equal(REGIONAL_CELL_GUARDRAILS.advisoryUntilOperatorAdoption, true);
  assert.equal(REGIONAL_CELL_GUARDRAILS.noMeasuredRegionalEvidence, true);
  assert.equal(REGIONAL_CELL_GUARDRAILS.countsSimulatedCellsAsReal, false);
  assert.equal(REGIONAL_CELL_GUARDRAILS.automaticRecovery, false);
  assert.equal(REGIONAL_CELL_GUARDRAILS.humanDecision, 'REQUIRED');
});

test('cell placement is deterministic shardId % cellCount, re-derivable from policy alone', () => {
  assert.equal(shardCellId(4, 0), 'cell-0');
  assert.equal(shardCellId(4, 5), 'cell-1');
  assert.equal(shardCellId(4, 5), shardCellId(4, 5), 'stable across calls');
  for (const bad of [
    [0, 0] as const, [17, 0] as const, [4, -1] as const, [4, Number.MAX_SAFE_INTEGER] as const,
    // shard ids are bounded by the partition policy's shard ceiling, not by the
    // maxShardsPerCell * maxCells product: no valid routing can contain shard 64+.
    [REGIONAL_CELL_POLICY.maxCells, PARTITION_POLICY.maxShards] as const,
    [REGIONAL_CELL_POLICY.maxCells, 1000] as const,
  ]) assert.throws(() => shardCellId(bad[0], bad[1]));
});

test('the plan covers every shard exactly once with honest flags and zero real claims', () => {
  const routing = planRegionalCellsFixRouting(2, [
    { tenantId: 'tenant-a', shardId: 0 }, { tenantId: 'tenant-b', shardId: 1 },
    { tenantId: 'tenant-c', shardId: 1 },
  ], { 'tenant-a': 5_000, 'tenant-b': 2_500, 'tenant-c': 1_000 });
  const plan = planRegionalCells(routing, 2);
  assert.equal(plan.kind, 'REGIONAL_CELL_PLACEMENT_PLAN');
  assert.equal(Object.isFrozen(plan), true);
  assert.equal(plan.cellCount, 2);
  assert.equal(plan.shardCount, 2);
  assert.equal(plan.cells.length, 2, 'both cells receive shards (0->cell-0, 1->cell-1)');
  const covered = plan.cells.flatMap((c) => c.shardIds).sort((a, b) => a - b);
  assert.deepEqual(covered, [0, 1], 'every shard covered exactly once');
  const cell1 = plan.cells.find((c) => c.cellId === 'cell-1')!;
  assert.equal(cell1.tenantCount, 2);
  assert.equal(cell1.projectedRows, 3_500, 'row projection sums the routing budgets of the cell shards');
  assert.deepEqual(plan.totals, { tenants: 3, projectedRows: 8_500 });
  assert.equal(plan.humanDecision, 'REQUIRED');
  assert.equal(plan.learningPromoted, false);
  assert.equal(plan.modelCalls, 0);
  assert.equal(plan.remoteCalls, 0);
  assert.equal(plan.realTenantsOnboarded, 0);
  assert.equal(plan.realCellsProvisioned, 0);
  assert.equal(plan.billionUsersProven, false);
  assert.equal(plan.automaticRecovery, false);
  assert.ok(plan.assumptions.some((a) => /synthetic fixture tenant/.test(a)));
  assert.ok(plan.assumptions.some((a) => /2,000,000 rows per database/.test(a) && /never measured/.test(a)));
  assert.ok(plan.assumptions.some((a) => /NOT proven/.test(a)));
  assert.doesNotThrow(() => assertCellPlanInvariants(plan));
});

test('placement is deterministic across independent rebuilds and scales across cells', () => {
  const routing = planRegionalCellsFixRouting(8, [], {});
  const a = planRegionalCells(routing, 4);
  const b = planRegionalCells(routing, 4);
  assert.deepEqual(a, b, 'same routing + cell count -> byte-identical plan');
  assert.equal(a.cells.length, 4, 'each cell receives exactly the shards it owns');
  for (const c of a.cells) assert.equal(c.shardIds.length, 2, '8 shards over 4 cells: balanced round-robin');
  const deep = planRegionalCells(planRegionalCellsFixRouting(PARTITION_POLICY.maxShards, [], {}), REGIONAL_CELL_POLICY.maxCells);
  assert.doesNotThrow(() => assertCellPlanInvariants(deep));
  assert.equal(deep.cells.length, REGIONAL_CELL_POLICY.maxCells);
});

test('construction fails closed on unknown epochs, out-of-policy cell counts, and bad routings', () => {
  const routing = planRegionalCellsFixRouting(2, [], {});
  for (const badCellCount of [0, -1, 1.5, REGIONAL_CELL_POLICY.maxCells + 1, Number.MAX_SAFE_INTEGER])
    assert.throws(() => planRegionalCells(routing, badCellCount), /cell count outside policy/);
  assert.throws(() => planRegionalCells({ ...routing, epoch: 'unknown-epoch' }, 2), /unknown routing epoch/);
  assert.throws(() => planRegionalCells({ ...routing, shardCount: 0 }, 2), /shard count outside/);
  assert.throws(() => planRegionalCells({ ...routing, shardCount: PARTITION_POLICY.maxShards + 1 }, 2), /shard count outside/);
  assert.throws(() => planRegionalCells(null as never, 2));
  // Assignment-level routing validation, identical to the 12D-109 contract.
  assert.throws(() => planRegionalCells(planRegionalCellsFixRouting(2, [{ tenantId: 'tenant-ghost', shardId: 70 }], { 'tenant-ghost': 100 }), 2),
    /routing assignment invalid/, 'an assignment whose shardId is outside the routing fails closed, not silently credited');
  assert.throws(() => planRegionalCells(planRegionalCellsFixRouting(2, [
    { tenantId: 'tenant-a', shardId: 0 }, { tenantId: 'tenant-a', shardId: 1 },
  ], { 'tenant-a': 100 }), 2), /duplicate tenant in routing assignments/);
  // Budget validation, identical to the 12D-109 contract: a measured, bounded positive
  // integer — a missing entry fails closed instead of silently projecting zero rows.
  for (const badBudget of [undefined, 0, -500, 0.5, 2_000_001])
    assert.throws(() => planRegionalCells(planRegionalCellsFixRouting(2, [{ tenantId: 'tenant-a', shardId: 0 }],
      badBudget === undefined ? {} : { 'tenant-a': badBudget }), 2), /tenant row budget/);
  // Per-shard (per-database) row sums are bounded by the only measured ceiling.
  assert.throws(() => planRegionalCells(planRegionalCellsFixRouting(2, [
    { tenantId: 'tenant-a', shardId: 0 }, { tenantId: 'tenant-b', shardId: 0 },
  ], { 'tenant-a': 1_500_000, 'tenant-b': 1_000_000 }), 2), /proven 2000000-row ceiling/);
});

test('a multi-shard cell projects past 2,000,000 as a sparse sum over bounded databases — never a measured claim', () => {
  // Each shard's row sum is bounded by the per-database measured ceiling at
  // construction; the CELL projection deliberately has no 2,000,000 cap because a
  // multi-shard cell spans multiple databases. The packet says so in its assumptions.
  const routing = planRegionalCellsFixRouting(2, [
    { tenantId: 'tenant-a', shardId: 0 }, { tenantId: 'tenant-b', shardId: 1 },
  ], { 'tenant-a': 2_000_000, 'tenant-b': 2_000_000 });
  const plan = planRegionalCells(routing, 1);
  assert.equal(plan.cells[0]!.projectedRows, 4_000_000);
  assert.doesNotThrow(() => assertCellPlanInvariants(plan));
  assert.ok(plan.assumptions.some((a) => /2,000,000 rows per database/.test(a)));
});

test('the invariants fail closed against a tampered plan (detection, never repair)', () => {
  const routing = planRegionalCellsFixRouting(2, [{ tenantId: 'tenant-a', shardId: 0 }], { 'tenant-a': 1000 });
  const base = planRegionalCells(routing, 2);
  const clone = (): RegionalCellPlacementPlan => ({
    ...base, cells: base.cells.map((c) => ({ ...c, shardIds: [...c.shardIds] })),
    totals: { ...base.totals },
  });
  // Tampered plans are mutated while unfrozen, then frozen — invariant checks must
  // treat them exactly as they would treat a tampered production packet.
  const tamper = (fn: (p: RegionalCellPlacementPlan) => void): RegionalCellPlacementPlan => {
    const p = clone();
    fn(p as never);
    return Object.freeze(p);
  };
  // A shard goes missing: the second cell vanishes from the plan entirely.
  const withGap = tamper((p) => { (p.cells as { length: number }).length = 1; });
  assert.throws(() => assertCellPlanInvariants(withGap), /not covered by any cell/);
  // The same shard claimed twice.
  const withDup = tamper((p) => { (p.cells[1] as unknown as { shardIds: number[] }).shardIds = [1, 1]; });
  assert.throws(() => assertCellPlanInvariants(withDup), /duplicate shard coverage/);
  // A cell id that does not match its shard placement.
  const withBadCellId = tamper((p) => { (p.cells[1] as unknown as { cellId: string }).cellId = 'cell-9'; });
  assert.throws(() => assertCellPlanInvariants(withBadCellId), /shard 1 is placed in cell-9 against the deterministic/);
  // A shard moved into a cell it does not belong to under the declared cellCount:
  // coverage stays complete, so only a per-shard re-derivation detects it (the old
  // checker re-derived placement from shardIds[0] alone and passed this).
  const fourCells = planRegionalCells(planRegionalCellsFixRouting(8, [], {}), 4);
  const foreignShard = { ...fourCells, cells: fourCells.cells.map((c) => ({ ...c, shardIds: [...c.shardIds] })) };
  (foreignShard.cells[0] as { shardIds: number[] }).shardIds = [0, 1, 4];
  (foreignShard.cells[1] as { shardIds: number[] }).shardIds = [5];
  assert.throws(() => assertCellPlanInvariants(Object.freeze(foreignShard)), /shard 1 is placed in cell-0 against the deterministic/);
  // Duplicate cell identities.
  const withDupCellId = tamper((p) => { (p.cells[1] as unknown as { cellId: string }).cellId = 'cell-0'; });
  assert.throws(() => assertCellPlanInvariants(withDupCellId), /duplicate cell identity/);
  // More cells than the declared cell count.
  const withExtraCells = tamper((p) => { (p.cells as unknown as { push(c: unknown): unknown }).push(p.cells[0]); });
  assert.throws(() => assertCellPlanInvariants(withExtraCells), /more cells than the declared cell count/);
  // An empty cell (covers no shards).
  const withEmptyCell = tamper((p) => { (p.cells[1] as unknown as { shardIds: number[] }).shardIds = []; });
  assert.throws(() => assertCellPlanInvariants(withEmptyCell), /cell covers no shards/);
  // A hand-built plan above the partition policy's shard ceiling: 100 shards over 4
  // cells with complete, correctly-placed coverage — previously accepted silently.
  const overShardCeiling: RegionalCellPlacementPlan = Object.freeze({
    ...base,
    shardCount: 100,
    cells: Object.freeze(Array.from({ length: 4 }, (_, k) => Object.freeze({
      cellId: `cell-${k}`,
      shardIds: Object.freeze(Array.from({ length: 25 }, (_, i) => k + i * 4)),
      tenantCount: 0,
      projectedRows: 0,
    }))),
    totals: Object.freeze({ tenants: 0, projectedRows: 0 }),
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
  assert.throws(() => assertCellPlanInvariants(overShardCeiling), /shard count outside the partition policy/);
  // An invalid tenant count.
  const withBadTenantCount = tamper((p) => {
    (p.cells[1] as unknown as { tenantCount: number }).tenantCount = -5;
    (p.totals as { tenants: number }).tenants = 0;
  });
  assert.throws(() => assertCellPlanInvariants(withBadTenantCount), /invalid tenant count/);
  // Totals that do not sum.
  const withBadTotals = tamper((p) => { (p.totals as { tenants: number }).tenants = 99; });
  assert.throws(() => assertCellPlanInvariants(withBadTotals), /do not sum/);
  // A plan that claims real infrastructure.
  const withRealClaims = tamper((p) => { (p as { realCellsProvisioned: number }).realCellsProvisioned = 3; });
  assert.throws(() => assertCellPlanInvariants(withRealClaims), /never claim real infrastructure/);
  // Gutted governance flags — every constitution flag, not only humanDecision.
  const withFlags = tamper((p) => { (p as { humanDecision: string }).humanDecision = 'OPTIONAL'; });
  assert.throws(() => assertCellPlanInvariants(withFlags), /honest governance flags/);
  for (const gut of [
    (p: RegionalCellPlacementPlan) => { (p as { learningPromoted: boolean }).learningPromoted = true; },
    (p: RegionalCellPlacementPlan) => { (p as { modelCalls: number }).modelCalls = 5; },
    (p: RegionalCellPlacementPlan) => { (p as { remoteCalls: number }).remoteCalls = 2; },
    (p: RegionalCellPlacementPlan) => { (p as { billionUsersProven: boolean }).billionUsersProven = true; },
    (p: RegionalCellPlacementPlan) => { (p as { automaticRecovery: boolean }).automaticRecovery = true; },
  ]) assert.throws(() => assertCellPlanInvariants(tamper(gut)), /honest governance flags/);
  // Fabricated guardrails — even frozen, the object must be the canonical export.
  const withFakeGuardrails = tamper((p) => {
    (p as unknown as { guardrails: unknown }).guardrails =
      Object.freeze({ ...REGIONAL_CELL_GUARDRAILS, materializesNoInfrastructure: false });
  });
  assert.throws(() => assertCellPlanInvariants(withFakeGuardrails), /guardrails must be the frozen/);
  // An unfrozen plan.
  assert.throws(() => assertCellPlanInvariants(clone()), /frozen/);
});