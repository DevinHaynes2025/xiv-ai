# 12D-277 — Reading Binding Contract (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-reading-binding.ts` + 9
adversarial tests; additive refactor to the 12D-276 register module).
**TEST RUN DISCLOSED**: `test:12d-277` (node TAP via tsx) = **9/9
pass**; `typecheck:12d-277` (strict tsc, covering the register, the
12D-274 ingest, and the queue) = **exit 0**. `test:12d-276` re-run
after the additive refactor: **11/11 pass** (no behavior change). Full
sibling regressions (single tsx run): **118/118** across 11 chain
suites. Shell build (Next.js 16.3.5): compiled + typechecked
(unchanged tree). CI IS NOT CLAIMED PASSED (`ci_quota_exceeded`).
Reviewers: CLAUDE_CODE (self-review). GROK_XAI review PENDING — never
fabricated.

## What this rung is

The provenance link between the 12D-276 register and the
12D-274/12D-275 ingest+admission chain: `bindReadingToSource(store,
registerGenesis, reading)` issues a frozen provenance receipt — but
ONLY if the register chain, re-derived line by line from its bytes,
actually contains that (tenantId, sourceId).

- **NO REGISTER, NO BINDING**: a reading without a registered source
  refuses — provenance is re-derived from the chain bytes, never
  taken from the caller's word (proven for empty registers, foreign
  tenants, unknown sourceIds, and truncated registers).
- **THE CHAIN IS THE PROOF**: a tampered register line refuses the
  binding (digest re-derivation); the public class is re-checked
  FROM THE CHAIN bytes — a forged non-public entry cannot bind (its
  digest won't re-derive).
- **EVIDENCE, NEVER A COMMAND**: the binding reads, ingests, admits,
  and activates NOTHING. It is the operator's provenance receipt —
  carried alongside the 12D-275 admission, together tracing a reading
  from a registered public source to claimable queue rows (proven
  end-to-end in the suite: register → bind → ingest → REAL admission).
- Deterministic; pure (no fs, no network, no clock, no randomness,
  no model calls); the store is injected (the 12D-236 pattern).

## Additive refactor to the 12D-276 module (disclosed)

`readSourceRegisterEntries(store, genesis)` — an exported read-only,
chain-validating iterator — was factored out of the census; the
census now walks it (same behavior, re-proven by the 12D-276 suite).
The binding contract walks the same iterator. Nothing else in the
register module changed.

## The honest boundary

- The binding proves the source was REGISTERED and re-states the
  document digest the operator declared; it cannot prove, by bytes
  alone, that the ingested text was truly fetched from that URL — the
  human-supervised reading step remains the trust point (disclosed;
  the queue's fingerprint discipline still binds the admitted story
  bytes).
- Making 12D-275 admission REQUIRE a matching binding is the next
  candidate — disclosed, not assumed here.
- Zero bindings issued in production; zero real user stories ever
  claimed; `billionUsersProven: false`; `learningPromoted: false`;
  `automaticRecovery: false`; `modelCalls: 0`, `remoteCalls: 0`,
  `collectsNothing: true` — pinned and frozen.

## Exact files

- `services/ai/runtime/offline-team/xiv-reading-binding.ts` (new)
- `services/ai/runtime/offline-team/xiv-reading-binding.test.ts`
  (new, 9 tests — bind+receipt; unregistered refusals (empty store,
  foreign tenant, unknown source); tampered-register refusals
  (string-tamper + truncation); forged non-public entry refusal;
  exact-keys gates incl. reordering/extras/missing + malformed;
  identity/digest validation; determinism; END-TO-END register →
  bind → ingest → REAL admission; guardrail/policy pins)
- `services/ai/runtime/offline-team/xiv-reading-source-register.ts`
  (additive: exported `readSourceRegisterEntries`, census refactored
  to walk it — behavior unchanged, 12D-276 suite re-run green)
- `services/ai/package.json` — `test:12d-277`, `typecheck:12d-277`
- `.gitlab-ci.yml` — `typecheck:12d-277`, `test:12d-277` steps
- `docs/ai-agents/12d-277-reading-binding-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-277  # RAN: exit 0
npm run test:12d-277       # RAN: 9/9 pass
npm run test:12d-276       # RAN: 11/11 pass (refactor regression)
sibling run via tsx --test # RAN: 118/118 (11 chain suites)
shell npm run build        # RAN: compiled + typechecked
```

## Defects found and paid down during this story

- (self-caught pre-run) one stray extra parenthesis in the
  malformed-fields test (syntax) — fixed before first run.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation of anything, no
external fetch, no install, no credentials. The commit stages ONLY the
files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

- Require the BINDING at 12D-275 admission time (admission refuses a
  reading whose registered-source binding is absent or mismatched) —
  the structural completion of the provenance chain.
- The supervised READING/REVIEW loop with Ollama qwen2.5-coder:7b as
  first reader (loopback-only) — CEO decision (modelCalls changes
  from 0).
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated).
- Rail integration for 12D-266 (BLOCKED on CEO authorization +
  credentials).
- GitHub Phase 1 lockdown (blocked on the CEO's `! gh auth login`).