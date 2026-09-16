# 12D-283 — Supervised Reading Cycle (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-supervised-reading-cycle.ts` +
10 adversarial tests). **TEST RUN DISCLOSED**: `test:12d-283` = **10/10
pass**; `typecheck:12d-283` (strict tsc over the cycle chain: this
module, 12D-280 first reader, 12D-274 ingest, 12D-278 bound admission,
12D-277 binding, 12D-276 register, queue) = **exit 0**. Sibling chain
regression (single tsx run): **129/129 across 13 chain suites**. Shell
build: compiled (RUNTIME-ONLY rung — the cycle is operator/runtime-side
and is NEVER imported by the story shell; the 12D-273 lesson: a
shell-reachable door over the queue is a vulnerability). **CI IS NOT
CLAIMED PASSED** (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE
(self-review). GROK_XAI review PENDING — never fabricated.

## What this rung is

The 12D-282 handoff's "standing supervised read→first-read→review
loop" candidate, built as a FAIL-CLOSED CONTRACT rather than a daemon:
`runSupervisedReadingCycle(queue, registerStore, registerGenesis,
submission, caller)`. The loop is the OPERATOR re-invoking this door;
each invocation advances the reading chain EXACTLY ONE chunk of ONE
document and then STOPS before review.

One invocation, all through the REAL contracts (never re-implemented):
(1) the REAL 12D-274 ingest prepares the document (credential-shaped
content refuses; the digest is the contract's own); (2) the REAL
12D-277/278 bound admission binds to an ALREADY-REGISTERED source (the
door never registers a source) and admits the chunk stories through
the REAL 12D-275 door; (3) the queue is the truth about what to read —
the first READY story is read by the REAL 12D-280 first reader (its
own head-match, model-identity, and draft gates apply); (4) the DRAFT
settles AWAITING_REVIEW and the cycle STOPS — review (12D-100),
recorded approval (12D-269), and the ledger (12D-264) are downstream
and never run here (`stoppedBefore` is pinned in the packet).

One invocation NEVER: reads a second chunk (`chunksPerCycle: 1` — the
remaining READY chunks stay READY for the operator's next
invocation); re-ingests a document whose stories were already admitted
(duplicates > 0 refuses — a document is read once); registers a
source; opens a database of its own; activates anything; promotes
learning; reviews its own draft; recovers a FAILED story
(`automaticRecovery: false` — recovery is the operator's 12D-100
voidLease door).

**THE DOOR NEVER THROWS**: any refusal returns an honest
`SUPERVISED_READING_CYCLE_REFUSED` packet whose reason is the real
contract's own message, with MEASURED state read back from the queue
truth — a FAILED story means the provider call happened (`modelCalls:
1`, durable failure); a still-READY story means the refusal was
pre-call (`modelCalls: 0`); no story means nothing was prepared
(`storyState: null`). Refused packets carry ZERO document text.

## Disclosed residuals

- The measured-state readback enumerates the ingest contract's
  deterministic `doc-<documentId>-chunk-<n>` story ids (capped at
  4,096 probes, break on first miss) — it reads the QUEUE's own rows,
  never guesses beyond them.
- The cycle's duplicate gate keys on the bound admission's own
  duplicates count; a document re-submitted under a DIFFERENT
  documentId is a different document to the chain (honest by
  construction — the digest differs; deduplication across renamed
  documents is downstream's business, disclosed here).
- The cycle stops before review by construction; a standing loop that
  ALSO reviews would be a separate CEO-gated rung.

## Exact files

- `services/ai/runtime/offline-team/xiv-supervised-reading-cycle.ts`
  (new)
- `services/ai/runtime/offline-team/xiv-supervised-reading-cycle.test.ts`
  (new, 10 tests — verified single-chunk cycle with queue truth and
  remainingReady; unregistered source refuses; duplicate document
  refuses; queue-head mismatch refuses with the story left READY;
  wrong-model caller settles FAILED durably with modelCalls 1; caller
  throw (ECONNREFUSED) settles FAILED durably; credential-shaped
  submission refuses pre-prepare; malformed submissions refuse and
  never throw (incl. reordered keys); held lease refuses honestly;
  determinism + policy/guardrail pins)
- `services/ai/package.json` — `test:12d-283`, `typecheck:12d-283`
- `.gitlab-ci.yml` — `typecheck:12d-283`, `test:12d-283` steps
- `docs/ai-agents/12d-283-supervised-reading-cycle-handoff.md` (this
  file)

## Exact commands and local results

```
npm run test:12d-283          # RAN: 10/10 pass
npm run typecheck:12d-283     # RAN: exit 0
sibling run via tsx --test    # RAN: 129/129 (13 chain suites)
shell npm run build           # RAN: compiled (unchanged shell tree)
```

## Defects found and paid down during this story

- (suite-caught) the first "no READY story" test pre-admitted the
  document, so the cycle's own duplicate gate refused before the READY
  check could — the suite forced the honest design question and the
  test was restructured to the genuinely reachable path (a lease held
  on a DIFFERENT document's story), which is the case an operator
  actually hits.

## Approval status

`modelCalls: 1` per verified cycle (the 12D-280 CEO approval covers
the loopback first reader), `remoteCalls: 0`, no provisioning, no
merge, no deployment, no learning promotion, no activation of
anything, no credential use. The commit stages ONLY the files above
and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

- A measured scratch run of the cycle against the REAL local Ollama
  over the CEO's GHG CSV queue (the demo already proved the pieces;
  the cycle composes them).
- Adopt the bound bridge as the ONLY admission door — CEO decision.
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated).
- Rail integration for 12D-266 (BLOCKED on CEO authorization +
  credentials).
- GitHub Phase 1 lockdown (blocked on the CEO's `! gh auth login`).