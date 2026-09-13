// 12D-119 — Tenant-routing ADOPTION layer for the offline story queue.
//
// 12D-109's partition contract (queue-partition-contract.ts) is deliberately pure: it
// routes and plans, but MATERIALIZES NOTHING, and its handoff names the next rung —
// "routing output is advisory until a queue adapter adopts it in a separately reviewed
// layer". This module is that reviewed layer, and it keeps the same discipline:
//
//   * Adoption is explicit and operator-receipt-gated. Without a 64-hex operator receipt
//     there is no adoption, and without adoption the facade refuses to route anything.
//   * The facade MATERIALIZES NO database. Shard queue instances are caller-provided
//     OfflineStoryQueue objects; a missing shard queue is fail-closed at construction.
//   * Onboarding a tenant is a per-call receipt-gated step (the same operator custody
//     artifact), executed through 12D-109's deterministic assignTenantToShard — never a
//     re-implementation of routing here.
//   * Every packet carries the honest constitution flags; realTenantsOnboarded is
//     structurally 0 because every routed tenant so far is a synthetic fixture tenant.
//   * Leases remain per-shard singleton leases with the queue's own policy; the facade
//     grants no additional concurrency, no renewal shortcuts, and no recovery.

import {
  PARTITION_POLICY, assignTenantToShard, initialRouting, planShardPlacement,
  type QueueRouting,
} from './queue-partition-contract';
import { OfflineStoryQueue, type OfflineStory, type StoryLease } from './offline-story-queue';

const sha256Hex = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

export const TENANT_ROUTING_ADOPTION_GUARDRAILS = Object.freeze({
  adoptionRequiresOperatorReceipt: true,
  facadeMaterializesNoShardDatabase: true,
  onboardingRequiresOperatorReceipt: true,
  routingExecutedBy12d109ContractOnly: true,
  shardRowCeilingIsTheMeasuredCeiling: true, // 2,000,000 rows = OFFLINE_QUEUE_POLICY.maxRows
  leasesRemainPerShardSingletons: true,
  facadeGrantsNoAdditionalConcurrency: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export interface TenantRoutingAdoption {
  readonly kind: 'TENANT_ROUTING_ADOPTION';
  readonly epoch: string;
  readonly shardCount: number;
  readonly adoptedAtMs: number;
  readonly operatorReceiptSha256: string;
  readonly initialRouting: QueueRouting;
  readonly guardrails: Readonly<typeof TENANT_ROUTING_ADOPTION_GUARDRAILS>;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly realTenantsOnboarded: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

export interface AdoptTenantRoutingInput {
  epoch: string;
  shardCount: number;
  operatorReceiptSha256: string;
}

/**
 * Adopt 12D-109's routing as OPERATIVE for a bounded epoch/shard count. Fails closed on
 * an unknown epoch, an out-of-policy shard count, or a malformed operator receipt. The
 * returned adoption record is frozen data: it authorizes nothing by itself — a
 * TenantRoutedQueue must still be constructed with caller-provisioned shard queues
 * before any story moves.
 */
export function adoptTenantRouting(input: AdoptTenantRoutingInput, nowMs: number): Readonly<TenantRoutingAdoption> {
  if (!Number.isSafeInteger(nowMs) || nowMs <= 0) throw new Error('adoption timestamp required');
  if (!input || !PARTITION_POLICY.routingEpochs.includes(input.epoch))
    throw new Error('unknown routing epoch; adopting a new epoch is a deliberate policy change');
  if (!Number.isSafeInteger(input.shardCount) || input.shardCount < 1 || input.shardCount > PARTITION_POLICY.maxShards)
    throw new Error('shard count outside policy');
  if (!sha256Hex(input.operatorReceiptSha256))
    throw new Error('operator receipt required (sha256 hex) — adoption is receipt-gated, never ambient');
  return Object.freeze({
    kind: 'TENANT_ROUTING_ADOPTION' as const,
    epoch: input.epoch,
    shardCount: input.shardCount,
    adoptedAtMs: nowMs,
    operatorReceiptSha256: input.operatorReceiptSha256,
    initialRouting: initialRouting(input.epoch, input.shardCount),
    guardrails: TENANT_ROUTING_ADOPTION_GUARDRAILS,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    realTenantsOnboarded: 0 as const,
    billionUsersProven: false as const,
    automaticRecovery: false as const,
  });
}

export interface TenantRoutedOnboardingPacket {
  readonly kind: 'TENANT_ROUTED_ONBOARDING';
  readonly epoch: string;
  readonly tenantId: string;
  readonly shardId: number;
  readonly newShardCreated: boolean;
  readonly rowBudget: number;
  readonly onboardingIsSyntheticFixtureOnly: true;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly realTenantsOnboarded: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

export interface TenantRoutedEnqueueResult {
  readonly kind: 'TENANT_ROUTED_ENQUEUE';
  readonly inserted: number;
  readonly duplicates: number;
  readonly shardsTouched: number;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly realTenantsOnboarded: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

interface ShardState {
  readonly shardId: number;
  readonly queue: OfflineStoryQueue;
  tenantIds: Set<string>;
  rowBudgetSum: number;
}

/**
 * The reviewed adapter that makes 12D-109's routing OPERATIVE over real (local,
 * synthetic-tenant) OfflineStoryQueue instances. The facade itself opens no database and
 * performs no routing math: queues are caller-provisioned, and every assignment decision
 * is delegated to the frozen 12D-109 contract. All identities, receipts, ceilings, and
 * timestamps fail closed.
 */
export class TenantRoutedQueue {
  readonly #adoption: Readonly<TenantRoutingAdoption>;
  readonly #receipt: string;
  #routing: QueueRouting;
  readonly #shards: Map<number, ShardState>;
  #syntheticOnboarded = 0;

  constructor(input: {
    adoption: Readonly<TenantRoutingAdoption>;
    shardQueues: ReadonlyMap<number, OfflineStoryQueue>;
  }) {
    const adoption = input?.adoption;
    if (!adoption || adoption.kind !== 'TENANT_ROUTING_ADOPTION' || !Object.isFrozen(adoption))
      throw new Error('an adopted routing record is required; routing is never operative without adoption');
    if (!input.shardQueues || !(input.shardQueues instanceof Map)) throw new Error('shard queue map required');
    // Fail closed: every planned shard needs exactly one REAL queue instance, distinct
    // from every other shard's queue (a duplicated instance or a queue shared between two
    // shard ids would silently collapse the per-shard singleton lease and the per-shard
    // ceiling accounting), and no queue may exist outside the adopted plan.
    for (let s = 0; s < adoption.shardCount; s++) {
      const queue = input.shardQueues.get(s);
      if (queue === undefined) throw new Error(`shard ${s} has no provisioned queue; operator provisioning required`);
      if (!(queue instanceof OfflineStoryQueue))
        throw new Error(`shard ${s} is not an OfflineStoryQueue; fail closed`);
    }
    if (new Set([...input.shardQueues.values()]).size !== input.shardQueues.size)
      throw new Error('shard queues must be distinct instances; one shared queue would collapse per-shard singleton leases');
    if (input.shardQueues.size !== adoption.shardCount)
      throw new Error('shard queue map does not match the adopted shard count; fail closed');
    this.#adoption = adoption;
    this.#receipt = adoption.operatorReceiptSha256;
    this.#routing = adoption.initialRouting;
    this.#shards = new Map<number, ShardState>();
    for (let s = 0; s < adoption.shardCount; s++) {
      this.#shards.set(s, { shardId: s, queue: input.shardQueues.get(s)!, tenantIds: new Set(), rowBudgetSum: 0 });
    }
  }

  get adoption(): Readonly<TenantRoutingAdoption> { return this.#adoption; }

  /**
   * Route one tenant onto a shard through the frozen 12D-109 contract, receipt-gated per
   * call. A brand-new shard assignment cannot be served by this facade (it provisions no
   * database) and fails closed; the operator must provision the shard and adopt a routing
   * that includes it.
   */
  onboardTenant(tenantId: string, rowBudget: number, operatorReceiptSha256: string): Readonly<TenantRoutedOnboardingPacket> {
    if (operatorReceiptSha256 !== this.#receipt)
      throw new Error('onboarding receipt does not match the adoption receipt; operator decision required per change');
    const packet = assignTenantToShard(this.#routing, tenantId, rowBudget);
    if (packet.newShardCreated)
      throw new Error('routing requires a new shard; this facade provisions no database — operator must provision the shard queue and adopt a routing containing it');
    const shard = this.#shards.get(packet.shardId)!;
    if (shard.tenantIds.has(tenantId)) throw new Error('tenant already routed');
    if (shard.rowBudgetSum + rowBudget > PARTITION_POLICY.maxRowsPerShard)
      throw new Error('shard row projection would exceed the measured 2,000,000-row ceiling; fail closed');
    this.#routing = packet.routing;
    shard.tenantIds.add(tenantId);
    shard.rowBudgetSum += rowBudget;
    this.#syntheticOnboarded += 1;
    return Object.freeze({
      kind: 'TENANT_ROUTED_ONBOARDING' as const,
      epoch: packet.epoch,
      tenantId,
      shardId: packet.shardId,
      newShardCreated: false,
      rowBudget,
      onboardingIsSyntheticFixtureOnly: true,
      humanDecision: 'REQUIRED' as const,
      learningPromoted: false as const,
      modelCalls: 0 as const,
      remoteCalls: 0 as const,
      realTenantsOnboarded: 0 as const,
      billionUsersProven: false as const,
      automaticRecovery: false as const,
    });
  }

  /** Shard lookup is a routing question, delegated to the adopted assignments only. */
  #shardFor(tenantId: string): ShardState {
    for (const a of this.#routing.assignments) {
      if (a.tenantId === tenantId) return this.#shards.get(a.shardId)!;
    }
    throw new Error('tenant not routed; onboardTenant is required before enqueue or claim');
  }

  /**
   * Route stories to their shard queues. Unknown tenants and empty batches fail closed.
   * Each shard's own batch is transactional inside its queue, but a cross-shard batch is
   * NOT atomic — if a later shard throws, earlier shards have committed durably, so the
   * error reports exactly what landed. Retry is idempotent for unchanged story content
   * (INSERT OR IGNORE on the same fingerprint); altered content for an already-inserted
   * id throws 'story ID content conflict' and needs operator review. Never silent.
   */
  enqueue(stories: readonly OfflineStory[]): Readonly<TenantRoutedEnqueueResult> {
    if (!Array.isArray(stories) || stories.length < 1 || stories.length > 1000) throw new Error('invalid enqueue batch');
    const byShard = new Map<number, OfflineStory[]>();
    for (const story of stories) {
      const shard = this.#shardFor(story?.tenantId ?? '');
      const batch = byShard.get(shard.shardId) ?? [];
      batch.push(story);
      byShard.set(shard.shardId, batch);
    }
    let inserted = 0, duplicates = 0;
    const committed: number[] = [];
    const shardIds = [...byShard.keys()].sort((a, b) => a - b);
    for (const shardId of shardIds) {
      try {
        const result = this.#shards.get(shardId)!.queue.enqueue(byShard.get(shardId)!);
        inserted += result.inserted;
        duplicates += result.duplicates;
        committed.push(shardId);
      } catch (error) {
        const landed = committed.length
          ? `earlier shards ${committed.join(', ')} already committed durably (${inserted} inserted, ${duplicates} duplicates)`
          : 'no earlier shard committed';
        throw new Error(
          `tenant-routed enqueue failed on shard ${shardId}: ${error instanceof Error ? error.message : 'unknown error'}; ${landed}; `
          + `retry is idempotent only for unchanged story content; operator review required otherwise`,
        );
      }
    }
    return Object.freeze({
      kind: 'TENANT_ROUTED_ENQUEUE' as const,
      inserted, duplicates, shardsTouched: byShard.size,
      humanDecision: 'REQUIRED' as const,
      learningPromoted: false as const,
      modelCalls: 0 as const,
      remoteCalls: 0 as const,
      realTenantsOnboarded: 0 as const,
      billionUsersProven: false as const,
      automaticRecovery: false as const,
    });
  }

  /** Claim through the owning shard's own singleton lease, unchanged policy. */
  claimNext(tenantId: string, roleId: string, ownerId: string, durationMs = 120_000): StoryLease | null {
    return this.#shardFor(tenantId).queue.claimNext(tenantId, roleId, ownerId, durationMs);
  }

  inspectLease(lease: StoryLease, requireUnexpired = false): Readonly<OfflineStory> {
    if (!lease) throw new Error('lease required');
    return this.#shardFor(lease.tenantId).queue.inspectLease(lease, requireUnexpired);
  }

  renewLease(lease: StoryLease, extendMs: number) {
    if (!lease) throw new Error('lease required');
    return this.#shardFor(lease.tenantId).queue.renewLease(lease, extendMs);
  }

  settle(lease: StoryLease, result: { outcome: 'DRAFT' | 'FAILED'; outputHash?: string; providerSettled: true }): void {
    if (!lease) throw new Error('lease required');
    this.#shardFor(lease.tenantId).queue.settle(lease, result);
  }

  returnUnstarted(lease: StoryLease): void {
    if (!lease) throw new Error('lease required');
    this.#shardFor(lease.tenantId).queue.returnUnstarted(lease);
  }

  /** Pure 12D-109 projection of the CURRENT routing — advisory, never an admission. */
  routingReport(nowMs: number): Readonly<ReturnType<typeof planShardPlacement> & {
    adoptedAtMs: number; syntheticTenantsRouted: number; realTenantsOnboarded: 0;
    humanDecision: 'REQUIRED'; learningPromoted: false; billionUsersProven: false; automaticRecovery: false;
  }> {
    if (!Number.isSafeInteger(nowMs) || nowMs <= 0) throw new Error('report timestamp required');
    const plan = planShardPlacement(this.#routing);
    return Object.freeze({
      ...plan,
      adoptedAtMs: this.#adoption.adoptedAtMs,
      syntheticTenantsRouted: this.#syntheticOnboarded,
      realTenantsOnboarded: 0 as const,
      humanDecision: 'REQUIRED' as const,
      learningPromoted: false as const,
      billionUsersProven: false as const,
      automaticRecovery: false as const,
    });
  }
}