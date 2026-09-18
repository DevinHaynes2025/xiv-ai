# 12D-368 — Brain Health screen (premium frontend for the failover rung)

**Story rung:** 12D-368 (frontend rung — CEO-directed premium
experience + multi-LLM directive) · **Parents:** 12D-367 ·
**Policy footprint:** none added

## What this rung is

`WorkspaceBrainHealth` (`apps/mobile/src/screens/workspace/index.tsx`)
+ its page (`apps/mobile/src/app/business/brain-health.tsx`) + the
`'brain-health'` route registered in the business layout's hidden
list. The screen renders the 12D-367 failover contract in the app:

- **Primary reasoner** — Ollama qwen2.5-coder:7b at 127.0.0.1:11434;
  the pin survives failover (every candidate serves the same model,
  the first reader's model-identity gate unchanged).
- **Failover (12D-367)** — ordered, declared, distinct, capped
  loopback endpoints; first healthy answer settles; no retry churn;
  adding an endpoint is a declared build-time choice.
- **All-down** — every measured failure named honestly; no automatic
  recovery; no cloud fallback (remoteCalls 0); the 12D-288 operator
  recovery door stays.
- **Multi-model** — a different local model is a separate CEO-gated
  policy change, never a side effect of failover.
- Honest-flag pill: humanDecision REQUIRED · learningPromoted false ·
  activated 0 · remoteCalls 0 · loopback only.
- The app never fabricates live counts — this screen renders the
  discipline (12D-364 idiom).

## Measured

- apps/mobile `npx tsc --noEmit` clean.

## Next candidates

1. Landing: 12D-355 → 356 → 357 → 358 → 359 → 360 → 361 → 362 → 363
   (9 prepared commits) + 12D-366 + 12D-367 + this rung (HEAD
   b996dd82).
2. 12D-340 apply execution — CEO-approved; classifier-gate blocked.
3. CEO-gated multi-MODEL rung (12D-367 handoff candidate): declared
   candidate-model list in the first-reader policy + locally
   installed models (census `ollama list` first), loopback-only.
4. Bounded CFPB extraction rung (CEO-gated, 12D-366 contract ready).