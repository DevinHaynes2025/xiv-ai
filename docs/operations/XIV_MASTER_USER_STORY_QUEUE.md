# XIV Master User Story Queue

Priority order for agents. Only the top authorized story should be in active implementation unless handoff says otherwise.

## Now
| ID | Title | Owner lane | Status |
|----|-------|------------|--------|
| **EY0-L** | Local Coding Workforce + Unified Agent Context Spine (`AGENTS.md`, Cursor rules, ops docs, Ollama/local worker, handoff protocol) | Local / Grok | IN PROGRESS |
| **EY1** | Release & Runtime Verification Gate — run tests locally, fix one root cause at a time, record evidence | Local coding agent | QUEUED |

## Next (draft)
| ID | Title | Notes |
|----|-------|-------|
| EY2 | ModelBackend Phase 0 — gemini \| openai \| ollama behind executive turns | Keep policy/approval intact |
| EY3 | Hardware capability probe (CPU/GPU/NPU/ollamaReachable) as read-only governed tool | AMD 780M honest reporting |
| US-MOB-* | ChatGPT-authored mobile stories | Land via Cursor on `apps/mobile` |

## Done / parked
| ID | Notes |
|----|-------|
| Inventory | Local monorepo + Supabase schema map complete (2026-09-09) |

## Rules
- Stories need: persona, goal, acceptance criteria, screens/routes or APIs, evidence plan.
- No story may require weakening Guardian/RLS or enabling L4.
