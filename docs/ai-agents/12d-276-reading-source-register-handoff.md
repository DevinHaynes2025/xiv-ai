# 12D-276 — Reading Source Register (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-reading-source-register.ts` +
11 adversarial tests). **TEST RUN DISCLOSED**: `test:12d-276` (node
TAP via tsx) = **11/11 pass**; `typecheck:12d-276` (strict tsc) =
**exit 0**. Sibling regressions (single tsx run): **109/109** across
the offline story queue, 12d-273 queue census, 12d-274 document
ingest, 12d-275 reading admission, 12d-276 source register, the
pathway evidence bridge, 12d-269 approval link, 12d-264 ledger,
12d-271 pathway census, and 12d-272 custody journal census. CI IS NOT
CLAIMED PASSED (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE
(self-review). GROK_XAI review PENDING — never fabricated.

## What this rung is

The alignment link for the CEO's 2026-09-16 mid-turn directive ("make
sure all agents and AI tools are aligned … extract data from the web
and documents … recycle and feed the XIV AI OS brain"): a PUBLIC
source cannot enter the 12D-274 ingest → 12D-275 admission reading
chain until it was REGISTERED here first — public class, license-
noted, bounded, and hash-bound in a tamper-evident register.

`registerReadingSource(store, registerGenesis, raw)`:

- **PUBLIC-CLASS ONLY, STRUCTURALLY**: the class must be exactly
  PUBLIC_WEB, OPEN_SOURCE_REPO, or PUBLISHED_STANDARD. TOP_SECRET,
  CONFIDENTIAL, PRIVATE, INTERNAL, or anything else REFUSES — the
  standing security boundary is a structural fact, not advice: a
  source that is not public cannot register, so it can never be read
  into the OS through this door.
- **THE SECRET RE-GATE LIVES INSIDE THE VALIDATOR** (the 12D-267
  lesson): a title, URL, or license note carrying credential-shaped
  content never registers.
- **TAMPER-EVIDENT CHAIN** (the 12D-264 pattern): each entry digest is
  sha256 over the canonical entry chained to the previous digest;
  replay re-derives every digest; MIDDLE tampering refuses.
  DISCLOSED RESIDUAL (the 12D-272 lesson, disclosed not patched):
  tail truncation replays clean as a shorter lawful register — the
  head digest must be compared out of band (proven by a dedicated
  test that the head digest MOVES on truncation).
- **REGISTERED ≠ READ**: the register never fetches (remoteCalls: 0,
  even for public URLs); the reading step is human-supervised and the
  fetched text enters the OS through the 12D-274 contract. The census
  pins `sourcesRead: 0` — zero reads are EVER claimed by this module.

## The demonstrated, measured reading cycle (this session)

The chain is now complete and was EXERCISED end to end, honestly and
small — registered sources → supervised reading (by the operator's
AI, in-session) → 12D-274 ingest → 12D-275 admission into a REAL
queue → measured census. Scratch artifacts live under
`services/ai/.xiv-runtime/` (NEVER committed). Numbers reported in
the transcript are MEASURED from these runs; "millions of documents"
remains a VISION — the only measured ceiling is 2,000,000
rows/database, and every measured count in this rung is single
digits.

## The honest boundary

- URL strings are validated structurally (https, length); the
  register cannot prove a URL resolves — reading is supervised
  anyway.
- sourceId dedup is exact-match per tenant per register; the same URL
  under two sourceIds is two entries (the chain binds what was
  REGISTERED, not the world's URL space).
- ZERO real reads claimed by this rung; zero real user stories ever
  claimed; `billionUsersProven: false`; `learningPromoted: false`;
  `automaticRecovery: false`; `modelCalls: 0`, `remoteCalls: 0`,
  `collectsNothing: true` — all pinned and frozen.

## Exact files

- `services/ai/runtime/offline-team/xiv-reading-source-register.ts`
  (new)
- `services/ai/runtime/offline-team/xiv-reading-source-register.test.ts`
  (new, 11 tests — register+chain+census; structural non-public
  refusal incl. TOP_SECRET/CONFIDENTIAL/PRIVATE/INTERNAL; secret
  re-gate on title/URL/license; MIDDLE-tamper refusal +
  DISCLOSED tail-truncation residual with head-digest movement;
  duplicate sourceId refusal; exact-keys gates incl. reordering/
  extras/missing + malformed submissions; malformed fields/URLs;
  genesis/over-budget bounds; refusing-store writes nothing; digest
  re-derivation over the canonical entry; guardrail/policy pins)
- `services/ai/package.json` — `test:12d-276`, `typecheck:12d-276`
- `.gitlab-ci.yml` — `typecheck:12d-276`, `test:12d-276` steps
- `docs/ai-agents/12d-276-reading-source-register-handoff.md` (this)

## Exact commands and local results

```
npm run typecheck:12d-276  # RAN: exit 0
npm run test:12d-276       # RAN: 11/11 pass (after one test-expectation fix)
sibling run via tsx --test # RAN: 109/109 (10 chain suites)
```

## Defects found and paid down during this story

- **(caught by the suite, fixed)** the refusing-store test asserted
  `load() === null` but the honest initial state is an EMPTY array —
  fixed the TEST (the module was right).
- **(self-caught pre-run)** a stray extra parenthesis in the
  malformed-fields test (syntax).

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation of anything, no
external fetch BY THIS MODULE, no install, no credentials. The commit
stages ONLY the files above and never touches
`services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

- The SUPERVISED READING step: the operator's AI reads a REGISTERED
  public source in-session (out-of-band, human-supervised), and the
  read text goes through prepareDocumentStories → admitReadingStories
  with the source's registered digest cited in the objective —
  closing the registered→read→ingested→admitted loop with measured
  counts (the CEO's "recycle and feed the brain" made honest).
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated).
- Rail integration for 12D-266 (BLOCKED on CEO authorization +
  credentials).
- GitHub Phase 1 lockdown (blocked on the CEO's `! gh auth login`).