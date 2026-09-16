# 12D-279 — Provenance-Bound Pathway Evidence (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-bound-reading-evidence.ts` + 10
adversarial tests). **TEST RUN DISCLOSED**: `test:12d-279` (node TAP via
tsx) = **10/10 pass**; `typecheck:12d-279` (strict tsc, covering this
module, the 12D-278 bound admission, the 12D-277 binding, the
pathway-evidence bridge, the 12D-269 approval link, the 12D-264
ledger, the growth engine, and the queue) = **exit 0**. Full sibling
regressions (single tsx run): **150/150** across 13 chain suites
(through the reading chain, bound admission, approval ledgers, pathway
ledger, approval link, story queue, shared admission). Shell build
(Next.js 16.3.5): compiled + typechecked (unchanged tree — this rung
is RUNTIME-ONLY, `shellDatabaseFree`; NO shell surface by design — a
browser-reachable door over the queue-backed bridge would be the
12D-273 class of mistake). CI IS NOT CLAIMED PASSED
(`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review). GROK_XAI
review PENDING — never fabricated.

## What this rung is

The pathway-evidence expansion for the 12D-264 ledger: the READING
chain can now feed the brain's evidence ledger WITH its provenance
intact. `prepareBoundReadingPathwayEvidence(queue, bound, request)`
takes a reviewed DONE chunk story of a REAL 12D-278
BOUND_READING_ADMITTED result and prepares a pathway candidate whose
evidenceRefs carry the reading's provenance:

- `reading-register-entry-sha256:<sourceEntryDigestSha256>`
- `reading-source:<sourceId>`
- `reading-document-sha256:<documentDigestSha256>`

— so a ledgered pathway candidate traces back, ref by ref, to a
REGISTERED PUBLIC source.

- **THE REAL CONTRACT DOES THE WORK**: the candidate is prepared by
  the existing pathway-evidence bridge (called, never
  re-implemented) — the queue's own DONE state and stored output hash
  are the truth about the outcome (a READY story refuses; a declared
  hash mismatch refuses).
- **THE STORY MUST BELONG TO THE BOUND DOCUMENT**: storyId must be one
  of the reading's own chunk stories and the tenant must match the
  binding — no other story can ride this provenance (proven: foreign
  document, malformed chunk tail, chunk 0, foreign tenant).
- **PROVENANCE IS NEVER SILENTLY DROPPED**: the enriched ref list is
  dedup'd and bounded — over the 32-ref budget the WHOLE preparation
  refuses.
- **PREPARED, NOT APPROVED, NOT LEDGERED**: this module only PREPARES
  the candidate (`humanApproved: false`); approval (12D-269) and the
  ledger append (12D-264) stay downstream and human-gated — proven
  END-TO-END in the suite: bound reading → review → evidence packet →
  12D-269 recorded approval → 12D-264 ledger, and the LEDGERED
  candidate's bytes carry the register-entry and source provenance
  refs, with the census still reporting `activated: 0`.
- **ROLLBACK IS CARRIED, NEVER DEFAULTED**: the request must carry a
  bounded rollbackRef — the growth engine's own
  `rollbackRequiredForActivation` gate refuses an eligible candidate
  without one (found by the suite; the layer now carries it through
  the real bridge rather than leaving every reading candidate
  permanently ineligible).
- Pure composition (no fs, no network, no clock, no randomness, no
  model calls); operator/runtime-side only.

## Disclosed residuals

- The 12D-278 result and its binding receipt are verified BY SHAPE
  (exact keys in order, kind and policyVersion pinned, honest flags
  re-checked); the receipt's digests are NOT re-derived here —
  re-derivation happened at bind/admit time behind the
  12D-276/277/278 doors; this layer carries provenance, it does not
  re-prove it.
- The evidence-text trust point is unchanged (human-supervised reading
  remains where the text's origin is trusted).
- This layer accepts no parentPathwayId (the inner bridge supports it;
  a future rung can add it with its own gate).

## Exact files

- `services/ai/runtime/offline-team/xiv-bound-reading-evidence.ts`
  (new)
- `services/ai/runtime/offline-team/xiv-bound-reading-evidence.test.ts`
  (new, 10 tests — provenance-carrying packet from a reviewed DONE
  chunk; END-TO-END to the 12D-264 ledger with provenance in the
  ledger bytes and `activated: 0`; belongs-to refusals (foreign doc,
  malformed/zero chunk tail, foreign tenant); READY-story and
  output-hash refusals via the REAL bridge; tampered/malformed bound
  results (wrong kind, wrong policyVersion, forged receipt kind,
  reordered keys, tampered honest flags); malformed/reordered/extra-key
  requests (+ empty rollbackRef, bad domain, non-hex64 hash, duplicate
  review refs, version 0); over-budget provenance refusal; foreign
  queue instance; determinism; guardrail/policy pins)
- `services/ai/package.json` — `test:12d-279`, `typecheck:12d-279`
- `.gitlab-ci.yml` — `typecheck:12d-279`, `test:12d-279` steps
- `docs/ai-agents/12d-279-bound-reading-evidence-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-279  # RAN: exit 0
npm run test:12d-279       # RAN: 10/10 pass
sibling run via tsx --test # RAN: 150/150 (13 chain suites)
shell npm run build        # RAN: compiled successfully (unchanged tree)
```

## Defects found and paid down during this story

- (test design, self-caught before commit) the first draft's
  end-to-end cast the 12D-279 packet into the 12D-269 approval link
  with `as never` — the link exact-keys checks the BRIDGE packet
  shape, so the test now explicitly projects the enriched candidate
  into the real bridge packet shape (the link re-checks it, never
  trusts it).
- (confirmed by the growth engine) a candidate without a rollbackRef
  is never eligible — the layer now REQUIRES a bounded rollbackRef in
  the request and carries it through the real bridge (disclosed in
  the module header).
- (test fixture, the 12D-274 lesson hit AGAIN) two short paragraphs
  greedy-pack into ONE chunk; then three 1,200-char paragraphs pack
  into THREE chunks — fixture padded and the inserted-count assertion
  aligned to the real chunker behavior (3, not 2).
- (test cleanup) the setup queue was left open, leaking a sqlite
  handle that made the temp-dir `rmSync` fail with EPERM on Windows —
  setup now closes its queue; the re-opened queue in `withQueue` is
  closed in its finally.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation of anything, no
credential use. The commit stages ONLY the files above and never
touches `services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

- A provenance VIEW of the ledgered reading evidence (operator-facing
  census showing which ledger entries trace to registered sources) —
  a shell surface is possible here (the view module would stay
  database-free, the 12D-273 lesson).
- Adopt the bound bridge as the ONLY admission door (12D-275 without a
  register retired or kept alongside) — CEO decision.
- The supervised READING/REVIEW loop with Ollama qwen2.5-coder:7b as
  first reader (loopback-only) — CEO decision (modelCalls changes
  from 0).
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated).
- Rail integration for 12D-266 (BLOCKED on CEO authorization +
  credentials).
- GitHub Phase 1 lockdown (blocked on the CEO's `! gh auth login`).