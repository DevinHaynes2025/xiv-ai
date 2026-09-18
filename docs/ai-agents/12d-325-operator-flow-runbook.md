# 12D-325 — The XIV AI OS Operator Flow Runbook

**Story rung:** 12D-325 (documentation rung — the 12D-324 handoff's
candidate #2) · **Parents:** the rung it documents — 12D-276 (the
register) / 12D-274→275/278 (ingest → bound admission) / 12D-283/284
(the supervised reading cycle + CLI) / 12D-288/292 (recovery) /
12D-315/316/321 (staleness → plan → flow) / 12D-322/323/324 (the
review loop: slate → worksheet → human decision file → apply)

## Scope and honesty preamble

Every command in this runbook is the COMMITTED contract's own CLI, with
its flags quoted verbatim from the committed module — each was
live-measured in its own rung's handoff (the table in §7 cites where).
The runbook itself introduces NO new code and NO new capability claim:
it is the operator's printed page for the LOCAL-PLANE flows. All of it
runs on one machine: modelCalls loopback-only (Ollama qwen2.5-coder:7b
at 127.0.0.1:11434), remoteCalls 0 everywhere, review decisions always
the human's. The only measured ceiling remains 2,000,000 rows/database.

Working directory for every command: `services/ai`, run through the
worktree's own tsx (`node node_modules/tsx/dist/cli.mjs`). Scratch
queues/registers live under `.xiv-runtime/` and are NEVER committed.

## Flow A — register a source, read it, admit the reading

1. **REGISTER** (12D-276 door, `xiv-bound-admission.cli.ts` and the
   cycle CLI share the register flags; registration happens through the
   REAL register contract, never hand-written files):
   the register is a tamper-evident chain — `--register` (file),
   `--genesis` (hex), each entry carries the source's verified license.
   REGISTERED ≠ READ.
2. **THE SUPERVISED CYCLE** (12D-283/284 — ONE chunk per invocation):
   ```
   node node_modules/tsx/dist/cli.mjs runtime/offline-team/xiv-supervised-reading-cycle.cli.ts
     --register <file> --queue <file> --genesis <hex> --tenant <id>
     --source <source-id> --document <local-file> --title <title> --body <local-file>
   ```
   Flags verbatim (8): `--register --queue --genesis --tenant --source
   --document --title --body`. The bytes are the operator's LOCAL file
   (the 12D-274 ingest door re-chunks, re-gates secrets, binds the
   digest); admission goes through the REAL 12D-275/278 doors; the
   local Ollama reads ONE chunk per invocation; the draft settles as
   AWAITING_REVIEW; STOPPED before review.
3. **RECOVERY when a chunk durably FAILED** (12D-288/292):
   ```
   node node_modules/tsx/dist/cli.mjs runtime/offline-team/xiv-reading-recovery.cli.ts
     --register <file> --queue <file> --genesis <hex> --tenant <id>
     --source <id> --document <local-file> --title <title> --body <local-file>
     --operator-ref <ref>
   ```
   Flags verbatim (9 — the cycle's 8 + `--operator-ref`). Recovery
   clears the failed hash and returns the story to READY; the re-read
   is the NEXT cycle invocation (recovery itself makes no model call).

## Flow B — staleness → plan → re-ingest (12D-315/316/321)

When the staleness card says STALE (supplied re-fetched digests vs the
memory block's recorded heads):

```
node node_modules/tsx/dist/cli.mjs runtime/offline-team/xiv-stale-reingest-flow.cli.ts
  --queue <file> --register <file> --genesis <hex> --source <id>
  --memory <packet.json> --digests <digests.json> --document <stale-id>
  --new-document <new-id> --new-title <title> --new-body <body-file>
```

Flags verbatim (10): `--queue --register --genesis --source --memory
--digests --document --new-document --new-title --new-body`. NO tenant
flag (the tenant comes from the verified memory packet); NO digest flag
anywhere (the digest is the doors', never a claim). A CURRENT or
UNCHECKED source refuses "nothing to re-ingest" — nothing admitted.
A CURRENT refusal leaves no queue file (the queue opens only after the
plan passes).

## Flow C — the review loop (slate → worksheet → THE HUMAN → apply)

1. **SEE — the review slate** (12D-322, read-only):
   ```
   node node_modules/tsx/dist/cli.mjs runtime/offline-team/xiv-review-slate.cli.ts
     --queue <file> --tenant <id> --limit <1..100>
   ```
2. **PREPARE** — the review decision worksheet (12D-323, read-only):
   ```
   node node_modules/tsx/dist/cli.mjs runtime/offline-team/xiv-review-decision-worksheet.cli.ts
     --queue <file> --tenant <id> --limit <1..100>
   ```
   Per pending draft: the FULL `expectedOutputHash` (the door is
   hash-bound), the story's REAL designated independent reviewers, the
   door's own decision vocabulary (`APPROVED→DONE`,
   `CHANGES_REQUESTED→READY`, `REJECTED→FAILED`) — with `reviewerId`,
   `decision`, `reviewRef` left BLANK.
3. **DECIDE — the human's step, never tooling**: the reviewer first
   HOLDS the settled draft (12D-285 receipt, queue-verified against the
   settled hash), then writes a decisions file — a JSON array (1..1000)
   with EXACT keys in order
   `[storyId, reviewerId, decision, expectedOutputHash, reviewRef]`.
4. **EXECUTE** — the review decision apply CLI (12D-324):
   ```
   node node_modules/tsx/dist/cli.mjs runtime/offline-team/xiv-review-decision-apply.cli.ts
     --queue <file> --tenant <id> --decisions <file.json>
   ```
   PRE-FLIGHT ALL, APPLY ONLY AFTER: every entry pre-flighted through
   the REAL `inspectStory` + workforce doors; ONE bad entry refuses the
   WHOLE batch with NOTHING applied; the REAL door re-enforces the hash
   and the designated reviewer at write time. The CLI never decides.

**Note on the older review surface:** `xiv-reading-review.cli.ts`
(12D-101 era; flags `--queue --tenant --story --reviewer-role
--review-ref`) goes through the `acceptReview` door, which is NOT
output-hash-bound. For reading drafts, the current discipline is the
12D-285 receipt (hash-verified draft in the reviewer's hand) + the
hash-bound `applyReviewDecision` path of Flow C step 4.

## Flow D — memory, staleness cards, provenance (operator view surfaces)

- **Assistant memory read** (12D-305): `prepareAssistantMemoryRead`
  over the queue — 6 most-recent reviewed (DONE) facts, tenant-bound,
  secret-screened, digest-bound; never READY/LEASED/AWAITING_REVIEW/FAILED.
- **Source staleness card** (12D-315): compare the memory block's
  recorded `doc:<id>:<head16>` digests against re-fetched hex64
  digests the operator supplies; verdicts CURRENT/STALE/UNCHECKED per
  document; STALE rows disclose the affected storyIds.
- **Reading provenance view** (12D-281) and **pathway evidence**
  (12D-279/304): replay the pathway ledger additively; eligibility is
  RE-DERIVED and honestly disclosed (distinct reviews + human approval
  required); ledgered NEVER activated.
- **Shell surfaces** (Next.js, `services/xiv-story-shell`): the
  `/api/ingest/*` routes render frozen view models only — the shell
  never holds a queue and never imports queue-touching runtime doors
  (the 12D-273 lesson). Queue-mutating work is operator-side CLI only.

## §7 — Where each flow was live-measured

| Flow | Rung(s) | Live evidence (see handoff) |
|---|---|---|
| A: register→cycle (3 chunks GHG + ALDI + OWASP + 62 directive-#4 + 35 search-batch chunks) | 12D-283/284, 12D-289, 12D-313, 12D-318 | counted loopback model calls, drafts queue-verified, stopped before review |
| A: recovery (GHG chunk-2 FAILED → READY → re-read) | 12D-288/292 | recovery CLI live, operatorRef echoed, no model call in recovery |
| B: staleness → plan → flow (STALE admitted with disclosed lineage; CURRENT refused) | 12D-315/316/321 | `STALE_REINGEST_ADMITTED` / "nothing to re-ingest" (exit 2, nothing admitted) |
| C: slate (35 of 35 listed, 1 counted redaction) | 12D-322 | slate digest `31f3f660…`, census 133 rows |
| C: worksheet (35 of 35 prepared, full hashes, blanks blank) | 12D-323 | worksheet digest `5875ed2f…` |
| C: apply (refusal with no decisions file; census unchanged) | 12D-324 | `appliedCount 0`, 35 AWAITING_REVIEW + 98 DONE unchanged |

## What this runbook is NOT

- NOT any review decision: the slate and worksheet list and prepare;
  only the human's decisions file moves anything, and the apply CLI
  executes exactly what the human wrote.
- NOT any fetcher or network surface: every document is the operator's
  LOCAL file; the only model call is loopback Ollama; remoteCalls 0.
- NOT a cloud/deploy/merge surface: nothing here deploys, merges, or
  changes any cloud/GPU/secret resource.
- NOT a claim that review is DONE for the 35 pending drafts — those
  decisions remain the CEO's (the full loop is tooled; the decision is
  the human's).