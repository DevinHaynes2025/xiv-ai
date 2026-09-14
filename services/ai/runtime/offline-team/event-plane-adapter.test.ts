// 12D-135 — focused tests for the EVENT-PLANE ADOPTION LAYER.
// Coverage: operative adoption, facade provisioning gates, receipt-gated per-stream
// activation, replicated vs degraded appends, non-atomic replica failure disclosure,
// claim delegation, honest flags.

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  planEventPlane, assertEventPlaneInvariants, type DistributedEventPlanePlan,
} from './event-plane-contract';
import { planRegionalCells } from './regional-cell-contract';
import { PARTITION_POLICY, type QueueRouting } from './queue-partition-contract';
import {
  adoptEventPlaneOperatively, EventRoutedStreams, EVENT_PLANE_ADAPTER_GUARDRAILS,
} from './event-plane-adapter';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';

const NOW = 1_700_000_000_000;
const RECEIPT = 'a'.repeat(64);
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

const multiCellPlan = (): DistributedEventPlanePlan =>
  planEventPlane(routing, planRegionalCells(routing, 2));
const degradedPlan = (): DistributedEventPlanePlan =>
  planEventPlane(routing, planRegionalCells(routing, 1));

const adopt = (plan: DistributedEventPlanePlan) =>
  adoptEventPlaneOperatively(plan, { operatorReceiptSha256: RECEIPT, adoptedBy: 'ceo', adoptedAtMs: NOW });

const story = (id: string, tenantId: string): OfflineStory => ({
  id, tenantId, roleId: 'node_backend',
  objective: `Synthetic routed event draft ${id}`, acceptance: ['Must pass the fixture test'],
  dependencies: [], sourceRevision: 'b'.repeat(40), masterPlanSha256: 'c'.repeat(64),
  kind: 'PRODUCT_STORY', securityClass: 'ORDINARY',
});

const closeQueues = (...maps: Array<ReadonlyMap<number, OfflineStoryQueue>>) => {
  for (const m of maps) for (const q of m.values()) { try { q.close(); } catch { /* Windows handle lag */ } }
};

const provision = (dir: string, plan: DistributedEventPlanePlan) => {
  const streamQueues = new Map<number, OfflineStoryQueue>();
  const replicaQueues = new Map<number, OfflineStoryQueue>();
  for (const s of plan.streams) {
    streamQueues.set(s.shardId, new OfflineStoryQueue(join(dir, `primary-${s.shardId}.sqlite`), () => NOW));
    if (s.replicaCellId !== null)
      replicaQueues.set(s.shardId, new OfflineStoryQueue(join(dir, `replica-${s.shardId}.sqlite`), () => NOW));
  }
  return { streamQueues, replicaQueues };
};

const mkFacade = (dir: string, plan: DistributedEventPlanePlan) => {
  const { streamQueues, replicaQueues } = provision(dir, plan);
  const adoption = adopt(plan);
  const facade = new EventRoutedStreams({ adoption, plan, streamQueues, replicaQueues });
  return { adoption, plan, streamQueues, replicaQueues, facade };
};

test('12d-135 operative adoption is receipt-gated, plan-re-asserted, and frozen with honest flags', () => {
  const plan = multiCellPlan();
  for (const bad of [
    { operatorReceiptSha256: 'not-a-receipt', adoptedBy: 'ceo', adoptedAtMs: NOW },
    { operatorReceiptSha256: 'a'.repeat(63), adoptedBy: 'ceo', adoptedAtMs: NOW },
    { operatorReceiptSha256: RECEIPT, adoptedBy: '', adoptedAtMs: NOW },
    { operatorReceiptSha256: RECEIPT, adoptedBy: 'bad identity!', adoptedAtMs: NOW },
    { operatorReceiptSha256: RECEIPT, adoptedBy: 'ceo', adoptedAtMs: -1 },
  ]) assert.throws(() => adoptEventPlaneOperatively(plan, bad), /receipt|identity|timestamp/);
  // An unfrozen (or tampered) plan is refused before adoption.
  assert.throws(() => adoptEventPlaneOperatively({ ...plan } as DistributedEventPlanePlan, {
    operatorReceiptSha256: RECEIPT, adoptedBy: 'ceo', adoptedAtMs: NOW,
  }), /frozen DISTRIBUTED_EVENT_PLANE_PLAN/);
  // A plan whose invariants were violated after freezing is re-asserted and refused.
  const forged = Object.freeze({
    ...plan,
    streams: Object.freeze(plan.streams.map((s, i) => (i === 0
      ? Object.freeze({ ...s, replicaCellId: s.primaryCellId }) : s))),
  }) as DistributedEventPlanePlan;
  assert.throws(() => adoptEventPlaneOperatively(forged, {
    operatorReceiptSha256: RECEIPT, adoptedBy: 'ceo', adoptedAtMs: NOW,
  }));
  const adoption = adopt(plan);
  assert.equal(adoption.kind, 'EVENT_PLANE_OPERATIVE_ADOPTION');
  assert.equal(adoption.planEpoch, EPOCH);
  // The adoption binds the plan's CONTENT: a 64-hex digest over the canonical plan.
  assert.equal(/^[0-9a-f]{64}$/.test(adoption.planDigestSha256), true);
  assert.equal(adoption.cellCount, 2);
  assert.equal(adoption.shardCount, 4);
  assert.equal(adoption.streamCount, 4);
  assert.equal(adoption.replicationDegraded, false);
  assert.equal(adoption.materializedByThisRuntime, false);
  assert.equal(adoption.productionProvisioningAllowed, false);
  assert.equal(adoption.infrastructureProvisionedByThisRuntime, 0);
  assert.equal(adoption.realEventStreamsActivated, 0);
  assert.equal(adoption.humanDecision, 'REQUIRED');
  assert.equal(adoption.learningPromoted, false);
  assert.equal(adoption.modelCalls, 0);
  assert.equal(adoption.remoteCalls, 0);
  assert.equal(adoption.billionUsersProven, false);
  assert.equal(adoption.automaticRecovery, false);
  assert.equal(Object.isFrozen(adoption), true);
});

test('12d-135 the facade fails closed on missing, duplicated, extra, or replica-mismatched queues', () => {
  const plan = multiCellPlan();
  const adoption = adopt(plan);
  const dir = mkdtempSync(join(tmpdir(), 'xiv-epa-gates-'));
  const { streamQueues, replicaQueues } = provision(dir, plan);
  try {
    // Missing one primary queue (count held constant by a stand-in at another id so
    // the per-stream gate — not the count gate — is what fires).
    const missing = new Map(streamQueues);
    missing.delete(2);
    missing.set(99, streamQueues.get(0)!);
    assert.throws(() => new EventRoutedStreams({ adoption, plan, streamQueues: missing, replicaQueues }),
      /stream 2 has no provisioned queue/);
    // A shared queue instance between a primary and a replica would collapse ceiling
    // accounting: fail closed.
    const shared = new Map(replicaQueues);
    shared.set(0, streamQueues.get(0)!);
    assert.throws(() => new EventRoutedStreams({ adoption, plan, streamQueues, replicaQueues: shared }),
      /distinct instances/);
    // A replica queue offered to a DEGRADED plane fabricates a co-located copy: fail closed.
    const degraded = degradedPlan();
    const degradedAdoption = adopt(degraded);
    const degradedQueues = new Map<number, OfflineStoryQueue>();
    for (const s of degraded.streams) degradedQueues.set(s.shardId, streamQueues.get(s.shardId)!);
    assert.throws(() => new EventRoutedStreams({
      adoption: degradedAdoption, plan: degraded, streamQueues: degradedQueues, replicaQueues,
    }), /replication-degraded/);
    // A replicated stream missing its replica queue: fail closed.
    const noReplicas = new Map<number, OfflineStoryQueue>();
    assert.throws(() => new EventRoutedStreams({ adoption, plan, streamQueues, replicaQueues: noReplicas }),
      /no provisioned replica queue/);
    // A presented plan that disagrees with the adoption record: fail closed.
    assert.throws(() => new EventRoutedStreams({
      adoption, plan: degraded, streamQueues, replicaQueues,
    }), /does not match the adoption record/);
    // A CONTENT-tampered plan that still satisfies every structural gate — identical
    // counts, identical totals, per-stream rows under the ceiling — still differs from
    // the adopted digest: fail closed.
    const rows = plan.streams.map((s) => s.projectedEventRows);
    const swap01 = plan.streams.findIndex((s) => s.shardId === 1);
    const swap03 = plan.streams.findIndex((s) => s.shardId === 3);
    const tamperedStreams = plan.streams.map((s, i) => (i === swap01
      ? Object.freeze({ ...s, projectedEventRows: plan.streams[swap03].projectedEventRows })
      : (i === swap03
        ? Object.freeze({ ...s, projectedEventRows: plan.streams[swap01].projectedEventRows })
        : s)));
    const tampered = Object.freeze({
      ...plan, streams: Object.freeze(tamperedStreams),
      totals: Object.freeze({ ...plan.totals }),
    }) as DistributedEventPlanePlan;
    assert.doesNotThrow(() => assertEventPlaneInvariants(tampered));
    assert.throws(() => new EventRoutedStreams({ adoption, plan: tampered, streamQueues, replicaQueues }),
      /does not match the adoption record/);
    // A wrong-count queue map: fail closed.
    const wrongCount = new Map(streamQueues);
    wrongCount.set(99, streamQueues.get(0)!);
    assert.throws(() => new EventRoutedStreams({ adoption, plan, streamQueues: wrongCount, replicaQueues }),
      /distinct instances|does not match the adopted stream count/);
    assert.doesNotThrow(() => assertEventPlaneInvariants(plan));
  } finally {
    closeQueues(streamQueues, replicaQueues);
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12d-135 happy path: receipt-gated activations and dual-copy appends on a multi-cell plane', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-epa-happy-'));
  try {
    const { facade, streamQueues, replicaQueues } = mkFacade(dir, multiCellPlan());
    // Activation is receipt-gated per stream.
    for (const shardId of [0, 1, 2, 3]) {
      const packet = facade.activateStream(shardId, RECEIPT);
      assert.equal(packet.kind, 'EVENT_PLANE_STREAM_ACTIVATED');
      assert.equal(packet.planEpoch, EPOCH);
      assert.equal(packet.singleCopyDegraded, false);
      assert.ok(packet.replicaCellId !== null);
      assert.equal(packet.onboardingIsSyntheticFixtureOnly, true);
    }
    assert.deepEqual(facade.activatedStreamIds, [0, 1, 2, 3]);
    // Wrong receipt, unknown shard, and double activation all fail closed.
    assert.throws(() => facade.activateStream(0, 'b'.repeat(64)), /does not match the adoption receipt/);
    assert.throws(() => facade.activateStream(7, RECEIPT), /not part of the adopted event plane/);
    assert.throws(() => facade.activateStream(0, RECEIPT), /already activated/);
    // Append moves one event to the primary AND the replica (the adopted plan's decision).
    const s0 = story('story-ev-0', 'tenant-a');
    const r = facade.appendEvent(0, s0);
    assert.equal(r.kind, 'EVENT_PLANE_EVENT_APPENDED');
    assert.equal(r.insertedPrimary, 1);
    assert.equal(r.insertedReplica, 1);
    assert.equal(r.singleCopyDegraded, false);
    assert.equal(r.replicaCopiesAreSyntheticLocalCopies, true);
    assert.equal(r.humanDecision, 'REQUIRED');
    assert.equal(r.modelCalls, 0);
    assert.equal(r.remoteCalls, 0);
    assert.equal(r.billionUsersProven, false);
    // The claim path reads the PRIMARY queue only.
    const lease = facade.claimNext(0, 'tenant-a', 'node_backend', 'owner-1');
    assert.ok(lease);
    assert.equal(lease.tenantId, 'tenant-a');
    closeQueues(streamQueues, replicaQueues);
    rmSync(dir, { recursive: true, force: true });
  } catch (e) { throw e; }
});

test('12d-135 a degraded plane writes one honest copy and never carries replicas', () => {
  const plan = degradedPlan();
  const adoption = adopt(plan);
  const dir = mkdtempSync(join(tmpdir(), 'xiv-epa-degraded-'));
  const streamQueues = new Map<number, OfflineStoryQueue>();
  try {
    for (const s of plan.streams) streamQueues.set(s.shardId, new OfflineStoryQueue(join(dir, `p-${s.shardId}.sqlite`), () => NOW));
    const facade = new EventRoutedStreams({
      adoption, plan, streamQueues, replicaQueues: new Map<number, OfflineStoryQueue>(),
    });
    const packet = facade.activateStream(1, RECEIPT);
    assert.equal(packet.singleCopyDegraded, true);
    assert.equal(packet.replicaCellId, null);
    const r = facade.appendEvent(1, story('story-ev-1', 'tenant-c'));
    assert.equal(r.insertedPrimary, 1);
    assert.equal(r.insertedReplica, null);
    assert.equal(r.singleCopyDegraded, true);
  } finally {
    closeQueues(streamQueues);
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12d-135 unactivated streams fail closed and replica failures disclose exactly what landed', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-epa-partial-'));
  const plan = multiCellPlan();
  const { streamQueues, replicaQueues, adoption, facade } = mkFacade(dir, plan);
  try {
    // Unactivated append/claim refuse before anything moves.
    assert.throws(() => facade.appendEvent(0, story('story-ev-x', 'tenant-a')), /not activated/);
    assert.throws(() => facade.claimNext(0, 'tenant-a', 'node_backend', 'owner-1'), /not activated/);
    facade.activateStream(0, RECEIPT);
    // Pre-seed the REPLICA queue with the same story id but altered content: the primary
    // commits, the replica throws a content conflict — the error must disclose it.
    const original = story('story-ev-2', 'tenant-a');
    const altered = { ...original, objective: 'altered content, same id' };
    assert.equal(replicaQueues.get(0)!.enqueue([original]).inserted, 1);
    assert.throws(() => facade.appendEvent(0, altered), (e: unknown) => {
      const msg = e instanceof Error ? e.message : '';
      return /replica write failed on shard 0/.test(msg)
        && /primary copy committed durably \(1 inserted\)/.test(msg)
        && /not atomic/.test(msg);
    });
  } finally {
    closeQueues(streamQueues, replicaQueues);
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12d-135 honest flags and guardrails: the adapter permits nothing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-epa-flags-'));
  const { facade, adoption, streamQueues, replicaQueues } = mkFacade(dir, multiCellPlan());
  try {
    assert.equal(adoption.humanDecision, 'REQUIRED');
    assert.equal(adoption.learningPromoted, false);
    assert.equal(adoption.modelCalls, 0);
    assert.equal(adoption.remoteCalls, 0);
    assert.equal(adoption.billionUsersProven, false);
    assert.equal(adoption.automaticRecovery, false);
    assert.equal(EVENT_PLANE_ADAPTER_GUARDRAILS.adoptionRequiresOperatorReceipt, true);
    assert.equal(EVENT_PLANE_ADAPTER_GUARDRAILS.everyStreamActivationRequiresTheAdoptionReceipt, true);
    assert.equal(EVENT_PLANE_ADAPTER_GUARDRAILS.queuesAreCallerProvisioned, true);
    assert.equal(EVENT_PLANE_ADAPTER_GUARDRAILS.facadeMaterializesNoEventDatabase, true);
    assert.equal(EVENT_PLANE_ADAPTER_GUARDRAILS.placementDelegatedToThe12d123ContractOnly, true);
    assert.equal(EVENT_PLANE_ADAPTER_GUARDRAILS.replicaWritesFollowTheAdoptedPlanOnly, true);
    assert.equal(EVENT_PLANE_ADAPTER_GUARDRAILS.noFabricatedCoLocatedReplica, true);
    assert.equal(EVENT_PLANE_ADAPTER_GUARDRAILS.crossQueueWritesAreNeverSilentlyAtomic, true);
    assert.equal(EVENT_PLANE_ADAPTER_GUARDRAILS.readsComeFromThePrimaryQueueOnlyInThisSlice, true);
    assert.equal(EVENT_PLANE_ADAPTER_GUARDRAILS.perDatabaseCeilingIsTheMeasuredCeiling, true);
    assert.equal(EVENT_PLANE_ADAPTER_GUARDRAILS.zeroModelCalls, true);
    assert.equal(EVENT_PLANE_ADAPTER_GUARDRAILS.zeroRemoteCalls, true);
    assert.equal(EVENT_PLANE_ADAPTER_GUARDRAILS.automaticRecovery, false);
    assert.equal(EVENT_PLANE_ADAPTER_GUARDRAILS.humanDecision, 'REQUIRED');
    assert.equal(Object.isFrozen(EVENT_PLANE_ADAPTER_GUARDRAILS), true);
    assert.equal(facade.activatedStreamIds.length, 0);
    // The per-database measured ceiling is the only ceiling this adapter inherits.
    assert.equal(PARTITION_POLICY.maxRowsPerShard, 2_000_000);
  } finally {
    closeQueues(streamQueues, replicaQueues);
    rmSync(dir, { recursive: true, force: true });
  }
});