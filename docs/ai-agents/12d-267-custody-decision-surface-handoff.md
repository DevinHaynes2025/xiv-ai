# 12D-267 — Custody Decision Surface (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-custody-decision-view.ts` + 13
adversarial tests + the `services/xiv-story-shell` custody-decision
surface + a 12D-247 verifier paydown disclosed below). **TEST RUN
DISCLOSED**: `test:12d-267` (node TAP via tsx) = **13/13 pass**;
`typecheck:12d-267` (strict tsc) = **exit 0**; `npm run build` in
`services/xiv-story-shell` = **compiled successfully** (route `/`
static, `/api/ingest`, `/api/ingest/custody`, `/api/ingest/verdict`
dynamic). Sibling regressions (single tsx run): 66/66 across
12d-247 approval-custody, 12d-262 arena-verdict-view, 12d-242
wire contract, 12d-254 shell view model, 12d-258 arena custody,
12d-253 multi-agent arena. CI IS NOT CLAIMED PASSED
(`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review; findings
below). GROK_XAI review PENDING — never fabricated.

## What it is

The operator's window into the HUMAN side of the governance loop the
arena verdict view (12D-262) opened the machine side of: drop a 12D-247
custody decision submission — `{packet, plan}` — and the shell renders
"a decision was RECORDED out of band, it binds to THIS packet, here is
what it says", or an honest refusal. This surface REPORTS a decision a
human already made; it decides nothing and offers no affordance.

## The new structural property: the CROSS-BINDING gate

`verifyApprovalCustodyPlan` (12D-247) proves a plan is internally
consistent — it accepts ANY hex64 packetId in its record. This story's
`buildCustodyDecisionViewModel(raw)` — pure, never throws — adds the
binding no other module proves: the record's `packetId` must equal the
12D-242 wire verifier's re-derived id AND its `storyId` must equal the
packet's storyId. A decision recorded over packet B pasted in beside
packet A refuses **even though both halves are individually perfect** —
the suite proves exactly this (and the storyId-only variant with a
hand-re-derived receipt, which ONLY the storyId gate can catch).

Gate order: exact keys `['packet','plan']` → packet wire verification
(12D-242) → plan record re-derivation (12D-247) → cross-binding gates.
A refusal carries ZERO packet, plan, or receipt content. The verified
view is display-only: no approve control anywhere; journal
authentication with the operator's seed stays OUT OF BAND (12D-244,
unchanged).

## Defects found and paid down during this story

- **(adversarial self-review, CONFIRMED and fixed)** the 12D-247
  verifier `verifyApprovalCustodyPlan` did NOT re-apply the
  secret-content gate — a FORGED plan could carry a credential-shaped
  `decidedBy` (e.g. `sk-…`) and still verify, because the re-gate lived
  only on the build path. Paid down structurally (the 12D-263 lesson):
  the secret-content invariant is enforced INSIDE
  `verifyApprovalCustodyPlan` now, with a regression in the 12D-267
  suite (`credential-shaped decidedBy refuses with zero leak` — the
  plan is internally consistent, so ONLY the verifier re-gate catches
  it). The 12D-247 sibling suite stays green (66/66 run above).
- **(strict tsc, two runs)** a multiline `as` cast after a property
  access failed to parse (TS1434), then an `unknown` argument into the
  typed plan verifier (TS2345) — fixed by restructuring through an
  intermediate and a `Parameters<typeof …>[0]` cast. The narrowing now
  holds by construction.

## The honest boundary

- The view authenticates the BYTES and the BINDING, not the operator's
  identity — registration is not issuance proof (12D-233 residual
  verbatim); the journal proves the decision was RECORDED, not who
  stated it (12D-247 residual verbatim). Journal authentication with
  the operator's seed remains out of band (12D-244, unchanged).
- A verified decision proves the record re-derives from its own
  fields and binds to this packet; it does not prove the story's
  content is true.
- `humanDecision: 'REQUIRED'`, `modelCalls: 0`, `remoteCalls: 0`,
  `learningPromoted: false`, `automaticRecovery: false`,
  `billionUsersProven: false`, `collectsNothing: true`. The route
  handler reads the whole body before the module gates apply (the
  12D-259 disclosed residual carries over — same local-prototype
  scope).
- The shell mounts the panel in the loop order: arena verdict →
  custody decision → packet ingest. No approve control on any panel.

## Exact files

- `services/ai/runtime/offline-team/xiv-custody-decision-view.ts` (new)
- `services/ai/runtime/offline-team/xiv-custody-decision-view.test.ts`
  (new, 13 tests — real-recorded-decision happy path incl. frozenness;
  REJECTED-is-a-decision with distinct receipts; CROSS-BINDING packetId
  mismatch with zero leak; CROSS-BINDING storyId mismatch against an
  INTERNALLY CONSISTENT forged plan; post-hoc decision flip (receipt
  mismatch); tampered packet; exact-keys gate incl. reordering;
  malformed submissions HOLD; foreign purpose; two-step plan;
  credential-shaped decidedBy; policy/guardrail pins; no-approve-
  affordance)
- `services/ai/runtime/offline-team/xiv-approval-custody.ts` — the
  12D-247 verifier secret re-gate paydown (behavior strengthened;
  build path unchanged)
- `services/ai/package.json` — `test:12d-267`, `typecheck:12d-267`
- `.gitlab-ci.yml` — `typecheck:12d-267`, `test:12d-267` steps
- `services/xiv-story-shell/src/app/api/ingest/custody/route.ts` (new)
- `services/xiv-story-shell/src/app/custody-panel.tsx` (new)
- `services/xiv-story-shell/src/app/page.tsx` (mounts the custody panel)
- `docs/ai-agents/12d-267-custody-decision-surface-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-267  # RAN: exit 0 (after the two disclosed fixes)
npm run test:12d-267       # RAN: 13/13 pass
npm run build (xiv-story-shell)  # RAN: compiled, routes listed above
sibling run via tsx --test # RAN: 66/66 across the six suites named above
```

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no external fetch, no npm install,
no credentials. The commit stages ONLY the files above and never
touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

Pathway-evidence expansion feeding the 12D-264 ledger (honest caps —
2,000,000 rows/database stays the only measured ceiling), the open
12D-243/12D-245 operator questions (fail-closed, not acted on), and a
possible 12D-268: the escrow gate (12D-266) verdict surface in the
shell, completing the Lock/Audit/Release loop's display side. GitHub
Phase 1 lockdown remains blocked on the CEO's `! gh auth login`.