# 12D-270 — Pathway Approval View (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-pathway-approval-view.ts` + 11
adversarial tests). **TEST RUN DISCLOSED**: `test:12d-270` (node TAP via
tsx) = **11/11 pass**; `typecheck:12d-270` (strict tsc, also covering the
12D-269 link and the 12D-264 ledger) = **exit 0**. Sibling regressions
(single tsx run): **65/65** across 12d-269 pathway approval link, 12d-267
custody decision view, 12d-247 approval custody, 12d-264 pathway ledger,
12d-268 escrow verdict view, and the 12D-2xx pathway-evidence bridge.
Shell build (Next.js 16.3.5): compiled, typechecked, 9 static pages —
the page now mounts FIVE ingest surfaces and the route table includes
`/api/ingest/pathway`. CI IS NOT CLAIMED PASSED (`ci_quota_exceeded`).
Reviewers: CLAUDE_CODE (self-review; findings below). GROK_XAI review
PENDING — never fabricated.

## What it is

The 12D-267 view pattern applied to a 12D-269 plan — the operator's
window into the brain's recorded pathway approvals. The shell's ONLY
door from raw approval material to the UI:

1. `buildPathwayApprovalViewModel(raw)` — accepts ANY unknown value;
   exact keys `['packet', 'plan']` IN ORDER; then runs the REAL
   `applyRecordedApproval` from 12D-269, which in one path runs the
   packet gates, `verifyPathwayApprovalPlan` (receipt re-derivation,
   fixed purpose, secret re-gate), the CANDIDATE-BYTES cross-binding
   gate, and the fresh 12D-89 eligibility re-evaluation. ALL-OR-NOTHING:
   the submission verifies as ONE unit or refuses as ONE unit.
2. BOTH recorded decisions render as recorded facts, neither an
   affordance: an APPROVED renders the OPEN ledger path (the 12D-264
   ledger, `EVIDENCE AWAITING HUMAN REVIEW`, ledgered-never-activated,
   the 10,000-entry hard cap named); a REJECTED renders the honest
   CLOSED path ("a rejected candidate has no ledger path").
3. A refusal carries ZERO packet, plan, receipt, or pathway content —
   proven by the suite's REFUSAL_LEAK_CHECK across five adversarial
   refusals.

The story shell now mounts it: `/api/ingest/pathway` re-verifies in the
LOCAL server process and returns only the frozen view model;
`pathway-panel.tsx` renders it with no approve control by construction;
`page.tsx` mounts it after the escrow surface.

## Defects found and paid down during this story

- **(strict tsc, caught)** the REJECTED branch read `tenantId` from the
  `CANDIDATE_REJECTED_RECORDED` outcome, which does not carry it
  (TS2339) — now read from the verified decision record, which the
  receipt re-derivation binds to the candidate bytes anyway.
- **(consistency fix, pre-run)** the display originally obscured
  `decidedBy`/`decidedAtMs` behind placeholder strings — replaced with
  the verified record's actual fields (the 12D-267 pattern: render what
  verified, never a stand-in).
- **(test hygiene, pre-run)** the forged-plan test first derived its
  receipt with a hand-rolled `require('crypto')` helper; replaced with
  the module's own `derivePathwayApprovalReceipt` so the forgery is
  provably internally consistent and only the validator's secret
  re-gate can catch it.

## The honest boundary

- The view authenticates the BYTES and the binding, not the approver's
  identity — registration is not issuance proof (the 12D-233 residual
  verbatim); the ledger records, never verifies who approved (12D-264
  residual verbatim).
- NO ACTIVATION PATH anywhere in the view; the suite proves the word
  "activated" appears only inside the honest never-activated pin.
- `humanDecision: 'REQUIRED'`, `learningPromoted: false`,
  `remoteCalls: 0`, `modelCalls: 0`, `collectsNothing: true`,
  `automaticRecovery: false`, `billionUsersProven: false` pinned and
  frozen on the view policy.

## Exact files

- `services/ai/runtime/offline-team/xiv-pathway-approval-view.ts` (new)
- `services/ai/runtime/offline-team/xiv-pathway-approval-view.test.ts`
  (new, 11 tests — APPROVED renders ledger path open; REJECTED renders
  it CLOSED; CROSS-BINDING candidate-B-over-candidate-A with zero leak;
  tampered candidate; forged eligibility claim; decision flip; exact-keys
  gates incl. reordering; malformed submissions HOLD; credential
  decidedBy in an internally-consistent forged plan; no-affordance
  render check; policy pins)
- `services/ai/package.json` — `test:12d-270`, `typecheck:12d-270`
- `.gitlab-ci.yml` — `typecheck:12d-270`, `test:12d-270` steps
- `services/xiv-story-shell/src/app/api/ingest/pathway/route.ts` (new)
- `services/xiv-story-shell/src/app/pathway-panel.tsx` (new)
- `services/xiv-story-shell/src/app/page.tsx` (mounts the panel)
- `docs/ai-agents/12d-270-pathway-approval-view-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-270  # RAN: exit 0 (after the disclosed tenantId fix)
npm run test:12d-270       # RAN: 11/11 pass
sibling run via tsx --test # RAN: 65/65 (6 sibling suites)
shell npm run build        # RAN: compiled; route /api/ingest/pathway
```

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation of anything, no
external fetch, no install, no credentials. The commit stages ONLY the
files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

A ledger census view for the shell (measured counts only — `activated`
stays the literal 0), the open 12D-243/12D-245 operator questions
(fail-closed, CEO-decision-gated), and rail integration for 12D-266
(BLOCKED on CEO authorization + credentials + the closed-beta-vs-public
answer). GitHub Phase 1 lockdown remains blocked on the CEO's
`! gh auth login`.