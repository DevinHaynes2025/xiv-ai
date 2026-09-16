# 12D-275 — Reading Admission Door (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-reading-admission.ts` + 12
adversarial tests). **TEST RUN DISCLOSED**: `test:12d-275` (node TAP
via tsx) = **12/12 pass**; `typecheck:12d-275` (strict tsc, covering
the 12D-1xx queue AND the 12D-274 ingest module) = **exit 0**.
Sibling regressions (single tsx run): **98/98** across the offline
story queue, 12d-273 queue census, 12d-274 document ingest, 12d-275
reading admission, the pathway evidence bridge, 12d-269 approval
link, 12d-264 ledger, 12d-271 pathway census, and 12d-272 custody
journal census. Shell build (Next.js 16.3.5): compiled + typechecked
(unchanged tree — see "no shell surface, by design"). CI IS NOT
CLAIMED PASSED (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE
(self-review). GROK_XAI review PENDING — never fabricated.

## What this rung is

The next rung of the reading chain (CEO directive 2026-09-16 — "use
all the documents and get the AI agents to start learning and
reading"): 12D-274 PREPARED the reading stories; **12D-275 ADMITS
them** — the supervised, operator-driven door that admits prepared
stories into a REAL 12D-1xx queue and reports a MEASURED admission
census.

`admitReadingStories(queue, prepared)`:

1. **THE QUEUE IS THE OPERATOR'S CHOICE** — a trusted
   `OfflineStoryQueue` instance; the door never opens, creates, or
   relocates a database (foreign queue objects refuse).
2. **RE-VERIFIED, NEVER TRUSTED**: the prepared result must be
   exactly the shape `prepareDocumentStories` produces (exact keys,
   in order, at BOTH the result and story level); its policyVersion
   must be this chain's (`12d-274-v1`); chunkCount must equal the
   stories count; and every story must CROSS-BIND to the same
   document digest (`sourceRevision === digest.slice(0,40)`), the
   approved master plan hash, the tenant, the chunk sequence
   (`id === doc-<documentId>-chunk-<i+1>`), the digest citation in
   the objective, and the ORDINARY `memory_curator` PRODUCT_STORY
   shape. A result whose stories belong to another document refuses
   BEFORE any write (proven: the queue still measures zero rows).
3. **THE REAL QUEUE'S OWN CONTRACT does the admission**: the door
   calls the queue's own `enqueue()` — validation, fingerprints,
   dedup, the 1,000-row batch bound, and the 2,000,000-row policy
   ceiling are the QUEUE's, never re-implemented. An over-batch
   result refuses before the queue is touched at all.
4. **MEASURED COUNTS ONLY**: after admission the door re-derives the
   queue's own `summary()` — inserted/duplicates accounting must add
   up, the census reports the GROUP BY counts, `liveAgentCount` stays
   the honest null, the ceiling is never rendered as achieved usage.
5. **SUPERVISED, NOT AUTOMATIC**: the door admits and reports; it
   never claims, never settles, never reviews, never activates
   (`noClaimNoSettleNoReview`, `activated: 0`). Proven claimability:
   the suite claims an admitted story through the queue's own lease
   discipline — the queue decides, not the door.

## No shell surface, BY DESIGN

This module imports the SQLite-backed queue and must NEVER be
imported by the story shell — the shell stays database-free (the
12D-273 lesson). There is no `/api/ingest/*` route for admission: a
browser-reachable admission door would let an HTTP request write to
a database without the operator standing at it. Admission stays an
operator-side, supervised step. The shell tree is unchanged; its
build was re-run for the record.

## Defects found and paid down during this story

- **(self-caught pre-run)** the first `dependencies` gate tolerated a
  NON-array (only non-empty arrays refused) — tightened to require an
  actual empty array (the queue's full validation still backs it).
- **(self-caught pre-run)** the exact-keys test's story-reorder
  fixture used object spread, which PRESERVES key order — the
  assertion would have passed vacuously. Rebuilt the fixture with
  genuinely reordered keys (id moved to the end).
- **(self-caught pre-run)** test temp dirs were never removed — the
  queue helper now returns its temp path and removes it on exit.

## The honest boundary

- The door trusts the queue INSTANCE it is handed (the operator's
  choice of database file is the supervision point) — disclosed
  residual.
- The structural re-verification proves the prepared result is
  well-formed and cross-bound; it cannot prove which PROCESS produced
  it — the digest chain (sourceRevision) is the bound.
- ZERO real documents admitted so far — zero real user stories ever
  claimed; `billionUsersProven: false`; `learningPromoted: false`;
  `automaticRecovery: false`; `modelCalls: 0`, `remoteCalls: 0`;
  `collectsNothing: true` — all pinned and frozen. The 2,000,000-row
  bound renders only as the queue's POLICY ceiling.

## Exact files

- `services/ai/runtime/offline-team/xiv-reading-admission.ts` (new)
- `services/ai/runtime/offline-team/xiv-reading-admission.test.ts`
  (new, 12 tests — REAL admission + claimability; idempotent
  re-admission by the queue dedup; tampered-digest cross-binding
  refusal with zero rows written; foreign chunk id; policy-version
  drift; chunkCount mismatch; approved-plan drift; role/class drift;
  over-batch refusal before the queue is touched; foreign queue
  object refusals; exact-keys gates at result AND story level incl.
  reordering/extras/missing + malformed submissions; guardrail/policy
  pins)
- `services/ai/package.json` — `test:12d-275`, `typecheck:12d-275`
- `.gitlab-ci.yml` — `typecheck:12d-275`, `test:12d-275` steps
- `docs/ai-agents/12d-275-reading-admission-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-275  # RAN: exit 0
npm run test:12d-275       # RAN: 12/12 pass
sibling run via tsx --test # RAN: 98/98 (9 chain suites)
shell npm run build        # RAN: compiled + typechecked (tree unchanged)
```

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation of anything, no
external fetch, no install, no credentials. The commit stages ONLY the
files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

- The supervised READING/REVIEW step for admitted stories: a
  fail-closed operator surface that walks the queue's
  claim/settle/review flow for reading stories (or an honest
  statement of why that stays manual — the local reasoner, Ollama
  qwen2.5-coder:7b, would be the first reader, loopback-only,
  `modelCalls` no longer 0 but LOCAL-only; a CEO decision).
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated).
- Rail integration for 12D-266 (BLOCKED on CEO authorization +
  credentials).
- GitHub Phase 1 lockdown (blocked on the CEO's `! gh auth login`).