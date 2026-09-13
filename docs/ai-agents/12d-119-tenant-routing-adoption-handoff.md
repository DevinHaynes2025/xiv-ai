# 12D-119 — Tenant-Routing Adoption Layer (handoff)

Status: BUILT LOCALLY on `claude/12d-99-supervised-local-worker`. Covers the CEO scale
ladder's third step: local SQLite pilot (done) → partition/shard contract (12D-109, done)
→ **tenant routing adoption (this story)** → regional service cells (not built).

## What it is

`tenant-routed-queue.ts` is the "separately reviewed layer" 12D-109's handoff called for:
it makes the frozen partition contract's routing OPERATIVE over real local
`OfflineStoryQueue` instances, without weakening a single queue guarantee.

- `adoptTenantRouting({epoch, shardCount, operatorReceiptSha256}, nowMs)` — adoption is
  explicit and receipt-gated (64-hex sha256 operator receipt, like 12D-115's operator
  receipts). Unknown epoch, out-of-policy shard count (1..64), or malformed receipt fails
  closed. Returns a frozen `TENANT_ROUTING_ADOPTION` record.
- `TenantRoutedQueue` — the facade. It provisions NO database: shard queue instances are
  caller-provided `OfflineStoryQueue` objects, one per planned shard, and a missing shard
  queue (or an extra one outside the plan) fails closed at construction. All routing math
  is delegated to 12D-109's `assignTenantToShard`; nothing is re-implemented here.
- `onboardTenant(tenantId, rowBudget, receipt)` — per-call receipt-gated (must equal the
  adoption receipt). The facade's own aggregate check rejects an onboarding whose
  projected rows would push a shard past the MEASURED 2,000,000-row ceiling
  (`OFFLINE_QUEUE_POLICY.maxRows`), on top of the contract's per-tenant budget bound.
- `enqueue / claimNext / inspectLease / renewLease / settle / returnUnstarted` — pure
  pass-throughs to the owning shard's queue. Leases remain per-shard singletons with the
  queue's own policy; the facade grants no additional concurrency, no renewal shortcuts,
  no recovery. A lease on shard A never blocks shard B.
- `routingReport(nowMs)` — the pure 12D-109 projection of the CURRENT routing, tagged
  with `syntheticTenantsRouted` and the honest scale flags.
- A routing assignment that would require a NEW shard fails closed: this facade
  provisions no database. The operator must provision the shard queue and adopt a routing
  containing it.

## Honest state

Every packet carries `humanDecision: 'REQUIRED'`, `learningPromoted: false`,
`modelCalls: 0`, `remoteCalls: 0`, `realTenantsOnboarded: 0` (structurally — every routed
tenant so far is a synthetic fixture tenant), `billionUsersProven: false`,
`automaticRecovery: false`. `TENANT_ROUTING_ADOPTION_GUARDRAILS` is frozen and includes
`facadeMaterializesNoShardDatabase`, `onboardingRequiresOperatorReceipt`,
`leasesRemainPerShardSingletons`, and `facadeGrantsNoAdditionalConcurrency`.

## What this does NOT claim

No multi-shard behavior has been measured on real deployments — this layer is exercised
only against synthetic-tenant local SQLite shards. It claims no tenant isolation
guarantee beyond what the single-queue lineage already proved (per-tenant scoping inside
one queue DB), no concurrency beyond `maxOutstandingLeases: 1` per shard, and no user
count. The next rungs (regional service cells, measured failover) need their own evidence.

## Verification

8/8 tests (`test:12d-119`), after an adversarial-review paydown (19 workflow agents:
3 review lenses + adversarial verification of every non-junk finding; 1 BLOCKING and
several CONSERVATIVE findings confirmed and all fixed before commit):

- **BLOCKING, fixed**: the constructor now refuses duplicated queue instances (a shared
  instance would silently collapse the per-shard singleton lease) and any non-
  `OfflineStoryQueue` shard entry — both fail closed at construction.
- **CONSERVATIVE, fixed**: `automaticRecovery: false` is now carried directly on every
  packet (adoption, onboarding, enqueue, routing report), and the enqueue result carries
  the full constitution flags. A dead untested export was removed.
- **CONSERVATIVE, fixed (honest, not atomic)**: cross-shard enqueue is NOT atomic — if a
  later shard throws, the error names exactly which shards committed durably and how many
  rows landed; unchanged-content retry is idempotent, and the committed rows are
  verifiable. Never silent.
- Fail-closed coverage added: enqueue batch boundaries (null/empty/>1000), the 501st
  onboarding (contract wants a NEW shard → facade refuses: it provisions no database),
  the `shard queue map required` guard, anchored throw matchers, the duplicates>0
  accounting path, `returnUnstarted` through the facade, and honest-flag assertions on
  every packet shape.

Original battery: receipt/epoch/shard-count fail-closed at adoption + frozen honest
packet; per-call receipt gating + determinism across independent facades + aggregate
shard ceiling + contract-owned budget validation; a real two-shard end-to-end (enqueue
routed per tenant, no cross-writes, per-shard singleton leases independent,
renewal/settlement forward to the owning shard with the same review hold, unknown tenant
fails closed); routing report is the frozen pure projection with `realTenantsOnboarded:
0` and projections ≤ 2,000,000. `typecheck:12d-119` PASS. Wired into `.gitlab-ci.yml`.

## Trust limits

Adoption records authorize nothing by themselves — a constructed facade with provisioned
shards is still just routing; every queue-level gate (claim validation, singleton lease,
review holds, operator recovery for expired leases) is inherited unchanged from the
12D-96..103 queue lineage. Adoption itself is a deliberate operator decision and stays
one: the receipt parameter is per-onboarding, never ambient. Residual honesty notes from
review: the constructor verifies shard queues are distinct INSTANCES; two DISTINCT
instances opened over the SAME sqlite path cannot be detected here (the queue exposes no
path) — that misconfiguration surfaces loudly at enqueue (lease-table conflict), and the
underlying queue's own `maxRows` hard-fails past the ceiling.