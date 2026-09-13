# 12D-123 — Distributed Event + Storage Plane contract (handoff)

Status: BUILT LOCALLY on `claude/12d-99-supervised-local-worker`. The next rung on the
agreed scale ladder after the 12D-120 regional-cell placement contract.

## What it is

`event-plane-contract.ts` plans, for a validated 12D-109 routing and its 12D-120 cell
placement, where each shard's EVENT STREAM lives — purely, deterministically,
materializing nothing:

- PRIMARY: the shard's own deterministic cell (`shardId % cellCount` — the 12D-120 rule,
  re-derived, never trusted from the cell plan).
- REPLICA: the deterministic neighbor cell (`(shardId + 1) % cellCount`) — always a
  DIFFERENT cell when the plane has ≥ 2 cells.
- A single-cell plane CANNOT hold a second copy: it degrades honestly
  (`replicationDegraded: true`, `replicaCellId: null` on every stream) instead of
  fabricating a co-located replica.

Fail-closed inputs and cross-checks (the 12D-120 review lessons, applied):

- the routing must pass 12D-109's own `assertRouting`; every tenant row budget passes
  12D-109's own `assertRowBudget` (a missing budget is a throw, never a silent zero);
- the cell plan must pass 12D-120's own `assertCellPlanInvariants` AND re-derive from
  the routing (epoch, shard count, per-cell shard sets, tenant counts, row projections,
  totals) — a forged or mismatched packet pair is rejected;
- the ONLY measured ceiling (2,000,000 rows per database, 12D-103) is re-asserted per
  stream, so even a forged-consistent packet pair cannot route a database past it;
- the frozen packet is self-checked through `assertEventPlaneInvariants` before it is
  ever returned.

`adoptEventPlanePlan` is receipt-gated (64-hex sha256 operator receipt — the 12D-119/
12D-121 discipline) and returns an ADOPTION RECORD: `materializedByThisRuntime: false`,
`productionProvisioningAllowed: false`, `infrastructureProvisionedByThisRuntime: 0`.
Adoption is a DECISION RECORD, never provisioning; turning the plan into an event log,
storage, or a replica is the operator's action in systems outside this runtime.

## Honest state

Every plan carries `humanDecision: 'REQUIRED'`, `learningPromoted: false`,
`modelCalls: 0`, `remoteCalls: 0`, `realEventStreamsProvisioned: 0`,
`realCellsProvisioned: 0`, `billionUsersProven: false`, `automaticRecovery: false`.
Guardrails include `materializesNoInfrastructure`, `advisoryUntilOperatorAdoption`,
`replicaRequiresADistinctCell`, `singleCellCannotReplicate`,
`noMeasuredReplicationEvidence`. Zero network calls (pure module) — 12D-113's
authorized-surface audit applies.

## What this does NOT claim

No event log, storage system, replica, or network topology exists or was provisioned.
No replication behavior (RPO, lag, failover) has been measured — the plan says so in
its assumptions. All row projections are sparse logical sums of caller-supplied
budgets. `billionUsersProven: false`.

## Verification

6/6 tests (`test:12d-123`): frozen honest policy/guardrails; deterministic primary +
replica derivation over a 4-shard/2-cell plane with per-shard row projections matching
the routing budgets and totals matching the cell plan; honest single-cell degradation
(every replica null); fail-closed inputs (unknown epoch, duplicate tenant via 12D-109's
own validator, cell plan from a different routing, forged cell-plan row projections
rejected by re-derivation, missing/zero/negative/fractional/over-budget tenant budgets,
a forged-consistent packet pair rejected at the re-asserted per-database ceiling, and
the sparse-topology cell-count pin: a routing that populates fewer cells than the cell
plan declares is rejected instead of handing replicas to cells no validated packet
describes); receipt-gated adoption (missing/malformed receipt and non-positive
adoption timestamps fail closed, adoption materializes nothing, adoption against a
tampered plan fails closed); tamper-evident invariants (non-deterministic or co-located
replica placement, fabricated replica on a degraded plane, flipped degradation flag,
missing stream coverage, per-stream ceiling, gutted governance flags, fabricated
guardrails). `typecheck:12d-123` PASS. Wired into `.gitlab-ci.yml`.

### Adversarial review (paydown record)

5-agent review workflow (2 lenses — semantics + governance — every finding adversarially
verified by independent verifiers, two with live tsx reproduction): **3 confirmed
findings (1 BLOCKING, 2 CONSERVATIVE), 0 refuted. All fixed before commit; tests
re-run 6/6 and typecheck PASS.**

- BLOCKING (live-reproduced): `planEventPlane` trusted `cellPlan.cellCount` for the
  degradation decision and replica derivation. A legal 12D-120 packet with
  `cellCount` > the routing's populated cells (e.g. `planRegionalCells(oneShardRouting,
  2)` with shardCount 1) passed every cross-check and emitted `replicationDegraded:
  false` with `replicaCellId: 'cell-1'` — a cell that appears in no validated packet
  and hosts zero shards: precisely the fabricated replica the module header and the
  `singleCellCannotReplicate` guardrail claim impossible. FIXED: the declared cell
  count is pinned to the re-derived cell set — a plan declaring more cells than the
  routing populates fails closed. Regression tests added (cellCount 2 and 16 cases).
- CONSERVATIVE (live-reproduced, same root cause, governance lens): replica cells were
  never checked against the validated cell set; with `shardCount < cellCount` the plan
  claimed cross-cell replication onto cells no packet describes. FIXED by the same
  cell-count pin (chosen over the suggested degrade-with-assumption alternative: an
  inflated declared topology fails closed rather than being silently accepted).
- CONSERVATIVE: `adoptEventPlanePlan` accepted a non-positive `adoptedAtMs`, weaker
  than the sibling 12D-119 adoption's `nowMs > 0` fail-closed rule. FIXED to match the
  12D-119 discipline. Regression tests added.

Residual disclosed: `assertEventPlaneInvariants` alone (without the routing) cannot
detect the sparse-topology class — the cell count is pinned at construction, where the
routing is available. Any future consumer MUST use the constructor, not hand-build a
packet and call the invariant check on it.

## Trust limits

The plan authorizes nothing and provisions nothing. An adopted plan is a decision
record, not infrastructure. Every gate fails closed; a plan that fails its invariants
is rejected, never repaired. The distributed event + storage plane itself (real logs,
real replicas, measured failover) is FUTURE work requiring its own measured evidence.