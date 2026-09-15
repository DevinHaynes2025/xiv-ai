# 12D-225 — Gateway Executor (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/gateway-executor.ts` + test, plus the
`isOperational` executor-boundary probe added to 12D-224's
`agent-policy-gateway.ts`; 14/14 focused tests + 16/16 gateway tests +
typecheck green; direct sibling suites re-run green — 12D-121 11/11,
12D-221 9/9, 12D-123 6/6, 12D-125 6/6, 12D-124 5/5). CI IS NOT CLAIMED
PASSED: GitLab CI remains quota-blocked (`ci_quota_exceeded`); the
`.gitlab-ci.yml` wiring was appended but no native pipeline has executed on it.

## What it is

The 12D-224 charter reserves execution for "a separately reviewed executor
story [that] must consume these records, re-verify, and remain bounded by the
same thresholds." 12D-225 is that executor as a pure, fail-closed VERIFICATION
engine: `GatewayExecutor.executeClearedCall` presents a 12D-224
`GatewayDecisionRecord` PLUS the exact request it decided, and the executor
NEVER TRUSTS THE RECORD — it re-runs the gateway decision on the presented
request and requires the fresh kind AND digest to match, re-checks liveness
AND the time budget at the EXECUTION timestamp (new `isOperational` probe,
stricter than the gate's liveness check), consumes the decision digest
(one instruction per decision, replay refused), and only then emits a frozen
`EXECUTION_INSTRUCTION_ISSUED` record. The executor itself EXECUTES NOTHING
and MATERIALIZES NOTHING.

### Fail-closed verification ladder (in order)

1. Structural validation of the presentation (malformed → `REFUSED_MALFORMED`).
2. Bound gateway's audit trail must verify (`REFUSED_TRAIL_TAMPERED`).
3. Only clearances are executable — `AUTO_RUN_CLEARED` /
   `HUMAN_APPROVAL_VERIFIED`; every refusal kind is terminal
   (`REFUSED_KIND_NOT_EXECUTABLE`).
4. One instruction per decision digest (`REFUSED_REPLAY`).
5. Re-decide: fresh gateway decision must match kind (`REFUSED_STALE`) and
   digest (`REFUSED_DIGEST_MISMATCH`) — catches budget exhaustion, registry
   drift, stop, permission change, and cross-gateway forgery.
6. `isOperational` at the EXECUTION timestamp (`REFUSED_STALE`) — catches
   expiry/stop/time-budget changes after the decision.

### Owner controls frozen as policy (`12d-225-v1`)

`reVerifiesEveryRecord: true`; `oneInstructionPerDecisionDigest: true`;
`oneExecutorPerGateway: true` (WeakSet binding closes the cross-executor
replay path); executable kinds exactly the two clearances; guardrails
`executesNothing` / `materializesNothing` /
`reChecksLivenessAtExecutionTime` /
`approvalCannotLaunderProhibitedAction`; zero model calls; zero remote calls;
`humanDecision: 'REQUIRED'`; `learningPromoted: false`.

Approval-verified instructions carry `humanDecision: 'REQUIRED'` AND
`requiresDecisionSafetyWorkflowBeforeAnyAction: true` — the 12D-121
decision-safety workflow is required before ANY side effect. Refusals never
consume a decision digest (a failed forgery or stale check leaves the genuine
record usable — regression-tested).

### CEO-review findings identified during this build (all paid down before commit)

1. **Instruction cap threw AFTER consuming the digest** — a cap-exceeded
   throw would leave a consumed digest with no instruction. Cap check moved
   BEFORE consumption (invariant guard, not a policy threshold).
2. **Executor refusal records stamped the request's `nowMs`, not the
   execution time** — refusal trail entries now stamp `executedAtMs` when
   valid (falling back only for presentations too malformed to carry one).
3. **`input.executedAtMs` dereferenced on a possibly-null presentation** on
   the malformed path — would have thrown a TypeError instead of returning
   `REFUSED_MALFORMED`. Optional-chained; the malformed path now builds its
   record for any input.
4. **12D-224 gap closed here: no read-only liveness probe existed** — added
   `isOperational(agentId, nowMs)` (liveness AND declared time budget,
   read-only, appends nothing) with its own regression tests in the 224 suite.

Residuals (disclosed):
- **Executor binding is per-process**: `BOUND_GATEWAYS` (WeakSet) prevents a
  second executor on the same gateway instance within one process; a durable
  cross-process consumption registry is a future story. Reconstruction in a
  new process cannot see prior consumptions.
- **The re-verification IS the authoritative budget charge**: executing a
  cleared call consumes one additional budget unit at the executor boundary;
  an agent whose remaining budget is exactly zero after the clearance cannot
  execute (fail-closed, regression-tested as documented behavior).
- **Approval age-bounding** remains the 12D-121 trail's job at the executor
  boundary (same disclosure as 12D-224).
- The executor emits instructions only; the RUNNER that would act on them is
  a future story and does not exist. Nothing executes today.
- `auditEntries()` on the gateway returns the live trail array (by design for
  the sibling CLI readers); the executor detects injected entries via
  `REFUSED_TRAIL_TAMPERED` (regression-tested), and refuses to bind to a
  tampered gateway at construction.

## Exact files

- `services/ai/runtime/offline-team/gateway-executor.ts` (new)
- `services/ai/runtime/offline-team/gateway-executor.test.ts` (new)
- `services/ai/runtime/offline-team/agent-policy-gateway.ts` (`isOperational` added)
- `services/ai/runtime/offline-team/agent-policy-gateway.test.ts` (probe regression tests)
- `services/ai/package.json` (`test:12d-225`, `typecheck:12d-225`)
- `.gitlab-ci.yml` (`typecheck:12d-225`, `test:12d-225` appended)

## Exact commands and local results

```
npm run typecheck:12d-225   # OK (exit 0)
npm run test:12d-225        # 14/14 pass
npm run test:12d-224        # 16/16 pass
npm run test:12d-121        # 11/11 pass
npm run test:12d-221        # 9/9 pass
npm run test:12d-123        # 6/6 pass
npm run test:12d-125        # 6/6 pass
npm run test:12d-124        # 5/5 pass
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

Reviewers: CLAUDE_CODE (self-review: 4 findings identified, all confirmed and
paid down with fixes/regression tests before commit, 0 refuted).
GROK_XAI PENDING — never fabricated. No provider call, no traffic movement,
no production mutation, no cell provisioning, no merge, no deployment, no
learning promotion, no Ollama invocation occurred in this story;
`billionUsersProven: false`, `modelCalls: 0`, `remoteCalls: 0`,
`trafficMoved: false`, `productionMutationAllowed: false`,
`humanDecision: 'REQUIRED'` throughout. Awaiting CEO authorization for any
merge/deploy (standing rule).

## Relationship to the pending 12D-223 reconciliation

The two 12D-223 reconciliation documents remain UNTRACKED pending the CEO's
reconciliation authorization, per the standing hold, as does the 12D-224
commit `1c9e70c7`. This story's commit stages ONLY its own six files and
does not touch them.