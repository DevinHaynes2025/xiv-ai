# Agent Mesh

Governed agent-to-agent collaboration. Agents do not freely control each other.

## Status

| Piece | Maturity |
| --- | --- |
| Structured handoff types | IMPLEMENTED |
| Collaboration router + firewall | IMPLEMENTED |
| Loop / budget guards | IMPLEMENTED |
| Executive consultation orchestration | PROTOTYPE |
| Free-form agent bus | FORBIDDEN |
| Persistent collaboration table | PLANNED |
| Persistent Universes | BLOCKED BY SCHEMA COLLISION |
| Phase 2G-B specialists (market, international, strategy, business case, research, live intelligence, localization) | PROTOTYPE |
| AgentDebugger / circuit breakers | IMPLEMENTED (inspect / isolate only) |

## Path

```
User / system event
→ Orchestrator
→ Policy Engine
→ Agent Registry
→ Collaboration Router
→ Agent A
→ structured handoff
→ policy validation
→ Agent B
→ structured result
→ shared task state
→ evaluation
→ human approval if consequential
→ audit
```

## Forbidden

- Agent A directly calling arbitrary Agent B
- Unlimited recursive spawn
- Tool / authority / Universe bypass
- Self-escalation or permission changes
- Shell, direct DB writes, automatic L4/L5

## Patterns

Consultation, review, consensus, escalation, delegation, verification. Authority is never transferred.
