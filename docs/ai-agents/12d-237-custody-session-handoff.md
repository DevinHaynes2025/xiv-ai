# 12D-237 — Custody Session: the operator lifecycle joining 12D-233 to 12D-236 (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/custody-session.ts` + 12/12 focused tests +
strict typecheck green). CI IS NOT CLAIMED PASSED: GitLab CI remains
quota-blocked (`ci_quota_exceeded`); the `.gitlab-ci.yml` wiring was appended
but no native pipeline has executed on it. Reviewers: CLAUDE_CODE (self-review;
three live defects found and paid down — see below). GROK_XAI PENDING — never
fabricated.

## What it is

The story that closes the residual 12D-235 disclosed verbatim: "the registry
is process-local, NOT durable." A `CustodySession` joins the 12D-233
in-memory custody registry to the 12D-236 durable journal so custody state
survives a process restart, under EXPLICIT operator control with no
auto-detected ambiguity:

1. **Explicit modes only.** `openCustodySession(store, {seed, mode})` accepts
   exactly `bootstrap` or `resume`. Bootstrap is allowed ONLY when the store
   reports no journal (`load() === null` — an existing zero-op journal also
   refuses: re-seeding a live custody chain is never an accident). Resume
   requires an existing journal and replays it fail-closed through the
   12D-236 gates under the SAME seed. An absent journal without
   `bootstrap:true` refuses; an existing journal with `bootstrap:true`
   refuses. There is no `'auto'`.
2. **Restart continuity, regression-tested**: a consumed receipt stays
   consumed across a restart (a replayed authenticate refuses with the
   registry's own `already consumed` gate); an unconsumed receipt still
   authenticates with its original issuance record intact; a third
   generation sees everything (bootstrap → restart → resume → restart).
3. **Wrong seed refuses.** The journal's chain root IS the seed, so resuming
   under a different seed fails the digest chain, not a lookup.
4. **`apply()` is apply-first** (carried from 12D-236): the registry call
   happens FIRST — a refused op (replay, cross-purpose) journals nothing and
   does not advance the session op count. An authenticate returns the
   consumption proof (`consumedAtMs`) in addition to the record.
5. **`verifyCustodySession(session, store, seed)`** is a read-only health
   check: the registry ledger verifies, the journal still replays, and the
   two agree on op count. A tampered journal, a stale journal, or a wrong
   seed refuses here too.
6. **Additive 12D-236 change**: `appendCustodyOp` now also returns the
   consumption proof for authenticate ops (`consumed?: {receiptSha256,
   purpose, consumedAtMs}`) instead of discarding it — backward compatible;
   the 12D-236 suite (13/13) and the 12D-233 suite (13/13) both re-ran green
   after the change.

The disclosed residuals carry over verbatim from 12D-233/236: the seed is
re-provided by the operator out of band; possession of journal + seed is full
custody control (the session authenticates the CHAIN, not the operator);
registration is not issuance proof; one process per journal file
(single-writer discipline). `humanDecision: 'REQUIRED'`,
`learningPromoted: false`, `remoteCalls: 0`, `billionUsersProven: false` on
every surface.

## Defects found and paid down during this story

- **(self-review, caught by strict tsc before commit):** the first draft of
  `verifyCustodySession` scraped the seed out of the session through a
  private-field probe that could only ever throw — replaced with an explicit
  `seed` parameter the operator re-provides, exactly as at open time.
- **(self-review, caught by the suite):** `resume` returned a frozen static
  `ops` that never counted post-restart applies — both branches now share a
  live counter, so `verifyCustodySession`'s op-count agreement check is
  meaningful for resumed sessions too.
- **(fixture, and it pinned real semantics):** the in-memory test store
  returned `[]` for a fresh store, which is TRUTHY — bootstrap's
  refuse-over-existing-journal gate correctly fired on it. The fixture was
  corrected to model absence as `null` per the store contract; the module's
  semantics are now pinned by tests: `null` = no journal (bootstrap ok),
  `[]` = an existing zero-op journal (bootstrap refused).
- **(12D-236 module gap, surfaced by the session tests):** `appendCustodyOp`
  computed the authenticate result and threw it away (`void consumed`), so a
  caller could not see WHEN a receipt was consumed. Fixed additively (see 6
  above); both 12D-236/233 suites re-ran green.

## Exact files

- `services/ai/runtime/offline-team/custody-session.ts` (new)
- `services/ai/runtime/offline-team/custody-session.test.ts` (new, 12 tests)
- `services/ai/runtime/offline-team/operator-custody-journal.ts`
  (additive: consumption proof returned)
- `services/ai/package.json` (`test:12d-237`, `typecheck:12d-237`)
- `.gitlab-ci.yml` (`typecheck:12d-237`, `test:12d-237` appended)
- `docs/ai-agents/12d-237-custody-session-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-237      # 12/12 pass, exit 0
npm run typecheck:12d-237 # exit 0 (strict)
npm run test:12d-236      # 13/13 pass (post additive change), exit 0
npm run test:12d-233      # 13/13 pass, exit 0
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no traffic shifting, no
production mutation, no merge, no deployment, no learning promotion, no
Ollama/provider invocation occurred in this story. The commit stages ONLY the
six files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Unrelated note (recorded, not acted on)

Mid-story the CEO sent a resource batch (pdf.ai API endpoints, Stirling PDF
and other .lnk launchers, a Grammarly installer .exe, Expo/EAS build
instructions, public GitHub repos). Per fail-closed standing rules NOTHING
was executed, installed, or called: no `.lnk`/`.exe` launches, no third-party
API calls, no `npm install -g eas-cli`, no Expo/EAS builds — each requires
explicit CEO authorization. The public GitHub repos (Stirling-PDF,
huridocs/pdf-document-layout-analysis, orchestra-research/AI-research-SKILLs,
facebookresearch) are recorded as candidate open-source references for
future resource-ingest stories.