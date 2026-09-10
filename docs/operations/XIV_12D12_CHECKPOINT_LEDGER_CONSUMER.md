# XIV 12D-12 - Checkpoint Ledger Consumer (Command Center / offline)

**Ticket:** 12D-12  
**Branch:** `grok/12d-12-checkpoint-ledger-consumer`  
**Worktree:** `C:\Users\Devin\xiv-ai-12d-ledger`  
**Base:** `grok/12d-11-agent-checkpoint-ledger` @ `dca96ad`  
**State:** research / feature branch - read-only consumer  
**L4 / production auto:** false  
**Soft-confirm:** LOCAL / OFFLINE_PREFER_LOCAL (CLOUD_SANDBOX only if read-only + Policy Gate intact)

## Scope

1. **Read-only Command Center / offline consumer** of append-only Checkpoint Ledger rows from **12D-11**
2. **mobileReady** + offline snapshot-friendly views (**md / json / html** artifacts)
3. **Optional fixture persist** (serialize/parse) - still read-only relative to production (no DDL/DML/deploy)
4. **NEVER** production auto-apply/merge/deploy; **NEVER** Policy Gate bypass; **NEVER** a second control plane
5. **No** identity mutation, autonomy flips, or deploy authority
6. Twin claim bans assertable; Ledger remains **append-only audit**, not a control plane
7. Tests `12d12.test.ts` + prior green; docs this file

## Guardrails

| Flag | Value |
|------|-------|
| readOnly | true |
| OFFLINE_PREFER_LOCAL | true |
| preferredExecution | LOCAL |
| cloudSandboxAllowedIfReadOnlyAndGateIntact | true |
| identityMutationAllowed | false |
| autonomyFlipAllowed | false |
| deployAuthority | false |
| productionAutoApply / Merge / Deploy | false |
| autonomousProductionDDL / DML | false |
| policyGateBypassAllowed | false |
| secondControlPlane | false |
| ledgerIsAppendOnlyAuditNotControlPlane | true |
| noDdl / noDml / noDeploy | true |
| twinClaimBansAssertable | true |
| highAutonomyTargets | LOCAL \| CLOUD_SANDBOX only |
| atomDbClaimAllowed | false |
| VALUATION_THEATER_ALLOWED | false |

`PRODUCTION` on ledger `environment` remains an **audit label only** when projected into consumer rows.

## API sketch

```ts
import {
  createAgentCheckpointLedger,
  buildCheckpointLedgerConsumer,
  buildCheckpointLedgerOfflineSnapshot,
  serializeCheckpointLedgerFixture,
  parseCheckpointLedgerFixture,
} from './runtime/dimensional';

const ledger = createAgentCheckpointLedger();
ledger.append({
  xivAgent: 'GROK',
  model: 'grok-bot',
  story: 'US-12D-12',
  environment: 'LOCAL',
  testsPassed: ['12d12.test.ts'],
  confidence: 0.9,
});

const bundle = buildCheckpointLedgerConsumer(ledger);
// bundle.markdown / bundle.html / bundle.json — offline UX artifacts
// bundle.readOnly === true; bundle.OFFLINE_PREFER_LOCAL === true

const snap = buildCheckpointLedgerOfflineSnapshot(ledger, {
  snapshotId: 'snap-1',
  tenantId: 'xiv',
});
const fixture = serializeCheckpointLedgerFixture(snap); // caller may write to disk
const parsed = parseCheckpointLedgerFixture(fixture);
```

Banned: `mutateCheckpointIdentity`, `flipConsumerAutonomy`, `bypassPolicyGateViaConsumer`, `applyProductionFromConsumer`.

## Deliverables

| Module | Role |
|--------|------|
| `dimensional/checkpoint-ledger-consumer.ts` | Read-only CC / offline consumer + fixture |
| `dimensional/12d12.test.ts` | Soft-confirm + Twin + Gate asserts |
| `dimensional/atomic-data-cell.ts` | `checkpointLedgerConsumerWire: WIRED`, `ticketFollowUp: 12D-12` |
| `docs/operations/XIV_12D12_CHECKPOINT_LEDGER_CONSUMER.md` | This doc |

## Next safe task

**12D-13** - pick the next offline/local research slice that does **not** enable production auto, Policy Gate bypass, identity mutation, or a second control plane (e.g. Command Center UI wire of ledger consumer rows, or ledger fixture sync-status honesty). Confirm with founder before starting.

## Tests

```bash
cd services/ai
npx tsx runtime/dimensional/12d12.test.ts
npx tsx runtime/dimensional/12d11.test.ts
npx tsx runtime/dimensional/12d10.test.ts
npx tsx runtime/dimensional/12d09.test.ts
```

## Remotes

Push child branch to **origin (GitHub)** only. Do not force-push GitLab.
