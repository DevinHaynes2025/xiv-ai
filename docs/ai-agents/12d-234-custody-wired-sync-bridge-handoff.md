# 12D-234 — Custody enforcement wired into the sync execution bridge (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`.
CI IS NOT CLAIMED PASSED: GitLab CI remains quota-blocked
(`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review; two test-fixture
defects found and fixed live — see below). GROK_XAI PENDING — never
fabricated.

## What it is

The follow-through on 12D-233: the 12D-232 offline-sync execution bridge now
REQUIRES a 12D-233 `OperatorCustodyRegistry` and CONSUMES both declared
receipts exactly once at issue time. "One instruction per reconciled batch"
and the receipt-separation residuals of 12D-130/131/232 are now ENFORCED
instead of disclosed: a replayed, cross-purpose, or already-consumed receipt
refuses at the bridge, via the registry's own single-use contract.

## The contract change (strengthening, fail-closed)

1. **`custody` is REQUIRED input** (`OperatorCustodyRegistry`) — a bridge
   call without it refuses (`the operator custody registry (12D-233) is
   required`).
2. **The sync-authorization receipt must be registered for
   `xiv.sync.propose`** (`OFFLINE_SYNC_EXECUTION_POLICY.syncGrantPurpose`).
3. **The execution-grant receipt must be registered for
   `xiv.sync.transport`** (the canonical execution tool id, which is its
   custody purpose).
4. **Consumption is ordered AFTER every validation gate**: ledger verify →
   trail re-derivation → live task-state re-derivation → identity gates →
   receipt-separation gate, THEN both receipts are custody-authenticated and
   consumed, THEN the 12D-121 ladder drives. A REFUSED instruction burns
   neither receipt (regression-tested: a tampered-trail refusal leaves both
   receipts usable for a clean retry).
5. **A FAILED INSTRUCTION after consumption DOES burn both receipts**
   (fail-closed, regression-tested via a time limit below the 12D-121
   ladder's own policy minimum, which passes the bridge's `>0` check and
   throws inside `openDecisionWorkflow`): fresh receipts for every attempt —
   the 12D-231 proposal-time discipline, applied to transport. This is the
   same fail-closed direction as 12D-231's consumed-grant-on-rejection
   disclosure; operators must not retry burned receipts.
6. **The packet carries `custodyEnforced: true`** and the policy version is
   now `12d-234-v1`.

## Disclosed residual that REMAINS

The registry is local-first and process-local (12D-233 disclosures stand
verbatim): registration is not issuance proof — the operator still holds the
receipt material out-of-band — and the registry is not durable across
process restarts. What is gone is the UNENFORCED-REUSE residual: within a
process, a receipt cannot drive two transport instructions or cross a gate
boundary.

## Defects found and paid down during this story (both test fixtures)

- The "wrong custody purpose" case accidentally presented two EQUAL receipts,
  hitting the receipt-separation gate before the cross-purpose gate. Rebuilt
  the fixture with distinct receipts so the cross-purpose message is
  exercised. Implementation unchanged.
- The "failed instruction after consumption" case used `timeLimitMs: 0`,
  which the bridge itself refuses at input validation (before consumption —
  receipts correctly NOT burned). Rebuilt with `timeLimitMs: 1`, which
  passes the bridge's `>0` check and throws at the 12D-121 ladder's own
  policy minimum (1000ms) AFTER consumption. Implementation unchanged.
  (Incidentally verified: a zero time limit is refused BEFORE any receipt
  burns.)

## Exact files

- `services/ai/runtime/offline-team/offline-sync-execution-bridge.ts` (12D-234
  hardening of the 12D-232 module: custody input, enforcement, `custodyEnforced`)
- `services/ai/runtime/offline-team/offline-sync-execution-bridge.test.ts`
  (17 tests: the 11 12D-232 tests updated for the custody input + 6 new
  12D-234 enforcement tests)
- `docs/ai-agents/12d-234-custody-wired-sync-bridge-handoff.md` (this file)

No new npm scripts: 12D-234 lives in the 12D-232 files and is verified by
the existing `test:12d-232` / `typecheck:12d-232` scripts (CI already runs
them); the registry suite is `test:12d-233`.

## Exact commands and local results

```
npm run test:12d-232      # 17/17 pass (11 12D-232 + 6 12D-234), exit 0
npm run typecheck:12d-232 # exit 0 (strict)
npm run test:12d-233      # custody registry suite, 13/13, exit 0
npm run test:12d-231      # sibling runtime suite, 20/20, exit 0
npm run test:12d-113      # guardrail audit, 9/9, exit 0
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, `bytesMovedByThisRuntime: false`, no
production mutation, no merge, no deployment, no learning promotion, no
Ollama/provider invocation occurred in this story. The local commit stages
ONLY the three files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next on the ladder

Wire the 12D-130 (scaling) and 12D-131 (failover) bridges to the same
custody requirement (12D-235), closing their disclosed receipt residuals the
same way.