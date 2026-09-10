# XIV Current State

Updated: 2026-09-09 (America/Chicago)

## Repo
- Path: `C:\Users\Devin\xiv-ai`
- Authorized tip: branch `cursor/ey0-l-local-coding-brain` (from xiv-v2) @ `87dfb54d0182da8813446d0aa9fcacc970281cdb`
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
- Local Ollama worker heartbeat/smoke implemented (`services/ai/local-coding-worker.ts`); ONNX DirectML still not implemented; GPU accel NOT_TESTED

## Hardware (founder ASUS)
- ASUS Vivobook 18 M1807HA — ~31.3 GB RAM
- AMD Ryzen 7 260 + Radeon 780M (no NVIDIA)
- Tools present: Git, Node, Python 3.14
- Ollama: installed 0.33.3; model qwen2.5-coder:7b DETECTED
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


## 2026-09-09 evening
- EY0-L spine on GitHub branch
- Ollama qwen2.5-coder:7b ready
- EY1 test:runtime passed (exit 0)
- Detailed stories in XIV_USER_STORIES_DETAILED.md


## 62L-EZ / GitHub #175 checkpoint (2026-09-09 20:08 CT)

### Git synchronization (REQUIRED)
- LOCAL_SHA: `60986682f7a6913def6da08499388aecd4acea4a`
- GITHUB_XIV_V2_SHA: `60986682f7a6913def6da08499388aecd4acea4a`
- GITLAB_XIV_V2_SHA: `60986682f7a6913def6da08499388aecd4acea4a` (ff-only push `1c82e0c1..60986682`; no force)
- TREE: CLEAN on `xiv-v2` after sync
- Child branch for this story: `grok/62l-ez-shared-agent-context` (base `xiv-v2` @ 60986682)
- Prior Grok lane retained at `cursor/ey0-l-local-coding-brain` (US-EXE-01/02 etc.); not merged yet

### AMD / Ollama truth states
| Resource | State | Evidence |
|----------|-------|----------|
| CPU AMD Ryzen 7 260 (8c/16t) | DETECTED | Win32_Processor |
| GPU AMD Radeon 780M | DETECTED | Win32_VideoController; AdapterRAM report 512MB aperture (iGPU); Driver 32.0.22024.3004 |
| NPU | UNKNOWN | Not probed; do not claim VERIFIED |
| RAM | DETECTED ~31.3 GB | Win32_OperatingSystem |
| Ollama runtime | DETECTED 0.33.3 | `ollama --version` |
| Model qwen2.5-coder:7b | DETECTED | `ollama list` + `/api/tags` |
| Local generate smoke | VERIFIED (runtime) | `/api/generate` prompt Reply OK → `OK`; wall ~9004ms; eval_count=2 |
| GPU device used by Ollama | NOT_TESTED / UNKNOWN | Receipt does not yet prove Vulkan/DirectML device; treat as local runtime VERIFIED, GPU path still NOT_TESTED for acceleration |

### Shared agent brain
Canonical files landed on this child branch from `origin/cursor/ey0-l-local-coding-brain` for #175 acceptance item 1.


## 62L-EZ local coding worker (2026-09-09 20:14 CT)
- Module: `services/ai/local-coding-worker.ts`
- Routes: `GET /v1/local-worker/heartbeat`, `POST /v1/local-worker/smoke`
- Live smoke vs `127.0.0.1:11434`: receipt ok (~6.5s); `offlineAgentVerified` **true** only after heartbeat+smoke succeed (computed flag)
- Pre-smoke heartbeat correctly returned `offlineAgentVerified=false`
- actualDevice remains `UNKNOWN` / `NOT_TESTED` (honest; no fabricated GPU VERIFIED)
- Docs: `LOCAL_CODING_WORKER.md` contract updated
