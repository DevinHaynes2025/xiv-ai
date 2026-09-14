# 12D-129 — Measured horizontal scaling contract (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/measured-horizontal-scaling.ts` +
`measured-horizontal-scaling.test.ts`; 11/11 tests + typecheck green). Built directly
by this lineage — the scale ladder's MEASURED HORIZONTAL SCALING rung, applying the
full 12D-124→128 digest-binding and provenance discipline at construction.

## What it is

The contract consumes DECLARED per-database capacity evidence (row count, declared
growth per day, observation time) for a tenant's declared database fleet, projects each
database's rows over a declared horizon, and PROPOSES the smallest fleet expansion that
keeps projected aggregate utilization at or below the policy target — for HUMAN
approval. It PROVISIONS NOTHING: every path returns `databasesProvisioned: 0`,
`providerInvocationAuthorized: false`, `automaticRecovery: false`,
`productionScaleProven: false`, `humanApprovalRequired: true` (structural), plus the
constitution flags (`learningPromoted: false`, `modelCalls: 0`, `remoteCalls: 0`,
`billionUsersProven: false`).

The ONLY measured number is the 12D-103 drill ceiling — 2,000,000 rows per database —
carried as `measuredCeilingRowsPerDatabase` on every packet and enforced twice: as the
validation bound on declared row counts, and as the projection denial. Every row count
and growth rate is DECLARED evidence; the projections are sparse logical projections
over those declarations, and the packet says so (`measuredCeilingRowsPerDatabase` is
named on the packet; declared fields are named `declaredRowCount` /
`declaredGrowthRowsPerDay` in the projection).

Governing properties, as enforced:

- **A single database projected past the measured ceiling is DENIED**
  (`PER_DATABASE_CEILING_PROJECTED`, with `detailDatabaseId`) — never masked by
  aggregate arithmetic. A NEW database adds aggregate fleet headroom (it starts empty
  and absorbs growth) but MOVES NO ROWS, so aggregate arithmetic can never paper over
  single-database exhaustion; data movement is a separate governed plan.
- **The smallest-K expansion**: `requiredFleetSize = ceilDiv(projectedAggregateRows ×
  100, ceiling × scaleOutTargetPercent)`; K = required − existing. K = 0 →
  `NO_SCALE_REQUIRED` / `HEADROOM_WITHIN_TARGET` (the exact boundary is regression
  tested: exactly AT the target needs no scale, one row above it proposes 1). K above
  the policy cap → `SCALE_OUT_BEYOND_POLICY` (reachable: a full 64-database fleet at a
  1% target requires 6,400 databases).
- **Digest-binding discipline (12D-124→128, applied at construction)**: the scaling
  policy digest RE-DERIVES from the declared policy object over its alphabetical keys
  (`horizonDays`, `maxEvidenceAgeMs`, `maxNewDatabasesPerPlan`,
  `scaleOutTargetPercent`) — a foreign or stale attestation fails closed, so an
  approval binds the policy actually applied. The plan digest binds EVERY declared
  input: request identity fields, the re-derived policy digest, the proposed count,
  and every fleet database's full evidence and projection (including its observation
  time and declared values). Single-variable digest isolation is regression-tested for
  every field.
- **Evidence is exactly-shaped and fail-closed** (`hasExactKeys` first — the
  12D-124/125 discipline): safe-integer measurements within the ceiling, safe-integer
  timestamps, validated ids, `providerInvocationAuthorized: false` and
  `productionScaleProven: false` STRUCTURAL (evidence can never carry an authorization
  or scale claim). Undeclared fields, missing declared fields, NaN, negatives, and
  ceiling violations all throw.
- **Fleet evidence is tamper-evident**: evidence for a database outside the declared
  fleet THROWS; duplicates THROW; a fleet member with no evidence DENIES
  (`FLEET_EVIDENCE_REQUIRED`, with `detailDatabaseId` naming the gap); stale evidence
  DENIES (`EVIDENCE_STALE`, with `detailDatabaseId`) against a DECLARED reference time
  (`nowMs` parameter — this runtime reads no clock); future-dated evidence THROWS
  (paydown below).
- **Provenance-verified decision records from the first version**: `recordScalingDecision`
  takes the plan's full PROVENANCE (request, policy, declared reference time, evidence
  array) and RE-COMPOSES the plan before any record — a presented plan whose digest,
  proposed count, or post-plan fleet count does not re-derive is refused before any
  receipt is examined (the 12D-128 discipline, closing the forged-packet gap 12D-127
  disclosed). Only an eligible `HUMAN_APPROVAL_REQUIRED` plan can receive a decision;
  denied and no-scale packets are final states. The record is receipt-gated (64-hex
  sha256 operator receipt), validates decider identity and timestamp, REJECTS a
  decision timestamp predating the LATEST fleet evidence (paydown below), carries
  `requiresDecisionSafetyWorkflowBeforeAnyAction: true` (a requirement, never a
  past-tense claim), `executedByThisRuntime: false`, `productionExecutionAllowed: false`,
  `databasesProvisioned: 0`, and the full honest flag set. Every record is frozen.
- Projections clamp at zero rows (a fleet cannot project below empty — negative growth
  is a legitimate DECLARED decline).

## Adversarial review (paydown record)

The module was adversarially self-reviewed before commit, per standing protocol. Two
confirmed findings, both paid down with regression tests before commit:

1. **CONSERVATIVE — future-dated evidence never goes stale.** Freshness was
   `nowMs − observedAtMs > maxEvidenceAgeMs`, so evidence declaring an observation
   timestamp in the future of the declared reference time yielded a negative age and
   passed every staleness check forever. Fixed: `observedAtMs > nowMs` THROWS (an
   impossible observation ordering is a tamper signal — equal timestamps remain
   legitimate). Regression test: `observedAtMs: NOW + 60_000` throws
   `dated in the future of the reference time`.
2. **CONSERVATIVE — the decision temporal rule used the EARLIEST fleet evidence, not
   the latest.** `decidedAtMs < Math.min(...observedAtMs)` accepted a decision made
   after the first database's evidence existed but before the last one's — deciding on
   incomplete evidence — regressing the 12D-127/128 ordering rule (which used the max
   of both observation times). Fixed: the boundary is `Math.max(...)` over the fleet
   projection — a decision must postdate EVERY database's evidence. Regression tests:
   asymmetric evidence (α-01 at −100s, α-02 at −10s) rejects a decision at −50s and
   accepts one at −10s.

Two test-fixture errors were caught and corrected during the run (not module defects):
the staleness fixture was against 30s-old evidence with a 60s bound (fresh, correctly
not stale), and the fleet-change digest case left the two-item default evidence array
against a one-database fleet (correctly throwing "outside the declared fleet").

## Honest state

No database has ever been counted by this runtime — all evidence is declared. No
database has ever been provisioned by this runtime — `databasesProvisioned: 0` and
`providerInvocationAuthorized: false` are structural on every path, and every record
requires a 12D-121 decision-safety workflow before any resulting action in a system
outside this runtime. The 2,000,000-row per-database ceiling is the ONLY measured
number (12D-103); the projections are sparse logical projections; zero real tenants.
`billionUsersProven: false`. Reviewer receipts: CLAUDE_CODE. GROK_XAI PENDING — never
fabricated.