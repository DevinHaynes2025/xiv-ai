# 12D-323 — The Review Decision Worksheet CLI (the door's hash-bound inputs, prepared never applied)

**Story rung:** 12D-323 · **Policy:** `12d-323-v1` (domain
`XIV_OS_REVIEW_DECISION_WORKSHEET_CLI`) · **Parents:** 12D-322 (the
review slate — its listing showed only hash heads) / the REAL review
door `applyReviewDecision` (offline-story-queue) / the REAL
enterprise-workforce contract (designated independent reviewers) /
12D-285 (the draft-receipt step that comes FIRST) / 12D-296 (the CLI
discipline: executor, not decider)

## What this rung is

The 12D-322 slate lists the pending drafts but deliberately shows only
16-hex hash HEADS — while the REAL review door is HASH-BOUND: a
decision refuses unless `expectedOutputHash` matches the settled hash
exactly. This rung is the mechanical half of the CEO-gated review
decision rung: ONE LOCAL CLI invocation prepares the door's EXACT
inputs for every pending draft — the FULL output hash, the door's own
decision vocabulary with its state effects, and the story's REAL
designated independent reviewers (from the REAL workforce contract,
never invented) — and NEVER applies anything:

```
node xiv-review-decision-worksheet.cli.ts --queue=<path> --tenant=<id> --limit=<1..100>
```

Per entry the worksheet carries `decisionInputs` — the exact
`applyReviewDecision` input shape with `reviewerId`, `decision` and
`reviewRef` left BLANK (`''`): the human chooses the reviewer among the
REAL designated ones, decides, and writes the provenance `reviewRef`
(≤ 256 chars) at the review door. The door's OWN vocabulary is
disclosed verbatim from the REAL contract: `APPROVED → DONE`,
`CHANGES_REQUESTED → READY`, `REJECTED → FAILED`.

## Fail-closed by construction

- Exactly the three flags (`--queue --tenant --limit`), each once.
  NO `--decision` flag, NO `--apply` flag, NO write path of any kind —
  a worksheet that could decide would be the decision.
- A MISSING queue file refuses BEFORE the queue is opened — never
  creates a queue by accident.
- EVERY entry is secret-screened through the REAL `SECRET_CONTENT_RE`
  (stateless — verified no `/g` flag); a secret-shaped objective
  renders as a counted redaction placeholder, never the content.
- A TAMPERED ROW refuses the whole worksheet: a body that does not
  parse, malformed identity fields, an objective outside the REAL
  queue contract's OWN bound (`bounded(objective, 3000)`), or a role
  the REAL workforce contract does not know (the same check the REAL
  review door itself runs).
- Every census count re-validated before trusted; truncation honest,
  keyed off the queue's OWN census; the worksheet digest binds the
  whole derivation (including the vocabulary) tamper-evidently.
- LOCAL I/O only: modelCalls 0, remoteCalls 0, no network primitive;
  nothing was added to the shell (the 12D-273 lesson).

## Adversarial tests (13, all through REAL doors)

Guardrails pinned (no `--decision`/`--apply`/`--write` in the flag
list); parser discipline (arity, unknown, duplicate, empty value,
malformed tenant, limit 0/101/non-integer/out-of-bound); the REAL loop
(full hex64 `expectedOutputHash` matching the settled hash, blanks
stay blank, designated reviewers === the REAL
`getEnterpriseRole('memory_curator').reviewerIds`, vocabulary disclosed
verbatim with state effects); read-only (twice-run equality, states
and counts unchanged); missing queue file refuses without creating;
honest truncation ("prepares 2 of 3"); tenant scoping + honest empty
worksheet; secret redaction counted and never echoed (asserted against
the whole packet JSON); tampered body and tampered output hash each
refuse the whole worksheet; an unknown workforce role refuses; the
objective bound is the REAL 3000 (2648-char lists with a 200-char
display, 3001 refuses); the digest binds the derivation (re-hashed and
verified).

## LIVE measure (real invocation over the REAL live queue)

```
node xiv-review-decision-worksheet.cli.ts --queue .xiv-runtime/reading-queue-cycle-live-2026-09-16.sqlite
  --tenant xiv-os --limit 100
```

→ `REVIEW_DECISION_WORKSHEET`: **totalAwaiting 35, prepared 35 of 35**
(133 rows scanned, truncation note ''), `redactedCount 1` (the same
live secret-shaped objective — placeholder, never content),
designated reviewers `['secure_code_reviewer', 'release_verifier']`
from the REAL workforce contract, the door's 3-decision vocabulary
verbatim, worksheet digest `5875ed2f5c20157f…`. The full hash-bound
inputs for the 35 CEO review decisions are now prepared; the decisions
themselves remain outstanding and the CEO's.

## Measured (local, nothing remote)

- `typecheck:12d-323` exit 0; new suite **13/13**.
- **Full chain regression 1509/1509 across 251 files** (1496 + 13),
  0 failures.
- Python suites OK (17 + 20 = 37); shell build exit 0 (unchanged —
  the worksheet is operator-side LOCAL I/O only).

## What this is NOT

- NOT any review decision: no decision is applied, picked, or
  suggested; every `decisionInputs` decision field is `''`.
- NOT a write path: the queue is opened, enumerated, closed — twice-run
  equality is asserted in the suite.
- NOT a substitute for the 12D-285 draft-receipt step: the reviewer
  must HOLD the settled draft (queue-verified receipt) BEFORE deciding;
  the worksheet's `stoppedBefore` discloses exactly that.
- NOT a shell surface: nothing was added to the shell.
- NOT any claim the review is DONE: 35 decision packets are prepared
  for the CEO; decisions are outstanding and CEO-gated.

## Next candidates

1. CEO review decisions on the 35 prepared decision packets
   (CEO-gated) — the worksheet has the mechanical half ready.
2. A flow runbook page in the handoff tree (documentation rung) if the
   operator wants a printed runbook for the 12D-321 flow.
3. The 8-copy `SECRET_CONTENT_RE` collapse to one shared export — only
   if a review asks.