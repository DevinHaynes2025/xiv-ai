/**
 * 12D-109: Deterministic queue partition/shard + tenant-routing CONTRACT (scale ladder step 2).
 *
 * This module MATERIALIZES NOTHING: no database, no file, no network call, no process. It is a
 * pure, replayable PLAN the story queue can adopt later (local SQLite pilot is step 1; tenant
 * routing and regional service cells come later; billion-user readiness claims come last, if
 * ever, and only with measured evidence).
 *
 * Honest posture:
 *  - Every shard projection is a sparse LOGICAL projection over caller-supplied per-tenant row
 *    budgets. Zero real tenants exist in any packet this module produces.
 *  - maxRowsPerShard is 2,000,000 — exactly the proven single-database ceiling measured for the
 *    story queue (OFFLINE_QUEUE_POLICY.maxRows). No shard may project past the ceiling we
 *    actually measured; a plan that would is rejected, not silently stretched.
 *  - Routing is ADVISORY until a queue adapter adopts it: producing a plan grants no authority,
 *    onboards no tenant, and starts no worker.
 *  - Tenant → shard routing uses FNV-1a: a pure 32-bit string hash, deterministic across calls
 *    and process restarts with no dependency on crypto or OS state.
 */

export const PARTITION_POLICY = Object.freeze({
  maxTenantsPerShard: 250,
  maxShards: 64,
  maxRowsPerShard: 2_000_000, // = OFFLINE_QUEUE_POLICY.maxRows, the proven per-database ceiling
  maxRowBudgetPerTenant: 2_000_000,
  maxSimulatedEvents: 10_000,
  maxTenantIdChars: 128,
  routingEpochs: Object.freeze(['local-sqlite-pilot-2026-09']),
});

export const PARTITION_GUARDRAILS = Object.freeze({
  materializesNoDatabase: true,
  launchesProcesses: false,
  remoteCallsAllowed: false,
  routingIsAdvisoryUntilAdopted: true,
  countsSimulatedTenantsAsReal: false,
  billionUsersProven: false,
  learningPromoted: false,
  humanDecision: 'REQUIRED' as const,
});

export interface ShardAssignment { tenantId: string; shardId: number }

export interface QueueRouting {
  epoch: string;
  shardCount: number;
  /** Assignment order is part of the contract: same order in, same plan out, every time. */
  assignments: readonly Readonly<ShardAssignment>[];
  tenantRowBudgets: Readonly<Record<string, number>>;
}

export interface QueueTenantAssignmentPacket {
  kind: 'QUEUE_TENANT_SHARD_ASSIGNMENT';
  epoch: string;
  tenantId: string;
  shardId: number;
  shardCountAfter: number;
  newShardCreated: boolean;
  routing: QueueRouting;
  humanDecision: 'REQUIRED';
  learningPromoted: false;
  modelCalls: 0;
  remoteCalls: 0;
  realTenantsOnboarded: 0;
}

export interface ShardProjection {
  shardId: number;
  tenantCount: number;
  projectedRows: number;
  maxTenantsPerShard: number;
  maxRowsPerShard: number;
}

export interface QueueShardPlacementPlan {
  kind: 'QUEUE_SHARD_PLACEMENT_PLAN';
  epoch: string;
  shardCount: number;
  shards: readonly Readonly<ShardProjection>[];
  totals: Readonly<{ tenants: number; projectedRows: number }>;
  assumptions: readonly string[];
  guardrails: Readonly<typeof PARTITION_GUARDRAILS>;
  humanDecision: 'REQUIRED';
  learningPromoted: false;
  modelCalls: 0;
  remoteCalls: 0;
  realTenantsOnboarded: 0;
  billionUsersProven: false;
}

export type TenantGrowthEvent =
  | { kind: 'TENANT_ONBOARD'; tenantId: string; rowBudget: number }
  | { kind: 'TENANT_GROWTH'; tenantId: string; additionalRows: number };

export interface QueueRoutingEvaluationPacket {
  kind: 'QUEUE_ROUTING_EVALUATION';
  epoch: string;
  eventsConsidered: number;
  eventsApplied: number;
  simulatedTenants: number;
  plan: QueueShardPlacementPlan;
  humanDecision: 'REQUIRED';
  learningPromoted: false;
  modelCalls: 0;
  remoteCalls: 0;
  realTenantsOnboarded: 0;
}

const id = (v: unknown): v is string =>
  typeof v === 'string' && new RegExp(`^[A-Za-z0-9_.:-]{1,${PARTITION_POLICY.maxTenantIdChars}}$`).test(v);
const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);

/** Pure FNV-1a 32-bit string hash — identical value in every process, on every platform. */
export function tenantHash(tenantId: string): number {
  if (!id(tenantId)) throw new Error('invalid tenant identity');
  let h = 0x811c9dc5;
  for (let i = 0; i < tenantId.length; i++) {
    h ^= tenantId.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const isKnownEpoch = (epoch: unknown): epoch is string =>
  typeof epoch === 'string' && (PARTITION_POLICY.routingEpochs as readonly string[]).includes(epoch);

function assertRouting(routing: QueueRouting): void {
  if (!routing || !isKnownEpoch(routing.epoch)) throw new Error('unknown routing epoch; refusing to route');
  if (!safeInt(routing.shardCount) || routing.shardCount < 1 || routing.shardCount > PARTITION_POLICY.maxShards)
    throw new Error('shard count outside policy bounds');
  if (!Array.isArray(routing.assignments) || !routing.tenantRowBudgets
    || typeof routing.tenantRowBudgets !== 'object') throw new Error('routing shape invalid');
  const seen = new Set<string>();
  for (const a of routing.assignments) {
    if (!a || !id(a.tenantId) || !safeInt(a.shardId) || a.shardId < 0 || a.shardId >= routing.shardCount)
      throw new Error('routing assignment invalid');
    if (seen.has(a.tenantId)) throw new Error('duplicate tenant in routing assignments');
    seen.add(a.tenantId);
  }
}

function assertRowBudget(rowBudget: unknown): asserts rowBudget is number {
  if (!safeInt(rowBudget) || rowBudget < 1 || rowBudget > PARTITION_POLICY.maxRowBudgetPerTenant)
    throw new Error('tenant row budget must be a measured, bounded positive integer');
}

/** Fresh, empty routing for an epoch. Unknown epochs fail closed here, not at adoption time. */
export function initialRouting(epoch: string, shardCount: number): QueueRouting {
  if (!isKnownEpoch(epoch)) throw new Error('unknown routing epoch; refusing to route');
  if (!safeInt(shardCount) || shardCount < 1 || shardCount > PARTITION_POLICY.maxShards)
    throw new Error('shard count outside policy bounds');
  return freezeRouting({ epoch, shardCount, assignments: [], tenantRowBudgets: {} });
}

function freezeRouting(r: {
  epoch: string; shardCount: number;
  assignments: readonly ShardAssignment[]; tenantRowBudgets: Record<string, number>;
}): QueueRouting {
  return Object.freeze({
    epoch: r.epoch,
    shardCount: r.shardCount,
    assignments: Object.freeze(r.assignments.map(a => Object.freeze({ ...a }))),
    tenantRowBudgets: Object.freeze({ ...r.tenantRowBudgets }),
  });
}

const PLACEMENT_ASSUMPTIONS: readonly string[] = Object.freeze([
  'sparse logical projection: zero real tenants exist in this plan (realTenantsOnboarded: 0)',
  'projected rows come from caller-supplied per-tenant row budgets, not measured queue rows; no database was read or written',
  'routing is advisory until a queue adapter adopts it; no shard, file, process, or network resource exists because of this plan',
  `per-shard ceiling is ${PARTITION_POLICY.maxRowsPerShard} rows, the proven single-database story-queue ceiling; no scale claim beyond it is made`,
  'billion-user readiness is NOT proven by this contract (billionUsersProven: false)',
]);

/**
 * Pure assignment: stable FNV-1a hash picks the preferred shard; if that shard's tenant budget
 * is full, overflow goes to the lowest shard id with room, creating one new shard only when
 * every existing shard is full (bounded by maxShards). An already-assigned tenant always gets
 * its existing shard back, unchanged.
 */
export function assignTenantToShard(routing: QueueRouting, tenantId: string, rowBudget: number): Readonly<QueueTenantAssignmentPacket> {
  assertRouting(routing);
  if (!id(tenantId)) throw new Error('invalid tenant identity');
  assertRowBudget(rowBudget);
  const prior = routing.assignments.find(a => a.tenantId === tenantId);
  if (prior) {
    return Object.freeze({
      kind: 'QUEUE_TENANT_SHARD_ASSIGNMENT' as const, epoch: routing.epoch, tenantId,
      shardId: prior.shardId, shardCountAfter: routing.shardCount, newShardCreated: false,
      routing, humanDecision: 'REQUIRED' as const, learningPromoted: false as const,
      modelCalls: 0 as const, remoteCalls: 0 as const, realTenantsOnboarded: 0 as const,
    });
  }
  const perShard = new Map<number, number>();
  for (const a of routing.assignments) perShard.set(a.shardId, (perShard.get(a.shardId) ?? 0) + 1);
  const hasRoom = (s: number) => (perShard.get(s) ?? 0) < PARTITION_POLICY.maxTenantsPerShard;
  const preferred = tenantHash(tenantId) % routing.shardCount;
  let shardId = -1;
  let newShardCreated = false;
  if (hasRoom(preferred)) shardId = preferred;
  else {
    for (let s = 0; s < routing.shardCount; s++) if (hasRoom(s)) { shardId = s; break; }
    if (shardId === -1) {
      if (routing.shardCount >= PARTITION_POLICY.maxShards)
        throw new Error('shard tenant capacity exhausted at maxShards; re-plan required');
      shardId = routing.shardCount;
      newShardCreated = true;
    }
  }
  const next = freezeRouting({
    epoch: routing.epoch,
    shardCount: routing.shardCount + (newShardCreated ? 1 : 0),
    assignments: [...routing.assignments, { tenantId, shardId }],
    tenantRowBudgets: { ...routing.tenantRowBudgets, [tenantId]: rowBudget },
  });
  return Object.freeze({
    kind: 'QUEUE_TENANT_SHARD_ASSIGNMENT' as const, epoch: routing.epoch, tenantId,
    shardId, shardCountAfter: next.shardCount, newShardCreated,
    routing: next, humanDecision: 'REQUIRED' as const, learningPromoted: false as const,
    modelCalls: 0 as const, remoteCalls: 0 as const, realTenantsOnboarded: 0 as const,
  });
}

/**
 * Pure projection of a routing onto shard capacity. Fails CLOSED: any shard whose projected
 * rows exceed the proven 2,000,000-row ceiling rejects the whole plan rather than shipping a
 * plan that promises more than the measured ceiling supports.
 */
export function planShardPlacement(routing: QueueRouting): Readonly<QueueShardPlacementPlan> {
  assertRouting(routing);
  const counts = new Map<number, number>();
  const rows = new Map<number, number>();
  for (const a of routing.assignments) {
    const budget = routing.tenantRowBudgets[a.tenantId];
    assertRowBudget(budget);
    counts.set(a.shardId, (counts.get(a.shardId) ?? 0) + 1);
    rows.set(a.shardId, (rows.get(a.shardId) ?? 0) + budget);
  }
  const shards: ShardProjection[] = [];
  for (let s = 0; s < routing.shardCount; s++) {
    const projectedRows = rows.get(s) ?? 0;
    if (projectedRows > PARTITION_POLICY.maxRowsPerShard)
      throw new Error(`shard ${s} projects past the proven ${PARTITION_POLICY.maxRowsPerShard}-row ceiling; re-plan required`);
    shards.push({ shardId: s, tenantCount: counts.get(s) ?? 0, projectedRows,
      maxTenantsPerShard: PARTITION_POLICY.maxTenantsPerShard, maxRowsPerShard: PARTITION_POLICY.maxRowsPerShard });
  }
  const totalRows = shards.reduce((sum, s) => sum + s.projectedRows, 0);
  return Object.freeze({
    kind: 'QUEUE_SHARD_PLACEMENT_PLAN' as const,
    epoch: routing.epoch,
    shardCount: routing.shardCount,
    shards: Object.freeze(shards.map(s => Object.freeze({ ...s }))),
    totals: Object.freeze({ tenants: routing.assignments.length, projectedRows: totalRows }),
    assumptions: PLACEMENT_ASSUMPTIONS,
    guardrails: PARTITION_GUARDRAILS,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    realTenantsOnboarded: 0 as const,
    billionUsersProven: false as const,
  });
}

/**
 * Fold bounded SIMULATED tenant-growth events over a routing, then recompute the placement
 * plan. Still pure: no tenant is really onboarded, no row is really written, and the same
 * event list always yields the same plan.
 */
export function evaluateRouting(routing: QueueRouting, events: readonly TenantGrowthEvent[]): Readonly<QueueRoutingEvaluationPacket> {
  assertRouting(routing);
  if (!Array.isArray(events) || events.length > PARTITION_POLICY.maxSimulatedEvents)
    throw new Error('bounded simulated event list required');
  let shardCount = routing.shardCount;
  let assignments: readonly Readonly<ShardAssignment>[] = routing.assignments;
  const budgets: Record<string, number> = { ...routing.tenantRowBudgets };
  let applied = 0;
  for (const e of events) {
    if (!e || (e.kind !== 'TENANT_ONBOARD' && e.kind !== 'TENANT_GROWTH')) throw new Error('unknown simulated event kind');
    if (!id(e.tenantId)) throw new Error('invalid tenant identity');
    if (e.kind === 'TENANT_ONBOARD') {
      assertRowBudget(e.rowBudget);
      if (assignments.some(a => a.tenantId === e.tenantId)) throw new Error('simulated tenant already assigned; duplicates fail closed');
      const packet = assignTenantToShard(
        { epoch: routing.epoch, shardCount, assignments, tenantRowBudgets: budgets }, e.tenantId, e.rowBudget);
      shardCount = packet.routing.shardCount;
      assignments = packet.routing.assignments;
      budgets[e.tenantId] = e.rowBudget;
    } else {
      if (budgets[e.tenantId] === undefined) throw new Error('growth event for unassigned simulated tenant');
      assertRowBudget(e.additionalRows);
      const next = budgets[e.tenantId] + e.additionalRows;
      if (next > PARTITION_POLICY.maxRowBudgetPerTenant) throw new Error('simulated tenant growth exceeds per-tenant row budget cap');
      budgets[e.tenantId] = next;
    }
    applied += 1;
  }
  const plan = planShardPlacement({ epoch: routing.epoch, shardCount, assignments, tenantRowBudgets: budgets });
  return Object.freeze({
    kind: 'QUEUE_ROUTING_EVALUATION' as const,
    epoch: routing.epoch,
    eventsConsidered: events.length,
    eventsApplied: applied,
    simulatedTenants: assignments.length,
    plan,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    realTenantsOnboarded: 0 as const,
  });
}