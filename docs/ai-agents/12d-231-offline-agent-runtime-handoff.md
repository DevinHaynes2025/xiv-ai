# 12D-231 — Offline Agent Runtime, durable queue & safe synchronization (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/offline-agent-runtime.ts` + 20/20 focused
tests + typecheck green + 12D-113 guardrail audit green + sibling 12D-225
suite green). CI IS NOT CLAIMED PASSED: GitLab CI remains quota-blocked
(`ci_quota_exceeded`); the `.gitlab-ci.yml` wiring was appended but no native
pipeline has executed on it. Reviewers: CLAUDE_CODE (self-review; one live
defect found and fixed — see below). GROK_XAI PENDING — never fabricated.

## What it is

The owner's offline-backend charter (2026-09-14) as a pure, fail-closed
contract: a durable local task queue (tenant/universe-scoped, budgeted
admission) with exclusive leases + heartbeat renewals within caps, idempotent
completion/replay refusal, bounded retry where crash-expiry COUNTS toward the
limit (a crashing worker cannot loop forever), terminal CANCELLED /
FAILED_PERMANENT states, a network-deny posture with an explicit
operator-receipt-gated synchronization gate, and digest-mismatch QUARANTINE
(never a silent overwrite). Every lifecycle event lands in an append-only,
hash-chained ledger whose entries carry agentId, taskId, and tenantId.

It CALLS NOTHING: zero model calls, zero remote calls, no provider fallback,
no model-weight mutation, no learning promotion, network-deny by default.
Synchronization never runs on a timer or an agent's word — it requires a
fresh single-use 64-hex sha256 operator receipt, and even then the contract
only RECORDS reconciliation evidence; the connector that would move bytes is
a future story. `humanDecision: 'REQUIRED'`, `learningPromoted: false`,
`billionUsersProven: false` on every surface. The only measured ceiling stays
2,000,000 rows per database; sparse logical agent populations are
architecture, never materialized rows.

## Operator-facing behavior that must be understood (fail-closed disclosures)

1. **A rejected sync proposal still consumes its single-use grant.** The
   grant is consumed at proposal time — after the receipt-shape and
   future-dating checks, but BEFORE batch validation and reconciliation. A
   proposal whose batch or remote digests are malformed, or that is refused
   cross-universe, CONSUMES the grant: a rejected receipt is never a reusable
   authorization, and the operator must issue a FRESH receipt for every
   attempt. Do not retry the same receipt after a rejection and mistake the
   refusal for an unused authorization. (Regression-tested both ways:
   replay after a successful proposal and replay after a rejected proposal
   are both refused.)
2. **A future-dated grant is refused before consumption** — the timestamp
   check runs before the grant is consumed, so a future-dated receipt is
   genuinely unused.
3. **Crash expiry consumes exactly one attempt** per expiry, through BOTH
   presentation paths (`reclaimExpiredLeases` and direct presentation of the
   expired lease to `complete()`/`renewLease()`) — never zero, never two. At
   the owner limit of 3 the task dies `FAILED_PERMANENT` and is never
   leasable again.
4. **Sync digest mismatch QUARANTINES the task for human review** — local
   truth is preserved, the remote digest never overwrites it, and the
   quarantined state is terminal (never leasable). Unknown tasks in a sync
   batch become conflicts, never fabricated tasks.
5. **Lease accounting**: active-lease counters are decremented by completion,
   human cancellation, lease expiry, and emergency stop alike. One disclosed
   limit: after `emergencyStopAgent`, the counter is not observable through
   `leaseNext` (the stop refusal throws first); lease revocation itself is
   regression-tested.
6. **Records are immutable after creation**: task records, leases, and
   ledger entries are frozen; mutation attempts throw. The ledger array
   itself is the live trail (by design, matching sibling modules); injected
   entries fail `verifyLedger()`.

## Defect found and paid down during this story

- **BLOCKING (self-review, live-reproduced via the failing suite):** the sync
  gate's remote-digest validation threw `malformed remote digest for ...`
  while every sibling digest check in the module (enqueue, completion, grant
  receipt) throws `... must be 64-hex sha256`. The focused suite correctly
  asserted the module convention, so the suite sat at 14/15. Fixed the
  implementation message (not the test), and added the consumed-grant
  disclosure to the module header + this handoff. Suite now 20/20.

## Exact files

- `services/ai/runtime/offline-team/offline-agent-runtime.ts` (new)
- `services/ai/runtime/offline-team/offline-agent-runtime.test.ts` (new)
- `services/ai/package.json` (`test:12d-231`, `typecheck:12d-231`)
- `.gitlab-ci.yml` (`typecheck:12d-231`, `test:12d-231` appended)
- `docs/ai-agents/12d-231-offline-agent-runtime-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-231      # 20/20 pass (0 fail), exit 0
npm run typecheck:12d-231 # exit 0 (strict)
npm run test:12d-113      # guardrail audit, exit 0
npm run test:12d-225      # sibling gateway-executor suite, exit 0
```

Full unfiltered logs preserved at `/tmp/xiv-12d231-test.log` (pre-fix
failure: assertion `expected /64-hex/`, actual
`Error: malformed remote digest for task-A`, stack at
`offline-agent-runtime.ts:416`), `/tmp/xiv-231-after.log`, and
`/tmp/xiv-231-final.log`. CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded`
persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, `trafficMoved: false`, no production
mutation, no merge, no deployment, no learning promotion, no Ollama/provider
invocation occurred in this story. No commit/push occurred before the
operator-visible report; the local commit stages ONLY the five files above
and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.