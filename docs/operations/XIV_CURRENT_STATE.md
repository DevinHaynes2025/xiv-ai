# XIV Current State

Updated: 2026-09-09 (America/Chicago)

## Repo
- Path: `C:\Users\Devin\xiv-ai`
- Authorized tip: `xiv-v2` @ `65fa7a0688c63c5d07945ce7e7969185697b6434`
- Remotes: GitHub `DevinHaynes2025/xiv-ai`, GitLab `xiv-ai-group/xiv-ai-project`

## What is real
- `apps/mobile` — Expo ~57 multi-persona app
- `services/ai` — Node/TS AI service (port 8787); live Gemini executive turns
- `services/ai/runtime/` — governed agent runtime (policy, mesh, guardian, fabric, etc.)
- Supabase project **XIV AI** (`laxpnlnavzkjawuvzyxh`, us-east-2) — Universes, memberships, AI agent tables, RLS enabled
- Docs under `docs/` (agent-runtime, security, modules, …)

## Empty / stub
- `apps/web`, `services/api`, `packages/{database,security,ui}`
- AWS / Azure / GCP status stubs → `NOT_CONFIGURED`
- OpenAI provider id is mock-labeled only
- Local Ollama / ONNX DirectML inference **not implemented** (policy stubs only)

## Hardware (founder ASUS)
- ASUS Vivobook 18 M1807HA — ~31.3 GB RAM
- AMD Ryzen 7 260 + Radeon 780M (no NVIDIA)
- Tools present: Git, Node, Python 3.14
- Ollama: not installed (EY0-L target)
- AI service: can run locally on `:8787` when started

## Active engineering lanes
- **Local / Grok Bot:** EY0-L Coding Brain spine; silicon/offline; agents/backend
- **ChatGPT:** user stories → Cursor UI
- **Cursor cloud:** optional; prefer local worker when usage is constrained
- Recent cloud work: Agent Civilization / evidence layers (private PRs; verify in browser)

## Uncommitted local (do not mix casually)
Historical graph edits under `services/ai/runtime/historical/*` and `sec-status.ts` on working tree.

## Honest maturity
Prototype. Prefer `PROTOTYPE` / `NOT_CONFIGURED` / `WAITING_*` over false readiness.
