# XIV AI — Shared Agent Constitution

## Mission
Build XIV AI as a secure, local-first, model-agnostic business intelligence, agentic AI, community, and operating platform.

## Source of truth
The repository is canonical. Chat memory is not.

Read before coding:
1. `docs/operations/XIV_CURRENT_STATE.md`
2. `docs/operations/XIV_AGENT_CONTEXT.md`
3. `docs/operations/XIV_AGENT_HANDOFF.md`

## Engineering rules
- One XIV brain, many specialized agents.
- Reuse existing modules before creating new frameworks.
- One bounded story at a time.
- One active writer per file.
- Work on child branches/worktrees only.
- Never force-push.
- Never push `main`.
- Never deploy production from an agent task.
- Never weaken Guardian, RLS, tenant, or Universe isolation.
- Never store secrets or hidden chain-of-thought.
- Never report an unrun test as PASS.

## Local-first truth
Offline-capable work may use local source, Git, tests, approved local databases, local models, and verified CPU/GPU/NPU paths.

If live web/API data is required while disconnected: `WAITING_DATA`.
If a cloud/model provider is unavailable: `WAITING_PROVIDER`.
If the machine/process is stopped: `OFFLINE_STOPPED`.

## Agent handoff
Every coding worker receives branch, base SHA, story, allowed files, acceptance criteria, tests, blockers, and return format.

Every worker returns files changed, commands run, tests PASS/FAIL/NOT_RUN, bugs, security findings, blockers, and next safe task.

## Governance
`L4_AUTONOMY_ENABLED=false`.
