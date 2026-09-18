# 12D-355 — Review-decision-verify CLI: the read-only dry-run of the apply door

**Story rung:** 12D-355 (code rung) · **Parents:** 12D-324 / 12D-354 ·
**New contracts:**
`runtime/offline-team/xiv-review-decision-verify.cli.ts` (+
`.test.ts`, 7 tests) · **Touched:** nothing else (imports
`parseHumanDecisions` from the REAL 12D-324 contract — parser parity
by construction, not re-typing).

## What this rung is

The 12D-324 apply door pre-flights every decision and then applies —
all-or-nothing. A 127-draft operator run that hits its first failure
learns only the FIRST problem. This CLI runs the SAME pre-flight
checks, against the SAME doors, and reports ALL of them at once —
WITHOUT writing anything:

    node xiv-review-decision-verify.cli.ts --queue=<path> --tenant=<id> --decisions=<file.json>

- **Real parser parity:** the decisions file is parsed by the REAL
  apply contract's own `parseHumanDecisions` — exact keys in order,
  bounded values, secret-screened. A file the verify CLI accepts, the
  apply door parses identically (tested).
- **Same pre-flight:** every entry checked against the REAL queue's
  `inspectStory` door and the REAL workforce contract — unknown story,
  wrong state, stale/tampered hash, non-designated reviewer — with
  the door's own refusal wording, so the operator sees exactly what
  the door would say.
- **First-failure-does-not-stop:** every entry gets a verdict
  (`wouldApply` + reason); one run surfaces all problems at once. The
  APPLY door itself stays all-or-nothing — untouched.
- **Writes nothing:** `queueTouchedNever` — the queue is opened, read,
  closed; `applyReviewDecision` is never called; queue bytes are
  byte-identical before and after (tested), and verified stories stay
  AWAITING_REVIEW — the dry run decides nothing; the human still runs
  the REAL door.
- `verified=false` exits 2; missing files refuse and are never
  created; exactly the three flags, each once, each valued.
- LOCAL I/O only: `modelCalls 0`, `remoteCalls 0`.

## Measured verification (local only)

- `tsc --noEmit` clean.
- Verify suite: **7/7 pass**.
- Full offline-team suite: **1,491/1,491 pass** (154.3 s).
- Honest flags pinned: `humanDecision REQUIRED`, `learningPromoted
  false`, `activated 0`, `collectsNothing true`, `automaticRecovery
  false`, `billionUsersProven false`. 2,000,000 rows/database remains
  the only measured ceiling.

## What this is NOT

NOT any queue write, NOT any decision by the CLI, NOT any bypass of
the apply gate (the dry run complements, never replaces, the REAL
12D-324 door), NOT any deploy or merge, NOT any model call or weight
mutation.

## Next candidates

1. 12D-340 apply execution — 127 CEO-approved drafts across 26
   queues; **12D-355 can now pre-verify the staged decisions files
   read-only before the REAL run**; classifier-gated, staged for the
   CEO's own execution.
2. Landing chain 12D-324 → … → 354 (30 prepared commits), then this
   rung.
3. CEO-gated design rungs: XIV AI Media platform; catalog/capacity
   re-drill; mini-power-grid design.