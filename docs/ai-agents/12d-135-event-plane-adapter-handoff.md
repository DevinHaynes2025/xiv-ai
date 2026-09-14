# 12D-135 — Event-Plane Adoption Layer (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/event-plane-adapter.ts` +
`event-plane-adapter.test.ts`; 6/6 tests + typecheck green; sibling suites
re-run green — 12D-119 8/8, 12D-123 6/6, 12D-126 17/17, 12D-129 12/12,
12D-130 9/9, 12D-131 9/9, 12D-132 12/12, 12D-134 10/10, 12D-133 11/11,
12D-113 audit 9/9). CI IS NOT CLAIMED PASSED: GitLab CI remains
quota-blocked (`ci_quota_exceeded`) — the `.gitlab-ci.yml` wiring was
appended but no pipeline has run.

## What it is

12D-123's contract already carries an in-contract adoption RECORD
(`adoptEventPlanePlan`) — a decision receipt that changes nothing. 12D-135 is
the next step, mirroring 12D-119's tenant-routing adoption discipline: the
separately-reviewed adapter that makes an adopted event-plane plan OPERATIVE
over caller-provisioned local `OfflineStoryQueue` stream databases.

### Requirement coverage

- **Receipt-gated at adoption** — `adoptEventPlaneOperative(plan, input)`
  requires a 64-hex sha256 operator receipt, a bounded adopter identity, and
  a safe positive timestamp, per call (regression-tested: wrong format,
  wrong length, empty/garbled identity, negative timestamp all fail
  closed).
- **The plan is UNTRUSTED input** — re-asserted through
  `assertEventPlaneInvariants` at adoption AND at facade construction; an
  unfrozen plan and an invariant-violating forged plan are both refused
  (regression-tested).
- **The adoption binds plan CONTENT, not just counts** — the record carries
  `planDigestSha256`, a canonical, stream-order-insensitive sha256 over
  everything the plan object carries. A structurally valid plan with
  identical counts but swapped per-stream projections still fails the
  facade's consistency gate (regression-tested via a totals-preserving
  projection swap).
- **The facade opens no database and derives no placement** — stream queues
  are caller-provisioned `OfflineStoryQueue` instances; every primary/replica
  cell decision is read from the adopted plan. `materializedByThisRuntime:
  false`, `productionProvisioningAllowed: false`,
  `infrastructureProvisionedByThisRuntime: 0` are structural on the adoption
  record.
- **Per-stream activation is receipt-gated** — every `activateStream` call
  must present the adoption's receipt (an operator decision per change,
  never ambient); wrong receipt, unknown shard, and double activation all
  fail closed (regression-tested).
- **Replica writes follow the adopted plan and nothing else** — a degraded
  (single-cell) plane refuses replica queues outright (no fabricated
  co-located copy) and honestly writes one copy (`singleCopyDegraded: true`,
  `insertedReplica: null`); a multi-cell plane requires a distinct replica
  queue for every replicated stream and appends to both (regression-tested
  both ways).
- **Queue-map gates** — missing primary queue (count held constant so the
  per-stream gate fires), shared queue instance between primary and replica
  (would collapse per-database ceiling accounting), extra queue, missing
  replica for a replicated stream, plan/adoption mismatch, wrong-count map:
  all fail closed (regression-tested).
- **Cross-queue writes are NOT atomic and never silently so** — a replica
  failure after a primary commit throws an error that reports exactly what
  landed: the shard, the primary's durable row count, and that the pair is
  not atomic (regression-tested by pre-seeding the replica with the same
  story id and altered content, so the primary commits and the replica
  throws).
- **Per-database ceiling stays where it is proven** — each primary/replica
  queue is its own database under the measured 2,000,000-row ceiling
  (12D-103 drill); the facade grants no additional concurrency and no
  additional rows. The test re-asserts `PARTITION_POLICY.maxRowsPerShard ===
  2_000_000`.
- **Reads come from the primary queue only in this slice** — `claimNext`
  delegates to the owning stream's primary queue and its own singleton
  lease; serving reads from replicas is a future, separately-reviewed step
  (disclosed, not built).
- **Honest flags** — `humanDecision: 'REQUIRED'`, `learningPromoted: false`,
  `modelCalls: 0`, `remoteCalls: 0`, `realEventStreamsActivated: 0`,
  `billionUsersProven: false`, `automaticRecovery: false` on every packet
  and frozen on `EVENT_PLANE_ADAPTER_GUARDRAILS` (regression-tested).

### Review finding paid down during this build

1. **Adoption-content binding (adversarial self-review)** — the adoption
   record originally bound only epoch/counts/posture, so a structurally
   valid plan with the same counts but different content would have passed
   the facade's consistency gate. Closed: `planDigestSha256` (canonical,
   order-insensitive) is now the binding gate, with the field-by-field
   match kept as defense in depth; regression-tested with a
   totals-preserving projection swap that passes invariants but must not
   pass the facade.

Residuals (disclosed):
- The replica copy is a SYNTHETIC LOCAL copy (second local SQLite file), not
  a real co-located replica; the packet says so
  (`replicaCopiesAreSyntheticLocalCopies: true`).
- Real stream activation, cross-host replication, and read-from-replica are
  future, separately-reviewed steps; nothing here provisions infrastructure.
- Ollama kept available but idle per the CEO directive: no provider call in
  this story (`modelCalls: 0` throughout).

## Exact files

- `services/ai/runtime/offline-team/event-plane-adapter.ts` (new)
- `services/ai/runtime/offline-team/event-plane-adapter.test.ts` (new)
- `services/ai/package.json` (`test:12d-135`, `typecheck:12d-135`)
- `.gitlab-ci.yml` (`typecheck:12d-135`, `test:12d-135` appended)

## Exact commands and local results

```
npm run typecheck:12d-135   # OK
npm run test:12d-135        # 6/6 pass
npm run test:12d-119        # 8/8 pass
npm run test:12d-123        # 6/6 pass
npm run test:12d-126        # 17/17 pass
npm run test:12d-129        # 12/12 pass
npm run test:12d-130        # 9/9 pass
npm run test:12d-131        # 9/9 pass
npm run test:12d-132        # 12/12 pass
npm run test:12d-134        # 10/10 pass
npm run test:12d-133        # 11/11 pass
npm run test:12d-113        # 9/9 pass (guardrail audit)
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

Reviewers: CLAUDE_CODE (self-review: one confirmed finding, paid down with
the `planDigestSha256` regression test). GROK_XAI PENDING — never
fabricated. No provider call, no traffic movement, no production mutation,
no merge, no deployment, no learning promotion occurred in this story;
`billionUsersProven: false`. Awaiting CEO authorization for any
merge/deploy (standing rule).