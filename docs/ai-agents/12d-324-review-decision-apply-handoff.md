# 12D-324 — The Review Decision Apply CLI (executing the human's decisions through the REAL door)

**Story rung:** 12D-324 · **Policy:** `12d-324-v1` (domain
`XIV_OS_REVIEW_DECISION_APPLY_CLI`) · **Parents:** 12D-323 (the
worksheet — its hash-bound inputs are this CLI's input format) /
12D-322 (the slate) / 12D-317 (the precedent: CEO decisions applied
through the REAL door) / the REAL `applyReviewDecision` door
(offline-story-queue) / the REAL `inspectStory` + workforce contracts
(pre-flight) / 12D-285 (hash-bound "not holding the draft they claim")

## What this rung is

The review loop's operator tooling was missing its last surface:
slate (12D-322, lists) → worksheet (12D-323, prepares the door's
hash-bound inputs) → THE HUMAN DECIDES → apply — with the application
step, until now, an ad-hoc door call (the 12D-317 pattern) instead of
an operator-repeatable tool. This rung is the EXECUTION surface for
review decisions THE HUMAN has already made:

```
node xiv-review-decision-apply.cli.ts --queue=<path> --tenant=<id> --decisions=<file.json>
```

The decisions file is a JSON array (1..1000) of entries with EXACT
keys in order `[storyId, reviewerId, decision, expectedOutputHash,
reviewRef]` — the full hashes come from the 12D-323 worksheet; the
decisions, reviewer, and provenance `reviewRef` are entirely the
human's. The CLI has no decision of its own and no `--decision` flag.

## Fail-closed by construction

- Exactly the three flags (`--queue --tenant --decisions`), each once;
  unknown/duplicate/missing refuse with exit 2.
- A MISSING queue or decisions file refuses BEFORE anything is opened
  — the CLI never creates a file by accident and NEVER invents a
  decision (an empty decisions file is a refusal, not a no-op).
- PRE-FLIGHT ALL, APPLY ONLY AFTER: every entry is checked through the
  REAL `inspectStory` door (story exists under the tenant, is
  AWAITING_REVIEW, and the queue's settled output hash EQUALS the
  claimed `expectedOutputHash` — a stale or tampered hash is "not
  holding the draft they claim", the 12D-285 echo) and through the
  REAL workforce contract (the reviewer is one of the story's role's
  designated independent reviewers — the door's own check, mirrored).
  ONE bad entry refuses the WHOLE batch with NOTHING applied.
- The decisions file is validated in full shape first (exact keys in
  order, decision vocabulary, hash shape, reviewRef 1..256,
  secret-screened reviewRef, no duplicate storyIds); the REAL door
  re-enforces everything again at write time.
- LOCAL I/O only: modelCalls 0, remoteCalls 0, no network primitive;
  nothing was added to the shell (the 12D-273 lesson).

## Adversarial tests (10, all through REAL doors)

Guardrails pinned (no `--decide`/`--decision`/`--reviewRef` in the
flag list); parser discipline (arity, unknown, duplicate, empty,
malformed tenant); decisions-file discipline (exact keys IN ORDER,
vocabulary, hash shape, empty/oversized/secret-shaped reviewRef, one
decision per story); the REAL loop (APPROVED/CHANGES_REQUESTED/
REJECTED applied through the REAL door → queue truth read back as
DONE/READY/FAILED, `decidedBy: THE_HUMAN_VIA_THE_DECISIONS_FILE`);
missing queue file refuses without creating; missing decisions file
refuses "never invents decisions"; pre-flight refusal on one bad entry
leaves the whole queue untouched (`appliedCount 0`, the good entry
still AWAITING_REVIEW); stale/tampered hash refuses "not holding the
draft they claim"; a non-designated reviewer refuses; a
not-AWAITING_REVIEW story refuses (the door's own preconditions
mirrored); an empty decisions file refuses.

## LIVE measure (real invocation over the REAL live queue)

```
node xiv-review-decision-apply.cli.ts --queue .xiv-runtime/reading-queue-cycle-live-2026-09-16.sqlite
  --tenant xiv-os --decisions .xiv-runtime/no-decisions-12d-324.json
```

→ `REVIEW_DECISION_APPLY_REFUSED` (exit 2): "the decisions file does
not exist; the CLI never invents decisions — the human writes them
first; NOTHING was applied; fail closed", `appliedCount 0`. Census
read back through the REAL queue contract AFTER the refused run:
**35 AWAITING_REVIEW + 98 DONE — unchanged**. The 35 review decisions
remain outstanding and the CEO's; when the CEO writes a decisions
file, this CLI executes it hash-bound through the REAL door.

## Measured (local, nothing remote)

- `typecheck:12d-324` exit 0; new suite **10/10**.
- **Full chain regression 1519/1519 across 252 files** (1509 + 10),
  0 failures.
- Python suites OK (17 + 20 = 37); shell build exit 0 (unchanged).

## What this is NOT

- NOT any decision: the CLI has no decision of its own; every decision
  comes from the human's file, hash-bound and reviewer-checked.
- NOT a shell surface: queue-mutating execution stays operator-side
  (the 12D-273 lesson); nothing was added to the shell.
- NOT a substitute for the 12D-285 draft-receipt step: the reviewer
  should HOLD the settled draft (queue-verified receipt) BEFORE
  writing a decision; the hash-bound pre-flight is the mechanical
  guard, the receipt discipline remains the reviewer's practice.
- NOT any run against the live queue with decisions: no CEO decisions
  exist for the 35 pending drafts; the only live invocation was the
  refusal demo (nothing applied, census unchanged).

## Next candidates

1. CEO review decisions on the 35 pending drafts (CEO-gated) — the
   full operator loop is now tooled end to end: slate (see) →
   worksheet (prepare) → human decision file → apply (execute).
2. A flow runbook page in the handoff tree (documentation rung) if the
   operator wants a printed runbook.
3. The 8-copy `SECRET_CONTENT_RE` collapse to one shared export — only
   if a review asks.