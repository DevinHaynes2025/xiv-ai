# 12D-288 — FAILED→READY OPERATOR RECOVERY DOOR (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker` (the additive
`recoverFailedStory` queue door + the `xiv-reading-recovery` contract
module + 5-test adversarial suite + the measured-state paydown in the
supervised cycle). **TEST RUN DISCLOSED**: `test:12d-288` = **5/5
pass**; `typecheck:12d-288` (strict tsc over the recovery suite +
recovery door + cycle + receipt core/door + first reader + ingest +
admission + binding + register + queue) = **exit 0**. Chain regression
(12d-270…288 suites) = **182/182 across 19 suites, zero failures**.
Shell build: exit 0 (for the record; the shell tree is unchanged by
this rung). **CI IS NOT CLAIMED PASSED** (`ci_quota_exceeded`).
Reviewers: CLAUDE_CODE (self-review). GROK_XAI review PENDING — never
fabricated.

## What this rung is

The 12D-287 handoff's second candidate: the queue's recovery doors
(`returnUnstarted`, `voidLease`) cover HELD leases only, so a story
settled FAILED — e.g. by the MEASURED durable `ollama returned HTTP
500` the GHG queue's chunk-2 has carried since the 12D-287 live run —
had NO path back to READY, and its chunk of the document could never
be read. Recovery is the operator's door by design; this rung BUILDS
that door fail-closed:

1. **`recoverFailedStory` on `offline-story-queue`** (additive): a
   FAILED-only, explicit-operator door that re-queues exactly one story
   (state READY) and CLEARS the failed settlement's output hash so the
   next settlement writes a fresh one. A held lease covering the target
   story refuses (the lease doors own held leases); a lease on a
   DIFFERENT story does not block. The operator ref is echoed to the
   caller, NEVER stored as a review or settlement record (the voidLease
   discipline, verified by test).
2. **`xiv-reading-recovery.ts`** (`recoverFailedReadingChunk`): the
   reading-chain door over it. THE BYTES ARE RE-PROVEN FIRST through
   the REAL contracts — the REAL 12D-274 ingest re-derives the digest
   from the re-submitted bytes, the REAL 12D-277/278 bound admission
   re-runs (an unregistered source refuses; NO REGISTER NO BINDING;
   changed bytes refuse at the queue door's own fingerprint invariant)
   — then the target FAILED chunk's own stored objective
   (`inspectStoryObjective`) must contain the docRef of the RE-DERIVED
   digest (the same continuation discipline as 12D-287, disclosed as
   defense-in-depth). **NO MODEL CALL RUNS IN RECOVERY** (modelCalls 0)
   — the re-read is the operator's next 12D-283 cycle invocation, so
   the stop-before-review discipline is never bypassed by recovering.
   Exactly ONE FAILED story re-queues per invocation; the door NEVER
   THROWS — honest REFUSED packets with MEASURED queue truth and ZERO
   document text.
3. **MEASURED-STATE PAYDOWN (confirmed adversarial finding, disclosed
   with the committed fix)**: the 12D-288 suite caught the cycle's
   refusal packet masking a durable failure behind an earlier chunk's
   settled state — the catch read chunk-1's AWAITING_REVIEW and
   reported `modelCalls: 0` while chunk-2 sat FAILED from a real
   provider call. The catch now reports the first FAILED state among
   the document's stories (modelCalls 1) when one exists, else the
   first inspectable state; the 12D-283/12D-287 suites pass unchanged.

## MEASURED LIVE (scratch `.xiv-runtime/`, never committed)

Against the REAL local Ollama (qwen2.5-coder:7b, loopback
127.0.0.1:11434, `remoteCalls: 0`) on the real GHG queue
(`reading-queue-cycle-live-2026-09-16.sqlite`), the FIRST live operator
recovery:

- **BEFORE**: chunk-1 AWAITING_REVIEW (outputHash 03085148…), chunk-2
  FAILED (outputHash null), chunk-3 AWAITING_REVIEW (e73a58c5…).
- **THE RECOVERY**: `READING_RECOVERY` — chunk-2 recovered with the
  SAME byte-identical submission (`duplicates: 3`, `inserted: 0`),
  priorState FAILED → storyState READY, remainingFailed 0,
  **modelCalls 0**, operatorRef
  `operator:devin:recover-ghg-chunk-2-http500-2026-09-16` echoed.
- **THE RE-READ**: the next 12D-283 invocation read the recovered
  chunk-2 by the REAL model — continuation true, draftChars 388,
  draftSha256 21e3ceb6…, modelCalls 1, remoteCalls 0, STOPPED before
  review. The GHG document now has ALL THREE chunks AWAITING_REVIEW;
  the human decision on each draft stays Devin's.
- **THE RECEIPT**: a REAL 12D-285 receipt built from the captured real
  draft is QUEUE-VERIFIED (`readyForReview: true`); the shell
  submission was written for the operator (loopback only, never
  uploaded).

## Pre-existing failures disclosed (NOT this rung's debt)

While running the wider regression for the record: `test:12d-113`
(the alignment-invariant audit) trips on the COMMITTED 12D-284 CLI
module (`xiv-supervised-reading-cycle.cli.ts` declares `*_GUARDRAILS`
and uses the loopback fetch primitive — `guardrails-no-network` /
`network-surface-authorized`); this debt predates 12D-288 and needs its
own rung (authorize the CLI's loopback surface or move the caller out).
`test:12d-134` and `test:12d-222` fail with `the operator custody
registry (12D-233) is required; fail closed` from
`scaling-execution-bridge.ts` — unrelated fixture/registry debt. The
12d-85…91 "suites" are not node:test suites (custom OK output). None
of these touch the recovery chain measured above.

## Exact files

- `services/ai/runtime/offline-team/offline-story-queue.ts` (additive
  `recoverFailedStory`)
- `services/ai/runtime/offline-team/xiv-reading-recovery.ts` (new)
- `services/ai/runtime/offline-team/xiv-reading-recovery.test.ts`
  (new, 5 tests)
- `services/ai/runtime/offline-team/xiv-supervised-reading-cycle.ts`
  (measured-state paydown, disclosed above)
- `services/ai/package.json` — `test:12d-288`, `typecheck:12d-288`
- `.gitlab-ci.yml` — `typecheck:12d-288`, `test:12d-288` steps
- `docs/ai-agents/12d-288-reading-recovery-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-288          # RAN: 5/5 pass
npm run test:12d-287          # RAN: 5/5
npm run test:12d-283          # RAN: 10/10
npm run test:12d-284          # RAN: 5/5
npm run typecheck:12d-288     # RAN: exit 0
chain regression 270..288     # RAN: 182/182 (19 suites)
shell npm run build           # RAN: exit 0
live recovery + re-read       # RAN: measured (see above)
```

## Defects found and paid down during this story

- (suite-caught, CONFIRMED) The cycle's refusal packet masked a durable
  post-call failure behind an earlier chunk's settled state
  (measured-state residual): the catch broke on the FIRST inspectable
  story. Paid down — the catch now prefers the first FAILED state
  (modelCalls 1) among the document's stories; sibling suites pass
  unchanged.
- (test-caught) The first fixture for "a lease on a DIFFERENT story
  does not block" could not create a held lease at all (the singleton
  lease always targets the first READY reading chunk); the fixture now
  enqueues a standalone same-tenant story, holds its lease through the
  REAL claimNext, and proves the recovery proceeds AND the lease is
  undisturbed.
- (test-caught) The reordered-keys tamper fixture was a no-op spread;
  replaced with a genuinely reordered literal (caught by reading, not
  by a failure).

## Approval status

The live demo used the CEO-approved Ollama first-reader rung
(modelCalls counted: 1 in the measured re-read), `remoteCalls: 0`
(loopback), no provisioning, no merge, no deployment, no learning
promotion, no activation, no credential use. Recovery made ZERO model
calls. The commit stages ONLY the files above and never touches
`services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

- Register the remaining CEO-named sources from the expanded directive
  (github.com/GSA, NIST detection_limits, arxiv 2403.12029,
  caltech-fish-counting, BTS, CFPB, JPL SBDB, Austin/Texas Socrata,
  SBA, NSF NCSES, archives.gov, NYC SBS) and run the supervised cycle
  on ONE of them end-to-end — the first reading of a CEO-named source.
- Review decisions on the THREE settled GHG drafts (chunk-1, chunk-2,
  chunk-3 all AWAITING_REVIEW) — the human decision is Devin's; the
  review path (12D-100/12D-285) is fully built and measured.
- The 12d-113 alignment-audit debt: authorize the 12D-284 CLI's
  loopback fetch surface (AUTHORIZED_NETWORK_SURFACES) or move the
  caller out of the guardrails-declaring module — needs a decision,
  then its own rung.
- Adopt the 12D-278 bound bridge as the ONLY admission door — CEO
  decision.
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated); rail integration for 12D-266 (BLOCKED on CEO
  authorization + credentials); GitHub Phase 1 lockdown (blocked on
  `! gh auth login`).