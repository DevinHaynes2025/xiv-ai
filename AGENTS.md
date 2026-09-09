# XIV AI — Global Agent Constitution

## Mission
Build XIV AI as a secure, local-first, model-agnostic business intelligence,
agentic AI, community, and operating platform.

## Source of Truth
The `xiv-ai` Git repository is canonical.
Never rely on chat memory as the source of truth.

Read before coding:
1. `docs/operations/XIV_VISION.md`
2. `docs/operations/XIV_CURRENT_STATE.md`
3. `docs/operations/XIV_MASTER_USER_STORY_QUEUE.md`
4. `docs/operations/XIV_DECISION_LOG.md`
5. `docs/operations/XIV_TEST_EVIDENCE.md`

Also read when present:
- `docs/operations/XIV_AGENT_HANDOFF.md`
- `docs/operations/XIV_AGENT_CONTEXT.md`
- `docs/agent-runtime.md`

## Engineering Philosophy
One XIV brain.
Many specialized agents.
Many interchangeable models.
Many hardware targets.
One evidence system.

Do not build disconnected duplicate frameworks.

## Architecture
```
XIV Home Base
-> Agent Mesh
-> Mission / Task Graph
-> Model Router
-> Compute Router
-> CPU / GPU / NPU / simulator / authorized QPU candidate
-> Evidence
-> Feedback
-> Home Base
```

## Local First
Prefer local execution when technically suitable and policy-compatible.

Offline agents may use:
- local source code
- local Git
- local knowledge
- local models
- local CPU/GPU/NPU
- local tests
- local databases approved for development

When live internet data is required while disconnected: `WAITING_DATA`

When cloud/provider execution is unavailable: `WAITING_PROVIDER`

Never fabricate online activity.

## Model Gateway
Models are interchangeable behind XIV-owned interfaces.
Gemini, OpenAI/ChatGPT, Grok, Ollama/local, and future providers are workers — not the moat.
Do not hard-depend on one vendor in product logic.

## Two Agent Stacks (do not merge casually)
1. **Live executive turns** — `services/ai` (`POST /v1/executive/turn`, Gemini today).
2. **Governed Agent Runtime** — `services/ai/runtime/` (policy → tools → human approval → audit).

LLM output is never the security boundary. Human approval does not override policy.
`L4_AUTONOMY_ENABLED=false`.

## Governance
Never:
- push `main` automatically
- force push
- deploy production
- mutate production databases
- expand permissions
- weaken Guardian/RLS
- expose secrets
- claim tests that were not run

Every change:
`branch -> code -> test -> evidence -> review -> handoff`

## Worker Roles
| Worker | Lane |
|--------|------|
| Local coding agent (Ollama + Aider/OpenCode) | Implementation on child branches when offline/online |
| Cursor (editor) | Local workspace, Git, debug, terminal |
| Cursor cloud agents | Optional online implementation (when authorized) |
| ChatGPT | User stories, architecture review (online) |
| Grok Bot | Backend/agents/silicon coordination, research, second opinion |
| Future agents | Same repo contract via this file |

## Return Receipt (required)
Every coding agent must return:

```
TASK
FILES_CHANGED
WHY
COMMANDS_RUN
TESTS_PASSED
TESTS_FAILED
BUGS_FOUND
ARCHITECTURE_LESSONS
PERFORMANCE_EVIDENCE
SECURITY_FINDINGS
NEXT_RECOMMENDED_TASK
```

Approved lessons are written into operations docs — not hidden chat memory.

## First Objective When Unscoped
Work from the currently authorized `xiv-v2` tip on a **child branch**.
Do not redesign from scratch.
Prefer EY1 (Release & Runtime Verification Gate) after EY0-L spine exists.
