# XIV 12D-13 — Atomic Data Cell offline snapshot READ path (Data City residual)

**Ticket:** 12D-13  
**Branch:** `grok/12d-13-adc-offline-read-path`  
**Worktree:** `C:\Users\Devin\xiv-ai-12d-13` (sibling; avoid US-ARCH product checkout)  
**Base:** tip of 12D-12 `990ff590` + 12D-11 polish seals (`destructiveDbAutoApply` / `L4_PRODUCTION_ENABLED` / `autonomousSecretCreation`)  
**State:** research / feature branch — LOCAL offline READ path only  
**L4 / production auto:** false

## Locked Data City contract

| Rule | Value |
|------|-------|
| Execution | **LOCAL / OFFLINE_PREFER_LOCAL only** (never CLOUD_SANDBOX / PRODUCTION) |
| Route | **device → local_shard** sparse stub (no regional/global fan-out) |
| Hydrate | **HOT** cell from **SQLITE** / **OBJECT_STORE** cache |
| Unbound | **WAITING_SYNC** honesty |
| DDL / DML / deploy | **forbidden** |
| liveCloudSyncClaimed | **false** |
| Accelerators | **UNVERIFIED** only (CPU may be VERIFIED; never fake GPU/NPU/QPU VERIFIED) |
| Policy Gate | aligned; bypass forbidden |

## Guardrail dump (assertable)

| Flag | Value |
|------|-------|
| readOnly | true |
| OFFLINE_PREFER_LOCAL | true |
| preferredExecution | LOCAL |
| cloudSandboxAllowed | false |
| productionAllowed | false |
| productionAutoApply / Merge / Deploy | false |
| autonomousProductionDDL / DML | false |
| destructiveDbAutoApply | false |
| L4_PRODUCTION_ENABLED | false |
| liveCloudSyncClaimed | false |
| policyGateBypassAllowed | false |
| noDdl / noDml / noDeploy | true |
| sparseRouteOnly | true |
| regionalGlobalFanOutAllowed | false |
| acceleratorVerifiedAllowed | false |
| hotHydrateBackends | SQLITE | OBJECT_STORE |
| routeTiersAllowed | device | local_shard |
| atomDbClaimAllowed | false |

## API sketch

```ts
import {
  AdcOfflineSnapshotCache,
  buildAndSeedHotAdc,
  readAtomicDataCellOffline,
  dumpAdcOfflineReadGuardrails,
  buildSparseDeviceToLocalShardRoute,
} from './runtime/dimensional';

const cache = new AdcOfflineSnapshotCache();
const { cell } = buildAndSeedHotAdc({
  cache,
  cellId: 'adc:hot-1',
  tenantId: 'xiv',
  deviceId: 'pocket-1',
  backend: 'SQLITE',
});

const miss = readAtomicDataCellOffline({
  cellId: 'adc:missing',
  deviceId: 'pocket-1',
  tenantId: 'xiv',
  cache,
}); // receipt.outcome === 'MISS', syncStatus === 'WAITING_SYNC'

const hit = readAtomicDataCellOffline({
  cellId: 'adc:hot-1',
  deviceId: 'pocket-1',
  tenantId: 'xiv',
  cache,
  unbound: false,
  expectedRemoteChecksum: cell.checksum,
}); // receipt.outcome === 'HIT', heat === 'hot'

dumpAdcOfflineReadGuardrails(); // evidence for Policy Gate
buildSparseDeviceToLocalShardRoute(); // device→local_shard only
```

Banned: `fanOutAdcOfflineRegionalGlobal`, `applyAdcOfflineProductionDdl`, `bypassPolicyGateViaAdcOfflineRead`.

## Deliverables

| Module | Role |
|--------|------|
| `adc-offline-read-path.ts` | Sparse route + HOT SQLITE/OBJECT_STORE cache + WAITING_SYNC read |
| `12d13.test.ts` | Contract tests (hit/miss receipts + guardrail dump) |
| `XIV_12D13_ADC_OFFLINE_READ_PATH.md` | This doc |
| ADC wire | `adcOfflineReadPathWire: 'WIRED'`, `ticketFollowUp: '12D-13'` |

## Evidence

- Tip SHA (after commit)
- `npx tsx runtime/dimensional/12d13.test.ts` (+ prior 12d09–12d12 green)
- Cache HIT / MISS receipts (`AdcOfflineCacheReceipt`)

## Tests

```bash
cd services/ai
npx tsx runtime/dimensional/12d13.test.ts
npx tsx runtime/dimensional/12d12.test.ts
npx tsx runtime/dimensional/12d11.test.ts
npx tsx runtime/dimensional/12d09.test.ts
```

## Remotes

Push child branch to **origin (GitHub)** only. Do not force-push GitLab. Do not touch `C:\Users\Devin\xiv-ai` US-ARCH product checkout.
