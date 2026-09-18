# 12D-385 — Multi-MODEL reading failover (local-only, declared, CEO-directed)

**Status:** LANDED (code + tests green; commit on `claude/12d-99-supervised-local-worker`)
**Date:** 2026-09-18 (build) / directive recorded 2026-09-19 per CEO message
**CEO basis (standing directive #2, verbatim):** "if ollama go down we need to find alternatives to keep the brain running lets have multiple llms"

## What this rung adds

12D-367 made the reading chain survive a down ENDPOINT (multi-endpoint failover, one pinned model). 12D-385 extends that to survive a down MODEL — still **local-only, loopback-only, declared-only**:

1. **`runtime/offline-team/xiv-reading-loopback-caller.ts`** (12D-289 module, extended):
   - new `buildLoopbackCallerForEndpointAndModel(endpoint, model)` — the 12D-385 shape: validates the endpoint (loopback RE, port 1..65535) AND the model name (`MODEL_NAME_RE`: 1..64 chars, starts alnum, then `alnum . _ : -`) at BUILD time, pre-request;
   - the built caller names exactly the given model and reports it back, so downstream model-identity gates stay truthful;
   - `buildLoopbackCallerForEndpoint(endpoint)` now delegates to it with the pinned policy model — behavior unchanged.

2. **`runtime/offline-team/xiv-reading-multi-model-caller.ts`** (NEW):
   - `MULTI_MODEL_READING_CALLER_POLICY` (12d-385-v1): primary = the pinned `qwen2.5-coder:7b`, `declaredFallbackModels: []` (EMPTY by default), `defaultEndpoints: ['127.0.0.1:11434']`, `maxCandidates: 8`, loopback-only, remoteCalls 0, ordered candidates, first healthy answer settles, no retry churn, all-down = honest blocker, reported model must equal declared model; honest flags pinned (`learningPromoted false`, `activated 0`, `automaticRecovery false`, `modelWeightMutation false`, `collectsNothing true`, `billionUsersProven false`, `humanDecision 'REQUIRED'`).
   - `buildMultiModelCaller(candidates)`: every candidate validated and built at BUILD time through the REAL 12D-289 module (composition — no fetch here, no network primitive, no `*_GUARDRAILS`, no new `AUTHORIZED_NETWORK_SURFACES` entry). Refusals at build: empty list, >8 candidates, duplicate `model@endpoint`, non-loopback, malformed model. At call time: empty/non-string prompt refuses; candidates tried in declared order, one request each; a model-report mismatch refuses immediately (never a settle); ALL candidates down throws an honest blocker naming every measured `model@endpoint: failure` — never a remote fallback, never automatic recovery.

3. **`runtime/offline-team/xiv-ollama-first-reader.ts`** (12D-280, extended — policyVersion `12d-280-v2`):
   - policy gains `declaredFallbackModels: []` (EMPTY — the default gate is unchanged);
   - the model-identity gate now accepts the pinned model OR a declared fallback;
   - the packet's `model` field now names the model that **ACTUALLY settled** the draft (honesty fix), not always the pinned primary.

## What this rung does NOT do (disclosed)

- **No fallback is declared into any policy.** `declaredFallbackModels` is EMPTY everywhere; the default caller is the single pinned primary — today's behavior byte-for-byte.
- **qwen2.5:3b is installed locally (1.93 GB, `ollama pull` under CEO directive #2) but is NOT yet wired into any policy.** Wiring it in is an explicit operator/CEO declaration step (census `ollama list` first, then declare). The multi-model caller makes that wiring a one-line declared list — nothing more.
- No cloud, no remote model, no deploy, no learning promotion, no weight mutation. Loopback is not remote; remoteCalls stay 0.

## Fail-closed proofs exercised by the test suite (all REAL contracts)

- `xiv-reading-multi-model-caller.test.ts` (9 tests, all green):
  1. policy pinned honest; the 12D-280 reader's fallback list mirrors the caller policy's (both EMPTY);
  2. build-time refusals: empty / duplicate / >8 / non-loopback / malformed-model — all pre-request;
  3. failover across MODELS: primary down (HTTP 500) → declared fallback `qwen2.5:3b` settles under the fallback's own model name, exactly ONE request each (no retry churn);
  4. declared order wins: primary answers, fallback sees ZERO requests;
  5. all-down honest blocker names both `model@endpoint: HTTP <code>` failures and refuses with "honestly down … never a remote fallback";
  6. default builder = single pinned primary; empty-prompt refusal verified pre-request (no live-service dependency in tests);
  7. empty/non-string prompt refuses; module source has no `fetch(`, no `node:(http|https|net|dns|dgram|tls|undici)` import, no `*_GUARDRAILS`, no `AUTHORIZED_NETWORK_SURFACES` entry;
  8. the 12D-289 module validates model names + loopback at build time;
  9. the REAL alignment audit over the offline-team runtime reports **ZERO findings**.

## Verification battery (all green)

- `npx tsc --noEmit` services/ai: 0 errors.
- `npx tsc --noEmit` apps/mobile: 0 errors.
- Full `node --test --import tsx "runtime/offline-team/*.test.ts"`: **1,520 / 1,520 pass** (1,511 before + 9 new), 152.6 s.

## Honest flags (pinned)

`humanDecision: 'REQUIRED'` · `learningPromoted: false` · `activated: 0` · `collectsNothing: true` · `automaticRecovery: false` · `billionUsersProven: false` · `remoteCalls: 0` (loopback is not remote) · measured ceiling unchanged: 2,000,000 rows.

## Next candidates

1. **Declare the first fallback (CEO-gated):** census `ollama list`, then — with explicit CEO confirmation — set `declaredFallbackModels: ['qwen2.5:3b']` in the caller policy and mirror it into the reader policy, plus a live failover proof through the REAL local endpoints.
2. Bounded CFPB structured-field extraction rung (all three CFPB layers verified: 12D-366 API, 12D-369 removals/privacy, 12D-370).
3. Optionally surface the multi-model failover posture on the mobile Verified Sources screen (12D-384 pattern).