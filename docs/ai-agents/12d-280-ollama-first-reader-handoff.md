# 12D-280 — Ollama First Reader (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-ollama-first-reader.ts` + 14
adversarial tests). **TEST RUN DISCLOSED**: `test:12d-280` (node TAP
via tsx) = **14/14 pass**; `typecheck:12d-280` (strict tsc, covering
this module, the 12D-274 ingest, the 12D-278 bound admission, the
12D-277 binding, the 12D-276 register, and the queue) = **exit 0**.
Sibling chain regressions (single tsx run): **101/101** across 11
chain suites (document ingest, reading admission, source register,
binding, bound admission, bound reading evidence, approval link,
pathway ledger, evidence bridge, growth engine, story queue). Shell
build: compiled (unchanged shell tree — this rung is RUNTIME-ONLY,
`shellDatabaseFree`; nothing in the shell imports this module — the
12D-273 lesson). **CI IS NOT CLAIMED PASSED** (`ci_quota_exceeded`).
Reviewers: CLAUDE_CODE (self-review). GROK_XAI review PENDING — never
fabricated.

## The recorded CEO decision that unlocks this rung

CEO approval, verbatim, 2026-09-16: **"approve the ollama first reader
rung, lets keep feeding the brain 24/7"**. This is the first rung where
`modelCalls` is no longer pinned 0 — the packet counts `modelCalls: 1`
per settled draft. `remoteCalls` stays **0**: 127.0.0.1:11434 is
LOOPBACK, not remote, and the module itself performs no I/O at all —
the model call goes through an INJECTED caller.

## What this rung is

The FIRST READER of the reading chain (12D-276 register → 12D-277 bind
→ 12D-274 ingest → 12D-275/278 bound admit → queue review → 12D-269 →
12D-264). Every chunk reviewed so far was read by a human-supervised
in-session reviewer. `runOllamaFirstReader(queue, bound, request,
caller)` lets the LOCAL Ollama model (qwen2.5-coder:7b) take the first
pass: it reads ONE queued chunk of a BOUND reading and settles the
model's DRAFT into the queue as `AWAITING_REVIEW` — a draft for the
human/reviewer chain, never a settlement of record.

- **THE REAL INGEST CONTRACT IS RE-RUN**: the document digest and the
  story ids are RE-DERIVED by calling the REAL `prepareDocumentStories`
  over the request's own submission fields; the re-derived digest is
  cross-gated against the 12D-277 binding receipt — if the text about
  to be sent to the model is not the bound document's text, the reader
  refuses BEFORE anything is claimed or sent (proven: tampered
  bodyText refuses pre-claim, story still READY, no lease held).
- **THE REAL CHUNKER DOES THE SLICING**: the chunk text is re-derived
  with the ingest contract's own `chunkDocument` (now additively
  exported, no behavior change) at the story's own chunk index — the
  prompt carries precisely that text, framed with the ingest
  contract's `<<<UNTRUSTED_DOCUMENT_TEXT>>>` markers.
- **THE QUEUE IS THE TRUTH ABOUT WHAT TO READ**: the reader claims the
  queue's head (`claimNext`, ownerId `ollama-first-reader`) and reads
  ONLY if the head story IS the requested story — a mismatch is
  returned unstarted (the queue's own contract limits
  `returnUnstarted` to the no-provider-invoked window) and refused;
  the head stays READY (proven).
- **MODEL IDENTITY IS GATED**: the caller's own `model` label must
  equal `qwen2.5-coder:7b`; a foreign model label refuses and the
  attempt settles FAILED durably.
- **THE DRAFT IS RE-GATED BOTH WAYS**: non-empty, ≤ 8,000 chars, and
  the ingest contract's `SECRET_CONTENT_RE` (additively exported) is
  re-applied to the model's OUTPUT — a model must never launder
  credential-shaped content into queue material.
- **LEASE HYGIENE IS CONTRACT-EXACT**: refusals BEFORE the caller is
  invoked release with `returnUnstarted` (only used in that window);
  refusals AFTER the caller was invoked — caller throw, wrong model,
  malformed result, empty/credential/over-budget draft — settle
  `FAILED` with `providerSettled: true` (durable; recovery is the
  explicit 12D-100 operator `voidLease` door; there is NEVER a silent
  retry).
- **SETTLEMENT IS DRAFT-ONLY**: `settle DRAFT → AWAITING_REVIEW`
  through the REAL queue door; `humanDecision: 'REQUIRED'` on the
  packet; `learningPromoted: false`, `modelWeightMutation: false` —
  the Ollama reader produces DRAFTS; weight-mutation learning
  promotion stays its own CEO-gated pinned approval; nothing
  activates.
- Pure composition on this side: no fs, no network, no clock, no
  randomness in the module; the only I/O in the whole rung is the
  injected loopback caller. Operator/runtime-side only.

## Disclosed residuals

- The binding receipt is verified BY SHAPE here (exact keys in order,
  kind/policyVersion pinned, honest flags re-checked, both hex64
  digests shape-checked); the receipt's digests are NOT re-derived at
  this layer — re-derivation happened behind the 12D-276/277/278
  doors. What IS re-derived here is the DOCUMENT digest against the
  re-run ingest contract — that cross-gate is the text trust point.
- The injected caller is trusted to report its model label honestly;
  the loopback-only policy (`127.0.0.1:11434` as the sole endpoint) is
  a caller-construction discipline, enforced at the injection site,
  not provable inside this module.
- A caller exception is treated as a POST-call refusal (durable
  FAILED) even when the failure was a pure connection error — the
  conservative reading, because the module cannot see whether the
  provider was actually reached. The operator `voidLease` door exists
  for recovery; disclosed rather than special-cased.
- Determinism claim covers the PROMPT (same inputs → same prompt hash,
  proven in the suite), not the model's output.

## Exact files

- `services/ai/runtime/offline-team/xiv-ollama-first-reader.ts` (new)
- `services/ai/runtime/offline-team/xiv-ollama-first-reader.test.ts`
  (new, 14 tests — happy path with recorded prompt + queue-truth
  assertions; UNTRUSTED framing + chunk-exact prompt; wrong-model
  refusal settling FAILED durably; caller-throw (ECONNREFUSED)
  settling FAILED durably; credential-shaped draft refusal; empty +
  over-budget draft refusals; malformed caller-result refusals
  (reordered/extra); digest cross-gate refusal pre-claim;
  credential-carrying submission refused at the re-run ingest gate;
  foreign story/source/tenant refusals pre-claim; queue-head
  discipline (returnUnstarted, head stays READY); malformed
  bound/request/caller refusals; determinism; guardrail/policy pins)
- `services/ai/runtime/offline-team/xiv-document-ingest.ts` — two
  ADDITIVE exports only: `chunkDocument`, `SECRET_CONTENT_RE` (no
  behavior change; the 12D-274 suite still passes)
- `services/ai/package.json` — `test:12d-280`, `typecheck:12d-280`
- `.gitlab-ci.yml` — `typecheck:12d-280`, `test:12d-280` steps
- `docs/ai-agents/12d-280-ollama-first-reader-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-280  # RAN: exit 0
npm run test:12d-280       # RAN: 14/14 pass
sibling run via tsx --test # RAN: 101/101 (11 chain suites)
shell npm run build        # RAN: compiled (unchanged shell tree)
```

## Defects found and paid down during this story

- (self-caught in the suite's first run) the module's shape gates
  pinned the 12D-278 result keys and 12D-277 receipt keys FROM MEMORY
  — the real result carries `census` and the receipt carries
  `sourceEntryDigestSha256` + honest flags instead of
  `licenseNote`/`boundAt`. The gates are now pinned to the REAL
  produced shapes; the suite caught it on the very first happy-path
  test.
- (typecheck) `unknown` narrowing through property access needed
  explicit `as string` locals after the shape gates — no behavior
  change.

## Approval status

`modelCalls: 1` per settled draft — the recorded CEO approval
(2026-09-16) of the ollama first reader rung. `remoteCalls: 0`
(loopback is not remote). No provisioning, no merge, no deployment,
no learning promotion (no weight mutation of any model), no activation
of anything, no credential use. The commit stages ONLY the files above
and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

- A measured scratch run of this reader against the REAL local Ollama
  at 127.0.0.1:11434 (loopback, disclosed; done as the rung's demo,
  never committed).
- A provenance VIEW of the ledgered reading evidence (operator-facing
  census; view module stays database-free, the 12D-273 lesson).
- Adopt the bound bridge as the ONLY admission door — CEO decision.
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated).
- Rail integration for 12D-266 (BLOCKED on CEO authorization +
  credentials).
- GitHub Phase 1 lockdown (blocked on the CEO's `! gh auth login`).