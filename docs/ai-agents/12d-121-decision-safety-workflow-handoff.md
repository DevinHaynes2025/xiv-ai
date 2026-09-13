# 12D-121 — Agent Decision Safety Workflow (handoff)

Status: BUILT LOCALLY on `claude/12d-99-supervised-local-worker`. Implements the master
plan (Investor Edition, "AI Agent Decision Safety Workflow") as a backend contract, and
pairs with 12D-122's governed Story Engine screen on the frontend (the investor demo's
"GOVERNED AGENT" + "AUDIT CENTER" items).

## What it is

`agent-decision-safety-workflow.ts` turns the constitution's `humanDecision: 'REQUIRED'`
from a flag into an enforceable STAGE MACHINE — the master plan's ladder, verbatim:

```
USER/EVENT -> IDENTITY_AND_POLICY -> AGENT_PLANNER -> TOOL_GATE -> PROPOSED_ACTION ->
RISK_CHECK -> HUMAN_APPROVAL -> RE_AUTHORIZE -> EXECUTE_MINIMUM_ACTION ->
MEASURE_OUTCOME -> AUDIT_AND_MONITOR
```

- `DECISION_SAFETY_POLICY` (frozen): the master plan's seven high-impact action classes
  (PAYMENT, PRIVILEGED_ACCESS, DELETION, PRODUCTION_CONFIGURATION, EMPLOYEE_ACTION,
  MATERIAL_FINANCIAL, SENSITIVE_EXTERNAL_COMMUNICATION) ALWAYS require explicit human
  authorization regardless of the agent's action policy; LOW_RISK is the only
  receipt-free class and only under a deliberately configured BOUNDED_AUTOMATION
  identity; event cap 64 per workflow; bounded identity/tool/purpose/description sizes;
  instruction validity 60s.
- `openDecisionWorkflow` — the IDENTITY_AND_POLICY gate: least-privilege agents need an
  approved-tool scope (non-empty, distinct), data boundaries, a known action policy and
  a bounded time limit, or the workflow never opens.
- `proposeGovernedAction` — AGENT PLANNER → TOOL GATE → PROPOSED ACTION → RISK CHECK:
  a tool outside the approved scope never reaches a proposal; a proposal authorizes
  NOTHING (`productionExecutionAllowed: false`, structurally).
- `authorizeMinimumAction` — HUMAN APPROVAL (operator receipt, 64-hex sha256, the
  12D-119 discipline) → RE-AUTHORIZE (liveness + audit chain re-verified immediately
  before) → EXECUTE MINIMUM ACTION: emits a bounded `EXECUTION_INSTRUCTION` with
  `executedByThisRuntime: false` and `productionExecutionAllowed: false` — this runtime
  MATERIALIZES NO SIDE EFFECT. Turning an instruction into an action is the operator's
  job in a separately reviewed adoption layer (the 12D-119 pattern).
- `recordMeasuredOutcome` — the outcome is DECLARED by the caller and recorded verbatim;
  nothing is invented, inferred, or promoted into learning. The declared outcome union is
  RUNTIME-enforced (a `knownOutcomes` policy list) and the optional note is validated and
  bounded.
- `recordAuditAndMonitor` — the ladder's terminal AUDIT_AND_MONITOR stage, recorded once
  after MEASURE_OUTCOME on a verified chain, so a completed workflow's trail evidences
  all ten stages.
- `auditTrail` / `verifyAuditChain` — append-only, hash-chained (sha256 over
  workflowId|prevHash|seq|stage|atMs|detail) event trail; the GENESIS event is chained to
  a hash of the workflow's METADATA (id, lifetime, purpose, identity, approved-tool
  scope), so tampering metadata — not just events — breaks the chain; tampering ANY byte
  fails closed and is never repaired; a trail that doesn't match the workflow's stage
  fails closed; event timestamps are monotonic.
- Stage machine: transitions are enforced — a proposal only on a freshly opened workflow
  (ONE workflow authorizes ONE minimum action), authorization only at the RISK_CHECK
  stage, outcomes only after EXECUTE_MINIMUM_ACTION, audit only after MEASURE_OUTCOME —
  and every authorization is bound to the trail by a PROPOSAL DIGEST committed into the
  hash-chained events, so a forged or re-labeled proposal object (e.g. a PAYMENT
  re-labeled LOW_RISK) never matches and can never reach the receipt gate.

## Honest state

Every workflow, proposal, instruction, and audit report carries `humanDecision:
'REQUIRED'`, `learningPromoted: false`, `modelCalls: 0`, `remoteCalls: 0`,
`realActionsExecuted: 0`, `automaticRecovery: false`. Guardrails include
`separatesRecommendationAuthorizationExecution`, `noInsightJumpsToIrreversibleAction`,
`executesNothing`, `minimumActionOnly`, `auditIsHashChained`. Zero network calls in the
module (node:crypto only) — 12D-113's authorized-surface audit still applies.

## What this does NOT claim

No real agent has run this ladder against a real system. No purchase order, payment,
deletion, or configuration change has been executed or simulated beyond example data.
The contract authorizes nothing by itself; the receipt is evidence of a human decision,
not the action itself. `realActionsExecuted: 0` is structural, forever, in this runtime.

## Verification

11/11 tests (`test:12d-121`): frozen honest policy/guardrails/constitution; the seven
high-impact classes verbatim; the declared-outcome union; the IDENTITY_AND_POLICY
least-privilege gate (empty and duplicate tools, unknown action policy, bad time limits,
blank purpose, malformed identity); the frozen-and-chain-bound approved-tool scope
(caller-side array push rejected, metadata tamper rejected); the TOOL GATE (out-of-scope
tool, unknown risk class, expired workflow, second proposal rejected); trail-bound
authorization (forged LOW_RISK re-label of a recorded PAYMENT rejected, fresh-workflow
authorize rejected, description re-label rejected); receipt-gated high-impact
authorization (`executedByThisRuntime: false`, instruction validity bounded, double
instruction rejected, cross-workflow proposal rejection, backwards timestamps rejected);
the policy-delegated LOW_RISK/BOUNDED_AUTOMATION path (audited, still executes nothing;
a high-impact class on a bounded agent still demands the receipt; a malformed receipt
fails closed); validated declared outcomes (`learningPromoted: false`, invented outcome
rejected, oversized/non-string note rejected, second outcome rejected); the full
ten-stage ladder reachable and recorded via `recordAuditAndMonitor`; the hash chain
byte-identical across replays and tamper-evident against rewritten details, forged
hashes, deleted events, emptied trails, transplanted foreign trails, and metadata
tampering (expiresAtMs / action policy / tool scope — all break event 1 via the genesis
binding). `typecheck:12d-121` PASS. Wired into `.gitlab-ci.yml`.

### Adversarial review (paydown record)

10-agent review workflow (2 review lenses — semantics + governance — every finding
adversarially verified with live tsx reproduction by independent verifiers): **7
confirmed findings (4 BLOCKING after dedup, 3 CONSERVATIVE), 1 refuted. All confirmed
findings fixed BEFORE commit; tests re-run 11/11 and typecheck PASS after the fixes.**

- BLOCKING (both lenses, live-reproduced): `authorizeMinimumAction` trusted the
  caller-forged proposal — a recorded PAYMENT could be authorized receipt-free via a
  hand-built LOW_RISK proposal, and the ladder could be skipped entirely by authorizing
  directly on a fresh workflow. FIXED: the receipt gate is derived only after the
  proposal's digest (sha256 over workflowId|actionId|toolId|riskClass|description)
  matches the hash-chained PROPOSED_ACTION/RISK_CHECK events, and authorization requires
  exactly the RISK_CHECK stage. Regression tests added for both attack paths.
- BLOCKING (live-reproduced): the hash chain did not bind workflow metadata — a rebuilt
  object with a forged `expiresAtMs` (+1 year) or a widened/flipped identity passed
  `verifyAuditChain`/`auditTrail` with `chainValid: true`. FIXED: genesis binding —
  event 1 is chained to sha256 of the workflow's metadata (id, openedAt, expiresAt,
  purpose, identityId, actionPolicy, exact tool scope, data boundaries); any metadata
  tamper now breaks event 1. Regression tests added.
- BLOCKING (live-reproduced): the approved-tool scope was only shallow-frozen — pushing
  a tool into the caller's still-shared array after admission widened the TOOL GATE's
  scope with zero tamper evidence. FIXED: the workflow deep-copies and freezes the scope
  AND the scope's exact content is committed to the chain via the genesis hash.
  Regression test added.
- CONSERVATIVE: no stage-transition enforcement — double EXECUTE, authorize after a
  DECLINED outcome, propose after EXECUTE were all accepted, and event timestamps could
  move backwards between stages. FIXED: every entry point requires its predecessor stage
  (propose ⇐ IDENTITY_AND_POLICY, authorize ⇐ RISK_CHECK, outcome ⇐ EXECUTE_MINIMUM_ACTION,
  audit ⇐ MEASURE_OUTCOME) and `appendEvent` enforces monotonic timestamps. Regression
  tests added.
- CONSERVATIVE: `AUDIT_AND_MONITOR` existed in the policy ladder but no code path could
  ever record it (9/10 stages reachable). FIXED: new exported `recordAuditAndMonitor`
  terminal step (fail-closed on stage and chain). Test asserts the full ten-stage trail.
- CONSERVATIVE: `recordMeasuredOutcome` accepted any non-empty string as an outcome
  (`'TOTALLY_MADE_UP'` live-reproduced into the hash-chained trail as "evidence") and
  coerced non-string notes. FIXED: a frozen `knownOutcomes` policy list is enforced and
  the optional note is validated and bounded (500 chars). Regression tests added.
- REFUTED (discarded, disclosed): "billionUsersProven missing from all sibling 12D
  packets diverges from the constitution" — the verifier checked ~430 non-test files in
  runtime/offline-team: only three carry the flag (the 12D-109/119/120 partition chain),
  so the "every sibling" premise was false and the finding was discarded. The decision-
  safety workflow materializes no scale claim, so the flag has nothing to certify here.

## Trust limits

A workflow authorizes nothing and executes nothing. The EXECUTION_INSTRUCTION is
advisory until an operator acts on it in a system outside this runtime. Every gate, the
time limit, and the hash chain fail closed; an expired workflow proposes nothing.