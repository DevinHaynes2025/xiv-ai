# Local Coding Worker (ASUS)

## Stack
- Cursor = editor + terminal + Git
- Ollama = local model API (`localhost:11434`)
- Aider (or OpenCode) = coding agent against Ollama
- Repo = `C:\Users\Devin\xiv-ai`
- XIV AI service = `services/ai` heartbeat + smoke routes (port 8787)

## Install Ollama (Windows)
1. Install from https://ollama.com/download
2. Confirm: `ollama --version`
3. Pull a coding model sized for ~32GB RAM (examples to evaluate, not mandates):
   - `ollama pull qwen2.5-coder:14b` (stronger, heavier)
   - `ollama pull qwen2.5-coder:7b` (safer default)
4. Smoke: `ollama run <model> "Say ready for XIV."`

## XIV local-worker HTTP contract (62L-EZ)
Provider-neutral module: `services/ai/local-coding-worker.ts`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/local-worker/heartbeat` | Ollama version/tags reachability, model id, requested vs actual device, connectivity, computed `offlineAgentVerified` |
| POST | `/v1/local-worker/smoke` | Bounded generate smoke; returns task receipt + refreshed heartbeat |

Truth states used: `UNKNOWN` | `DOCUMENTED` | `DETECTED` | `SUPPORTED` | `VERIFIED` | `NOT_TESTED` | `DEGRADED` | `UNAVAILABLE`.

### Heartbeat fields (summary)
- `connectivity`: `online` | `offline` (from `/api/tags`)
- `ollamaVersion` / `ollamaVersionState`
- `modelId`, `modelPresent`, `modelState`, `availableModels`
- `requestedDevice` (env `XIV_REQUESTED_DEVICE` / `OLLAMA_GPU_DEVICE` / `auto`)
- `actualDevice` / `actualDeviceState` — honest `UNKNOWN` / `NOT_TESTED` unless host sets `XIV_ACTUAL_DEVICE*`
- `lastSmoke`: in-process last smoke receipt (null until smoke runs)
- `offlineAgentVerified`: **computed**, never a static `true` constant
- `offlineAgentVerifiedReason`: human-readable why

### Task receipt fields
- `model`, `runtime` (`ollama`), `latencyMs`, `memory` (os total/free when available)
- `result`: `ok` | `error` | `unavailable`
- `promptPreview` / `responsePreview` (bounded)
- `timestamp`, device fields mirrored from heartbeat honesty rules

### OFFLINE_AGENT_VERIFIED policy
`offlineAgentVerified === true` only when **all** of:
1. `/api/tags` reachable
2. configured model present in tags
3. a smoke receipt in this process with `result === 'ok'`

Do **not** set `OFFLINE_AGENT_VERIFIED=true` in `.env` or source as a claim without that evidence. Prefer the live computed flag from heartbeat/smoke responses. GPU acceleration remains `NOT_TESTED` / `UNKNOWN` until a device probe proves otherwise.

Example:
```powershell
cd C:\Users\Devin\xiv-ai\services\ai
npm start
# other terminal:
Invoke-RestMethod http://127.0.0.1:8787/v1/local-worker/heartbeat
Invoke-RestMethod -Method POST http://127.0.0.1:8787/v1/local-worker/smoke
```

## Aider against Ollama
```powershell
python -m pip install aider-install
aider-install
cd C:\Users\Devin\xiv-ai
aider --model ollama_chat/<your-local-model>
```

First prompt to the local agent: read `AGENTS.md` and `docs/operations/XIV_AGENT_CONTEXT.md`; you are XIV Local Engineering Agent; child branch; story EY1 after EY0-L merges; never push main; L4 false.

## Offline matrix
| Capability | Offline |
|------------|---------|
| Git / Cursor editor / Node tests / local DB | works |
| Ollama + local agent | works when installed |
| XIV `/v1/local-worker/*` | works when AI service + Ollama up |
| ChatGPT / Grok / Cursor cloud | `WAITING_PROVIDER` |