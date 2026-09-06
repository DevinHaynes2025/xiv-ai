# XIV Agent Runtime — Phase 2C

Governed Agent Runtime with a trusted Guardian validation runner and reusable Business Health intelligence. This layer does **not** replace the live Gemini Executive/Business path (`services/ai/agent-router.ts`, `POST /v1/executive/turn`).

Governed Runtime ≠ Live Gemini Executive turn path.

## Intelligence loops

Sense → Understand → Predict → Decide → Execute → Measure → Learn

Diagnose → Treat → Monitor → Learn → Optimize

Phase 2C deepens Sense / Understand / Diagnose. Treat, Execute, and production writes stay human-controlled and are still refused by policy after approval.

## Architecture

```
Request
    ↓
Agent Registry
    ↓
Context Provider
    ↓
Policy Engine
    ↓
Tool Gateway
    ↓
Diagnostic Result / Health Report
    ↓
Proposed Action
    ↓
Human Approval
    ↓
Policy Re-check
    ↓
Allowed observation OR denial
    ↓
Audit Event
```

LLM reasoning is **not** the security boundary and is **not** the validation authority.

Human approval does **not** override policy.

Business Health hypotheses are **not** facts.

Guardian does **not** execute arbitrary commands.

## Context Provider

`BusinessContextProvider` is a replaceable read-only port:

- `getBusinessContext()`
- `getOperationalSignals()`
- `getSystemContext()`
- `getBusinessHealthReport()`

`createPrototypeContextProvider()` returns labeled sample context for Northstar Logistics. No ERP, WMS, TMS, or CRM is connected. People data is aggregate only.

See [business-health.md](./business-health.md).

## Read-only governed tools

All tools still pass `evaluatePolicy()`:

- business context reader
- business health analyzer
- operations signal reader
- risk summarizer
- recommendation generator
- diagnostic summarizer
- diagnostic story builder
- business health report
- health / status reader
- development health checker (Guardian — does not invoke the host runner)

Consequential tools remain gated:

- propose operational change → `requires_approval`, then policy still refuses execution
- human-only production change → `denied` (L5)

## Guardian

See [guardian.md](./guardian.md).

```
Check Registry
    ↓
Trusted Runner (check ID only)
    ↓
Static executable / args / cwd
    ↓
Timeout
    ↓
Exit code
    ↓
Parser
    ↓
Health result
    ↓
Audit / UI
```

`runGuardianCheck(id)` accepts a registered ID only. There is no `exec(command)` API.

On device: in-process + injected `/health` only. Host-process checks stay on `npm run guardian:validate`.

## Business Health / Story Engine

See [business-health.md](./business-health.md).

```
Context Provider
    ↓
Domain signals
    ↓
Findings
    ↓
Story Engine
    ↓
Business Health Report
    ↓
Agent recommendation
    ↓
Human approval if consequential
```

Findings cover supply_chain, operations, inventory, warehouse, customer, finance, security, people, and technology.

Story beats are labeled `observed` | `inferred` | `hypothesized` | `recommended`. Hypotheses are not facts.

`toStructuredHealthResult()` reuses the existing structured-result card for presentation only.

## Human approval flow

1. A consequential tool receives `requires_approval` and enters `awaiting_approval`.
2. Only tools with `requiresApproval: true` can enter that state.
3. A human records `approved`, `denied`, `expired`, or `cancelled`.
4. `attemptExecution()` runs only after `approved`.
5. Policy is evaluated again with `approved: true`.
6. Consequential production writes remain denied.

Approval metadata: `actionId`, `requestedAt`, `reviewedAt`, `reviewedBy`, `decision`, `reason`.

In-memory only. No new tables.

## Approval re-evaluation

Human approval is necessary but not sufficient.

- Denied / expired / cancelled actions cannot run.
- Approved actions are re-checked.
- Production high-risk writes are denied even after approval.
- L4 remains disabled (`boundedAutonomyEnabled()` is always false).

## Audit timeline

`GovernedAction` and `GovernedAuditEvent` stay in the session store. The mobile trail shows agent, tool, status, timestamp, and reason, labeled as prototype/session history.

## Prototype vs live

| Live (unchanged) | Phase 2C prototype |
| --- | --- |
| Gemini Executive/Business workspace | Context provider + story engine + health report |
| Existing Gemini approval cards | Governed approval card on Agent Command |
| Supabase agent action history | In-memory session audit |
| — | Trusted host Guardian runner (`guardian:validate`) |

`canAutoExecute()` remains false on the live path.

## Authority model

L0 Observe · L1 Recommend · L2 Draft · L3 Human Approval · L4 reserved · L5 Human Only

## Tests

From `services/ai`:

`npm run test:runtime`

Covers Phase 2A/2B policy cases plus Phase 2C: valid/unknown/raw Guardian IDs, parser exit codes, timeout, truncation, no env leakage, prototype labels, hypothesized stance, executive summary cannot write production, and L4 disabled.

Host validation (optional, trusted machine only):

`npm run guardian:validate`
