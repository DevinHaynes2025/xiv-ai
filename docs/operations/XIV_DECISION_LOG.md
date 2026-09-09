# XIV Decision Log

Append-only. Newest first.

## 2026-09-09 — EY0-L Local Coding Brain
- **Decision:** Development is local-first. Cursor/ChatGPT/Grok/cloud agents are interchangeable workers around one repo spine (`AGENTS.md` + `docs/operations/*`).
- **Decision:** Do not buy more Cursor Cloud Agent usage solely to keep coding; establish Ollama + local coding agent on the ASUS first.
- **Decision:** Sync agents through Git + context packets, not shared chat memory.
- **Decision:** Offline statuses: `WAITING_DATA`, `WAITING_PROVIDER` — never fabricate online activity.
- **Why:** Master plan is model-agnostic; BYOK/cloud editors are not true offline inference.

## 2026-09-09 — Lane split
- ChatGPT → user stories / mobile UI for Cursor.
- Grok Bot → agents, `services/ai`, Supabase, silicon/offline, coordination.
- Live Gemini path and governed runtime remain distinct.

## Prior product decisions (from master plan / codebase)
- Security-first Universes; agents non-principals; human approval gates.
- Stack: Expo mobile, Next.js web (future), FastAPI/Node AI, Supabase/Postgres.
- `L4_AUTONOMY_ENABLED=false`.
