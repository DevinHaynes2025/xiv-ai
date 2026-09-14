// 12D-136 — CELL-PLACEMENT ADOPTION & EVENT-PLANE BINDING (the cell sibling of
// 12D-119's routing adoption and 12D-135's event-plane adoption).
//
// 12D-120 groups 12D-109's shards into regional cells as a pure, fail-closed
// CONTRACT — advisory until an operator adopts it in a separately reviewed layer
// (the contract's own words). This module is that layer, in two halves:
//
//   1. `adoptCellPlacementOperatively` — receipt-gated (64-hex sha256 operator
//      receipt, per call) operative adoption of a 12D-120 cell plan. The plan is
//      UNTRUSTED input: re-asserted through the contract's own invariants, and the
//      adoption binds the plan's CONTENT — not just its counts — via a canonical,
//      order-insensitive `planDigestSha256` (the 12D-135 lesson, applied up front).
//   2. `bindEventPlaneToAdoptedCells` — the cross-contract gate that makes the
//      adoption operative: a 12D-123 event-plane plan is only bindable to an
//      ADOPTED cell placement, and every stream must RE-DERIVE against it — the
//      primary cell via the deterministic `shardCellId(cellCount, shardId)` rule
//      (no hidden placement state exists anywhere) and the replica, when present,
//      against a DIFFERENT valid cell of the same adopted placement (a replica on
//      the primary's own cell would fabricate a co-located copy).
//
// It PERMITS NOTHING beyond issuing records: no database, no network, no process,
// no region claim that hardware has ever measured, no provider call, no traffic
// movement, no production mutation, no merge, no deployment. The binding is a
// decision record for downstream operative layers (12D-135's EventRoutedStreams
// remains the separately reviewed facade that actually moves events).

import {
  assertCellPlanInvariants, REGIONAL_CELL_POLICY, shardCellId,
  type RegionalCellPlacementPlan,
} from './regional-cell-contract';
import {
  assertEventPlaneInvariants, type DistributedEventPlanePlan,
} from './event-plane-contract';
import { createHash } from 'node:crypto';

export const CELL_PLACEMENT_ADAPTER_GUARDRAILS = Object.freeze({
  adoptionRequiresOperatorReceipt: true,
  bindsThePlanContentNotJustItsCounts: true,
  placementDelegatedToThe12d120ContractOnly: true,
  eventPlaneStreamsMustReDeriveAgainstTheAdoptedCells: true,
  replicaCellsMustDifferFromPrimaryCells: true,
  noFabricatedCoLocatedReplica: true,
  materializesNoInfrastructure: true,
  bindingIsARecordItAuthorizesNothingByItself: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export interface CellPlacementOperativeAdoption {
  readonly kind: 'CELL_PLACEMENT_OPERATIVE_ADOPTION';
  readonly planDigestSha256: string;
  readonly epoch: string;
  readonly cellCount: number;
  readonly shardCount: number;
  readonly totals: Readonly<{ tenants: number; projectedRows: number }>;
  readonly adoptedBy: string;
  readonly adoptedAtMs: number;
  readonly operatorReceiptSha256: string;
  /** Adoption makes the plan available for cross-contract binding — nothing else. */
  readonly materializedByThisRuntime: false;
  readonly productionProvisioningAllowed: false;
  readonly infrastructureProvisionedByThisRuntime: 0;
  readonly realCellsProvisioned: 0;
  readonly guardrails: Readonly<typeof CELL_PLACEMENT_ADAPTER_GUARDRAILS>;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

export interface EventPlaneCellBinding {
  readonly kind: 'EVENT_PLANE_CELL_BINDING';
  readonly planEpoch: string;
  readonly cellPlanDigestSha256: string;
  readonly cellCount: number;
  readonly shardCount: number;
  readonly streamCount: number;
  readonly replicatedStreamCount: number;
  /** The binding re-derived every stream against the adopted cells; it moved nothing. */
  readonly streamsReDerivedAgainstAdoptedCells: number;
  readonly infrastructureMaterializedByThisBinding: 0;
  readonly guardrails: Readonly<typeof CELL_PLACEMENT_ADAPTER_GUARDRAILS>;
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
  typeof v === 'string' && v.length >= 1 && v.length <= REGIONAL_CELL_POLICY.maxCellIdChars
  && /^[A-Za-z0-9_.:@-]+$/.test(v);
const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);

// The adoption record binds the cell plan's CONTENT: a canonical, cell-order- and
// shard-order-insensitive sha256 over everything the plan object carries. A later
// gate refuses any plan whose digest differs from the adopted one — even a
// structurally valid sibling plan with identical counts.
// EXPORTED (12D-222): the instruction-side adoption gate re-derives against this EXACT
// canonical preimage instead of a divergent copy.
export const cellPlanDigestOf = (plan: Readonly<RegionalCellPlacementPlan>): string =>
  createHash('sha256').update(JSON.stringify({
    kind: plan.kind,
    epoch: plan.epoch,
    cellCount: plan.cellCount,
    shardCount: plan.shardCount,
    totals: plan.totals,
    cells: [...plan.cells]
      .sort((a, b) => (a.cellId < b.cellId ? -1 : a.cellId > b.cellId ? 1 : 0))
      .map((c) => ({
        cellId: c.cellId,
        shardIds: [...c.shardIds].sort((a, b) => a - b),
        tenantCount: c.tenantCount,
        projectedRows: c.projectedRows,
      })),
  })).digest('hex');

/**
 * Receipt-gated OPERATIVE adoption of a 12D-120 regional cell plan. The plan is
 * UNTRUSTED input: it is re-asserted through the contract's own invariants, and the
 * adoption record binds its content digest, epoch, cell/shard counts, and projected
 * totals — a later binding refuses any packet that disagrees. The record authorizes
 * nothing by itself: it exists so event-plane plans can be RE-DERIVED against an
 * adopted placement instead of being trusted as standalone packets.
 */
export function adoptCellPlacementOperatively(
  plan: Readonly<RegionalCellPlacementPlan>,
  input: { operatorReceiptSha256: string; adoptedBy: string; adoptedAtMs: number },
): Readonly<CellPlacementOperativeAdoption> {
  if (!plan || typeof plan !== 'object' || !Object.isFrozen(plan)
    || plan.kind !== 'REGIONAL_CELL_PLACEMENT_PLAN')
    throw new Error('a frozen REGIONAL_CELL_PLACEMENT_PLAN is required; fail closed');
  assertCellPlanInvariants(plan);
  if (!input || typeof input !== 'object')
    throw new Error('adoption input required; fail closed');
  if (!hex64(input.operatorReceiptSha256))
    throw new Error('cell-placement operative adoption requires a 64-hex sha256 operator receipt; fail closed');
  if (!identity(input.adoptedBy))
    throw new Error('adopter identity invalid; fail closed');
  if (!safeInt(input.adoptedAtMs) || input.adoptedAtMs <= 0)
    throw new Error('adoption timestamp invalid; fail closed');
  return Object.freeze({
    kind: 'CELL_PLACEMENT_OPERATIVE_ADOPTION' as const,
    planDigestSha256: cellPlanDigestOf(plan),
    epoch: plan.epoch,
    cellCount: plan.cellCount,
    shardCount: plan.shardCount,
    totals: plan.totals,
    adoptedBy: input.adoptedBy,
    adoptedAtMs: input.adoptedAtMs,
    operatorReceiptSha256: input.operatorReceiptSha256,
    materializedByThisRuntime: false as const,
    productionProvisioningAllowed: false as const,
    infrastructureProvisionedByThisRuntime: 0 as const,
    realCellsProvisioned: 0 as const,
    guardrails: CELL_PLACEMENT_ADAPTER_GUARDRAILS,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    billionUsersProven: false as const,
    automaticRecovery: false as const,
  });
}

const parseCellIndex = (cellId: string): number => {
  const match = /^cell-([0-9]+)$/.exec(cellId);
  if (!match) throw new Error(`malformed cell identity "${cellId}"; fail closed`);
  const index = Number(match[1]);
  if (!Number.isSafeInteger(index) || index < 0) throw new Error(`malformed cell identity "${cellId}"; fail closed`);
  return index;
};

/**
 * Cross-contract gate: bind a 12D-123 event-plane plan to an ADOPTED 12D-120 cell
 * placement. Three untrusted packets must agree, and none is trusted:
 *
 *   * the COMPOSING cell plan (the one `planEventPlane` consumed) is REQUIRED and
 *     must digest-match the operator's adoption record — an event plane composed
 *     from a cell plan the operator never adopted cannot bind, even if every
 *     placement inside it re-derives;
 *   * the event-plane plan's epoch, cell count, and stream count must match the
 *     adopted placement;
 *   * EVERY stream must re-derive — the primary cell via the deterministic
 *     `shardCellId(cellCount, shardId)` rule and the replica, when present, via the
 *     placement rule against a DIFFERENT valid cell of the SAME adopted placement
 *     (defense in depth: the 12D-123 invariants already enforce this; the binding
 *     re-derives anyway — no packet is trusted on the word of another gate).
 */
export function bindEventPlaneToAdoptedCells(
  eventPlane: Readonly<DistributedEventPlanePlan>,
  cellAdoption: Readonly<CellPlacementOperativeAdoption>,
  composingCellPlan: Readonly<RegionalCellPlacementPlan>,
): Readonly<EventPlaneCellBinding> {
  if (!eventPlane || !Object.isFrozen(eventPlane) || eventPlane.kind !== 'DISTRIBUTED_EVENT_PLANE_PLAN')
    throw new Error('a frozen DISTRIBUTED_EVENT_PLANE_PLAN is required; fail closed');
  assertEventPlaneInvariants(eventPlane);
  if (!cellAdoption || cellAdoption.kind !== 'CELL_PLACEMENT_OPERATIVE_ADOPTION' || !Object.isFrozen(cellAdoption))
    throw new Error('an adopted cell-placement record is required; the plane is never bound without adoption');
  if (!composingCellPlan || !Object.isFrozen(composingCellPlan)
    || composingCellPlan.kind !== 'REGIONAL_CELL_PLACEMENT_PLAN')
    throw new Error('the composing REGIONAL_CELL_PLACEMENT_PLAN is required; fail closed');
  assertCellPlanInvariants(composingCellPlan);
  if (cellPlanDigestOf(composingCellPlan) !== cellAdoption.planDigestSha256)
    throw new Error('the presented composing cell plan does not match the adopted placement record; fail closed');
  if (composingCellPlan.epoch !== cellAdoption.epoch || composingCellPlan.cellCount !== cellAdoption.cellCount
    || composingCellPlan.shardCount !== cellAdoption.shardCount)
    throw new Error('the presented composing cell plan does not match the adopted placement record; fail closed');
  if (eventPlane.epoch !== cellAdoption.epoch)
    throw new Error('the event-plane epoch does not match the adopted cell placement; fail closed');
  if (eventPlane.cellCount !== cellAdoption.cellCount)
    throw new Error('the event-plane cell count does not match the adopted cell placement; fail closed');
  if (eventPlane.streams.length !== cellAdoption.shardCount)
    throw new Error('the event-plane stream count does not match the adopted placement shard count; fail closed');
  let replicated = 0;
  for (const stream of eventPlane.streams) {
    // The primary cell must RE-DERIVE from the adopted placement's deterministic rule.
    const expectedPrimary = shardCellId(cellAdoption.cellCount, stream.shardId);
    if (stream.primaryCellId !== expectedPrimary)
      throw new Error(
        `stream ${stream.shardId} places its primary in ${stream.primaryCellId} against the adopted placement's `
        + `deterministic rule (${expectedPrimary}); inconsistent event-plane plan; fail closed`);
    if (stream.replicaCellId !== null) {
      replicated++;
      const replicaIndex = parseCellIndex(stream.replicaCellId);
      if (replicaIndex >= cellAdoption.cellCount)
        throw new Error(
          `stream ${stream.shardId} replicates to ${stream.replicaCellId}, which is outside the adopted `
          + `${cellAdoption.cellCount}-cell placement; fail closed`);
      if (stream.replicaCellId === stream.primaryCellId)
        throw new Error(
          `stream ${stream.shardId} would carry a replica on its own primary cell; a co-located copy `
          + 'fabricates redundancy; fail closed');
    }
  }
  return Object.freeze({
    kind: 'EVENT_PLANE_CELL_BINDING' as const,
    planEpoch: eventPlane.epoch,
    cellPlanDigestSha256: cellAdoption.planDigestSha256,
    cellCount: cellAdoption.cellCount,
    shardCount: cellAdoption.shardCount,
    streamCount: eventPlane.streams.length,
    replicatedStreamCount: replicated,
    streamsReDerivedAgainstAdoptedCells: eventPlane.streams.length as number,
    infrastructureMaterializedByThisBinding: 0 as const,
    guardrails: CELL_PLACEMENT_ADAPTER_GUARDRAILS,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    realEventStreamsActivated: 0 as const,
    billionUsersProven: false as const,
    automaticRecovery: false as const,
  });
}