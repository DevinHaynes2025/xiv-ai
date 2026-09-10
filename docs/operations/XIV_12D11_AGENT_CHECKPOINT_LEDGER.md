# XIV 12D-11 — Agent Identity + Checkpoint Ledger

**Ticket:** 12D-11  
**Branch:** `grok/12d-11-agent-checkpoint-ledger`  
**Worktree:** `C:\Users\Devin\xiv-ai-12d-ledger` (sibling)  
**Base:** `grok/12d-10-ollama-pocket-brain-ingest` @ `b0b05b6`  
**State:** research / feature branch — append-only identity+audit  
**L4 / production auto:** false

## Scope

1. **Append-only Agent Identity + Checkpoint Ledger** for each agent run (Grok / Ollama / ChatGPT / Gemini / LOCAL_RULES)
2. Fields: **XIV-Agent**, **Model**, **Story**, **Environment** (`LOCAL` | `CLOUD_SANDBOX` | `PRODUCTION` label only), **Files-Changed**, **Tests-Passed/Failed**, **Database-Migrations**, **Evidence-Hash**, **Debrief-ID**, **Confidence**
3. **NEVER** bypass Policy Gate; **NEVER** a second production control plane
4. **ChatGPT checkpoint** = read/review consumer of ledger entries — **not** authority to flip `autonomousProduction*`
5. Twin claim bans assertable; **Atomic Data Cells** may be referenced as evidence units (`atomicCellIds`)
6. Optional hooks from Story Factory **debrief** / **adaptive council** learning
7. Tests `12d11.test.ts` + prior green; docs this file

## Guardrails

| Flag | Value |
|------|-------|
| appendOnly | true |
| mutable / delete / rewrite | false |
| secondControlPlane | false |
| policyGateBypassAllowed | false |
| checkpointIsReadReviewOnly | true |
| chatgptAuthorityToFlipAutonomousProduction | false |
| autonomousProductionDDL | false |
| autonomousProductionDML | false |
| productionAutoApply / Merge / Deploy | false |
| destructiveDbAutoApply | false |
| L4_PRODUCTION_ENABLED | false |
| autonomousSecretCreation | false |
| highAutonomyTargets | LOCAL \| CLOUD_SANDBOX only |
| twinClaimBansAssertable | true |
| atomDbClaimAllowed | false |
| atomicDataCellsMayBeEvidenceUnits | true |
| VALUATION_THEATER_ALLOWED | false |

`PRODUCTION` on `environment` is an **audit label only** — it does not grant high autonomy and does not flip builder Policy Gate decisions.

## API sketch

```ts
import {
  createAgentCheckpointLedger,
  appendCheckpointFromStoryDebrief,
  appendCheckpointFromAdaptiveCouncil,
  reviewCheckpointAsChatGPT,
  buildAtomicDataCell,
} from './runtime/dimensional';
import { createDebrief } from './runtime/storyfactory';

const ledger = createAgentCheckpointLedger();
const cell = buildAtomicDataCell({
  cellId: 'cell-1',
  tenantId: 'xiv',
  body: { note: 'evidence' },
});

const entry = ledger.append({
  xivAgent: 'GROK',
  model: 'grok-bot',
  story: 'US-12D-11',
  environment: 'LOCAL',
  filesChanged: ['services/ai/runtime/dimensional/agent-checkpoint-ledger.ts'],
  testsPassed: ['12d11.test.ts'],
  testsFailed: [],
  databaseMigrations: [],
  atomicCellIds: [cell.cellId],
  confidence: 0.9,
});

// ChatGPT = read/review only
const review = reviewCheckpointAsChatGPT(ledger, entry.entryId);
// review.mayFlipAutonomousProduction === false
// review.mayBypassPolicyGate === false

const debrief = createDebrief({ /* ... */ });
appendCheckpointFromStoryDebrief(ledger, debrief, { model: 'chatgpt-review' });
```

Banned on the ledger instance: `rewrite`, `delete`, `bypassPolicyGate`, `flipAutonomousProduction`.

## Optional hooks

| Hook | Source | Role |
|------|--------|------|
| `appendCheckpointFromStoryDebrief` | Story Factory debrief | Append identity+audit row from `AgentDebrief` |
| `appendCheckpointFromAdaptiveCouncil` | Adaptive council learning | Append audit row after `learnFromDebriefs` |

Re-exported from `storyfactory/debrief.ts` and `storyfactory/adaptive-council.ts` for convenience. Hooks are **optional** — callers pass an explicit ledger; nothing auto-flips production.

## Deliverables

| Module | Role |
|--------|------|
| `dimensional/agent-checkpoint-ledger.ts` | Append-only ledger + ChatGPT review + hooks |
| `dimensional/12d11.test.ts` | Contract + Twin + Policy Gate tests |
| `dimensional/atomic-data-cell.ts` | `agentCheckpointLedgerWire: WIRED` |
| `storyfactory/debrief.ts` | Optional debrief hook re-export |
| `storyfactory/adaptive-council.ts` | Optional council hook re-export |
| `docs/operations/XIV_12D11_AGENT_CHECKPOINT_LEDGER.md` | This doc |

## Next safe task

**12D-12** — pick the next offline/local research slice that does **not** enable production auto, Policy Gate bypass, or a second control plane (e.g. ledger persistence fixture / Command Center consumer of checkpoint rows as read-only UX). Confirm with founder before starting.

## Tests

```bash
cd services/ai
npx tsx runtime/dimensional/12d11.test.ts
npx tsx runtime/dimensional/12d10.test.ts
npx tsx runtime/dimensional/12d09.test.ts
npx tsx runtime/storyfactory/12d06.test.ts
```

## Remotes

Push child branch to **origin (GitHub)** only. Do not force-push GitLab.
