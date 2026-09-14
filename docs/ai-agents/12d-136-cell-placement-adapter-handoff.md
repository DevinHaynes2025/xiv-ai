# 12D-136 — Cell-Placement Adoption & Event-Plane Binding (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/cell-placement-adapter.ts` +
`cell-placement-adapter.test.ts`; 7/7 tests + typecheck green; sibling suites
re-run green — 12D-119 8/8, 12D-123 6/6, 12D-126 17/17, 12D-129 12/12,
12D-130 9/9, 12D-131 9/9, 12D-221 12/12, 12D-134 10/10, 12D-133 11/11,
12D-135 6/6, 12D-113 audit 9/9). CI IS NOT CLAIMED PASSED: GitLab CI remains
quota-blocked (`ci_quota_exceeded`) — the `.gitlab-ci.yml` wiring was appended
but no pipeline has run.

## What it is

12D-120 groups 12D-109's shards into regional cells as a pure CONTRACT —
advisory until an operator adopts it in a separately reviewed layer (the
contract's own words). 12D-136 is that layer, the cell sibling of 12D-119's
routing adoption and 12D-135's event-plane adoption, in two halves:

1. `adoptCellPlacementOperatively` — receipt-gated (64-hex sha256 operator
   receipt, per call) operative adoption of a 12D-120 cell plan. The plan is
   UNTRUSTED input, re-asserted through `assertCellPlanInvariants`, and the
   adoption binds the plan's CONTENT — not just its counts — via a canonical,
   order-insensitive `planDigestSha256` (the 12D-135 lesson applied up front).
2. `bindEventPlaneToAdoptedCells` — the cross-contract gate that makes the
   adoption operative: a 12D-123 event-plane plan is only bindable to an
   ADOPTED cell placement, and THREE untrusted packets must agree, none
   trusted on the word of another gate:
   - the COMPOSING cell plan (the one `planEventPlane` consumed) is REQUIRED
     and must digest-match the adoption record — an event plane composed from
     a cell plan the operator never adopted cannot bind, even if every
     placement inside it re-derives;
   - the event-plane epoch, cell count, and stream count must match the
     adopted placement;
   - EVERY stream re-derives against the deterministic `shardCellId` rule
     (defense in depth — the 12D-123 invariants already enforce it; the
     binding re-derives anyway).

### Requirement coverage

- **Receipt-gated at adoption** — wrong format/length receipt, empty or
  garbled identity, negative timestamp all fail closed (regression-tested).
- **The plan is UNTRUSTED input** — re-asserted through the 12D-120
  invariants at adoption and at binding; an unfrozen plan and an
  invariant-violating forged plan (a shard moved against the deterministic
  rule) are both refused (regression-tested).
- **The adoption binds plan CONTENT, not just counts** — a structurally valid
  sibling plan with misstated projections (which the 12D-120 invariants
  cannot re-derive: the plan carries no routing) produces a DIFFERENT digest;
  shuffling the cell array order does NOT change the digest (canonical,
  order-insensitive). Both regression-tested.
- **The composing plan is REQUIRED at binding** — binding refuses without it,
  refuses an unfrozen one, and refuses one whose digest differs from the
  adoption (regression-tested). This is the gap the layer closes: before
  12D-136, nothing bound a 12D-123 event-plane plan to the cell plan the
  operator actually adopted.
- **Per-stream re-derivation as defense in depth** — wrong primary cells,
  co-located replicas, and replicas outside the adopted placement are refused
  (the 12D-123 invariants fire first; the binding re-derives independently).
- **Degraded posture is honest** — a single-cell adoption binds only a
  degraded plane; a multi-cell plane cannot bind a single-cell adoption;
  `replicatedStreamCount: 0` recorded honestly.
- **The binding is a RECORD that authorizes nothing by itself** —
  `infrastructureMaterializedByThisBinding: 0`,
  `realEventStreamsActivated: 0`; 12D-135's `EventRoutedStreams` remains the
  separately reviewed facade that actually moves events (untouched by this
  story).
- **Honest flags** — `humanDecision: 'REQUIRED'`, `learningPromoted: false`,
  `modelCalls: 0`, `remoteCalls: 0`, `realCellsProvisioned: 0`,
  `billionUsersProven: false`, `automaticRecovery: false` on every packet and
  frozen on `CELL_PLACEMENT_ADAPTER_GUARDRAILS`; the measured 2,000,000-row
  per-database ceiling is re-asserted in the tests (12D-103 drill).

### Review finding paid down during this build

1. **Composing-plan gap (adversarial self-review, before commit)** — the
   binding originally took only (eventPlane, cellAdoption) and could verify
   placement arithmetic but had no way to prove the plane was composed from
   the OPERATOR-ADOPTED cell plan; a forged-adoption-digest sub-test exposed
   that the digest was recorded but never checked against anything. Closed:
   the composing cell plan is now a required third input, digest-gated
   against the adoption, with the plane/epoch/cell-count checks layered
   behind it. Regression-tested (digest mismatch, missing composing plan,
   forged adoption digest all fail closed).

Residuals (disclosed):
- The binding verifies the composing plan via its digest; if the composing
  plan itself misstates projections against the true routing (the 12D-120
  invariants cannot re-derive projections — the plan carries no routing),
  the digest binds the misstatement too. That is the same disclosed
  digest-trust residual as 12D-130/131/134: receipts authenticate
  out-of-band via the operator custody registry.
- A cell-level OPERATIVE facade (a cell-routed sibling of
  `EventRoutedStreams`) is NOT built here — the binding is a record for
  downstream operative layers, and 12D-135 remains the reviewed facade that
  moves events.
- Real cell provisioning, cross-host placement, and instruction-side
  adoption remain future, separately reviewed steps; nothing here provisions
  infrastructure. Ollama kept available but idle per the CEO directive
  (`modelCalls: 0` throughout).

## Exact files

- `services/ai/runtime/offline-team/cell-placement-adapter.ts` (new)
- `services/ai/runtime/offline-team/cell-placement-adapter.test.ts` (new)
- `services/ai/package.json` (`test:12d-136`, `typecheck:12d-136`)
- `.gitlab-ci.yml` (`typecheck:12d-136`, `test:12d-136` appended)

## Exact commands and local results

```
npm run typecheck:12d-136   # OK
npm run test:12d-136        # 7/7 pass
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
npm run test:12d-113        # 9/9 pass (guardrail audit)
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

Reviewers: CLAUDE_CODE (self-review: one confirmed finding — the
composing-plan gap — paid down before commit with the required-input gate
and regression tests). GROK_XAI PENDING — never fabricated. No provider
call, no traffic movement, no production mutation, no merge, no deployment,
no learning promotion occurred in this story; `billionUsersProven: false`.
Awaiting CEO authorization for any merge/deploy (standing rule).