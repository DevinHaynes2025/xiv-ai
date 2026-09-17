# 12D-292 — READING RECOVERY CLI (the operator's FAILED→READY door) (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`. **TEST RUN DISCLOSED**:
`test:12d-292` = **5/5 pass**; `test:12d-113` (the alignment-invariant
audit) = **9/9 — ZERO findings** (the new CLI declares guardrails and
carries NO network primitive); `typecheck:12d-292` = **exit 0**.
Chain regression (12d-85…91 + 12d-270…292) = **261/261 across 30
suites, zero failures**. Shell build (`services/xiv-story-shell`
`npm run build`) = **exit 0** (shell tree unchanged by this rung).
**CI IS NOT CLAIMED PASSED** (`ci_quota_exceeded`). Reviewers:
CLAUDE_CODE (self-review). GROK_XAI review PENDING — never fabricated.

## What this rung is

The 12D-288 recovery contract (`recoverFailedReadingChunk`) had NO
operator surface — only the test fixtures could invoke it. This rung
is the 12D-284 pattern applied to recovery: the operator's
command-line door, so the standing loop is the operator re-running a
command:

- **`xiv-reading-recovery.cli.ts`**: exact-args parser
  (`parseRecoveryArgs`, 9 flags: `--register --queue --genesis
  --tenant --source --document --title --body --operator-ref`; every
  flag required exactly once with a value; unknown/duplicate/missing
  refuse; the genesis ≥ 8 chars; the operatorRef ≤ 256, title ≤ 256,
  source and document ids ≤ 128 — the recovery contract's OWN policy
  bounds). The command reads the body from a LOCAL file, opens the
  operator's LOCAL register + queue files, calls the REAL
  `recoverFailedReadingChunk`, and prints the packet VERBATIM — a
  verified packet exits 0, a refusal packet exits 2 (an out-of-door
  refusal prints the same honest packet shape). **NO model call runs
  here (modelCalls 0) and the CLI carries NO network primitive** — no
  fetch, no endpoint literal, no caller import (asserted at source
  level by the suite); the re-READ is the operator's next 12D-284
  supervised-cycle invocation. The `FileReadingRegisterStore` is
  RE-EXPORTED from the 12D-284 CLI (one file-backed register store
  implementation, no duplication).
- **The suite** (5 tests): the exact-args discipline (count, unknown,
  duplicate, missing value, short genesis, and every policy-bound
  refusal — title, operatorRef, sourceId, documentId); the honest
  refusal on a fresh register (NO REGISTER NO BINDING, verbatim
  packet, zero document text, queue closed — a second command runs
  without a lock error); **the REAL loop** — a REAL FAILED story
  (produced by the REAL 12D-283 cycle with a failing loopback caller,
  modelCalls 1, durable FAILED) recovers through the CLI command to
  READY with the operator ref echoed, `modelCalls 0`, the failed
  output hash cleared in the queue truth, and the story id measured
  (`doc-cli-recovery-doc-1-chunk-1`); the pinned CLI guardrails.

The operator's recovery loop is now: (1) run the recovery CLI (the
FAILED story goes READY), (2) re-run the 12D-284 cycle command (the
recovered chunk is read as the bytes it was admitted as, stop before
review). Nothing waits, nothing polls, nothing auto-retries.

## Exact files

- `services/ai/runtime/offline-team/xiv-reading-recovery.cli.ts` (new)
- `services/ai/runtime/offline-team/xiv-reading-recovery.cli.test.ts`
  (new, 5 tests)
- `services/ai/package.json` — `test:12d-292`, `typecheck:12d-292`
- `.gitlab-ci.yml` — `typecheck:12d-292`, `test:12d-292` steps
- `docs/ai-agents/12d-292-recovery-cli-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-292          # RAN: 5/5 pass
npm run typecheck:12d-292     # RAN: exit 0
npm run test:12d-113          # RAN: 9/9 (ZERO audit findings)
chain regression 85..91+270..292  # RAN: 261/261 (30 suites, zero failures)
shell npm run build           # RAN: exit 0
```

## Defects found and paid down during this story

- (suite-caught, pre-commit) two malformed-argv fixtures were shaped so
  the count gate fired before the intended unknown-flag / duplicate-flag
  branch — re-aimed both fixtures so each intended gate is actually
  exercised.
- (test-draft dead code) a leftover cycle-argv construction was removed
  before commit.
- No contract-module change: the 12D-288 recovery contract passed
  unchanged; the CLI re-implements none of its gates.

## Approval status

`modelCalls 0` in recovery, `remoteCalls 0`, no provisioning, no merge,
no deployment, no learning promotion, no activation, no credential
use. The commit stages ONLY the files above and never touches
`services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

- Review decisions on the FOUR settled drafts (GHG chunk-1/2/3 + the
  ALDI chunk-1, all AWAITING_REVIEW) — the human decision is Devin's.
- Read further CEO-named sources through the cycle (BTS, CFPB,
  Austin/Texas Socrata, NSF NCSES are registered; verify the Socrata
  dataset subjects before reading).
- Adopt the 12D-278 bound bridge as the ONLY admission door — CEO
  decision.
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated); rail integration for 12D-266 (BLOCKED on CEO
  authorization + credentials); GitHub Phase 1 lockdown (blocked on
  `! gh auth login`).