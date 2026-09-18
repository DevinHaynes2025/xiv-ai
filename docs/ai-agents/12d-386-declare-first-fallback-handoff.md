# 12D-386 — The FIRST fallback is DECLARED: qwen2.5:3b (local, loopback-only)

**Status:** LANDED (code + tests green + LIVE proof; commit on `claude/12d-99-supervised-local-worker`)
**Date:** 2026-09-18 (build)
**CEO basis (standing directive #2, verbatim):** "if ollama go down we need to find alternatives to keep the brain running lets have multiple llms"

## What this rung changes

12D-385 built the multi-MODEL failover machinery with the declared list EMPTY — wiring a fallback was disclosed as an explicit CEO-gated declaration step. This rung performs that declaration:

1. **`xiv-reading-multi-model-caller.ts`** — policy `12d-385-v1` → `12d-386-v1`:
   - `declaredFallbackModels: ['qwen2.5:3b']` (was `[]`);
   - new `buildMultiModelCallerDeclared()`: the pinned primary FIRST, then every declared fallback at the pinned default endpoint (`127.0.0.1:11434`), in declared order — the failover-ready shape directive #2 asks for. `buildMultiModelCallerDefault()` (single pinned primary) is unchanged.

2. **`xiv-ollama-first-reader.ts`** — policy `12d-280-v2` → `12d-280-v3`: the reader's model-identity gate now accepts `qwen2.5-coder:7b` OR the declared `qwen2.5:3b`; the packet's `model` field names the model that ACTUALLY settled the draft (12D-385 honesty fix, kept).

## The declaration follows the reality (never invents it)

- `qwen2.5:3b` was INSTALLED locally first (2026-09-19, `ollama pull` under CEO directive #2; census `ollama list` → `qwen2.5:3b` 1.93 GB alongside `qwen2.5-coder:7b` 4.68 GB).
- The LIVE driver (`.xiv-runtime/multi-model-live-12d-386.driver.ts`, scratch) refuses if a declared model is not installed — "the declaration names a model that does not exist; refusing (fail closed)". The declaration cannot precede the installation.

## LIVE PROOF (real local Ollama, loopback only, remoteCalls 0)

```
[census] installed models: qwen2.5:3b, qwen2.5-coder:7b
[census] every declared model is installed locally ✓
[default]  model=qwen2.5-coder:7b candidateIndex=0 response="OK"
[declared] model=qwen2.5-coder:7b candidateIndex=0 response="OK"
[fallback-direct] model=qwen2.5:3b response="OK"
```

The primary settles FIRST while healthy (candidateIndex 0 — the fallback is ordered, never preferred); the declared fallback serves when called. **Honest disclosure:** live PRIMARY-DOWN failover was NOT exercised (it would require disrupting the live brain); the failover behavior — one request per candidate, the fallback settling under its OWN model name, the all-down honest blocker — is proven by the test suite against local HTTP responders.

## Fail-closed proofs added

- `xiv-reading-multi-model-caller.test.ts`: policy pins `12d-386-v1` + the declared list; the DECLARED caller builds (its declared fallbacks are distinct, loopback, well-named) and keeps its pre-request empty-prompt refusal; declared order is structurally pinned `[qwen2.5-coder:7b, qwen2.5:3b]`; the reader policy mirrors the list and pins `12d-280-v3`.
- `xiv-ollama-first-reader.test.ts` (2 new tests): a declared-fallback draft settles under its OWN name (`packet.model === 'qwen2.5:3b'`, state AWAITING_REVIEW, honest flags pinned); an UNDECLARED model (`another-model:7b`) still refuses — declaring one fallback opens no undeclared door.

## What this rung does NOT do (disclosed)

- No cloud, no remote model, no deploy, no merge, no learning promotion, no weight mutation. Both models are loopback; `remoteCalls: 0` throughout (loopback is not remote).
- The DEFAULT caller (`buildMultiModelCallerDefault()`) is still the single pinned primary — nothing about routine reading changes; the declared shape is opt-in at the call site.
- Honest flags pinned everywhere: `humanDecision 'REQUIRED'`, `learningPromoted false`, `activated 0`, `automaticRecovery false`, `modelWeightMutation false`, `collectsNothing true`, `billionUsersProven false`. 2,000,000 rows remains the only measured ceiling.

## Verification battery (all green)

- `npx tsc --noEmit` services/ai: 0 errors; apps/mobile: 0 errors.
- Full offline-team suite: **1,523 / 1,523 pass** (1,520 + 3 new), 153.3 s.
- Live proof driver: complete, no refusals.

## Next candidates

1. Bounded CFPB structured-field extraction rung (all three CFPB layers verified: 12D-366 API, 12D-369 data.gov rights, 12D-370 removals/privacy — structured fields only).
2. Mobile Verified Sources screen: surface the multi-model failover posture (12D-384 pattern).
3. Optional: a live primary-down failover exercise in a maintenance window (never while the brain is the active reader).