# 12D-109 — Queue Partition/Shard + Tenant-Routing Contract (handoff)

Status: BUILT LOCALLY on `claude/12d-99-supervised-local-worker`. Covers the CEO scale ladder's second step (local SQLite pilot → partition/shard contract → tenant routing → regional service cells → ...).

## What it is

`queue-partition-contract.ts` is a deterministic, pure routing CONTRACT for the story queue: `PARTITION_POLICY` (maxTenantsPerShard 250, maxShards 64, maxRowsPerShard 2,000,000, one declared routing epoch), `assignTenantToShard` (stable FNV-1a hash → shard, lowest-id-first overflow, one new shard only when every existing shard is full), `planShardPlacement` (frozen sparse projection of tenants and rows per shard), and `evaluateRouting` (bounded simulated tenant-growth events folded over the routing, still pure). The module MATERIALIZES NOTHING: no database, no file, no network, no process. It is a plan the queue can adopt later — producing a plan onboards no tenant and grants no authority.

## The ceiling is the measured one

`maxRowsPerShard = 2,000,000` is exactly `OFFLINE_QUEUE_POLICY.maxRows`, the per-database ceiling actually measured in the 12D-103 drill. No shard may project past it: a plan whose projections exceed the proven ceiling is rejected (fail closed), not silently stretched. Row projections use caller-supplied per-tenant budgets, never measured rows, because nothing has been measured about multi-shard deployments yet.

## Honest state

Every packet carries `humanDecision: 'REQUIRED'`, `learningPromoted: false`, `modelCalls: 0`, `remoteCalls: 0`, `realTenantsOnboarded: 0`. Guardrails are frozen: `materializesNoDatabase: true`, `routingIsAdvisoryUntilAdopted: true`, `countsSimulatedTenantsAsReal: false`, `billionUsersProven: false`. Every plan ships an explicit `assumptions` list stating it is a sparse logical projection with zero real tenants, and that billion-user readiness is NOT proven. Unknown routing epochs and malformed tenant ids fail closed; routing epochs are declared in policy, so adopting a new epoch is a deliberate policy change.

## Verification

7/7 tests (`test:12d-109`): deterministic routing across calls, repeat assignments, and independent rebuilds; overflow respects `maxTenantsPerShard` and creates the lowest new shard id; no shard plan projects past 2,000,000 rows and over-ceiling plans fail closed; unknown epochs and garbage tenant identities fail closed; frozen policy/guardrails; plan assumptions assert zero real tenants; `evaluateRouting` folds simulated growth deterministically with bounded, fail-closed events. `typecheck:12d-109` PASS. Wired into `.gitlab-ci.yml`.

## Trust limits

Routing output is advisory until a queue adapter adopts it in a separately reviewed layer. Nothing here proves multi-shard behavior, tenant isolation at scale, or any user count — the scale ladder's later rungs (tenant routing adoption, regional service cells) need their own evidence before any readiness claim.