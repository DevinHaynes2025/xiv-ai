# MR !117 — Independent Review: `story_summary` Covering Index (Claude Code, 2026-09-12)

Branch `chatgpt/queue-summary-scale-index` @ `0d054acd`. Validation performed locally on a
disposable copy per the MR protocol — no live XIV database was touched.

## Verdict: SOUND — recommend acceptance after restoring the deleted governance comments

## Method

`services/ai/runtime/offline-team/summary-index-bench.ts` (committed alongside this note):
one disposable 2M-row insertion on the current (index-less) queue → summary benchmarked →
`CREATE INDEX story_summary ON stories(tenant,kind,state)` created in place on the populated
copy (cost measured) → summary re-benchmarked through the queue's exact SQL. Synthetic rows
only; zero user stories; zero model calls.

## Results (2,000,000 rows, Node v24.20.0 / win32)

| Measure | Before index | After index |
|---|---|---|
| Tenant summary (3 runs) | 2008.9 / 2004.1 / 1944.0 ms | **179.5 / 179.5 / 180.0 ms** (~11× faster) |
| Planner | full scan | `SEARCH stories USING COVERING INDEX story_summary (tenant=?)` |
| Index creation on populated 2M db | — | 2,751.7 ms (one-time) |
| Database growth | — | +101,203,968 bytes (~101 MB, ~5.5%) |
| Process RSS | 211.4 MiB | — |
| Insertion cost this run | 234.9 s (warm cache; 12D-103 drill measured 607.9 s cold) | — |

Consistent with the measured 12D-103 bottleneck (2,631 ms summary in the drill).

## Checks

- Branch's own contracts pass locally: 2/2 (`offline-story-queue.summary-index.test.ts`) —
  planner-selection proof and READY→LEASED→AWAITING_REVIEW→DONE semantic accuracy.
- Full six-suite offline-team regression battery on the base lineage: 74/74.
- Full `tsc --noEmit` PASS.

## Findings

1. **Blocking (must fix before merge): the branch deletes ~10 governance comment blocks**
   from `offline-story-queue.ts` — the 12D-100/101/102 provenance contracts on
   `inspectLease`, `returnUnstarted`, `inspectHeldLease`, `renewLease`, `voidLease`,
   `settle`, `acceptReview`, `inspectStory`, `applyReviewDecision`, and the enqueue
   fingerprint note. These comments are the documented fail-safe semantics (operator
   recovery claims no provider settlement; a lapsed lease is never resurrected; review
   binds to the signed output hash) that reviewers of !114 rely on. Restore them; the
   index addition itself is then a clean one-line-plus-comment change.
2. Non-blocking: rollout cost is modest (2.75 s creation, +5.5% storage) — the disposable-
   copy protocol the MR defines remains the right adoption rule for production databases.
3. Honest limits unchanged: this is a ledger-telemetry optimization at the 2M-row policy
   ceiling. It is not a distributed-scale or billion-user claim; the sparse-logical-space
   posture for anything beyond measured hardware holds.

humanDecision: REQUIRED · learningPromoted: false · automaticRecovery: false · no merge performed by the reviewer.