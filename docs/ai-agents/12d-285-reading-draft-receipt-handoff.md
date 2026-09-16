# 12D-285 — Reading Draft Receipt (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-reading-draft-receipt.ts`
+ 9 adversarial tests). **TEST RUN DISCLOSED**: `test:12d-285` = **9/9
pass**; `typecheck:12d-285` (strict tsc over the receipt + first-reader
+ binding + admission + ingest + queue chain) = **exit 0**. Sibling
chain regression (two tsx runs): **144/144 across 15 chain suites**
(127 across the 13 reading-chain suites, +17 across the pathway
approval-link and evidence-bridge suites). Shell build: compiled
(RUNTIME-ONLY rung — nothing is added to the story shell; the pure
receipt door is shell-importable in a later rung, the queue door is
not). **CI IS NOT CLAIMED PASSED** (`ci_quota_exceeded`). Reviewers:
CLAUDE_CODE (self-review). GROK_XAI review PENDING — never fabricated.

## What this rung is

The review link's missing half. The 12D-280 first reader settles a
model DRAFT into the queue as AWAITING_REVIEW with the draft's SHA-256
as `outputHash` — but the draft TEXT exists only in the operator's
hands at read time. A human reviewer facing the 12D-100 review door
must supply `expectedOutputHash`; until now nothing made the draft
text they actually read PROVABLY the draft the queue settled. This
rung closes that gap WITHOUT adding a write path:

1. **`buildReadingDraftReceipt(submission)`** — PURE: the exact-keys
   gate (`[tenantId, storyId, documentId, draftSha256, draftText,
   model]` in order), non-empty-string gates, id bounds (≤128), the
   claimed digest must be 64 lowercase hex, the draft budget mirrors
   the 12D-280 `maxDraftChars` (8000), the SECRET gate is RE-APPLIED
   to the draft text (a laundered secret never becomes review
   material — the 12D-274 lesson on the reviewer's side), and THE
   DIGEST IS RE-DERIVED from the submitted text and compared to the
   claim: a mismatch refuses ("the reviewer is not holding the draft
   they claim"). Returns a frozen receipt whose `draftSha256` is
   exactly what the reviewer passes as `expectedOutputHash`.
2. **`verifyReadingDraftReceiptAgainstQueue(queue, receipt)`** —
   RUNTIME-SIDE only (never shell-imported; the 12D-273 lesson): the
   queue is the truth. The story must exist, be AWAITING_REVIEW, and
   its settled `outputHash` must EQUAL the receipt's re-derived
   digest — a mismatch refuses ("the reviewer is not holding the
   draft that was settled"). Reads only; never writes.

The suite's first test closes the FULL REAL loop: register → 12D-274
prepare → 12D-278 bound admission → 12D-280 first reader (injected
caller) → receipt built from the first-reader packet → queue-verified →
`q.applyReviewDecision({ expectedOutputHash: receipt.draftSha256, ...})`
→ the story reaches DONE. The receipt's digest IS the review door's
cross-check key.

Fail-closed discipline: honest flags pinned on both packets
(`humanDecision: 'REQUIRED'`, `learningPromoted: false`,
`activated: 0`), `modelCalls: 0` (the receipt calls no model — the
draft was read by the 12D-280 door), `remoteCalls: 0`, no write path,
determinism proven, malformed submissions and malformed/tampered
receipt packets refuse.

## Disclosed residuals

- The receipt proves DIGEST-CONSISTENCY — that the reviewed text
  hashes to the queue's settled bytes. It does not prove WHO produced
  the text beyond the carried model label (the 12D-280
  injected-caller residual), and it stores nothing: the operator
  holds the text, the queue holds the hash, this module binds them.
- A receipt is NOT an approval: it proves bytes, not quality — the
  12D-100 review door and human decision stay downstream, untouched.

## Exact files

- `services/ai/runtime/offline-team/xiv-reading-draft-receipt.ts`
  (new)
- `services/ai/runtime/offline-team/xiv-reading-draft-receipt.test.ts`
  (new, 9 tests)
- `services/ai/package.json` — `test:12d-285`, `typecheck:12d-285`
- `.gitlab-ci.yml` — `typecheck:12d-285`, `test:12d-285` steps
- `docs/ai-agents/12d-285-reading-draft-receipt-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-285          # RAN: 9/9 pass
npm run typecheck:12d-285     # RAN: exit 0
sibling regression (tsx)      # RAN: 144/144 (15 chain suites)
shell npm run build           # RAN: compiled (unchanged shell tree)
```

## Defects found and paid down during this story

- (suite-caught) the first draft of the test fixture declared the
  `readOneDraft` fixture twice (a synchronous wrapper over an async
  contract) — the suite was rewritten so the fixture awaits the REAL
  12D-280 door directly; measured 9/9 after the rewrite.
- (authoring) a doc-comment formatting slip in the module ("settled
  story's" split across lines with a stray indent) was fixed before
  commit.

## Approval status

`modelCalls: 0` for this rung's own doors (the receipt calls no
model), `remoteCalls: 0`, no provisioning, no merge, no deployment,
no learning promotion, no activation of anything, no credential use.
The commit stages ONLY the files above and never touches
`services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

- A shell surface for the draft receipt (the PURE part is
  shell-importable; the queue door stays runtime-side — the 12D-272
  view-model pattern applies).
- A second invocation of the live 12D-283/284 cycle (the GHG queue's
  chunk-2 is READY) and a receipt built from its real draft.
- Adopt the 12D-278 bound bridge as the ONLY admission door — CEO
  decision.
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated).
- Rail integration for 12D-266 (BLOCKED on CEO authorization +
  credentials).
- GitHub Phase 1 lockdown (blocked on the CEO's `! gh auth login`).