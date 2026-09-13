# 12D-120 — Regional-Cell Placement Contract (handoff)

Status: BUILT LOCALLY on `claude/12d-99-supervised-local-worker`. Covers the CEO scale
ladder's next rung after 12D-119 tenant-routing adoption: local SQLite pilot (done) →
partition/shard contract (12D-109) → tenant routing (12D-119) → **regional service cell
contract (this story)** → distributed event + storage plane (not built).

## What it is

`regional-cell-contract.ts` groups a 12D-109 routing's shards into regional cells as a
pure, fail-closed CONTRACT — the same discipline 12D-109 applied to shards. It
MATERIALIZES NOTHING: no database, no network, no process, no region claim any hardware
has ever measured.

- `REGIONAL_CELL_POLICY` (frozen): maxCells 16, maxShardsPerCell = the partition policy's
  maxShards (one cell must always absorb a full routing), `perDatabaseMeasuredRowCeiling`
  2,000,000 — the ONLY measured number, per-database, from the 12D-103 drill. Cell row
  projections are sparse logical sums of caller-supplied budgets, never measured
  multi-shard evidence, and the plan's `assumptions` say so explicitly.
- `shardCellId(cellCount, shardId)` — deterministic `shardId % cellCount`, re-derivable
  from policy alone, no hidden placement state; shard ids are bounded by the partition
  policy's maxShards (64), not by the derived maxShardsPerCell × maxCells product.
- `planRegionalCells(routing, cellCount)` — pure projection of a (possibly adopted)
  12D-109 `QueueRouting`: every shard covered EXACTLY once, tenant counts and row
  projections summed per cell, totals checked, frozen packet. Construction runs the
  12D-109 contract's own exported validators (`assertRouting`, `assertRowBudget`) —
  bad shape, out-of-range assignments, duplicate tenants, and
  missing/zero/negative/over-cap row budgets fail closed instead of silently projecting
  zero rows — and enforces the per-shard (per-database) 2,000,000-row ceiling exactly
  like the sibling `planShardPlacement`. The frozen packet is self-checked through
  `assertCellPlanInvariants` before it is ever returned.
- `assertCellPlanInvariants(plan)` — mechanical fail-closed detection (never repair):
  complete, non-overlapping shard coverage with EVERY shard re-derived against
  `shardId % cellCount` (not just the first), unique cell ids, no more cells than the
  declared cell count, no empty cells, per-cell shard capacity, the partition policy's
  shard ceiling, safe non-negative tenant counts and row projections, totals that sum,
  the FULL constitution flag set (humanDecision, learningPromoted, modelCalls,
  remoteCalls, realTenantsOnboarded, realCellsProvisioned, billionUsersProven,
  automaticRecovery), and guardrails pinned by identity to the frozen
  `REGIONAL_CELL_GUARDRAILS`. A tampered plan is REJECTED, never repaired. There is
  deliberately NO per-cell row ceiling: a multi-shard cell spans multiple databases,
  and 2,000,000 rows per database is the only measured number — per-tenant budgets and
  per-shard row sums are validated at construction instead.

## Honest state

The frozen packet carries `humanDecision: 'REQUIRED'`, `learningPromoted: false`,
`modelCalls: 0`, `remoteCalls: 0`, `realTenantsOnboarded: 0`, `realCellsProvisioned: 0`,
`billionUsersProven: false`, `automaticRecovery: false`. Guardrails include
`materializesNoInfrastructure`, `advisoryUntilOperatorAdoption`,
`cellPlacementIsShardIdModuloCellCount`, `noMeasuredRegionalEvidence`,
`countsSimulatedCellsAsReal: false`.

## What this does NOT claim

Nothing about regional deployment, latency, failover, or multi-shard behavior has been
measured — no cell, region, or failover topology exists in hardware. This plan is
advisory until an operator adopts it in a separately reviewed layer (the 12D-119
pattern); the next rungs (distributed event + storage plane, measured failover) need
their own evidence before any readiness claim.

## Verification

Adversarial review before commit: 13-agent workflow (semantics + governance review
lenses, every finding adversarially verified, refute-by-default). **9 confirmed findings
(3 BLOCKING, 6 CONSERVATIVE) — all paid down before commit:**

1. BLOCKING — the invariant checker re-derived placement from `shardIds[0]` alone, so a
   foreign shard grouped into a cell it does not own passed every invariant. Fixed: every
   shard of every cell is re-derived against `shardId % cellCount`.
2. BLOCKING — no measured-row-ceiling enforcement anywhere and unvalidated budgets
   (`?? 0` silently projected zero rows for a missing budget; a 9e12-row budget was
   accepted; negative/zero/non-integer budgets failed only in the invariants
   afterwards, i.e. construction was not fail-closed). Fixed: `assertRowBudget` (1..
   maxRowBudgetPerTenant) on every assignment at construction, per-shard row sums
   bounded by the proven 2,000,000-row ceiling exactly like `planShardPlacement`, and
   the invariants docstring corrected (there is deliberately no per-CELL ceiling — a
   multi-shard cell spans multiple databases).
3. BLOCKING — `planRegionalCells` skipped the sibling contract's routing validation, so
   out-of-range assignment shard ids (accepted via the old 1024 bound), duplicate
   tenants, and missing budgets were silently credited. Fixed: 12D-109's
   `assertRouting`/`assertRowBudget` are now exported and called at construction;
   `shardCellId`'s shard bound tightened from 1024 to the partition policy's maxShards
   (64); construction additionally self-checks its own packet through
   `assertCellPlanInvariants` before returning.
4. CONSERVATIVE — invariants did not bound `shardCount` against maxShards, per-cell
   shard capacity, or `tenantCount` validity. All three checks added.
5. CONSERVATIVE — `shardCellId` accepted shard ids no valid routing can contain
   (verified `shardCellId(16, 1000)` → `cell-8`). Fixed via the maxShards bound.
6. CONSERVATIVE — the tamper suite covered only defect classes the implementation
   already caught. Expanded with negative cases for every class above (foreign shard,
   duplicate cell identity, extra cells, empty cell, shardCount over the partition
   ceiling, invalid tenant count, all five gutted constitution flags, fabricated
   guardrails, per-shard over-ceiling routing, ghost assignments, duplicate tenants,
   the full bad-budget spectrum).
7. CONSERVATIVE — the docstring promised a measured-ceiling check the code never
   performed. Corrected: the honest position (per-database ceiling enforced at
   construction; no per-cell cap is deliberate, documented in code and in a positive
   test) replaces the overstated claim.
8. CONSERVATIVE — the checker did not enforce `learningPromoted`, `modelCalls`,
   `remoteCalls`, or `billionUsersProven`. Added, with tamper tests for all of them.
9. CONSERVATIVE — the checker did not pin `plan.guardrails` to the frozen canonical
   export. Added (identity + frozen), matching the codebase's own gate pattern.

One refuted finding (the verifier confirmed the packet-level constitution flags live on
the plan, not the guardrails object, so the claimed guardrails-field omission is not a
defect) was discarded and is disclosed here, not hidden.

**Residual (disclosed, not hidden):** an in-policy tamper of `plan.cellCount` with
single-shard cells (e.g. 2 → 8) is not detectable from the packet alone — the plan
carries no routing to cross-check against, and `cell-s` remains consistent under any
cellCount larger than the shard id. Every defect class the review could demonstrate with
grouped shards IS detected; this single residual class requires the adoption layer (the
12D-119 pattern) to pin cellCount at adoption time, which is the next rung if cells ever
move from contract to operator-adopted routing.

7/7 tests (`test:12d-120`): frozen honest policy/guardrails; deterministic
re-derivable placement (stable across calls, fails closed on bad inputs incl. the
tightened shard-id bound); full-coverage plan with honest flags, zero real claims, and
assumptions naming the synthetic-only, never-measured, NOT-proven facts; byte-identical
plans across independent rebuilds balanced at 64 shards × 16 cells; sparse cell
projection over bounded databases documented positively; construction fail-closed (bad
epochs, cell counts, shard counts, null routing, ghost assignments, duplicate tenants,
bad budgets, per-shard over-ceiling); invariant detection against fourteen tampered or
hand-built plans. `typecheck:12d-120` PASS; `typecheck:12d-109` PASS after exporting the
sibling validators (12D-109 battery unchanged, 7/7); 12D-113 mechanical audit 9/9;
12D-119 battery 8/8 (per-shard singleton leases untouched). Wired into
`.gitlab-ci.yml`.

## Trust limits

A cell plan authorizes nothing and provisions nothing. Adoption stays an explicit
operator decision in a future separately-reviewed layer; until then this contract is a
map, not a deployment. Every identity, ceiling, and timestamp fails closed. The one
residual detection gap (an in-policy cellCount tamper over single-shard cells) is named
above and belongs to the adoption layer, not to this contract.