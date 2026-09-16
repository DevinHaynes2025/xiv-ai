# 12D-271 — Pathway Census View (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-pathway-census-view.ts` + 11
adversarial tests). **TEST RUN DISCLOSED**: `test:12d-271` (node TAP via
tsx) = **11/11 pass**; `typecheck:12d-271` (strict tsc, also covering the
12D-264 ledger) = **exit 0**. Sibling regressions (single tsx run):
**33/33** across 12d-264 pathway ledger, 12d-270 pathway approval view,
and this suite. Shell build (Next.js 16.3.5): compiled, typechecked, 10
static pages — the page now mounts SIX ingest surfaces and the route
table includes `/api/ingest/census`. CI IS NOT CLAIMED PASSED
(`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review; findings
below). GROK_XAI review PENDING — never fabricated.

## What it is

The operator's window into the brain's book — the 12D-267 view pattern
applied to the 12D-264 ledger. `buildPathwayCensusViewModel(raw)`
accepts ANY unknown value; exact keys `['ledgerGenesis', 'lines']` IN
ORDER; then runs the REAL 12D-264 `replayPathwayCensus` through a
transient read-only store — every entry re-parsed, every candidate
re-gated, every hash-chain link re-derived — before a single count is
shown. Properties, structurally enforced:

1. **MEASURED COUNTS ONLY** — the render reports entries, capacity,
   remaining capacity, and byDomain counts, `activated` stays the
   literal 0, and an empty ledger renders the measured 0 claiming
   nothing about unledgered scale (the suite proves no "trillion" and
   no queue-ceiling number ever renders from a census).
2. **TAMPER-EVIDENT END-TO-END** — one edited field, one inserted
   foreign line, or one deleted line refuses the WHOLE submission with
   ZERO ledger content (REFUSAL_LEAK_CHECK across the tamper refusals).
3. **NO WRITE PATH** — the view's transient store `save()` refuses
   unconditionally; a census can never append by construction (the
   verified render says so, and the code enforces it).
4. **BOUNDED SUBMISSION** — more lines than the 10,000 hard cap cannot
   be a lawful ledger; it refuses BEFORE the replay.

The story shell now mounts it: `/api/ingest/census` re-verifies in the
LOCAL server process and returns only the frozen view model;
`census-panel.tsx` renders it; `page.tsx` mounts it after the pathway
decision surface.

## Defects found and paid down during this story

- **(caught by the suite, fixed)** one test assertion expected
  "never appends" while the module's operator note reads "can never
  append" — the assertion was aligned to the module's actual wording
  (the module text was correct; no code change).

## The honest boundary

- The census authenticates the BOOKKEEPING, not the truth of the
  evidence — a ledger fed by an impostor records an impostor's
  candidates (the 12D-233 residual verbatim); the ledger records,
  never verifies who approved (12D-264 residual verbatim).
- NO ACTIVATION PATH anywhere in the view; the suite proves
  `activated` is the literal 0 and no promotion verb renders.
- The census render carries NO candidate material — no pathway ids,
  no rollback refs; counts only (proven by the suite).
- `humanDecision: 'REQUIRED'`, `learningPromoted: false`,
  `remoteCalls: 0`, `modelCalls: 0`, `collectsNothing: true`,
  `automaticRecovery: false`, `billionUsersProven: false` pinned and
  frozen on the view policy.

## Exact files

- `services/ai/runtime/offline-team/xiv-pathway-census-view.ts` (new)
- `services/ai/runtime/offline-team/xiv-pathway-census-view.test.ts`
  (new, 11 tests — measured census render; empty ledger renders the
  measured 0 with no scale claims; TAMPER edited field / inserted
  line / deleted line all refuse with zero leak; foreign genesis;
  over-cap submission refuses before the replay; exact-keys gates;
  malformed submissions HOLD; no-affordance + no-candidate-material
  render check; policy pins)
- `services/ai/package.json` — `test:12d-271`, `typecheck:12d-271`
- `.gitlab-ci.yml` — `typecheck:12d-271`, `test:12d-271` steps
- `services/xiv-story-shell/src/app/api/ingest/census/route.ts` (new)
- `services/xiv-story-shell/src/app/census-panel.tsx` (new)
- `services/xiv-story-shell/src/app/page.tsx` (mounts the panel)
- `docs/ai-agents/12d-271-pathway-census-view-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-271  # RAN: exit 0 (first run)
npm run test:12d-271       # RAN: 11/11 pass (after the assertion fix)
sibling run via tsx --test # RAN: 33/33 (12d-264 + 12d-270 + 12d-271)
shell npm run build        # RAN: compiled; route /api/ingest/census
```

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation of anything, no
external fetch, no install, no credentials. The commit stages ONLY the
files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

A custody-journal census view for the shell (the same measured-counts
pattern over the 12D-236 journal), the open 12D-243/12D-245 operator
questions (fail-closed, CEO-decision-gated), and rail integration for
12D-266 (BLOCKED on CEO authorization + credentials + the
closed-beta-vs-public answer). GitHub Phase 1 lockdown remains blocked
on the CEO's `! gh auth login`.