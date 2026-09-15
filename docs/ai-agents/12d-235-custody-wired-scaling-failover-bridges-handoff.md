# 12D-235 — Custody enforcement wired into the scaling and failover bridges (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`.
CI IS NOT CLAIMED PASSED: GitLab CI remains quota-blocked
(`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review; one contract
strengthening paid down live — see below). GROK_XAI PENDING — never
fabricated.

## What it is

The completion of the custody sweep started in 12D-234: the 12D-130
(scaling) and 12D-131 (failover) execution bridges now REQUIRE a 12D-233
`OperatorCustodyRegistry` and CONSUME both receipts exactly once at issue
time. All three execution bridges (scaling 12D-130, failover 12D-131, sync
12D-232) now enforce the receipt residuals they used to disclose.

## The contract change (identical shape to 12D-234)

1. **`custody` is REQUIRED input** for both `issueScalingExecutionInstruction`
   and `issueFailoverExecutionInstruction`.
2. **The plan-approval receipt** (embedded in the presented decision record,
   re-derived before this gate) must be custody-registered for
   `xiv.scaling.decision` / `xiv.failover.decision` respectively
   (`*.planApprovalPurpose`).
3. **The execution-grant receipt** must be registered for the canonical
   execution tool id (`xiv.database.provision` / `xiv.traffic.failover`).
4. **Consumption ordered AFTER every validation gate** (record re-derivation,
   decline-is-final, identity, receipt separation): a REFUSED instruction
   burns neither receipt (regression-tested via the DECLINED final state);
   a FAILED instruction after consumption burns both (fail-closed — same
   disclosure as 12D-234).
5. **Both bridges now shape-check the execution receipt (64-hex sha256)
   themselves**, with the module convention message — the custody gate would
   otherwise have intercepted malformed receipts with a registry-side
   message, silently moving the refusal boundary. The 12D-121 ladder's
   receipt gate remains the backstop.
6. **`custodyEnforced: true` on both packets**; `*.policyVersion` is now
   `12d-235-v1`; `custodyEnforced: true` added to both guardrail sets.

## Disclosed residual that REMAINS

The 12D-233 disclosures stand verbatim: registration is not issuance proof
(out-of-band custody still owns authenticity); the registry is process-local,
NOT durable.

## Defect found and paid down during this story

- **(self-review, caught by the existing suite + typecheck):** with the
  custody gate consuming receipts, a MALFORMED execution receipt would have
  been refused by the registry's hex check before the 12D-121 ladder's own
  receipt gate — changing the refusal boundary the 12D-130/131 tests pinned.
  Fixed by adding the 64-hex shape check to both bridges (fail-closed
  earlier, message keeps the `operator receipt` convention), not by relaxing
  the tests.

## Exact files

- `services/ai/runtime/offline-team/scaling-execution-bridge.ts` (12D-235 hardening)
- `services/ai/runtime/offline-team/scaling-execution-bridge.test.ts`
  (13 tests: 9 updated for custody + 4 new 12D-235 tests)
- `services/ai/runtime/offline-team/failover-execution-bridge.ts` (12D-235 hardening)
- `services/ai/runtime/offline-team/failover-execution-bridge.test.ts`
  (13 tests: 9 updated + 4 new)
- `docs/ai-agents/12d-235-custody-wired-scaling-failover-bridges-handoff.md`
  (this file)

No new npm scripts: 12D-235 lives in the 12D-130/131 files and is verified
by the existing `test:12d-130` / `typecheck:12d-130` / `test:12d-131` /
`typecheck:12d-131` scripts (CI already runs them).

## Exact commands and local results

```
npm run typecheck:12d-130 # exit 0 (strict)
npm run typecheck:12d-131 # exit 0 (strict)
test:12d-130 (tsx --test) # 13/13 pass
test:12d-131 (tsx --test) # 13/13 pass
npm run test:12d-232      # sync bridge incl. 12D-234, 17/17, exit 0
npm run test:12d-233      # custody registry, 13/13, exit 0
npm run test:12d-231      # sibling runtime suite, 20/20, exit 0
npm run test:12d-113      # guardrail audit, 9/9, exit 0
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no traffic shifting, no
production mutation, no merge, no deployment, no learning promotion, no
Ollama/provider invocation occurred in this story. The local commit stages
ONLY the five files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.