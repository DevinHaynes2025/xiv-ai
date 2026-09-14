// 12D-135 — EVENT-PLANE ADOPTION LAYER (the separately-reviewed adapter that makes
// 12D-123's adopted event-plane plan OPERATIVE — the event-plane sibling of 12D-119's
// tenant-routing adoption).
//
// 12D-123's contract already carries an in-contract adoption RECORD (adoptEventPlanePlan):
// a decision receipt that changes nothing. This layer is the next step — the reviewed
// adapter that lets an operator make an adopted plan OPERATIVE over caller-provisioned
// local stream queues, exactly as 12D-119 made 12D-109's routing operative:
//
//   * Receipt-gated at ADOPTION (64-hex sha256 operator receipt, per call) and
//     receipt-gated at EVERY stream ACTIVATION (the receipt must match the adoption's —
//     an operator decision per change, never ambient).
//   * The facade opens no database and derives no placement: stream queues are
//     caller-provisioned OfflineStoryQueue instances, and every primary/replica cell
//     decision is read from the adopted 12D-123 plan, re-asserted through the
//     contract's own invariants at construction.
//   * Replica writes follow the ADOPTED PLAN's decision and no other: a degraded
//     (single-cell) plane refuses replica queues outright (no fabricated co-located
//     copy) and honestly writes one copy; a multi-cell plane requires a distinct
//     replica queue for every replicated stream, and the facade appends to both.
//   * Cross-queue writes are NOT atomic and never silently so: if the primary copy
//     commits and the replica write throws, the error reports exactly what landed.
//   * Per-database ceiling enforcement stays where it is proven: each primary/replica
//     queue is its own OfflineStoryQueue database under the measured
//     2,000,000-row ceiling — the facade grants no additional concurrency and no
//     additional rows.
//   * Reads come from the primary queue only in this slice; serving reads from
//     replicas is a future, separately-reviewed step (disclosed).
//
// It PERMITS NOTHING beyond local synthetic-queue writes: no provider call, no traffic
// movement, no production mutation, no merge, no deployment — the facade materializes
// no event database, and every identity is a synthetic fixture.

import {
  assertEventPlaneInvariants, EVENT_PLANE_POLICY,
  type DistributedEventPlanePlan,
} from './event-plane-contract';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';

export const EVENT_PLANE_ADAPTER_GUARDRAILS = Object.freeze({
  adoptionRequiresOperatorReceipt: true,
  everyStreamActivationRequiresTheAdoptionReceipt: true,
  queuesAreCallerProvisioned: true,
  facadeMaterializesNoEventDatabase: true,
  placementDelegatedToThe12d123ContractOnly: true,
  replicaWritesFollowTheAdoptedPlanOnly: true,
  singleCellDegradationIsHonest: true,
  noFabricatedCoLocatedReplica: true,
  replicaCopiesAreSyntheticLocalCopies: true,
  crossQueueWritesAreNeverSilentlyAtomic: true,
  readsComeFromThePrimaryQueueOnlyInThisSlice: true,
  perDatabaseCeilingIsTheMeasuredCeiling: true, // 2,000,000 rows, enforced by each queue
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export interface EventPlaneOperativeAdoption {
  readonly kind: 'EVENT_PLANE_OPERATIVE_ADOPTION';
  readonly planDigestSha256: string;
  readonly planEpoch: string;
  readonly cellCount: number;
  readonly shardCount: number;
  readonly streamCount: number;
  readonly replicationDegraded: boolean;
  readonly adoptedBy: string;
  readonly adoptedAtMs: number;
  readonly operatorReceiptSha256: string;
  /** Adoption makes the plan operative over CALLER-PROVISIONED queues — nothing else. */
  readonly materializedByThisRuntime: false;
  readonly productionProvisioningAllowed: false;
  readonly infrastructureProvisionedByThisRuntime: 0;
  readonly guardrails: Readonly<typeof EVENT_PLANE_ADAPTER_GUARDRAILS>;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly realEventStreamsActivated: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

export interface EventPlaneStreamActivationPacket {
  readonly kind: 'EVENT_PLANE_STREAM_ACTIVATED';
  readonly planEpoch: string;
  readonly shardId: number;
  readonly primaryCellId: string;
  readonly replicaCellId: string | null;
  readonly singleCopyDegraded: boolean;
  readonly onboardingIsSyntheticFixtureOnly: true;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly realEventStreamsActivated: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

export interface EventPlaneAppendResult {
  readonly kind: 'EVENT_PLANE_EVENT_APPENDED';
  readonly shardId: number;
  readonly primaryCellId: string;
  readonly replicaCellId: string | null;
  readonly insertedPrimary: number;
  /** null when the adopted plane carries no replica for this stream. */
  readonly insertedReplica: number | null;
  readonly singleCopyDegraded: boolean;
  readonly replicaCopiesAreSyntheticLocalCopies: true;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly realEventStreamsActivated: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

const hex64 = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const identity = (v: unknown): v is string =>
  typeof v === 'string' && v.length >= 1 && v.length <= EVENT_PLANE_POLICY.maxAdoptedByChars
  && /^[A-Za-z0-9_.:@-]+$/.test(v);
const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);

// The adoption record binds the plan's CONTENT, not just its counts: a canonical,
// stream-order-insensitive sha256 over everything the plan object carries. A facade
// later refuses any presented plan whose digest differs from the adopted one — even
// a structurally valid sibling plan with identical counts.
// EXPORTED (12D-222): the event-plane content digest, so the instruction-side
// adoption gate re-derives against the EXACT same canonical preimage instead of a
// divergent copy.
export const eventPlanePlanDigestOf = (plan: Readonly<DistributedEventPlanePlan>): string =>
  createHash('sha256').update(JSON.stringify({
    kind: plan.kind,
    epoch: plan.epoch,
    cellCount: plan.cellCount,
    shardCount: plan.shardCount,
    replicationDegraded: plan.replicationDegraded,
    totals: plan.totals,
    streams: [...plan.streams]
      .sort((a, b) => a.shardId - b.shardId)
      .map((s) => ({
        shardId: s.shardId,
        primaryCellId: s.primaryCellId,
        replicaCellId: s.replicaCellId,
        projectedEventRows: s.projectedEventRows,
      })),
  })).digest('hex');

/**
 * Receipt-gated OPERATIVE adoption of a 12D-123 event-plane plan. The plan is
 * UNTRUSTED input: it is re-asserted through the contract's own invariants, and the
 * adoption record binds the epoch, cell/shard/stream counts, and the replication
 * posture it was adopted under — a later facade refuses any packet that disagrees.
 * The record authorizes nothing by itself: an EventRoutedStreams facade must still be
 * constructed with caller-provisioned queues before any event moves.
 */
export function adoptEventPlaneOperatively(
  plan: Readonly<DistributedEventPlanePlan>,
  input: { operatorReceiptSha256: string; adoptedBy: string; adoptedAtMs: number },
): Readonly<EventPlaneOperativeAdoption> {
  if (!plan || typeof plan !== 'object' || !Object.isFrozen(plan) || plan.kind !== 'DISTRIBUTED_EVENT_PLANE_PLAN')
    throw new Error('a frozen DISTRIBUTED_EVENT_PLANE_PLAN is required; fail closed');
  assertEventPlaneInvariants(plan);
  if (!input || typeof input !== 'object')
    throw new Error('adoption input required; fail closed');
  if (!hex64(input.operatorReceiptSha256))
    throw new Error('event-plane operative adoption requires a 64-hex sha256 operator receipt; fail closed');
  if (!identity(input.adoptedBy))
    throw new Error('adopter identity invalid; fail closed');
  if (!safeInt(input.adoptedAtMs) || input.adoptedAtMs <= 0)
    throw new Error('adoption timestamp invalid; fail closed');
  return Object.freeze({
    kind: 'EVENT_PLANE_OPERATIVE_ADOPTION' as const,
    planDigestSha256: eventPlanePlanDigestOf(plan),
    planEpoch: plan.epoch,
    cellCount: plan.cellCount,
    shardCount: plan.shardCount,
    streamCount: plan.streams.length,
    replicationDegraded: plan.replicationDegraded,
    adoptedBy: input.adoptedBy,
    adoptedAtMs: input.adoptedAtMs,
    operatorReceiptSha256: input.operatorReceiptSha256,
    materializedByThisRuntime: false as const,
    productionProvisioningAllowed: false as const,
    infrastructureProvisionedByThisRuntime: 0 as const,
    guardrails: EVENT_PLANE_ADAPTER_GUARDRAILS,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    realEventStreamsActivated: 0 as const,
    billionUsersProven: false as const,
    automaticRecovery: false as const,
  });
}

interface StreamState {
  readonly shardId: number;
  readonly primaryCellId: string;
  readonly replicaCellId: string | null;
  readonly primary: OfflineStoryQueue;
  readonly replica: OfflineStoryQueue | null;
}

/**
 * The reviewed adapter that makes an adopted 12D-123 event-plane plan OPERATIVE over
 * caller-provisioned local OfflineStoryQueue instances. The facade opens no database
 * and performs no placement math: every cell decision is read from the adopted plan,
 * and every activation is receipt-gated. Fail-closed on unadopted or inconsistent
 * packets, missing/duplicated/shared queues, a replica queue offered to a degraded
 * plan, a missing replica queue for a replicated stream, unactivated streams, and
 * wrong receipts.
 */
export class EventRoutedStreams {
  readonly #adoption: Readonly<EventPlaneOperativeAdoption>;
  readonly #plan: Readonly<DistributedEventPlanePlan>;
  readonly #receipt: string;
  readonly #streams = new Map<number, StreamState>();
  readonly #activated = new Set<number>();

  constructor(input: {
    adoption: Readonly<EventPlaneOperativeAdoption>;
    plan: Readonly<DistributedEventPlanePlan>;
    streamQueues: ReadonlyMap<number, OfflineStoryQueue>;
    /** REQUIRED (may be empty only for a degraded plan): shard id → replica-hosted queue. */
    replicaQueues: ReadonlyMap<number, OfflineStoryQueue>;
  }) {
    const adoption = input?.adoption;
    if (!adoption || adoption.kind !== 'EVENT_PLANE_OPERATIVE_ADOPTION' || !Object.isFrozen(adoption))
      throw new Error('an adopted event-plane record is required; the plane is never operative without adoption');
    const plan = input?.plan;
    if (!plan || !Object.isFrozen(plan) || plan.kind !== 'DISTRIBUTED_EVENT_PLANE_PLAN')
      throw new Error('a frozen DISTRIBUTED_EVENT_PLANE_PLAN is required; fail closed');
    assertEventPlaneInvariants(plan);
    // The presented plan must be the plan the operator adopted — not a sibling packet.
    // The content digest is the binding gate (a structurally valid plan with identical
    // counts but different placements or projections still differs); the field match is
    // defense in depth.
    if (eventPlanePlanDigestOf(plan) !== adoption.planDigestSha256
      || plan.epoch !== adoption.planEpoch || plan.shardCount !== adoption.shardCount
      || plan.cellCount !== adoption.cellCount || plan.streams.length !== adoption.streamCount
      || plan.replicationDegraded !== adoption.replicationDegraded)
      throw new Error('the presented plan does not match the adoption record; inconsistent packets; fail closed');

    const queueMap = input.streamQueues;
    if (!queueMap || !(queueMap instanceof Map)) throw new Error('stream queue map required');
    if (queueMap.size !== plan.streams.length)
      throw new Error('stream queue map does not match the adopted stream count; fail closed');
    const replicaMap = input.replicaQueues;
    if (!replicaMap || !(replicaMap instanceof Map)) throw new Error('replica queue map required (use an empty map for a degraded plane)');
    if (plan.replicationDegraded && replicaMap.size > 0)
      throw new Error('the adopted plane is replication-degraded; a replica queue would fabricate a co-located copy; fail closed');

    for (const stream of plan.streams) {
      const primary = queueMap.get(stream.shardId);
      if (primary === undefined)
        throw new Error(`stream ${stream.shardId} has no provisioned queue; operator provisioning required`);
      if (!(primary instanceof OfflineStoryQueue))
        throw new Error(`stream ${stream.shardId} is not an OfflineStoryQueue; fail closed`);
      let replica: OfflineStoryQueue | null = null;
      if (stream.replicaCellId !== null) {
        replica = replicaMap.get(stream.shardId) ?? null;
        if (replica === null)
          throw new Error(`stream ${stream.shardId} is replicated to cell ${stream.replicaCellId} but has no provisioned replica queue; fail closed`);
        if (!(replica instanceof OfflineStoryQueue))
          throw new Error(`stream ${stream.shardId} replica is not an OfflineStoryQueue; fail closed`);
      }
      this.#streams.set(stream.shardId, Object.freeze({
        shardId: stream.shardId,
        primaryCellId: stream.primaryCellId,
        replicaCellId: stream.replicaCellId,
        primary,
        replica,
      }));
    }
    // Distinctness across EVERYTHING: two shard queues sharing one instance (or a
    // primary doubling as its own replica) would collapse per-database ceiling
    // accounting and the per-shard singleton lease.
    const allQueues = [...queueMap.values(), ...replicaMap.values()];
    if (new Set(allQueues).size !== allQueues.length)
      throw new Error('stream queues and replica queues must be distinct instances; fail closed');
    if (replicaMap.size !== plan.streams.filter((s) => s.replicaCellId !== null).length)
      throw new Error('replica queue map does not match the adopted replication posture; fail closed');
    this.#adoption = adoption;
    this.#plan = plan;
    this.#receipt = adoption.operatorReceiptSha256;
  }

  get adoption(): Readonly<EventPlaneOperativeAdoption> { return this.#adoption; }
  get plan(): Readonly<DistributedEventPlanePlan> { return this.#plan; }
  get activatedStreamIds(): readonly number[] { return [...this.#activated].sort((a, b) => a - b); }

  /**
   * Activate one stream for writes, receipt-gated per call (the receipt must be the
   * adoption's). The activation is a decision record: it opens nothing and moves
   * nothing — the queue was already caller-provisioned.
   */
  activateStream(shardId: number, operatorReceiptSha256: string): Readonly<EventPlaneStreamActivationPacket> {
    const stream = this.#streams.get(shardId);
    if (!stream) throw new Error(`shard ${shardId} is not part of the adopted event plane; fail closed`);
    if (operatorReceiptSha256 !== this.#receipt)
      throw new Error('activation receipt does not match the adoption receipt; operator decision required per change');
    if (this.#activated.has(shardId)) throw new Error(`stream ${shardId} is already activated`);
    this.#activated.add(shardId);
    return Object.freeze({
      kind: 'EVENT_PLANE_STREAM_ACTIVATED' as const,
      planEpoch: this.#plan.epoch,
      shardId,
      primaryCellId: stream.primaryCellId,
      replicaCellId: stream.replicaCellId,
      singleCopyDegraded: this.#plan.replicationDegraded,
      onboardingIsSyntheticFixtureOnly: true,
      humanDecision: 'REQUIRED' as const,
      learningPromoted: false as const,
      modelCalls: 0 as const,
      remoteCalls: 0 as const,
      realEventStreamsActivated: 0 as const,
      billionUsersProven: false as const,
      automaticRecovery: false as const,
    });
  }

  /**
   * Append one event to its stream: the primary queue first, then the replica queue
   * when (and only when) the adopted plan carries one. NOT atomic across the pair —
   * a replica failure after a primary commit is reported with exactly what landed.
   */
  appendEvent(shardId: number, story: OfflineStory): Readonly<EventPlaneAppendResult> {
    const stream = this.#streams.get(shardId);
    if (!stream) throw new Error(`shard ${shardId} is not part of the adopted event plane; fail closed`);
    if (!this.#activated.has(shardId))
      throw new Error(`stream ${shardId} is not activated; activateStream is required before any event moves`);
    const primaryResult = stream.primary.enqueue([story]);
    let insertedReplica: number | null = null;
    if (stream.replica !== null) {
      try {
        insertedReplica = stream.replica.enqueue([story]).inserted;
      } catch (error) {
        throw new Error(
          `event-plane replica write failed on shard ${shardId}: ${error instanceof Error ? error.message : 'unknown error'}; `
          + `the primary copy committed durably (${primaryResult.inserted} inserted); the pair is not atomic; operator review required`,
        );
      }
    }
    return Object.freeze({
      kind: 'EVENT_PLANE_EVENT_APPENDED' as const,
      shardId,
      primaryCellId: stream.primaryCellId,
      replicaCellId: stream.replicaCellId,
      insertedPrimary: primaryResult.inserted,
      insertedReplica,
      singleCopyDegraded: this.#plan.replicationDegraded,
      replicaCopiesAreSyntheticLocalCopies: true,
      humanDecision: 'REQUIRED' as const,
      learningPromoted: false as const,
      modelCalls: 0 as const,
      remoteCalls: 0 as const,
      realEventStreamsActivated: 0 as const,
      billionUsersProven: false as const,
      automaticRecovery: false as const,
    });
  }

  /** Claim through the owning stream's PRIMARY queue and its own singleton lease, unchanged policy. */
  claimNext(shardId: number, tenantId: string, roleId: string, ownerId: string, durationMs = 120_000) {
    const stream = this.#streams.get(shardId);
    if (!stream) throw new Error(`shard ${shardId} is not part of the adopted event plane; fail closed`);
    if (!this.#activated.has(shardId))
      throw new Error(`stream ${shardId} is not activated; activateStream is required before any claim`);
    return stream.primary.claimNext(tenantId, roleId, ownerId, durationMs);
  }
}