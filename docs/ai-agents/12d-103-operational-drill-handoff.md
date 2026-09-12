# 12D-103 — 2M-Row Operational Drill (handoff)

Status: BUILT LOCALLY on `claude/12d-99-supervised-local-worker`. The 2M capacity fixture (12D-99 era) proved the ledger can STORE 2,000,000 story rows; the drill proves it can be OPERATED at that scale.

## What it exercises

`offline-story-queue.drill.ts --rows=N --stories=M` (defaults 2,000,000 / 1,000):

1. **Capacity fill** — N synthetic `CAPACITY_FIXTURE` rows (unclaimable by design, `load_test` role).
2. **Claimable fill** — M synthetic `PRODUCT_STORY` rows.
3. **Full ledger cycle × M** — claim → bounded `renewLease` (300s request against the 12D-102 total-life cap) → settle DRAFT (synthetic hash, no model) → `applyReviewDecision` APPROVED by the designated `secure_code_reviewer`. Per-op latency min/median/p95/max.
4. **Read surfaces** — 100 deep pages at random ordinals; tenant summary (full GROUP BY).
5. **Invariant probes** — DONE count equals M; no lease held after the cycle; no phantom lease on the capacity tenant; operator-void probe (claim → `voidLease(READY)` → re-claim → retire FAILED) on a dedicated probe story.

Output is one honest JSON packet: `productStoriesCreated: 0`, `realUserStories: 0`, `modelCalls: 0`, `remoteCalls: 0`, `capacityRowsAreUserStories: false`, `millionUsersProven: false`, `anomalies: [...]`.

## Debug findings during the build

- The first smoke run reported a real anomaly: the operator-void probe claimed `null` because the cycle had consumed every READY story (all DONE). Fixed by giving the probe a dedicated story — this is exactly the class of invariant break the drill exists to surface.
- The first full-2M run crashed with `queue capacity reached` at the claimable-fill step: `maxRows` is a TOTAL-row ceiling, so the capacity fill must be budgeted as `rows − stories − 1` (the −1 reserves the dedicated operator-void probe row). Fixed and re-run.
- A second full-2M run crashed once with `story not awaiting review` from `applyReviewDecision`. Static analysis of the queue state machine (single connection, sequential cycle) shows the only path to that error is `settle` writing `FAILED` because the wall clock lapsed the renewed lease deadline — i.e. a multi-minute stall between two adjacent statements, which the ~10-minute run's other 999 clean iterations make a code-level cause implausible. It did NOT reproduce in the fully instrumented rerun (`anomalies: []`), and the drill now catches and records any recurrence as a named anomaly (iteration, story ID, actual state, output hash, lease status) instead of crashing. Recorded as observed-once / not-reproduced / now-instrumented, NOT as fixed.
- CI adds a 10k/200 smoke of the drill after the capacity gate.

## Final full-scale evidence (2026-09-12, instrumented rerun)

`--rows=2000000 --stories=1000`, Node v24.20.0 / win32, native exit code 0, `anomalies: []`:

| Measure | Result |
|---|---|
| Capacity fill | 1,998,999 synthetic rows in 607.9 s |
| Claimable fill | 1,000 PRODUCT_STORY rows in 25 ms |
| Full ledger cycle ×1000 (claim→renew 300 s→settle DRAFT→APPROVED review) | 3,410 ms total |
| Claim / renew / settle / review medians | 0.854 / 0.710 / 0.816 / 0.785 ms (p95 ≤ 1.23 ms; worst single op 6.7 ms) |
| Lease renewal | 1000/1000 extended, 0 exhaustion (`extensionExhausted` never set) |
| Deep paging (100 pages at random ordinals over 2M rows) | median 0.268 ms, max 0.885 ms |
| Full tenant summary (GROUP BY over 2M rows) | 2,631 ms |
| Invariants | DONE count = 1000 ✓; no lease held after cycle ✓; no phantom capacity-tenant lease ✓; operator-void probe (claim → void READY → re-claim → retire FAILED) ✓ |
| Footprint | 1,855,766,528 bytes db (~1.86 GB), 198.6 MiB RSS — matches the 12D-99 storage fixture |
| Honest flags | `productStoriesCreated: 0`, `realUserStories: 0`, `modelCalls: 0`, `remoteCalls: 0`, `capacityRowsAreUserStories: false`, `millionUsersProven: false`, `liveAgentsProven: false`, `automaticRecovery: false`, `humanDecision: REQUIRED`, `learningPromoted: false` |

Regression battery after the final drill code: 74/74 across six suites (offline-story-queue 12, shared-host-admission 32, supervised-local-worker 11, operator-recovery 7, authenticated-review-response 7, queue-lease-renewal 5); full `tsc --noEmit` PASS.

## Trust limits

- Synthetic rows only; zero real user stories; no model, no network, no learning promotion, `humanDecision: REQUIRED`. Capacity numbers are ledger proofs, never adoption claims.

## Review context (2026-09-12)

- Review surface: **draft MR !114** (worker lineage 12D-99 → 12D-102 at `303896c1`, targeting the 12D-98 shared-admission branch).
- **CI blocker, not a code failure**: GitLab pipeline 2843489263 failed with `ci_quota_exceeded` in both jobs before any runner started — the remote head is CI-unverified for quota reasons. Reviewers should not treat that as a test regression; local verification below stands in until quota frees up.
- The full-scale drill is now COMPLETE at the 2M policy ceiling with the evidence table above; the 12D-103 commit carries the drill source, CI smoke, and this handoff together.