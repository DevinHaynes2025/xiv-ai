# 12D-357 — Review-operator-loop CLI: the one-shot dry run of the whole review rung

**Story rung:** 12D-357 (code rung) · **Parents:** 12D-323 / 12D-354 /
12D-355 · **New contracts:**
`runtime/offline-team/xiv-review-operator-loop.cli.ts` (+ `.test.ts`,
6 tests) · **Touched:** nothing else — the three stages are the REAL
committed contracts **imported, never re-typed**.

## What this rung is

One invocation chains the whole operator loop as a READ-ONLY dry run:

    node xiv-review-operator-loop.cli.ts \
      --queue=<path> --tenant=<id> \
      --decision=<APPROVED|CHANGES_REQUESTED|REJECTED> \
      --reviewer=<id> --ref=<provenance <=256 chars>

- **Stage 1 — REAL 12D-323 worksheet:** the door's hash-bound inputs;
  a missing queue refuses with the worksheet contract's own wording.
- **Stage 2 — REAL 12D-354 prep:** the decisions shape
  (`[storyId, reviewerId, decision, expectedOutputHash, reviewRef]`
  in order); a non-designated reviewer refuses the WHOLE batch here.
- **Stage 3 — REAL 12D-355 verify:** the 12D-324 door's own
  pre-flight, all failures surfaced.
- Each stage refusal is wrapped with its stage name; a refusal exits 2
  with NOTHING applied.
- The worksheet and decisions scratch live in a private mkdtemp
  workspace **deleted in a finally block** (tested: nothing lingers in
  tmpdir after success or refusal).
- `queueTouched: false` — queue bytes byte-identical before/after and
  stories stay AWAITING_REVIEW (tested); the REAL 12D-324 door is the
  only queue-mutating rung, run by the human.
- Exactly five flags, each once, each valued; NO `--apply`, NO
  `--out`. LOCAL I/O only: `modelCalls 0`, `remoteCalls 0`.

## Measured verification (local only)

- `tsc --noEmit` clean.
- Loop suite: **6/6 pass**.
- Full offline-team suite: **1,497/1,497 pass** (210.1 s).
- Honest flags pinned: `humanDecision REQUIRED`, `learningPromoted
  false`, `activated 0`, `collectsNothing true`, `automaticRecovery
  false`, `billionUsersProven false`. 2,000,000 rows/database remains
  the only measured ceiling.

## What this is NOT

NOT an apply (the REAL 12D-324 door is untouched by this rung), NOT
any decision by the CLI, NOT any deploy or merge, NOT any model call
or weight mutation.

## Next candidates

1. 12D-340 apply execution — 134 CEO-approved drafts across 27
   queues (approvals 17c/17d/17f/17g); **12D-357 is now the one-shot
   pre-flight** before the human runs the REAL door; classifier-gated,
   staged for the CEO's own execution.
2. Landing: 12D-354 → 355 → 356 (3 prepared commits remain), then
   this rung.
3. CEO-gated design rungs: XIV AI Media platform; catalog/capacity
   re-drill; mini-power-grid design.