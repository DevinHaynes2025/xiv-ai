# XIV Agent Context Packet

Snapshotted: 2026-09-09

## Authorized tip
- Branch: `cursor/ey0-l-local-coding-brain`
- SHA: `87dfb54d0182da8813446d0aa9fcacc970281cdb`
- Story: EY0-L complete locally; next EY1

## Read order
1. `AGENTS.md`
2. `docs/operations/XIV_VISION.md`
3. `docs/operations/XIV_CURRENT_STATE.md`
4. `docs/operations/XIV_MASTER_USER_STORY_QUEUE.md`
5. `docs/operations/XIV_DECISION_LOG.md`
6. `docs/agent-runtime.md` (if touching agents)

## Do
- Child branch off `xiv-v2`
- Local-first; Ollama when available (`localhost:11434`)
- Return receipt block from `AGENTS.md`
- Update CURRENT_STATE / DECISION_LOG / TEST_EVIDENCE when lessons are approved

## Do not
- Redesign from scratch
- Push `main` / force push / deploy prod
- Weaken Guardian/RLS
- Enable L4
- Fabricate online data or test results

## Key paths
- Mobile: `apps/mobile/`
- AI service: `services/ai/` (`server.ts`, `gemini-provider.ts`, `model-router.ts`, `runtime/`)
- Supabase: `supabase/migrations/`
- Ops spine: `docs/operations/`

## Hardware
ASUS Vivobook 18, ~32GB RAM, AMD Ryzen 7 260 + Radeon 780M — local coding models via Ollama (no CUDA).
