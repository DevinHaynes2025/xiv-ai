# 12D-272 — Custody Journal Census View (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-custody-journal-census-view.ts`
+ 13 adversarial tests). **TEST RUN DISCLOSED**: `test:12d-272` (node
TAP via tsx) = **13/13 pass**; `typecheck:12d-272` (strict tsc, also
covering the 12D-236 journal and 12D-233 registry) = **exit 0**.
Sibling regressions (single tsx run): **39/39** across 12d-236 custody
journal, 12d-272, and 12d-267 custody decision view. Shell build
(Next.js 16.3.5): compiled, typechecked, 11 static pages — the page now
mounts SEVEN ingest surfaces and the route table includes
`/api/ingest/journal-census`. CI IS NOT CLAIMED PASSED
(`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review; findings
below). GROK_XAI review PENDING — never fabricated.

## What it is

The 12D-271 measured-counts pattern applied to the 12D-236 custody
journal — the operator's window into the custody chain's book.
`buildCustodyJournalCensusViewModel(raw)` accepts ANY unknown value;
exact keys `['journalGenesis', 'lines']` IN ORDER; then runs the REAL
12D-236 `replayCustodyJournal` through a transient read-only store —
every line re-parsed against the journal's own hash chain, every op
replayed through the 12D-233 registry gates in order, and the rebuilt
ledger required to verify AND match op-for-op — before a single count
is shown. Properties, structurally enforced:

1. **MEASURED COUNTS ONLY** — the render reports ops, the
   registered/consumed split, and the distinct-purpose COUNT. It never
   renders a receipt digest, a registrant identity, or a purpose NAME
   (proven by the suite). An empty journal renders the measured 0.
2. **TAMPER-EVIDENT END-TO-END** — one edited field, one inserted
   foreign line, or one MIDDLE-line deletion refuses the WHOLE
   submission with ZERO journal content.
3. **REGISTRY GATES INSIDE THE REPLAY** — the suite hand-builds a
   digest-consistent journal whose ops violate registry semantics
   (cross-purpose re-registration) and proves the REAL replay refuses
   it: the census cannot render what the registry would refuse.
4. **NO WRITE PATH** — the view's transient store `save()` refuses
   unconditionally; a census can never append by construction.

## Defect found and disclosed during this story (the honest boundary)

- **(caught by the suite, DISCLOSED — not patched away)** TAIL
  TRUNCATION IS NOT DETECTED BY REPLAY ALONE: a hash chain validates
  each line against its predecessor, so a lawful PREFIX of a journal
  replays clean as a shorter journal. This is inherent to the 12D-236
  design (single-writer discipline); it is NOT a defect introduced
  here and the honest response is disclosure, not a fake detection:
  the module header, the rendered `status`, and the operator note all
  pin "TAIL TRUNCATION IS NOT DETECTED BY REPLAY ALONE — compare the
  head digest out of band", and the suite carries a dedicated
  DISCLOSED-RESIDUAL test proving a truncated tail renders the
  measured count of what was SUBMITTED with the residual pinned in the
  render. Middle deletions DO refuse (proven).
- **(test hygiene, pre-run)** the hand-built digest chain first used
  `require('node:crypto')` — unavailable under ESM/tsx; replaced with
  a top-level `createHash` import before the first run. Two strict-tsc
  type fixes followed (forged objects needed `journalDigest` declared;
  the canonical helper widened to `unknown`).

## The honest boundary

- REGISTRATION IS NOT ISSUANCE PROOF (the 12D-233 residual verbatim,
  pinned in the guardrails AND the render): the census authenticates
  the custody chain's bookkeeping, not the operator; possession of the
  journal is not authorization.
- The census render carries NO receipt material, NO identities, NO
  purpose names — counts only (proven by the suite).
- NO ACTIVATION PATH; nothing is activated anywhere in the chain.
- `humanDecision: 'REQUIRED'`, `learningPromoted: false`,
  `remoteCalls: 0`, `modelCalls: 0`, `collectsNothing: true`,
  `automaticRecovery: false`, `billionUsersProven: false` pinned and
  frozen on the view policy.

## Exact files

- `services/ai/runtime/offline-team/xiv-custody-journal-census-view.ts`
  (new)
- `services/ai/runtime/offline-team/xiv-custody-journal-census-view.test.ts`
  (new, 13 tests — measured census render; empty journal renders the
  measured 0; no receipt/identity/purpose material in the render;
  TAMPER edited field / inserted line / MIDDLE deleted line all refuse
  with zero leak; DISCLOSED tail-truncation residual pinned; registry
  gates inside the replay refuse a digest-consistent cross-purpose
  forgery; foreign genesis; exact-keys gates; malformed submissions
  HOLD; no-affordance render check; policy pins)
- `services/ai/package.json` — `test:12d-272`, `typecheck:12d-272`
- `.gitlab-ci.yml` — `typecheck:12d-272`, `test:12d-272` steps
- `services/xiv-story-shell/src/app/api/ingest/journal-census/route.ts`
  (new)
- `services/xiv-story-shell/src/app/journal-census-panel.tsx` (new)
- `services/xiv-story-shell/src/app/page.tsx` (mounts the panel)
- `docs/ai-agents/12d-272-custody-journal-census-view-handoff.md`
  (this file)

## Exact commands and local results

```
npm run typecheck:12d-272  # RAN: exit 0 (after the disclosed test-type fixes)
npm run test:12d-272       # RAN: 13/13 pass
sibling run via tsx --test # RAN: 39/39 (12d-236 + 12d-272 + 12d-267)
shell npm run build        # RAN: compiled; route /api/ingest/journal-census
```

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation of anything, no
external fetch, no install, no credentials. The commit stages ONLY the
files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

A queue census view for the shell (the measured-counts pattern over the
12D-1xx offline story queue), the open 12D-243/12D-245 operator
questions (fail-closed, CEO-decision-gated), and rail integration for
12D-266 (BLOCKED on CEO authorization + credentials + the
closed-beta-vs-public answer). GitHub Phase 1 lockdown remains blocked
on the CEO's `! gh auth login`.