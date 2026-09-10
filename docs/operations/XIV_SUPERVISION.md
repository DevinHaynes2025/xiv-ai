# XIV Supervision & Escalation Ladder

CEO Devin Xavier Haynes authorized supervised autonomous build (2026-09-09).
Agents keep working offline/online without waiting on him for ordinary steps.

## Escalation order (cheapest first)
1. **Git + ops docs** — `AGENTS.md`, `docs/operations/*`, this file, story queue, decision log, test evidence.
2. **AI team workers** — local Ollama (`qwen2.5-coder:7b`), Cursor, ChatGPT (stories/UI), Grok Bot (agents/backend), Claude, Gemini/Google as configured.
3. **Founder Twin** — in-app `WorkspaceFounderTwin` / route `executive/founder-twin`. AI representation of Devin Xavier Haynes for vision alignment and non-binding guidance. **Not the real CEO.** Twin cannot disable Guardian, grant permissions, spend money, or approve L4.
4. **Real CEO (last resort)** — only for credentials, irreversible/destructive actions, legal/compliance gates, production money/payroll writes, or true ambiguity the twin and docs cannot resolve.

## Standing rules
- `L4_AUTONOMY_ENABLED=false`
- Propose → human approve for consequential actions
- Never fabricate live metrics; use `WAITING_DATA` / `WAITING_PROVIDER`
- Salesforce deferred; see `CRM_ALTERNATIVES.md`
- Quantum = classical-first metaphors; QPU is candidate only (`XIV_COMPUTE_FABRIC.md`)
- Periodic reports: weekday morning digest + evening pulse — do not stop the build for status theater

## Offline 24/7 intent
ASUS local silicon + Ollama + `services/ai` on `:8787` + Supabase/Drive connectors when online.
If cloud tokens fail, continue local implementation and mark blocked cloud work honestly.
