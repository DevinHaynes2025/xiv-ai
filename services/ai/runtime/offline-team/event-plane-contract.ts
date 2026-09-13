// 12D-123 — Distributed Event + Storage PLANE contract (XIV Twelve layer: the scale
// ladder's next rung after the 12D-120 regional-cell placement).
//
// The agreed scale ladder is: local SQLite pilot (done, measured) -> partition/shard
// contract (12D-109) -> tenant routing (12D-119) -> regional service cells (12D-120) ->
// DISTRIBUTED EVENT + STORAGE PLANE (this contract) -> measured failover -> measured
// horizontal scaling -> only then billion-user readiness claims.
//
// This module plans, for a validated 12D-109 routing and its 12D-120 cell placement,
// where each shard's EVENT STREAM lives: a deterministic PRIMARY cell (the shard's own
// cell) and a deterministic REPLICA cell on a DIFFERENT cell ((shardId + 1) %
// cellCount). A single-cell plane CANNOT hold a second copy — it degrades honestly to
// one copy (replicaCellId null) instead of fabricating a co-located replica.
//
// It MATERIALIZES NOTHING: no event log, no storage, no replica, no network. The plan
// is advisory until operator adoption (receipt-gated, the 12D-119/12D-121 discipline),
// and adoption is a DECISION RECORD, never provisioning. Honest scale discipline: the
// ONLY measured ceiling in this program is 2,000,000 rows per database (12D-103); every
// stream projection here is a sparse logical sum of caller-supplied budgets, and no
// replication behavior has ever been measured.

import {
  assertCellPlanInvariants, REGIONAL_CELL_POLICY, shardCellId,
  type RegionalCellPlacementPlan,
} from './regional-cell-contract';
import {
  assertRouting, assertRowBudget, PARTITION_POLICY, type QueueRouting,
} from './queue-partition-contract';

export const EVENT_PLANE_POLICY = Object.freeze({
  targetReplicationFactor: 2,
  minCellsForReplication: 2, // a replica must live on a DIFFERENT cell, so one cell cannot replicate
  maxShards: PARTITION_POLICY.maxShards,
  // The ONLY measured row ceiling in this program (12D-103 drill), re-asserted per
  // stream here — the plane never projects a database past it.
  perDatabaseMeasuredRowCeiling: PARTITION_POLICY.maxRowsPerShard,
  routingEpochs: PARTITION_POLICY.routingEpochs,
  maxAdoptedByChars: 128,
});

export const EVENT_PLANE_GUARDRAILS = Object.freeze({
  materializesNoInfrastructure: true,
  advisoryUntilOperatorAdoption: true,
  replicaPlacementIsDeterministic: true, // (shardId + 1) % cellCount, re-derivable, no hidden state
  replicaRequiresADistinctCell: true,
  singleCellCannotReplicate: true, // degraded plans say so instead of fabricating a copy
  noMeasuredReplicationEvidence: true,
  countsSimulatedCellsAsReal: false,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export interface EventStreamPlacement {
  readonly shardId: number;
  readonly primaryCellId: string;
  /** null when the plane has a single cell — one cell cannot hold a second copy. */
  readonly replicaCellId: string | null;
  /** Sum of the routing's tenant row budgets on this shard — a PROJECTION. */
  readonly projectedEventRows: number;
}

export interface DistributedEventPlanePlan {
  readonly kind: 'DISTRIBUTED_EVENT_PLANE_PLAN';
  readonly epoch: string;
  readonly cellCount: number;
  readonly shardCount: number;
  readonly targetReplicationFactor: number;
  /** True iff the plane has fewer cells than the replication target requires. */
  readonly replicationDegraded: boolean;
  readonly streams: readonly Readonly<EventStreamPlacement>[];
  readonly totals: Readonly<{ tenants: number; projectedEventRows: number }>;
  readonly assumptions: readonly string[];
  readonly guardrails: Readonly<typeof EVENT_PLANE_GUARDRAILS>;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly realEventStreamsProvisioned: 0;
  readonly realCellsProvisioned: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

export interface EventPlaneAdoptionRecord {
  readonly kind: 'EVENT_PLANE_ADOPTION_RECORD';
  readonly planEpoch: string;
  readonly cellCount: number;
  readonly shardCount: number;
  readonly adoptedBy: string;
  readonly adoptedAtMs: number;
  readonly operatorReceiptSha256: string;
  /** Adoption is a DECISION RECORD: this runtime provisions no infrastructure, ever. */
  readonly materializedByThisRuntime: false;
  readonly productionProvisioningAllowed: false;
  readonly infrastructureProvisionedByThisRuntime: 0;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

const hex64 = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const id = (v: unknown): v is string =>
  typeof v === 'string' && v.length >= 1 && v.length <= EVENT_PLANE_POLICY.maxAdoptedByChars
  && /^[A-Za-z0-9_.:@-]+$/.test(v);
const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);
const isKnownEpoch = (epoch: unknown): epoch is string =>
  typeof epoch === 'string' && (EVENT_PLANE_POLICY.routingEpochs as readonly string[]).includes(epoch);

/**
 * Plan the distributed event + storage plane for a 12D-109 routing and its 12D-120
 * cell placement. Pure: reads two validated packets, derives every placement
 * deterministically, materializes nothing. Fails closed on: a routing that fails the
 * 12D-109 contract's own validation, a cell plan that fails the 12D-120 contract's own
 * invariants, any mismatch between the two packets (epoch, shard count, tenant total,
 * row totals), a cell plan that does not RE-DERIVE from the routing under the
 * deterministic shardId % cellCount rule (including a sparse topology where the routing
 * populates fewer cells than the plan declares — replicas are never handed to cells no
 * validated packet describes), a missing or invalid tenant row budget, a
 * shard whose projected rows exceed the proven per-database ceiling, or a single-cell
 * plane (which degrades honestly to one copy). The frozen packet is self-checked
 * through assertEventPlaneInvariants before it is ever returned.
 */
export function planEventPlane(
  routing: QueueRouting,
  cellPlan: Readonly<RegionalCellPlacementPlan>,
): Readonly<DistributedEventPlanePlan> {
  assertRouting(routing);
  assertCellPlanInvariants(cellPlan);
  if (cellPlan.epoch !== routing.epoch)
    throw new Error('cell plan epoch does not match the routing; inconsistent packets; fail closed');
  if (cellPlan.shardCount !== routing.shardCount)
    throw new Error('cell plan shard count does not match the routing; inconsistent packets; fail closed');
  // Every budget validated by the 12D-109 contract's own rule; a missing entry fails
  // closed instead of silently projecting zero rows.
  const rowsByShard = new Map<number, number>();
  for (const a of routing.assignments) {
    const budget = routing.tenantRowBudgets[a.tenantId];
    assertRowBudget(budget);
    rowsByShard.set(a.shardId, (rowsByShard.get(a.shardId) ?? 0) + budget);
  }
  // The only measured ceiling, re-asserted per stream — a forged-consistent packet pair
  // cannot route a database past it.
  for (const [shardId, rows] of rowsByShard) {
    if (rows > EVENT_PLANE_POLICY.perDatabaseMeasuredRowCeiling)
      throw new Error(`shard ${shardId} projects past the proven ${EVENT_PLANE_POLICY.perDatabaseMeasuredRowCeiling}-row ceiling; re-plan required`);
  }
  // Re-derive the cell grouping from the routing under the deterministic rule and
  // compare it to the cell plan — the plane never trusts the cell plan's own grouping.
  const derived = new Map<string, { shardIds: number[]; tenants: number; rows: number }>();
  for (let s = 0; s < routing.shardCount; s++) {
    const cellId = shardCellId(cellPlan.cellCount, s);
    const entry = derived.get(cellId) ?? { shardIds: [], tenants: 0, rows: 0 };
    entry.shardIds.push(s);
    derived.set(cellId, entry);
  }
  for (const a of routing.assignments) {
    const entry = derived.get(shardCellId(cellPlan.cellCount, a.shardId))!;
    entry.tenants += 1;
    entry.rows += routing.tenantRowBudgets[a.tenantId]!;
  }
  const planCells = new Map(cellPlan.cells.map((c) => [c.cellId, c]));
  if (planCells.size !== derived.size)
    throw new Error('cell plan does not re-derive from the routing; inconsistent packets; fail closed');
  for (const [cellId, entry] of derived) {
    const cell = planCells.get(cellId);
    if (!cell) throw new Error(`cell plan is missing derived cell ${cellId}; fail closed`);
    if (cell.shardIds.length !== entry.shardIds.length
      || [...cell.shardIds].sort((a, b) => a - b).some((s, i) => s !== entry.shardIds[i])
      || cell.tenantCount !== entry.tenants || cell.projectedRows !== entry.rows)
      throw new Error(`cell plan does not re-derive from the routing (cell ${cellId}); inconsistent packets; fail closed`);
  }
  // The cell count is RE-DERIVED, never trusted: a cell plan that declares more cells
  // than the routing actually populates (sparse topology, shardCount < cellCount) would
  // otherwise hand replicas to cells no validated packet describes. Every declared cell
  // must host at least one shard of this routing.
  if (cellPlan.cellCount !== derived.size)
    throw new Error(`cell plan declares ${cellPlan.cellCount} cells but the routing populates ${derived.size}; a replica cell the cell plan never established cannot host a copy; fail closed`);
  const cellCount = cellPlan.cellCount;
  const replicationDegraded = cellCount < EVENT_PLANE_POLICY.minCellsForReplication;
  const projectedEventRows = (s: number): number => rowsByShard.get(s) ?? 0;
  const streams = Array.from({ length: routing.shardCount }, (_, s) => Object.freeze({
    shardId: s,
    primaryCellId: shardCellId(cellCount, s),
    replicaCellId: replicationDegraded ? null : shardCellId(cellCount, (s + 1) % cellCount),
    projectedEventRows: projectedEventRows(s),
  }));
  const totalRows = streams.reduce((a, s) => a + s.projectedEventRows, 0);
  if (cellPlan.totals.tenants !== routing.assignments.length)
    throw new Error('cell plan tenant total does not match the routing; inconsistent packets; fail closed');
  if (cellPlan.totals.projectedRows !== totalRows)
    throw new Error('cell plan row totals do not re-derive from the routing; inconsistent packets; fail closed');
  const packet = Object.freeze({
    kind: 'DISTRIBUTED_EVENT_PLANE_PLAN' as const,
    epoch: routing.epoch,
    cellCount,
    shardCount: routing.shardCount,
    targetReplicationFactor: EVENT_PLANE_POLICY.targetReplicationFactor,
    replicationDegraded,
    streams: Object.freeze(streams),
    totals: Object.freeze({ tenants: routing.assignments.length, projectedEventRows: totalRows }),
    assumptions: Object.freeze([
      'Every routed tenant in this plan is a synthetic fixture tenant; realEventStreamsProvisioned is structurally 0.',
      `The only measured row ceiling is ${PARTITION_POLICY.maxRowsPerShard} rows per database; event-stream row projections are sparse logical sums of caller-supplied budgets, never measured evidence.`,
      'Replica placement is deterministic ((shardId + 1) % cellCount) and advisory until operator adoption; no replication behavior has ever been measured.',
      'A single-cell plane degrades to one copy (replicaCellId null) and says so instead of fabricating a co-located replica.',
      'This plan provisions no event log, no storage, and no network; billion-user readiness is NOT proven.',
    ]),
    guardrails: EVENT_PLANE_GUARDRAILS,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    realEventStreamsProvisioned: 0 as const,
    realCellsProvisioned: 0 as const,
    billionUsersProven: false as const,
    automaticRecovery: false as const,
  });
  // Construction ships no packet it would itself reject.
  assertEventPlaneInvariants(packet);
  return packet;
}

/**
 * Mechanical invariant check for any event-plane plan, fail-closed: every shard of the
 * declared shard count appears EXACTLY once with its deterministically re-derived
 * primary cell, a replica on a DIFFERENT derived cell unless the plane is (honestly)
 * degraded, row projections that are safe non-negative integers bounded by the only
 * measured per-database ceiling, consistent totals, the frozen canonical guardrails,
 * and the full constitution flag set. A plan that fails these invariants is rejected,
 * never repaired. Used by tests, by construction, and by any future adoption layer.
 */
export function assertEventPlaneInvariants(plan: Readonly<DistributedEventPlanePlan>): void {
  if (!plan || plan.kind !== 'DISTRIBUTED_EVENT_PLANE_PLAN' || !Object.isFrozen(plan))
    throw new Error('not a frozen DISTRIBUTED_EVENT_PLANE_PLAN');
  if (plan.guardrails !== EVENT_PLANE_GUARDRAILS || !Object.isFrozen(plan.guardrails))
    throw new Error('guardrails must be the frozen EVENT_PLANE_GUARDRAILS; fabricated guardrails fail closed');
  if (!isKnownEpoch(plan.epoch)) throw new Error('unknown routing epoch');
  if (!safeInt(plan.cellCount) || plan.cellCount < REGIONAL_CELL_POLICY.minCells
    || plan.cellCount > REGIONAL_CELL_POLICY.maxCells)
    throw new Error('cell count outside policy');
  if (!safeInt(plan.shardCount) || plan.shardCount < 1 || plan.shardCount > EVENT_PLANE_POLICY.maxShards)
    throw new Error('shard count outside the partition policy');
  if (plan.targetReplicationFactor !== EVENT_PLANE_POLICY.targetReplicationFactor)
    throw new Error('replication target does not match the event-plane policy');
  if (plan.replicationDegraded !== (plan.cellCount < EVENT_PLANE_POLICY.minCellsForReplication))
    throw new Error('replicationDegraded flag is inconsistent with the cell count');
  if (!Array.isArray(plan.streams) || plan.streams.length !== plan.shardCount)
    throw new Error('event stream coverage does not match the shard count');
  const seen = new Set<number>();
  let rowsSum = 0;
  for (const stream of plan.streams) {
    if (!stream || !safeInt(stream.shardId) || stream.shardId < 0 || stream.shardId >= plan.shardCount)
      throw new Error(`event stream covers shard ${String(stream?.shardId)} outside the plan's shard count`);
    if (seen.has(stream.shardId))
      throw new Error(`duplicate event stream coverage: shard ${stream.shardId} appears more than once`);
    seen.add(stream.shardId);
    if (stream.primaryCellId !== shardCellId(plan.cellCount, stream.shardId))
      throw new Error(`shard ${stream.shardId} primary cell is not the deterministic shardId % cellCount placement; inconsistent plan`);
    if (plan.replicationDegraded) {
      if (stream.replicaCellId !== null)
        throw new Error(`shard ${stream.shardId} claims a replica on a single-cell plane; a fabricated copy fails closed`);
    } else {
      if (stream.replicaCellId === null)
        throw new Error(`shard ${stream.shardId} has no replica although the plane has ${plan.cellCount} cells; inconsistent plan`);
      const expectedReplica = shardCellId(plan.cellCount, (stream.shardId + 1) % plan.cellCount);
      // Note: for cellCount >= 2 the deterministic rule can never place a replica in its
      // own cell ((s + 1) % c === s only when c === 1, which is the degraded case), so
      // the deterministic check above already guarantees replica !== primary.
      if (stream.replicaCellId !== expectedReplica)
        throw new Error(`shard ${stream.shardId} replica is not the deterministic (shardId + 1) % cellCount placement; inconsistent plan`);
    }
    if (!safeInt(stream.projectedEventRows) || stream.projectedEventRows < 0)
      throw new Error(`shard ${stream.shardId} row projection invalid`);
    if (stream.projectedEventRows > EVENT_PLANE_POLICY.perDatabaseMeasuredRowCeiling)
      throw new Error(`shard ${stream.shardId} projects past the proven ${EVENT_PLANE_POLICY.perDatabaseMeasuredRowCeiling}-row ceiling; re-plan required`);
    rowsSum += stream.projectedEventRows;
  }
  for (let s = 0; s < plan.shardCount; s++) {
    if (!seen.has(s)) throw new Error(`shard ${s} has no event stream; incomplete plan`);
  }
  if (!safeInt(plan.totals.tenants) || plan.totals.tenants < 0) throw new Error('invalid tenant total');
  if (plan.totals.projectedEventRows !== rowsSum)
    throw new Error('event stream row projections do not sum to the plan total');
  if (!Array.isArray(plan.assumptions) || plan.assumptions.length < 1)
    throw new Error('honest assumptions required');
  if (plan.realEventStreamsProvisioned !== 0 || plan.realCellsProvisioned !== 0)
    throw new Error('an event-plane plan may never claim real infrastructure');
  if (plan.humanDecision !== 'REQUIRED' || plan.automaticRecovery !== false
    || plan.learningPromoted !== false || plan.modelCalls !== 0 || plan.remoteCalls !== 0
    || plan.billionUsersProven !== false)
    throw new Error('event-plane plan must carry the honest governance flags');
}

/**
 * Receipt-gated operator ADOPTION of an event-plane plan — a DECISION RECORD, never
 * provisioning. The 64-hex sha256 operator receipt is the same discipline as 12D-119
 * adoption and 12D-121 human approval. This runtime materializes no event log, no
 * storage, and no replica; turning the adopted plan into infrastructure is the
 * operator's action in systems outside this runtime.
 */
export function adoptEventPlanePlan(
  plan: Readonly<DistributedEventPlanePlan>,
  input: { operatorReceiptSha256: string; adoptedBy: string; adoptedAtMs: number },
): Readonly<EventPlaneAdoptionRecord> {
  assertEventPlaneInvariants(plan);
  if (!hex64(input?.operatorReceiptSha256))
    throw new Error('event-plane adoption requires a 64-hex sha256 operator receipt; fail closed');
  if (!id(input.adoptedBy)) throw new Error('adopter identity invalid; fail closed');
  if (!safeInt(input.adoptedAtMs) || input.adoptedAtMs <= 0)
    throw new Error('adoption timestamp invalid; fail closed');
  return Object.freeze({
    kind: 'EVENT_PLANE_ADOPTION_RECORD' as const,
    planEpoch: plan.epoch,
    cellCount: plan.cellCount,
    shardCount: plan.shardCount,
    adoptedBy: input.adoptedBy,
    adoptedAtMs: input.adoptedAtMs,
    operatorReceiptSha256: input.operatorReceiptSha256,
    materializedByThisRuntime: false as const,
    productionProvisioningAllowed: false as const,
    infrastructureProvisionedByThisRuntime: 0 as const,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    billionUsersProven: false as const,
    automaticRecovery: false as const,
  });
}