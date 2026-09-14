// 12D-136 — focused tests for CELL-PLACEMENT ADOPTION & EVENT-PLANE BINDING.
// Coverage: receipt-gated adoption with content binding, cross-contract binding of
// an event-plane plan to the adopted cells (composing plan digest-gated), and
// honest flags.

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  planRegionalCells, shardCellId, assertCellPlanInvariants, type RegionalCellPlacementPlan,
} from './regional-cell-contract';
import { planEventPlane, type DistributedEventPlanePlan } from './event-plane-contract';
import { PARTITION_POLICY, type QueueRouting } from './queue-partition-contract';
import {
  adoptCellPlacementOperatively, bindEventPlaneToAdoptedCells, CELL_PLACEMENT_ADAPTER_GUARDRAILS,
} from './cell-placement-adapter';

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

const multiCellPlan = (): Readonly<RegionalCellPlacementPlan> => planRegionalCells(routing, 2);
const singleCellPlan = (): Readonly<RegionalCellPlacementPlan> => planRegionalCells(routing, 1);

const adopt = (plan: Readonly<RegionalCellPlacementPlan>) =>
  adoptCellPlacementOperatively(plan, { operatorReceiptSha256: RECEIPT, adoptedBy: 'ceo', adoptedAtMs: NOW });

const planeOver = (cells: number): DistributedEventPlanePlan =>
  planEventPlane(routing, planRegionalCells(routing, cells));

test('12d-136 cell adoption is receipt-gated, plan-re-asserted, content-bound, and frozen', () => {
  const plan = multiCellPlan();
  for (const bad of [
    { operatorReceiptSha256: 'not-a-receipt', adoptedBy: 'ceo', adoptedAtMs: NOW },
    { operatorReceiptSha256: 'a'.repeat(63), adoptedBy: 'ceo', adoptedAtMs: NOW },
    { operatorReceiptSha256: RECEIPT, adoptedBy: '', adoptedAtMs: NOW },
    { operatorReceiptSha256: RECEIPT, adoptedBy: 'bad identity!', adoptedAtMs: NOW },
    { operatorReceiptSha256: RECEIPT, adoptedBy: 'ceo', adoptedAtMs: -1 },
  ]) assert.throws(() => adoptCellPlacementOperatively(plan, bad), /receipt|identity|timestamp/);
  // An unfrozen plan is refused before adoption.
  assert.throws(() => adoptCellPlacementOperatively({ ...plan } as RegionalCellPlacementPlan, {
    operatorReceiptSha256: RECEIPT, adoptedBy: 'ceo', adoptedAtMs: NOW,
  }), /frozen REGIONAL_CELL_PLACEMENT_PLAN/);
  // A plan whose invariants were violated after freezing is re-asserted and refused:
  // a shard moved against the deterministic placement rule.
  const forged = Object.freeze({
    ...plan,
    cells: Object.freeze(plan.cells.map((c, i) => (i === 0
      ? Object.freeze({ ...c, shardIds: Object.freeze([c.shardIds[0], (c.shardIds[0] + 1) % 4]) })
      : c))),
  }) as RegionalCellPlacementPlan;
  assert.throws(() => adoptCellPlacementOperatively(forged, {
    operatorReceiptSha256: RECEIPT, adoptedBy: 'ceo', adoptedAtMs: NOW,
  }));
  const adoption = adopt(plan);
  assert.equal(adoption.kind, 'CELL_PLACEMENT_OPERATIVE_ADOPTION');
  assert.equal(/^[0-9a-f]{64}$/.test(adoption.planDigestSha256), true);
  assert.equal(adoption.epoch, EPOCH);
  assert.equal(adoption.cellCount, 2);
  assert.equal(adoption.shardCount, 4);
  assert.equal(adoption.totals.tenants, 4);
  assert.equal(adoption.materializedByThisRuntime, false);
  assert.equal(adoption.productionProvisioningAllowed, false);
  assert.equal(adoption.infrastructureProvisionedByThisRuntime, 0);
  assert.equal(adoption.realCellsProvisioned, 0);
  assert.equal(adoption.humanDecision, 'REQUIRED');
  assert.equal(adoption.learningPromoted, false);
  assert.equal(adoption.modelCalls, 0);
  assert.equal(adoption.remoteCalls, 0);
  assert.equal(adoption.billionUsersProven, false);
  assert.equal(adoption.automaticRecovery, false);
  assert.equal(Object.isFrozen(adoption), true);
});

test('12d-136 the adoption digest binds plan content, not just counts', () => {
  const plan = multiCellPlan();
  const adoption = adopt(plan);
  // A structurally valid sibling plan with the SAME counts but misstated projections
  // (which the 12D-120 invariants cannot re-derive — the plan carries no routing)
  // must produce a DIFFERENT digest.
  const tampered = Object.freeze({
    ...plan,
    cells: Object.freeze(plan.cells.map((c, i) => (i === 0
      ? Object.freeze({ ...c, projectedRows: c.projectedRows + 1000 })
      : c))),
    totals: Object.freeze({ ...plan.totals, projectedRows: plan.totals.projectedRows + 1000 }),
  }) as RegionalCellPlacementPlan;
  assert.doesNotThrow(() => assertCellPlanInvariants(tampered));
  assert.notEqual(adopt(tampered).planDigestSha256, adoption.planDigestSha256);
  // Shuffling the cell array order does NOT change the digest (canonical,
  // order-insensitive) — the placement is the same placement.
  const reordered = Object.freeze({
    ...plan, cells: Object.freeze([...plan.cells].reverse()),
    totals: Object.freeze({ ...plan.totals }),
  }) as RegionalCellPlacementPlan;
  assert.equal(adopt(reordered).planDigestSha256, adoption.planDigestSha256);
});

test('12d-136 binding re-derives the composing plan against the adoption and issues a record', () => {
  const plan = multiCellPlan();
  const adoption = adopt(plan);
  const plane = planeOver(2);
  const binding = bindEventPlaneToAdoptedCells(plane, adoption, planRegionalCells(routing, 2));
  assert.equal(binding.kind, 'EVENT_PLANE_CELL_BINDING');
  assert.equal(binding.planEpoch, EPOCH);
  assert.equal(binding.cellPlanDigestSha256, adoption.planDigestSha256);
  assert.equal(binding.cellCount, 2);
  assert.equal(binding.shardCount, 4);
  assert.equal(binding.streamCount, 4);
  assert.equal(binding.replicatedStreamCount, 4);
  assert.equal(binding.streamsReDerivedAgainstAdoptedCells, 4);
  assert.equal(binding.infrastructureMaterializedByThisBinding, 0);
  assert.equal(binding.realEventStreamsActivated, 0);
  assert.equal(binding.humanDecision, 'REQUIRED');
  assert.equal(binding.modelCalls, 0);
  assert.equal(binding.remoteCalls, 0);
  assert.equal(binding.billionUsersProven, false);
  assert.equal(binding.automaticRecovery, false);
  // The re-derivation is exactly the 12D-120 rule, spot-checked independently.
  assert.equal(shardCellId(2, 0), 'cell-0');
  assert.equal(shardCellId(2, 3), 'cell-1');
});

test('12d-136 binding fails closed on unadopted planes and unadopted composing plans', () => {
  const adoption = adopt(multiCellPlan());
  const plane = planeOver(2);
  // An unfrozen event-plane plan is refused.
  assert.throws(() => bindEventPlaneToAdoptedCells({ ...plane } as DistributedEventPlanePlan,
    adoption, multiCellPlan()), /frozen DISTRIBUTED_EVENT_PLANE_PLAN/);
  // A non-adoption record cannot bind anything.
  assert.throws(() => bindEventPlaneToAdoptedCells(plane, {
    ...adoption,
    kind: 'NOT_AN_ADOPTION',
  } as unknown as typeof adoption, multiCellPlan()), /adopted cell-placement record/);
  // The composing cell plan is REQUIRED.
  assert.throws(() => bindEventPlaneToAdoptedCells(plane, adoption,
    undefined as unknown as RegionalCellPlacementPlan), /composing/);
  // A plane composed from a DIFFERENT cell plan than the one adopted is refused on
  // the digest — even though the plane itself is internally consistent.
  assert.throws(() => bindEventPlaneToAdoptedCells(plane, adoption, singleCellPlan()),
    /composing cell plan does not match the adopted placement record/);
  // A forged adoption digest (counts intact, content wrong) refuses the same way.
  const forgedAdoption = Object.freeze({
    ...adoption,
    planDigestSha256: 'f'.repeat(64),
  }) as typeof adoption;
  assert.throws(() => bindEventPlaneToAdoptedCells(plane, forgedAdoption, multiCellPlan()),
    /does not match the adopted placement record/);
  // An event-plane cell-count mismatch (with a digest-valid composing plan) is refused.
  assert.throws(() => bindEventPlaneToAdoptedCells(planeOver(1), adoption, multiCellPlan()),
    /cell count does not match/);
  // An unfrozen composing cell plan is refused.
  assert.throws(() => bindEventPlaneToAdoptedCells(plane, adoption,
    { ...multiCellPlan() } as RegionalCellPlacementPlan),
    /composing REGIONAL_CELL_PLACEMENT_PLAN is required/);
});

test('12d-136 binding re-derivation refuses wrong primaries, co-located replicas, and outside replicas', () => {
  const adoption = adopt(multiCellPlan());
  const composing = multiCellPlan();
  const plane = planeOver(2);
  // A plane whose stream 0 names the WRONG primary cell: the 12D-123 invariants
  // already re-derive per-stream placement, so this is refused before the binding's
  // own re-derivation runs — fail closed either way, and the binding re-derives
  // independently as defense in depth.
  const wrongPrimary = Object.freeze({
    ...plane,
    streams: Object.freeze(plane.streams.map((s, i) => (i === 0
      ? Object.freeze({ ...s, primaryCellId: 'cell-1' })
      : s))),
  }) as DistributedEventPlanePlan;
  assert.throws(() => bindEventPlaneToAdoptedCells(wrongPrimary, adoption, composing),
    /deterministic|fail closed/);
  // A replica on the stream's own primary cell.
  const colocated = Object.freeze({
    ...plane,
    streams: Object.freeze(plane.streams.map((s, i) => (i === 0
      ? Object.freeze({ ...s, replicaCellId: s.primaryCellId })
      : s))),
  }) as DistributedEventPlanePlan;
  assert.throws(() => bindEventPlaneToAdoptedCells(colocated, adoption, composing),
    /deterministic|co-located/);
  // A replica pointing outside the adopted placement.
  const outsidePlacement = Object.freeze({
    ...plane,
    streams: Object.freeze(plane.streams.map((s, i) => (i === 0
      ? Object.freeze({ ...s, replicaCellId: 'cell-99' })
      : s))),
  }) as DistributedEventPlanePlan;
  assert.throws(() => bindEventPlaneToAdoptedCells(outsidePlacement, adoption, composing),
    /deterministic|outside the adopted/);
});

test('12d-136 a degraded single-cell adoption binds only a degraded plane, honestly', () => {
  const plan = singleCellPlan();
  const adoption = adopt(plan);
  assert.equal(adoption.cellCount, 1);
  const plane = planeOver(1);
  const binding = bindEventPlaneToAdoptedCells(plane, adoption, planRegionalCells(routing, 1));
  assert.equal(binding.cellCount, 1);
  assert.equal(binding.replicatedStreamCount, 0);
  assert.equal(binding.streamsReDerivedAgainstAdoptedCells, 4);
  // A MULTI-cell plane cannot bind a single-cell adoption (the composing plan is
  // digest-valid for the adoption, so the cell-count gate is what fires).
  assert.throws(() => bindEventPlaneToAdoptedCells(planeOver(2), adoption, singleCellPlan()),
    /cell count does not match/);
});

test('12d-136 honest flags and guardrails: the adapter permits nothing', () => {
  const adoption = adopt(multiCellPlan());
  assert.equal(adoption.realCellsProvisioned, 0);
  assert.equal(adoption.humanDecision, 'REQUIRED');
  assert.equal(adoption.learningPromoted, false);
  assert.equal(adoption.modelCalls, 0);
  assert.equal(adoption.remoteCalls, 0);
  assert.equal(adoption.billionUsersProven, false);
  assert.equal(adoption.automaticRecovery, false);
  assert.equal(CELL_PLACEMENT_ADAPTER_GUARDRAILS.adoptionRequiresOperatorReceipt, true);
  assert.equal(CELL_PLACEMENT_ADAPTER_GUARDRAILS.bindsThePlanContentNotJustItsCounts, true);
  assert.equal(CELL_PLACEMENT_ADAPTER_GUARDRAILS.placementDelegatedToThe12d120ContractOnly, true);
  assert.equal(CELL_PLACEMENT_ADAPTER_GUARDRAILS.eventPlaneStreamsMustReDeriveAgainstTheAdoptedCells, true);
  assert.equal(CELL_PLACEMENT_ADAPTER_GUARDRAILS.replicaCellsMustDifferFromPrimaryCells, true);
  assert.equal(CELL_PLACEMENT_ADAPTER_GUARDRAILS.noFabricatedCoLocatedReplica, true);
  assert.equal(CELL_PLACEMENT_ADAPTER_GUARDRAILS.materializesNoInfrastructure, true);
  assert.equal(CELL_PLACEMENT_ADAPTER_GUARDRAILS.bindingIsARecordItAuthorizesNothingByItself, true);
  assert.equal(CELL_PLACEMENT_ADAPTER_GUARDRAILS.zeroModelCalls, true);
  assert.equal(CELL_PLACEMENT_ADAPTER_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(CELL_PLACEMENT_ADAPTER_GUARDRAILS.automaticRecovery, false);
  assert.equal(CELL_PLACEMENT_ADAPTER_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(Object.isFrozen(CELL_PLACEMENT_ADAPTER_GUARDRAILS), true);
  assert.equal(adoption.guardrails, CELL_PLACEMENT_ADAPTER_GUARDRAILS);
  // The measured ceiling is untouched: per DATABASE, 2,000,000 rows (12D-103 drill).
  assert.equal(PARTITION_POLICY.maxRowsPerShard, 2_000_000);
});