// 12D-120 — Regional-cell placement CONTRACT for the tenant-routed story queue.
//
// The scale ladder (xiv-agent-alignment-briefing §4) puts regional service cells after
// tenant routing: 12D-109 routes tenants to shards, 12D-119 adopts that routing over
// provisioned shard queues — and this module groups shards into regional cells as a
// pure, fail-closed CONTRACT, exactly the way 12D-109 treated shards. It MATERIALIZES
// NOTHING: no database, no network, no process, no region claim that hardware has ever
// measured. A cell plan is advisory until an operator adopts it in a separately
// reviewed layer (the 12D-119 pattern), and every packet carries the honest
// constitution flags with zero real infrastructure behind it.

import {
  PARTITION_POLICY, assertRouting, assertRowBudget, type QueueRouting,
} from './queue-partition-contract';

export const REGIONAL_CELL_POLICY = Object.freeze({
  maxCells: 16,
  minCells: 1,
  maxCellIdChars: 128,
  maxShardsPerCell: PARTITION_POLICY.maxShards, // one cell must always absorb a full routing
  // The ONLY measured row ceiling in this program is 2,000,000 rows per DATABASE
  // (OFFLINE_QUEUE_POLICY.maxRows, proven by the 12D-103 drill). A multi-shard cell's
  // row projection is therefore a SPARSE LOGICAL PROJECTION, not a measured number —
  // plans say so explicitly instead of implying a measured cell capacity.
  perDatabaseMeasuredRowCeiling: PARTITION_POLICY.maxRowsPerShard,
  routingEpochs: PARTITION_POLICY.routingEpochs,
});

export const REGIONAL_CELL_GUARDRAILS = Object.freeze({
  materializesNoInfrastructure: true,
  advisoryUntilOperatorAdoption: true,
  cellPlacementIsShardIdModuloCellCount: true, // deterministic, re-derivable, no hidden state
  noMeasuredRegionalEvidence: true, // nothing about multi-shard cells has been measured
  countsSimulatedCellsAsReal: false,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export interface CellProjection {
  readonly cellId: string;
  readonly shardIds: readonly number[];
  readonly tenantCount: number;
  /** Sum of the routing's tenant row budgets over this cell's shards — a PROJECTION. */
  readonly projectedRows: number;
}

export interface RegionalCellPlacementPlan {
  readonly kind: 'REGIONAL_CELL_PLACEMENT_PLAN';
  readonly epoch: string;
  readonly cellCount: number;
  readonly shardCount: number;
  readonly cells: readonly Readonly<CellProjection>[];
  readonly totals: Readonly<{ tenants: number; projectedRows: number }>;
  readonly assumptions: readonly string[];
  readonly guardrails: Readonly<typeof REGIONAL_CELL_GUARDRAILS>;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly realTenantsOnboarded: 0;
  readonly realCellsProvisioned: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

const id = (v: unknown): v is string =>
  typeof v === 'string' && new RegExp(`^[A-Za-z0-9_.:-]{1,${REGIONAL_CELL_POLICY.maxCellIdChars}}$`).test(v);
const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);
const isKnownEpoch = (epoch: unknown): epoch is string =>
  typeof epoch === 'string' && (REGIONAL_CELL_POLICY.routingEpochs as readonly string[]).includes(epoch);

/**
 * Deterministic cell id for one shard: stable across processes and rebuilds, and
 * re-derivable from the policy — no hidden placement state exists anywhere.
 */
export const shardCellId = (cellCount: number, shardId: number): string => {
  if (!safeInt(cellCount) || cellCount < REGIONAL_CELL_POLICY.minCells || cellCount > REGIONAL_CELL_POLICY.maxCells)
    throw new Error('cell count outside policy');
  // Bound shard ids by the partition policy's shard ceiling — NOT by the derived
  // maxShardsPerCell * maxCells product, which would accept shard ids no valid
  // routing can ever contain.
  if (!safeInt(shardId) || shardId < 0 || shardId >= PARTITION_POLICY.maxShards)
    throw new Error('shard id outside policy');
  return `cell-${shardId % cellCount}`;
};

/**
 * Group a 12D-109 routing's shards into regional cells, deterministically
 * (shardId % cellCount). Pure: reads the routing, projects capacity, materializes
 * nothing. Fails closed on an unknown epoch, an out-of-policy cell count, any routing
 * that fails the 12D-109 contract's own validation (bad shape, out-of-range
 * assignments, duplicate tenants, missing/zero/negative/over-cap row budgets), or a
 * shard whose projected rows exceed the proven per-database ceiling — the same
 * fail-closed behavior the sibling planShardPlacement applies. The frozen packet is
 * self-checked through assertCellPlanInvariants before it is ever returned.
 */
export function planRegionalCells(routing: QueueRouting, cellCount: number): Readonly<RegionalCellPlacementPlan> {
  assertRouting(routing);
  if (!safeInt(cellCount) || cellCount < REGIONAL_CELL_POLICY.minCells || cellCount > REGIONAL_CELL_POLICY.maxCells)
    throw new Error('cell count outside policy');
  const byCell = new Map<string, { shardIds: number[]; tenants: number; rows: number }>();
  for (let s = 0; s < routing.shardCount; s++) {
    const cellId = shardCellId(cellCount, s);
    const entry = byCell.get(cellId) ?? { shardIds: [], tenants: 0, rows: 0 };
    entry.shardIds.push(s);
    byCell.set(cellId, entry);
  }
  const rowsByShard = new Map<number, number>();
  for (const tenantId of routing.assignments) {
    // Every budget is validated by the 12D-109 contract's own rule: a measured,
    // bounded positive integer. A missing entry fails closed instead of silently
    // projecting zero rows.
    const budget = routing.tenantRowBudgets[tenantId.tenantId];
    assertRowBudget(budget);
    const cellId = shardCellId(cellCount, tenantId.shardId);
    const entry = byCell.get(cellId)!;
    entry.tenants += 1;
    entry.rows += budget;
    rowsByShard.set(tenantId.shardId, (rowsByShard.get(tenantId.shardId) ?? 0) + budget);
  }
  for (const entry of byCell.values()) {
    if (entry.shardIds.length > REGIONAL_CELL_POLICY.maxShardsPerCell)
      throw new Error('cell shard capacity exceeded; fail closed');
  }
  // Per-SHARD (per-database) row sums are bounded by the only measured ceiling, exactly
  // as the sibling planShardPlacement enforces; a multi-shard CELL projection is a sum
  // over bounded databases and is never capped at that per-database number.
  for (const [shardId, rows] of rowsByShard) {
    if (rows > PARTITION_POLICY.maxRowsPerShard)
      throw new Error(`shard ${shardId} projects past the proven ${PARTITION_POLICY.maxRowsPerShard}-row ceiling; re-plan required`);
  }
  const cells = [...byCell.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cellId, entry]) => Object.freeze({
      cellId,
      shardIds: Object.freeze([...entry.shardIds].sort((a, b) => a - b)),
      tenantCount: entry.tenants,
      projectedRows: entry.rows,
    }));
  if (cells.some((c) => c.shardIds.length > REGIONAL_CELL_POLICY.maxShardsPerCell))
    throw new Error('cell shard capacity exceeded; fail closed');
  const totals = Object.freeze({
    tenants: routing.assignments.length,
    projectedRows: cells.reduce((a, c) => a + c.projectedRows, 0),
  });
  const packet = Object.freeze({
    kind: 'REGIONAL_CELL_PLACEMENT_PLAN' as const,
    epoch: routing.epoch,
    cellCount,
    shardCount: routing.shardCount,
    cells,
    totals,
    assumptions: Object.freeze([
      'Every routed tenant in this plan is a synthetic fixture tenant; realTenantsOnboarded is structurally 0.',
      'The only measured row ceiling is 2,000,000 rows per database; cell row projections are sparse logical sums of caller-supplied budgets, never measured multi-shard evidence.',
      'No cell, region, or failover topology exists in hardware; this plan provisions nothing and authorizes nothing.',
      'billion-user readiness is NOT proven and no user count is claimed anywhere in this packet.',
    ]),
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
  // Construction ships no packet it would itself reject: the frozen plan is run through
  // its own invariants before it is ever returned.
  assertCellPlanInvariants(packet);
  return packet;
}

/**
 * Mechanical invariant check for any cell plan, fail-closed: every shard of the declared
 * shard count is covered EXACTLY once under the deterministic shardId % cellCount rule
 * (every shard of every cell is re-derived, not just the first), cell ids are
 * well-formed, unique, and no more numerous than the declared cell count, the partition
 * policy's shard ceiling and per-cell shard capacity hold, tenant counts and row
 * projections are safe non-negative integers that sum, and the full constitution flag
 * set plus the frozen canonical guardrails are structurally required. There is
 * deliberately NO per-cell row ceiling here: a multi-shard cell spans multiple
 * databases, and 2,000,000 rows per database is the only measured number in this
 * program — per-tenant budgets and per-shard (per-database) row sums are validated at
 * construction instead. Used by tests, by construction, and by any future adoption
 * layer — a plan that fails these invariants is rejected, never repaired.
 */
export function assertCellPlanInvariants(plan: Readonly<RegionalCellPlacementPlan>): void {
  if (!plan || plan.kind !== 'REGIONAL_CELL_PLACEMENT_PLAN' || !Object.isFrozen(plan))
    throw new Error('not a frozen REGIONAL_CELL_PLACEMENT_PLAN');
  if (plan.guardrails !== REGIONAL_CELL_GUARDRAILS || !Object.isFrozen(plan.guardrails))
    throw new Error('guardrails must be the frozen REGIONAL_CELL_GUARDRAILS; fabricated guardrails fail closed');
  if (!isKnownEpoch(plan.epoch)) throw new Error('unknown routing epoch');
  if (!safeInt(plan.cellCount) || plan.cellCount < REGIONAL_CELL_POLICY.minCells || plan.cellCount > REGIONAL_CELL_POLICY.maxCells)
    throw new Error('cell count outside policy');
  if (!safeInt(plan.shardCount) || plan.shardCount < 1 || plan.shardCount > PARTITION_POLICY.maxShards)
    throw new Error('shard count outside the partition policy');
  if (!Array.isArray(plan.cells) || plan.cells.length > plan.cellCount)
    throw new Error('more cells than the declared cell count; inconsistent plan');
  const seenShards = new Set<number>();
  const seenCellIds = new Set<string>();
  for (const cell of plan.cells) {
    if (!cell || !id(cell.cellId)) throw new Error('malformed cell identity');
    if (seenCellIds.has(cell.cellId))
      throw new Error(`duplicate cell identity: ${cell.cellId} appears more than once`);
    seenCellIds.add(cell.cellId);
    if (!Array.isArray(cell.shardIds) || cell.shardIds.length < 1)
      throw new Error('cell covers no shards; inconsistent plan');
    if (cell.shardIds.length > REGIONAL_CELL_POLICY.maxShardsPerCell)
      throw new Error('cell shard capacity exceeded; inconsistent plan');
    for (const s of cell.shardIds) {
      if (!safeInt(s) || s < 0 || s >= plan.shardCount) throw new Error(`cell covers shard ${s} outside the plan's shard count`);
      // EVERY shard is re-derived against the placement rule — not only the first.
      if (shardCellId(plan.cellCount, s) !== cell.cellId)
        throw new Error(`shard ${s} is placed in ${cell.cellId} against the deterministic shardId % cellCount rule; inconsistent plan`);
      if (seenShards.has(s)) throw new Error(`duplicate shard coverage: shard ${s} appears in more than one cell`);
      seenShards.add(s);
    }
    if (!safeInt(cell.tenantCount) || cell.tenantCount < 0) throw new Error('invalid tenant count');
    if (!safeInt(cell.projectedRows) || cell.projectedRows < 0) throw new Error('invalid row projection');
  }
  for (let s = 0; s < plan.shardCount; s++) {
    if (!seenShards.has(s)) throw new Error(`shard ${s} is not covered by any cell; incomplete plan`);
  }
  if (seenShards.size !== plan.shardCount) throw new Error('cell coverage does not match the shard count');
  if (plan.totals.tenants !== plan.cells.reduce((a, c) => a + c.tenantCount, 0))
    throw new Error('cell tenant counts do not sum to the plan total');
  if (plan.totals.projectedRows !== plan.cells.reduce((a, c) => a + c.projectedRows, 0))
    throw new Error('cell row projections do not sum to the plan total');
  if (plan.realCellsProvisioned !== 0 || plan.realTenantsOnboarded !== 0)
    throw new Error('a cell plan may never claim real infrastructure or real tenants');
  if (plan.humanDecision !== 'REQUIRED' || plan.automaticRecovery !== false
    || plan.learningPromoted !== false || plan.modelCalls !== 0 || plan.remoteCalls !== 0
    || plan.billionUsersProven !== false)
    throw new Error('cell plan must carry the honest governance flags');
}