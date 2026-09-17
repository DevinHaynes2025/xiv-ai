# 12D-322 — The Review Slate CLI (read-only measurement for the CEO-gated review rung)

**Story rung:** 12D-322 · **Policy:** `12d-322-v1` (domain
`XIV_OS_REVIEW_SLATE_CLI`) · **Parents:** 12D-321 (its top
"next candidate": CEO review of the 35 drafts) / 12D-296 (the CLI
discipline: executor, not decider) / 12D-313+ (the offline story queue
contract — its OWN page/summary/validate are called, never re-implemented)

## What this rung is

The operator/CEO has had no trustworthy listing of WHAT is pending
review. This rung is the measurement surface for that review: ONE
LOCAL CLI invocation prints the pending-review slate — one page per
invocation, over the operator's REAL queue, through the REAL queue
contract's own read-only `page()`/`summary()` queries. NOTHING is
decided, settled, reviewed, approved, or written here — every review
decision stays the human's, made at the review door:

```
node xiv-review-slate.cli.ts --queue=<path> --tenant=<id> --limit=<1..100>
```

## Fail-closed by construction

- Exactly the three flags (`--queue --tenant --limit`), each once,
  each with a value; unknown/duplicate/missing/malformed refuse with
  exit 2. NO `--status` flag (the slate is AWAITING_REVIEW-only —
  DONE/READY listings are the census's job), NO `--decision` flag
  (decisions are the human's, never the CLI's), NO write path at all.
- A MISSING queue file refuses BEFORE the queue is opened — the CLI
  never creates a queue by accident (a silent empty queue at a typo'd
  path would be a silent lie).
- EVERY entry is secret-screened through the REAL `SECRET_CONTENT_RE`:
  a secret-shaped objective renders as a counted redaction placeholder
  — the content never renders anywhere in the packet (asserted in the
  suite).
- A TAMPERED ROW refuses the WHOLE slate: a body that does not parse,
  a malformed identity field, or an objective outside the REAL queue
  contract's OWN bound (`bounded(objective, 3000)` — the CLI re-derives
  its shape from the door, never guesses) means the queue bytes were
  touched outside the REAL doors — the slate renders NOTHING and says
  why.
- Every census count is re-validated before trusted; truncation is
  honest, keyed off the queue's OWN census (`totalAwaiting`), disclosed
  never padded; the slate digest binds the whole derivation
  tamper-evidently.
- LOCAL I/O only: modelCalls 0, remoteCalls 0, no network primitive;
  `stoppedBefore` discloses that the slate LISTS pending reviews and
  never decides.

## Adversarial tests (12, all through REAL doors)

Guardrails pinned (no `--status`/`--decision`/`--write` in the flag
list); parser discipline (arity, unknown, duplicate, empty value,
malformed tenant, limit 0/101/non-integer/out-of-range); the REAL loop
(pending drafts listed in order, DONE excluded, other tenants excluded,
16-hex hash heads, empty truncation note); read-only (running twice
leaves every state/count unchanged, digests identical); missing queue
file refuses without creating; honest truncation ("lists 2 of 3");
tenant scoping + honest empty slate for an unknown tenant; secret-shaped
objective → `redactedCount 1` and the secret string never in the JSON;
tampered body refuses the whole slate; tampered output hash refuses;
the objective bound is the REAL 3000 (a live-sized 2648-char objective
LISTS with a 200-char bounded display; a 3001-char objective refuses);
the digest binds the derivation (re-hashed and verified).

## LIVE measure (real invocation over the REAL live queue)

```
node xiv-review-slate.cli.ts --queue .xiv-runtime/reading-queue-cycle-live-2026-09-16.sqlite
  --tenant xiv-os --limit 100
```

→ `REVIEW_SLATE`: **totalAwaiting 35, listed 35 of 35** (133 rows
scanned, truncation note ''), `redactedCount 1` (one live objective is
secret-shaped — rendered as the placeholder, never the content), slate
digest `31f3f6602ec6e8cc…`. This is the exact slate for the CEO-gated
review rung. (Before the 3000-bound fix the same invocation refused —
the slate's own first live run caught the CLI's guessed 2000 bound and
the bound was re-derived from the REAL queue contract, which is the
discipline working as designed.)

## Measured (local, nothing remote)

- `typecheck:12d-322` exit 0; new suite **12/12**.
- **Full chain regression 1496/1496 across 250 files** (1484 + 12),
  0 failures.
- Python suites OK (17 + 20 = 37); shell build exit 0 (unchanged — the
  slate is operator-side LOCAL I/O only; nothing was added to the shell).

## What this is NOT

- NOT any review decision: the slate lists; settling, approving,
  rejecting, and every other review action remain the human's, at the
  review door.
- NOT a write path: the queue is opened, enumerated, closed — twice-run
  equality is asserted in the suite.
- NOT a shell surface: nothing was added to the shell; the slate is an
  operator-side LOCAL CLI (the 12D-273 lesson — queue-touching surfaces
  stay out of the shell).
- NOT any claim about the review being DONE: 35 drafts are listed for
  the CEO; decisions are outstanding and CEO-gated.

## Next candidates

1. CEO review decisions on the 35 listed drafts (clean slate,
   CEO-gated) — the slate is ready to serve them.
2. An 8-copy `SECRET_CONTENT_RE` collapse to one shared export — only
   if a review asks.
3. A flow runbook page in the handoff tree (documentation rung) if the
   operator wants a printed runbook for the 12D-321 flow.