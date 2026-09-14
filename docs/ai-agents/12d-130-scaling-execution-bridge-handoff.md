# 12D-130 — Scaling-plan execution-instruction bridge (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/scaling-execution-bridge.ts` +
`scaling-execution-bridge.test.ts`; 9/9 tests + typecheck green, plus a 12D-129
sibling paydown re-run green 12/12). The adoption layer 12D-129's decision records
name: every scaling decision record carries
`requiresDecisionSafetyWorkflowBeforeAnyAction: true` — a REQUIREMENT; this module is
the separately reviewed layer that performs that handoff to 12D-121.

## What it is

`issueScalingExecutionInstruction` takes a presented 12D-129 `SCALING_DECISION_RECORD`
plus its full provenance and drives the 12D-121 gate ladder
(IDENTITY_AND_POLICY → AGENT_PLANNER → TOOL_GATE → PROPOSED_ACTION → RISK_CHECK →
HUMAN_APPROVAL → RE_AUTHORIZE → EXECUTE_MINIMUM_ACTION) for exactly one bounded
database-provisioning proposal, emitting a 12D-121 `EXECUTION_INSTRUCTION` with
`executedByThisRuntime: false` and `productionExecutionAllowed: false`. It
MATERIALIZES NOTHING: no database is provisioned, no rows are moved
(`databasesProvisioned: 0`, `rowsMoved: 0` structural), no provider is invoked. The
emitted instruction is the operator's work order in a system outside this runtime;
outcome recording stays DECLARED in 12D-121's MEASURE_OUTCOME stage (the full
ten-stage ladder completes through `recordMeasuredOutcome` + `recordAuditAndMonitor`
— regression-tested).

Governing properties, as enforced:

- **The presented decision record is UNTRUSTED.** The bridge re-composes the plan from
  the declared provenance and RE-RECORDS the decision through 12D-129's own
  receipt-gated, provenance-verified contract; the presented record must match the
  re-derived one EXACTLY (canonical field-by-field equality) before anything is
  opened — the 12D-128 discipline applied one layer up.
- **A DECLINED_BY_HUMAN record is a final state.** No instruction can ever be issued
  from a decline — that would manufacture authorization no human gave.
- **Risk class PINNED** to `PRODUCTION_CONFIGURATION` (a 12D-121
  always-human-authorized class) and tool PINNED to the single canonical
  `xiv.database.provision`; the purpose-built workflow identity must be `ADVISE_ONLY`
  and carry EXACTLY that one approved tool — the bridge never down-labels and never
  widens. The `minimumAction` text is composed by the module from re-derived values
  (count, plan digest, move-no-rows clause) — the caller never authors instruction
  text.
- **The execution grant is a SEPARATE human act**: its operator receipt must DIFFER
  from the plan-approval receipt that produced the decision record — one receipt
  authorizing two separate gates would collapse the separation the decision-safety
  ladder exists to keep.
- **Temporal ordering**: the execution grant cannot chronologically predate the human
  decision it executes (the 12D-127/129 rule, one layer up; equal timestamps remain
  legitimate — regression-tested).

## Adversarial review (paydown record)

One confirmed finding, paid down before commit in the 12D-129 sibling module
(recordDigest — see below), plus one residual disclosed:

1. **CONSERVATIVE (found live by the forged-record regression test) — the 12D-129
   decision record carried no digest over itself.** The recorded human-authorization
   fields (decision, receipt, decider, timestamp) are embedded verbatim by
   `recordScalingDecision`, so plan-provenance re-derivation alone could NOT detect a
   post-hoc field swap: a record with its receipt or decider altered — spread,
   re-frozen, digest untouched — re-derived cleanly and would have obtained an
   execution instruction. Fixed in `measured-horizontal-scaling.ts` (sibling paydown,
   same story): every `ScalingDecisionRecord` now carries `recordDigest` = sha256 over
   `{planDigest, proposedNewDatabaseCount, decision, decidedBy, decidedAtMs,
   operatorReceiptSha256}`, and the bridge's exact-match comparison (canonical JSON)
   includes it — any field tampering breaks re-derivation and fails closed BEFORE any
   workflow is opened. Regression tests: single-variable recordDigest isolation over
   every recorded field in the 12D-129 suite (12/12); the six forged-record variants
   (decision flip, receipt swap, decider swap, timestamp shift, count tamper, digest
   forgery) all throw in the bridge suite (9/9).

Residual (disclosed, inherent to receipt-gated contracts): a forger who recomputes
`recordDigest` over fabricated inputs produces a SELF-CONSISTENT record that re-derives
cleanly — the receipt itself is authenticated out-of-band by the operator's custody
registry (the operator compares the record's receipt against the receipt they
actually issued), the same trust anchor as every receipt-gated contract since 12D-119.
The contract layer cannot authenticate a receipt; it can and does make every field
tamper detectable against the digest pinned at recording time.

## Honest state

No database has ever been provisioned by this runtime — `databasesProvisioned: 0` and
`rowsMoved: 0` are structural, and the instruction's
`executedByThisRuntime: false` / `productionExecutionAllowed: false` are 12D-121
structural. The workflow executes nothing; `EXECUTED_BY_OPERATOR` outcomes are
DECLARED by the operator, never inferred. `billionUsersProven: false`. Reviewer
receipts: CLAUDE_CODE. GROK_XAI PENDING — never fabricated.