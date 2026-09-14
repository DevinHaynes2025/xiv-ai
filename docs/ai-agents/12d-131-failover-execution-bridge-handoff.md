# 12D-131 — Failover-plan execution-instruction bridge (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/failover-execution-bridge.ts` +
`failover-execution-bridge.test.ts`; 9/9 tests + typecheck green; 12D-126 sibling
re-run green 17/17 with the recordDigest paydown; 12D-113 audit green — no new
guardrails debt). The failover sibling of 12D-130's scaling bridge: it performs the
handoff that 12D-127/128's decision records REQUIRE
(`requiresDecisionSafetyWorkflowBeforeAnyAction: true`).

## What it is

`issueFailoverExecutionInstruction` takes a presented 12D-127/128
`FAILOVER_DECISION_RECORD` plus its full provenance and drives the 12D-121 gate
ladder for exactly one bounded CANARY traffic-shift proposal, emitting a 12D-121
`EXECUTION_INSTRUCTION` with `executedByThisRuntime: false` and
`productionExecutionAllowed: false`. It MATERIALIZES NOTHING and MOVES NO TRAFFIC:
`trafficMoved: false` and `authorizedTrafficBps: 0` remain structural on the issued
packet; the instruction is the operator's work order in a system outside this
runtime, and outcome recording stays DECLARED in 12D-121's MEASURE_OUTCOME stage
(the full ten-stage ladder completes — regression-tested).

Governing properties, as enforced (identical trust structure to 12D-130, applied to
failover):

- **The presented decision record is UNTRUSTED**: the plan is re-composed from the
  declared provenance and the decision RE-RECORDED through 12D-128's own
  receipt-gated, provenance-verified contract; exact-match comparison — including the
  record's `recordDigest` (12D-130 discipline) — before anything is opened.
- **A DECLINED record is a final state**; no instruction can ever be manufactured
  from a decline.
- **Risk class PINNED** to `PRODUCTION_CONFIGURATION`; tool PINNED to the single
  canonical `xiv.traffic.failover`; the purpose-built workflow identity must be
  `ADVISE_ONLY` with EXACTLY that one approved tool. The `minimumAction` text is
  module-composed from re-derived values: a CANARY-shift work order naming the
  recorded `requestedTrafficBps` (already bounded by the policy canary ceiling at
  plan time, transitively guaranteed by re-derivation) and forbidding everything
  else — no other traffic, no classified workload, no provider invocation without a
  separate grant.
- **The execution grant is a SEPARATE human act**: its receipt must differ from the
  plan-approval receipt, and it cannot chronologically predate the decision it
  executes (equal timestamps legitimate — regression-tested).

## Sibling paydown (in measured-regional-failover.ts, this story)

The 12D-130 recordDigest finding applied verbatim to the failover sibling:
`FailoverDecisionRecord` carried no digest over itself, so a post-hoc swap of the
recorded human-authorization fields (decision, receipt, decider, timestamp) —
spread, re-frozen, digest untouched — re-derived cleanly and could obtain an
execution instruction. Closed: every `FailoverDecisionRecord` now carries
`recordDigest` = sha256 over `{planDigest, candidateRegionId, requestedTrafficBps,
decision, decidedBy, decidedAtMs, operatorReceiptSha256}`; the bridge's exact-match
comparison includes it. Regression tests: single-variable recordDigest isolation
(accept/decline, receipt, timestamp, decider swap detectable) in the 12D-126 suite
(17/17 re-run green); seven forged-record variants (decision flip, receipt swap,
decider swap, timestamp shift, region tamper, bps tamper, digest forgery) all throw
in the bridge suite (9/9).

Residual (disclosed, inherent — same as 12D-130): a forger who recomputes
`recordDigest` produces a self-consistent record; the receipt is authenticated
out-of-band by the operator's custody registry, the standing trust anchor of every
receipt-gated contract since 12D-119.

## Honest state

No traffic has ever been moved by this runtime — `trafficMoved: false` and
`authorizedTrafficBps: 0` are structural on every path, plan and record and
instruction alike. The workflow executes nothing; `EXECUTED_BY_OPERATOR` outcomes
are DECLARED by the operator, never inferred. No region has ever been probed — all
evidence is declared. `billionUsersProven: false`. Reviewer receipts: CLAUDE_CODE.
GROK_XAI PENDING — never fabricated.