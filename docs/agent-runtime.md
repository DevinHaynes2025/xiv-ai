# XIV Agent Runtime — Phase 2A

Governed foundation for specialized AI agents. This layer does **not** replace the existing Gemini Executive/Business turn path (`services/ai/agent-router.ts`, `POST /v1/executive/turn`). Those remain the live, approval-bound assistants. Phase 2A adds the authority model, registries, deterministic policy, Guardian, and a prototype runtime beside them.

## Intelligence loops

XIV intelligence loop:

Sense → Understand → Predict → Decide → Execute → Measure → Learn

Business Hospital loop:

Diagnose → Treat → Monitor → Learn → Optimize

Phase 2A implements Sense / Understand / Diagnose only. Execute, Treat, and production writes stay human-controlled.

## Architecture

```
XIV Mobile
    ↓
Agent Runtime
    ↓
Agent Registry
    ↓
Policy Engine
    ↓
Tool Gateway
    ↓
Approved Tools / Business Context
    ↓
Result
    ↓
Audit Event
    ↓
Measure / Learn
```

LLM reasoning is **not** the security boundary. Policy is deterministic TypeScript. A model cannot invent a tool id, raise its own authority, or skip approval.

## Authority model

| Level | Name | Meaning in Phase 2A |
| --- | --- | --- |
| L0 | Observe | Inspect permitted context |
| L1 | Recommend | Generate recommendations |
| L2 | Draft | Prepare an artifact; cannot execute |
| L3 | Human Approval | Propose an executable action; human must approve |
| L4 | Bounded Autonomy | Reserved. Never auto-executes in this phase |
| L5 | Human Only | Agent cannot execute |

New agents default to **L0**. Domain recommenders use **L1**. Executive is **L3** so it can propose, not execute. Guardian is **L0**.

## Agent Registry

Registered agents: Executive, Supply Chain, Operations, Finance, Security, Customer Experience, Technology, Innovation, Guardian.

Statuses:

- `registered` — defined, not operational
- `prototype` — callable through the Phase 2A runtime with prototype tools only
- `available` — unused in this phase; reserved for a later live agent
- `future` — cannot invoke tools

Do not treat `prototype` as a production workforce.

## Tool Registry / Gateway

Safe Phase 2A tools:

- business context reader
- health / status reader
- recommendation generator
- diagnostic summarizer
- development health checker

Consequential tools exist only so policy can refuse them:

- propose operational change → `requires_approval`
- human-only production change → `denied`

The gateway invokes a handler only after policy returns `allowed`. There is no generic “run this tool” escape hatch.

## Policy Engine

`evaluatePolicy()` is a pure function. It checks, in order:

1. Agent identity
2. Tool identity
3. Agent status
4. Human-only / L5
5. Agent allowlist
6. Tool allowlist
7. Minimum authority
8. Environment (production blocks high-risk writes)
9. Read/write, risk, and approval flags

Results: `allowed` | `denied` | `requires_approval`, plus a human-readable reason.

## Guardian

Guardian is the development / reliability agent. It observes and diagnoses. It does **not**:

- run arbitrary shell
- auto-fix production
- monitor continuously

Checks are hardcoded in `GUARDIAN_CHECK_REGISTRY`. Command metadata is documentation for a trusted developer host. Phase 2A does not execute those commands from the runtime. Safe in-process handlers may check configuration **name presence** or accept an injected `/health` probe. Values and secrets are never returned.

## Human approval

Consequential actions become `awaiting_approval`. Phase 2A still refuses to execute them after approval. Approval is recorded so persistence can be added later.

## Audit model

`GovernedAction` and `GovernedAuditEvent` live in memory (`createMemoryAuditStore`). Shapes are persistence-ready. No new database tables in this phase.

## Existing architecture (preserved)

The Gemini path already has its own tools, allowlists, `authorizeTool()`, and approval cards. That path is unchanged. Conflicts are additive, not replacements:

- Live Gemini: `AgentType` (`executive_agent`, …) and `AgentToolId`
- Phase 2A: `XivAgentId` and `RuntimeToolId`

Both require human approval for consequential work. `canAutoExecute()` remains false on the live path.

## Policy test cases

Run from `services/ai`:

`npm run test:runtime`

1. Unauthorized agent + tool → denied
2. Read-only permitted tool + sufficient authority → allowed
3. Consequential tool → requires approval
4. L5 human-only action → denied
5. Unknown tool → denied
6. Unknown agent → denied
