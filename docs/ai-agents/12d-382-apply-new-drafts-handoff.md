# 12D-382 — CEO approval applied: review decisions executed for the 12D-366..381 new drafts (apply rung)

**Story rung:** 12D-382 (apply rung — CEO-authorized)
· **Parents:** 12D-381 · **Policy footprint:** none added

## Authorization (recorded verbatim)

CEO Devin Xavier Haynes, 2026-09-19: **"go ahead and run the apply
driver for the new drafts"** — blanket authorization for the reading
queues created after the 12D-340 apply run: 12D-366, 369, 370, 371,
372, 374, 375, 376, 377, 378, 379, 380, 381 (13 queues; 12D-367/368
were code rungs and 12D-373 was register-only — no queues). Disclosed
in every decision's reviewRef.

## Execution chain (REAL contracts only)

Same tooled operator loop as the 12D-340 run: 12D-323 worksheet CLI
(hash-bound decision inputs, limit 100) → decisions file
(reviewerId `secure_code_reviewer`, decision APPROVED,
expectedOutputHash from the worksheet, reviewRef = the recorded CEO
approval) → REAL 12D-324 apply CLI through the REAL
applyReviewDecision door.

## Fail-closed proof (the bounds are live, not decorative)

First run REFUSED by the REAL apply door: "decision 0 carries a
malformed reviewRef (1..256 chars of the human's own provenance
reference); fail closed; NOTHING was applied" (appliedCount 0) — the
first reviewRef text exceeded the 256-char bound. Shortened to the
bound while keeping the CEO's words verbatim; re-run.

## Measured (driver's own output)

- **76 review decisions applied** across the 13 queues — every queue
  census post-apply shows DONE:
  12D-366: 2 · 369: 2 · 370: 2 · 371: 2 · 372: 1 · 374: 2 · 375: 2 ·
  376: 6 · 377: 35 · 378: 10 · 379: 2 · 380: 4 · 381: 6 (= 76).
- Every queue's entire slate is DONE (no AWAITING_REVIEW remains in
  any of the 13 queues); modelCalls 0, remoteCalls 0 (apply is a
  local queue operation — the reading cycle's model calls happened
  at read time).
- The driver and its worksheet/decision/apply artifacts live in
  scratch `.xiv-runtime/review-apply-12d-381-new-drafts/` and are
  never committed.
- Reading campaign totals: 277 review decisions applied across the
  whole campaign (144 in the 12D-340 run + 76 here + prior runs
  across 12D-326..363 queues).

## Next candidates

1. Post-apply: reading-campaign results are DONE; next CEO-gated
   candidates remain the multi-MODEL rung and the bounded CFPB
   structured-field extraction rung.
2. Commit the handoff with the measured numbers once the driver
   completes.