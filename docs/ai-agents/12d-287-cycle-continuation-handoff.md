# 12D-287 — Supervised Reading Cycle CONTINUATION (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`xiv-supervised-reading-cycle.ts` continuation gate + the additive
`inspectStoryObjective` queue accessor + 5-test adversarial suite +
corrected 12D-283 suite). **TEST RUN DISCLOSED**: `test:12d-287` =
**5/5 pass**; `typecheck:12d-287` (strict tsc over the continuation
suite + cycle + receipt core/door + first reader + ingest + admission +
binding + register + queue) = **exit 0**; the corrected 12D-283 suite =
**10/10**; the 12D-284 CLI suite = **5/5**. Sibling regression:
**184/184 across 19 chain suites**. Shell build: for the record (shell
tree unchanged by this rung). **CI IS NOT CLAIMED PASSED**
(`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review). GROK_XAI
review PENDING — never fabricated.

## What this rung is

The 12D-286 handoff's first candidate — "a second invocation of the
live cycle on the GHG queue's READY chunk-2" — and the DEFECT it
exposed: the 12D-283 contract refused a duplicate admission ("a
document is read once"), which made chunks 2..N of any multi-chunk
document UNREACHABLE through the operator's own loop — the contract
promised "the remaining chunks stay READY for the operator's next
invocation" while guaranteeing that invocation would refuse. This rung
pays that down:

1. **CONTINUATION GATE** (`xiv-supervised-reading-cycle.ts`): a
   duplicate admission now CONTINUES the document's reading when — and
   only when — the re-submitted bytes re-derive the SAME document
   digest the queue's own stored objective was admitted with. The gate
   reads the docRef from the queue's OWN record (the additive
   read-only `inspectStoryObjective` accessor on `offline-story-queue`)
   and never trusts the submission beyond the re-derived digest.
2. **MEASURED TRUTH (disclosed, and it is GOOD news)**: every tamper
   direction — changed bytes, changed title, shortened body — is
   refused by the 12D-275 queue door's OWN fingerprint invariant
   ("story ID content conflict"), a layer DEEPER than the gate: the
   digest lives inside the stored objective the fingerprint covers, so
   ANY byte change conflicts at the queue door before the gate runs.
   The gate stays as fail-closed defense-in-depth (the cycle never
   trusts changed bytes even if the door's invariant were ever
   relaxed); the refusal the tests assert is the queue's own.
3. **HONEST PACKET**: the verified cycle packet now carries
   `continuation: true/false` (true when this invocation continued an
   already-admitted document), and `chunks` reports the measured
   `{ prepared, inserted: 0, duplicates }` truth of a continuation.
4. **The 12D-283 suite corrected** (disclosed): its duplicate-refusal
   test and determinism test asserted the OLD behavior — rewritten to
   assert the new continuation semantics and the measured refusal
   reasons; the guardrail key `duplicateAdmissionRefuses` became
   `continuationRequiresAdmittedBytes`.

## MEASURED LIVE (scratch `.xiv-runtime/`, never committed)

Against the REAL local Ollama (qwen2.5-coder:7b, loopback
127.0.0.1:11434, `remoteCalls: 0`) on the real GHG queue
(`reading-queue-cycle-live-2026-09-16.sqlite`, chunk-1 already
AWAITING_REVIEW from the 12D-284 run):

- **Durable-failure proof (again, live)**: the first continuation
  invocation hit `ollama returned HTTP 500` — chunk-2 settled FAILED
  DURABLY (no silent retry; the call happened), and the operator's
  next invocation did NOT touch it: the loop advanced to the next
  READY story, chunk-3. Recovery stays the operator's door.
- **The continuation MEASURED**: chunk-3 read by the real model —
  `continuation: true`, `chunks { prepared: 3, inserted: 0,
  duplicates: 3 }`, `remainingReady: 0`, draftChars 407, modelCalls 1,
  remoteCalls 0, STOPPED before review (the human decision stays
  Devin's).
- **The REAL receipt**: a 12D-285 receipt built from the real draft
  text captured at the caller, digest re-derived and QUEUE-VERIFIED
  (`readyForReview: true`, storyState AWAITING_REVIEW).
- **The shell surface MEASURED end-to-end**: the receipt submission
  POSTed to a live local `next dev` shell on the NEW
  `/api/ingest/draft-receipt` route (12D-286) returned the verified
  view model — digest and metadata rendered, draft text NOT echoed.

## MEASURED registration (same scratch, same run)

The CEO's mid-turn directive (USEPA/QR_Tool, posthog, openproject,
coursera topic) registered through the REAL 12D-276 contract:
4 sources → register now 26 entries, `sourcesRead: 0` — registered ≠
read; licenses verified where known (posthog MIT, openproject
GPL-3.0-or-later noted as "verify before any reuse"), disclosed where
not (USEPA/QR_Tool). The directive's vision lines (trillions of neural
pathways, XIV AI universe of connected mini-llms/mini-servers/
mini-clouds, "superintelligent atom by atom", "training XIV agentics")
map honestly to: the pathway EVIDENCE chain (measured, ledgered-never-
activated) and the reading pipeline; weight-mutation training remains
CEO-gated; `billionUsersProven` stays false; nothing was built for
mini-clouds/mini-quantum (future design, CEO-gated).

## Exact files

- `services/ai/runtime/offline-team/xiv-supervised-reading-cycle.ts`
  (continuation gate + `continuation` field + guardrail rename)
- `services/ai/runtime/offline-team/offline-story-queue.ts` (additive
  read-only `inspectStoryObjective`)
- `services/ai/runtime/offline-team/xiv-supervised-reading-cycle-continuation.test.ts`
  (new, 5 tests)
- `services/ai/runtime/offline-team/xiv-supervised-reading-cycle.test.ts`
  (corrected to the 12D-287 contract, disclosed above)
- `services/ai/package.json` — `test:12d-287`, `typecheck:12d-287`
- `.gitlab-ci.yml` — `typecheck:12d-287`, `test:12d-287` steps
- `docs/ai-agents/12d-287-cycle-continuation-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-287          # RAN: 5/5 pass
npm run test:12d-283          # RAN: 10/10 (corrected)
npm run test:12d-284          # RAN: 5/5
npm run typecheck:12d-287     # RAN: exit 0
sibling regression (tsx)      # RAN: 184/184 (19 chain suites)
shell npm run build           # RAN: for the record (shell unchanged)
live continuation + receipt   # RAN: measured (see above)
```

## Defects found and paid down during this story

- (design defect, this rung's reason to exist) The 12D-283 "a document
  is read once" gate made chunks 2..N unreachable — the operator's own
  loop could never advance within a document. Paid down by the
  continuation gate; the sibling suite corrected.
- (suite-caught) The first `inspectStoryObjective` draft queried a
  non-existent `objective` column (the queue stores story JSON in
  `body`) — the SQLite error surfaced as honest continuation refusals
  in the suite; the accessor now parses the body JSON like the
  queue's own claim path does.
- (fixture-caught) The first tamper fixtures expected the cycle
  gate's refusal reason; MEASURED truth showed the queue door's
  fingerprint invariant refuses first ("story ID content conflict") —
  the fixtures were rewritten to assert the measured reasons, and the
  gate is disclosed as defense-in-depth.

## Approval status

The live demo used the CEO-approved Ollama first-reader rung (modelCalls
counted: 1 in the measured continuation; 1 consumed by the durable HTTP
500 failure), `remoteCalls: 0` (loopback), no provisioning, no merge,
no deployment, no learning promotion, no activation, no credential use.
The commit stages ONLY the files above and never touches
`services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

- Register the remaining CEO-named sources from the expanded directive
  (github.com/GSA, NIST detection_limits, arxiv 2403.12029,
  caltech-fish-counting, BTS, CFPB, JPL SBDB, Austin/Texas Socrata,
  SBA, NSF NCSES, archives.gov, NYC SBS) and run the supervised cycle
  on ONE of them end-to-end — the first reading of a CEO-named source.
- The GHG queue's chunk-2 sits FAILED (durable HTTP 500): operator
  recovery decision (voidLease door semantics for a settled FAILED
  story is the open question — the queue's recovery doors cover HELD
  leases; a FAILED→READY operator door may need its own rung).
- Adopt the 12D-278 bound bridge as the ONLY admission door — CEO
  decision.
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated).
- Rail integration for 12D-266 (BLOCKED on CEO authorization +
  credentials); GitHub Phase 1 lockdown (blocked on `! gh auth login`).