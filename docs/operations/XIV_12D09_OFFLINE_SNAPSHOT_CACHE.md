# XIV 12D-09 — Offline Command Center snapshot cache / sync-status

**Ticket:** 12D-09  
**Branch:** `grok/12d-09-offline-snapshot-cache`  
**Worktree:** `C:\Users\Devin\xiv-ai-12d` only  
**Base:** `grok/12d-08-arch-reader-consumer` @ `06562b1`  
**State:** research / feature branch — offline snapshot cache + sync-status honesty  
**L4 / production auto:** false

## Scope

1. Consume 12D-08 `mobileReady` / `buildArchitectureReaderConsumer` payloads
2. Offline snapshot cache (in-memory + optional disk fixture serialize/parse) with checksums + provenance
3. Sync-status honesty: **FRESH | STALE | WAITING_SYNC | CONFLICT** — never fabricate live cloud sync
4. Read-only; `productionAutoApply` false; Twin ethics; duty-cycle aware
5. **Atomic Data Cells** stub (`atomic-data-cell.ts`) — tiny addressable software knowledge records (NOT literal atom DBs)
6. Artifacts optional under `artifacts/12d09/`

## Guardrails

| Flag | Value |
|------|-------|
| readOnly | true |
| productionAutoApply | false |
| productionAutoMerge | false |
| productionAutoDeploy | false |
| destructiveDbAutoApply | false |
| L4_PRODUCTION_ENABLED | false |
| PRODUCTION_DIMENSIONAL_FABRIC_ENABLED | false |
| liveCloudSyncFabricationAllowed | false |
| checkpointIsReadReviewOnly | true |
| policyGateBypassAllowed | false |
| atomDbClaimAllowed | false |
| highAutonomyTargets | LOCAL \| CLOUD_SANDBOX only |
| quantumEntanglementIsSimulatedCorrelationOnly | true |
| bioCloningAllowed | false |
| FOUNDER_TWIN_REPLICA_HARD_CAP | 64 |
| FOUNDER_TWIN_MAX_DUTY_CYCLE | 0.25 |
| businessBarMetrics | adoption / reliability / security / unit_economics / customer_value |

Twin ethics gates (`assertEthicsSafeCopy`) still reject physical-portal / quantum-advantage / valuation-theater copy. Wormholes = sparse SIMULATION pathways only. Checkpoint = read/review only — never Policy Gate bypass.

## API sketch

```ts
import {
  buildArchitectureReaderConsumer,
  buildOfflineSnapshotFromConsumer,
  OfflineSnapshotCache,
  evaluateOfflineSyncStatus,
  serializeOfflineSnapshotFixture,
  buildAtomicDataCell,
} from './runtime/dimensional';

const bundle = buildArchitectureReaderConsumer({ architectureSummary, councilSummary, roster });
const snap = buildOfflineSnapshotFromConsumer(bundle, {
  snapshotId: 'snap-1',
  tenantId: 'xiv',
  // omit expectedRemoteChecksum → WAITING_SYNC honesty
});
const cache = new OfflineSnapshotCache();
cache.put(snap);
// disk fixture (caller writes): serializeOfflineSnapshotFixture(snap)
```

## Sync-status honesty

| Status | Meaning |
|--------|---------|
| WAITING_SYNC | No expected remote checksum / unbound cloud — do not pretend synced |
| CONFLICT | Local checksum ≠ expected remote — manual reconcile; no silent overwrite |
| STALE | Checksums match but age > freshness window |
| FRESH | Checksums match and within freshness window (local honesty only — not live cloud proof) |

`liveCloudSyncClaimed` is always `false` on offline snapshots.

## Atomic Data Cells (naming ALIGN)

Software contracts only: provenance, checksum, tenant, timestamp, confidence, optional vector, graph links, replication rules. **Not** literal atom / atomic-physics databases. Fuller Agent Identity + Checkpoint Ledger wiring → **12D-10** (`agentCheckpointLedgerWire: FOLLOW_UP`).

## Deliverables

| Module | Role |
|--------|------|
| `dimensional/offline-snapshot-cache.ts` | Snapshot build, sync-status, in-memory cache, fixture serialize/parse |
| `dimensional/atomic-data-cell.ts` | Atomic Data Cell stub contracts |
| `dimensional/12d09.test.ts` | Contract + Twin gate tests |
| `dimensional/generate-12d09-artifacts.ts` | Optional local fixture emitter |
| `artifacts/12d09/*` | Optional JSON fixture |
| `docs/operations/XIV_12D09_OFFLINE_SNAPSHOT_CACHE.md` | This doc |

## Next safe task

**12D-10 — Agent Identity + Checkpoint Ledger** (append-only identity+audit; NOT a second production control plane; never bypass Policy Gate; per-run metadata XIV-Agent/Model/Story/Environment/Files/Tests/Migrations/Evidence-Hash/Debrief-ID/Confidence).

## Tests

```bash
cd services/ai
npx tsx runtime/dimensional/12d09.test.ts
npx tsx runtime/dimensional/12d08.test.ts
npx tsx runtime/dimensional/12d07.test.ts
npx tsx runtime/storyfactory/12d06.test.ts
npx tsx runtime/dimensional/generate-12d09-artifacts.ts
```

## Remotes

Push child branch to **origin (GitHub)** only. Do not force-push GitLab.
