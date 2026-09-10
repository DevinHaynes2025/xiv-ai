# Local Silicon (AMD / Ollama)

XIV executive turns route through `services/ai/model-backend.ts`.

## Backends
| Backend | When |
|---------|------|
| `gemini` | `MODEL_BACKEND=gemini` or `auto` with `GEMINI_API_KEY` |
| `openai` | `MODEL_BACKEND=openai` or fallback if key set |
| `ollama` | `MODEL_BACKEND=ollama` or `OFFLINE_PREFER_LOCAL=true` when reachable |

## Founder ASUS path
1. Ollama on `http://127.0.0.1:11434`
2. Model: `qwen2.5-coder:7b` (or set `OLLAMA_MODEL`)
3. GPU: AMD Radeon 780M — no CUDA; Ollama uses local runtime
4. If Ollama is down: honest `WAITING_PROVIDER` — never fabricate online activity

## Governance
Local models still pass `gateStructuredOutput` and human approval.
`L4_AUTONOMY_ENABLED=false`. Universe isolation unchanged.
