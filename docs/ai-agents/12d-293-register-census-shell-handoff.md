# 12D-293 — READING-REGISTER CENSUS SHELL SURFACE (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`. **TEST RUN DISCLOSED**:
`test:12d-293` = **8/8 pass**; `typecheck:12d-293` = **exit 0**;
`test:12d-113` (the alignment-invariant audit) = **9/9 — ZERO
findings**. Chain regression (12d-85…91 + 12d-270…293, 31 files in one
`tsx --test` run) = **244/244, zero failures**. Shell build
(`services/xiv-story-shell` `npm run build`) = **exit 0** — the new
`/api/ingest/register-census` route appears in the built route list.
**CI IS NOT CLAIMED PASSED** (`ci_quota_exceeded`). Reviewers:
CLAUDE_CODE (self-review). GROK_XAI review PENDING — never fabricated.

## What this rung is

The 12D-276 reading source register had NO shell view — the operator
could not SEE the register census without running scratch scripts. This
rung is the 12D-272/282 pattern applied to the register: the operator
drops a register submission (register genesis + register lines) as a
JSON file or pasted text, the LOCAL server re-verifies the WHOLE
submission through the REAL contracts, and ONLY a frozen view model
renders:

- **`xiv-reading-register-census-view-model.ts`**: pure module (no fs,
  no network primitive, no caller — asserted at source level). The
  exact-shape gate requires exactly `{ registerGenesis, lines }` in
  order; short/missing/malformed inputs refuse; an EMPTY register
  refuses (the view never fabricates a zero-entry success). The lines
  are read through a TRANSIENT read-only store whose `save()` throws —
  a census view has no append path by construction. Verification runs
  the REAL `readSourceRegisterEntries` chain walk (tampered bytes
  refuse exactly as they refuse at the binding door) and the REAL
  `replaySourceRegisterCensus`. VERIFIED render = measured counts only
  (entries, capacity, remainingCapacity, byClass), every record
  (no truncation — the register's own 10,000-entry cap bounds any
  lawful register), and the CHAIN HEAD DIGEST pinned in the render for
  the out-of-band tail-truncation comparison (the register's own
  disclosed residual). The census's `sourcesRead` field is rendered
  HONESTLY — pinned 0 BY THE REGISTER CONTRACT; the operator note says
  REGISTERED IS NOT READ and that reads are measured by the queue and
  the 12D-285 draft receipts. Every refusal carries ZERO register
  content (no lines, no genesis, no sources, no counts).
- **`/api/ingest/register-census` route** (LOCAL endpoint): raw text →
  JSON.parse (its own REFUSED fallback on unparseable text) → the view
  model → Response.json. No persistence, no write path, remoteCalls 0,
  modelCalls 0.
- **`register-census-panel.tsx`** (client panel): mirrors the 12D-282
  provenance panel exactly; renders ONLY the frozen view model; refused
  content never crosses to the browser. Wired into `page.tsx` between
  `ProvenancePanel` and `DraftReceiptPanel`.
- **The suite** (8 tests): the happy path through REAL registered
  sources (entries/capacity/remainingCapacity/byClass incl. a zero
  class, sourcesRead 0, head digest = last entryDigest, no truncation,
  operator note pins REGISTERED IS NOT READ + the out-of-band
  comparison); a tampered MIDDLE line refuses the whole submission with
  zero content; a TAIL truncation still verifies (the disclosed
  residual) with a CHANGED head digest so it is detectable out of
  band; an empty register refuses; malformed submissions refuse (wrong
  keys, wrong order, non-object, bad types, short genesis); every
  refusal carries zero register content; the view model NEVER THROWS
  on garbage and the frozen policy/guardrails are pinned; source-level
  purity (no fs, no fetch, no endpoint literal, no caller; verifies
  through the REAL contracts, reimplements nothing).

## Exact files

- `services/ai/runtime/offline-team/xiv-reading-register-census-view-model.ts` (new)
- `services/ai/runtime/offline-team/xiv-reading-register-census-view-model.test.ts` (new, 8 tests)
- `services/xiv-story-shell/src/app/api/ingest/register-census/route.ts` (new)
- `services/xiv-story-shell/src/app/register-census-panel.tsx` (new)
- `services/xiv-story-shell/src/app/page.tsx` (wired: import + render)
- `services/ai/package.json` — `test:12d-293`, `typecheck:12d-293`
- `.gitlab-ci.yml` — `typecheck:12d-293`, `test:12d-293` steps
- `docs/ai-agents/12d-293-register-census-shell-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-293          # RAN: 8/8 pass
npm run typecheck:12d-293     # RAN: exit 0
npm run test:12d-113          # RAN: 9/9 (ZERO audit findings)
chain regression 85..91+270..293  # RAN: 244/244 (31 files, zero failures)
shell npm run build           # RAN: exit 0 (register-census route present)
```

## Defects found and paid down during this story

- (pre-commit, syntax) the REFUSED return block ended `};` instead of
  `});` — caught by the first `tsx --test` run as a transform error.
- (suite-caught, pre-commit) the happy-path fixture expected `byClass`
  WITHOUT the zero-count `PUBLISHED_STANDARD` class — the REAL census
  counts all three register classes including zeros; fixture corrected
  to the contract's measured shape.
- (test-draft) a single-quoted test title containing an apostrophe
  would have broken parsing — fixed before the first run.
- No contract-module change: the 12D-276 register contracts passed
  unchanged; the view model re-implements none of their gates.

## Approval status

`modelCalls 0`, `remoteCalls 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation, no credential use.
The commit stages ONLY the files above and never touches
`services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

- Review decisions on the FIVE settled drafts (GHG chunks 1-3 + the
  ALDI chunk-1 + the OWASP Top 10 chunk-1, all AWAITING_REVIEW) — the
  human decision is Devin's.
- Read further CEO-named sources through the cycle (98 registered
  unread; verify the Socrata/dataset subjects first; candidates:
  OWASP CheatSheetSeries, GSA/data.gov, mlflow).
- Adopt the 12D-278 bound bridge as the ONLY admission door — CEO
  decision.
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated); rail integration for 12D-266 (BLOCKED on CEO
  authorization + credentials); GitHub Phase 1 lockdown (blocked on
  `! gh auth login`).