# XIV Agent Runtime — Phase 2B

Governed read-only business context and human approval on top of the Phase 2A foundation. This layer does **not** replace the live Gemini Executive/Business path (`services/ai/agent-router.ts`, `POST /v1/executive/turn`).

## Intelligence loops

Sense → Understand → Predict → Decide → Execute → Measure → Learn

Diagnose → Treat → Monitor → Learn → Optimize

Phase 2B implements Sense / Understand / Diagnose plus a **proposal** step. Treat, Execute, and production writes stay human-controlled and are still refused by policy after approval.

## Architecture

```
Request
    ↓
Agent
    ↓
Context Provider
    ↓
Policy
    ↓
Tool
    ↓
Diagnostic Result
    ↓
Proposed Action
    ↓
Human Approval
    ↓
Policy Re-check
    ↓
Allowed execution OR denial
    ↓
Audit Event
```

LLM reasoning is **not** the security boundary. Human approval does **not** override policy.

## Context Provider

`BusinessContextProvider` is a replaceable read-only port:

- `getBusinessContext()`
- `getOperationalSignals()`
- `getSystemContext()`

Phase 2B ships `createPrototypeContextProvider()`. It returns labeled sample context for Northstar Logistics. No ERP, WMS, TMS, or CRM is connected. People data is aggregate only — no individual employee monitoring.

Agents must not hardcode context. Tools read through the provider.

## Read-only governed tools

All tools still pass `evaluatePolicy()`:

- business context reader
- business health analyzer
- operations signal reader
- risk summarizer
- recommendation generator
- diagnostic summarizer
- diagnostic story builder
- health / status reader
- development health checker (Guardian)

Consequential tools remain gated:

- propose operational change → `requires_approval`, then policy still refuses execution
- human-only production change → `denied` (L5)

## Business Health / Story Engine

`buildDiagnosticStory()` returns:

- What happened
- Why it matters
- Likely causes
- Business impact
- Recommended next action
- Confidence / evidence quality
- Source labels
- Sample causal chain: Supplier variability → safety stock increase → warehouse congestion → fulfillment delay → customer complaints

Confidence is **low**. Evidence quality is **sample**. The disclaimer states that the chain is illustrative, not certain.

## Human approval flow

1. A consequential tool receives `requires_approval` and enters `awaiting_approval`.
2. Only tools with `requiresApproval: true` can enter that state.
3. A human records `approved`, `denied`, `expired`, or `cancelled`.
4. `attemptExecution()` runs only after `approved`.
5. Policy is evaluated again with `approved: true`.
6. Phase 2B still denies consequential production writes.

Approval metadata: `actionId`, `requestedAt`, `reviewedAt`, `reviewedBy`, `decision`, `reason`.

In-memory only. No new tables.

## Approval re-evaluation

Human approval is necessary but not sufficient.

- Denied / expired / cancelled actions cannot run.
- Approved actions are re-checked.
- Production high-risk writes are denied even after approval.
- L4 remains disabled.

## Audit timeline

`GovernedAction` and `GovernedAuditEvent` stay in the session store. The mobile trail shows agent, tool, status, timestamp, and reason, labeled as prototype/session history.

## Guardian

Read-only. Reports configuration presence, optional AI `/health` probe, registry health, runtime health, and validation placeholders. Does not run arbitrary commands and does not monitor continuously.

## Prototype vs live

| Live (unchanged) | Phase 2B prototype |
| --- | --- |
| Gemini Executive/Business workspace | Context provider + story engine |
| Existing Gemini approval cards | Governed approval card on Agent Command |
| Supabase agent action history | In-memory session audit |

`canAutoExecute()` remains false on the live path.

## Authority model

L0 Observe · L1 Recommend · L2 Draft · L3 Human Approval · L4 reserved · L5 Human Only

## Tests

From `services/ai`:

`npm run test:runtime`

Covers unknown agent/tool, future agent, read-only allow, consequential approval, re-evaluation, denied/expired never run, production write deny, and story source labels.
