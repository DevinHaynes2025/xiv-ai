# 12D-260 — FastAPI Local LLM Bridge (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/xiv-backend/xiv_local_llm_bridge.py` + 20 adversarial tests +
`xiv_local_llm_bridge_app.py` FastAPI wiring). **TEST RUN DISCLOSED**:
`test:12d-260` (stdlib unittest) = **20/20 pass, first run**;
`typecheck:12d-260` (py_compile) = **exit 0**; sibling regression
`test:12d-257` (full backend discover) = **37/37 pass** (17 prior + 20
new). CI IS NOT CLAIMED PASSED (`ci_quota_exceeded`). Reviewers:
CLAUDE_CODE (self-review below). GROK_XAI review PENDING — never
fabricated.

## What it is

The bridge the CEO specified: the XIV OS backend talks to a LOCAL
inference engine (Ollama at localhost:11434 — CEO's explicit answer) and
**fails closed with a clean 503 SECURE_SERVICE_UNAVAILABLE when the local
model is offline or unreachable — never a cloud fallback**. There is no
cloud path in the module at all; a refusal is the product.

## What was actually run (REAL receipts, live engine)

Ollama 0.34.0 verified installed AND live before anything was claimed
(`GET /api/version` → `{"version":"0.34.0"}`; `GET /api/tags` → one
locally-pulled model `qwen2.5-coder:7b`, Q4_K_M, 32k context — **no model
was downloaded**). Then the app was started locally (`python -m uvicorn
xiv_local_llm_bridge_app:app --host 127.0.0.1 --port 8614`) and:

- `GET /api/bridge/health` → **200** `{"status":"LOCAL_MODEL_REACHABLE",
  "engine":"ollama","engineVersion":"0.34.0", ...guardrails}` (REAL RUN)
- `POST /api/bridge/generate` (prompt "Reply with exactly this line and
  nothing else: LOCAL BRIDGE OK", model qwen2.5-coder:7b) → **200**
  `{"policyVersion":"12d-260-v1", "text":"LOCAL BRIDGE OK", ...}` — a
  REAL end-to-end local completion (REAL RUN)
- `POST /api/bridge/generate` with model `no-such-model:latest` → **503**
  `{"detail":{"error":"SECURE_SERVICE_UNAVAILABLE","reason":"local
  engine returned status 404; fail closed"}}` — the fail-closed path,
  verified LIVE (REAL RUN)
- `POST` with empty prompt → **422** (pydantic validation — honest
  client-side refusal) (REAL RUN)
- Smoke server STOPPED after the runs (PID killed, port re-probed →
  connection refused).

## Architecture

- `xiv_local_llm_bridge.py` — **pure stdlib** contract (CI's
  python:3.12-slim installs nothing, and the full contract is testable
  there): `is_localhost_base_url` (scheme http, host localhost/127.0.0.1/
  [::1] only — the bridge cannot even be built pointed outward),
  `build_generate_request` (exact body keys, `stream: False`, prompt
  ≤ 8192 chars, model regex, timeout ≤ 3600s), `parse_generate_response`
  (well-formed completed response or ValueError),
  `perform_local_completion` (INJECTED transport; any failure → frozen
  REFUSED outcome; never retries, never falls back, never raises),
  `probe_local_engine` (one-shot liveness, never raises).
- `xiv_local_llm_bridge_app.py` — FastAPI wiring (imports fastapi/httpx;
  NEVER imported by tests): `make_transport` refuses any non-localhost
  base URL at construction; `POST /api/bridge/generate` maps COMPLETED→200,
  REFUSED→503 SECURE_SERVICE_UNAVAILABLE; `GET /api/bridge/health` maps
  UNREACHABLE→503.

## The honest boundary

- localhost IS the local plane (no DNS, no internet egress,
  `remoteCalls: 0`); the bridge calls nothing but 127.0.0.1.
- **The bridge authenticates the CHANNEL, not the model**: a locally
  running engine answering confidently is still just a model — its
  output is a proposal for human review (`modelOutputIsProposalOnly`),
  never a decision. humanDecision: REQUIRED.
- No prompt persistence: forwarded and discarded; no history, no logs,
  no telemetry (`collectsNothing`, `noPromptPersistence`).
- `learningPromoted: false`, `automaticRecovery: false`,
  `billionUsersProven: false`.
- Residual (disclosed): localhost transit is trusted on this machine
  only — anything that can read localhost:11434 traffic on this host can
  observe prompts. Single-operator device discipline.

## Tests (20, all first-run green)

localhost gate (local URLs pass / 12 non-local shapes refuse); request
builder (exact body, bad prompts/models/timeouts); payload parser (happy
+ 8 malformed shapes); completions via injected transport (happy,
ConnectionError, TimeoutError, non-200, malformed payload, bad prompt
never touching the engine, honest guardrails on the outcome); probe
(reachable + 3 unreachable variants); policy/guardrail pins.

## Exact files

- `services/xiv-backend/xiv_local_llm_bridge.py` (new, pure stdlib)
- `services/xiv-backend/test_xiv_local_llm_bridge.py` (new, 20 tests)
- `services/xiv-backend/xiv_local_llm_bridge_app.py` (new, runtime only)
- `services/ai/package.json` — `test:12d-260`, `typecheck:12d-260`
- `.gitlab-ci.yml` — `typecheck:12d-260`, `test:12d-260` steps
- `docs/ai-agents/12d-260-local-llm-bridge-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-260  # RAN: exit 0
npm run test:12d-260       # RAN: 20/20 pass
npm run test:12d-257       # RAN: 37/37 pass (sibling regression)
# live smoke against Ollama 0.34.0: health 200, generate 200
# ("LOCAL BRIDGE OK"), unknown-model 503 SECURE_SERVICE_UNAVAILABLE
```

## Approval status

Installs were explicitly authorized by the CEO (httpx this session;
fastapi/uvicorn under the earlier authorization AFTER reviewing the
installed-package list — nothing was installed beyond the three). No
provisioning, no merge, no deployment, no model download, no cloud call.
The commit stages ONLY the files above and never touches
`services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

12D-261 (shipped alongside as a requirements-only document): iris-
recognition unlock integration requirements — DECLARED NOT PROVEN,
opt-in, active-gaze only, camera-off guarantee, biometrics unlock but
custody decides. Future: the pure unlock-gate contract (12D-240
pattern), the 12D-258 arena-verdict rendering surface, and the open
12D-243/12D-245 operator questions. GitHub Phase 1 lockdown remains
blocked on the CEO's `! gh auth login`.