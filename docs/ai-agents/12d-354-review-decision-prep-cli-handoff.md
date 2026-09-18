# 12D-354 — Review-decision-prep CLI: the committed worksheet→decisions rung

**Story rung:** 12D-354 (code rung) · **Parents:** 12D-322 / 12D-323 /
12D-324 · **New contracts:**
`runtime/offline-team/xiv-review-decision-prep.cli.ts` (+
`.test.ts`, 9 tests); **touched:**
`xiv-review-decision-worksheet.cli.ts` (one-word change: the door
vocabulary const is now exported so the prep CLI re-derives the
worksheet digest exactly instead of re-typing it — 23 sibling
worksheet/apply tests still pass).

## What this rung is

The 12D-323 worksheet prepares the review door's EXACT hash-bound
inputs with BLANK decision fields; the 12D-324 apply door parses a
decisions file whose entries carry EXACTLY
`[storyId, reviewerId, decision, expectedOutputHash, reviewRef]` in
order. Until now the mapping between the two lived only in the
never-committed scratch driver `.xiv-runtime/gen-decisions-12d-340.ts`.
This rung makes it a REAL, tested, committed CLI:

    node xiv-review-decision-prep.cli.ts \
      --worksheet=<file.json> --decision=<APPROVED|CHANGES_REQUESTED|REJECTED> \
      --reviewer=<id> --ref=<provenance <=256 chars>

Fail-closed by construction:

- Exactly the four flags, each exactly once, each valued; unknown /
  duplicate / missing refuse.
- A MISSING worksheet file refuses BEFORE anything is read — never
  created by accident; non-worksheet / non-JSON / empty files refuse.
- **Tamper evidence:** the worksheet digest is RE-DERIVED from the
  file's own entries with the same derivation the 12D-323 CLI ran;
  any byte edited after issuance refuses.
- **Pre-filled decisionInputs refuse** — including from a tamperer who
  re-derives the digest: the decision fields must be blank AS ISSUED
  (tested).
- `--decision` must be in the REAL door's OWN vocabulary;
  `--reviewer` must be designated for EVERY entry (one undesignated
  entry refuses the WHOLE batch); `--ref` is ≤ 256 chars (the apply
  contract's own bound) and secret-screened — a secret-shaped ref
  refuses and echoes nothing.
- **PRINT-ONLY:** `writesNothing: true`, `queueTouched: false` — the
  human redirects the output themselves and hands it to the 12D-324
  door. No `--out`, no `--queue`, no `--apply` flag exists.
- `--decision` is disclosed verbatim in the packet as THE HUMAN's
  already-made decision, transcribed — the CLI has no decision of its
  own. Blanket approvals must be DISCLOSED as blanket in the ref
  itself (the 12D-317/12D-340 discipline).

## Measured verification (local only)

- `tsc --noEmit` clean.
- `node --test --import tsx` prep suite: **9/9 pass**; sibling
  worksheet+apply suites: **23/23 pass**.
- Full offline-team suite: **1,484/1,484 pass** (152.6 s).
- Honest flags pinned: `humanDecision REQUIRED`, `learningPromoted
  false`, `activated 0`, `collectsNothing true`, `automaticRecovery
  false`, `billionUsersProven false`. `modelCalls 0`, `remoteCalls 0`
  (LOCAL I/O only). 2,000,000 rows/database remains the only measured
  ceiling.

## What this is NOT

NOT any decision by the CLI, NOT any queue write, NOT any deploy or
merge, NOT any model call or weight mutation, NOT any fabricated
review receipt — the decisions this CLI maps are the human's own,
recorded verbatim in the refs.

## Next candidates

1. 12D-340 apply execution — 127 CEO-approved drafts across 26
   queues via the operator loop (12D-322 slate → 12D-323 worksheet →
   **12D-354 prep** → 12D-324 apply); classifier-gated, staged for
   the CEO's own execution.
2. Landing chain 12D-324 → … → 353 (29 prepared commits), then this
   rung.
3. CEO-gated design rungs: XIV AI Media platform; catalog/capacity
   re-drill; mini-power-grid design.