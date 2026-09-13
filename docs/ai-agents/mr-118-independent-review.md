# MR !118 — Independent Review: Pathway-Evidence Bridge + Device Fleet Enrollment (Claude Code, 2026-09-13)

Branch `chatgpt/pathway-evidence-device-fleet` @ `9a6c43ab6ed6966a2cdf3c4183aef2fd4bcb7c3c`
(base `38f1adfb` = 12D-106). Validated locally on this reviewer's worktree at exact head.

## Verdict: SOUND — recommend acceptance; no blocking findings

## What the branch does

1. **`pathway-evidence-bridge.ts`** — converts a queue story into a governed neural-pathway
   *candidate* only when the story is `DONE` (independently reviewed) and the queue's stored
   output SHA-256 matches the supplied expected hash. Reuses
   `neural-pathway-growth-engine.ts` (no parallel brain). The packet hard-codes
   `activationAttempted:false`, `learningPromoted:false`, `modelWeightMutation:false`,
   `productionMutation:false`, `humanDecision:'REQUIRED'`, and the returned candidate is
   `humanApproved:false`, so `evaluatePathwayCandidate` keeps it ineligible until the
   existing independent-review + human-approval + rollback requirements are met.
2. **`device-fleet-enrollment.ts`** — consent-bound enrollment reusing `TARGET_MATRIX`.
   Enrollment is a consent record, not proof of compatibility and not permission to start
   work: a targeted-but-unverified device stays `UNVERIFIED_COMPATIBILITY`; only separate
   `verifyCompatibility` evidence plus unexpired/unrevoked consent plus runtime constraints
   (battery ≥30% for background, thermal NOMINAL/WARM, explicit opt-ins, foreground rules)
   yields `ELIGIBLE_FOR_LOCAL_TASKS`. The assessment starts no worker, makes zero remote
   calls, and changes no OS settings. Current matrix truth preserved: Android ARM64 targets
   `LOCAL_AGENT`; iOS does not claim it (enrollment with an iOS `LOCAL_AGENT` surface
   throws).

## Checks at exact head `9a6c43ab`

- `pathway-evidence-bridge.test.ts`: **5/5 pass** (native exit 0).
- `device-fleet-enrollment.test.ts`: **6/6 pass** (native exit 0).
- `tsc --noEmit` strict over all four new files: **PASS**.
- Fail-closed verified: READY/LEASED/AWAITING_REVIEW stories rejected; wrong tenant and
  stale output hash rejected; iOS `LOCAL_AGENT` rejected; expired/paused/revoked fail
  closed; background participation respects battery/thermal thresholds.
- No changes to `offline-story-queue.ts` — the queue lineage itself is untouched.

## Non-blocking notes

1. `DeviceEnrollmentRecord` embeds the caller-supplied `state` on the manual
   verified-compatibility path in the tests; production callers should only produce records
   through `enrollDevice` (which derives state from matrix truth). Worth a follow-up
   factory for the "verified" transition so state cannot be hand-assigned ad hoc.
2. The device story models targeted/enrolled/verified/eligible states; an *observed
   local-worker receipt* (actual runtime evidence from a device that started a worker) is
   not yet modeled — that is the natural next slice and should not be pre-claimed here.
3. Honest limits unchanged: no real device, user, tenant, pathway, or learning promotion
   exists behind this code. Logical targets stay sparse until measured hardware evidence.

humanDecision: REQUIRED · learningPromoted: false · automaticRecovery: false · no merge performed by the reviewer.