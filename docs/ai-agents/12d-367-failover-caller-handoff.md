# 12D-367 — Multi-reasoner failover caller (CEO directive: keep the brain running)

**Story rung:** 12D-367 (backend rung — reading-chain resilience,
CEO-directed) · **Parents:** 12D-366 · **Policy footprint:**
READING_FAILOVER_CALLER_POLICY 12d-367-v1 (new)

## What this rung is

CEO directive 2026-09-19 (verbatim): "and if ollama go down we need to
find alternatives to keep the brain running lets have multiple llms and
kekep continue working 24/7".

The honest fail-closed mapping:
`runtime/offline-team/xiv-reading-failover-caller.ts`
(`buildFailoverLoopbackCaller`, policy 12d-367-v1).

## Contract

- **Declared candidates**: a non-empty, distinct, capped (≤ 8) ordered
  list of loopback endpoints; every entry is built at BUILD time
  through the REAL 12D-289 `buildLoopbackCallerForEndpoint`, so a
  non-loopback host or out-of-range port refuses before any request.
- **Failover is ordered selection, not recovery**: candidates tried in
  declared order; the first healthy answer settles; NO retry churn
  (exactly one request per candidate, proven by request-counting
  loopback HTTP servers). `automaticRecovery: false` is disclosed —
  all-down is an honest durable failure and the 12D-288 operator
  recovery door exists downstream.
- **All-down is honest**: the rejection names every measured failure
  ("all 2 loopback candidate(s) failed; the reading brain is honestly
  down (loopback only, never a remote fallback) — …"). A remote or
  cloud fallback is NEVER taken; `remoteCalls` stay 0.
- **The model pin survives failover**: every candidate serves the same
  pinned `qwen2.5-coder:7b`; the 12D-280 first reader's
  model-identity gate is unchanged (a candidate answering with another
  model is refused). A DIFFERENT local model (multiple LLM types) is a
  separate CEO-gated policy change — it touches the pinned modelName
  and requires the model to be installed — never a side effect here.
- **Audit stays green**: this module calls no fetch, imports no
  network primitive, declares no *_GUARDRAILS — pure composition over
  the authorized 12D-289 module, which remains the only authorized
  fetcher. No new AUTHORIZED_NETWORK_SURFACES entry needed (tested).
- **Default builder unchanged**: `buildFailoverLoopbackCallerDefault`
  = the 12D-289 pinned endpoint alone, declared in order — today's
  behavior exactly.

## Measured

- 8/8 new tests (real loopback node:http servers, never Ollama).
- Typecheck exit 0 (services/ai).
- Full offline-team regression: **1,511/1,511** (212 s) — 1,503 prior
  + 8 new.
- Operational note: adding a second Ollama instance/endpoint (e.g.
  127.0.0.1:11435) is a deployment choice; the caller accepts the
  declared list at build time. The CLI's default stays the single
  pinned endpoint until an operator declares more.

## Next candidates

1. Landing: 12D-355 → 356 → 357 → 358 → 359 → 360 → 361 → 362 → 363
   (9 prepared commits) + 12D-366 + this rung (HEAD b996dd82).
2. 12D-340 apply execution — CEO-approved; classifier-gate blocked.
3. CEO-gated multi-MODEL rung: declared candidate-model list in the
   first-reader policy + locally installed models (census `ollama
   list` first), each still loopback-only.
4. Bounded CFPB extraction rung (CEO-gated, 12D-366 contract ready).