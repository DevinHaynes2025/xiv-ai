# 12D-294 — READING REVIEW CLI (the operator's review door) (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`. **TEST RUN DISCLOSED**:
`test:12d-294` = **6/6 pass**; `typecheck:12d-294` = **exit 0**;
`test:12d-113` (the alignment-invariant audit) = **9/9 — ZERO
findings**. Chain regression (12d-85…91 + 12d-270…294) = **250/250
zero failures**. Shell tree unchanged by this rung (the 12D-293 build
exit 0 stands). **CI IS NOT CLAIMED PASSED**
(`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review). GROK_XAI
review PENDING — never fabricated.

## What this rung is

The queue's review door (`acceptReview`) had NO operator surface — the
2026-09-16 CEO review decision ("i approve" on the six settled drafts)
had to be applied through a scratch script. This rung is the 12D-292
pattern applied to the review door, so the standing loop is the
operator re-running a command:

- **`xiv-reading-review.cli.ts`**: exact-args parser (5 flags
  `--queue --tenant --story --reviewer-role --review-ref`, each exactly
  once with a value; unknown/duplicate/missing refuse; ids ≤ 128 chars
  by the queue's own id discipline; the review ref non-empty and
  ≤ 256 — the queue's own bound). One story per invocation. The CLI is
  the EXECUTOR, never the DECIDER — the human decision comes from the
  operator invoking it with an honest review ref that names the
  decision's source. LOCAL I/O only: no model call (modelCalls 0), no
  network primitive (no fetch, no endpoint literal, no caller import —
  asserted at source level), no register or document access.
  Defense-in-depth: the CLI re-checks the REAL workforce designation
  (`getEnterpriseRole(storyRole).reviewerIds`) BEFORE the queue door
  runs; the queue re-checks its own gate. A story that is missing or
  not in AWAITING_REVIEW refuses with a verbatim packet; the door is
  the REAL `acceptReview` (AWAITING_REVIEW → DONE with the review ref
  recorded as OPERATOR METADATA — the queue's own docstring discipline,
  not an authenticated endpoint). A refusal exits 2.
- **The suite** (6 tests): parser discipline (8 malformed argv
  fixtures); a story not in the queue refuses honestly and the queue
  closes cleanly (a reopen works, no lock, no partial write); a READY
  continuation chunk refuses (never reviewed); **the REAL loop** — a
  REAL AWAITING_REVIEW story produced by the REAL 12D-283 cycle with a
  stub caller (no Ollama) is reviewed to DONE with the review ref
  recorded, the settled output hash untouched, and a SECOND review of
  the now-DONE story refusing; a NON-designated reviewer role refuses
  before anything is written (the queue truth stays AWAITING_REVIEW);
  frozen policy/guardrails pinned + source-level purity.

The operator's standing review loop is now: (1) run the 12D-284 cycle
command (read → AWAITING_REVIEW, stopped before review), (2) run the
12D-294 review command (the human decision applied to the settled
draft). The 12D-101 Ed25519 door remains the stronger authenticated
variant, untouched (no CEO key material; reviewer receipts are never
fabricated).

## Exact files

- `services/ai/runtime/offline-team/xiv-reading-review.cli.ts` (new)
- `services/ai/runtime/offline-team/xiv-reading-review.cli.test.ts`
  (new, 6 tests)
- `services/ai/package.json` — `test:12d-294`, `typecheck:12d-294`
- `.gitlab-ci.yml` — `typecheck:12d-294`, `test:12d-294` steps
- `docs/ai-agents/12d-294-reading-review-cli-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-294          # RAN: 6/6 pass
npm run typecheck:12d-294     # RAN: exit 0
npm run test:12d-113          # RAN: 9/9 (ZERO audit findings)
chain regression 85..91+270..294  # RAN: 250/250 (zero failures)
```

## Defects found and paid down during this story

- (suite-caught, pre-commit) the fixture's `withQueue` finally closed
  an already-closed queue ("database is not open") — the fixture now
  tolerates a test-closed queue before a CLI re-open.
- (typecheck-caught, pre-commit) a `page()` row cast needed the
  `unknown` intermediate — fixed.
- No contract-module change: the queue's `acceptReview` door passed
  unchanged; the CLI re-implements none of its gates.

## Approval status

`modelCalls 0`, `remoteCalls 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation, no credential use.
The commit stages ONLY the files above and never touches
`services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

- Read further CEO-named sources through the cycle (98 registered
  unread; candidates: GSA/data.gov, mlflow, OWASP WSTG).
- Adopt the 12D-278 bound bridge as the ONLY admission door — CEO
  decision.
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated); rail integration for 12D-266 (BLOCKED on CEO
  authorization + credentials); GitHub Phase 1 lockdown (blocked on
  `! gh auth login`).