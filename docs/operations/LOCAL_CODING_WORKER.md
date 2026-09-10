# Local Coding Worker (ASUS)

## Stack
- Cursor = editor + terminal + Git
- Ollama = local model API (`localhost:11434`)
- Aider (or OpenCode) = coding agent against Ollama
- Repo = `C:\Users\Devin\xiv-ai`

## Install Ollama (Windows)
1. Install from https://ollama.com/download
2. Confirm: `ollama --version`
3. Pull a coding model sized for ~32GB RAM (examples to evaluate, not mandates):
   - `ollama pull qwen2.5-coder:14b` (stronger, heavier)
   - `ollama pull qwen2.5-coder:7b` (safer default)
4. Smoke: `ollama run <model> "Say ready for XIV."`

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
| ChatGPT / Grok / Cursor cloud | `WAITING_PROVIDER` |
