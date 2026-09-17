# 12D-290 — OPERATOR-CUSTODY FIXTURE PAYDOWN (12d-134/12d-222 debt) (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`. **TEST RUN DISCLOSED**:
`test:12d-290` = **19/19 pass** (the two repaired suites run together);
the pre-existing failures named below are **PAID, not grandfathered**:
`test:12d-134` = **10/10**, `test:12d-222` = **9/9**;
`typecheck:12d-290` = **exit 0**. Chain regression (12d-270…290 suites)
= **206/206 across 21 suites, zero failures**. Shell build (`services/xiv-story-shell`
`npm run build`) = **exit 0** (for the record; the shell tree is
unchanged by this rung). **CI IS NOT CLAIMED PASSED**
(`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review). GROK_XAI
review PENDING — never fabricated.

## What this rung is

The 12D-288/289 handoffs disclosed pre-existing failures in the
134/222 chains: both suites failed with
`the operator custody registry (12D-233) is required; fail closed`
from `scaling-execution-bridge.ts` — their execution-bridge fixtures
predate the 12D-235 custody enforcement, which requires
`input.custody instanceof OperatorCustodyRegistry` and consumes BOTH
receipts exactly once at issue time (the plan-approval receipt under
the bridge's `planApprovalPurpose`, the execution-grant receipt under
the bridge's `executionToolId`).

Paid down purely in fixtures — NO contract change:

1. **`instruction-evidence-bridge.test.ts`** (12d-134): added
   `mkScalingCustody` / `mkFailoverCustody` helpers — a FRESH
   `OperatorCustodyRegistry` per fixture, both receipts registered for
   their REAL purposes (the 12D-235 `mkCustody` discipline) — and
   passed `custody:` into both `issue*ExecutionInstruction` calls.
2. **`instruction-adoption-gate.test.ts`** (12d-222): the same
   discipline inside `mkChain` — SCALING registers
   `PLAN_RECEIPT → 'xiv.scaling.decision'` and `GRANT →` the SCALING
   `executionToolId`; FAILOVER registers `PLAN_RECEIPT →
   'xiv.failover.decision'` and `FAIL_GRANT →` the FAILOVER
   `executionToolId`. A fresh registry per `mkChain` call (custody
   consumption is exactly-once, so a shared registry would replay-refuse).
3. **Measured finding**: `adoptCellPlacementOperatively` (the
   `ADOPT_RECEIPT` door) requires NO custody — the 12D-233 enforcement
   lives only in the two execution bridges; no change was needed there.

The suite entry `test:12d-290` runs BOTH repaired suites in one
invocation so the paydown is measurable as a single rung; the
`typecheck:12d-290` entry typechecks both test files against the
adoption gate, the evidence bridge, both execution bridges, and the
custody registry. No new contract module was warranted (the custody
contract itself is 12D-233 and its enforcement is 12D-235 — both
already tested by their own suites, which pass unchanged).

## Exact files

- `services/ai/runtime/offline-team/instruction-evidence-bridge.test.ts`
  (custody fixtures added)
- `services/ai/runtime/offline-team/instruction-adoption-gate.test.ts`
  (custody fixtures added)
- `services/ai/package.json` — `test:12d-290`, `typecheck:12d-290`
- `.gitlab-ci.yml` — `typecheck:12d-290`, `test:12d-290` steps
- `docs/ai-agents/12d-290-custody-fixture-paydown-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-134          # RAN: 10/10 pass (was failing)
npm run test:12d-222          # RAN:  9/9  pass (was failing)
npm run test:12d-290          # RAN: 19/19 pass (both suites together)
npm run typecheck:12d-290     # RAN: exit 0
chain regression 270..290     # RAN: 206/206 (21 suites, zero failures)
shell npm run build           # RAN: exit 0
```

## Defects found and paid down during this story

- (pre-existing, this rung's target) `test:12d-134` / `test:12d-222`
  failed on the 12D-235 custody enforcement because their fixtures
  predated it — paid down with the 12D-235 fixture discipline (fresh
  registry, REAL purposes, exactly-once consumption).
- (disclosed, NOT this rung's debt) the 12d-85…91 "suites" print custom
  OK output rather than node:test summaries — they are not measured by
  this chain and remain a separate, disclosed gap.

## Approval status

No model calls (`modelCalls 0`), no remote calls (`remoteCalls 0`), no
provisioning, no merge, no deployment, no learning promotion, no
activation, no credential use. The commit stages ONLY the files above
and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

- Review decisions on the FOUR settled drafts (GHG chunk-1/2/3 + the
  ALDI chunk-1, all AWAITING_REVIEW) — the human decision is Devin's.
- Read further CEO-named sources through the cycle (BTS, CFPB,
  Austin/Texas Socrata, NSF NCSES are registered; verify the Socrata
  dataset subjects before reading).
- Adopt the 12D-278 bound bridge as the ONLY admission door — CEO
  decision.
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated); rail integration for 12D-266 (BLOCKED on CEO
  authorization + credentials); GitHub Phase 1 lockdown (blocked on
  `! gh auth login`).