# 12D-222 — Instruction-Side Adoption & Lineage Reconciliation (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/instruction-adoption-gate.ts` +
`instruction-adoption-gate.test.ts`; 9/9 focused tests + typecheck green;
sibling suites re-run green — 12D-119 8/8, 12D-123 6/6, 12D-126 17/17,
12D-129 12/12, 12D-130 9/9, 12D-131 9/9, 12D-221 12/12, 12D-134 10/10,
12D-133 11/11, 12D-135 6/6, 12D-136 7/7, 12D-113 guardrail audit 9/9).
CI IS NOT CLAIMED PASSED: GitLab CI remains quota-blocked
(`ci_quota_exceeded`) — the `.gitlab-ci.yml` wiring was appended but no
pipeline has run.

## What it is

Every adoption layer so far trusted its own slice (12D-119 routing, 12D-135
event plane, 12D-136 cell placement + binding, 12D-134 one instruction's
provenance). Nothing bound an EXECUTION_INSTRUCTION to the adopted placement
lineage in ONE recomposed, fail-closed record. 12D-222 is that gate:
`InstructionAdoptionGate.adoptInstruction` recomposes and revalidates the
complete chain — source instruction → instruction plan → cell-placement plan →
operator adoption → event-plane plan → event-plane binding → bounded
instruction adoption — treating EVERY presented packet as untrusted.

### The recomposition gates, in order

1. **Shape/scope** — unknown scope refused; wildcard refusals are structural
   (the id charset excludes `*`; storyId must match `^12D-[0-9]{1,4}$` and
   concrete-12D-only); sourceRevision must be 40-hex; per-call 64-hex operator
   receipt; the 12D-121 execution grant (a separate human act) presented with
   a 64-hex receipt and a valid approver identity.
2. **Instruction plan** — the decision record is UNTRUSTED: kind matched to
   scope, `recordDigest` re-derived (`deriveScalingRecordDigest` /
   `deriveFailoverRecordDigest`), DECLINED refused as a final state; the plan
   is RECOMPOSED from its full provenance and the planDigest must re-derive;
   tenant/universe/sourceRevision re-checked against the provenance request —
   the ONLY artifact in the presented chain carrying those fields (disclosed).
3. **Instruction chain** — mirrored from 12D-134: hash chain re-verified,
   stage exactly EXECUTE_MINIMUM_ACTION, instruction frozen + owned,
   honest-flags structural, temporal windows (recording inside the
   instruction's validity, never predating the decision), cross-contract
   actionId re-derived EXACTLY (`<prefix><planDigest-16>.<count|bps>`).
4. **Structured trail evidence** (never substring probes): the proposal must
   appear in a PROPOSED_ACTION event whose detail EXACTLY equals the canonical
   recording; the approval must EXACTLY equal the canonical approval detail
   naming the presented execution grant's approver; a RE_AUTHORIZE event must
   sit between approval and the EXECUTE_MINIMUM_ACTION event whose detail
   EXACTLY equals the canonical issuance for this actionId. One action/digest
   cannot impersonate another through prefix or substring collisions.
5. **Placement chain** — cell plan frozen + invariants; operator adoption
   frozen, receipt/timestamp/adopter re-validated, `cellPlanDigestOf(plan)`
   digest match, freshness ≤ 300 s (stale and future-dated refused); event
   plane frozen + invariants; the binding is RE-DERIVED via
   `bindEventPlaneToAdoptedCells` and the presented binding must FIELD-match
   it (canonical field-explicit comparison — never key-order-sensitive
   serialization).
6. **Replay** — one adoption per instruction lineage per gate instance
   (scope|tenant|universe|instruction digest|adoption digest|binding digest).
7. **Output** — a frozen `INSTRUCTION_ADOPTION_RECORD` binding tenantId,
   universeId, storyId, sourceRevision, instructionId (DERIVED by the gate as
   `${workflowId}:${actionId}` — never caller-controlled), the full digest
   chain (instructionDigest, cellPlanDigest, cellAdoptionDigest,
   eventPlaneDigest, bindingDigest), the per-call operator receipt, the policy
   version, and `expiresAtMs = min(instruction.validUntilMs, recordedAtMs +
   recordValidityMs)`. It executes nothing and grants no production authority.

### CEO review findings paid down during this build (all regression-tested)

1. **HUMAN_APPROVAL receipt binding** — the approval event is bound to its
   canonical detail naming the PRESENTED execution grant's approver, with the
   grant's receipt format-gated. DISCLOSED RESIDUAL: the 12D-121 trail
   intentionally never records the RAW receipt value (secrets never ride the
   hash-chained trail); the receipt is authenticated out-of-band by the
   operator custody registry. This is the strongest recomposition available
   without altering the upstream ladder.
2. **Substring-only checks removed** — proposal, approval, re-authorize, and
   execute events are matched by EXACT canonical details, so one action/digest
   cannot impersonate another through prefix or substring collisions.
3. **instructionId derived, not accepted** — the gate composes
   `${workflowId}:${actionId}` from verified objects; no caller-controlled
   instructionId input exists anymore.
4. **storyId carries NO upstream lineage evidence** — no 12D contract in the
   chain records a story id. The presented storyId is shape-validated and
   bound verbatim, and the record marks
   `storyIdIsAnUnverifiedCallerAssertion: true`; consumers must not treat it
   as lineage evidence. (Same discipline as the 12D-124 storyId declarations.)
5. **tenantId/universeId/sourceRevision re-checked across every carrier** —
   the decision-provenance request is the only such artifact; documented in
   the module header.
6. **Key-order-safe binding comparison** — `sameBinding` compares every
   semantic field explicitly instead of `JSON.stringify` equality.
7. **Adversarial coverage** — future-dated decisions, expired instructions,
   negative and non-safe-integer timestamps, receipt-format errors, replay,
   altered workflow events, wrong actionIds, forged digest chains, malformed
   adoption receipts/timestamps/adopters, forged bindings, wrong-family
   records, and wrong-lineage bindings are all regression-tested.
8. **Replay protection is PROCESS-LOCAL, NOT durable** — the in-memory
   `#adopted` set forgets on restart and never spans processes. The guardrail
   `replayProtectionIsProcessLocalNotDurable` is frozen and the record makes
   no durability claim. A durable atomic replay store is a future,
   separately-reviewed story.

Residuals (disclosed):
- The raw execution-grant receipt value is out-of-band (upstream design); the
  custody registry authenticates it.
- The binding verifies the composing plan via its content digest; a composing
  plan that misstates projections binds its misstatement (same digest-trust
  residual as 12D-130/131/134/136).
- The link between the instruction plan and the cell placement is
  EPOCH-COUPLED through the event-plane binding (plane ↔ adopted cells), but
  the scaling/failover plan and the cell plan share no derivable digest — the
  record carries both digests; a deeper derivation is future work.
- Ollama kept IDLE per the CEO directive (`modelCalls: 0` throughout).

## Exact files

- `services/ai/runtime/offline-team/instruction-adoption-gate.ts` (new)
- `services/ai/runtime/offline-team/instruction-adoption-gate.test.ts` (new)
- `services/ai/runtime/offline-team/event-plane-adapter.ts` (edited: the
  private digest renamed to the exported `eventPlanePlanDigestOf` — same
  canonical preimage, so 12D-222 re-derives against the EXACT digest the
  12D-135 adoption uses; no behavior change, sibling suite 6/6 green)
- `services/ai/runtime/offline-team/cell-placement-adapter.ts` (edited:
  `cellPlanDigestOf` exported for the same reason; no behavior change,
  sibling suite 7/7)
- `services/ai/package.json` (`test:12d-222`, `typecheck:12d-222`)
- `.gitlab-ci.yml` (`typecheck:12d-222`, `test:12d-222` appended)

## Exact commands and local results

```
npm run typecheck:12d-222   # OK (exit 0)
npm run test:12d-222        # 9/9 pass
npm run test:12d-119        # 8/8 pass
npm run test:12d-123        # 6/6 pass
npm run test:12d-126        # 17/17 pass
npm run test:12d-129        # 12/12 pass
npm run test:12d-130        # 9/9 pass
npm run test:12d-131        # 9/9 pass
npm run test:12d-221        # 12/12 pass
npm run test:12d-134        # 10/10 pass
npm run test:12d-133        # 11/11 pass
npm run test:12d-135        # 6/6 pass
npm run test:12d-136        # 7/7 pass
npm run test:12d-113        # 9/9 pass (guardrail audit)
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists (native pipeline did
not execute for MR !114's head either; verified by the CEO against GitLab).

## Approval status

Reviewers: CLAUDE_CODE (self-review: the CEO's 8-point risk list paid down —
see above; one additional defense-in-depth finding, untrusted adoption
receipt/timestamp/adopter fields, paid down before commit with regression
tests). GROK_XAI PENDING — never fabricated. No provider call, no traffic
movement, no production mutation, no cell provisioning, no merge, no
deployment, no learning promotion, no Ollama invocation occurred in this
story; `billionUsersProven: false`, `modelCalls: 0`, `remoteCalls: 0`,
`realCellsProvisioned: 0`, `trafficMoved: false`, `authorizedTrafficBps: 0`,
`executionStarted: false`, `productionMutationAllowed: false`,
`humanDecision: 'REQUIRED'` throughout. Awaiting CEO authorization for any
merge/deploy (standing rule).