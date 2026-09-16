# 12D-273 — Queue Census View (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-queue-census-view.ts` + 12
adversarial tests). **TEST RUN DISCLOSED**: `test:12d-273` (node TAP
via tsx) = **12/12 pass**; `typecheck:12d-273` (strict tsc, also
covering the 12D-1xx queue) = **exit 0**. Sibling regressions (single
tsx run): **48/48** across the offline story queue, 12d-273, 12d-271
pathway census, and 12d-272 custody journal census. Shell build
(Next.js 16.3.5): compiled, typechecked, 12 static pages — the page
now mounts EIGHT ingest surfaces and the route table includes
`/api/ingest/queue-census`. CI IS NOT CLAIMED PASSED
(`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review; findings
below). GROK_XAI review PENDING — never fabricated.

## What it is

The measured-counts pattern applied to the 12D-1xx offline story
queue — the operator's window into the draft backlog's book. Because
the queue is a LOCAL SQLite file and the view is PURE (no fs), the
submission carries the queue's OWN frozen policy object plus its own
`summary()` output, and the view re-verifies BOTH before a count
renders:

1. **THE POLICY GATE** — the submission's policy must deep-equal the
   pinned snapshot of the REAL `OFFLINE_QUEUE_POLICY`, key for key and
   value for value: a relaxed ceiling, an auto-steal flag, or a
   network allowance is not this queue's book (proven by the suite).
2. **THE EXACT-SHAPE GATE** — the summary must have exactly the keys
   `summary()` produces, in order; every count row must be
   exact-shaped with a valid kind and state.
3. **CROSS-CONSISTENCY** — facts the queue's contract makes
   impossible to produce refuse the submission: a lease expired
   without being held, a zero GROUP BY count, a repeated
   (kind, state) pair, a measured total over the policy ceiling.
4. **HONEST FLAGS RE-VERIFIED, NEVER TRUSTED** — a forged
   `liveAgentCount` number, `capacityRowsAreUserStories: true`, or
   `hostWideCoordinationVerified: true` refuses with zero leak.
5. **MEASURED COUNTS ONLY** — the 2,000,000-row bound renders as the
   POLICY ceiling (proven by the 12D-103 fixture + drill), never as
   achieved usage; `liveAgentCount` stays the honest null.

The story shell mounts it: `/api/ingest/queue-census` re-verifies in
the LOCAL server process; `queue-census-panel.tsx` renders it;
`page.tsx` mounts it after the custody journal census.

## Defect found and paid down during this story

- **(caught by the shell build, paid down)** the view module originally
  imported `OFFLINE_QUEUE_POLICY` from the queue module — dragging the
  queue's `node:sqlite` dependency into the browser-facing Next build,
  which refused it (TS2307 + TS7006). The honest fix keeps the shell
  database-free: the view pins a frozen POLICY SNAPSHOT and gates
  against it; a dedicated SNAPSHOT GATE test proves the snapshot
  deep-equals the REAL policy exactly and refuses on drift — exactly
  when the view must be updated deliberately, by a reviewed change.
- **(caught by the suite, fixed)** an over-broad no-affordance
  assertion (`'claim'`) collided with the honest negative framing
  ("never claimed") — narrowed to affirmative affordances (the same
  substring-collision class 12D-267 learned).

## The honest boundary

- The view re-verifies the STRUCTURE of the measured book, not the
  SQLite bytes — the census renders what was SUBMITTED, honestly
  produced by the real contract (disclosed residual).
- The ceiling is a bound, not an achievement: zero real user stories
  have ever been claimed; the render says so.
- NO ACTIVATION PATH; no write path; the view never touches a queue.
- `humanDecision: 'REQUIRED'`, `learningPromoted: false`,
  `remoteCalls: 0`, `modelCalls: 0`, `collectsNothing: true`,
  `automaticRecovery: false`, `billionUsersProven: false` pinned and
  frozen.

## Exact files

- `services/ai/runtime/offline-team/xiv-queue-census-view.ts` (new)
- `services/ai/runtime/offline-team/xiv-queue-census-view.test.ts`
  (new, 12 tests — REAL queue render incl. all five states; empty
  queue measured 0; POLICY GATE relaxed/auto-steal/networked refusals;
  honest-flag forgeries refuse with zero leak; cross-consistency
  refusals; unknown kinds/states/negative/fractional counts; exact-keys
  gates incl. summary reordering; malformed submissions HOLD;
  no-affordance + content-free render checks; POLICY SNAPSHOT GATE;
  policy pins)
- `services/ai/package.json` — `test:12d-273`, `typecheck:12d-273`
- `.gitlab-ci.yml` — `typecheck:12d-273`, `test:12d-273` steps
- `services/xiv-story-shell/src/app/api/ingest/queue-census/route.ts`
  (new)
- `services/xiv-story-shell/src/app/queue-census-panel.tsx` (new)
- `services/xiv-story-shell/src/app/page.tsx` (mounts the panel)
- `docs/ai-agents/12d-273-queue-census-view-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-273  # RAN: exit 0 (after the snapshot paydown)
npm run test:12d-273       # RAN: 12/12 pass
sibling run via tsx --test # RAN: 48/48 (queue + 3 census suites)
shell npm run build        # RAN: compiled; route /api/ingest/queue-census
```

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation of anything, no
external fetch, no install, no credentials. The commit stages ONLY the
files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

The CEO's 2026-09-16 directive — "use all the documents and get the AI
agents to start learning and reading" — maps onto the existing honest
chain as the next rung: a fail-closed DOCUMENT INGEST story that turns
local documents into ORDINARY queue stories (reading = the queue; the
review → pathway-candidate → recorded-approval → ledger chain then
accumulates reading evidence, ledgered NEVER activated; actual
learning promotion — any weight mutation — stays CEO-gated and is NOT
part of that rung). Also open: the 12D-243/12D-245 operator questions
(fail-closed, CEO-decision-gated) and rail integration for 12D-266
(BLOCKED on CEO authorization + credentials). GitHub Phase 1 lockdown
remains blocked on the CEO's `! gh auth login`.